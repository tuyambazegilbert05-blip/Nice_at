import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { getSessionByPublicToken, getSessionById } from '../../../lib/sessions/session-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const sessionId = searchParams.get('sessionId')
    const text = searchParams.get('text')

    let targetUrl = text

    if (!targetUrl && token) {
      const session = getSessionByPublicToken(token)
      if (session) {
        const origin = request.nextUrl.origin
        targetUrl = `${origin}/attend/${session.publicToken}`
      }
    } else if (!targetUrl && sessionId) {
      const session = getSessionById(sessionId)
      if (session) {
        const origin = request.nextUrl.origin
        targetUrl = `${origin}/attend/${session.publicToken}`
      }
    }

    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: 'Provide a valid token, sessionId, or text query parameter' },
        { status: 400 }
      )
    }

    const qrDataUrl = await QRCode.toDataURL(targetUrl, {
      width: 600,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })

    return NextResponse.json({
      success: true,
      qrDataUrl,
      targetUrl,
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
