/**
 * QR Code generation and export types for NiCE Club Rwanda.
 */

export interface QRCodeData {
  sessionId: string
  sessionTitle: string
  publicToken: string
  attendanceUrl: string
  qrCodeDataUrl: string
  svgString?: string
}

export type QRDownloadFormat = 'PNG' | 'SVG' | 'POSTER' | 'PRINT'

export interface QRPosterConfig {
  sessionTitle: string
  date: string
  time: string
  location: string
  attendanceUrl: string
  qrDataUrl: string
}
