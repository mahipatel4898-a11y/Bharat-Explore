import { useEffect, useRef } from 'react'
import {
  AmbientLight,
  BoxGeometry,
  Clock,
  ConeGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  TorusGeometry,
  WebGLRenderer,
} from 'three'

export default function HeroScene() {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined

    const scene = new Scene()
    const camera = new PerspectiveCamera(38, mount.clientWidth / mount.clientHeight, 0.1, 100)
    camera.position.set(0, 0.6, 7)

    const renderer = new WebGLRenderer({ alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    const group = new Group()
    scene.add(group)

    const globe = new Mesh(
      new SphereGeometry(1.55, 48, 48),
      new MeshStandardMaterial({
        color: 0x0f766e,
        roughness: 0.58,
        metalness: 0.18,
        emissive: 0x052e2b,
        emissiveIntensity: 0.45,
      }),
    )
    group.add(globe)

    const wire = new Mesh(
      new SphereGeometry(1.565, 24, 24),
      new MeshBasicMaterial({ color: 0xf59e0b, wireframe: true, transparent: true, opacity: 0.18 }),
    )
    group.add(wire)

    const ring = new Mesh(
      new TorusGeometry(2.18, 0.012, 8, 160),
      new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.42 }),
    )
    ring.rotation.x = Math.PI / 2.7
    ring.rotation.y = Math.PI / 6
    group.add(ring)

    const cardMaterial = new MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.4, metalness: 0.08 })
    const accentMaterial = new MeshStandardMaterial({ color: 0xf97316, roughness: 0.45, metalness: 0.15 })
    const cards = [
      [-2.45, 0.75, 0.15],
      [2.35, 0.25, -0.2],
      [-1.65, -1.35, -0.12],
    ].map(([x, y, z], index) => {
      const travelCard = new Group()
      const base = new Mesh(new BoxGeometry(0.95, 0.58, 0.035), cardMaterial)
      const strip = new Mesh(new BoxGeometry(0.95, 0.12, 0.04), accentMaterial)
      strip.position.y = 0.18
      travelCard.add(base, strip)
      travelCard.position.set(x, y, z)
      travelCard.rotation.z = [-0.18, 0.15, 0.08][index]
      group.add(travelCard)
      return travelCard
    })

    const plane = new Group()
    const body = new Mesh(new ConeGeometry(0.08, 0.36, 3), new MeshStandardMaterial({ color: 0xffffff }))
    body.rotation.z = -Math.PI / 2
    const wing = new Mesh(new BoxGeometry(0.34, 0.035, 0.035), accentMaterial)
    plane.add(body, wing)
    scene.add(plane)

    const light = new DirectionalLight(0xffffff, 2.4)
    light.position.set(4, 5, 5)
    scene.add(light)
    scene.add(new AmbientLight(0xffffff, 1.2))

    let frameId
    const clock = new Clock()
    const animate = () => {
      const time = clock.getElapsedTime()
      group.rotation.y = time * 0.22
      wire.rotation.y = -time * 0.16
      ring.rotation.z = time * 0.18
      cards.forEach((card, index) => {
        card.position.y += Math.sin(time * 1.5 + index) * 0.0018
      })
      plane.position.x = Math.cos(time * 0.7) * 2.35
      plane.position.y = Math.sin(time * 0.7) * 1.2
      plane.rotation.z = -time * 0.7
      renderer.render(scene, camera)
      frameId = requestAnimationFrame(animate)
    }
    animate()

    const resize = () => {
      if (!mount.clientWidth || !mount.clientHeight) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="absolute inset-0 h-full w-full opacity-90" aria-hidden="true" />
}
