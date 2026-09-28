import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '../../../lib/auth'
import { hasPermission } from '../../../lib/permissions/rbac'
import { query } from '../../../lib/database/client'
import { deliverBrandedEmail } from '../../../lib/email/brevo'
import { recordActivity } from '../../../lib/activity/activity-service'

async function authorized() {
  const user = await getCurrentUser()
  return user && hasPermission(user.role, 'communications:send') ? user : null
}

export async function GET() {
  try {
    const user = await authorized()
    if (!user) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    const result = await query<{ email: string; name: string; category: 'Team' | 'Opted-in attendee' }>(
      `SELECT email,name,category FROM (
         SELECT lower(email) AS email,name,'Team'::text AS category FROM users WHERE is_active=true
         UNION
         SELECT email,name,category FROM (
           SELECT DISTINCT ON (lower(email)) lower(email) AS email,full_name AS name,
             'Opted-in attendee'::text AS category,email_updates_opt_in
           FROM attendance_records ORDER BY lower(email),submitted_at DESC
         ) latest_attendee WHERE email_updates_opt_in=true
       ) contacts ORDER BY category,name`,
    )
    return NextResponse.json({ success: true, data: result.rows })
  } catch (error) {
    console.error('Could not load communication recipients:', error)
    return NextResponse.json({ success: false, error: 'Could not load email recipients.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authorized()
    if (!user) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    const body = await request.json() as { recipients?: string[]; subject?: string; message?: string }
    const subject = body.subject?.trim() || ''
    const message = body.message?.trim() || ''
    const recipients = [...new Set((body.recipients || []).map((email) => email.trim().toLowerCase()))]
    if (!recipients.length || recipients.length > 100 || recipients.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || subject.length < 3 || subject.length > 180 || message.length < 2 || message.length > 6000) {
      return NextResponse.json({ success: false, error: 'Choose 1–100 valid recipients and provide a subject (3–180 characters) and message (2–6000 characters).' }, { status: 400 })
    }
    let sent = 0
    const failed: string[] = []
    for (const email of recipients) {
      const delivery = await deliverBrandedEmail({
        to: email, subject, heading: subject, paragraphs: message.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean), category: 'COMMUNICATION', sentById: user.id,
      })
      if (delivery.sent) sent += 1
      else failed.push(email)
    }
    await recordActivity({ actor: user, action: 'communication.sent', targetType: 'communication', targetLabel: subject,
      summary: `Sent “${subject}” to ${sent} recipient(s)${failed.length ? `; ${failed.length} failed` : ''}`,
      details: { subject, recipientCount: recipients.length, sentCount: sent, failedCount: failed.length } })
    return NextResponse.json({ success: failed.length === 0, sent, failed: failed.length, failedRecipients: failed, message: `${sent} of ${recipients.length} email(s) accepted by Brevo.` }, { status: failed.length ? 207 : 200 })
  } catch (error) {
    console.error('Could not send platform communication:', error)
    return NextResponse.json({ success: false, error: 'Could not send the selected emails.' }, { status: 500 })
  }
}
