'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Copy, Download, ExternalLink, FileImage, Printer, QrCode, Share2 } from 'lucide-react'
import type { CustomForm } from '../../lib/forms/form-service'
import { getResponseWindowState } from '../../lib/forms/response-window'
import { Button } from '../ui/Button'
import { Card, CardContent } from '../ui/Card'
import { CustomFormBrand } from './CustomFormBrand'

const emptySubscribe = () => () => undefined
const getBrowserOrigin = () => window.location.origin
const getServerOrigin = () => ''

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character]!)
}

function wrapText(value: string, maxLength: number, maxLines: number): string[] {
  const words = value.trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (candidate.length > maxLength && line) {
      lines.push(line)
      line = word
    } else line = candidate
  }
  if (line) lines.push(line)
  if (lines.length <= maxLines) return lines
  const clipped = lines.slice(0, maxLines)
  clipped[maxLines - 1] = `${clipped[maxLines - 1].slice(0, Math.max(1, maxLength - 1)).trimEnd()}…`
  return clipped
}

function dateLabel(value: string): string {
  const date = new Date(`${value.slice(0, 10)}T12:00:00+02:00`)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-RW', { dateStyle: 'long', timeZone: 'Africa/Kigali' }).format(date)
}

function textLines(value: string, x: number, y: number, maxLength: number, maxLines: number, fontSize: number, lineHeight: number): string {
  return wrapText(value, maxLength, maxLines).map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" font-size="${fontSize}" font-weight="700">${escapeXml(line)}</text>`).join('')
}

