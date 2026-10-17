import { NextResponse } from 'next/server'
import { query } from '../../../../../lib/database/client'

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!/^[a-f0-9]{64}$/.test(token)) return new NextResponse(null, { status: 404 })
  try {
    const result = await query<{ content_type: string; image_data: Buffer }>(
      `SELECT content_type,image_data FROM communication_email_images WHERE token=$1`, [token],
    )
    const image = result.rows[0]
    if (!image) return new NextResponse(null, { status: 404 })
    return new NextResponse(new Uint8Array(image.image_data), {
      headers: { 'Content-Type': image.content_type, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
    })
  } catch (error) {
    console.error('Could not load communication email image:', error)
    return new NextResponse(null, { status: 404 })
  }
}
