// lighting.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    gameState.scene.add(ambientLight);
    gameState.lights.push(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffd080, 0.8);
    directionalLight.position.set(50, 100, 30);
    directionalLight.castShadow = true;
    
    // Shadow settings
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -150;
    directionalLight.shadow.camera.right = 150;
    directionalLight.shadow.camera.top = 150;
    directionalLight.shadow.camera.bottom = -150;
    
    gameState.scene.add(directionalLight);
    gameState.lights.push(directionalLight);
    
    // Hemisphere light for ambient atmosphere
    const hemiLight = new THREE.HemisphereLight(0x606040, 0x302820, 0.4);
    gameState.scene.add(hemiLight);
    gameState.lights.push(hemiLight);
}