import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupLighting() {
  // Ambient light
  gameState.ambientLight = new THREE.AmbientLight(0x404040, 0.8);
  gameState.scene.add(gameState.ambientLight);
  
  // Directional light (main light)
  gameState.directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  gameState.directionalLight.position.set(5, 15, 10);
  gameState.directionalLight.castShadow = true;
  
  // Shadow configuration
  gameState.directionalLight.shadow.mapSize.width = 2048;
  gameState.directionalLight.shadow.mapSize.height = 2048;
  gameState.directionalLight.shadow.camera.near = 0.5;
  gameState.directionalLight.shadow.camera.far = 100;
  gameState.directionalLight.shadow.camera.left = -20;
  gameState.directionalLight.shadow.camera.right = 20;
  gameState.directionalLight.shadow.camera.top = 20;
  gameState.directionalLight.shadow.camera.bottom = -20;
  
  gameState.scene.add(gameState.directionalLight);
  
  // Add hemisphere light for better tunnel ambience
  const hemisphereLight = new THREE.HemisphereLight(0x8888ff, 0x444444, 0.4);
  gameState.scene.add(hemisphereLight);
  gameState.lights.push(hemisphereLight);
}