import { gameState, COLORS } from './globals.js';
import { isWithinBounds } from './utils.js';

export const CELL_TYPE = {
    EMPTY: 0,
    DOT: 1,
    PIPE: 2
};

export class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.type = CELL_TYPE.EMPTY;
        this.colorIndex = -1; // -1 means no color
        this.connections = { n: false, e: false, s: false, w: false };
    }

    reset() {
        if (this.type === CELL_TYPE.PIPE) {
            this.type = CELL_TYPE.EMPTY;
            this.colorIndex = -1;
            this.connections = { n: false, e: false, s: false, w: false };
        } else if (this.type === CELL_TYPE.DOT) {
            // Keep dots, but reset connections
            this.connections = { n: false, e: false, s: false, w: false };
        }
    }
    
    // Helper to clear connections
    clearConnections() {
        this.connections = { n: false, e: false, s: false, w: false };
    }
}

export class Grid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.cells = [];
        this.initialize();
    }

    initialize() {
        this.cells = [];
        for (let y = 0; y < this.height; y++) {
            const row = [];
            for (let x = 0; x < this.width; x++) {
                row.push(new Cell(x, y));
            }
            this.cells.push(row);
        }
    }

    getCell(x, y) {
        if (!isWithinBounds(x, y, this.width, this.height)) return null;
        return this.cells[y][x];
    }

    // Called when a level is generated or restarted
    clearPipes() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.cells[y][x].reset();
            }
        }
        // Also clear game state paths
        gameState.paths = {};
        gameState.completedColors = [];
        
        // Initialize paths for each color based on dots
        gameState.activeColors.forEach((_, idx) => {
            gameState.paths[idx] = [];
        });
    }

    isFull() {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.cells[y][x].type === CELL_TYPE.EMPTY) return false;
            }
        }
        return true;
    }
    
    // Update connectivity bits based on current paths in gameState
    updateConnections() {
        // Reset all connections first
        for(let y=0; y<this.height; y++) {
            for(let x=0; x<this.width; x++) {
                this.cells[y][x].clearConnections();
            }
        }

        // Rebuild from paths
        Object.keys(gameState.paths).forEach(colorIdxStr => {
            const colorIdx = parseInt(colorIdxStr);
            const path = gameState.paths[colorIdx];
            
            if (!path || path.length < 2) return;

            for (let i = 0; i < path.length - 1; i++) {
                const curr = path[i];
                const next = path[i+1];
                
                const c1 = this.getCell(curr.x, curr.y);
                const c2 = this.getCell(next.x, next.y);
                
                if (c1 && c2) {
                    if (next.y < curr.y) { c1.connections.n = true; c2.connections.s = true; }
                    if (next.x > curr.x) { c1.connections.e = true; c2.connections.w = true; }
                    if (next.y > curr.y) { c1.connections.s = true; c2.connections.n = true; }
                    if (next.x < curr.x) { c1.connections.w = true; c2.connections.e = true; }
                }
            }
        });
    }
}