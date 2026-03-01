/**
 * Procedural Level Generator
 * Stitches together pre-defined segments to create a level.
 */

import { gameState, TILE_SIZE, COLORS, CANVAS_HEIGHT, LEVEL_LENGTH } from './globals.js';
import { Platform, Spike, Collectible, Goal } from './entities.js';

export function generateLevel(p) {
    // Reset lists
    gameState.platforms = [];
    gameState.obstacles = [];
    gameState.collectibles = [];
    
    // Starting Platform
    let currentX = 50;
    let currentY = CANVAS_HEIGHT - 100;
    
    addPlatform(currentX, currentY, 400, 40, 'NORMAL');
    currentX += 400;

    // Generate segments
    const segmentCount = 15;
    
    for (let i = 0; i < segmentCount; i++) {
        // Random segment type
        const r = p.random();
        
        // Add gap
        currentX += p.random(50, 150);
        
        // Adjust height slightly
        currentY += p.random(-80, 80);
        currentY = Math.min(Math.max(currentY, 200), CANVAS_HEIGHT - 50);

        if (r < 0.3) {
            createStandardSegment(currentX, currentY, p);
            currentX += 300;
        } else if (r < 0.5) {
            createBouncySegment(currentX, currentY, p);
            currentX += 300;
        } else if (r < 0.7) {
            createMovingSegment(currentX, currentY, p);
            currentX += 400;
        } else if (r < 0.85) {
             createSpikeField(currentX, currentY, p);
             currentX += 500;
        } else {
            createVanishingBridge(currentX, currentY, p);
            currentX += 400;
        }
    }
    
    // Final Goal Platform
    currentX += 100;
    addPlatform(currentX, currentY, 200, 40, 'NORMAL');
    const goal = new Goal(currentX + 70, currentY - 80);
    gameState.entities.push(goal);
    gameState.goal = goal; // Quick ref
}

function addPlatform(x, y, w, h, type) {
    const plat = new Platform(x, y, w, h, type);
    gameState.platforms.push(plat);
    gameState.entities.push(plat);
    
    // Chance to add orb
    if (Math.random() > 0.5 && type !== 'MOVING') {
        const orb = new Collectible(x + w/2, y - 40);
        gameState.collectibles.push(orb);
        gameState.entities.push(orb);
    }
}

function createStandardSegment(x, y, p) {
    addPlatform(x, y, 300, 40, 'NORMAL');
    // Maybe an obstacle on top
    if (p.random() > 0.5) {
        const spike = new Spike(x + 150, y - 30);
        gameState.obstacles.push(spike);
        gameState.entities.push(spike);
    }
}

function createBouncySegment(x, y, p) {
    addPlatform(x, y, 100, 40, 'BOUNCY');
    // High platform after bounce
    addPlatform(x + 150, y - 150, 150, 40, 'NORMAL');
}

function createMovingSegment(x, y, p) {
    addPlatform(x, y, 100, 20, 'MOVING');
    addPlatform(x + 250, y, 100, 40, 'NORMAL');
}

function createVanishingBridge(x, y, p) {
    for(let i=0; i<4; i++) {
        addPlatform(x + i*80, y, 60, 20, 'VANISHING');
    }
}

function createSpikeField(x, y, p) {
    addPlatform(x, y, 500, 40, 'NORMAL');
    for(let i=0; i<3; i++) {
        const spike = new Spike(x + 100 + i*100, y - 30);
        gameState.obstacles.push(spike);
        gameState.entities.push(spike);
    }
}