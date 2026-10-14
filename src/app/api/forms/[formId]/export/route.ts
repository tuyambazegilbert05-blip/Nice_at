import { NextResponse } from 'next/server'
import { getCurrentUser } from '../../../../../lib/auth'
import { hasPermission } from '../../../../../lib/permissions/rbac'
import { getCustomFormById, getCustomFormSubmissions } from '../../../../../lib/forms/form-service'

function csv(value: unknown): string {
  const text = Array.isArray(value) ? value.join('; ') : value === null || value === undefined ? '' : String(value)
  const safe = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safe.replaceAll('"', '""')}"`
}

export async function GET(_: Request, { params }: { params: Promise<{ formId: string }> }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
  if (!hasPermission(user.role, 'attendance:export')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  try {
    const { formId } = await params
    const [form, submissions] = await Promise.all([getCustomFormById(formId), getCustomFormSubmissions(formId)])
    if (!form) return NextResponse.json({ success: false, error: 'Form not found.' }, { status: 404 })
    const fieldMap = new Map<string, { id: string; version: number; label: string }>()
    const addField = (field: { id: string; label: string }, version: number) => {
      if (field.id !== 'full_name' && field.id !== 'email') fieldMap.set(`${version}:${field.id}`, { ...field, version })
    }
    if (!submissions.length && form.publishedConfig) {
      for (const field of form.publishedConfig.fields) addField(field, form.publishedConfig.version)
    }
    for (const submission of submissions) {
      for (const field of submission.formSnapshot.fields) addField(field, submission.formVersion)
    }
    const fields = [...fieldMap.values()]
    const rows = [
      ['Full Name', 'Email', 'Submitted At (UTC)', ...fields.map((field) => `${field.label} (form v${field.version})`)].map(csv).join(','),
      ...submissions.map((submission) => [
        submission.fullName, submission.email, submission.submittedAt,
        ...fields.map((field) => field.version === submission.formVersion ? submission.responses[field.id] : ''),
      ].map(csv).join(',')),
    ]
    const filename = `nice-form-${form.id.replace(/[^a-zA-Z0-9_-]/g, '-')}.csv`
    return new NextResponse(`\uFEFF${rows.join('\r\n')}`, {
      headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"` },
    })
  } catch (error) {
    console.error('Could not export custom form responses:', error)
    return NextResponse.json({ success: false, error: 'Could not export these responses.' }, { status: 500 })
  }
}
