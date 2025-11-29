/**
 * Lighting setup and management
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

/**
 * Setup all lighting for the scene
 */
export function setupLighting() {
  // Ambient light - base illumination
  gameState.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  gameState.scene.add(gameState.ambientLight);
  
  // Directional light - sun
  gameState.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  gameState.directionalLight.position.set(20, 30, 10);
  gameState.directionalLight.castShadow = true;
  
  // Configure shadow properties
  gameState.directionalLight.shadow.mapSize.width = 2048;
  gameState.directionalLight.shadow.mapSize.height = 2048;
  gameState.directionalLight.shadow.camera.near = 0.5;
  gameState.directionalLight.shadow.camera.far = 100;
  gameState.directionalLight.shadow.camera.left = -50;
  gameState.directionalLight.shadow.camera.right = 50;
  gameState.directionalLight.shadow.camera.top = 50;
  gameState.directionalLight.shadow.camera.bottom = -50;
  
  gameState.scene.add(gameState.directionalLight);
  
  // Hemisphere light for natural outdoor lighting
  const hemisphereLight = new THREE.HemisphereLight(
    0x87CEEB, // Sky color
    0x4a7c59, // Ground color
    0.5
  );
  hemisphereLight.position.set(0, 20, 0);
  gameState.scene.add(hemisphereLight);
  gameState.lights.push(hemisphereLight);
}