/**
 * Hardcoded level layout.
 * Coordinate 0,0 is Top-Left of canvas if camera is at 0.
 * World extends downwards.
 * Ground is at WORLD_HEIGHT - 50.
 */
import { WORLD_HEIGHT, CANVAS_WIDTH } from './globals.js';
import { Platform, Decoration, Artifact } from './entities.js';

export function loadLevel(gameState) {
    gameState.platforms = [];
    gameState.decorations = [];

    // --- Ground Floor ---
    gameState.platforms.push(new Platform(0, WORLD_HEIGHT - 40, CANVAS_WIDTH, 40));
    
    // Walls enclosing the tower
    gameState.platforms.push(new Platform(-20, 0, 20, WORLD_HEIGHT)); // Left wall buffer
    gameState.platforms.push(new Platform(CANVAS_WIDTH, 0, 20, WORLD_HEIGHT)); // Right wall buffer

    // --- Platforms (Bottom to Top) ---
    
    // Screen 6 (Bottom): The Beginning
    gameState.platforms.push(new Platform(200, WORLD_HEIGHT - 150, 200, 20));
    gameState.platforms.push(new Platform(450, WORLD_HEIGHT - 250, 100, 20));
    gameState.platforms.push(new Platform(50, WORLD_HEIGHT - 350, 150, 20));

    // Screen 5: The Ascent
    gameState.platforms.push(new Platform(250, WORLD_HEIGHT - 500, 100, 20));
    gameState.platforms.push(new Platform(400, WORLD_HEIGHT - 650, 100, 20));
    gameState.platforms.push(new Platform(100, WORLD_HEIGHT - 750, 150, 20));

    // Screen 4: Narrow Ledges
    gameState.platforms.push(new Platform(300, WORLD_HEIGHT - 900, 80, 20));
    gameState.platforms.push(new Platform(500, WORLD_HEIGHT - 1050, 80, 20));
    gameState.platforms.push(new Platform(200, WORLD_HEIGHT - 1150, 80, 20));
    
    // Screen 3: The Chimney
    gameState.platforms.push(new Platform(50, WORLD_HEIGHT - 1300, 100, 20));
    gameState.platforms.push(new Platform(450, WORLD_HEIGHT - 1400, 100, 20));
    gameState.platforms.push(new Platform(250, WORLD_HEIGHT - 1500, 100, 20));

    // Screen 2: High Stakes
    gameState.platforms.push(new Platform(100, WORLD_HEIGHT - 1700, 60, 20));
    gameState.platforms.push(new Platform(300, WORLD_HEIGHT - 1800, 60, 20));
    gameState.platforms.push(new Platform(500, WORLD_HEIGHT - 1900, 60, 20));

    // Screen 1: The Peak
    gameState.platforms.push(new Platform(200, 200, 200, 20)); // Final Platform
    
    // Artifact at top
    gameState.decorations.push(new Artifact(300, 150));

    // --- Decorations ---
    // Random clouds background
    for(let y = 0; y < WORLD_HEIGHT; y += 300) {
        gameState.decorations.push(new Decoration(Math.random() * CANVAS_WIDTH, y, "CLOUD"));
    }
    
    // Torches
    gameState.decorations.push(new Decoration(100, WORLD_HEIGHT - 80, "TORCH"));
    gameState.decorations.push(new Decoration(500, WORLD_HEIGHT - 80, "TORCH"));
    gameState.decorations.push(new Decoration(300, 180, "TORCH"));
}