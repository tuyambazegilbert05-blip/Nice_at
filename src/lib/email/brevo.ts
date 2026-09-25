import { randomUUID } from 'node:crypto'
import { query } from '../database/client'

export type EmailCategory = 'INVITATION' | 'ATTENDANCE_THANK_YOU' | 'COMMUNICATION'

export interface BrandedEmail {
  to: string
  name?: string
  subject: string
  heading: string
  paragraphs: string[]
  action?: { label: string; url: string }
  category: EmailCategory
  sentById?: string
  attendanceId?: string
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string)
}

export function renderBrandedEmail(email: Pick<BrandedEmail, 'heading' | 'paragraphs' | 'action'>): string {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  const paragraphs = email.paragraphs.map((text) => `<p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.7;white-space:pre-line">${escapeHtml(text)}</p>`).join('')
  const action = email.action
    ? `<p style="margin:28px 0"><a href="${escapeHtml(email.action.url)}" style="background:#0369a1;color:#fff;text-decoration:none;padding:13px 20px;border-radius:8px;font-weight:700;display:inline-block">${escapeHtml(email.action.label)}</a></p>`
    : ''
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:28px 12px"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden"><tr><td style="background:#f0f7ff;border-bottom:4px solid #059669;padding:22px 30px"><img src="${baseUrl}/brand/NiCE-Logo-Animated.gif" width="150" alt="NiCE Club Rwanda" style="display:block;width:150px;max-width:100%;height:auto"><p style="margin:10px 0 0;color:#0369a1;font-size:12px;font-weight:700;letter-spacing:1.4px">NUCLEAR IS CLEAN ENERGY</p></td></tr><tr><td style="padding:30px"><h1 style="margin:0 0 20px;color:#0f172a;font-size:24px;line-height:1.3">${escapeHtml(email.heading)}</h1>${paragraphs}${action}<p style="margin:24px 0 0;color:#334155;font-size:15px;line-height:1.7">Together, we can build a better-informed future for clean energy in Rwanda.</p></td></tr><tr><td style="padding:20px 30px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;line-height:1.6"><strong style="color:#334155">NiCE Club Rwanda</strong><br>Nuclear is Clean Energy · Education, dialogue, and clean energy awareness<br><span>This message was sent by the NiCE Club Rwanda platform.</span></td></tr></table></td></tr></table></body></html>`
}

export async function sendBrandedEmail(email: BrandedEmail): Promise<{ messageId: string }> {
  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.BREVO_SENDER_EMAIL
  const senderName = process.env.BREVO_SENDER_NAME || 'NiCE Club Rwanda'
  if (!apiKey || !senderEmail) throw new Error('Email delivery is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.')

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { accept: 'application/json', 'api-key': apiKey, 'content-type': 'application/json' },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: email.to.trim().toLowerCase(), ...(email.name ? { name: email.name } : {}) }],
      subject: email.subject,
      htmlContent: renderBrandedEmail(email),
      textContent: [email.heading, ...email.paragraphs, email.action ? `${email.action.label}: ${email.action.url}` : '', 'NiCE Club Rwanda — Nuclear is Clean Energy'].filter(Boolean).join('\n\n'),
      ...(process.env.BREVO_REPLY_TO ? { replyTo: { email: process.env.BREVO_REPLY_TO, name: senderName } } : {}),
      tags: [`nice-${email.category.toLowerCase()}`],
    }),
    cache: 'no-store',
  })

  const payload = await response.json().catch(() => ({})) as { messageId?: string; message?: string }
  if (!response.ok || !payload.messageId) throw new Error(payload.message || `Brevo rejected the email (${response.status}).`)
  return { messageId: payload.messageId }
}

export async function logEmailDelivery(email: BrandedEmail, status: 'SENT' | 'FAILED', messageId?: string): Promise<void> {
  await query(
    `INSERT INTO email_delivery_log(id,recipient_email,subject,category,status,provider_message_id,sent_by_id,attendance_id)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
    [`mail_${randomUUID()}`, email.to.trim().toLowerCase(), email.subject, email.category, status, messageId || null, email.sentById || null, email.attendanceId || null],
  )
}

export async function deliverBrandedEmail(email: BrandedEmail): Promise<{ sent: boolean; messageId?: string }> {
  try {
    const { messageId } = await sendBrandedEmail(email)
    await logEmailDelivery(email, 'SENT', messageId)
    return { sent: true, messageId }
  } catch (error) {
    try { await logEmailDelivery(email, 'FAILED') } catch (logError) { console.error('Could not write email delivery log:', logError) }
    console.error(`Brevo delivery failed for category ${email.category}:`, error)
    return { sent: false }
  }
}
