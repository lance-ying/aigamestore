import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupLighting() {
  // Ambient light
  gameState.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  gameState.scene.add(gameState.ambientLight);
  
  // Directional light (sun)
  gameState.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  gameState.directionalLight.position.set(5, 10, 5);
  gameState.directionalLight.castShadow = true;
  
  // Shadow settings
  gameState.directionalLight.shadow.mapSize.width = 2048;
  gameState.directionalLight.shadow.mapSize.height = 2048;
  gameState.directionalLight.shadow.camera.near = 0.5;
  gameState.directionalLight.shadow.camera.far = 50;
  gameState.directionalLight.shadow.camera.left = -20;
  gameState.directionalLight.shadow.camera.right = 20;
  gameState.directionalLight.shadow.camera.top = 20;
  gameState.directionalLight.shadow.camera.bottom = -20;
  
  gameState.scene.add(gameState.directionalLight);
  
  // Point lights for atmosphere
  const pointLight1 = new THREE.PointLight(0xff9900, 0.5, 50);
  pointLight1.position.set(-10, 5, -20);
  gameState.scene.add(pointLight1);
  gameState.lights.push(pointLight1);
  
  const pointLight2 = new THREE.PointLight(0x0099ff, 0.5, 50);
  pointLight2.position.set(10, 5, -20);
  gameState.scene.add(pointLight2);
  gameState.lights.push(pointLight2);
}