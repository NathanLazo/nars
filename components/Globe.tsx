"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// @ts-ignore
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { Color } from "three";

export default function Globe() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isHighResLoaded, setIsHighResLoaded] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [imageStatus, setImageStatus] = useState("Loading image...");

  useEffect(() => {
    if (!mountRef.current) return;

    // Create scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Create a starfield
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 10000;
    const positions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2000;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2000;
    }
    starsGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.7,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // Create an atmospheric glow using a custom shader
    const atmosphereVertexShader = `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    const atmosphereFragmentShader = `
     uniform vec3 glowColor;
     varying vec3 vNormal;
     void main() {
       float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
       gl_FragColor = vec4(glowColor, 1.0) * intensity;
     }
   `;
    const atmosphereGeometry = new THREE.SphereGeometry(5.2, 32, 32);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      uniforms: {
        glowColor: { value: new Color(0x3a86ff) },
      },
    });
    const atmosphereMesh = new THREE.Mesh(
      atmosphereGeometry,
      atmosphereMaterial
    );
    scene.add(atmosphereMesh);

    // Create wireframe globe
    const wireframeGeometry = new THREE.SphereGeometry(5, 32, 32);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x3a86ff,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const wireframeGlobe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    scene.add(wireframeGlobe);

    // Create solid globe (initially invisible)
    const solidGeometry = new THREE.SphereGeometry(4.9, 64, 64);
    const solidMaterial = new THREE.MeshPhongMaterial({
      color: 0x1a237e,
      transparent: true,
      opacity: 0,
    });
    const solidGlobe = new THREE.Mesh(solidGeometry, solidMaterial);
    scene.add(solidGlobe);

    // Position camera on the opposite side (looking toward negative z)
    camera.position.z = -10;
    camera.lookAt(0, 0, 0);

    // Create a fallback texture in case the image fails to load
    const createFallbackTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 384;
      const context = canvas.getContext("2d");

      if (context) {
        // Fill background
        context.fillStyle = "#ff9e80";
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Add border
        context.strokeStyle = "#ffffff";
        context.lineWidth = 10;
        context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

        // Add text
        context.font = "bold 48px Arial";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = "#000000";
        context.fillText("Image", canvas.width / 2, canvas.height / 2 - 30);
        context.fillText("Failed", canvas.width / 2, canvas.height / 2 + 30);
      }

      return new THREE.CanvasTexture(canvas);
    };

    // Load image texture directly from URL with CORS handling
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = "anonymous"; // Important for CORS

    // Create plane geometry with vertical orientation (less tall)
    const planeGeometry = new THREE.PlaneGeometry(12, 16); // Reduced height

    // Create initial material with placeholder
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0x888888,
      transparent: true,
      side: THREE.DoubleSide,
      opacity: 0.5,
    });

    const plane = new THREE.Mesh(planeGeometry, planeMaterial);

    // Position the plane behind the globe (positive z since camera is at negative z)
    plane.position.set(0, 0, 15);

    // Add the plane to the scene
    scene.add(plane);

    // Try to load the texture
    textureLoader.load(
      "https://ivxi4mi5oxbrzef8.public.blob.vercel-storage.com/us-lmcNR1gYxCsfe5BYC3QvjrY8IRgRh7.jpeg",
      (texture) => {
        // Success - update the material with the loaded texture
        planeMaterial.map = texture;
        planeMaterial.color.set(0xffffff); // Reset color to white to show texture properly
        planeMaterial.opacity = 1;
        planeMaterial.needsUpdate = true;
        setImageStatus("Image loaded successfully");
        console.log("Image loaded successfully");
      },
      (xhr) => {
        // Progress
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      (error) => {
        // Error - use fallback texture
        console.error("Error loading image:", error);
        planeMaterial.map = createFallbackTexture();
        planeMaterial.color.set(0xffffff);
        planeMaterial.needsUpdate = true;
        setImageStatus("Failed to load image");
      }
    );

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add point light
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.enableZoom = false;
    controls.target.set(0, 0, 0); // Make sure controls target the center

    // Blue color palette
    const colors = [
      new Color(0x0096ff), // Bright blue
      new Color(0x4169e1), // Royal blue
      new Color(0x0047ab), // Cobalt blue
      new Color(0x6495ed), // Cornflower blue
      new Color(0x00bfff), // Deep sky blue
      new Color(0x1e90ff), // Dodger blue
      new Color(0x87ceeb), // Sky blue
      new Color(0x000080), // Navy blue
    ];

    let colorIndex = 0;
    let nextColorIndex = 1;
    let colorT = 0;
    const colorTransitionSpeed = 0.005;

    const lerpColor = (a: Color, b: Color, t: number) => {
      const color = new Color();
      color.r = a.r + (b.r - a.r) * t;
      color.g = a.g + (b.g - a.g) * t;
      color.b = a.b + (b.b - a.b) * t;
      return color;
    };

    let animationId: number;

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Color transition logic
      colorT += colorTransitionSpeed;
      if (colorT >= 1) {
        colorT = 0;
        colorIndex = nextColorIndex;
        nextColorIndex = (nextColorIndex + 1) % colors.length;
      }

      const currentColor = lerpColor(
        colors[colorIndex],
        colors[nextColorIndex],
        colorT
      );

      // Update materials with new color
      if (wireframeGlobe.material instanceof THREE.MeshBasicMaterial) {
        wireframeGlobe.material.color = currentColor;
      }
      if (solidGlobe.material instanceof THREE.MeshPhongMaterial) {
        solidGlobe.material.color = currentColor;
      }
      if (atmosphereMesh.material instanceof THREE.ShaderMaterial) {
        atmosphereMesh.material.uniforms.glowColor.value = currentColor;
      }

      // Rotate the globes, atmosphere, and starfield for dynamic effect
      wireframeGlobe.rotation.y += 0.001;
      solidGlobe.rotation.y += 0.001;
      atmosphereMesh.rotation.y += 0.0005;
      stars.rotation.y += 0.0001;

      // Make the background image move slightly
      const time = Date.now() * 0.0005;
      plane.position.y = Math.sin(time) * 0.5;

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Load high-resolution textures
    const textureLoaderHighRes = new THREE.TextureLoader();
    const loadTexture = (url: string) =>
      new Promise((resolve) => {
        textureLoaderHighRes.load(url, (texture) => resolve(texture));
      });

    Promise.all([
      loadTexture("/earth-texture-compressed.jpg"),
      loadTexture("/earth-bump-compressed.jpg"),
      loadTexture("/earth-specular-compressed.jpg"),
    ]).then(([texture, bumpMap, specularMap]) => {
      const highResMaterial = new THREE.MeshPhongMaterial({
        map: texture as THREE.Texture,
        bumpMap: bumpMap as THREE.Texture,
        bumpScale: 0.05,
        specularMap: specularMap as THREE.Texture,
        specular: new THREE.Color("grey"),
      });

      // Transition to the high-res textured globe
      const transitionDuration = 1; // seconds
      const startTime = Date.now();

      const transitionToHighRes = () => {
        const elapsedTime = (Date.now() - startTime) / 1000;
        const progress = Math.min(elapsedTime / transitionDuration, 1);

        solidGlobe.material = highResMaterial;
        solidGlobe.material.opacity = progress;
        wireframeMaterial.opacity = 0.5 * (1 - progress);

        if (progress < 1) {
          requestAnimationFrame(transitionToHighRes);
        } else {
          setIsHighResLoaded(true);
          scene.remove(wireframeGlobe);
        }
        renderer.render(scene, camera);
      };

      transitionToHighRes();
    });

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    const hintTimer = setTimeout(() => {
      setShowHint(false);
    }, 3000); // Hide hint after 3 seconds

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      mountRef.current?.removeChild(renderer.domElement);
      controls.dispose();
      clearTimeout(hintTimer);
    };
  }, []);

  return (
    <div ref={mountRef} className='fixed top-0 left-0 w-full h-full z-0'>
      {showHint && (
        <div className='absolute bottom-4 right-4 bg-black bg-opacity-30 text-white text-sm px-3 py-1 rounded-full transition-opacity duration-1000 opacity-80 hover:opacity-100'>
          Drag to explore
        </div>
      )}
      <div className='absolute bottom-4 left-4 bg-black bg-opacity-50 text-white text-sm px-3 py-1 rounded-full'>
        {imageStatus}
      </div>
    </div>
  );
}
