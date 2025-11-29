import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

// Setup lighting
export function setupLighting() {
  // Ambient light (base illumination)
  gameState.ambientLight = new THREE.AmbientLight(0x330033, 0.4);
  gameState.scene.add(gameState.ambientLight);
  
  // Directional light (main light source)
  gameState.directionalLight = new THREE.DirectionalLight(0xff6666, 1.0);
  gameState.directionalLight.position.set(10, 20, 10);
  gameState.directionalLight.castShadow = true;
  
  // Configure shadow map
  gameState.directionalLight.shadow.mapSize.width = 2048;
  gameState.directionalLight.shadow.mapSize.height = 2048;
  gameState.directionalLight.shadow.camera.near = 0.5;
  gameState.directionalLight.shadow.camera.far = 50;
  gameState.directionalLight.shadow.camera.left = -30;
  gameState.directionalLight.shadow.camera.right = 30;
  gameState.directionalLight.shadow.camera.top = 30;
  gameState.directionalLight.shadow.camera.bottom = -30;
  
  gameState.scene.add(gameState.directionalLight);
  
  // Add atmospheric red point light
  const pointLight = new THREE.PointLight(0xff0000, 1.0, 50);
  pointLight.position.set(0, 10, 0);
  gameState.scene.add(pointLight);
  gameState.lights.push(pointLight);
  
  // Add blue accent light for player
  const playerLight = new THREE.PointLight(0x00ccff, 0.8, 20);
  playerLight.position.set(0, 5, 0);
  gameState.scene.add(playerLight);
  gameState.lights.push(playerLight);
}