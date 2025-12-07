import { TILE_SIZE, gameState, COLORS } from './globals.js';
import { Enemy, Collectible } from './entities.js';
import { randomInt, randomChoice } from './utils.js';

export class Tile {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 1: Ground, 2: Brick, 3: Question, 4: Hard Block
        this.solid = true;
        this.active = true; // For question blocks
    }
    
    render(p) {
        if (!this.active && this.type === 3) {
            p.fill(100); // Used block
        } else if (this.type === 1) {
            p.fill(COLORS.GROUND);
        } else if (this.type === 2) {
            p.fill(COLORS.BRICK);
        } else if (this.type === 3) {
            p.fill(COLORS.QUESTION_BLOCK);
        } else {
            p.fill(50);
        }
        
        p.stroke(0, 50);
        p.strokeWeight(1);
        p.rect(this.x * TILE_SIZE, this.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        
        // Detail
        if (this.type === 1) {
            p.fill(COLORS.GRASS);
            p.noStroke();
            p.rect(this.x * TILE_SIZE, this.y * TILE_SIZE, TILE_SIZE, 8);
        } else if (this.type === 2) {
             p.stroke(0, 50);
             p.line(this.x * TILE_SIZE, this.y * TILE_SIZE + 10, this.x * TILE_SIZE + TILE_SIZE, this.y * TILE_SIZE + 10);
        } else if (this.type === 3 && this.active) {
            p.fill(255);
            p.noStroke();
            p.textSize(20);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("?", this.x * TILE_SIZE + TILE_SIZE/2, this.y * TILE_SIZE + TILE_SIZE/2);
        }
    }
}

export function generateLevel(p) {
    gameState.tiles = [];
    const height = Math.ceil(400 / TILE_SIZE) + 2; // + buffer
    const width = 150; // Level length in tiles
    gameState.levelLength = width;
    
    // Init empty grid
    for (let x = 0; x < width; x++) {
        gameState.tiles[x] = new Array(height).fill(null);
    }
    
    // Floor generation
    let groundHeight = 8; // From top, index 8 (of ~12)
    
    for (let x = 0; x < width; x++) {
        // Safe zone at start and end
        if (x < 10 || x > width - 10) {
             for (let y = groundHeight; y < height; y++) {
                 gameState.tiles[x][y] = new Tile(x, y, 1);
             }
        } else {
            // Random pits
            if (Math.random() < 0.1) {
                // Pit, place nothing
                // Maybe a floating platform to help?
                if (Math.random() < 0.5) {
                    gameState.tiles[x][groundHeight - 3] = new Tile(x, groundHeight - 3, 2);
                }
            } else {
                for (let y = groundHeight; y < height; y++) {
                    gameState.tiles[x][y] = new Tile(x, y, 1);
                }
                
                // Obstacles & Platforms
                if (Math.random() < 0.2) {
                    // Floating Brick Platform
                    let h = groundHeight - 3; // Jump height
                    gameState.tiles[x][h] = new Tile(x, h, 2);
                    
                    // Question block sometimes
                    if (Math.random() < 0.3) {
                         gameState.tiles[x][h - 3] = new Tile(x, h - 3, 3);
                    }
                    
                    // Enemy on ground
                    if (Math.random() < 0.2) {
                        new Enemy(x * TILE_SIZE, (groundHeight - 1) * TILE_SIZE, 'SNAIL');
                    }
                }
                
                // Bee in air
                if (Math.random() < 0.05) {
                    new Enemy(x * TILE_SIZE, (groundHeight - 5) * TILE_SIZE, 'BEE');
                }
                
                // Coins
                if (Math.random() < 0.3) {
                    new Collectible(x * TILE_SIZE + TILE_SIZE/2, (groundHeight - 1) * TILE_SIZE - 20, 'COIN');
                }
            }
        }
    }
    
    // Walls at start and end
    for(let y=0; y<height; y++) {
        gameState.tiles[0][y] = new Tile(0, y, 4);
        gameState.tiles[width-1][y] = new Tile(width-1, y, 4);
    }
    
    // Pot of Gold
    new Collectible((width - 5) * TILE_SIZE, (groundHeight - 1) * TILE_SIZE - 10, 'POT');
    
    // Create rainbow tiles? (Visual only, maybe particle system later)
}