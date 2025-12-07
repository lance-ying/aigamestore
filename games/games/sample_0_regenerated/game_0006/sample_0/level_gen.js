// level_gen.js
// Procedural Level Generation

import { TILE_SIZE, WORLD_WIDTH_TILES, WORLD_HEIGHT_TILES, gameState } from './globals.js';
import { Player, Snake, Bat, Item, Exit } from './entities.js';
import { randomInt } from './utils.js';

export function generateLevel(p) {
    // 1. Initialize empty map (filled with walls)
    let map = [];
    for (let y = 0; y < WORLD_HEIGHT_TILES; y++) {
        let row = [];
        for (let x = 0; x < WORLD_WIDTH_TILES; x++) {
            row.push(1); // 1 = Wall
        }
        map.push(row);
    }

    // 2. Drunkard's Walk / Digger
    // Start top middle
    let cx = Math.floor(WORLD_WIDTH_TILES / 2);
    let cy = 1;
    const maxSteps = 400; // Number of floor tiles to dig
    
    let spawnX = cx * TILE_SIZE;
    let spawnY = cy * TILE_SIZE;

    // Keep digging until we reach bottom
    let steps = 0;
    
    // We want to force a generally downward path
    while (steps < maxSteps) {
        map[cy][cx] = 0; // Dig
        
        // Random move
        const dir = randomInt(p, 0, 100);
        
        // 40% Left, 40% Right, 20% Down
        if (dir < 40) {
            cx--;
        } else if (dir < 80) {
            cx++;
        } else {
            cy++;
        }
        
        // Clamp bounds
        if (cx < 1) cx = 1;
        if (cx >= WORLD_WIDTH_TILES - 1) cx = WORLD_WIDTH_TILES - 2;
        if (cy >= WORLD_HEIGHT_TILES - 2) cy = WORLD_HEIGHT_TILES - 2; // Leave bottom row for floor
        
        steps++;
    }

    // 3. Post-processing: Add some random rooms
    const numRooms = 5;
    for (let i = 0; i < numRooms; i++) {
        let rw = randomInt(p, 3, 8);
        let rh = randomInt(p, 3, 6);
        let rx = randomInt(p, 1, WORLD_WIDTH_TILES - rw - 1);
        let ry = randomInt(p, 2, WORLD_HEIGHT_TILES - rh - 1);
        
        for (let y = ry; y < ry + rh; y++) {
            for (let x = rx; x < rx + rw; x++) {
                map[y][x] = 0;
            }
        }
    }

    // 4. Populate Entities
    gameState.entities = [];
    gameState.particles = [];
    
    // Find valid spawn point for player
    // Should be near top
    gameState.player = new Player(spawnX, spawnY);
    gameState.entities.push(gameState.player);

    // Find exit at bottom
    let exitPlaced = false;
    for (let y = WORLD_HEIGHT_TILES - 3; y >= 0; y--) {
        for (let x = 0; x < WORLD_WIDTH_TILES; x++) {
            if (map[y][x] === 0 && map[y+1][x] === 1) { // Floor
                 gameState.entities.push(new Exit(x * TILE_SIZE, y * TILE_SIZE));
                 exitPlaced = true;
                 break;
            }
        }
        if (exitPlaced) break;
    }

    // Spawn Enemies and Items
    for (let y = 0; y < WORLD_HEIGHT_TILES; y++) {
        for (let x = 0; x < WORLD_WIDTH_TILES; x++) {
            if (map[y][x] === 0) {
                // Ground check
                const hasGround = (y + 1 < WORLD_HEIGHT_TILES && map[y+1][x] === 1);
                const hasCeiling = (y - 1 >= 0 && map[y-1][x] === 1);

                const chance = p.random();
                
                // Gold (5%)
                if (hasGround && chance < 0.05) {
                    gameState.entities.push(new Item(x * TILE_SIZE + 10, y * TILE_SIZE + 10, 'gold', 100));
                }
                
                // Snake (2% on ground)
                else if (hasGround && chance < 0.07) {
                    gameState.entities.push(new Snake(x * TILE_SIZE, y * TILE_SIZE));
                }
                
                // Bat (2% on ceiling)
                else if (hasCeiling && chance < 0.09) {
                    gameState.entities.push(new Bat(x * TILE_SIZE, y * TILE_SIZE));
                }
            }
        }
    }

    gameState.levelMap = map;
}