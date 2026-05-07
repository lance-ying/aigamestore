/**
 * level.js
 * Procedural generation of the game world.
 */

import { TILE_SIZE, gameState, CANVAS_HEIGHT } from './globals.js';
import { Slime, Bat, Teleporter } from './entities.js';

export function generateLevel(seed) {
    // Reset state
    gameState.tiles = [];
    gameState.tileMap = {};
    gameState.entities = []; // clear old enemies
    gameState.particles = [];
    gameState.projectiles = [];
    
    // Create Floor
    const levelLength = 100; // In tiles
    gameState.worldWidth = levelLength * TILE_SIZE;

    // We build a tile map. Key: "col,row" -> {type, x, y, solid}
    
    // Start Platform
    for (let c = 0; c < 10; c++) {
        addTile(c, 9); // Floor
        addTile(c, 0); // Ceiling
    }

    // Procedural Segments
    let col = 10;
    while (col < levelLength - 10) {
        const segmentType = Math.floor(Math.random() * 4);
        const segmentLen = 5 + Math.floor(Math.random() * 5);
        
        // Ensure bounds
        if (col + segmentLen >= levelLength - 10) break;

        switch(segmentType) {
            case 0: // Flat ground with Slimes
                for (let i = 0; i < segmentLen; i++) {
                    addTile(col + i, 9);
                    addTile(col + i, 0);
                    if (Math.random() < 0.3) {
                        // Ensure we don't spawn inside a wall (unlikely here but good practice)
                        if (!getTileAt(col + i, 7)) {
                            new Slime((col + i) * TILE_SIZE, 7 * TILE_SIZE);
                        }
                    }
                }
                break;
            case 1: // Gap
                // Floor gap
                for (let i = 0; i < segmentLen; i++) {
                    addTile(col + i, 0); // Keep ceiling
                    // Add floating platform in middle
                    if (i > 1 && i < segmentLen - 1) {
                         // Use row 8 (one tile above floor) so it's reachable. 
                         // Row 6 was too high (120px gap vs ~100px jump).
                         addTile(col + i, 8);
                    }
                }
                // Add bats over gap
                new Bat((col + segmentLen/2) * TILE_SIZE, 4 * TILE_SIZE);
                break;
            case 2: // Wall/Steps
                for (let i = 0; i < segmentLen; i++) {
                    addTile(col + i, 9);
                    addTile(col + i, 0);
                    if (i % 2 === 0) {
                        addTile(col + i, 7); // Step
                    }
                    
                    // Spawn slime only if no step here
                    if (i % 2 !== 0 && Math.random() < 0.3) {
                         new Slime((col + i) * TILE_SIZE, 7 * TILE_SIZE);
                    }
                }
                break;
            case 3: // Tunnel
                for (let i = 0; i < segmentLen; i++) {
                    addTile(col + i, 9); // Floor
                    addTile(col + i, 6); // Low Ceiling
                    addTile(col + i, 0); // High Ceiling
                    if (Math.random() < 0.5) {
                        if (!getTileAt(col + i, 8)) {
                            new Slime((col + i) * TILE_SIZE, 8 * TILE_SIZE);
                        }
                    }
                }
                break;
        }
        col += segmentLen;
    }

    // End Platform
    for (let c = col; c < levelLength; c++) {
        addTile(c, 9);
        addTile(c, 0);
    }

    // Place Teleporter
    new Teleporter((levelLength - 5) * TILE_SIZE, 7 * TILE_SIZE);
}

function addTile(c, r) {
    const key = `${c},${r}`;
    const tile = {
        col: c,
        row: r,
        x: c * TILE_SIZE,
        y: r * TILE_SIZE,
        width: TILE_SIZE,
        height: TILE_SIZE,
        solid: true,
        type: 'WALL'
    };
    gameState.tileMap[key] = tile;
    gameState.tiles.push(tile);
}

function getTileAt(c, r) {
    const key = `${c},${r}`;
    return gameState.tileMap[key];
}