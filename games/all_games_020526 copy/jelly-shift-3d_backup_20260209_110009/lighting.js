import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupLighting() {
    // Ambient
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    gameState.scene.add(ambient);
    gameState.lights.push(ambient);
    
    // Sun
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 50, 20);
    dirLight.castShadow = true;
    
    // Shadow settings
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;
    
    gameState.scene.add(dirLight);
    gameState.lights.push(dirLight);
    
    // Helper to move light with player (infinite shadows)
    gameState.sun = dirLight;
}

export function updateLighting() {
    if (gameState.player && gameState.sun) {
        gameState.sun.position.z = gameState.player.mesh.position.z + 20;
        gameState.sun.target.position.z = gameState.player.mesh.position.z;
        gameState.sun.target.updateMatrixWorld();
    }
}