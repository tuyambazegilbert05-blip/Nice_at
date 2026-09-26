'use client'

import React, { ComponentProps, MouseEvent, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { gsap } from './index'
import { MOTION_DURATION, MOTION_EASE } from './config'

type MotionLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & { href: string }

/** Opt-in same-origin route link with a short, cancellable page-exit transition. */
export function MotionLink({ href, onClick, replace, scroll, ...props }: MotionLinkProps) {
  const router = useRouter()
  const pathname = usePathname()
  const timeline = useRef<gsap.core.Timeline | null>(null)
  const navigating = useRef(false)

  useEffect(() => {
    navigating.current = false
    timeline.current?.kill()
    timeline.current = null
  }, [pathname])

  useEffect(() => () => { timeline.current?.kill() }, [])

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    if ((props.target && props.target !== '_self') || props.download) return

    const destination = new URL(href, window.location.href)
    if (destination.origin !== window.location.origin) return
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
    const next = `${destination.pathname}${destination.search}${destination.hash}`
    if (current === next) return
    event.preventDefault()

    if (navigating.current) return
    navigating.current = true
    const navigate = () => replace ? router.replace(next, { scroll }) : router.push(next, { scroll })
    const page = document.querySelector<HTMLElement>('[data-page-transition]')
    if (!page || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigate()
      return
    }

    timeline.current = gsap.timeline({ onComplete: navigate })
      .to(page, { autoAlpha: 0, y: -5, duration: MOTION_DURATION.micro, ease: MOTION_EASE.exit })
  }

  return <Link href={href} onClick={handleClick} replace={replace} scroll={scroll} {...props} />
}
