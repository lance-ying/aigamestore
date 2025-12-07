import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6); // Soft white light
    gameState.scene.add(ambientLight);
    gameState.lights.push(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
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
    gameState.lights.push(dirLight);
    
    // Add fog for atmosphere
    gameState.scene.fog = new THREE.Fog(0x87CEEB, 20, 80); // Sky blue fog matching background
    gameState.scene.background = new THREE.Color(0x87CEEB);
}

export function updateLighting() {
    // Move directional light with player to maintain shadows
    if (gameState.player && gameState.lights[1]) {
        gameState.lights[1].position.z = gameState.player.mesh.position.z + 10;
        gameState.lights[1].target.position.z = gameState.player.mesh.position.z - 10;
        gameState.lights[1].target.updateMatrixWorld();
    }
}