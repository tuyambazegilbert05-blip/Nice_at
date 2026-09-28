'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { CircleHelp } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { driver, type DriveStep, type Driver } from 'driver.js'
import { gsap, registerMotionPlugins } from '../../motion/gsap'
import { ONBOARDING_TOUR_STEPS } from '../../lib/onboarding/tour-steps'

interface OnboardingStatus {
  hasCompletedOnboarding: boolean
  onboardingOutcome: 'not_started' | 'skipped' | 'completed'
  canCreateSession: boolean
  canViewSessions: boolean
  canViewAttendance: boolean
  canUseCommunications: boolean
  canManageSettings: boolean
}

const TOUR_PROGRESS_KEY = 'nice-platform-tour-progress-v1'
const TOUR_PROGRESS_MAX_AGE = 30 * 60 * 1000

type TourProgress = { stepId: string; savedAt: number }

function readTourProgress(): TourProgress | null {
  try {
    const value = sessionStorage.getItem(TOUR_PROGRESS_KEY)
    if (!value) return null
    const progress = JSON.parse(value) as TourProgress
    if (typeof progress.stepId !== 'string' || Date.now() - progress.savedAt > TOUR_PROGRESS_MAX_AGE) {
      sessionStorage.removeItem(TOUR_PROGRESS_KEY)
      return null
    }
    return progress
  } catch {
    return null
  }
}

function saveTourProgress(stepId: string) {
  try {
    sessionStorage.setItem(TOUR_PROGRESS_KEY, JSON.stringify({ stepId, savedAt: Date.now() } satisfies TourProgress))
  } catch {
    // Tour navigation still works if the browser blocks session storage.
  }
}

function clearTourProgress() {
  try { sessionStorage.removeItem(TOUR_PROGRESS_KEY) } catch { /* Storage may be unavailable. */ }
}

type GuideReaction = 'wave' | 'point' | 'celebrate'

function createGuide(reaction: GuideReaction) {
  const guide = document.createElement('div')
  guide.className = `nice-onboarding-guide nice-onboarding-guide--${reaction}`
  guide.setAttribute('aria-hidden', 'true')
  guide.innerHTML = `
    <svg viewBox="0 0 96 96" focusable="false">
      <circle class="nice-guide-orbit" cx="48" cy="48" r="44" />
      <path class="nice-guide-spark" d="m14 27 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5Zm68 27 1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5 1.5-4Z" />
      <g class="nice-guide-character">
        <path class="nice-guide-arm nice-guide-arm--left" d="M30 57 17 47l-4 3 11 16" />
        <path class="nice-guide-arm nice-guide-arm--right" d="m66 57 13-10 4 3-11 16" />
        <path d="M35 70h26l4 11H31l4-11Z" fill="#bae6fd" stroke="#0284c7" stroke-width="2.5" stroke-linejoin="round" />
        <rect x="27" y="27" width="42" height="48" rx="19" fill="#e0f2fe" stroke="#0284c7" stroke-width="3" />
        <ellipse cx="39" cy="46" rx="5" ry="6" fill="#fff" stroke="#0284c7" stroke-width="1.5" />
        <ellipse cx="57" cy="46" rx="5" ry="6" fill="#fff" stroke="#0284c7" stroke-width="1.5" />
        <circle cx="40" cy="47" r="2.5" fill="#0f172a" />
        <circle cx="56" cy="47" r="2.5" fill="#0f172a" />
        <path d="M40 58c4 10 12 10 16 0-5 4-11 4-16 0Z" fill="#059669" stroke="#0284c7" stroke-width="1.5" stroke-linejoin="round" />
        <path d="M48 65c2-3 5-2 4 1-1 2-4 2-4 2s-3 0-4-2c-1-3 2-4 4-1Z" fill="#fb7185" />
        <circle cx="34" cy="57" r="3" fill="#fda4af" opacity=".8" />
        <circle cx="62" cy="57" r="3" fill="#fda4af" opacity=".8" />
        <path d="M42 27v-7h12v7" fill="none" stroke="#0284c7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        <circle cx="48" cy="16" r="5" fill="#fbbf24" stroke="#0284c7" stroke-width="2" />
      </g>
    </svg>`
  return guide
}

