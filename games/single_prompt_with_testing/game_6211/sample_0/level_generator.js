// level_generator.js
// Procedural generation of level segments

import { Platform, Coin, Enemy, GoalPost } from './entities.js';
import { CANVAS_HEIGHT, CANVAS_WIDTH, TILE_SIZE, gameState } from './globals.js';

export function generateLevel(p) {
    // Reset lists
    gameState.platforms = [];
    gameState.entities = [];
    gameState.coins = []; // Keep track separately for easier looping? Or just use entities.
    // We'll filter entities for update/draw
    
    let currentX = 0;
    const groundY = CANVAS_HEIGHT - TILE_SIZE * 2;
    
    // 1. Start Platform
    createPlatform(currentX, groundY, 10, 'GROUND');
    currentX += 10 * TILE_SIZE;
    
    // 2. Procedural Segments
    const numSegments = 30; // Length of level
    
    for (let i = 0; i < numSegments; i++) {
        const r = p.random();
        
        if (r < 0.3) {
            // Gap
            const gapSize = Math.floor(p.random(2, 5)); // 2 to 4 tiles
            currentX += gapSize * TILE_SIZE;
            
            // Landing platform
            createPlatform(currentX, groundY, 5, 'GROUND');
            currentX += 5 * TILE_SIZE;
            
        } else if (r < 0.6) {
            // Stairs / High Platform
            // Base
            createPlatform(currentX, groundY, 8, 'GROUND');
            
            // Elevated platform
            const height = Math.floor(p.random(2, 5)) * TILE_SIZE;
            createPlatform(currentX + 2 * TILE_SIZE, groundY - height, 4, 'BRICK');
            
            // Add Coins
            createCoins(currentX + 2 * TILE_SIZE, groundY - height - TILE_SIZE, 4);
            
            // Add Enemy
            if (p.random() > 0.5) {
                const enemy = new Enemy(currentX + 3 * TILE_SIZE, groundY - height - 30);
                gameState.entities.push(enemy);
            }
            
            currentX += 8 * TILE_SIZE;
            
        } else if (r < 0.8) {
            // Wall / Obstacle to wall jump or jump over
            createPlatform(currentX, groundY, 10, 'GROUND');
            
            // Wall
            createPlatform(currentX + 4 * TILE_SIZE, groundY - 3 * TILE_SIZE, 1, 'BRICK', 3); // 3 tiles high
            
            // Coins over wall
            createCoins(currentX + 3 * TILE_SIZE, groundY - 4.5 * TILE_SIZE, 3);
            
            currentX += 10 * TILE_SIZE;
            
        } else {
            // Flat with enemies
            createPlatform(currentX, groundY, 10, 'GROUND');
            
            const enemy = new Enemy(currentX + 5 * TILE_SIZE, groundY - 30);
            gameState.entities.push(enemy);
            
            currentX += 10 * TILE_SIZE;
        }
    }
    
    // 3. Final Platform and Goal
    createPlatform(currentX, groundY, 10, 'GROUND');
    const goalX = currentX + 5 * TILE_SIZE;
    const goal = new GoalPost(goalX, groundY - 200);
    gameState.entities.push(goal);
    
    gameState.levelLength = currentX + 10 * TILE_SIZE;
}

function createPlatform(x, y, wTiles, type, hTiles = 1) {
    const p = new Platform(x, y, wTiles * TILE_SIZE, hTiles * TILE_SIZE, type);
    gameState.platforms.push(p);
}

function createCoins(x, y, count) {
    for (let i = 0; i < count; i++) {
        const c = new Coin(x + i * 30, y);
        gameState.entities.push(c);
    }
}