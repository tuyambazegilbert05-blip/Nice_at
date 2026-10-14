import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { consumeCustomFormRateLimit, getCustomFormByToken, getLatestCustomFormEmailStatus, recordCustomFormSubmission } from '../../../../../../lib/forms/form-service'
import { sendFormConfirmation } from '../../../../../../lib/forms/email-service'

const submissionSchema = z.object({
  responses: z.record(z.string(), z.unknown()),
  idempotencyKey: z.string().uuid(),
}).strict()

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const raw = await request.text()
    if (raw.length > 64_000) return NextResponse.json({ success: false, error: 'This form response is too large.' }, { status: 413 })
    let payload: unknown
    try { payload = JSON.parse(raw) } catch { return NextResponse.json({ success: false, error: 'The form response was not valid JSON.' }, { status: 400 }) }
    const parsed = submissionSchema.safeParse(payload)
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Check the form responses.' }, { status: 400 })
    const { token } = await params
    const forwardedAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
    const clientHash = createHash('sha256').update(forwardedAddress).digest('hex')
    const attempts = await consumeCustomFormRateLimit(token, clientHash)
    if (attempts === null) return NextResponse.json({ success: false, error: 'This form is closed or unavailable.' }, { status: 404 })
    if (attempts > 10) return NextResponse.json({ success: false, error: 'Too many attempts. Wait a minute and try again.' }, { status: 429, headers: { 'Retry-After': '60' } })
    const result = await recordCustomFormSubmission(token, parsed.data.responses, parsed.data.idempotencyKey)
    const lastStatus = await getLatestCustomFormEmailStatus(result.submission.id)
    const form = await getCustomFormByToken(token)
    let emailStatus: 'ACCEPTED' | 'FAILED' | 'PENDING' = lastStatus === 'SENDING' ? 'PENDING' : lastStatus || 'PENDING'
    if (form && lastStatus !== 'ACCEPTED') emailStatus = await sendFormConfirmation(form, result.submission)
    return NextResponse.json({
      success: true,
      data: { submissionId: result.submission.id, fullName: result.submission.fullName, emailStatus },
    }, { status: result.created ? 201 : 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof Error && ['FORM_NOT_AVAILABLE', 'FORM_NOT_ACCEPTING', 'An attendance response already exists for this email address.'].includes(error.message)) {
      const unavailable = error.message === 'FORM_NOT_AVAILABLE'
      const notAccepting = error.message === 'FORM_NOT_ACCEPTING'
      const message = unavailable ? 'This form is closed or unavailable.' : notAccepting ? 'This form is not accepting responses at this time.' : error.message
      return NextResponse.json({ success: false, error: message }, { status: unavailable ? 404 : 409 })
    }
    if (error instanceof Error && ('issues' in error || error.message.endsWith('required.') || error.message.includes('valid') || error.message.includes('too '))) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    console.error('Could not save custom form response:', error)
    return NextResponse.json({ success: false, error: 'Could not save your response. Your local draft is still available.' }, { status: 500 })
  }
}
