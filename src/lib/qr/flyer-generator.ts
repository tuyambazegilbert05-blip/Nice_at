/**
 * NiCE Club Rwanda — Branded Flyer Canvas Generator
 * Renders an ultra high-resolution, print-ready (1200x1650px) branded flyer
 * with the official NiCE Club logo, typography, session details, and QR code.
 */

export interface FlyerOptions {
  title: string
  date: string
  time: string
  location: string
  qrDataUrl: string
  logoUrl?: string
}

export async function generateFlyerBlob(options: FlyerOptions): Promise<Blob> {
  const {
    title,
    date,
    time,
    location,
    qrDataUrl,
    logoUrl = '/brand/logo.png',
  } = options

  const width = 1200
  const height = 1650
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Canvas 2D context not available')
  }

  // 1. Pure White / Warm White Background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  // 2. Subtle Scientific Grid
  ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)'
  ctx.lineWidth = 1.5
  const gridSize = 40
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  // 3. Top Decorative Energy Accent Bar
  const gradient = ctx.createLinearGradient(0, 0, width, 0)
  gradient.addColorStop(0, '#0284c7')    // NiCE Blue
  gradient.addColorStop(0.5, '#10b981')  // Clean Energy Emerald
  gradient.addColorStop(1, '#06b6d4')    // Scientific Cyan
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, 18)

  // 4. Subtle Outer Flyer Border
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 3
  ctx.strokeRect(30, 30, width - 60, height - 60)

  // 5. Load and Render NiCE Club Logo
  await new Promise<void>((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // Center logo: 150x150 at top
      const logoSize = 160
      const logoX = (width - logoSize) / 2
      const logoY = 70
      ctx.drawImage(img, logoX, logoY, logoSize, logoSize)
      resolve()
    }
    img.onerror = () => {
      // Fallback if logo fails to load
      resolve()
    }
    img.src = logoUrl
  })

  // 6. Organization Typography Header
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  // NiCE Club Rwanda pill badge
  const badgeText = 'NiCE CLUB RWANDA'
  ctx.font = 'bold 26px Inter, sans-serif'
  const textWidth = ctx.measureText(badgeText).width
  const badgeW = textWidth + 40
  const badgeH = 44
  const badgeX = (width - badgeW) / 2
  const badgeY = 245

  ctx.fillStyle = '#f0f7ff'
  ctx.beginPath()
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 22)
  ctx.fill()
  ctx.strokeStyle = '#bae6fd'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#0369a1'
  ctx.fillText(badgeText, width / 2, badgeY + 10)

  // Subtitle
  ctx.fillStyle = '#64748b'
  ctx.font = 'bold 18px Inter, sans-serif'
  ctx.fillText('NUCLEAR IS CLEAN ENERGY', width / 2, 302)

  // 7. "SCAN TO RECORD ATTENDANCE" Callout
  ctx.fillStyle = '#0284c7'
  ctx.font = 'bold 22px Inter, sans-serif'
  ctx.fillText('SCAN TO RECORD ATTENDANCE', width / 2, 350)

  // 8. Session Title (word-wrapped)
  ctx.fillStyle = '#0f172a'
  ctx.font = 'bold 44px Inter, sans-serif'
  const maxTitleWidth = width - 180
  const words = title.split(' ')
  let line = ''
  let currentY = 395
  const lineHeight = 54

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxTitleWidth && n > 0) {
      ctx.fillText(line.trim(), width / 2, currentY)
      line = words[n] + ' '
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line.trim(), width / 2, currentY)

  // 9. Session Metadata (Date, Time, Location)
  currentY += lineHeight + 10
  const metaText = `${date} • ${time} • ${location}`
  ctx.font = '500 22px Inter, sans-serif'
  ctx.fillStyle = '#334155'
  ctx.fillText(metaText, width / 2, currentY)

  // 10. QR Code Frame Container Card
  currentY += 45
  const qrFrameSize = 560
  const qrFrameX = (width - qrFrameSize) / 2
  const qrFrameY = currentY

  // Card Background with soft shadow
  ctx.save()
  ctx.shadowColor = 'rgba(15, 23, 42, 0.08)'
  ctx.shadowBlur = 25
  ctx.shadowOffsetY = 12
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.roundRect(qrFrameX, qrFrameY, qrFrameSize, qrFrameSize, 32)
  ctx.fill()
  ctx.restore()

  // Card Border
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(qrFrameX, qrFrameY, qrFrameSize, qrFrameSize, 32)
  ctx.stroke()

  // 11. Draw QR Image inside Frame
  await new Promise<void>((resolve) => {
    const qrImg = new Image()
    qrImg.onload = () => {
      const qrPadding = 30
      const qrDrawSize = qrFrameSize - qrPadding * 2
      ctx.drawImage(
        qrImg,
        qrFrameX + qrPadding,
        qrFrameY + qrPadding,
        qrDrawSize,
        qrDrawSize
      )
      resolve()
    }
    qrImg.onerror = () => resolve()
    qrImg.src = qrDataUrl
  })

  // 12. Instructions & Footnotes
  const instructionsY = qrFrameY + qrFrameSize + 35
  ctx.fillStyle = '#1e293b'
  ctx.font = '600 24px Inter, sans-serif'
  ctx.fillText('Point your phone camera to scan', width / 2, instructionsY)

  ctx.fillStyle = '#64748b'
  ctx.font = '500 20px Inter, sans-serif'
  ctx.fillText('No app installation required • Instant mobile check-in', width / 2, instructionsY + 34)

  // 13. Bottom Brand Credential
  ctx.fillStyle = '#94a3b8'
  ctx.font = '500 16px Inter, sans-serif'
  ctx.fillText('NiCE Club Rwanda Attendance Platform • Empowering clean energy leadership in Africa', width / 2, height - 70)

  // 14. Convert to Blob
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Canvas toBlob failed'))
    }, 'image/png')
  })
}

/**
 * Initiates browser download of the generated flyer.
 */
export async function downloadBrandedFlyer(options: FlyerOptions): Promise<void> {
  const blob = await generateFlyerBlob(options)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const cleanTitle = options.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  a.download = `nice-flyer-${cleanTitle || 'session'}.png`
  a.href = url
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
