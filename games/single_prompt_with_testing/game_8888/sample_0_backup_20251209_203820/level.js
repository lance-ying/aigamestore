/**
 * Procedural Level Generation.
 * Creates platforms, enemies, and collectibles as the player progresses.
 */

import { gameState, CANVAS_HEIGHT, CANVAS_WIDTH, GROUND_LEVEL } from './globals.js';
import { Platform, Enemy, Collectible } from './entities.js';

let nextSpawnX = 0;

export function initLevel() {
    nextSpawnX = 0;
    
    // Create initial ground
    createPlatformSegment(0, GROUND_LEVEL, CANVAS_WIDTH + 200);
    nextSpawnX = CANVAS_WIDTH + 200;
}

export function updateLevelGen(p) {
    // Generate ahead of the camera
    const generationHorizon = gameState.cameraX + CANVAS_WIDTH * 2;
    
    while (nextSpawnX < generationHorizon) {
        const segmentType = Math.floor(Math.random() * 5);
        const segmentLength = 200 + Math.random() * 300;
        
        if (segmentType === 0) {
            // Gap
            nextSpawnX += 100 + Math.random() * 100;
        } else if (segmentType === 1) {
            // Higher Platform
            createPlatformSegment(nextSpawnX, GROUND_LEVEL - 80, segmentLength);
            spawnEntities(nextSpawnX, GROUND_LEVEL - 80, segmentLength);
            nextSpawnX += segmentLength;
        } else {
            // Normal Ground
            createPlatformSegment(nextSpawnX, GROUND_LEVEL, segmentLength);
            spawnEntities(nextSpawnX, GROUND_LEVEL, segmentLength);
            nextSpawnX += segmentLength;
        }
    }
    
    // Cleanup old entities
    gameState.platforms = gameState.platforms.filter(p => p.x + p.width > gameState.cameraX - 400);
}

function createPlatformSegment(x, y, width) {
    gameState.platforms.push(new Platform(x, y, width, 200));
}

function spawnEntities(x, y, width) {
    // 30% chance for enemy
    if (Math.random() < 0.3) {
        const enemyX = x + Math.random() * (width - 40);
        gameState.enemies.push(new Enemy(enemyX, y - 40, 'cake_hound'));
    }
    
    // 20% chance for flying enemy
    if (Math.random() < 0.2) {
        const enemyX = x + Math.random() * (width - 40);
        gameState.enemies.push(new Enemy(enemyX, y - 120, 'jelly_bat'));
    }
    
    // 50% chance for collectibles (Arc shape or Line)
    if (Math.random() < 0.5) {
        const startX = x + 50;
        for (let i = 0; i < 5; i++) {
            if (startX + i*30 > x + width) break;
            // Parabola of jellies
            const jellyY = (y - 50) - Math.sin(i * 0.5) * 50; 
            gameState.collectibles.push(new Collectible(startX + i * 30, jellyY, 'jelly_red'));
        }
    }
}