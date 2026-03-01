/**
 * World generation and map management.
 */

import { gameState, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player, Enemy, Interactable, Pickup } from './entities.js';

// 0: Floor, 1: Wall, S: Start, E: Exit, K: Key Chest/Item, C: Chest, D: Door, 
// X: Skeleton, B: Bat, M: Mage
const LEVEL_MAP = [
    "11111111111111111111",
    "1S0000100000001000C1",
    "1000001000X000100001",
    "10011110000000D00001",
    "1001K000001111111111",
    "100100X0001000000001",
    "10011111111000M00001",
    "1000000000D000000001",
    "11111000001111100001",
    "1C00000B001000000001",
    "1000000000100B000001",
    "1111111D111000000001",
    "1000000000000M000E01",
    "100X0000001000000001",
    "11111111111111111111"
];

class Tile {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'FLOOR', 'WALL'
        this.solid = (type === 'WALL');
    }

    render(p) {
        if (this.type === 'WALL') {
            // Draw wall with depth effect
            p.fill('#4a4a5a');
            p.rect(this.x, this.y, TILE_SIZE, TILE_SIZE);
            p.fill('#2a2a3a'); // Top shadow
            p.rect(this.x, this.y + TILE_SIZE - 5, TILE_SIZE, 5);
        } else {
            // Draw floor
            if ((this.x / TILE_SIZE + this.y / TILE_SIZE) % 2 === 0) {
                p.fill('#232330');
            } else {
                p.fill('#262635');
            }
            p.rect(this.x, this.y, TILE_SIZE, TILE_SIZE);
            
            // Random cracks/details
            // Optimized: Don't draw complex details per tile every frame in JS without caching
            // Just simple color variation is fine
        }
    }
}

export function initWorld(p) {
    gameState.world = [];
    gameState.entities = [];
    gameState.enemies = [];
    gameState.interactables = [];
    gameState.pickups = [];
    
    gameState.mapHeight = LEVEL_MAP.length;
    gameState.mapWidth = LEVEL_MAP[0].length;
    
    for (let r = 0; r < gameState.mapHeight; r++) {
        const row = [];
        const mapRow = LEVEL_MAP[r];
        
        for (let c = 0; c < gameState.mapWidth; c++) {
            const char = mapRow[c];
            const x = c * TILE_SIZE;
            const y = r * TILE_SIZE;
            
            // Default tile
            let type = 'FLOOR';
            if (char === '1') type = 'WALL';
            
            row.push(new Tile(x, y, type));
            
            // Entities
            if (char === 'S') {
                gameState.player = new Player(x + 10, y + 10);
            } else if (char === 'X') {
                new Enemy(x + 10, y + 10, 'SKELETON');
            } else if (char === 'B') {
                new Enemy(x + 10, y + 10, 'BAT');
            } else if (char === 'M') {
                new Enemy(x + 10, y + 10, 'MAGE');
            } else if (char === 'C') {
                gameState.interactables.push(new Interactable(x, y, 'CHEST'));
            } else if (char === 'D') {
                gameState.interactables.push(new Interactable(x, y, 'DOOR'));
            } else if (char === 'E') {
                gameState.interactables.push(new Interactable(x, y, 'EXIT'));
            } else if (char === 'K') {
                gameState.pickups.push(new Pickup(x + 12, y + 12, 'KEY'));
            }
        }
        gameState.world.push(row);
    }
    
    // Add player to entities list
    if (gameState.player) {
        gameState.entities.push(gameState.player);
    }
    
    // Add enemies to entities
    gameState.enemies.forEach(e => gameState.entities.push(e));
}

export function renderWorld(p) {
    // Only render visible tiles
    const startCol = Math.floor(gameState.camera.x / TILE_SIZE);
    const endCol = startCol + (CANVAS_WIDTH / TILE_SIZE) + 1;
    const startRow = Math.floor(gameState.camera.y / TILE_SIZE);
    const endRow = startRow + (CANVAS_HEIGHT / TILE_SIZE) + 1;

    for (let r = startRow; r <= endRow; r++) {
        for (let c = startCol; c <= endCol; c++) {
            if (r >= 0 && r < gameState.mapHeight && c >= 0 && c < gameState.mapWidth) {
                gameState.world[r][c].render(p);
            }
        }
    }
}