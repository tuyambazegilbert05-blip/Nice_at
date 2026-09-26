'use client'

import { useGSAP } from '@gsap/react'
import { gsap, registerMotionPlugins } from './index'

registerMotionPlugins()
gsap.registerPlugin(useGSAP)

export { useGSAP }
