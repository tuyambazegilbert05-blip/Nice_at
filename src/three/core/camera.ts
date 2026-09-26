import * as THREE from 'three'

export function createEnergyCamera(width: number, height: number) {
  const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 20)
  camera.position.z = 3.5
  return camera
}
