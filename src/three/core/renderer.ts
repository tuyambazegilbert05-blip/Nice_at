import * as THREE from 'three'

export function createEnergyRenderer(host: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.setSize(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight), false)
  renderer.setClearColor(0x000000, 0)
  host.appendChild(renderer.domElement)
  return renderer
}