function makeFlyerSvg(form: CustomForm, publicUrl: string, qrDataUrl: string, logoDataUrl: string): string {
  const dateTime = `${dateLabel(form.eventDate)} · ${form.startTime}–${form.endTime} CAT`
  const urlLines = wrapText(publicUrl, 48, 2)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
<defs><linearGradient id="top" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eff6ff"/><stop offset="1" stop-color="#ecfdf5"/></linearGradient></defs>
<rect width="1080" height="1350" fill="#fff"/><path d="M0 0h1080v270H0z" fill="url(#top)"/><circle cx="1020" cy="42" r="150" fill="#dbeafe" opacity=".7"/><circle cx="1020" cy="42" r="92" fill="#bfdbfe" opacity=".65"/>
<image href="${logoDataUrl}" x="76" y="44" width="112" height="112" preserveAspectRatio="xMidYMid meet"/><text x="208" y="91" fill="#0f172a" font-family="Arial,sans-serif" font-size="30" font-weight="700">NiCE Club Rwanda</text><text x="208" y="124" fill="#475569" font-family="Arial,sans-serif" font-size="18">Nuclear is Clean Energy</text>
<rect x="80" y="195" width="310" height="42" rx="21" fill="#fff" stroke="#bfdbfe"/><text x="102" y="223" fill="#0369a1" font-family="Arial,sans-serif" font-size="17" font-weight="700" letter-spacing="1.3">EVENT REGISTRATION</text>
<g fill="#0f172a" font-family="Arial,sans-serif">${textLines(form.title, 80, 370, 29, 3, 58, 70)}</g>
<rect x="80" y="604" width="920" height="112" rx="20" fill="#f8fafc" stroke="#e2e8f0"/><circle cx="124" cy="658" r="19" fill="#e0f2fe"/><path d="M124 647v12l9 5" fill="none" stroke="#0369a1" stroke-width="3" stroke-linecap="round"/><text x="160" y="651" fill="#64748b" font-family="Arial,sans-serif" font-size="14" font-weight="700" letter-spacing="1">DATE &amp; TIME</text><text x="160" y="684" fill="#0f172a" font-family="Arial,sans-serif" font-size="23" font-weight="700">${escapeXml(dateTime)}</text>
<circle cx="124" cy="768" r="19" fill="#dcfce7"/><path d="M124 781s-10-11-10-18a10 10 0 1 1 20 0c0 7-10 18-10 18zm0-15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" fill="#059669"/><text x="160" y="760" fill="#64748b" font-family="Arial,sans-serif" font-size="14" font-weight="700" letter-spacing="1">LOCATION</text><g fill="#0f172a" font-family="Arial,sans-serif">${textLines(form.location, 160, 790, 54, 2, 22, 27)}</g>
<text x="80" y="916" fill="#0f172a" font-family="Arial,sans-serif" font-size="42" font-weight="700">Join us</text><text x="80" y="963" fill="#475569" font-family="Arial,sans-serif" font-size="22">Scan the code to view details and register.</text>
<rect x="666" y="824" width="334" height="334" rx="26" fill="#fff" stroke="#bfdbfe" stroke-width="3"/><image href="${qrDataUrl}" x="692" y="850" width="282" height="282"/>
${urlLines.map((line, index) => `<text x="80" y="${1035 + index * 30}" fill="#0369a1" font-family="Arial,sans-serif" font-size="16">${escapeXml(line)}</text>`).join('')}
<path d="M80 1190h920" stroke="#e2e8f0" stroke-width="2"/><text x="80" y="1240" fill="#64748b" font-family="Arial,sans-serif" font-size="19">Learn · connect · take part</text><text x="1000" y="1240" text-anchor="end" fill="#64748b" font-family="Arial,sans-serif" font-size="17">Nuclear is Clean Energy</text>
</svg>`
}

function makeSocialSvg(form: CustomForm, qrDataUrl: string, logoDataUrl: string): string {
  const dateTime = `${dateLabel(form.eventDate)} · ${form.startTime}–${form.endTime} CAT`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
<defs><linearGradient id="social" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eff6ff"/><stop offset="1" stop-color="#ecfdf5"/></linearGradient></defs>
<rect width="1080" height="1080" fill="#f8fafc"/><path d="M0 0h1080v245H0z" fill="url(#social)"/><circle cx="1000" cy="38" r="180" fill="#dbeafe" opacity=".68"/><image href="${logoDataUrl}" x="62" y="38" width="88" height="88" preserveAspectRatio="xMidYMid meet"/><text x="170" y="76" fill="#0f172a" font-family="Arial,sans-serif" font-size="26" font-weight="700">NiCE Club Rwanda</text><text x="170" y="107" fill="#475569" font-family="Arial,sans-serif" font-size="16">Nuclear is Clean Energy</text>
<rect x="64" y="164" width="248" height="38" rx="19" fill="#fff" stroke="#bfdbfe"/><text x="84" y="190" fill="#0369a1" font-family="Arial,sans-serif" font-size="15" font-weight="700" letter-spacing="1">YOU’RE INVITED</text>
<g fill="#0f172a" font-family="Arial,sans-serif">${textLines(form.title, 64, 326, 27, 2, 48, 59)}</g>
<text x="64" y="465" fill="#0369a1" font-family="Arial,sans-serif" font-size="20" font-weight="700">${escapeXml(dateTime)}</text><text x="64" y="510" fill="#475569" font-family="Arial,sans-serif" font-size="20">${escapeXml(wrapText(form.location, 38, 2).join(' · '))}</text>
<text x="64" y="646" fill="#0f172a" font-family="Arial,sans-serif" font-size="34" font-weight="700">Save your place</text><text x="64" y="689" fill="#475569" font-family="Arial,sans-serif" font-size="19">Scan the QR code to see details</text><text x="64" y="719" fill="#475569" font-family="Arial,sans-serif" font-size="19">and register for the event.</text>
<rect x="64" y="770" width="330" height="60" rx="15" fill="#0369a1"/><text x="229" y="808" text-anchor="middle" fill="#fff" font-family="Arial,sans-serif" font-size="19" font-weight="700" letter-spacing=".7">REGISTER NOW</text>
<rect x="674" y="566" width="330" height="330" rx="26" fill="#fff" stroke="#bfdbfe" stroke-width="3"/><image href="${qrDataUrl}" x="701" y="593" width="276" height="276"/>
<path d="M64 958h952" stroke="#e2e8f0" stroke-width="2"/><text x="64" y="1003" fill="#64748b" font-family="Arial,sans-serif" font-size="17">Learn · connect · take part</text><text x="1016" y="1003" text-anchor="end" fill="#64748b" font-family="Arial,sans-serif" font-size="16">Nuclear is Clean Energy</text></svg>`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read a sharing image.'))
    reader.onerror = () => reject(new Error('Could not read a sharing image.'))
    reader.readAsDataURL(blob)
  })
}

function svgToPng(svg: string, width: number, height: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
    const image = new window.Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      if (!context) {
        URL.revokeObjectURL(svgUrl)
        reject(new Error('This browser could not prepare the PNG download.'))
        return
      }
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.drawImage(image, 0, 0, width, height)
      URL.revokeObjectURL(svgUrl)
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('The PNG image could not be created.')), 'image/png')
    }
    image.onerror = () => {
      URL.revokeObjectURL(svgUrl)
      reject(new Error('The event artwork could not be rendered.'))
    }
    image.src = svgUrl
  })
}

