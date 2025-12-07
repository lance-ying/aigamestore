/**
 * level_gen.js
 * Procedural generation for the moon caves.
 */

import { WORLD_COLS, WORLD_ROWS, TILE_TYPE, TILE_SIZE, gameState } from './globals.js';
import { Snake, Bat, WalkerEnemy } from './entities.js';
import { Gold, Gem, Heart, ExitPortal } from './entities.js';

export function generateLevel(levelNum) {
    // 1. Initialize empty grid
    let tiles = new Array(WORLD_COLS).fill(0).map(() => new Array(WORLD_ROWS).fill(TILE_TYPE.STONE));
    
    // 2. Random Walkers to carve caves
    // Start at top left
    let startX = 2;
    let startY = 2;
    let endX = WORLD_COLS - 3;
    let endY = WORLD_ROWS - 3;
    
    let walkers = [];
    // Main path walker
    walkers.push({ x: startX, y: startY, life: 400, tendency: 0.5 }); 
    
    // Helper function to carve
    function carve(x, y, radius) {
        for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j <= radius; j++) {
                if (x+i > 1 && x+i < WORLD_COLS-1 && y+j > 1 && y+j < WORLD_ROWS-1) {
                    if (Math.random() > 0.3) tiles[x+i][y+j] = TILE_TYPE.EMPTY;
                }
            }
        }
    }

    // Drunkard's Walk algorithm
    const maxIterations = 2000;
    let iterations = 0;
    
    // Ensure start area is clear
    carve(startX, startY, 2);
    
    let currentX = startX;
    let currentY = startY;
    
    // Main path carver - bias towards bottom right
    while(iterations < maxIterations) {
        // Carve current spot
        carve(currentX, currentY, 1);
        
        // Move
        let r = Math.random();
        if (r < 0.35) currentX++; // Right
        else if (r < 0.5) currentX--; // Left
        else if (r < 0.85) currentY++; // Down
        else currentY--; // Up
        
        // Clamp
        currentX = Math.max(2, Math.min(WORLD_COLS - 3, currentX));
        currentY = Math.max(2, Math.min(WORLD_ROWS - 3, currentY));
        
        // Reached end?
        if (Math.hypot(currentX - endX, currentY - endY) < 5) {
            break;
        }
        
        iterations++;
    }
    
    // Create Secondary Caves
    for (let i = 0; i < 10; i++) {
        let cx = Math.floor(Math.random() * WORLD_COLS);
        let cy = Math.floor(Math.random() * WORLD_ROWS);
        if (tiles[cx][cy] === TILE_TYPE.EMPTY) {
            // Start a new small walker here
            let life = 50;
            let wx = cx;
            let wy = cy;
            while (life > 0) {
                tiles[wx][wy] = TILE_TYPE.EMPTY;
                wx += Math.floor(Math.random() * 3) - 1;
                wy += Math.floor(Math.random() * 3) - 1;
                wx = Math.max(1, Math.min(WORLD_COLS-2, wx));
                wy = Math.max(1, Math.min(WORLD_COLS-2, wy));
                life--;
            }
        }
    }
    
    // 3. Cellular Automata Smoothing
    for (let step = 0; step < 3; step++) {
        let newTiles = JSON.parse(JSON.stringify(tiles));
        for (let x = 1; x < WORLD_COLS - 1; x++) {
            for (let y = 1; y < WORLD_ROWS - 1; y++) {
                let neighbors = 0;
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        if (i===0 && j===0) continue;
                        if (tiles[x+i][y+j] !== TILE_TYPE.EMPTY) neighbors++;
                    }
                }
                if (neighbors > 4) newTiles[x][y] = TILE_TYPE.STONE;
                else if (neighbors < 4) newTiles[x][y] = TILE_TYPE.EMPTY;
            }
        }
        tiles = newTiles;
    }
    
    // 4. Ensure floor for start and end
    tiles[startX][startY+1] = TILE_TYPE.STONE;
    tiles[startX+1][startY+1] = TILE_TYPE.STONE;
    
    // Find valid ground for exit near end area
    let exitFound = false;
    let exitX = endX;
    let exitY = endY;
    
    // Scan up from bottom right to find a floor
    for (let y = WORLD_ROWS - 2; y > 0; y--) {
        for (let x = WORLD_COLS - 2; x > WORLD_COLS/2; x--) {
            if (tiles[x][y] === TILE_TYPE.EMPTY && tiles[x][y+1] !== TILE_TYPE.EMPTY) {
                exitX = x;
                exitY = y;
                exitFound = true;
                break;
            }
        }
        if (exitFound) break;
    }
    
    // Clear area around exit
    tiles[exitX][exitY] = TILE_TYPE.EMPTY;
    tiles[exitX][exitY-1] = TILE_TYPE.EMPTY;

    // Apply Dirt vs Stone logic (cosmetic mostly, but stone is harder)
    for (let x=0; x<WORLD_COLS; x++) {
        for (let y=0; y<WORLD_ROWS; y++) {
            if (tiles[x][y] !== TILE_TYPE.EMPTY) {
                // Top layers are dirt-like, deep are stone
                if (y < WORLD_ROWS * 0.3) tiles[x][y] = TILE_TYPE.DIRT;
                else tiles[x][y] = TILE_TYPE.STONE;
            }
        }
    }

    gameState.tiles = tiles;
    gameState.playerStart = { x: startX * TILE_SIZE, y: startY * TILE_SIZE };
    
    // 5. Populate World
    spawnEntities(exitX, exitY, levelNum);
}

