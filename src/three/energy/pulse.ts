import * as THREE from 'three'
import { gsap } from '../../motion/gsap'

export function pulseObject(object: THREE.Object3D) {
  return gsap.to(object.scale, { x: 1.18, y: 1.18, z: 1.18, duration: 1.8, repeat: -1, yoyo: true, ease: 'sine.inOut' })
}
