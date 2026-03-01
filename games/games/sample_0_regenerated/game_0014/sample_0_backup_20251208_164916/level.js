/**
 * level.js
 * Procedural generation for the game world.
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Interactable } from './entities.js';

class Platform {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }
}

export function generateLevel() {
    gameState.platforms = [];
    gameState.interactables = [];
    
    // 1. Ground Floor
    // Create a long ground with some gaps
    let x = 0;
    while (x < gameState.worldWidth) {
        const gap = Math.random() > 0.8; // 20% chance of gap
        const width = Math.random() * 400 + 200;
        
        if (!gap) {
            gameState.platforms.push(new Platform(x, gameState.worldHeight - 50, width, 50));
        }
        x += width + (gap ? 100 : 0);
    }
    
    // 2. Floating Platforms
    const numPlatforms = 20;
    for (let i = 0; i < numPlatforms; i++) {
        const px = Math.random() * (gameState.worldWidth - 200);
        const py = Math.random() * (gameState.worldHeight - 200) + 100;
        const pw = Math.random() * 200 + 100;
        
        gameState.platforms.push(new Platform(px, py, pw, 20));
        
        // Chance to spawn chest on platform
        if (Math.random() < 0.3) {
            // Simple cost scaling with distance
            const cost = 25 + Math.floor(px / 100); 
            gameState.interactables.push(new Interactable(px + pw/2 - 15, py - 30, 30, 30, 'CHEST', cost));
        }
    }
    
    // 3. Place Teleporter (Far right side usually)
    const tpX = Math.random() * 500 + (gameState.worldWidth - 600);
    // Find ground y at this X
    let tpY = gameState.worldHeight - 110; // Default
    
    // Check if on a platform
    for (const p of gameState.platforms) {
        if (tpX > p.x && tpX < p.x + p.width) {
             // Adjust Y to sit on platform if it's high enough?
             // For simplicity, just place it on the ground floor or a specific high platform logic.
             // We'll place it on the 'Ground' layer mostly to ensure accessibility.
             if (p.y > gameState.worldHeight - 100) {
                 tpY = p.y - 60;
                 break;
             }
        }
    }
    
    gameState.teleporter = new Interactable(tpX, tpY, 80, 60, 'TELEPORTER', 0);
    gameState.interactables.push(gameState.teleporter);
}