import { Platform, Collectible, Goal } from './entities.js';
import { gameState } from './globals.js';
import { randomRange } from './utils.js';

export function generateLevel(seed) {
    // Clear existing
    gameState.platforms = [];
    gameState.collectibles = [];
    
    // Seed random (global Math.random is already seeded by main setup)
    
    // Starting platform
    new Platform(0, -1, 0, 4, 2, 10);
    
    let currentZ = -6; // End of start platform (0 - 10/2 - buffer)
    let currentY = -1;
    let currentX = 0;
    
    // Generate segments
    const segmentCount = 20;
    
    for (let i = 0; i < segmentCount; i++) {
        const type = Math.floor(randomRange(0, 4));
        const length = randomRange(8, 15);
        const gap = randomRange(2, 4);
        
        // Move to start of next platform (gap)
        currentZ -= gap;
        
        // Randomize Y slightly
        if (Math.random() < 0.3) {
            currentY += randomRange(-2, 1);
            if (currentY < -5) currentY = -5; // Floor floor
        }
        
        // Randomize X slightly (slalom)
        currentX += randomRange(-3, 3);
        // Clamp X
        currentX = Math.max(-10, Math.min(10, currentX));
        
        const zPos = currentZ - length / 2;
        
        // Platform generation based on type
        if (type === 0) {
            // Standard
            new Platform(currentX, currentY, zPos, 4, 1, length);
            // Add collectible in middle
            if (Math.random() > 0.3) {
                new Collectible(currentX, currentY + 1.5, zPos);
            }
        } else if (type === 1) {
            // Narrow bridge
            new Platform(currentX, currentY, zPos, 1.5, 1, length);
            new Collectible(currentX, currentY + 1.5, zPos);
        } else if (type === 2) {
            // Split path
            new Platform(currentX - 3, currentY, zPos, 2, 1, length);
            new Platform(currentX + 3, currentY, zPos, 2, 1, length);
            new Collectible(currentX - 3, currentY + 1.5, zPos);
            new Collectible(currentX + 3, currentY + 1.5, zPos);
        } else {
            // Danger jumps
            // Create two small pads instead of one long one
            new Platform(currentX, currentY, currentZ - 2, 3, 1, 4);
            // Danger platform in middle (lower)
            new Platform(currentX, currentY - 2, currentZ - length/2, 3, 1, 4, 'danger');
            
            new Platform(currentX, currentY, currentZ - length + 2, 3, 1, 4);
        }
        
        // Advance Z
        currentZ -= length;
    }
    
    // Goal Platform
    currentZ -= 3;
    new Platform(currentX, currentY, currentZ - 5, 8, 1, 10);
    new Goal(currentX, currentY + 2.5, currentZ - 5);
}