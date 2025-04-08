"use client";

import { useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Text3D,
  OrbitControls,
  PresentationControls,
  Environment,
  Float,
  Sparkles,
  useTexture,
} from "@react-three/drei";
import { Heart } from "lucide-react";
import * as THREE from "three";

// Use Drei's useTexture hook with the Vercel Blob URL
function PhotoPlane() {
  const meshRef = useRef();

  // Use the provided Vercel Blob URL
  const texture = useTexture(
    "https://ivxi4mi5oxbrzef8.public.blob.vercel-storage.com/us-lmcNR1gYxCsfe5BYC3QvjrY8IRgRh7.jpeg"
  );

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Subtle floating movement
      meshRef.current.position.y = Math.sin(clock.elapsedTime * 0.2) * 0.05;
      // Very slight rotation to give it life
      meshRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.1) * 0.02;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -2]} scale={[6, 8, 1]}>
      <planeGeometry />
      <meshBasicMaterial map={texture} transparent opacity={0.9} />
      {/* Add a subtle glow frame around the photo */}
      <mesh position={[0, 0, -0.1]} scale={[1.05, 1.05, 1]}>
        <planeGeometry />
        <meshBasicMaterial color='#1e90ff' transparent opacity={0.3} />
      </mesh>
    </mesh>
  );
}

// Fallback component while textures are loading
function LoadingFallback() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color='#4169e1' />
    </mesh>
  );
}

function TextMessage() {
  const textRef = useRef();
  const [hovered, setHovered] = useState(false);
  const glowIntensity = useRef(0);

  useFrame((state, delta) => {
    if (textRef.current) {
      // Pulsating color effect
      const pulse = (Math.sin(state.clock.elapsedTime * 2) + 1) / 2;
      textRef.current.material.color.set(hovered ? "#1e90ff" : `#4169e1`);
      textRef.current.material.emissiveIntensity = 0.5 + pulse * 0.5;

      // Subtle floating movement
      textRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.05;
    }

    // Update glow intensity with smooth transition
    glowIntensity.current = THREE.MathUtils.lerp(
      glowIntensity.current,
      hovered ? 1 : 0.5,
      delta * 2
    );
  });

  return (
    <group>
      <Text3D
        ref={textRef}
        font='https://threejs.org/examples/fonts/helvetiker_bold.typeface.json'
        size={1.2}
        height={0.2}
        curveSegments={12}
        bevelEnabled
        bevelThickness={0.02}
        bevelSize={0.02}
        bevelOffset={0}
        bevelSegments={5}
        position={[-5, 0, 0]}
      >
        Te amo Daniela
        <meshStandardMaterial
          color='#4169e1'
          emissive='#1e90ff'
          emissiveIntensity={0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </Text3D>

      <HeartParticles />
      <StarField />
    </group>
  );
}

function HeartParticles() {
  const groupRef = useRef();
  const heartCount = 30;
  const hearts = Array.from({ length: heartCount }).map((_, i) => ({
    position: [
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 12,
    ],
    scale: Math.random() * 0.3 + 0.1,
    rotation: Math.random() * Math.PI,
    speed: Math.random() * 0.02 + 0.01,
    color: i % 2 === 0 ? "#4169e1" : "#1e90ff", // Alternating blue colors
  }));

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;

      // Animate each heart
      groupRef.current.children.forEach((heart, i) => {
        heart.position.y += Math.sin(state.clock.elapsedTime + i) * 0.01;
        heart.rotation.z += hearts[i].speed;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {hearts.map((heart, i) => (
        <mesh
          key={i}
          position={heart.position}
          scale={heart.scale}
          rotation={[0, 0, heart.rotation]}
        >
          <HeartGeometry />
          <meshStandardMaterial
            color={heart.color}
            emissive='#1e90ff'
            emissiveIntensity={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}

// Custom heart geometry
function HeartGeometry() {
  const shape = new THREE.Shape();
  const x = 0,
    y = 0;

  shape.moveTo(x, y + 0.5);
  shape.bezierCurveTo(x, y + 0.5, x - 0.5, y, x - 0.5, y);
  shape.bezierCurveTo(x - 0.5, y - 0.5, x, y - 1, x, y - 1);
  shape.bezierCurveTo(x, y - 1, x + 0.5, y - 0.5, x + 0.5, y);
  shape.bezierCurveTo(x + 0.5, y, x, y + 0.5, x, y + 0.5);

  const geometry = new THREE.ShapeGeometry(shape);
  return <primitive object={geometry} attach='geometry' />;
}

function StarField() {
  const starsRef = useRef();
  const starCount = 200;

  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += 0.0005;
      starsRef.current.rotation.x += 0.0002;
    }
  });

  return (
    <group ref={starsRef}>
      <Sparkles
        count={starCount}
        scale={20}
        size={2}
        speed={0.2}
        color='#ffffff'
        opacity={0.7}
      />
    </group>
  );
}

export default function LoveMessage() {
  return (
    <div className='w-full h-screen bg-gradient-to-b from-blue-100 to-blue-300'>
      <div className='absolute top-4 left-4 z-10 flex items-center gap-2 text-blue-700'>
        <Heart className='w-5 h-5 fill-blue-500 stroke-blue-700' />
        <span className='font-semibold'>Para Nars 💟</span>
      </div>

      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          intensity={1.2}
          castShadow
        />
        <pointLight position={[-10, -10, -10]} color='#1e90ff' intensity={1} />
        <pointLight position={[5, -5, 5]} color='#00bfff' intensity={0.8} />

        <PresentationControls
          global
          zoom={0.8}
          rotation={[0, 0, 0]}
          polar={[-Math.PI / 4, Math.PI / 4]}
          azimuth={[-Math.PI / 4, Math.PI / 4]}
        >
          <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            Add the photo plane behind the text with Suspense for loading
            <PhotoPlane />
            <TextMessage />
            <Sparkles
              count={150}
              scale={12}
              size={4}
              speed={0.3}
              color='#4169e1'
            />
          </Float>
        </PresentationControls>

        <Environment preset='night' />
        <OrbitControls enableZoom={false} />

        {/* Background glow effect */}
        <mesh position={[0, 0, -10]}>
          <sphereGeometry args={[7, 32, 32]} />
          <meshBasicMaterial color='#0000ff' transparent opacity={0.05} />
        </mesh>
      </Canvas>

      <div className='absolute bottom-4 right-4 text-sm text-blue-700 opacity-70'>
        Hecho con ❤️ para mi amorsito
      </div>
    </div>
  );
}
