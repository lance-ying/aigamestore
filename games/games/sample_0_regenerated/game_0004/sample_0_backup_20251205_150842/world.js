/**
 * Procedural generation system.
 * Generates platforms, enemies, and items as the player descends.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, WIN_DEPTH } from './globals.js';
import { Platform, Enemy, Gem } from './entities.js';

const CHUNK_HEIGHT = 400;

/**
 * Updates world generation based on player depth.
 */
export function updateWorldGeneration() {
    // Generate ahead of the camera
    const generationHorizon = gameState.cameraY + CANVAS_HEIGHT * 2;
    
    while (gameState.worldGeneratedDepth < generationHorizon) {
        generateChunk(gameState.worldGeneratedDepth);
        gameState.worldGeneratedDepth += CHUNK_HEIGHT;
    }
    
    cleanupEntities();
}

/**
 * Clean up entities that are too far above the camera to save memory.
 */
function cleanupEntities() {
    const deleteThreshold = gameState.cameraY - 400;
    
    gameState.platforms = gameState.platforms.filter(e => e.y > deleteThreshold);
    gameState.enemies = gameState.enemies.filter(e => e.y > deleteThreshold);
    gameState.collectibles = gameState.collectibles.filter(e => e.y > deleteThreshold);
    // Projectiles manage their own lifetime
}

/**
 * Generates a single chunk of content.
 * @param {number} yStart - The Y coordinate to start generating from
 */
function generateChunk(yStart) {
    // Determine difficulty/density based on depth
    const difficulty = Math.min(1.0, yStart / WIN_DEPTH);
    
    // Always side walls for the "Well" feel
    const wallWidth = 30;
    gameState.platforms.push(new Platform(0, yStart, wallWidth, CHUNK_HEIGHT));
    gameState.platforms.push(new Platform(CANVAS_WIDTH - wallWidth, yStart, wallWidth, CHUNK_HEIGHT));
    
    // Procedural Patterns
    const pattern = Math.floor(Math.random() * 4);
    
    switch(pattern) {
        case 0: // Scattered Platforms
            for (let i = 0; i < 4; i++) {
                const px = Math.random() * (CANVAS_WIDTH - 200) + 50;
                const py = yStart + i * 100 + Math.random() * 50;
                const w = Math.random() * 80 + 60;
                gameState.platforms.push(new Platform(px, py, w, 20, Math.random() > 0.7));
                
                // Chance for enemy
                if (Math.random() < 0.3 + difficulty * 0.3) {
                    gameState.enemies.push(new Enemy(px + w/2, py - 40, 'CRAWLER'));
                }
                
                // Chance for gem
                if (Math.random() < 0.2) {
                    gameState.collectibles.push(new Gem(px + w/2, py - 40));
                }
            }
            break;
            
        case 1: // Central Column
            gameState.platforms.push(new Platform(CANVAS_WIDTH/2 - 40, yStart + 100, 80, 200, true));
             // Gems on sides
            gameState.collectibles.push(new Gem(CANVAS_WIDTH/2 - 80, yStart + 150));
            gameState.collectibles.push(new Gem(CANVAS_WIDTH/2 + 80, yStart + 150));
            // Flyer enemies
            gameState.enemies.push(new Enemy(CANVAS_WIDTH/2, yStart + 50, 'FLYER'));
            break;
            
        case 2: // Tight Squeeze
             gameState.platforms.push(new Platform(0, yStart + 100, CANVAS_WIDTH/2 - 30, 20));
             gameState.platforms.push(new Platform(CANVAS_WIDTH/2 + 30, yStart + 250, CANVAS_WIDTH/2, 20));
             
             gameState.enemies.push(new Enemy(100, yStart + 80, 'CRAWLER'));
             gameState.enemies.push(new Enemy(CANVAS_WIDTH - 100, yStart + 230, 'CRAWLER'));
             break;
             
        case 3: // Open Fall (Gem Shower)
             for(let i=0; i<5; i++) {
                 gameState.collectibles.push(new Gem(Math.random() * (CANVAS_WIDTH-100) + 50, yStart + i*80));
             }
             // Dangerous flyers
             gameState.enemies.push(new Enemy(CANVAS_WIDTH/2, yStart + 200, 'FLYER'));
             gameState.enemies.push(new Enemy(CANVAS_WIDTH/3, yStart + 300, 'FLYER'));
             break;
    }
    
    // Check Win Condition Depth (add a bottom floor)
    if (yStart > WIN_DEPTH && !gameState.platforms.some(p => p.y >= WIN_DEPTH + 400)) {
        gameState.platforms.push(new Platform(0, WIN_DEPTH + 400, CANVAS_WIDTH, 50));
        // Add win trigger mechanism conceptually (e.g., specific item or just depth check in game loop)
    }
}