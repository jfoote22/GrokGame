'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Group, Color, MeshStandardMaterial } from 'three'
import { PerspectiveCamera, Environment, useGLTF } from '@react-three/drei'

// Preload the model with the correct public path
useGLTF.preload('/temp_logo.glb')

// Import the model
function GltfModel() {
  const modelRef = useRef<Group>(null)
  const materialRef = useRef<MeshStandardMaterial | null>(null)
  const { scene } = useGLTF('/temp_logo.glb')
  
  // Create pulsating material
  const material = new MeshStandardMaterial({
    color: new Color('#D86A00'),
    roughness: 0.4,
    metalness: 0.7,
    emissive: new Color('#A74800'),
    emissiveIntensity: 0.2,
  });
  materialRef.current = material;
  
  // Apply material to all meshes
  scene.traverse((child: any) => {
    if (child.isMesh) {
      child.material = material;
    }
  });
  
  // Rotate around Y axis and update color pulsation
  useFrame(({ clock }) => {
    if (modelRef.current) {
      modelRef.current.rotation.y += 0.01
    }
    
    if (materialRef.current) {
      // Create pulsating effect between white-yellow-orange
      const pulse = Math.sin(clock.getElapsedTime() * 1.5) * 0.5 + 0.5; // 0 to 1 value
      
      // Interpolate between colors: bright white/yellow to deep orange
      if (pulse > 0.8) {
        // Bright white to yellow (0.8-1.0)
        const normalizedPulse = (pulse - 0.8) * 5; // 0-1 for this range
        materialRef.current.color.setRGB(
          1.0, 
          1.0 - (normalizedPulse * 0.15), // slightly reduce green to yellow
          0.6 - (normalizedPulse * 0.6)   // reduce blue for more yellow
        );
        materialRef.current.emissiveIntensity = 0.5 - (normalizedPulse * 0.2);
      } else if (pulse > 0.3) {
        // Yellow to orange (0.3-0.8)
        const normalizedPulse = (pulse - 0.3) * 2; // 0-1 for this range
        materialRef.current.color.setRGB(
          1.0, 
          0.85 - (normalizedPulse * 0.5), // reduce green for more orange
          0.0 + (normalizedPulse * 0.3)   // slight blue for richer color
        );
        materialRef.current.emissiveIntensity = 0.3;
      } else {
        // Deep orange (0.0-0.3)
        const normalizedPulse = pulse / 0.3; // 0-1 for this range
        materialRef.current.color.setRGB(
          0.85 + (normalizedPulse * 0.15), 
          0.35 + (normalizedPulse * 0.15),
          0.0
        );
        materialRef.current.emissiveIntensity = 0.15 + (normalizedPulse * 0.15);
      }
    }
  });

  return (
    <group ref={modelRef}>
      <primitive object={scene} scale={0.455} position={[0, 0, 0]} />
    </group>
  )
}

export default function Logo3D({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        shadows={false}
        camera={{ position: [0, 0, 4], fov: 35 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffffff" />
        <pointLight position={[-5, 5, -5]} intensity={0.4} color="#ffb06b" />
        <GltfModel />
        <Environment preset="sunset" />
      </Canvas>
    </div>
  )
} 