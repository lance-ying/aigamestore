/**
 * Cavern Tale - Level Management
 * Handles tilemap data, parsing, and rendering.
 */

import { TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, gameState, PALETTE } from './globals.js';
import { Player, Bat, Critter } from './entities.js';

// Tile Types
const T = {
    EMPTY: 0,
    WALL: 1,
    SPIKE: 2,
    DOOR: 3
};

export class Level {
    constructor() {
        this.tiles = []; // 2D array [row][col]
        this.rows = 0;
        this.cols = 0;
        this.widthPx = 0;
        this.heightPx = 0;
        
        // Define a simple level layout
        // W = Wall, S = Spike, P = Player Spawn, B = Bat, C = Critter, D = Door, . = Empty
        const mapData = [
            "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",
            "W................................................W",
            "W................................................W",
            "W..P.............................................W",
            "W................................................W",
            "WWWWWWW..........................................W",
            "W...................B............................W",
            "W...........WWWWWWWWWW.......B...................W",
            "W.......................................C........W",
            "W.........................WWW....................W",
            "W.......C........................................W",
            "W....WWWWWWW...........SSSSSSSS..................W",
            "W................................................W",
            "W......................................WWW.......W",
            "W............B...................................W",
            "W......WWWWWW....................................W",
            "W....................WWWW........................W",
            "W...........................C....................W",
            "W...........................................D....W",
            "WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW"
        ];
        
        this.parseMap(mapData);
    }

    parseMap(data) {
        this.rows = data.length;
        this.cols = data[0].length;
        this.widthPx = this.cols * TILE_SIZE;
        this.heightPx = this.rows * TILE_SIZE;
        
        this.tiles = [];
        
        for (let r = 0; r < this.rows; r++) {
            const row = [];
            const line = data[r];
            for (let c = 0; c < this.cols; c++) {
                const char = line[c];
                let type = T.EMPTY;
                let solid = false;
                
                switch (char) {
                    case 'W': 
                        type = 'WALL'; 
                        solid = true; 
                        break;
                    case 'S':
                        type = 'SPIKE';
                        // Spikes are not solid blocks but hurt, usually treated as non-solid for movement or solid floor?
                        // Let's make them 'solid' for floor logic but specific handling in collision
                        solid = true; 
                        break;
                    case 'D':
                        type = 'DOOR';
                        solid = false; // Overlap to enter
                        break;
                    case 'P':
                        new Player(c * TILE_SIZE, r * TILE_SIZE);
                        break;
                    case 'B':
                        new Bat(c * TILE_SIZE, r * TILE_SIZE);
                        break;
                    case 'C':
                        new Critter(c * TILE_SIZE, r * TILE_SIZE);
                        // Add floor under critter if air spawn to be safe
                        break;
                }
                
                row.push({ type, solid });
            }
            this.tiles.push(row);
        }
    }

    getTile(col, row) {
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            return this.tiles[row][col];
        }
        return null;
    }

    render(p, camera) {
        // Render only visible tiles
        const startCol = Math.floor(camera.x / TILE_SIZE);
        const endCol = Math.floor((camera.x + CANVAS_WIDTH) / TILE_SIZE) + 1;
        const startRow = Math.floor(camera.y / TILE_SIZE);
        const endRow = Math.floor((camera.y + CANVAS_HEIGHT) / TILE_SIZE) + 1;

        for (let r = startRow; r < endRow; r++) {
            if (r < 0 || r >= this.rows) continue;
            for (let c = startCol; c < endCol; c++) {
                if (c < 0 || c >= this.cols) continue;
                
                const tile = this.tiles[r][c];
                const x = c * TILE_SIZE;
                const y = r * TILE_SIZE;
                
                if (tile.type === 'WALL') {
                    p.fill(PALETTE.TILE_SOLID);
                    p.rect(x, y, TILE_SIZE, TILE_SIZE);
                    // Add slight texture/highlight
                    p.fill(PALETTE.TILE_ACCENT);
                    p.rect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                } else if (tile.type === 'SPIKE') {
                    p.fill(PALETTE.SPIKE);
                    p.triangle(x, y + TILE_SIZE, x + TILE_SIZE/2, y, x + TILE_SIZE, y + TILE_SIZE);
                } else if (tile.type === 'DOOR') {
                    p.fill(PALETTE.DOOR);
                    p.rect(x, y, TILE_SIZE, TILE_SIZE);
                    p.fill(0); // Door handle
                    p.circle(x + TILE_SIZE - 5, y + TILE_SIZE/2, 4);
                }
            }
        }
    }
}