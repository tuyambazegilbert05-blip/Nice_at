'use client'

import React, { use, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import QRCode from 'qrcode'
import {
  ArrowLeft,
  Download,
  Printer,
  Copy,
  ExternalLink,
  Check,
  MapPin,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent } from '../../../../../components/ui/Card'
import { Button } from '../../../../../components/ui/Button'
import { formatDate } from '../../../../../utils/date'
import { Session } from '../../../../../types/session'
import { downloadBrandedFlyer } from '../../../../../lib/qr/flyer-generator'
import { ROLE_PERMISSIONS } from '../../../../../lib/permissions/roles'
import type { UserRole } from '../../../../../types/user'
import { RestrictedActionButton } from '../../../../../components/ui/RestrictedAction'
import { SessionLoadingState } from '../../../../../components/sessions/SessionLoadingState'

export default function SessionQRPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const [session, setSession] = useState<Session | null>(null)
  const [loadError, setLoadError] = useState('')

  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [generatingFlyer, setGeneratingFlyer] = useState(false)
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null)
  const [accessChecked, setAccessChecked] = useState(false)
  const [accessError, setAccessError] = useState('')
  const posterRef = useRef<HTMLDivElement>(null)
  const permissions = currentRole ? ROLE_PERMISSIONS[currentRole] ?? [] : []
  const canGenerate = permissions.includes('qr:generate')

  useEffect(() => {
    fetch('/api/auth').then(async (response) => {
      const result = await response.json()
      if (!response.ok || !result.user?.role) throw new Error('Access denied: unable to verify QR generation permission.')
      setCurrentRole(result.user.role as UserRole)
    }).catch((error) => setAccessError(error instanceof Error ? error.message : 'Access denied: could not verify QR permissions.'))
      .finally(() => setAccessChecked(true))

    fetch(`/api/sessions/${encodeURIComponent(sessionId)}`).then(async (response) => {
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Unable to load session')
      setSession(result.data)
    }).catch((error) => setLoadError(error instanceof Error ? error.message : 'Unable to load session'))
  }, [sessionId])

  useEffect(() => {
    if (!session || !canGenerate) return
    const attendanceUrl = `${window.location.origin}/attend/${session.publicToken}`
    QRCode.toDataURL(attendanceUrl, {
      width: 520,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err))
  }, [session, canGenerate])

  if (!session) {
    if (loadError) return <p role="alert" className="p-6 text-sm text-rose-700">{loadError}</p>
    return <SessionLoadingState />
  }

  const attendanceUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/attend/${session.publicToken}`
    : `/attend/${session.publicToken}`

  const handleCopyLink = () => {
    if (!canGenerate) return
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(attendanceUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownloadFlyer = async () => {
    if (!canGenerate || !qrDataUrl) return
    setGeneratingFlyer(true)
    try {
      await downloadBrandedFlyer({
        title: session.title,
        date: formatDate(session.date),
        time: `${session.startTime} — ${session.endTime} CAT`,
        location: session.location,
        qrDataUrl,
        logoUrl: '/brand/logo.png',
      })
    } catch (err) {
      console.error('Failed to download flyer', err)
    } finally {
      setGeneratingFlyer(false)
    }
  }

  const handleDownloadQROnly = () => {
    if (!canGenerate || !qrDataUrl) return
    const link = document.createElement('a')
    link.download = `nice-qr-code-${session.publicToken}.png`
    link.href = qrDataUrl
    link.click()
  }

  const handlePrint = () => {
    if (!canGenerate) return
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between print-hide">
        <div className="flex items-center gap-3">
          <Link href={`/sessions/${session.id}`}>
            <button className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Attendance QR Display</h1>
            <p className="text-xs text-slate-500">Live dynamic flyer with animated brand logo for scanning.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {accessChecked && canGenerate ? <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            leftIcon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          >
            {copied ? 'Copied' : 'Copy Link'}
          </Button> : accessChecked ? <RestrictedActionButton message={accessError || `Access denied: your ${currentRole} role cannot generate or copy QR materials.`} variant="outline" size="sm" leftIcon={<Copy className="w-4 h-4" />}>Copy Link</RestrictedActionButton> : <Button disabled variant="outline" size="sm" leftIcon={<Copy className="w-4 h-4" />}>Copy Link</Button>}

          <a href={attendanceUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" leftIcon={<ExternalLink className="w-4 h-4" />}>
              Open Form
            </Button>
          </a>
        </div>
      </div>

      {/* Main Grid: Live Poster on Left, Actions on Right */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Printable Branded Poster */}
        <div className="md:col-span-2">
          <Card className="shadow-elevated border-slate-200 overflow-hidden bg-white print-flyer">
            <div
              ref={posterRef}
              className="p-8 sm:p-12 text-center space-y-6 flex flex-col items-center bg-scientific-grid"
            >
              {/* Organization Brand with Live Animated GIF */}
              <div className="flex flex-col items-center space-y-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/NiCE-Logo-Animated.gif"
                  alt="NiCE Club Rwanda Animated Logo"
                  className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-sm rounded-xl"
                />

                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-nice-blue-50 border border-nice-blue-200/80 text-nice-blue-800 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-nice-blue-600" />
                  <span>NiCE CLUB RWANDA</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Nuclear is Clean Energy
                </p>
              </div>

              {/* Title & Date */}
              <div className="space-y-2 max-w-md">
                <span className="text-xs font-bold text-nice-blue-600 uppercase tracking-widest">
                  Scan to Record Attendance
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  {session.title}
                </h2>
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-600 pt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-nice-blue-600" />
                    {formatDate(session.date)}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    {session.location}
                  </span>
                </div>
              </div>

              {/* High Contrast QR Frame */}
              <div className="p-4 rounded-2xl bg-white border-2 border-slate-900/10 shadow-lg relative group">
                {!canGenerate && accessChecked ? (
                  <div className="flex h-56 w-56 items-center justify-center px-5 text-center text-xs text-slate-400">QR preview unavailable.</div>
                ) : qrDataUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={qrDataUrl}
                    alt="NiCE Attendance QR Code"
                    className="w-56 h-56 sm:w-64 sm:h-64 rounded-lg object-contain"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                    Generating high-res QR code…
                  </div>
                )}
              </div>

              {/* Poster Footer Instructions */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-700">
                  Point your phone camera to scan • No application download needed
                </p>
                <p className="text-[10px] text-slate-400">
                  Powered by NiCE Club Rwanda Attendance Platform
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Controls Sidebar */}
        <div className="space-y-6 print-hide">
          <Card>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Distribution & Print</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Download or print branded graphics with the official NiCE logo and high-contrast QR code for projection displays, event roll-ups, or classroom desks.
              </p>

              <div className="space-y-2.5 pt-2">
                {accessChecked && canGenerate ? <Button
                  variant="primary"
                  size="md"
                  onClick={handleDownloadFlyer}
                  isLoading={generatingFlyer}
                  className="w-full justify-start text-xs sm:text-sm"
                  leftIcon={<Download className="w-4 h-4" />}
                >
                  Download Branded Flyer (PNG)
                </Button> : accessChecked ? <RestrictedActionButton message={accessError || `Access denied: your ${currentRole} role cannot download branded QR flyers.`} variant="primary" size="md" className="w-full justify-start text-xs sm:text-sm" leftIcon={<Download className="w-4 h-4" />}>Download Branded Flyer (PNG)</RestrictedActionButton> : <Button disabled variant="primary" size="md" className="w-full justify-start text-xs sm:text-sm" leftIcon={<Download className="w-4 h-4" />}>Download Branded Flyer (PNG)</Button>}

                {accessChecked && canGenerate ? <Button
                  variant="outline"
                  size="md"
                  onClick={handleDownloadQROnly}
                  className="w-full justify-start text-xs sm:text-sm"
                  leftIcon={<Download className="w-4 h-4 text-slate-500" />}
                >
                  Download QR Code Only
                </Button> : accessChecked ? <RestrictedActionButton message={accessError || `Access denied: your ${currentRole} role cannot download QR codes.`} variant="outline" size="md" className="w-full justify-start text-xs sm:text-sm" leftIcon={<Download className="w-4 h-4 text-slate-500" />}>Download QR Code Only</RestrictedActionButton> : <Button disabled variant="outline" size="md" className="w-full justify-start text-xs sm:text-sm" leftIcon={<Download className="w-4 h-4 text-slate-500" />}>Download QR Code Only</Button>}

                {accessChecked && canGenerate ? <Button
                  variant="outline"
                  size="md"
                  onClick={handlePrint}
                  className="w-full justify-start text-xs sm:text-sm"
                  leftIcon={<Printer className="w-4 h-4 text-slate-500" />}
                >
                  Print Branded Poster (A4)
                </Button> : accessChecked ? <RestrictedActionButton message={accessError || `Access denied: your ${currentRole} role cannot print QR materials.`} variant="outline" size="md" className="w-full justify-start text-xs sm:text-sm" leftIcon={<Printer className="w-4 h-4 text-slate-500" />}>Print Branded Poster (A4)</RestrictedActionButton> : <Button disabled variant="outline" size="md" className="w-full justify-start text-xs sm:text-sm" leftIcon={<Printer className="w-4 h-4 text-slate-500" />}>Print Branded Poster (A4)</Button>}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-nice-blue-50/40 border-nice-blue-100">
            <CardContent className="p-5 space-y-2 text-xs text-slate-600">
              <p className="font-bold text-nice-blue-900">Print & Projection Tips</p>
              <ul className="space-y-2 text-[11px] list-disc list-inside">
                <li>Click <strong>Download Branded Flyer</strong> to generate a print-ready 1200×1650 image with official NiCE branding.</li>
                <li>When projecting, keep screen brightness high for optimal smartphone camera recognition.</li>
                <li>QR uses high error-correction (Level H) for scanning even under adverse lighting.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
