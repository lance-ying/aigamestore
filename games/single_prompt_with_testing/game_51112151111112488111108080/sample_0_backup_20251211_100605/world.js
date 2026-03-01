import { Platform, Collectible } from './entities.js';
import { gameState, COLORS } from './globals.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export function setupLevel(levelIndex) {
    // Basic ground
    // Start platform
    new Platform(0, -1, 0, 10, 2, 5);
    
    // Procedurally generate a track
    let currentX = 5;
    let currentY = -1;
    
    const seededRandom = new Math.seedrandom(`level_${levelIndex}`);
    
    // Increase length slightly with level
    const length = 20 + Math.min(30, levelIndex * 2);
    
    for (let i = 0; i < length; i++) {
        // Difficulty scaling
        const difficulty = Math.min(1.0, levelIndex * 0.1);
        
        // Reduced gap size and increased platform width for better playability
        // Scale gap with difficulty
        const gap = (1.5 + seededRandom() * 2.0) * (1 + difficulty * 0.2); 
        const width = Math.max(3.0, (4.5 + seededRandom() * 4.0) - difficulty);
        const heightChange = (seededRandom() - 0.5) * (4 + difficulty * 2);
        
        currentX += gap + width / 2;
        currentY += heightChange;
        
        // Clamp Y
        currentY = Math.max(-5, Math.min(5, currentY));
        
        new Platform(currentX, currentY, 0, width, 2, 4);
        
        // Add collectibles
        if (seededRandom() > 0.3) {
            new Collectible(currentX, currentY + 2.5, 0);
        }
        
        // Add hazards
        // Increase hazard chance with difficulty
        if (i > 5 && seededRandom() > (0.7 - difficulty * 0.2)) {
            // Spikes or blocking block
             new Platform(currentX, currentY + 1.5, 0, 0.5, 1, 4, 'hazard');
        }
        
        currentX += width / 2;
    }
    
    // Goal Platform
    currentX += 5;
    new Platform(currentX, currentY, 0, 6, 2, 6, 'goal');
    
    // Background decoration (far away static meshes)
    for(let i=0; i<10 + levelIndex; i++) {
        const bgGeo = new THREE.BoxGeometry(2, 10 + Math.random() * 20, 2);
        const bgMat = new THREE.MeshStandardMaterial({ color: 0x111122 });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        bg.position.set(i * 15 - 20, -10, -15);
        gameState.scene.add(bg);
        gameState.entities.push({ mesh: bg, update: () => {} }); // Passive entity
    }
}