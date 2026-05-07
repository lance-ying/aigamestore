import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';
import { Platform, Rotator, FinishLine, Bot } from './entities.js';

export function createLevel() {
    const level = gameState.currentLevel || 1;
    
    if (level === 1) return createLevel1();
    if (level === 2) return createLevel2();
    if (level === 3) return createLevel3();
    
    return createLevel1();
}

function createLevel1() {
    // 1. Start Platform
    new Platform(0, 0, 0, 30, 2, 20, 0xFF0055); // Pink start
    gameState.checkpoints.push(new THREE.Vector3(0, 5, 0));
    
    // 2. Ramp Down
    for(let i=1; i<=5; i++) {
        new Platform(0, -i, -10 - (i*2), 30, 1, 2, 0x00AAFF);
    }
    
    // 3. The Spinner Field
    new Platform(0, -6, -40, 40, 2, 40, 0xFFDD00); // Yellow floor
    gameState.checkpoints.push(new THREE.Vector3(0, -4, -40));
    
    new Rotator(-10, -5, -30, 12, 2.0);
    new Rotator(10, -5, -30, 12, -2.0);
    new Rotator(0, -5, -45, 15, 3.0);
    
    // 4. Narrow Bridge
    new Platform(0, -6, -70, 4, 1, 20, 0xAA00FF);
    
    // 5. Final Climb
    for(let i=0; i<10; i++) {
        new Platform(0, -6 + i, -85 - (i*2), 15, 1, 2, 0x00FF66);
    }
    
    // 6. Finish Line Platform
    new Platform(0, 4, -115, 30, 2, 20, 0xFFFFFF);
    new FinishLine(0, 5, -120, 20);
    
    // Waypoints for Bots
    return [
        new THREE.Vector3(0, 0, -20),
        new THREE.Vector3(0, -6, -40),
        new THREE.Vector3(0, -6, -60),
        new THREE.Vector3(0, -6, -80),
        new THREE.Vector3(0, 4, -110),
        new THREE.Vector3(0, 4, -125)
    ];
}

function createLevel2() {
    // Level 2: "Zig Zag and Spin"
    
    // Start
    new Platform(0, 0, 0, 30, 2, 20, 0x00AAFF); // Cyan
    gameState.checkpoints.push(new THREE.Vector3(0, 5, 0));
    
    // Gap jump
    new Platform(0, 0, -25, 10, 2, 10, 0xFFDD00);
    
    // Zig Zag path with hammers
    new Platform(-10, 0, -45, 20, 2, 10, 0xFF0055);
    new Rotator(-10, 1, -45, 10, 3.0);
    
    new Platform(10, 0, -65, 20, 2, 10, 0xAA00FF);
    new Rotator(10, 1, -65, 10, -3.0);
    
    new Platform(0, 0, -85, 10, 2, 10, 0x00FF66);
    
    // Long bridge with spinner
    new Platform(0, 0, -110, 4, 2, 30, 0xFFFFFF);
    new Rotator(0, 1, -110, 15, 4.0);
    
    // Finish
    new Platform(0, 0, -135, 30, 2, 20, 0xFFDD00);
    new FinishLine(0, 1, -140, 20);
    
    return [
        new THREE.Vector3(0, 0, -25),
        new THREE.Vector3(-10, 0, -45),
        new THREE.Vector3(10, 0, -65),
        new THREE.Vector3(0, 0, -85),
        new THREE.Vector3(0, 0, -110),
        new THREE.Vector3(0, 0, -145)
    ];
}

function createLevel3() {
    // Level 3: "Vertical Climb"
    
    // Start
    new Platform(0, 0, 0, 30, 2, 20, 0xAA00FF); // Purple
    gameState.checkpoints.push(new THREE.Vector3(0, 5, 0));
    
    // Stairs
    for(let i=0; i<8; i++) {
        new Platform(0, i*2, -15 - (i*4), 10, 1, 3, 0xFF0055);
    }
    
    // High platform
    new Platform(0, 16, -55, 20, 2, 20, 0x00AAFF);
    gameState.checkpoints.push(new THREE.Vector3(0, 18, -55));
    
    // Narrow beams
    new Platform(-8, 16, -75, 2, 1, 15, 0xFFDD00);
    new Platform(8, 16, -75, 2, 1, 15, 0xFFDD00);
    
    // Final platform
    new Platform(0, 16, -100, 30, 2, 20, 0x00FF66);
    new Rotator(0, 17, -95, 20, 5.0); // Guarding the finish
    
    new FinishLine(0, 17, -105, 20);
    
    return [
        new THREE.Vector3(0, 0, -15),
        new THREE.Vector3(0, 16, -55),
        new THREE.Vector3(-8, 16, -75), // Bot takes left path
        new THREE.Vector3(0, 16, -100),
        new THREE.Vector3(0, 16, -110)
    ];
}

export function spawnBots(count, waypoints) {
    for (let i = 0; i < count; i++) {
        const offsetX = (Math.random() - 0.5) * 20;
        const offsetZ = (Math.random() - 0.5) * 10;
        new Bot(offsetX, 3, offsetZ, waypoints);
    }
}