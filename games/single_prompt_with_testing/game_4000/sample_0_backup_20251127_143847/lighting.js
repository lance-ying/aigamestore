// lighting.js - Lighting setup
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupLighting() {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    gameState.scene.add(ambientLight);
    gameState.ambientLight = ambientLight;
    
    // Directional light for shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    
    // Configure shadow properties
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    
    gameState.scene.add(directionalLight);
    gameState.directionalLight = directionalLight;
    
    // Add hemisphere light for better ambient lighting
    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x444444, 0.3);
    hemisphereLight.position.set(0, 20, 0);
    gameState.scene.add(hemisphereLight);
    gameState.lights.push(hemisphereLight);
    
    return { ambientLight, directionalLight, hemisphereLight };
}