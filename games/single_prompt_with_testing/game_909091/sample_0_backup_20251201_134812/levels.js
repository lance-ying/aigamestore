// Procedural Level Generation
import { TILE_SIZE, gameState, CANVAS_HEIGHT } from './globals.js';
import { Tile, Enemy, Collectible } from './entities.js';

// Simple map represented by strings
// . = empty
// G = Ground
// B = Brick
// ? = Lucky Block
// C = Coin
// H = Clover
// S = Snail
// Z = Bee
// P = Pot of Gold (Goal)

const LEVEL_BLUEPRINT = [
    "                                                                                                   ",
    "                                                                                                   ",
    "                                                                                                   ",
    "       C C C              C C C             ? ? ?                      C  C  C                     ",
    "      BBBBBBB            BBBBBBB           BBBBBBB          BB   BB   BBBBBBBBB                    ",
    "                                                                                                   ",
    "               S                  S                 Z                                              ",
    "G G G G G G G G G G    G G G G G G G G    G G G G G G G    G G G G G G G G G G G    G G G G G P",
    "G G G G G G G G G G    G G G G G G G G    G G G G G G G    G G G G G G G G G G G    G G G G G G"
];

export function generateLevel() {
    gameState.tiles = [];
    gameState.collectibles = [];
    gameState.entities = []; // Clear enemies

    const mapHeight = LEVEL_BLUEPRINT.length;
    
    // We want the bottom row to align with canvas bottom
    // Canvas Height 400. 9 rows * 40 = 360. 
    // Start Y = 400 - 360 = 40.
    const startY = CANVAS_HEIGHT - (mapHeight * TILE_SIZE);

    for (let row = 0; row < mapHeight; row++) {
        const line = LEVEL_BLUEPRINT[row];
        for (let col = 0; col < line.length; col++) {
            const char = line[col];
            const x = col * TILE_SIZE;
            const y = startY + (row * TILE_SIZE);

            if (char === 'G' || char === 'B' || char === '?') {
                gameState.tiles.push(new Tile(x, y, char));
            } else if (char === 'C') {
                gameState.collectibles.push(new Collectible(x + TILE_SIZE/2, y + TILE_SIZE/2, 'coin'));
            } else if (char === 'H') {
                gameState.collectibles.push(new Collectible(x + TILE_SIZE/2, y + TILE_SIZE/2, 'clover'));
            } else if (char === 'P') {
                gameState.collectibles.push(new Collectible(x + TILE_SIZE/2, y + TILE_SIZE, 'pot'));
            } else if (char === 'S') {
                gameState.entities.push(new Enemy(x, y, 'snail'));
            } else if (char === 'Z') {
                gameState.entities.push(new Enemy(x, y, 'bee'));
            }
        }
    }
    
    gameState.worldWidth = LEVEL_BLUEPRINT[0].length * TILE_SIZE;
    gameState.worldHeight = CANVAS_HEIGHT;
}