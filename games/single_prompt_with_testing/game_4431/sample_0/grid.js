/**
 * grid.js
 * Grid management and rendering.
 */

import { gameState, GRID_COLS, GRID_ROWS, TILE_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from './globals.js';
import { Tile, Building, Mountain } from './entities.js';

export class GridSystem {
    constructor(p) {
        this.p = p;
    }

    initialize() {
        gameState.grid = [];
        for (let x = 0; x < GRID_COLS; x++) {
            gameState.grid[x] = [];
            for (let y = 0; y < GRID_ROWS; y++) {
                gameState.grid[x][y] = new Tile(x, y);
            }
        }
    }

    generateMap(p) {
        this.initialize();
        gameState.buildings = [];
        gameState.entities = []; // Clear entities, player added separately

        // Place Buildings (Randomly but avoiding center start area)
        let buildingCount = 0;
        while (buildingCount < 4) {
            let x = Math.floor(p.random(GRID_COLS));
            let y = Math.floor(p.random(GRID_ROWS));
            
            // Avoid edges for variety, keep center somewhat open
            if (gameState.grid[x][y].type === "EMPTY") {
                gameState.grid[x][y].type = "BUILDING";
                const b = new Building(x, y);
                gameState.buildings.push(b);
                gameState.grid[x][y].entity = b;
                buildingCount++;
            }
        }

        // Place Mountains
        let mountainCount = 0;
        while (mountainCount < 3) {
            let x = Math.floor(p.random(GRID_COLS));
            let y = Math.floor(p.random(GRID_ROWS));
            if (gameState.grid[x][y].type === "EMPTY") {
                gameState.grid[x][y].type = "MOUNTAIN";
                const m = new Mountain(x, y);
                // Mountains are entities in physics list for rendering/collision
                // But we treat them specially. 
                // To simplify: treat as specialized entity that blocks movement
                gameState.grid[x][y].entity = m; 
                gameState.buildings.push(m); // reuse array or create obstacles array?
                // Let's put them in buildings for rendering loop
                mountainCount++;
            }
        }
        
        // Add Water? Maybe later.
    }

    render(p) {
        // Draw Grid Board
        p.push();
        p.translate(GRID_OFFSET_X, GRID_OFFSET_Y);
        
        for (let x = 0; x < GRID_COLS; x++) {
            for (let y = 0; y < GRID_ROWS; y++) {
                // Tile Base
                const tile = gameState.grid[x][y];
                const px = x * TILE_SIZE;
                const py = y * TILE_SIZE;
                
                // Color based on type
                if (tile.type === "WATER") {
                    p.fill(50, 100, 200);
                } else {
                    // Checkerboard pattern for empty ground
                    if ((x + y) % 2 === 0) p.fill(40, 40, 50);
                    else p.fill(45, 45, 55);
                }
                
                p.stroke(30);
                p.rect(px, py, TILE_SIZE, TILE_SIZE);

                // Highlight Valid Moves
                if (gameState.selectionState === "MOVING" && this.isValidMove(x, y)) {
                    p.fill(0, 255, 0, 50);
                    p.rect(px, py, TILE_SIZE, TILE_SIZE);
                    p.fill(0, 255, 0);
                    p.circle(px + TILE_SIZE/2, py + TILE_SIZE/2, 5);
                }

                // Highlight Attack Targets
                if (gameState.selectionState === "TARGETING") {
                    // Check if this tile is in validTargets
                    const isTarget = gameState.validTargets.some(t => t.x === x && t.y === y);
                    if (isTarget) {
                        p.fill(255, 0, 0, 100);
                        p.rect(px, py, TILE_SIZE, TILE_SIZE);
                    }
                }

                // Enemy Intent Telegraphing
                // Iterate enemies to draw danger zones on grid
                gameState.entities.forEach(entity => {
                    if (entity.type === "VEK" && !entity.isDead && entity.intent) {
                        if (entity.intent.target.x === x && entity.intent.target.y === y) {
                            // Hatch lines for danger
                            p.stroke(255, 0, 0, 100);
                            p.strokeWeight(2);
                            p.line(px, py, px + TILE_SIZE, py + TILE_SIZE);
                            p.line(px + TILE_SIZE, py, px, py + TILE_SIZE);
                        }
                    }
                });
            }
        }

        // Draw Cursor
        const cx = gameState.cursor.x * TILE_SIZE;
        const cy = gameState.cursor.y * TILE_SIZE;
        
        p.noFill();
        p.stroke(255, 255, 0);
        p.strokeWeight(3);
        // Animated corner brackets
        const time = p.millis() / 500;
        const offset = Math.sin(time) * 3;
        const cornerLen = 10;
        
        // TL
        p.beginShape(); p.vertex(cx - offset, cy + cornerLen - offset); p.vertex(cx - offset, cy - offset); p.vertex(cx + cornerLen - offset, cy - offset); p.endShape();
        // TR
        p.beginShape(); p.vertex(cx + TILE_SIZE - cornerLen + offset, cy - offset); p.vertex(cx + TILE_SIZE + offset, cy - offset); p.vertex(cx + TILE_SIZE + offset, cy + cornerLen - offset); p.endShape();
        // BR
        p.beginShape(); p.vertex(cx + TILE_SIZE + offset, cy + TILE_SIZE - cornerLen + offset); p.vertex(cx + TILE_SIZE + offset, cy + TILE_SIZE + offset); p.vertex(cx + TILE_SIZE - cornerLen + offset, cy + TILE_SIZE + offset); p.endShape();
        // BL
        p.beginShape(); p.vertex(cx + cornerLen - offset, cy + TILE_SIZE + offset); p.vertex(cx - offset, cy + TILE_SIZE + offset); p.vertex(cx - offset, cy + TILE_SIZE - cornerLen + offset); p.endShape();

        p.pop();
    }

    isValidMove(x, y) {
        return gameState.validMoves.some(m => m.x === x && m.y === y);
    }
}