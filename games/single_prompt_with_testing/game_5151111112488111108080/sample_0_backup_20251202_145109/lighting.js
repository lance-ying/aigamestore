import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';

export function setupLighting() {
    // 1. Hemisphere Light (Sky/Ground ambient)
    // Sky color (purple-ish), Ground color (dark)
    const hemiLight = new THREE.HemisphereLight(0x4a0e4e, 0x000000, 0.6);
    gameState.scene.add(hemiLight);
    gameState.lights.push(hemiLight);

    // 2. Directional Light (Sun/Moon - Main shadow caster)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    
    // Shadow optimization
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    
    // Make the shadow camera view large enough to cover the play area
    const d = 30;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    
    gameState.scene.add(dirLight);
    gameState.directionalLight = dirLight;
    gameState.lights.push(dirLight);

    // 3. Point Light attached to player (creates dynamic glow on tiles)
    // We create it here but it will be updated in game loop to follow player
    const playerLight = new THREE.PointLight(0xff00cc, 2.0, 15);
    playerLight.castShadow = false; // Too expensive for moving point light usually
    gameState.scene.add(playerLight);
    
    // Store reference in gameState to update position later
    gameState.playerLight = playerLight;
}

export function updateLighting() {
    if (gameState.player && gameState.playerLight) {
        gameState.playerLight.position.copy(gameState.player.mesh.position);
        gameState.playerLight.position.y += 1.0; // Slightly above player
        
        // Dynamic Directional Light following
        if (gameState.directionalLight) {
            const targetZ = gameState.player.mesh.position.z;
            gameState.directionalLight.position.z = targetZ + 10;
            gameState.directionalLight.target.position.z = targetZ - 10;
            gameState.directionalLight.target.updateMatrixWorld();
        }
    }
}