import * as THREE from 'three'

export function createEnergyParticle(color: THREE.ColorRepresentation, radius = 0.045) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radius, 8, 8),
    new THREE.MeshBasicMaterial({ color }),
  )
}

export function createNucleus(color = 0x0284c7) {
  const root = new THREE.Group()
  root.add(new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.24, 1),
    new THREE.MeshStandardMaterial({ color, roughness: 0.28, metalness: 0.22 }),
  ))
  root.add(new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0x34d399 }),
  ))
  return root
}
