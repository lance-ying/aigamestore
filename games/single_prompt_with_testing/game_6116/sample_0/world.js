// world.js
// Level Generation and Management

import { Platform, Decoration } from './entities.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function generateWorld() {
    const platforms = [];
    const decorations = [];
    
    // World Dimensions
    // Height: 0 is top, WorldHeight is bottom.
    // We want the ground at worldHeight.
    const groundY = gameState.worldHeight - 50;
    
    // 1. The Ground Floor
    platforms.push(new Platform(0, groundY, CANVAS_WIDTH, 100)); // Base floor
    platforms.push(new Platform(0, 0, 50, gameState.worldHeight, "wall")); // Left Wall
    platforms.push(new Platform(CANVAS_WIDTH - 50, 0, 50, gameState.worldHeight, "wall")); // Right Wall
    
    // 2. Generate Platforms (Tower)
    // We'll generate "screens" worth of platforms
    
    let currentY = groundY - 100;
    
    // Section 1: Tutorial Jumps (Easy)
    platforms.push(new Platform(150, currentY, 150, 20));
    currentY -= 80;
    platforms.push(new Platform(300, currentY, 150, 20));
    currentY -= 100;
    platforms.push(new Platform(100, currentY, 100, 20)); // Small gap
    
    // Section 2: Zig Zag
    for (let i = 0; i < 5; i++) {
        currentY -= 90;
        const isLeft = i % 2 === 0;
        const x = isLeft ? 60 : CANVAS_WIDTH - 210;
        platforms.push(new Platform(x, currentY, 150, 20));
    }
    
    // Section 3: Pillars (Precision)
    currentY -= 120;
    platforms.push(new Platform(50, currentY, 500, 20)); // Rest stop
    
    for (let i = 0; i < 8; i++) {
        currentY -= 110;
        const x = 100 + (i % 3) * 150;
        platforms.push(new Platform(x, currentY, 60, 20));
    }
    
    // Section 4: The Summit
    currentY -= 150;
    platforms.push(new Platform(200, currentY, 200, 20)); // Goal Platform
    
    // Goal Item (represented logically, rendered in game.js or entities)
    gameState.goalPosition = { x: 300, y: currentY - 40 };

    // 3. Decorations
    for (let i = 0; i < 100; i++) {
        decorations.push(new Decoration(
            Math.random() * CANVAS_WIDTH,
            Math.random() * gameState.worldHeight,
            "star"
        ));
    }
    
    for (let i = 0; i < 20; i++) {
        decorations.push(new Decoration(
            Math.random() * CANVAS_WIDTH,
            Math.random() * gameState.worldHeight,
            "cloud"
        ));
    }

    gameState.platforms = platforms;
    gameState.decorations = decorations;
    
    return { groundY };
}

export function updateCamera() {
    // Camera Logic
    // In Jump King, camera snaps to screens usually.
    // Here we will use a smooth follow with clamping to "screens" to mimic the feel but be smoother.
    // Or just smooth follow with Y offset.
    
    if (!gameState.player) return;
    
    // Target Y: Keep player centered vertically
    let targetY = gameState.player.y - CANVAS_HEIGHT / 2;
    
    // Clamp to world bounds
    targetY = Math.max(0, Math.min(targetY, gameState.worldHeight - CANVAS_HEIGHT));
    
    // Smooth lerp
    gameState.camera.y += (targetY - gameState.camera.y) * 0.1;
    
    // X is fixed usually for a tower, or we can shake it
    gameState.camera.x = 0; 
}