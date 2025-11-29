// lighting.js - Lighting setup
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupLighting() {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  gameState.scene.add(ambientLight);
  gameState.ambientLight = ambientLight;
  gameState.lights.push(ambientLight);
  
  // Directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(50, 100, 50);
  directionalLight.castShadow = true;
  
  // Configure shadow map
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;
  
  gameState.scene.add(directionalLight);
  gameState.directionalLight = directionalLight;
  gameState.lights.push(directionalLight);
  
  // Hemisphere light for ambient sky/ground lighting
  const hemisphereLight = new THREE.HemisphereLight(
    0x87CEEB, // Sky color
    0x5a7a3a, // Ground color
    0.3
  );
  gameState.scene.add(hemisphereLight);
  gameState.lights.push(hemisphereLight);
}