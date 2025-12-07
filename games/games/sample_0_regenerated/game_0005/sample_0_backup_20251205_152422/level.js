/**
 * level.js
 * Handles procedural generation and tile management.
 */

import { TILE_SIZE, WORLD_COLS, WORLD_ROWS, COLORS } from './globals.js';
import { randomInt, randomChoice } from './utils.js';

// Tile Types
export const TILE = {
    EMPTY: 0,
    DIRT: 1,
    ROCK: 2, // Indestructible border
    LADDER: 3,
    ENTRANCE: 4,
    EXIT: 5
};

export class Level {
    constructor(p) {
        this.cols = WORLD_COLS;
        this.rows = WORLD_ROWS;
        this.tiles = [];
        this.startPos = { x: 0, y: 0 };
        this.exitPos = { x: 0, y: 0 };
        this.generate(p);
    }

    generate(p) {
        // Initialize grid with Dirt
        this.tiles = Array(this.cols).fill().map(() => Array(this.rows).fill(TILE.DIRT));

        // Create Borders
        for (let x = 0; x < this.cols; x++) {
            this.tiles[x][0] = TILE.ROCK;
            this.tiles[x][this.rows - 1] = TILE.ROCK;
        }
        for (let y = 0; y < this.rows; y++) {
            this.tiles[0][y] = TILE.ROCK;
            this.tiles[this.cols - 1][y] = TILE.ROCK;
        }

        // Drunkard's Walk / Digger for main path
        // Start near top-center
        let currX = Math.floor(this.cols / 2);
        let currY = 1;
        this.startPos = { x: currX * TILE_SIZE + TILE_SIZE/2, y: currY * TILE_SIZE + TILE_SIZE/2 };
        
        this.tiles[currX][currY] = TILE.ENTRANCE;
        
        let pathLength = 0;
        const targetPathLength = this.rows * 4; 
        
        while (currY < this.rows - 2) {
            // Dig current spot
            if (this.tiles[currX][currY] === TILE.DIRT) {
                this.tiles[currX][currY] = TILE.EMPTY;
            }

            // Move randomly
            // Weights: Down (40%), Left (25%), Right (25%), Up (5% - rarely go back)
            const r = p.random();
            let nextX = currX;
            let nextY = currY;

            if (r < 0.45) {
                nextY++;
            } else if (r < 0.7) {
                nextX--;
            } else if (r < 0.95) {
                nextX++;
            } else {
                nextY--;
            }

            // Constrain to inner bounds
            nextX = Math.max(1, Math.min(this.cols - 2, nextX));
            nextY = Math.max(1, Math.min(this.rows - 2, nextY));

            // If we moved down, maybe place a ladder if there is a big drop? 
            // Simplified: Just ensure connectivity.
            // Spelunky logic: if we go down, we might need to come back up? 
            // For this simpler version, we just ensure a clear path.
            
            currX = nextX;
            currY = nextY;
            
            // Dig destination
            if (this.tiles[currX][currY] === TILE.DIRT) {
                this.tiles[currX][currY] = TILE.EMPTY;
                
                // Random chance to create a room (3x3 open space)
                if (p.random() < 0.05) {
                    this.digRoom(currX, currY, 3, 3);
                }
            }
        }
        
        // Place Exit
        this.tiles[currX][currY] = TILE.EXIT;
        this.exitPos = { x: currX * TILE_SIZE + TILE_SIZE/2, y: currY * TILE_SIZE + TILE_SIZE/2 };

        // Post-processing: Add Random Caves
        for (let i = 0; i < 50; i++) {
            const rx = randomInt(p, 1, this.cols - 1);
            const ry = randomInt(p, 1, this.rows - 1);
            this.digRoom(rx, ry, randomInt(p, 2, 5), randomInt(p, 2, 4));
        }

        // Post-processing: Place Ladders
        // Simple logic: if a tile is empty and the one below is empty, put a ladder?
        // Actually, let's just place ladders in vertical shafts randomly.
        for (let x = 1; x < this.cols - 1; x++) {
            for (let y = 1; y < this.rows - 1; y++) {
                if (this.tiles[x][y] === TILE.EMPTY && this.tiles[x][y+1] === TILE.EMPTY && this.tiles[x][y-1] === TILE.EMPTY) {
                    if (p.random() < 0.2) {
                        // Create a ladder column
                        let ly = y;
                        while(this.tiles[x][ly] === TILE.EMPTY && ly < this.rows - 1) {
                            this.tiles[x][ly] = TILE.LADDER;
                            ly++;
                        }
                    }
                }
            }
        }
    }

