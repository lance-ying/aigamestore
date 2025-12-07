/**
 * level_gen.js
 * Procedural generation for rooms.
 */

import { TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { randomInt, randomChoice } from './math_utils.js';

export class TileMap {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.tiles = new Array(cols * rows).fill(0); // 0: Empty, 1: Wall, 2: Spike
        this.spawnPoint = { x: 50, y: 50 };
        this.exitPoint = { x: 0, y: 0 };
    }

    get(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return 0;
        return this.tiles[row * this.cols + col];
    }

    set(col, row, val) {
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            this.tiles[row * this.cols + col] = val;
        }
    }

    isSolid(col, row) {
        const val = this.get(col, row);
        return val === 1; // 1 is Wall
    }
    
    isHazard(col, row) {
        return this.get(col, row) === 2; // 2 is Spike
    }

    render(p) {
        p.noStroke();
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const val = this.tiles[y * this.cols + x];
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;

                if (val === 1) {
                    // Wall
                    p.fill(COLORS.WALL);
                    p.rect(px, py, TILE_SIZE, TILE_SIZE);
                    // Top detail
                    if (!this.isSolid(x, y - 1)) {
                        p.fill(COLORS.WALL_TOP);
                        p.rect(px, py, TILE_SIZE, 6);
                    }
                } else if (val === 2) {
                    // Spike
                    p.fill(COLORS.SPIKE);
                    p.triangle(
                        px, py + TILE_SIZE,
                        px + TILE_SIZE, py + TILE_SIZE,
                        px + TILE_SIZE / 2, py
                    );
                }
            }
        }
    }
}

/**
 * Generates a procedural room.
 * Difficulty scales with level parameter.
 */
export function generateRoom(level) {
    const cols = Math.ceil(CANVAS_WIDTH / TILE_SIZE);
    const rows = Math.ceil(CANVAS_HEIGHT / TILE_SIZE);
    const map = new TileMap(cols, rows);

    // 1. Fill borders
    for (let x = 0; x < cols; x++) {
        map.set(x, 0, 1); // Ceiling
        map.set(x, rows - 1, 1); // Floor
    }
    for (let y = 0; y < rows; y++) {
        map.set(0, y, 1); // Left Wall
        // Leave Right Wall open for exit usually, or create a gate
    }

    // 2. Clear start and end areas
    // Start: Left side
    map.spawnPoint = { x: TILE_SIZE * 2, y: TILE_SIZE * (rows - 3) };
    
    // 3. Generate Terrain Patterns
    // Strategy: Place "chunks" of platforms.
    let cursorX = 3;
    let cursorY = rows - 3;
    
    // Helper to place a platform
    const placePlatform = (x, y, w) => {
        for(let i=0; i<w; i++) map.set(x+i, y, 1);
    };

    while (cursorX < cols - 2) {
        // Decide next feature based on randomness and difficulty
        let type = randomInt({random: () => Math.random()}, 0, 3);
        
        if (type === 0) {
            // Flat ground
            let len = randomInt({random: () => Math.random()}, 2, 4);
            placePlatform(cursorX, cursorY, len);
            cursorX += len;
        } else if (type === 1) {
            // Gap
            let gap = randomInt({random: () => Math.random()}, 1, 2 + Math.min(1, Math.floor(level/5)));
            // Maybe put spike at bottom of gap?
            if (gap > 1 && level > 2) {
                map.set(cursorX, rows - 2, 2); // Spike
            }
            cursorX += gap;
        } else if (type === 2) {
            // Step Up/Down
            let dir = randomChoice({random: () => Math.random()}, [-1, 1]);
            cursorY = Math.min(Math.max(cursorY + dir * 2, 4), rows - 3);
            let len = 3;
            placePlatform(cursorX, cursorY, len);
            cursorX += len;
        } else {
            // Floating Island
            let h = randomInt({random: () => Math.random()}, 4, rows - 4);
            placePlatform(cursorX, h, 3);
            cursorX += 3;
        }
    }

    // Ensure exit is reachable (clear right wall)
    for (let y = 1; y < rows - 1; y++) {
        map.set(cols - 1, y, 0); 
    }
    // Place a small exit platform
    placePlatform(cols - 3, cursorY, 3);

    return map;
}

export function spawnEntitiesForRoom(map, level) {
    const entities = [];
    const particles = []; // cleared elsewhere
    
    // Simple entity spawning logic based on flat platforms
    for (let x = 4; x < map.cols - 4; x++) {
        for (let y = 2; y < map.rows - 2; y++) {
            // If there's a platform here and space above
            if (map.isSolid(x, y) && !map.isSolid(x, y - 1) && !map.isSolid(x, y - 2)) {
                
                // Chance for Coin
                if (Math.random() < 0.2) {
                    // Import dynamically or assume Entity classes are available. 
                    // To keep it clean, we return data objects to be instantiated in game.js
                    entities.push({ type: 'COIN', x: x * TILE_SIZE + 12, y: (y - 1) * TILE_SIZE + 12 });
                }
                
                // Chance for Enemy
                if (Math.random() < 0.05 + (level * 0.01)) {
                    // Check if platform is wide enough
                    if (map.isSolid(x+1, y) && map.isSolid(x-1, y)) {
                        entities.push({ type: 'ENEMY', subtype: 'WALKER', x: x * TILE_SIZE, y: (y - 1) * TILE_SIZE });
                        x += 3; // Space out enemies
                    }
                }
                
                // Chance for Flyer
                if (Math.random() < 0.02 + (level * 0.005)) {
                     entities.push({ type: 'ENEMY', subtype: 'FLYER', x: x * TILE_SIZE, y: (y - 4) * TILE_SIZE });
                     x += 2;
                }
            }
        }
    }
    return entities;
}