function animateGuide(guide: HTMLElement, reaction: GuideReaction) {
  registerMotionPlugins()
  return gsap.context(() => {
    const character = guide.querySelector('.nice-guide-character')
    const rightArm = guide.querySelector('.nice-guide-arm--right')
    const leftArm = guide.querySelector('.nice-guide-arm--left')
    const spark = guide.querySelector('.nice-guide-spark')
    const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } })

    if (reaction === 'wave') {
      timeline.to(character, { y: -3, rotation: 4, transformOrigin: '50% 80%', duration: 0.2 })
        .to(rightArm, { rotation: -54, transformOrigin: '15% 90%', duration: 0.16, repeat: 2, yoyo: true, ease: 'sine.inOut' }, '<')
        .to(character, { y: 0, rotation: 0, duration: 0.2 }, '-=0.12')
    } else if (reaction === 'point') {
      timeline.to(character, { y: -2, rotation: -3, transformOrigin: '50% 80%', duration: 0.2 })
        .to(rightArm, { rotation: -48, transformOrigin: '15% 90%', duration: 0.18 }, '<')
        .to(rightArm, { rotation: 0, duration: 0.18, ease: 'back.out(2)' })
        .to(character, { y: 0, rotation: 0, duration: 0.18 }, '<')
    } else {
      timeline.to(character, { y: -7, rotation: 7, transformOrigin: '50% 80%', duration: 0.2, repeat: 1, yoyo: true, ease: 'power1.inOut' })
        .to([leftArm, rightArm], { rotation: (index) => index === 0 ? 42 : -42, transformOrigin: '50% 90%', duration: 0.22, yoyo: true, repeat: 1 }, '<')
        .to(spark, { scale: 1.28, transformOrigin: '50% 50%', duration: 0.18, yoyo: true, repeat: 1 }, '<')
    }
  }, guide)
}

