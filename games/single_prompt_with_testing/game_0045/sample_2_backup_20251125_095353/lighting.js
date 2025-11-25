// lighting.js - Lighting setup
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

// Setup all lighting
export function setupLighting() {
  // Ambient light for base illumination
  gameState.ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  gameState.scene.add(gameState.ambientLight);
  
  // Main directional light (sun)
  gameState.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  gameState.directionalLight.position.set(10, 20, 5);
  gameState.directionalLight.castShadow = true;
  
  // Configure shadow map
  gameState.directionalLight.shadow.mapSize.width = 2048;
  gameState.directionalLight.shadow.mapSize.height = 2048;
  gameState.directionalLight.shadow.camera.near = 0.5;
  gameState.directionalLight.shadow.camera.far = 100;
  gameState.directionalLight.shadow.camera.left = -30;
  gameState.directionalLight.shadow.camera.right = 30;
  gameState.directionalLight.shadow.camera.top = 30;
  gameState.directionalLight.shadow.camera.bottom = -30;
  
  gameState.scene.add(gameState.directionalLight);
  
  // Hemisphere light for sky/ground color
  const hemisphereLight = new THREE.HemisphereLight(
    0x87CEEB, // Sky color
    0x1a1a2e, // Ground color
    0.4
  );
  hemisphereLight.position.set(0, 20, 0);
  gameState.scene.add(hemisphereLight);
  gameState.lights.push(hemisphereLight);
  
  // Point lights for neon glow effect
  const neonLight1 = new THREE.PointLight(0x00ffff, 1.5, 20);
  neonLight1.position.set(-10, 5, -10);
  gameState.scene.add(neonLight1);
  gameState.lights.push(neonLight1);
  
  const neonLight2 = new THREE.PointLight(0xff00ff, 1.5, 20);
  neonLight2.position.set(10, 5, -10);
  gameState.scene.add(neonLight2);
  gameState.lights.push(neonLight2);
}

// Update lighting (for dynamic effects)
export function updateLighting(deltaTime) {
  // Animate neon lights
  if (gameState.lights.length >= 2) {
    const time = gameState.frameCount * 0.02;
    
    // Pulse neon lights
    if (gameState.lights[0]) {
      gameState.lights[0].intensity = 1.2 + Math.sin(time) * 0.3;
    }
    
    if (gameState.lights[1]) {
      gameState.lights[1].intensity = 1.2 + Math.cos(time) * 0.3;
    }
  }
}