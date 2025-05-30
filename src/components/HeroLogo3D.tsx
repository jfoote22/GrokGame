'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useRef, useState, useEffect } from 'react'
import { Group, Color, MeshStandardMaterial } from 'three'
import { Environment, useGLTF, Float } from '@react-three/drei'

// Preload the model with the correct public path
useGLTF.preload('/temp_logo.glb')

// Component to handle pulse state and share it with the parent
function PulseMonitor({ onPulseChange }: { onPulseChange: (value: number) => void }) {
  useFrame(({ clock }) => {
    const pulse = Math.sin(clock.getElapsedTime() * 1.5) * 0.5 + 0.5; // 0 to 1
    onPulseChange(pulse);
  });
  return null;
}

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
      // Smooth continuous rotation around Y axis
      modelRef.current.rotation.y = clock.getElapsedTime() * 0.5
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
    <Float
      speed={1.5}
      rotationIntensity={0.2} 
      floatIntensity={0.3}
    >
      <group ref={modelRef}>
        <primitive object={scene} scale={1.17} position={[0, 0, 0]} />
      </group>
    </Float>
  )
}

export default function HeroLogo3D({ className = '' }: { className?: string }) {
  const [pulseValue, setPulseValue] = useState(0);
  
  // Calculate background glow color based on pulse value
  const getBackgroundGlowColor = () => {
    if (pulseValue > 0.8) {
      return 'rgba(255, 230, 150, 0.25)'; // Bright yellow glow
    } else if (pulseValue > 0.3) {
      return 'rgba(255, 180, 80, 0.2)';   // Yellow-orange glow
    } else {
      return 'rgba(215, 100, 0, 0.15)';   // Deep orange glow
    }
  };
  
  return (
    <div className={`w-full h-full ${className} relative`}>
      {/* Pulsating background glow */}
      <div 
        className="absolute inset-0 rounded-full filter blur-3xl z-0" 
        style={{ 
          background: getBackgroundGlowColor(), 
          transform: `scale(${1.0 + pulseValue * 0.3})`,
          opacity: 0.2 + pulseValue * 0.3,
          transition: 'background 0.1s ease-in-out'
        }} 
      />
      
      <Canvas
        shadows={false}
        camera={{ position: [0, 0, 6.5], fov: 35 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.75} />
        <pointLight position={[10, 10, 10]} intensity={1.0} color="#ffffff" />
        <spotLight 
          position={[-5, 5, 5]} 
          angle={0.15} 
          penumbra={1} 
          intensity={0.8}
          color="#E39245" 
        />
        <GltfModel />
        <PulseMonitor onPulseChange={setPulseValue} />
        <Environment preset="sunset" />
      </Canvas>
    </div>
  )
} 