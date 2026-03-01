/**
 * level_generator.js
 * Generates the game world by stitching together "Chunks".
 */

import { gameState, TILE_SIZE, LEVEL_LENGTH, CANVAS_HEIGHT } from './globals.js';
import { Platform, Spike, Collectible } from './entities.js';

// Defines a grid-based level segment. 
// '#' = Block, 'A' = Spike, 'O' = Orb, '.' = Empty
const CHUNKS = [
    // Basic Flat
    [
        "....................",
        "....................",
        "....................",
        "....................",
        "....................",
        "....................",
        "####################"
    ],
    // The Gap
    [
        "....................",
        "....................",
        "....................",
        ".....OO.............",
        "....................",
        "....................",
        "######....##########"
    ],
    // Spike Field
    [
        "....................",
        "....................",
        "....................",
        "....................",
        "....................",
        ".......A..A..A......",
        "####################"
    ],
    // Stairs Up
    [
        "....................",
        "..................O.",
        "................####",
        ".............####...",
        "..........####......",
        ".......####.........",
        "#######............."
    ],
    // Precision Jump
    [
        "....................",
        "....................",
        "....................",
        "....................",
        "........#........#..",
        ".....#.....#..#.....",
        "###................."
    ]
];

export function generateLevel() {
    let currentX = 0;
    
    // Start Platform
    createPlatformChunk(currentX, 10, true);
    currentX += 10 * TILE_SIZE;

    // Generate Chunks
    while (currentX < LEVEL_LENGTH) {
        // Pick random chunk pattern
        const chunkIndex = Math.floor(Math.random() * CHUNKS.length);
        const pattern = CHUNKS[chunkIndex];
        
        parseChunk(pattern, currentX);
        
        currentX += pattern[0].length * TILE_SIZE;
    }

    // Finish Line Area
    createPlatformChunk(currentX, 20, true);
    // Add visual finish line entity if desired, or just detect x position
}

function parseChunk(pattern, startX) {
    // Pattern is array of strings. 
    // We assume the bottom row of the pattern aligns with "Floor Level" usually, 
    // but to allow variation, we can offset Y.
    // For simplicity, let's map pattern rows to Y coordinates relative to a baseline.
    // Let's say bottom row (index length-1) is at y = CANVAS_HEIGHT - TILE_SIZE.
    
    const rows = pattern.length;
    const groundY = CANVAS_HEIGHT - TILE_SIZE;
    
    for (let r = 0; r < rows; r++) {
        const rowString = pattern[r];
        const y = groundY - ((rows - 1 - r) * TILE_SIZE);
        
        for (let c = 0; c < rowString.length; c++) {
            const char = rowString[c];
            const x = startX + c * TILE_SIZE;
            
            if (char === '#') {
                gameState.platforms.push(new Platform(x, y, TILE_SIZE, TILE_SIZE));
            } else if (char === 'A') {
                gameState.hazards.push(new Spike(x, y));
            } else if (char === 'O') {
                gameState.collectibles.push(new Collectible(x, y));
            }
        }
    }
}

function createPlatformChunk(startX, length, safe) {
    const y = CANVAS_HEIGHT - TILE_SIZE;
    gameState.platforms.push(new Platform(startX, y, length * TILE_SIZE, TILE_SIZE));
}