function spawnEntities(exitX, exitY, levelNum) {
    // Clear old entities (except player if we were preserving, but we regen usually)
    gameState.entities = [];
    
    // Spawn Exit
    const exit = new ExitPortal(exitX * TILE_SIZE, exitY * TILE_SIZE);
    gameState.entities.push(exit);
    gameState.exitPortal = exit;
    
    // Spawn Enemies and Items
    const density = 0.05 + (levelNum * 0.01); // Increase density with level
    
    for (let x = 0; x < WORLD_COLS; x++) {
        for (let y = 0; y < WORLD_ROWS; y++) {
            // Check if valid spawn location (empty space with ground below)
            if (gameState.tiles[x][y] === TILE_TYPE.EMPTY && 
                gameState.tiles[x][y+1] !== TILE_TYPE.EMPTY) {
                
                // Don't spawn too close to start
                const distToStart = Math.hypot(x - 2, y - 2);
                if (distToStart < 8) continue;
                
                const r = Math.random();
                
                if (r < 0.02) {
                    gameState.entities.push(new Snake(x * TILE_SIZE, y * TILE_SIZE));
                } else if (r < 0.03) {
                    gameState.entities.push(new WalkerEnemy(x * TILE_SIZE, y * TILE_SIZE));
                } else if (r < 0.05) {
                    gameState.entities.push(new Gold(x * TILE_SIZE + 10, y * TILE_SIZE + 10));
                } else if (r < 0.055) {
                    gameState.entities.push(new Gem(x * TILE_SIZE + 10, y * TILE_SIZE + 10));
                } else if (r < 0.058) {
                    gameState.entities.push(new Heart(x * TILE_SIZE + 10, y * TILE_SIZE + 10));
                }
            }
            
            // Ceiling spawns (Bats)
            if (gameState.tiles[x][y] === TILE_TYPE.EMPTY && 
                gameState.tiles[x][y-1] !== TILE_TYPE.EMPTY &&
                Math.random() < 0.02) {
                 const distToStart = Math.hypot(x - 2, y - 2);
                 if (distToStart > 8) {
                    gameState.entities.push(new Bat(x * TILE_SIZE, y * TILE_SIZE));
                 }
            }
        }
    }
}