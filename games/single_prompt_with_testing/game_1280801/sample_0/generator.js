import { gameState, COLORS } from './globals.js';
import { Grid, CELL_TYPE } from './grid.js';
import { randomChoice, shuffleArray, isWithinBounds } from './utils.js';

export class LevelGenerator {
    static generate(levelIndex) {
        // Determine difficulty based on level index
        // Level 1: 5x5, 3 colors
        // Level 2: 5x5, 4 colors
        // Level 3: 6x6, 4 colors
        // Level 4: 6x6, 5 colors
        // Level 5: 7x7, 5 colors
        // etc.
        
        let size = 5 + Math.floor((levelIndex - 1) / 2);
        size = Math.min(size, 9); // Cap at 9x9
        
        let numColors = 3 + Math.floor((levelIndex - 1) / 2);
        numColors = Math.min(numColors, COLORS.length); // Cap at max available colors

        // Attempt to generate a valid level
        let attempts = 0;
        let success = false;
        
        while (!success && attempts < 100) {
            success = this.tryGenerateLevel(size, size, numColors);
            attempts++;
        }
        
        if (!success) {
            console.warn("Failed to generate level, fallback to basic");
            this.createFallbackLevel();
        }
    }

    static tryGenerateLevel(width, height, numColors) {
        const grid = new Grid(width, height);
        const paths = []; // Stores the solution paths
        
        // Strategy: Random Walk with Backtracking / "Snake" growth
        // 1. Initialize empty grid
        // 2. Pick random start points for N colors
        // 3. Grow them step by step until grid is full or stuck
        
        let availableCells = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                availableCells.push({x, y});
            }
        }
        
        // Initialize paths
        for (let i = 0; i < numColors; i++) {
            // Pick a random empty cell for start
            if (availableCells.length === 0) return false;
            const idx = Math.floor(Math.random() * availableCells.length);
            const start = availableCells[idx];
            availableCells.splice(idx, 1);
            
            paths.push([start]);
            grid.getCell(start.x, start.y).colorIndex = i;
            grid.getCell(start.x, start.y).type = CELL_TYPE.DOT; // Temporarily mark as occupied
        }
        
        // Grow paths until grid is mostly full
        let stuckCount = 0;
        let totalCells = width * height;
        let filledCells = numColors;
        
        // Loop until all full or all stuck
        while (filledCells < totalCells && stuckCount < numColors) {
            stuckCount = 0;
            
            // Try to extend each path
            for (let i = 0; i < numColors; i++) {
                const path = paths[i];
                const head = path[path.length - 1];
                
                const neighbors = [
                    {x: head.x, y: head.y - 1},
                    {x: head.x + 1, y: head.y},
                    {x: head.x, y: head.y + 1},
                    {x: head.x - 1, y: head.y}
                ];
                
                shuffleArray(neighbors);
                
                let moved = false;
                for (const n of neighbors) {
                    if (isWithinBounds(n.x, n.y, width, height)) {
                        const cell = grid.getCell(n.x, n.y);
                        // Must be empty (colorIndex -1)
                        if (cell.colorIndex === -1) {
                            cell.colorIndex = i;
                            cell.type = CELL_TYPE.PIPE; // Mark occupied
                            path.push(n);
                            filledCells++;
                            moved = true;
                            break;
                        }
                    }
                }
                
                if (!moved) {
                    stuckCount++;
                }
            }
        }
        
        // Validation
        // 1. Check coverage (should be high, > 90% or 100% for perfection)
        if (filledCells < totalCells * 0.9) return false;
        
        // 2. Check path lengths (min length 3 to be interesting)
        for (const path of paths) {
            if (path.length < 3) return false;
        }
        
        // If successful, setup gameState
        gameState.gridWidth = width;
        gameState.gridHeight = height;
        gameState.activeColors = COLORS.slice(0, numColors);
        gameState.solutionPaths = paths; // Save solution for testing
        
        // Reset grid to initial state (only dots)
        const finalGrid = new Grid(width, height);
        paths.forEach((path, colorIdx) => {
            const start = path[0];
            const end = path[path.length - 1];
            
            const startCell = finalGrid.getCell(start.x, start.y);
            startCell.type = CELL_TYPE.DOT;
            startCell.colorIndex = colorIdx;
            
            const endCell = finalGrid.getCell(end.x, end.y);
            endCell.type = CELL_TYPE.DOT;
            endCell.colorIndex = colorIdx;
        });
        
        gameState.grid = finalGrid;
        gameState.cells = finalGrid.cells; // Reference for easy access
        
        // Reset paths in state
        gameState.paths = {};
        for(let i=0; i<numColors; i++) {
            gameState.paths[i] = [];
        }
        
        return true;
    }

    static createFallbackLevel() {
        // Simple 5x5 fallback
        gameState.gridWidth = 5;
        gameState.gridHeight = 5;
        gameState.activeColors = COLORS.slice(0, 3);
        
        const grid = new Grid(5, 5);
        
        // Red
        grid.getCell(0, 0).type = CELL_TYPE.DOT; grid.getCell(0, 0).colorIndex = 0;
        grid.getCell(4, 0).type = CELL_TYPE.DOT; grid.getCell(4, 0).colorIndex = 0;
        
        // Green
        grid.getCell(0, 2).type = CELL_TYPE.DOT; grid.getCell(0, 2).colorIndex = 1;
        grid.getCell(4, 2).type = CELL_TYPE.DOT; grid.getCell(4, 2).colorIndex = 1;
        
        // Blue
        grid.getCell(0, 4).type = CELL_TYPE.DOT; grid.getCell(0, 4).colorIndex = 2;
        grid.getCell(4, 4).type = CELL_TYPE.DOT; grid.getCell(4, 4).colorIndex = 2;
        
        gameState.grid = grid;
        gameState.cells = grid.cells;
        gameState.solutionPaths = []; // No solution for fallback
        
        gameState.paths = {};
        for(let i=0; i<3; i++) gameState.paths[i] = [];
    }
}