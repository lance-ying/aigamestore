import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupLighting() {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  gameState.scene.add(ambientLight);
  gameState.ambientLight = ambientLight;
  
  // Directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 15, 10);
  directionalLight.castShadow = true;
  
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -15;
  directionalLight.shadow.camera.right = 15;
  directionalLight.shadow.camera.top = 15;
  directionalLight.shadow.camera.bottom = -15;
  
  gameState.scene.add(directionalLight);
  gameState.directionalLight = directionalLight;
  
  // Hemisphere light
  const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x444444, 0.3);
  gameState.scene.add(hemisphereLight);
  gameState.lights.push(hemisphereLight);
}