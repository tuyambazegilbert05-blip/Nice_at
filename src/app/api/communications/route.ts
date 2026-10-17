import { randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '../../../lib/auth'
import { hasPermission } from '../../../lib/permissions/rbac'
import { query } from '../../../lib/database/client'
import { deliverBrandedEmail } from '../../../lib/email/brevo'
import { recordActivity } from '../../../lib/activity/activity-service'
import type { EmailAttachment } from '../../../lib/email/brevo'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_TOTAL_FILE_BYTES = 10 * 1024 * 1024
const MAX_FILES = 5
const ALLOWED_FILES: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/gif': ['.gif'], 'image/webp': ['.webp'],
  'application/pdf': ['.pdf'], 'text/plain': ['.txt'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
}

function fileSignatureMatches(type: string, bytes: Uint8Array): boolean {
  if (type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (type === 'image/png') return bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10'
  if (type === 'image/gif') return new TextDecoder().decode(bytes.slice(0, 6)).match(/^GIF8[79]a$/) !== null
  if (type === 'image/webp') return new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP'
  if (type === 'application/pdf') return new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-'
  if (type === 'text/plain') return !bytes.slice(0, 8192).includes(0)
  // Office Open XML formats are ZIP containers; validate their ZIP signature.
  return Object.hasOwn(ALLOWED_FILES, type) && bytes[0] === 0x50 && bytes[1] === 0x4b && [0x03, 0x05, 0x07].includes(bytes[2])
}

async function parseAttachments(formData: FormData) {
  const fileItems = formData.getAll('attachments').filter((item): item is File => item instanceof File && item.size > 0)
  if (fileItems.length > MAX_FILES) throw new Error(`Choose no more than ${MAX_FILES} files.`)
  let totalBytes = 0
  const attachments: EmailAttachment[] = []
  const images: Array<{ token: string; fileName: string; contentType: string; imageData: Buffer }> = []
  for (const file of fileItems) {
    const name = file.name.replace(/[\\/\x00-\x1f\x7f]/g, '_').trim().slice(0, 120)
    const type = file.type.toLowerCase()
    const extensions = ALLOWED_FILES[type]
    if (!extensions || !extensions.some((extension) => name.toLowerCase().endsWith(extension))) throw new Error(`“${name || 'File'}” has an unsupported type. Use JPEG, PNG, GIF, WebP, PDF, TXT, DOCX, PPTX, or XLSX.`)
    if (file.size > MAX_FILE_BYTES) throw new Error(`“${name}” is larger than the 5 MB per-file limit.`)
    totalBytes += file.size
    if (totalBytes > MAX_TOTAL_FILE_BYTES) throw new Error('Attachments must total no more than 10 MB.')
    const buffer = new Uint8Array(await file.arrayBuffer())
    if (!fileSignatureMatches(type, buffer)) throw new Error(`“${name}” does not match its declared file type.`)
    const content = Buffer.from(buffer).toString('base64')
    attachments.push({ name, content, contentType: type })
    if (type.startsWith('image/')) images.push({ token: randomBytes(32).toString('hex'), fileName: name, contentType: type, imageData: Buffer.from(buffer) })
  }
  return { attachments, images }
}

async function authorized() {
  const user = await getCurrentUser()
  return user && hasPermission(user.role, 'communications:send') ? user : null
}

export async function GET() {
  try {
    const user = await authorized()
    if (!user) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    const result = await query<{ email: string; name: string; category: 'Team' | 'Opted-in participant' }>(
      `WITH team_contacts AS (
         SELECT lower(BTRIM(email)) AS email,
           COALESCE(NULLIF(BTRIM(name), ''), lower(BTRIM(email))) AS name,
           'Team'::text AS category,
           0 AS source_priority,
           NULL::timestamptz AS submitted_at
         FROM users
         WHERE is_active=true AND BTRIM(email) <> ''
       ),
       latest_session_contacts AS (
         SELECT DISTINCT ON (lower(BTRIM(email)))
           lower(BTRIM(email)) AS email,
           COALESCE(NULLIF(BTRIM(full_name), ''), lower(BTRIM(email))) AS name,
           email_updates_opt_in,
           submitted_at
         FROM attendance_records
         WHERE BTRIM(email) <> ''
         ORDER BY lower(BTRIM(email)),submitted_at DESC
       ),
       form_opt_in_contacts AS (
         SELECT DISTINCT ON (lower(BTRIM(email)))
           lower(BTRIM(email)) AS email,
           COALESCE(NULLIF(BTRIM(full_name), ''), lower(BTRIM(email))) AS name,
           submitted_at
         FROM custom_form_submissions
         WHERE BTRIM(email) <> ''
           AND (
             responses->>'communications_consent'='true'
             OR responses->>'workshop_updates'='true'
             OR responses->>'outreach_updates'='true'
           )
         ORDER BY lower(BTRIM(email)),submitted_at DESC
       ),
       eligible_contacts AS (
         SELECT email,name,category,source_priority,submitted_at FROM team_contacts
         UNION ALL
         SELECT email,name,'Opted-in participant'::text AS category,1 AS source_priority,submitted_at
         FROM latest_session_contacts
         WHERE email_updates_opt_in=true
         UNION ALL
         SELECT email,name,'Opted-in participant'::text AS category,1 AS source_priority,submitted_at
         FROM form_opt_in_contacts
       ),
       deduplicated_contacts AS (
         SELECT DISTINCT ON (email) email,name,category
         FROM eligible_contacts
         ORDER BY email,source_priority,submitted_at DESC NULLS LAST
       )
       SELECT email,name,category
       FROM deduplicated_contacts
       ORDER BY CASE category WHEN 'Team' THEN 0 ELSE 1 END,name,email`,
    )
    return NextResponse.json({ success: true, data: result.rows }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch (error) {
    console.error('Could not load communication recipients:', error)
    return NextResponse.json({ success: false, error: 'Could not load email recipients.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authorized()
    if (!user) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    const formData = await request.formData()
    const subject = String(formData.get('subject') || '').trim()
    const message = String(formData.get('message') || '').trim()
    const rawRecipients = String(formData.get('recipients') || '[]')
    let recipientList: unknown
    try { recipientList = JSON.parse(rawRecipients) } catch { recipientList = null }
    if (!Array.isArray(recipientList) || recipientList.some((value) => typeof value !== 'string')) {
      return NextResponse.json({ success: false, error: 'Provide a valid recipient list.' }, { status: 400 })
    }
    const recipients = [...new Set(recipientList.map((email: string) => email.trim().toLowerCase()))]
    if (!recipients.length || recipients.length > 100 || recipients.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || subject.length < 3 || subject.length > 180 || message.length < 2 || message.length > 6000) {
      return NextResponse.json({ success: false, error: 'Choose 1–100 valid recipients and provide a subject (3–180 characters) and message (2–6000 characters).' }, { status: 400 })
    }
    const { attachments, images } = await parseAttachments(formData)
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL
    if (images.length && (!appUrl || !/^https:\/\//i.test(appUrl))) {
      return NextResponse.json({ success: false, error: 'Set NEXT_PUBLIC_SITE_URL to the public HTTPS address of this app to show images in email bodies.' }, { status: 503 })
    }
    const normalizedAppUrl = appUrl?.replace(/\/$/, '')
    const bodyImages = []
    for (const image of images) {
      await query(
        `INSERT INTO communication_email_images(token,file_name,content_type,image_data) VALUES($1,$2,$3,$4)`,
        [image.token, image.fileName, image.contentType, image.imageData],
      )
      bodyImages.push({ url: `${normalizedAppUrl}/api/communications/images/${image.token}`, alt: image.fileName })
    }
    let sent = 0
    const failed: string[] = []
    for (const email of recipients) {
      const delivery = await deliverBrandedEmail({
        to: email, subject, heading: subject, paragraphs: message.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean), category: 'COMMUNICATION', sentById: user.id, attachments, bodyImages,
      })
      if (delivery.sent) sent += 1
      else failed.push(email)
    }
    await recordActivity({ actor: user, action: 'communication.sent', targetType: 'communication', targetLabel: subject,
      summary: `Sent “${subject}” to ${sent} recipient(s)${failed.length ? `; ${failed.length} failed` : ''}`,
      details: { subject, recipientCount: recipients.length, sentCount: sent, failedCount: failed.length } })
    return NextResponse.json({ success: failed.length === 0, sent, failed: failed.length, failedRecipients: failed, message: `${sent} of ${recipients.length} email(s) accepted by Brevo.` }, { status: failed.length ? 207 : 200 })
  } catch (error) {
    if (error instanceof Error && /Choose no more than|unsupported type|larger than|Attachments must|does not match/.test(error.message)) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    console.error('Could not send platform communication:', error)
    return NextResponse.json({ success: false, error: 'Could not send the selected emails.' }, { status: 500 })
  }
}
