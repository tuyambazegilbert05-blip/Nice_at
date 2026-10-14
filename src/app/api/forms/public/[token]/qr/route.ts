import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { getPublicCustomForm } from '../../../../../../lib/forms/form-service'

export const runtime = 'nodejs'

function safeFileName(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'nice-event'
}

export async function GET(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params
  const form = await getPublicCustomForm(token)
  if (!form) return NextResponse.json({ success: false, error: 'Published form not found.' }, { status: 404 })

  const targetUrl = new URL(`/form/${encodeURIComponent(token)}`, request.nextUrl.origin).toString()
  const png = await QRCode.toBuffer(targetUrl, {
    type: 'png',
    width: 800,
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  })
  const filename = `${safeFileName(form.title)}-registration-qr.png`
  const disposition = request.nextUrl.searchParams.get('download') === '1' ? 'attachment' : 'inline'

  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `${disposition}; filename="${filename}"`,
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
