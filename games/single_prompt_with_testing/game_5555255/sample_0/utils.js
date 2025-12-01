import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, logs } from './globals.js';

// Seeded random number generator wrapper
// Assumes Math.seedrandom has been called in setup
export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

export function logGameInfo(status, data = {}) {
    logs.game_info.push({
        game_status: status,
        data: data,
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}

export function logPlayerInfo() {
    if (!gameState.player) return;
    
    // Project player position to screen coordinates for logging
    const vector = gameState.player.mesh.position.clone();
    vector.project(gameState.camera);
    
    logs.player_info.push({
        screen_x: (vector.x + 1) * 600 / 2,
        screen_y: -(vector.y - 1) * 400 / 2,
        game_x: gameState.player.mesh.position.x,
        game_y: gameState.player.mesh.position.y,
        game_z: gameState.player.mesh.position.z,
        velocity_x: gameState.player.velocity.x,
        velocity_y: gameState.player.velocity.y,
        velocity_z: gameState.player.velocity.z,
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}

export function logInput(type, key, code) {
    logs.inputs.push({
        input_type: type,
        data: { key, keyCode: code },
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}

// Helper to create simple materials
export function createMaterial(color, type = 'standard') {
    if (type === 'basic') return new THREE.MeshBasicMaterial({ color });
    if (type === 'phong') return new THREE.MeshPhongMaterial({ color, shininess: 60 });
    return new THREE.MeshStandardMaterial({ 
        color, 
        roughness: 0.4, 
        metalness: 0.3 
    });
}