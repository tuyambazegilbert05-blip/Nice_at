import { NextResponse } from 'next/server'
import { getPublicCustomForm } from '../../../../../lib/forms/form-service'

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const form = await getPublicCustomForm(token)
    if (!form) return NextResponse.json({ success: false, error: 'This form is not available.' }, { status: 404 })
    return NextResponse.json({ success: true, data: form }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('Could not load published form:', error)
    return NextResponse.json({ success: false, error: 'Could not load this form.' }, { status: 500 })
  }
}
