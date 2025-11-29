/**
 * Lighting setup and management
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

/**
 * Setup all lights
 */
export function setupLighting() {
  // Ambient light
  gameState.ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  gameState.scene.add(gameState.ambientLight);
  
  // Directional light (sun)
  gameState.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  gameState.directionalLight.position.set(10, 20, 5);
  gameState.directionalLight.castShadow = true;
  
  // Configure shadow
  gameState.directionalLight.shadow.mapSize.width = 2048;
  gameState.directionalLight.shadow.mapSize.height = 2048;
  gameState.directionalLight.shadow.camera.near = 0.5;
  gameState.directionalLight.shadow.camera.far = 50;
  gameState.directionalLight.shadow.camera.left = -20;
  gameState.directionalLight.shadow.camera.right = 20;
  gameState.directionalLight.shadow.camera.top = 20;
  gameState.directionalLight.shadow.camera.bottom = -20;
  
  gameState.scene.add(gameState.directionalLight);
  
  // Add some atmospheric point lights
  const colors = [0xff3333, 0x3333ff, 0x33ff33];
  for (let i = 0; i < 3; i++) {
    const light = new THREE.PointLight(colors[i], 0.5, 20);
    const angle = (i / 3) * Math.PI * 2;
    light.position.set(
      Math.cos(angle) * 12,
      3,
      Math.sin(angle) * 12
    );
    gameState.scene.add(light);
    gameState.pointLights.push(light);
  }
}

/**
 * Update dynamic lighting effects
 */
export function updateLighting() {
  // Pulse point lights
  gameState.pointLights.forEach((light, i) => {
    const offset = i * Math.PI * 2 / 3;
    light.intensity = 0.5 + Math.sin(gameState.frameCount * 0.05 + offset) * 0.3;
  });
}