    digRoom(x, y, w, h) {
        for(let i = x - Math.floor(w/2); i <= x + Math.floor(w/2); i++) {
            for(let j = y - Math.floor(h/2); j <= y + Math.floor(h/2); j++) {
                if(i > 0 && i < this.cols - 1 && j > 0 && j < this.rows - 1) {
                    if(this.tiles[i][j] === TILE.DIRT) {
                        this.tiles[i][j] = TILE.EMPTY;
                    }
                }
            }
        }
    }

    getTileAt(x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return TILE.ROCK;
        return this.tiles[x][y];
    }

    getTileAtPixel(px, py) {
        const tx = Math.floor(px / TILE_SIZE);
        const ty = Math.floor(py / TILE_SIZE);
        return this.getTileAt(tx, ty);
    }
    
    getTileBounds(tx, ty) {
        return {
            x: tx * TILE_SIZE,
            y: ty * TILE_SIZE,
            w: TILE_SIZE,
            h: TILE_SIZE
        };
    }

    render(p, camera) {
        // Calculate visible range
        const startCol = Math.floor(camera.x / TILE_SIZE);
        const endCol = startCol + (CANVAS_WIDTH / TILE_SIZE) + 1;
        const startRow = Math.floor(camera.y / TILE_SIZE);
        const endRow = startRow + (CANVAS_HEIGHT / TILE_SIZE) + 1;

        for (let x = startCol; x <= endCol; x++) {
            for (let y = startRow; y <= endRow; y++) {
                const tile = this.getTileAt(x, y);
                if (tile === TILE.EMPTY) continue;

                const drawX = x * TILE_SIZE;
                const drawY = y * TILE_SIZE;
                
                p.noStroke();
                switch (tile) {
                    case TILE.DIRT:
                        p.fill(COLORS.TILE_DIRT);
                        p.rect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                        // Detail
                        p.fill(0, 0, 0, 30);
                        p.rect(drawX + 5, drawY + 5, TILE_SIZE - 10, TILE_SIZE - 10);
                        break;
                    case TILE.ROCK:
                        p.fill(COLORS.TILE_ROCK);
                        p.rect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                        break;
                    case TILE.LADDER:
                        p.fill(COLORS.TILE_LADDER);
                        // Draw ladder rails
                        p.rect(drawX + 10, drawY, 5, TILE_SIZE);
                        p.rect(drawX + 25, drawY, 5, TILE_SIZE);
                        // Rungs
                        for(let i=0; i<4; i++) {
                            p.rect(drawX + 10, drawY + i * 10 + 2, 20, 4);
                        }
                        break;
                    case TILE.ENTRANCE:
                        p.fill(100);
                        p.rect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                        p.fill(0);
                        p.rect(drawX + 10, drawY + 10, 20, 30);
                        break;
                    case TILE.EXIT:
                        p.fill(COLORS.TILE_EXIT);
                        p.rect(drawX, drawY, TILE_SIZE, TILE_SIZE);
                        p.fill(0);
                        p.rect(drawX + 10, drawY + 10, 20, 30);
                        p.fill(255, 0, 0); // Exit sign
                        p.rect(drawX + 5, drawY - 5, 30, 10);
                        break;
                }
            }
        }
    }
}