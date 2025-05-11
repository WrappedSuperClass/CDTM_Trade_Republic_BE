"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export enum AnimationState {
  IDLE = "idle",
  THINKING = "thinking", 
  SPEAKING = "speaking"
}

interface VoiceAnimationProps {
  state: AnimationState;
  className?: string;
}

export function VoiceAnimation({ state, className = "" }: VoiceAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const particlePositionsRef = useRef<Float32Array | null>(null);
  const particleTargetsRef = useRef<Float32Array | null>(null);
  const frameRef = useRef<number>(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Constants for animation
  const NUM_PARTICLES = 300;
  const PARTICLE_SIZE = 1.8;
  const ANIMATION_SPEED = 0.025;
  const IDLE_SPREAD = 8;
  const THINKING_SPREAD = 5;
  const SPEAKING_SPREAD = 7;
  const MAX_AMPLITUDE = 5;

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      50, 
      1, // Will be updated on resize
      0.1, 
      1000
    );
    camera.position.z = 50;
    cameraRef.current = camera;

    // Create particles
    const particlePositions = new Float32Array(NUM_PARTICLES * 3);
    const particleTargets = new Float32Array(NUM_PARTICLES * 3);
    
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const i3 = i * 3;
      // Initial random positions in a sphere
      const radius = IDLE_SPREAD;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      particlePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      particlePositions[i3 + 2] = radius * Math.cos(phi);
      
      // Copy initial positions to targets
      particleTargets[i3] = particlePositions[i3];
      particleTargets[i3 + 1] = particlePositions[i3 + 1];
      particleTargets[i3 + 2] = particlePositions[i3 + 2];
    }
    
    particlePositionsRef.current = particlePositions;
    particleTargetsRef.current = particleTargets;
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    // Create shader material for perfect circular particles
    const vertexShader = `
      attribute float scale;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = ${PARTICLE_SIZE} * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    
    const fragmentShader = `
      void main() {
        // Perfect circle
        vec2 center = gl_PointCoord - 0.5;
        float dist = length(center);
        if (dist > 0.5) discard;
        
        // Smooth edges
        float fadeEdge = smoothstep(0.5, 0.35, dist);
        gl_FragColor = vec4(1.0, 1.0, 1.0, fadeEdge * 0.85);
      }
    `;
    
    const material = new THREE.ShaderMaterial({
      uniforms: {},
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthTest: false
    });
    
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      renderer.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    };

    // Set initial size
    handleResize();
    window.addEventListener("resize", handleResize);

    // Start animation
    setIsAnimating(true);

    return () => {
      // Cleanup
      if (isAnimating) {
        cancelAnimationFrame(frameRef.current);
      }
      if (rendererRef.current && rendererRef.current.domElement && rendererRef.current.domElement.parentElement) {
        rendererRef.current.domElement.parentElement.removeChild(rendererRef.current.domElement);
      }
      window.removeEventListener("resize", handleResize);
      setIsAnimating(false);
    };
  }, []);

  // Update particle target positions based on state
  useEffect(() => {
    if (!particleTargetsRef.current) return;
    
    const targets = particleTargetsRef.current;
    
    for (let i = 0; i < NUM_PARTICLES; i++) {
      const i3 = i * 3;
      
      if (state === AnimationState.IDLE) {
        // Idle: particles move freely in a larger sphere
        const radius = IDLE_SPREAD;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        targets[i3] = radius * Math.sin(phi) * Math.cos(theta);
        targets[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        targets[i3 + 2] = radius * Math.cos(phi);
      } 
      else if (state === AnimationState.THINKING) {
        // Thinking: particles contract to a smaller sphere
        const radius = THINKING_SPREAD;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        targets[i3] = radius * Math.sin(phi) * Math.cos(theta);
        targets[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        targets[i3 + 2] = radius * Math.cos(phi);
      }
      else if (state === AnimationState.SPEAKING) {
        // Speaking: particles form a medium-sized sphere with wave-like motion
        // The wave effect will be applied in the animation loop
        const radius = SPEAKING_SPREAD;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        targets[i3] = radius * Math.sin(phi) * Math.cos(theta);
        targets[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        targets[i3 + 2] = radius * Math.cos(phi);
      }
    }
  }, [state]);

  // Animation loop
  useEffect(() => {
    if (!isAnimating) return;
    
    let lastTime = 0;
    let waveOffset = 0;
    
    const animate = (time: number) => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current ||
          !particlesRef.current || !particlePositionsRef.current || !particleTargetsRef.current) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      const deltaTime = time - lastTime;
      lastTime = time;
      waveOffset += deltaTime * 0.001;

      const positions = particlePositionsRef.current;
      const targets = particleTargetsRef.current;
      
      // Update particle positions
      for (let i = 0; i < NUM_PARTICLES; i++) {
        const i3 = i * 3;
        
        // Move particles toward their targets with easing
        positions[i3] += (targets[i3] - positions[i3]) * ANIMATION_SPEED;
        positions[i3 + 1] += (targets[i3 + 1] - positions[i3 + 1]) * ANIMATION_SPEED;
        positions[i3 + 2] += (targets[i3 + 2] - positions[i3 + 2]) * ANIMATION_SPEED;
        
        // Apply special effects based on state
        if (state === AnimationState.SPEAKING) {
          // Apply wave-like motion when speaking
          const distance = Math.sqrt(
            positions[i3] * positions[i3] + 
            positions[i3 + 1] * positions[i3 + 1] + 
            positions[i3 + 2] * positions[i3 + 2]
          );
          
          // Use a sin wave based on distance and time
          const amplitude = MAX_AMPLITUDE * (0.5 + Math.random() * 0.5);
          const frequency = 0.1 + Math.random() * 0.1;
          const wave = Math.sin(distance * frequency + waveOffset) * amplitude;
          
          // Add wave effect to radial direction
          if (distance > 0.1) {
            const normX = positions[i3] / distance;
            const normY = positions[i3 + 1] / distance;
            const normZ = positions[i3 + 2] / distance;
            
            positions[i3] += normX * wave;
            positions[i3 + 1] += normY * wave;
            positions[i3 + 2] += normZ * wave;
          }
        }
        else if (state === AnimationState.THINKING) {
          // Subtle pulsing effect when thinking
          const pulseRate = 0.003;
          const pulseAmplitude = 1.2;
          const pulse = Math.sin(time * pulseRate) * pulseAmplitude;
          
          // Scale particles slightly in and out
          const distance = Math.sqrt(
            positions[i3] * positions[i3] + 
            positions[i3 + 1] * positions[i3 + 1] + 
            positions[i3 + 2] * positions[i3 + 2]
          );
          
          if (distance > 0.1) {
            const normX = positions[i3] / distance;
            const normY = positions[i3 + 1] / distance;
            const normZ = positions[i3 + 2] / distance;
            
            positions[i3] += normX * pulse;
            positions[i3 + 1] += normY * pulse;
            positions[i3 + 2] += normZ * pulse;
          }
        }
        else if (state === AnimationState.IDLE) {
          // Gentle, subtle drift for idle state
          positions[i3] += Math.sin(time * 0.001 + i * 0.1) * 0.01;
          positions[i3 + 1] += Math.cos(time * 0.002 + i * 0.05) * 0.01;
          positions[i3 + 2] += Math.sin(time * 0.001 + i * 0.06) * 0.01;
        }
      }
      
      // Update the positions in the geometry
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      
      // Slowly rotate the entire particle system
      particlesRef.current.rotation.y += 0.002;
      particlesRef.current.rotation.x += 0.001;
      
      // Render the scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      
      // Request next frame
      frameRef.current = requestAnimationFrame(animate);
    };
    
    frameRef.current = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [isAnimating, state]);

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full ${className}`}
      style={{ touchAction: "none" }}
    />
  );
} 