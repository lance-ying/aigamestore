import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupLighting() {
  // Ambient light
  gameState.ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  gameState.scene.add(gameState.ambientLight);
  
  // Directional light (sun)
  gameState.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  gameState.directionalLight.position.set(5, 10, 5);
  gameState.directionalLight.castShadow = true;
  
  gameState.directionalLight.shadow.mapSize.width = 2048;
  gameState.directionalLight.shadow.mapSize.height = 2048;
  gameState.directionalLight.shadow.camera.near = 0.5;
  gameState.directionalLight.shadow.camera.far = 50;
  gameState.directionalLight.shadow.camera.left = -15;
  gameState.directionalLight.shadow.camera.right = 15;
  gameState.directionalLight.shadow.camera.top = 15;
  gameState.directionalLight.shadow.camera.bottom = -15;
  
  gameState.scene.add(gameState.directionalLight);
  
  // Hemisphere light for atmosphere
  const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x444444, 0.4);
  gameState.scene.add(hemisphereLight);
  gameState.lights.push(hemisphereLight);
}