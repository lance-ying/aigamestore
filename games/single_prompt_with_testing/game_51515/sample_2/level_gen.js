/**
 * level_gen.js
 * Handles procedural generation of the dungeon grid.
 */

import { gameState, TILE_SIZE, GRID_ROWS, GRID_COLS_VISIBLE } from './globals.js';
import { SpikeTrap, Slime, Collectible } from './entities.js';

// Tile Types
export const TILE_TYPES = {
    FLOOR: 'FLOOR',
    WALL: 'WALL',
    VOID: 'VOID' // Shouldn't happen often in this design
};

class Tile {
    constructor(col, row, type) {
        this.col = col;
        this.row = row;
        this.type = type;
        this.variation = Math.random() > 0.5 ? 1 : 0; // Texture variation
    }
}

/**
 * Ensures the grid is populated up to the player's view range.
 */
export function updateLevelGeneration() {
    const targetCol = Math.floor(gameState.cameraX / TILE_SIZE) + GRID_COLS_VISIBLE + 5;
    
    while (gameState.generatedColMax < targetCol) {
        gameState.generatedColMax++;
        generateColumn(gameState.generatedColMax);
    }
    
    // Cleanup old columns (memory management)
    // Optional: remove tiles < cameraX - buffer
    // For this simple game, we might not need aggressive cleanup unless running for hours,
    // but a map can grow large.
    const cleanupThreshold = Math.floor(gameState.cameraX / TILE_SIZE) - 10;
    // We would iterate the map keys and delete. 
    // Optimization: Do this only occasionally.
}

function generateColumn(col) {
    // Generate Walls (Top and Bottom borders)
    addTile(col, 0, TILE_TYPES.WALL);
    addTile(col, GRID_ROWS - 1, TILE_TYPES.WALL);
    
    // For the inner rows, use some logic
    // We want playable paths.
    // Simple algorithm: Perlin noise or randomness for walls, but ensure connectivity.
    // Since we move mostly right, we just need gaps.
    
    for (let row = 1; row < GRID_ROWS - 1; row++) {
        // Base chance of wall
        let isWall = Math.random() < 0.2; 
        
        // Ensure start area is clear
        if (col < 5) isWall = false;
        
        if (isWall) {
            addTile(col, row, TILE_TYPES.WALL);
        } else {
            addTile(col, row, TILE_TYPES.FLOOR);
            
            // Chance to spawn entities if floor
            if (col > 5) {
                spawnEntityLogic(col, row);
            }
        }
    }
    
    // Post-processing: Ensure connectivity? 
    // A simple random walk is better, but column-generation is tricky for connectivity.
    // Hack: Force at least one empty tile adjacent to an empty tile in previous col?
    // With 20% wall density and 8 height, paths are almost guaranteed.
}

function addTile(col, row, type) {
    const tile = new Tile(col, row, type);
    gameState.grid.set(`${col},${row}`, tile);
}

function spawnEntityLogic(col, row) {
    const rand = Math.random();
    
    // 5% Coin
    if (rand < 0.05) {
        new Collectible(col, row);
    }
    // 3% Slime
    else if (rand < 0.08) {
        new Slime(col, row, Math.random() > 0.5 ? 'HORIZONTAL' : 'VERTICAL');
    }
    // 5% Spike Trap
    else if (rand < 0.13) {
        gameState.entities.push(new SpikeTrap(col, row, Math.floor(Math.random() * 100)));
    }
}