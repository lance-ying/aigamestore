import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';
import { Platform, Rotator, FinishLine, Bot } from './entities.js';

export function createLevel() {
    // 1. Start Platform
    new Platform(0, 0, 0, 30, 2, 20, 0xFF0055); // Pink start
    gameState.checkpoints.push(new THREE.Vector3(0, 5, 0));
    
    // 2. Ramp Down
    // create a ramp by rotating a platform or placing steps
    // Steps are easier for collision stability
    for(let i=1; i<=5; i++) {
        new Platform(0, -i, -10 - (i*2), 30, 1, 2, 0x00AAFF);
    }
    
    // 3. The Spinner Field
    new Platform(0, -6, -40, 40, 2, 40, 0xFFDD00); // Yellow floor
    gameState.checkpoints.push(new THREE.Vector3(0, -4, -40));
    
    new Rotator(-10, -5, -30, 12, 2.0);
    new Rotator(10, -5, -30, 12, -2.0);
    new Rotator(0, -5, -45, 15, 3.0);
    
    // 4. Narrow Bridge with moving blockers (simulated by rotators below ground with long arms?)
    // Or just simple narrow paths
    new Platform(0, -6, -70, 4, 1, 20, 0xAA00FF);
    
    // 5. Final Climb
    for(let i=0; i<10; i++) {
        new Platform(0, -6 + i, -85 - (i*2), 15, 1, 2, 0x00FF66);
    }
    
    // 6. Finish Line Platform
    new Platform(0, 4, -115, 30, 2, 20, 0xFFFFFF);
    new FinishLine(0, 5, -120, 20);
    
    // Waypoints for Bots
    const waypoints = [
        new THREE.Vector3(0, 0, -20),
        new THREE.Vector3(0, -6, -40), // Spinner center
        new THREE.Vector3(0, -6, -60), // Pre bridge
        new THREE.Vector3(0, -6, -80), // Post bridge
        new THREE.Vector3(0, 4, -110), // Top of stairs
        new THREE.Vector3(0, 4, -125)  // Finish
    ];
    
    return waypoints;
}

export function spawnBots(count, waypoints) {
    for (let i = 0; i < count; i++) {
        const offsetX = (Math.random() - 0.5) * 20;
        const offsetZ = (Math.random() - 0.5) * 10;
        new Bot(offsetX, 3, offsetZ, waypoints);
    }
}