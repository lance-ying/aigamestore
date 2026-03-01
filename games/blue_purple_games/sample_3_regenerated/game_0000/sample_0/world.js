/**
 * Handles level generation and camera management.
 * The world is a tall vertical shaft.
 */
import { gameState, WORLD_HEIGHT, WORLD_WIDTH, CANVAS_HEIGHT, CANVAS_WIDTH } from './globals.js';
import { Platform, Decoration } from './entities.js';

export function initWorld() {
    gameState.platforms = [];
    gameState.decorations = [];
    
    // Create Walls
    // Left Wall
    gameState.platforms.push(new Platform(-50, -1000, 50, WORLD_HEIGHT + 2000, 'STONE'));
    // Right Wall
    gameState.platforms.push(new Platform(WORLD_WIDTH, -1000, 50, WORLD_HEIGHT + 2000, 'STONE'));
    
    // Create Floor
    gameState.platforms.push(new Platform(0, WORLD_HEIGHT - 50, WORLD_WIDTH, 100, 'STONE'));

    // --- Generate Level Sections (Bottom to Top) ---
    
    // 1. Tutorial / Base Area (4000 - 3500)
    addPlatform(200, 3900, 200, 20, 'STONE');
    addPlatform(450, 3800, 100, 20, 'STONE');
    addPlatform(50, 3750, 150, 20, 'STONE');
    // Adjusted P4 to be closer (was 3650) to make the 4th/5th jump easier
    addPlatform(300, 3680, 100, 20, 'WOOD');
    
    let lastX = 300; // Track X for reachable generation

    // 2. The Forest / Mossy Area (3500 - 2500)
    // Start slightly higher to bridge gap from 3680
    for (let y = 3550; y > 2500; y -= 150) {
        // Ensure jump is solvable (max horizontal dist ~280 for 150 height)
        // We constrain new X to be within range of lastX
        let minX = Math.max(50, lastX - 250);
        let maxX = Math.min(WORLD_WIDTH - 150, lastX + 250); // -150 to account for width
        
        let w = Math.random() * 80 + 60;
        let x;
        
        // Ensure we don't stack directly above the previous platform
        // Try to find a valid X that is offset from lastX
        let attempts = 0;
        do {
            x = Math.random() * (maxX - minX) + minX;
            
            // Keep within bounds strictly
            if (x < 50) x = 50;
            if (x + w > 550) x = 550 - w;
            
            attempts++;
        } while (Math.abs(x - lastX) < 60 && attempts < 10);

        addPlatform(x, y, w, 20, 'WOOD');
        lastX = x;
        
        // Add some random smaller blocks for difficulty
        // Ensure they don't spawn directly above the current platform
        if (Math.random() > 0.5) {
            let bx = Math.random() * 500 + 50;
            let bw = 40;
            // Only add if it doesn't overlap the current platform's x range
            if (bx + bw < x || bx > x + w) {
                addPlatform(bx, y - 75, bw, 20, 'STONE');
            }
        }
        
        // Decor
        gameState.decorations.push(new Decoration(Math.random() * 500 + 50, y - 50, 'TORCH'));
    }
    
    // Bridge from Forest to Sky to ensure connectivity
    addPlatform(250, 2580, 100, 20, 'WOOD');
    
    // 3. The Sky / Clouds (2500 - 1000)
    // Adjusted to be solvable. Previous (200 step, 300 gap) was impossible.
    // New: 180 step, 200 gap.
    for (let y = 2500; y > 1000; y -= 180) {
        // Zigzag pattern: Alternate between left-ish and right-ish
        // Ensure they are reachable.
        let x = (y % 360 < 180) ? 150 : 350; 
        
        addPlatform(x, y, 100, 20, 'STONE');
        // Removed blockers that were causing unreachability in the jump path
        
        gameState.decorations.push(new Decoration(Math.random()*600, y, 'CLOUD'));
    }
    
    // 4. The Tower / Space (1000 - 100)
    for (let y = 1000; y > 200; y -= 250) {
        // Precise jumps required
        // These have intermediate platforms so 250 gap is split into 120+130
        addPlatform(250, y, 60, 20, 'STONE');
        addPlatform(100, y - 120, 40, 20, 'STONE');
        addPlatform(450, y - 120, 40, 20, 'STONE');
    }
    
    // 5. The Top (Goal)
    addPlatform(200, 150, 200, 40, 'GOAL');
    
    // Add "Babe" decoration
    // TODO: A more distinct sprite, currently just a particle effect in game loop
}

function addPlatform(x, y, w, h, type) {
    gameState.platforms.push(new Platform(x, y, w, h, type));
}

export function updateCamera(p) {
    if (!gameState.player) return;
    
    const targetY = gameState.player.y - CANVAS_HEIGHT / 2;
    
    // Smooth Lerp
    gameState.camera.y += (targetY - gameState.camera.y) * 0.1;
    
    // Clamp Camera
    // We want the camera to be able to go up to the top (negative coords if needed, but here 0)
    // And down to bottom
    const minCamY = -200;
    const maxCamY = WORLD_HEIGHT - CANVAS_HEIGHT;
    
    gameState.camera.y = p.constrain(gameState.camera.y, minCamY, maxCamY);
    
    gameState.camera.x = 0; // No horizontal scrolling
}