export function CustomFormShareTools({ form, canExport, canClose }: { form: CustomForm; canExport: boolean; canClose: boolean }) {
  const router = useRouter()
  const origin = useSyncExternalStore(emptySubscribe, getBrowserOrigin, getServerOrigin)
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [flyerLogoDataUrl, setFlyerLogoDataUrl] = useState('')
  const [socialLogoDataUrl, setSocialLogoDataUrl] = useState('')
  const [qrError, setQrError] = useState('')
  const [actionError, setActionError] = useState('')
  const [downloading, setDownloading] = useState<'flyer' | 'social' | ''>('')
  const [status, setStatus] = useState(form.status)
  const shareable = !form.archivedAt && Boolean(form.publishedConfig)
  const responseState = getResponseWindowState({ ...form, status })
  const formPath = `/form/${encodeURIComponent(form.publicToken)}`
  const publicUrl = `${origin}${formPath}`
  const qrEndpoint = `/api/forms/public/${encodeURIComponent(form.publicToken)}/qr`
  const filename = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'nice-event'

  useEffect(() => {
    if (!shareable) return
    let active = true
    const readImage = async (path: string, mediaType: string, message: string) => {
      const response = await fetch(path, { cache: path.startsWith('/api/') ? 'no-store' : 'force-cache' })
      if (!response.ok || !response.headers.get('content-type')?.includes(mediaType)) throw new Error(message)
      return toDataUrl(await response.blob())
    }
    Promise.all([
      readImage(qrEndpoint, 'image/png', 'The QR image could not be generated. Try again in a moment.'),
      readImage('/brand/logo.png', 'image/png', 'The print logo could not be loaded.'),
      readImage('/brand/NiCE-Logo-Animated-transparent.webp', 'image/webp', 'The NiCE logo could not be loaded.'),
    ]).then(([qr, flyerLogo, socialLogo]) => {
      if (!active) return
      setQrDataUrl(qr)
      setFlyerLogoDataUrl(flyerLogo)
      setSocialLogoDataUrl(socialLogo)
    }).catch((cause) => { if (active) setQrError(cause instanceof Error ? cause.message : 'The sharing images could not be loaded.') })
    return () => { active = false }
  }, [qrEndpoint, shareable])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch { setActionError('Could not copy the link. Select it from the link field and copy it.') }
  }

  async function toggleForm() {
    const opening = responseState !== 'ACCEPTING'
    if (!opening && !window.confirm('Close this public form? Attendees will no longer be able to submit responses.')) return
    setActionError('')
    try {
      const response = await fetch(`/api/forms/${encodeURIComponent(form.id)}/${opening ? 'open' : 'close'}`, { method: 'POST' })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || `Could not ${opening ? 'open' : 'close'} this form.`)
      setStatus(opening ? 'PUBLISHED' : 'CLOSED')
      router.refresh()
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : `Could not ${opening ? 'open' : 'close'} this form.`) }
  }

  const flyerSvg = useMemo(() => qrDataUrl && flyerLogoDataUrl ? makeFlyerSvg(form, publicUrl, qrDataUrl, flyerLogoDataUrl) : '', [form, flyerLogoDataUrl, publicUrl, qrDataUrl])
  const socialSvg = useMemo(() => qrDataUrl && socialLogoDataUrl ? makeSocialSvg(form, qrDataUrl, socialLogoDataUrl) : '', [form, qrDataUrl, socialLogoDataUrl])

  async function downloadGraphic(type: 'flyer' | 'social') {
    const svg = type === 'flyer' ? flyerSvg : socialSvg
    if (!svg || downloading) return
    setDownloading(type)
    setActionError('')
    try {
      const blob = type === 'flyer' ? await svgToPng(svg, 2160, 2700) : await svgToPng(svg, 2160, 2160)
      downloadBlob(blob, `${filename}-${type === 'flyer' ? 'registration-flyer' : 'social-registration'}.png`)
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'The PNG download could not be prepared.')
    } finally {
      setDownloading('')
    }
  }

  return <div className="mx-auto max-w-5xl space-y-6">
    <Link href={`/forms/${encodeURIComponent(form.id)}`} className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:underline"><ArrowLeft className="h-4 w-4" />Back to attendees & analytics</Link>
    <header className="border-b border-slate-200 pb-5">
      <CustomFormBrand logoClassName="h-12 w-12" />
      <p className="text-xs font-semibold uppercase tracking-[.15em] text-sky-700">Custom Forms · Sharing</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Share & downloads</h1><p className="mt-1 text-sm text-slate-600">Publish and distribute {form.title} from this separate sharing workspace.</p></div><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${form.archivedAt ? 'border-slate-300 bg-slate-100 text-slate-700' : status === 'PUBLISHED' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : status === 'CLOSED' ? 'border-slate-200 bg-slate-100 text-slate-600' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{form.archivedAt ? 'Archived' : status === 'PUBLISHED' ? `Published · v${form.publishedVersion}` : status}</span></div>
      <p className="mt-2 text-xs text-slate-500">{dateLabel(form.eventDate)} · {form.startTime}–{form.endTime} CAT · {form.location}</p>
    </header>

    {!shareable ? <Card><CardContent className="space-y-3 p-5"><h2 className="font-semibold text-slate-900">{form.archivedAt ? 'This form is archived' : 'Publish before sharing'}</h2><p className="text-sm text-slate-600">{form.archivedAt ? 'Archived forms no longer expose their public link or QR code. Restore this form to share it again.' : 'Publish a validated form draft to create its public registration link, QR code, and download files.'}</p>{!form.archivedAt && <Link href={`/forms/${encodeURIComponent(form.id)}/edit#customize-form`}><Button>Open form builder</Button></Link>}</CardContent></Card> : <>
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]" aria-label="Public link and QR code">
        <Card><CardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Public form link</h2><p className="mt-1 text-xs text-slate-500">The link remains stable when a new form version is published.</p></div><span className="text-xs font-semibold text-emerald-700">Published v{form.publishedVersion}</span></div>
          <div className="flex flex-col gap-2 sm:flex-row"><input aria-label="Public form link" readOnly value={publicUrl} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700" /><Button variant="outline" onClick={() => void copyLink()} leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}>{copied ? 'Copied' : 'Copy link'}</Button><a href={publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><ExternalLink className="h-4 w-4" />Open</a></div>
          <div className="flex flex-wrap gap-2">{canClose && status !== 'DRAFT' && <Button variant="outline" size="sm" onClick={() => void toggleForm()}>{responseState === 'ACCEPTING' ? 'Close responses' : 'Open responses'}</Button>}{canExport && <a href={`/api/forms/${encodeURIComponent(form.id)}/export`} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Export responses</a>}</div>
        </CardContent></Card>
        <Card id="shareable-qr"><CardContent className="flex min-h-[290px] flex-col items-center p-5 text-center"><QrCode className="h-5 w-5 text-sky-700" /><h2 className="mt-2 font-semibold text-slate-900">Registration QR code</h2><p className="mt-1 text-xs text-slate-500">Scan with a phone to open the published form.</p>{qrError ? <p role="alert" className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-800">{qrError}</p> : <Image src={qrEndpoint} width={220} height={220} unoptimized alt={`QR code for ${form.title}`} className="mt-3 aspect-square w-52 rounded-lg border border-slate-200 bg-white p-2" />}</CardContent></Card>
      </section>

      <section aria-label="Download sharing materials" className="space-y-3"><div><h2 className="text-lg font-bold text-slate-900">Ready-to-share downloads</h2><p className="mt-1 text-sm text-slate-600">Choose the format that fits how you are inviting participants.</p></div>
        <div className="grid gap-3 md:grid-cols-3">
          <Card><CardContent className="flex h-full flex-col p-4"><QrCode className="h-5 w-5 text-sky-700" /><h3 className="mt-3 font-semibold text-slate-900">QR code image</h3><p className="mt-1 flex-1 text-xs leading-relaxed text-slate-600">High-resolution PNG for slides, printouts, and event signage.</p><a href={`${qrEndpoint}?download=1`} download className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-sky-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"><Download className="h-4 w-4" />Download PNG</a></CardContent></Card>
          <Card><CardContent className="flex h-full flex-col p-4"><FileImage className="h-5 w-5 text-sky-700" /><h3 className="mt-3 font-semibold text-slate-900">Registration flyer</h3><p className="mt-1 flex-1 text-xs leading-relaxed text-slate-600">A polished, print-ready 2160 × 2700 PNG poster with the NiCE print logo, event details, link, and QR code.</p><Button className="mt-4" disabled={!flyerSvg || Boolean(downloading)} isLoading={downloading === 'flyer'} onClick={() => void downloadGraphic('flyer')} leftIcon={<Download className="h-4 w-4" />}>Download flyer PNG</Button></CardContent></Card>
          <Card><CardContent className="flex h-full flex-col p-4"><Share2 className="h-5 w-5 text-sky-700" /><h3 className="mt-3 font-semibold text-slate-900">Social post graphic</h3><p className="mt-1 flex-1 text-xs leading-relaxed text-slate-600">A polished square 2160 × 2160 PNG with the NiCE logo, key event details, and scannable QR code.</p><Button className="mt-4" disabled={!socialSvg || Boolean(downloading)} isLoading={downloading === 'social'} onClick={() => void downloadGraphic('social')} leftIcon={<Download className="h-4 w-4" />}>Download social PNG</Button></CardContent></Card>
        </div>
        {actionError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{actionError}</p>}
        <p className="flex items-start gap-2 rounded-lg border border-sky-100 bg-sky-50 p-3 text-xs leading-relaxed text-sky-900"><Printer className="mt-0.5 h-4 w-4 shrink-0" />The flyer and social artwork download as self-contained, high-resolution PNG files. The print flyer uses the static NiCE print mark for reliable print output.</p>
      </section>
    </>}
  </div>
}
