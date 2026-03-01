import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupLighting() {
    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    gameState.scene.add(ambientLight);
    gameState.lights.push(ambientLight);

    // Directional Light (Sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    
    // Optimize shadows
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -10;
    
    gameState.scene.add(dirLight);
    gameState.lights.push(dirLight);
    
    // Point Light near player for shine
    const pointLight = new THREE.PointLight(0x00ffff, 0.5, 10);
    pointLight.position.set(0, 5, 2);
    gameState.scene.add(pointLight);
    gameState.playerLight = pointLight;
}

export function updateLighting() {
    if (gameState.player && gameState.playerLight) {
        gameState.playerLight.position.copy(gameState.player.mesh.position);
        gameState.playerLight.position.y += 2;
        gameState.playerLight.position.z += 1;
    }
}