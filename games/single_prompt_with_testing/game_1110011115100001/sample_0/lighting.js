import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupLighting() {
    // Atmospheric dark ambient light
    const ambientLight = new THREE.AmbientLight(0x222222, 0.8);
    gameState.scene.add(ambientLight);
    gameState.ambientLight = ambientLight;

    // Player torch/lantern light (PointLight)
    // This creates the "circle of light" effect in the darkness
    const playerLight = new THREE.PointLight(0xffaa55, 2.0, 25);
    playerLight.position.set(0, 2, 0);
    playerLight.castShadow = true;
    playerLight.shadow.mapSize.width = 1024;
    playerLight.shadow.mapSize.height = 1024;
    gameState.scene.add(playerLight);
    gameState.playerLight = playerLight; // Store to update position with player

    // Rim light for enemies/objects to make them visible against black background
    const rimLight = new THREE.DirectionalLight(0x444455, 0.5);
    rimLight.position.set(-5, 10, -5);
    gameState.scene.add(rimLight);
}

export function updateLighting() {
    if (gameState.player && gameState.playerLight) {
        // Light follows player but slightly above
        gameState.playerLight.position.copy(gameState.player.mesh.position);
        gameState.playerLight.position.y += 3;
        gameState.playerLight.position.z += 1;
        
        // Flicker effect
        gameState.playerLight.intensity = 2.0 + Math.sin(gameState.frameCount * 0.1) * 0.2;
    }
}