export function OnboardingTour() {
  const pathname = usePathname()
  const router = useRouter()
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [manualRequested, setManualRequested] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const driverRef = useRef<Driver | null>(null)
  const guideAnimationRef = useRef<{ revert: () => void } | null>(null)
  const handoffRef = useRef(false)
  const pendingOutcomeRef = useRef<'skipped' | 'completed' | null>(null)
  const keyboardHandlerRef = useRef<((event: KeyboardEvent) => void) | null>(null)
  const autoStarted = useRef(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/onboarding', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to check onboarding status')
        return response.json() as Promise<OnboardingStatus>
      })
      .then((result) => { if (!cancelled) setStatus(result) })
      .catch(() => {
        if (!cancelled) setStatus({ hasCompletedOnboarding: true, onboardingOutcome: 'completed', canCreateSession: false, canViewSessions: false, canViewAttendance: false, canUseCommunications: false, canManageSettings: false })
      })
    return () => { cancelled = true }
  }, [])

  const availableSteps = useCallback(() => ONBOARDING_TOUR_STEPS.filter((step) => {
    if (step.requiredPermission === 'session:view') return status?.canViewSessions
    if (step.requiredPermission === 'attendance:view') return status?.canViewAttendance
    if (step.requiredPermission === 'communications:send') return status?.canUseCommunications
    if (step.requiredPermission === 'settings:manage') return status?.canManageSettings
    return true
  }).map((step) => step.id === 'sessions' && !status?.canCreateSession
    ? { ...step, description: step.descriptionWithoutPermission ?? step.description }
    : step), [status?.canCreateSession, status?.canManageSettings, status?.canUseCommunications, status?.canViewAttendance, status?.canViewSessions])

  const launch = useCallback((startIndex: number) => {
    if (driverRef.current?.isActive() || document.querySelector('[aria-busy="true"]') || document.querySelector('[role="dialog"][aria-modal="true"]')) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const definitions = availableSteps()
    const step = definitions[startIndex]
    if (!step) return

    const goToStep = (nextIndex: number, tour: Driver) => {
      if (nextIndex >= definitions.length) {
        clearTourProgress()
        if (!reduceMotion) {
          void import('canvas-confetti').then(({ default: confetti }) => {
            confetti({ particleCount: 48, spread: 52, startVelocity: 28, origin: { y: 0.7 }, colors: ['#0284c7', '#059669', '#f59e0b'], disableForReducedMotion: true })
          }).catch(() => undefined)
        }
        pendingOutcomeRef.current = 'completed'
        tour.destroy()
        return
      }

      const nextStep = definitions[nextIndex]
      if (!nextStep) return
      saveTourProgress(nextStep.id)
      handoffRef.current = true
      tour.destroy()
      router.push(nextStep.route)
    }

    const driverStep: DriveStep = {
      element: step.target,
      waitForElement: 10_000,
      skipMissingElement: false,
      onHighlighted: () => setAnnouncement(`Step ${startIndex + 1} of ${definitions.length}. ${step.title}. ${step.description}`),
      popover: {
        title: step.title,
        description: step.description,
        showProgress: true,
        progressText: `Step ${startIndex + 1} of ${definitions.length}`,
        side: 'bottom',
        align: 'start',
        showButtons: startIndex === 0 ? ['next'] : ['previous', 'next'],
        disableButtons: [],
        prevBtnText: 'Back',
        nextBtnText: startIndex === definitions.length - 1 ? 'Finish' : 'Next',
        onNextClick: (_element, _step, options) => goToStep(startIndex + 1, options.driver),
        onPrevClick: (_element, _step, options) => goToStep(startIndex - 1, options.driver),
      },
    }

    let tour: Driver
    tour = driver({
      steps: [driverStep],
      animate: !reduceMotion,
      duration: reduceMotion ? 0 : 180,
      smoothScroll: !reduceMotion,
      allowKeyboardControl: true,
      allowClose: true,
      allowScroll: true,
      showButtons: [],
      overlayColor: '#0f172a',
      overlayOpacity: 0.34,
      stagePadding: 8,
      stageRadius: 12,
      popoverClass: 'nice-onboarding-popover',
      onPopoverRender: (popover) => {
        guideAnimationRef.current?.revert()
        const reaction: GuideReaction = startIndex === definitions.length - 1 ? 'celebrate' : startIndex === 0 ? 'wave' : 'point'
        const guide = createGuide(reaction)
        popover.wrapper.prepend(guide)
        if (!reduceMotion) guideAnimationRef.current = animateGuide(guide, reaction)

        if (!reduceMotion) {
          const arrowClass = popover.arrow.className
          if (arrowClass.includes('side-top')) popover.wrapper.classList.add('nice-tour-enter-from-top')
          else if (arrowClass.includes('side-bottom')) popover.wrapper.classList.add('nice-tour-enter-from-bottom')
          else if (arrowClass.includes('side-left')) popover.wrapper.classList.add('nice-tour-enter-from-left')
          else if (arrowClass.includes('side-right')) popover.wrapper.classList.add('nice-tour-enter-from-right')
        }

        const skipButton = document.createElement('button')
        skipButton.type = 'button'
        skipButton.className = 'driver-popover-footer-btn nice-onboarding-skip'
        skipButton.textContent = 'Skip tour'
        skipButton.setAttribute('aria-label', 'Skip tour and remember this choice')
        skipButton.addEventListener('click', () => {
          clearTourProgress()
          pendingOutcomeRef.current = 'skipped'
          tour.destroy()
        }, { once: true })
        popover.footerButtons.prepend(skipButton)

        const keyboardHandler = (event: KeyboardEvent) => {
          const target = event.target
          const isInteractive = target instanceof HTMLElement && Boolean(target.closest('button, a, input, textarea, select'))
          if (event.key === 'ArrowRight' || (event.key === 'Enter' && !isInteractive)) {
            event.preventDefault()
            event.stopImmediatePropagation()
            goToStep(startIndex + 1, tour)
          } else if (event.key === 'ArrowLeft') {
            event.preventDefault()
            event.stopImmediatePropagation()
            goToStep(startIndex - 1, tour)
          }
        }
        keyboardHandlerRef.current = keyboardHandler
        document.addEventListener('keydown', keyboardHandler, true)
      },
      onDestroyed: () => {
        if (keyboardHandlerRef.current) {
          document.removeEventListener('keydown', keyboardHandlerRef.current, true)
          keyboardHandlerRef.current = null
        }
        guideAnimationRef.current?.revert()
        guideAnimationRef.current = null
        driverRef.current = null
        setAnnouncement('')
        if (handoffRef.current) {
          handoffRef.current = false
          return
        }
        clearTourProgress()
        if (status?.hasCompletedOnboarding) return
        const outcome = pendingOutcomeRef.current ?? 'skipped'
        pendingOutcomeRef.current = null
        void fetch('/api/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outcome }),
          keepalive: true,
        }).then((response) => {
          if (!response.ok) return
          setStatus((current) => current ? { ...current, hasCompletedOnboarding: true, onboardingOutcome: outcome } : current)
          window.dispatchEvent(new Event('nice:onboarding-outcome-saved'))
        }).catch(() => undefined)
      },
    })

    driverRef.current = tour
    tour.drive()
  }, [availableSteps, router, status?.hasCompletedOnboarding])

  useEffect(() => {
    if (!status) return

    const definitions = availableSteps()
    if (!definitions.length) return
    const savedProgress = readTourProgress()
    const shouldAutoStart = pathname === '/dashboard' && !status.hasCompletedOnboarding && !autoStarted.current
    if (!manualRequested && !savedProgress && !shouldAutoStart) return
    const requestedStepId = savedProgress?.stepId ?? definitions[0].id
    const startIndex = definitions.findIndex((step) => step.id === requestedStepId)
    if (startIndex < 0) {
      clearTourProgress()
      return
    }
    const startStep = definitions[startIndex]
    if (pathname !== startStep.route) {
      router.push(startStep.route)
      return
    }

    let disposed = false
    let waitingObserver: MutationObserver | null = null
    const stopWaiting = () => {
      waitingObserver?.disconnect()
      window.removeEventListener('load', maybeStart)
      document.removeEventListener('readystatechange', maybeStart)
    }
    const maybeStart = () => {
      if (disposed || document.readyState !== 'complete') return
      if (document.querySelector('[aria-busy="true"]')) return
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return
      if (!document.querySelector(`${startStep.target}[data-tour-ready="true"]`)) return

      // Stop observing before Driver mutates the target. Otherwise its spotlight
      // attribute changes can restart this same step while a route handoff begins.
      disposed = true
      stopWaiting()
      if (shouldAutoStart) autoStarted.current = true
      if (manualRequested) setManualRequested(false)
      if (!savedProgress) saveTourProgress(startStep.id)
      launch(startIndex)
    }

    waitingObserver = new MutationObserver(maybeStart)
    waitingObserver.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['aria-busy', 'aria-modal', 'data-tour', 'data-tour-ready', 'hidden'],
    })
    window.addEventListener('load', maybeStart)
    document.addEventListener('readystatechange', maybeStart)
    maybeStart()

    return () => { disposed = true; stopWaiting() }
  }, [availableSteps, launch, manualRequested, pathname, router, status])

  const replayTour = useCallback(() => {
    const firstStep = availableSteps()[0]
    if (!firstStep) return
    saveTourProgress(firstStep.id)
    setManualRequested(true)
    if (pathname !== firstStep.route) router.push(firstStep.route)
  }, [availableSteps, pathname, router])

  useEffect(() => {
    const handleReplay = () => replayTour()
    window.addEventListener('nice:onboarding-replay', handleReplay)
    return () => window.removeEventListener('nice:onboarding-replay', handleReplay)
  }, [replayTour])

  return (
    <>
      {status && !status.hasCompletedOnboarding && <button
        type="button"
        onClick={replayTour}
        aria-label="Take a tour of the full platform"
        title="Take a tour"
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:border-nice-blue-200 hover:bg-nice-blue-50 hover:text-nice-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nice-blue-500 sm:px-3"
      >
        <CircleHelp aria-hidden="true" className="h-4 w-4" />
        <span className="hidden sm:inline">Take a tour</span>
      </button>}
      <span className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</span>
    </>
  )
}

export function SettingsTourReplayButton() {
  const [isAvailable, setIsAvailable] = useState(false)

  useEffect(() => {
    let cancelled = false
    const handleSavedOutcome = () => setIsAvailable(true)
    window.addEventListener('nice:onboarding-outcome-saved', handleSavedOutcome)
    fetch('/api/onboarding', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<OnboardingStatus> : null)
      .then((result) => { if (!cancelled && result?.hasCompletedOnboarding) setIsAvailable(true) })
      .catch(() => undefined)
    return () => {
      cancelled = true
      window.removeEventListener('nice:onboarding-outcome-saved', handleSavedOutcome)
    }
  }, [])

  if (!isAvailable) return null

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('nice:onboarding-replay'))}
      aria-label="Take a tour of the full platform again"
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-nice-blue-200 bg-nice-blue-50 px-3 text-xs font-semibold text-nice-blue-700 transition-colors hover:bg-nice-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nice-blue-500"
    >
      <CircleHelp aria-hidden="true" className="h-4 w-4" />
      <span>Take a tour</span>
    </button>
  )
}
