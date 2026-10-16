import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import sharp from 'sharp'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

export const runtime = 'nodejs'

const QR_SIZE = 800
const LOGO_PLATE_SIZE = 176
const LOGO_SIZE = 124
let logoBufferPromise: Promise<Buffer> | undefined

function getLogoBuffer() {
  logoBufferPromise ??= readFile(resolve(process.cwd(), 'public/brand/logo.png'))
    .then((logo) => sharp(logo).resize(LOGO_SIZE, LOGO_SIZE, { fit: 'contain' }).png().toBuffer())
  return logoBufferPromise
}

export async function GET(request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params
  const targetUrl = new URL(`/form/${encodeURIComponent(token)}`, request.nextUrl.origin).toString()
  const qr = await QRCode.toBuffer(targetUrl, {
    type: 'png',
    width: QR_SIZE,
    margin: 2,
    color: { dark: '#0f172a', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  })
  const plateSvg = Buffer.from(`<svg width="${LOGO_PLATE_SIZE}" height="${LOGO_PLATE_SIZE}" viewBox="0 0 ${LOGO_PLATE_SIZE} ${LOGO_PLATE_SIZE}" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="172" height="172" rx="28" fill="#fff" stroke="#bfdbfe" stroke-width="4"/></svg>`)
  const plateOffset = Math.round((QR_SIZE - LOGO_PLATE_SIZE) / 2)
  const logoOffset = Math.round((QR_SIZE - LOGO_SIZE) / 2)
  const png = await sharp(qr)
    .composite([
      { input: plateSvg, left: plateOffset, top: plateOffset },
      { input: await getLogoBuffer(), left: logoOffset, top: logoOffset },
    ])
    .png()
    .toBuffer()
  const filename = 'nice-registration-qr.png'
  const disposition = request.nextUrl.searchParams.get('download') === '1' ? 'attachment' : 'inline'

  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `${disposition}; filename="${filename}"`,
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
