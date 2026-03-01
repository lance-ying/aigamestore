import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupLighting() {
    // Ambient - dark jungle feel
    gameState.ambientLight = new THREE.AmbientLight(0x404040, 1.5); 
    gameState.scene.add(gameState.ambientLight);

    // Directional - Moon/Sun
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(20, 50, 20);
    dirLight.castShadow = true;
    
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;

    gameState.scene.add(dirLight);
    gameState.directionalLight = dirLight;

    // Fog for atmosphere and hiding clipping
    gameState.scene.fog = new THREE.Fog(0x87CEEB, 20, 60);
    gameState.scene.background = new THREE.Color(0x87CEEB);
}

export function updateLighting() {
    if (gameState.player && gameState.directionalLight) {
        // Move shadow casting light with player to maintain high res shadows
        gameState.directionalLight.position.z = gameState.player.mesh.position.z + 20;
        gameState.directionalLight.target.position.z = gameState.player.mesh.position.z;
        gameState.directionalLight.target.updateMatrixWorld();
    }
}