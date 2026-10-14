import { query } from '../database/client'
import { sendBrandedEmail } from '../email/brevo'
import type { CustomForm, CustomFormSubmission } from './form-service'
import { claimCustomFormEmailAttempt, finishCustomFormEmailAttempt } from './form-service'
import { DEFAULT_FORM_EMAIL_TEMPLATE, type FormEmailTemplate } from './email-template'

export async function getFormEmailTemplate(): Promise<FormEmailTemplate> {
  const result = await query<FormEmailTemplate>('SELECT subject,heading,body FROM custom_form_email_templates WHERE id=$1', ['default'])
  return result.rows[0] || DEFAULT_FORM_EMAIL_TEMPLATE
}

export async function saveFormEmailTemplate(template: FormEmailTemplate, userId: string): Promise<void> {
  await query(
    `INSERT INTO custom_form_email_templates(id,subject,heading,body,updated_by_id,updated_at)
     VALUES('default',$1,$2,$3,$4,now())
     ON CONFLICT(id) DO UPDATE SET subject=EXCLUDED.subject,heading=EXCLUDED.heading,body=EXCLUDED.body,
       updated_by_id=EXCLUDED.updated_by_id,updated_at=now()`,
    [template.subject, template.heading, template.body, userId],
  )
}

function fillTemplate(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{([a-zA-Z]+)\}\}/g, (placeholder, key: string) => values[key] ?? placeholder)
}

export async function sendFormConfirmation(form: CustomForm, submission: CustomFormSubmission): Promise<'ACCEPTED' | 'FAILED' | 'PENDING'> {
  const claim = await claimCustomFormEmailAttempt(submission.id)
  if ('status' in claim) return claim.status === 'ACCEPTED' ? 'ACCEPTED' : 'PENDING'

  try {
    const template = await getFormEmailTemplate()
    const firstName = submission.fullName.trim().split(/\s+/)[0] || submission.fullName
    const values = {
      fullName: submission.fullName,
      firstName,
      sessionTitle: form.title,
      sessionDate: new Intl.DateTimeFormat('en-RW', { dateStyle: 'long', timeZone: 'Africa/Kigali' }).format(new Date(`${form.eventDate}T12:00:00+02:00`)),
      sessionTime: `${form.startTime}–${form.endTime}`,
      sessionLocation: form.location,
    }
    const subject = fillTemplate(template.subject, values)
    const heading = fillTemplate(template.heading, values)
    const body = fillTemplate(template.body, values)
    const delivered = await sendBrandedEmail({
      to: submission.email,
      name: submission.fullName,
      subject,
      heading,
      paragraphs: body.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean),
      category: 'COMMUNICATION',
      brand: 'custom-form',
    })
    await finishCustomFormEmailAttempt({ attemptId: claim.attemptId, status: 'ACCEPTED', messageId: delivered.messageId })
    return 'ACCEPTED'
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : ''
    const safeError = errorMessage.includes('not configured') ? 'Email provider is not configured.' : 'The email provider rejected this message.'
    await finishCustomFormEmailAttempt({ attemptId: claim.attemptId, status: 'FAILED', error: safeError })
    return 'FAILED'
  }
}
