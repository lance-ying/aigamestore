import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupLighting() {
    // Ambient Light (Base environment light)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // Soft white
    gameState.scene.add(ambientLight);
    gameState.lights.push(ambientLight);

    // Hemisphere Light (Sky/Ground contrast)
    const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
    gameState.scene.add(hemiLight);
    gameState.lights.push(hemiLight);

    // Directional Light (The Sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 50, 20);
    dirLight.castShadow = true;
    
    // Shadow properties
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    const d = 50;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.camera.far = 3500;
    dirLight.shadow.bias = -0.0001;

    gameState.scene.add(dirLight);
    gameState.lights.push(dirLight);
}