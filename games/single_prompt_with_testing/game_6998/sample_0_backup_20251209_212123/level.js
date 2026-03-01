/**
 * level.js
 * Procedural level generation.
 */
import { Platform, Enemy, Collectible, Portal } from './entities.js';
import { gameState, TILE_SIZE, CANVAS_HEIGHT } from './globals.js';

export function generateLevel() {
    gameState.platforms = [];
    gameState.enemies = [];
    gameState.collectibles = [];
    gameState.decorations = [];
    
    let currentX = 0;
    const groundY = CANVAS_HEIGHT - TILE_SIZE;
    
    // Start Platform
    gameState.platforms.push(new Platform(0, groundY, TILE_SIZE * 10, TILE_SIZE));
    currentX += TILE_SIZE * 10;
    
    // Generate segments
    for (let i = 0; i < 30; i++) {
        const segmentType = Math.floor(Math.random() * 5);
        
        switch (segmentType) {
            case 0: // Flat ground with enemy
                gameState.platforms.push(new Platform(currentX, groundY, TILE_SIZE * 5, TILE_SIZE));
                if (Math.random() > 0.3) {
                    gameState.enemies.push(new Enemy(currentX + TILE_SIZE * 2, groundY - 30));
                }
                currentX += TILE_SIZE * 5;
                break;
                
            case 1: // Gap
                currentX += TILE_SIZE * 3; // Gap size
                gameState.platforms.push(new Platform(currentX, groundY, TILE_SIZE * 3, TILE_SIZE));
                currentX += TILE_SIZE * 3;
                break;
                
            case 2: // Staircase up
                gameState.platforms.push(new Platform(currentX, groundY - TILE_SIZE * 2, TILE_SIZE * 3, TILE_SIZE));
                gameState.collectibles.push(new Collectible(currentX + TILE_SIZE, groundY - TILE_SIZE * 3.5));
                currentX += TILE_SIZE * 4;
                break;
                
            case 3: // Floating platforms
                gameState.platforms.push(new Platform(currentX, groundY - TILE_SIZE * 3, TILE_SIZE * 2, TILE_SIZE));
                if (Math.random() > 0.5) {
                    gameState.enemies.push(new Enemy(currentX, groundY - TILE_SIZE * 3 - 30));
                }
                currentX += TILE_SIZE * 3;
                break;
                
            case 4: // Bounce Pad Area
                gameState.platforms.push(new Platform(currentX, groundY, TILE_SIZE * 2, TILE_SIZE, 'BOUNCE'));
                // Collectible high up
                gameState.collectibles.push(new Collectible(currentX + TILE_SIZE, groundY - TILE_SIZE * 6));
                currentX += TILE_SIZE * 3;
                break;
        }
    }
    
    // Final platform and Goal
    gameState.platforms.push(new Platform(currentX, groundY, TILE_SIZE * 10, TILE_SIZE));
    gameState.goal = new Portal(currentX + TILE_SIZE * 5, groundY - 80);
    gameState.entities.push(gameState.goal); // Add to general entities update if needed
}