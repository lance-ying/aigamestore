/**
 * Procedural Level Generation
 */
import { Platform, Hazard, Collectible } from './entities.js';
import { gameState, CANVAS_HEIGHT, TILE_SIZE, LEVEL_LENGTH } from './globals.js';

export function setupLevel() {
    gameState.platforms = [];
    gameState.hazards = [];
    gameState.collectibles = [];
    
    // Start Platform
    gameState.platforms.push(new Platform(0, 300, 400, 40, 'NORMAL'));
    
    let currentX = 400;
    let currentY = 300;
    
    // Generate segments
    while(currentX < LEVEL_LENGTH) {
        // Decide next segment type
        let r = Math.random();
        let gap = 50 + Math.random() * 100;
        
        // Randomize height slightly
        currentY = Math.max(100, Math.min(CANVAS_HEIGHT - 100, currentY + (Math.random() - 0.5) * 100));
        
        currentX += gap;
        
        let width = 100 + Math.random() * 200;
        
        if (r < 0.6) {
            // Normal Platform
            gameState.platforms.push(new Platform(currentX, currentY, width, 40, 'NORMAL'));
            // Maybe a collectible?
            if (Math.random() > 0.5) {
                gameState.collectibles.push(new Collectible(currentX + width/2, currentY - 40));
            }
        } else if (r < 0.8) {
            // Bouncy Platform
            gameState.platforms.push(new Platform(currentX, currentY, width, 40, 'BOUNCY'));
            // Hazard below?
            if (gap > 80) {
                 gameState.hazards.push(new Hazard(currentX - gap, CANVAS_HEIGHT - 20, gap, 20));
            }
        } else if (r < 0.9) {
            // Moving Platform
            gameState.platforms.push(new Platform(currentX, currentY, width, 20, 'MOVING'));
        } else {
            // Hazard Platform (Spike pit then platform)
             gameState.hazards.push(new Hazard(currentX - gap/2 - 20, currentY + 50, 40, 40));
             gameState.platforms.push(new Platform(currentX, currentY, width, 40, 'NORMAL'));
        }
        
        currentX += width;
    }
    
    // Final Platform
    gameState.platforms.push(new Platform(LEVEL_LENGTH + 100, 250, 300, 40, 'NORMAL'));
}