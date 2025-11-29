// lighting.js - Lighting setup
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupLighting() {
  const scene = gameState.scene;
  
  // Hemisphere light for sky/ground ambient
  const hemisphereLight = new THREE.HemisphereLight(
    0xFFE4B5, // Sky color
    0xD2691E, // Ground color
    0.6
  );
  scene.add(hemisphereLight);
  gameState.hemisphereLight = hemisphereLight;
  
  // Directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xFFFFCC, 0.8);
  directionalLight.position.set(50, 100, 30);
  directionalLight.castShadow = true;
  
  // Configure shadow properties
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;
  directionalLight.shadow.bias = -0.0001;
  
  scene.add(directionalLight);
  gameState.directionalLight = directionalLight;
  
  // Ambient light for base illumination
  const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.4);
  scene.add(ambientLight);
  gameState.ambientLight = ambientLight;
  
  gameState.lights.push(hemisphereLight, directionalLight, ambientLight);
}

export function updateLighting(biome) {
  if (!gameState.hemisphereLight || !gameState.scene) return;
  
  // Update lighting based on biome
  gameState.hemisphereLight.color.setHex(biome.skyColor);
  gameState.hemisphereLight.groundColor.setHex(biome.groundColor);
  
  // Update fog color
  if (gameState.scene.fog) {
    gameState.scene.fog.color.setHex(biome.fogColor);
  }
}