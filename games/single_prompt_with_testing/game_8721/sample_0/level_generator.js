/**
 * level_generator.js
 * Procedural generation of the game world.
 */

import { gameState, TILE_SIZE, CANVAS_HEIGHT } from './globals.js';
import { Tile, Enemy, Collectible, GoalPost } from './entities.js';

export function generateLevel(seed) {
    // Basic pseudo-random using sine waves for reproducibility
    let currentX = 0;
    const floorY = CANVAS_HEIGHT - TILE_SIZE * 2;
    
    gameState.tiles = {}; // Reset tiles map
    gameState.entities = []; // Reset entities
    
    // Safety buffer at start
    createPlatform(currentX, 10, floorY);
    currentX += 10 * TILE_SIZE;

    // Generate segments
    const levelLengthBlocks = 200; 
    
    for (let i = 0; i < levelLengthBlocks; i++) {
        const segmentType = Math.floor(pseudoRandom(i) * 5); // 0-4
        
        switch(segmentType) {
            case 0: // Flat run with enemies
                createPlatform(currentX, 10, floorY);
                if (pseudoRandom(i * 10) > 0.5) {
                    gameState.entities.push(new Enemy(currentX + 200, floorY - 40));
                }
                currentX += 10 * TILE_SIZE;
                break;
                
            case 1: // Pit
                createPlatform(currentX, 2, floorY); // Edge
                currentX += 2 * TILE_SIZE;
                // Gap of 3 tiles
                currentX += 3 * TILE_SIZE;
                createPlatform(currentX, 2, floorY); // Landing
                currentX += 2 * TILE_SIZE;
                break;
                
            case 2: // Staircase (Blocks)
                createPlatform(currentX, 12, floorY);
                // Steps
                for (let j = 0; j < 3; j++) {
                    createBlock(currentX + (3+j)*TILE_SIZE, floorY - (j+1)*TILE_SIZE - 40);
                }
                // Coins above
                for (let j = 0; j < 3; j++) {
                     gameState.entities.push(new Collectible(currentX + (3+j)*TILE_SIZE + 10, floorY - (j+1)*TILE_SIZE - 100));
                }
                currentX += 12 * TILE_SIZE;
                break;
                
            case 3: // High Wall (needs wall jump or wait for gap?)
                // Since it's an auto-runner, we shouldn't make impassable walls without a way up
                // Let's make a "Pipe" obstacle to vault
                createPlatform(currentX, 8, floorY);
                createPipe(currentX + 4*TILE_SIZE, floorY - TILE_SIZE);
                currentX += 8 * TILE_SIZE;
                break;
                
            case 4: // Floating Platforms
                createPlatform(currentX, 3, floorY);
                currentX += 3 * TILE_SIZE;
                // Gap
                currentX += 2 * TILE_SIZE;
                // Floating block platform
                createBlock(currentX, floorY - 3 * TILE_SIZE);
                createBlock(currentX + TILE_SIZE, floorY - 3 * TILE_SIZE);
                createBlock(currentX + 2*TILE_SIZE, floorY - 3 * TILE_SIZE);
                // Coin on top
                gameState.entities.push(new Collectible(currentX + TILE_SIZE + 10, floorY - 4 * TILE_SIZE - 20));
                
                currentX += 3 * TILE_SIZE;
                currentX += 2 * TILE_SIZE; // Gap down
                createPlatform(currentX, 3, floorY);
                currentX += 3 * TILE_SIZE;
                break;
        }
    }
    
    // Final Platform and Goal
    createPlatform(currentX, 15, floorY);
    gameState.entities.push(new GoalPost(currentX + 7 * TILE_SIZE, floorY - 160));
    
    // Update world bounds
    gameState.levelLength = currentX + 15 * TILE_SIZE;
}

// Helpers
function pseudoRandom(input) {
    const x = Math.sin(input * 12.9898 + 78.233) * 43758.5453123;
    return x - Math.floor(x);
}

function createPlatform(startX, length, y) {
    for (let i = 0; i < length; i++) {
        addTile(startX + i * TILE_SIZE, y, "GROUND");
        // Add solid ground below to prevent falling through if physics glitches
        addTile(startX + i * TILE_SIZE, y + TILE_SIZE, "GROUND");
    }
}

function createBlock(x, y) {
    addTile(x, y, "BLOCK");
}

function createPipe(x, y) {
    addTile(x, y, "PIPE");
    addTile(x, y + TILE_SIZE, "PIPE"); // Double height usually
}

function addTile(x, y, type) {
    const col = Math.floor(x / TILE_SIZE);
    const row = Math.floor(y / TILE_SIZE);
    const key = `${col},${row}`;
    
    gameState.tiles[key] = new Tile(x, y, type);
}