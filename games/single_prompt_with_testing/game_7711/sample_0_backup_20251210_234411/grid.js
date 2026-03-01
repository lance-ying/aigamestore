/**
 * grid.js
 * HexGrid data structure, Tile class, and Pathfinding.
 */

import { HexMath, drawHex } from './utils.js';
import { CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Tile {
    constructor(q, r, col, row) {
        this.q = q;
        this.r = r;
        this.col = col;
        this.row = row;
        this.type = 'FLOOR'; // FLOOR, WALL, LAVA, EXIT, VOID
        this.entity = null; // Reference to entity standing here
        
        const pos = HexMath.hexToPixel(q, r);
        this.pixelX = pos.x;
        this.pixelY = pos.y;
        
        // Visuals
        this.highlight = 0; // For flashing
        this.visited = false;
    }

    render(p) {
        if (this.type === 'VOID') return;

        let color;
        switch(this.type) {
            case 'WALL': color = p.color(60, 60, 70); break;
            case 'LAVA': 
                const pulse = Math.sin(p.frameCount * 0.05) * 30;
                color = p.color(180 + pulse, 50, 20); 
                break;
            case 'EXIT': color = p.color(200, 200, 255); break;
            default: // FLOOR
                color = p.color(40, 40, 50);
                if (this.visited) color = p.color(50, 50, 60);
        }

        if (this.highlight > 0) {
            color = p.lerpColor(color, p.color(255, 255, 255), this.highlight);
            this.highlight *= 0.9;
        }

        drawHex(p, this.pixelX, this.pixelY, CONFIG.GRID_SIZE - 2, "fill", color);
        
        // Border
        p.stroke(20, 20, 25);
        p.strokeWeight(1);
        p.noFill();
        drawHex(p, this.pixelX, this.pixelY, CONFIG.GRID_SIZE - 2, "stroke", 0);

        // Decor for Exit
        if (this.type === 'EXIT') {
            p.noFill();
            p.stroke(255, 255, 100);
            p.strokeWeight(2);
            p.circle(this.pixelX, this.pixelY, CONFIG.GRID_SIZE * 0.8);
        }
        
        // Decor for Wall
        if (this.type === 'WALL') {
            p.fill(30);
            p.noStroke();
            p.rectMode(p.CENTER);
            p.rect(this.pixelX, this.pixelY, 15, 15);
        }
    }
}

export class HexGrid {
    constructor(cols, rows) {
        this.cols = cols;
        this.rows = rows;
        this.tiles = new Map(); // Key: "q,r", Value: Tile
        this.tileArray = []; // Linear array for iteration

        this.initGrid();
    }

    initGrid() {
        for (let c = 0; c < this.cols; c++) {
            for (let r = 0; r < this.rows; r++) {
                const axial = HexMath.offsetToAxial(c, r);
                const tile = new Tile(axial.q, axial.r, c, r);
                this.tiles.set(`${axial.q},${axial.r}`, tile);
                this.tileArray.push(tile);
            }
        }
    }

    getTile(q, r) {
        return this.tiles.get(`${q},${r}`);
    }
    
    getTileByOffset(col, row) {
        const axial = HexMath.offsetToAxial(col, row);
        return this.getTile(axial.q, axial.r);
    }

    getNeighbors(tile, ignoreObstacles = false) {
        const coords = HexMath.getNeighbors(tile.q, tile.r);
        const neighbors = [];
        coords.forEach(c => {
            const t = this.getTile(c.q, c.r);
            if (t && t.type !== 'VOID') {
                if (ignoreObstacles || (t.type !== 'WALL' && t.entity === null)) {
                    neighbors.push(t);
                } else if (!ignoreObstacles && (t.type === 'WALL' || t.entity !== null)) {
                    // It's a neighbor but blocked
                }
            }
        });
        return neighbors;
    }
    
    // For AI: Get neighbors even if blocked by entity (but not walls)
    getWalkableNeighbors(tile) {
        const coords = HexMath.getNeighbors(tile.q, tile.r);
        const neighbors = [];
        coords.forEach(c => {
            const t = this.getTile(c.q, c.r);
            if (t && t.type !== 'VOID' && t.type !== 'WALL') {
                neighbors.push(t);
            }
        });
        return neighbors;
    }

    render(p) {
        // Sort by Y for simple depth sorting
        // this.tileArray.sort((a, b) => a.pixelY - b.pixelY); // Optimization: Pre-sort or don't sort if unnecessary for flat tiles
        
        this.tileArray.forEach(tile => tile.render(p));
    }
}

// Simple Pathfinding (BFS) for uniform cost, or A*
export class Pathfinder {
    static findPath(startTile, endTile, grid, ignoreEntities = false) {
        if (!startTile || !endTile) return null;

        const frontier = [];
        frontier.push(startTile);
        const cameFrom = new Map();
        cameFrom.set(startTile, null);

        while (frontier.length > 0) {
            const current = frontier.shift();

            if (current === endTile) {
                break;
            }

            const neighbors = grid.getWalkableNeighbors(current);
            for (const next of neighbors) {
                // If checking for movement, we can't walk through entities unless it's the target (to attack)
                let isBlocked = false;
                if (!ignoreEntities && next.entity !== null && next !== endTile) {
                    isBlocked = true;
                }
                
                if (next.type === 'LAVA') isBlocked = false; // Can walk on lava (takes dmg)

                if (!cameFrom.has(next) && !isBlocked) {
                    frontier.push(next);
                    cameFrom.set(next, current);
                }
            }
        }

        if (!cameFrom.has(endTile)) return null; // No path

        // Reconstruct
        const path = [];
        let curr = endTile;
        while (curr !== startTile) {
            path.push(curr);
            curr = cameFrom.get(curr);
        }
        path.reverse(); // Start -> End
        return path;
    }
}