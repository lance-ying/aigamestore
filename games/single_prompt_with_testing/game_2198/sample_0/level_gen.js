/**
 * level_gen.js
 * Handles procedural level generation using defined patterns.
 * Stitches together chunks of terrain to create an endless course.
 */

import { gameState, TILE_SIZE, CANVAS_HEIGHT, CANVAS_WIDTH } from './globals.js';
import { Block, Spike, Floor } from './entities.js';

// Pattern Definitions
// Each pattern is a blueprint. 
// 'X' = Block, '^' = Spike, '_' = Floor, ' ' = Air
const PATTERNS = {
    // Basic ground running
    FLAT: [
        "__________"
    ],
    // Single jump over spike
    ONE_SPIKE: [
        "____^_____"
    ],
    // Double spike jump
    TWO_SPIKES: [
        "___^^_____"
    ],
    // Simple platform jump
    STEP_UP: [
        "      XXXX",
        "______XXXX"
    ],
    // Gap jump
    GAP: [
        "XXX    XXX"
    ],
    // Up and down
    HILL: [
        "     XX   ",
        "  XX XX XX",
        "XXXXXXXXXX"
    ],
    // Tricky spikes
    SPIKE_FIELD: [
        "X ^ X ^ XX",
        "XXXXXXXXXX"
    ]
};

// Difficulty Tiers (Keys of patterns)
const TIERS = [
    ['FLAT', 'ONE_SPIKE', 'GAP'], // Easy
    ['TWO_SPIKES', 'STEP_UP', 'HILL'], // Medium
    ['SPIKE_FIELD', 'HILL', 'GAP'] // Hard
];

/**
 * Initializes the level generation
 */
export function initLevel() {
    gameState.entities = [];
    gameState.nextSpawnX = 0;
    gameState.difficultyTier = 0;
    
    // Create a starting safe zone
    spawnPattern(generateFlatPattern(15));
}

/**
 * Updates level generation based on player position
 */
export function updateLevelGen(p) {
    // Generate ahead of the camera
    // Keep a buffer of roughly 2 screens width (1200px) ahead
    const bufferEdge = gameState.cameraX + CANVAS_WIDTH * 2;
    
    while (gameState.nextSpawnX < bufferEdge) {
        generateNextChunk(p);
    }
    
    // Cleanup entities that are far behind
    const cleanupThreshold = gameState.cameraX - CANVAS_WIDTH;
    gameState.entities = gameState.entities.filter(e => e.x > cleanupThreshold);
    
    // Update difficulty based on distance
    updateDifficulty();
}

/**
 * Selects and spawns the next pattern
 */
function generateNextChunk(p) {
    const tierIdx = Math.min(gameState.difficultyTier, TIERS.length - 1);
    const availablePatterns = TIERS[tierIdx];
    const key = p.random(availablePatterns);
    const pattern = PATTERNS[key];
    
    spawnPattern(pattern);
}

/**
 * Parses a pattern array and instantiates entities
 * @param {string[]} pattern 
 */
function spawnPattern(pattern) {
    const rows = pattern.length;
    const cols = pattern[0].length;
    
    // Base Y is the bottom of the screen area roughly
    // We assume the last row of the pattern aligns with the "ground" level
    // Ground level is usually CANVAS_HEIGHT - 50
    const groundY = CANVAS_HEIGHT - 50;
    
    for (let r = 0; r < rows; r++) {
        const stringRow = pattern[r];
        // Calculate Y position relative to ground. 
        // If pattern has 1 row, it's at groundY. 
        // If 2 rows, row 1 is groundY, row 0 is groundY - TILE_SIZE.
        const y = groundY - ((rows - 1 - r) * TILE_SIZE);
        
        for (let c = 0; c < stringRow.length; c++) {
            const char = stringRow[c];
            const x = gameState.nextSpawnX + (c * TILE_SIZE);
            
            if (char === '_') {
                gameState.entities.push(new Floor(x, y, TILE_SIZE));
            } else if (char === 'X') {
                gameState.entities.push(new Block(x, y, TILE_SIZE, TILE_SIZE));
            } else if (char === '^') {
                // Spike needs a floor or block underneath usually, or it floats
                // For simplicity in patterns, we might put floor under spike manually or assume it
                gameState.entities.push(new Floor(x, y, TILE_SIZE)); // Base for spike
                gameState.entities.push(new Spike(x, y - SPIKE_HEIGHT + TILE_SIZE)); // Adjust spike Y to sit on floor
            }
        }
    }
    
    // Advance spawn pointer
    gameState.nextSpawnX += cols * TILE_SIZE;
}

/**
 * Generates a flat string pattern dynamically
 */
function generateFlatPattern(length) {
    return ["_".repeat(length)];
}

function updateDifficulty() {
    // Increase difficulty every 10000 pixels (approx 15-20s of gameplay)
    const tier = Math.floor(gameState.distanceTraveled / 5000);
    gameState.difficultyTier = tier;
    
    // Increase world speed slightly
    if (gameState.worldSpeed < 12) {
        gameState.worldSpeed += 0.0005;
    }
}