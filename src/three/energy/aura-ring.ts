import * as THREE from 'three'

export function createAuraRing(radius: number, flatten: number, color: THREE.ColorRepresentation, opacity = 0.68) {
  const curve = new THREE.EllipseCurve(0, 0, radius, radius * flatten, 0, Math.PI * 2, false, 0)
  const points = curve.getPoints(96).map((point) => new THREE.Vector3(point.x, point.y, 0))
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  return { line: new THREE.LineLoop(geometry, material), points }
}
