import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupLighting() {
    gameState.lights = [];

    // Ambient Light - Base visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    gameState.scene.add(ambientLight);
    gameState.ambientLight = ambientLight;

    // Directional Light - The "Sun" / Main shadow caster
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    
    // Optimize shadows
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 20;
    dirLight.shadow.camera.bottom = -20;

    gameState.scene.add(dirLight);
    gameState.directionalLight = dirLight;
    gameState.lights.push(dirLight);

    // Hemisphere Light - Nice gradient from sky to ground
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x222222, 0.4);
    hemiLight.position.set(0, 20, 0);
    gameState.scene.add(hemiLight);
    gameState.lights.push(hemiLight);
}

export function updateLighting() {
    // Make the directional light follow the player slightly to maintain shadows
    if (gameState.player && gameState.directionalLight) {
        gameState.directionalLight.position.z = gameState.player.mesh.position.z + 10;
        gameState.directionalLight.target.position.z = gameState.player.mesh.position.z;
        gameState.directionalLight.target.updateMatrixWorld();
    }
}