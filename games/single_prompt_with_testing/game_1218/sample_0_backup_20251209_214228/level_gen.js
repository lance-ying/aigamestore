/**
 * level_gen.js
 * Procedurally generates the tower level.
 */

import { gameState, WORLD_WIDTH, WORLD_HEIGHT, CANVAS_HEIGHT } from './globals.js';
import { Platform, Enemy, Collectible } from './entities.js';

export function generateLevel(p) {
    gameState.platforms = [];
    gameState.enemies = [];
    gameState.collectibles = [];
    
    // 1. Floor
    gameState.platforms.push(new Platform(WORLD_WIDTH/2, WORLD_HEIGHT + 10, WORLD_WIDTH + 100, 40, 'SOLID'));
    
    // 2. Walls
    gameState.platforms.push(new Platform(-10, WORLD_HEIGHT/2, 20, WORLD_HEIGHT + 100, 'SOLID'));
    gameState.platforms.push(new Platform(WORLD_WIDTH + 10, WORLD_HEIGHT/2, 20, WORLD_HEIGHT + 100, 'SOLID'));
    
    // 3. Platforms
    let currentY = WORLD_HEIGHT - 100;
    const maxJumpHeight = 120; // Approx max jump
    
    while (currentY > 100) { // Leave room at top for boss area (simulated)
        // Decide platform layout for this 'slice'
        const type = Math.random();
        
        if (type < 0.3) {
            // Single center platform
            const w = 150 + Math.random() * 100;
            const x = WORLD_WIDTH/2 + (Math.random() - 0.5) * 100;
            gameState.platforms.push(new Platform(x, currentY, w, 20, 'ONE_WAY'));
            spawnEnemyOnPlatform(x, currentY, w);
        } else if (type < 0.7) {
            // Two side platforms
            const w = 100 + Math.random() * 50;
            gameState.platforms.push(new Platform(100 + Math.random()*50, currentY, w, 20, 'ONE_WAY'));
            gameState.platforms.push(new Platform(WORLD_WIDTH - (100 + Math.random()*50), currentY, w, 20, 'ONE_WAY'));
            
            if (Math.random() < 0.5) spawnEnemyOnPlatform(100, currentY, w);
            else spawnEnemyOnPlatform(WORLD_WIDTH - 100, currentY, w);
        } else {
            // Steps
            gameState.platforms.push(new Platform(WORLD_WIDTH/3, currentY, 80, 20, 'ONE_WAY'));
            gameState.platforms.push(new Platform(2*WORLD_WIDTH/3, currentY - 40, 80, 20, 'ONE_WAY'));
        }
        
        // Spawn collectibles
        if (Math.random() < 0.2) {
             gameState.collectibles.push(new Collectible(Math.random() * (WORLD_WIDTH - 40) + 20, currentY - 30, 'GEM'));
        }
        if (Math.random() < 0.05) {
             gameState.collectibles.push(new Collectible(Math.random() * (WORLD_WIDTH - 40) + 20, currentY - 30, 'WEAPON'));
        }

        // Move up
        currentY -= (60 + Math.random() * 40);
    }
    
    // Top Goal Area
    gameState.platforms.push(new Platform(WORLD_WIDTH/2, 100, 300, 20, 'SOLID'));
    gameState.collectibles.push(new Collectible(WORLD_WIDTH/2, 50, 'GEM'));
}

function spawnEnemyOnPlatform(x, y, w) {
    if (Math.random() < 0.5) {
        const typeRoll = Math.random();
        let type = 'SLIME';
        if (typeRoll < 0.3) type = 'BAT';
        else if (typeRoll < 0.6) type = 'SHOOTER';
        
        // Spawn slightly above platform
        gameState.enemies.push(new Enemy(x, y - 30, type));
    }
}