import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import type { Product } from '../data/products'
import { dimensionsFor } from '../three/cupDimensions'
import { createCupTexture, createShadowTexture } from '../three/cupTextures'

export interface DragState {
  dragging: boolean
  pending: number
  velocity: number
}

interface AcaiCup3DProps {
  readonly product: Product
  readonly drag: React.RefObject<DragState>
  readonly reducedMotion: boolean
}

const AUTO_SPIN = 0.32

const toppings = [
  { position: [0.34, 0, 0.12], color: '#f6e3a1', scale: [0.3, 0.06, 0.3], type: 'banana' },
  { position: [-0.3, 0.03, 0.28], color: '#c8102e', scale: [0.2, 0.2, 0.2], type: 'berry' },
  { position: [0.05, 0.05, -0.32], color: '#f6e3a1', scale: [0.26, 0.06, 0.26], type: 'banana' },
  { position: [-0.36, 0.02, -0.12], color: '#8c1c13', scale: [0.17, 0.17, 0.17], type: 'berry' },
  { position: [0.22, 0.06, -0.05], color: '#c98a4b', scale: [0.12, 0.12, 0.12], type: 'crumb' },
  { position: [-0.08, 0.07, 0.05], color: '#e8c89a', scale: [0.1, 0.1, 0.1], type: 'crumb' },
  { position: [0.4, 0.02, -0.28], color: '#c98a4b', scale: [0.11, 0.11, 0.11], type: 'crumb' },
] as const

function Cup({ product, drag, reducedMotion }: AcaiCup3DProps) {
  const group = useRef<THREE.Group>(null)
  const logo = useLoader(THREE.TextureLoader, '/imagem/logo-oficial.webp')

  const dimensions = useMemo(() => dimensionsFor(product.id), [product.id])
  const cupTexture = useMemo(
    () => createCupTexture(logo.image as CanvasImageSource, product.size),
    [logo, product.size],
  )
  const shadowTexture = useMemo(() => createShadowTexture(), [])

  const { radiusTop, radiusBottom, height } = dimensions
  const half = height / 2

  useFrame((_, delta) => {
    const mesh = group.current
    const state = drag.current
    if (!mesh || !state) return

    if (state.dragging) {
      mesh.rotation.y += state.pending
      state.velocity = state.pending
      state.pending = 0
      return
    }

    mesh.rotation.y += state.velocity + (reducedMotion ? 0 : AUTO_SPIN * delta)
    state.velocity *= 0.94
  })

  return (
    <group ref={group} position={[0, -0.1, 0]}>
      {/* Corpo do copo, com o conteúdo e o rótulo impressos. */}
      <mesh castShadow>
        <cylinderGeometry args={[radiusTop, radiusBottom, height, 96, 1, true]} />
        <meshPhysicalMaterial
          map={cupTexture}
          side={THREE.DoubleSide}
          roughness={0.32}
          metalness={0}
          clearcoat={0.75}
          clearcoatRoughness={0.25}
        />
      </mesh>

      {/* Fundo do copo. */}
      <mesh position={[0, -half, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radiusBottom, 64]} />
        <meshStandardMaterial color="#160820" roughness={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* Açaí em montinho, um pouco abaixo da borda. */}
      <mesh position={[0, half - 0.26, 0]} scale={[1, 0.26, 1]}>
        <sphereGeometry args={[radiusTop * 0.94, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#2f1249" roughness={0.7} />
      </mesh>
      <mesh position={[0, half - 0.27, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radiusTop * 0.94, 48]} />
        <meshStandardMaterial color="#200d33" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Complementos por cima do açaí. */}
      <group position={[0, half - 0.12, 0]} scale={[radiusTop * 0.9, 1, radiusTop * 0.9]}>
        {toppings.map((topping, index) => (
          <mesh
            key={index}
            position={topping.position as unknown as [number, number, number]}
            rotation={[topping.type === 'banana' ? 0 : 0.4, index, 0]}
          >
            {topping.type === 'banana' ? (
              <cylinderGeometry args={[topping.scale[0], topping.scale[0], topping.scale[1], 24]} />
            ) : (
              <sphereGeometry args={[topping.scale[0], 20, 20]} />
            )}
            <meshStandardMaterial color={topping.color} roughness={0.45} />
          </mesh>
        ))}
      </group>

      {/* Borda e tampa transparente. */}
      <mesh position={[0, half, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radiusTop + 0.02, 0.045, 16, 96]} />
        <meshPhysicalMaterial color="#efe6f8" roughness={0.15} metalness={0.1} clearcoat={1} />
      </mesh>

      <mesh position={[0, half + 0.01, 0]} scale={[1, 0.34, 1]}>
        <sphereGeometry args={[radiusTop + 0.01, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.09}
          roughness={0.02}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.02}
          ior={1.45}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Sombra projetada. */}
      <mesh position={[0, -half - 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[radiusBottom * 4.6, radiusBottom * 4.6]} />
        <meshBasicMaterial map={shadowTexture} transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

export default function AcaiCup3D({ product, drag, reducedMotion }: AcaiCup3DProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 1.05, 6.4], fov: 30 }}
      style={{ width: '100%', height: '100%', touchAction: 'pan-y' }}
    >
      <ambientLight intensity={1.1} />
      <directionalLight position={[3.5, 5, 3]} intensity={2.6} color="#ffffff" />
      <directionalLight position={[-4, 2, -3]} intensity={1.4} color="#a476d3" />
      <pointLight position={[0, -2, 2.5]} intensity={6} color="#6d4296" />
      <Cup product={product} drag={drag} reducedMotion={reducedMotion} />
    </Canvas>
  )
}
