/**
 * level_generator.js
 * Generates the game level procedurally or via predefined blocks.
 */

import { gameState, CANVAS_HEIGHT, CANVAS_WIDTH } from './globals.js';
import { Platform, Enemy, Collectible } from './entities.js';

export function initLevel() {
    // Clear old
    gameState.platforms = [];
    gameState.enemies = [];
    gameState.collectibles = [];
    
    // Ground
    new Platform(0, CANVAS_HEIGHT - 40, 600, 40, "SOLID");
    
    let curX = 600;
    const groundY = CANVAS_HEIGHT - 40;
    
    // Generate chunks
    for (let i = 0; i < 20; i++) {
        const type = Math.floor(Math.random() * 4);
        const gap = 50 + Math.random() * 100;
        
        if (type === 0) {
            // Standard Ground
            new Platform(curX, groundY, 400, 40, "SOLID");
            // Enemy
            if (Math.random() > 0.5) new Enemy(curX + 200, groundY - 40, "WALKER");
            curX += 400 + gap;
        } else if (type === 1) {
            // Steps up
            new Platform(curX, groundY - 50, 100, 20, "SOLID");
            new Platform(curX + 150, groundY - 100, 100, 20, "SOLID");
            new Platform(curX + 300, groundY - 50, 100, 20, "SOLID");
            
            new Collectible(curX + 180, groundY - 140);
            
            curX += 450 + gap;
        } else if (type === 2) {
            // Floating Islands with Flyers
            new Platform(curX, groundY - 80, 80, 20, "SOLID");
            new Platform(curX + 150, groundY - 150, 80, 20, "SOLID");
            
            new Enemy(curX + 100, groundY - 200, "FLYER");
            
            curX += 300 + gap;
        } else {
            // Long gap with hook point
            // Ceiling block for hooking
            new Platform(curX + gap/2, 100, 50, 50, "SOLID");
            
            // Landing pad
            new Platform(curX + gap + 100, groundY, 200, 40, "SOLID");
            
            curX += gap + 300;
        }
    }
    
    // Final platform
    new Platform(curX, groundY, 500, 40, "SOLID");
    // Flag or goal logic could be added here
}