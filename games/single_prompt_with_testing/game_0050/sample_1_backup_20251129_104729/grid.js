import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_CELL_SIZE, GRID_COLS, GRID_ROWS, gameState, COLORS } from './globals.js';
import { worldToGrid, pointInPolygon, getBoundingBox } from './utils.js';

export class GameGrid {
    constructor(p) {
        // Flat array for performance: index = row * GRID_COLS + col
        this.cells = new Uint8Array(GRID_COLS * GRID_ROWS).fill(0);
        
        // p5.Graphics buffer for rendering the territories efficiently
        this.buffer = p.createGraphics(CANVAS_WIDTH, CANVAS_HEIGHT);
        this.buffer.noStroke();
        this.buffer.background(p.color(COLORS.BACKGROUND));
        
        this.needsUpdate = true;
    }

    reset(p) {
        this.cells.fill(0);
        this.buffer.background(p.color(COLORS.BACKGROUND));
        this.needsUpdate = true;
    }

    // Set a circular area to a specific owner (used for initial spawn)
    setSpawnArea(centerX, centerY, radius, ownerId, p) {
        const gridPos = worldToGrid(centerX, centerY);
        const radiusInCells = Math.floor(radius / GRID_CELL_SIZE);
        
        const minCol = Math.max(0, gridPos.col - radiusInCells);
        const maxCol = Math.min(GRID_COLS - 1, gridPos.col + radiusInCells);
        const minRow = Math.max(0, gridPos.row - radiusInCells);
        const maxRow = Math.min(GRID_ROWS - 1, gridPos.row + radiusInCells);

        let changed = false;
        
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                const dx = c - gridPos.col;
                const dy = r - gridPos.row;
                if (dx * dx + dy * dy <= radiusInCells * radiusInCells) {
                    const idx = r * GRID_COLS + c;
                    if (this.cells[idx] !== ownerId) {
                        this.cells[idx] = ownerId;
                        changed = true;
                        
                        // Update buffer immediately for spawn
                        const x = c * GRID_CELL_SIZE;
                        const y = r * GRID_CELL_SIZE;
                        this.drawCellToBuffer(x, y, ownerId, p);
                    }
                }
            }
        }
        return changed;
    }

    isOwned(x, y, ownerId) {
        const gp = worldToGrid(x, y);
        if (gp.col < 0 || gp.col >= GRID_COLS || gp.row < 0 || gp.row >= GRID_ROWS) return false;
        return this.cells[gp.row * GRID_COLS + gp.col] === ownerId;
    }

    // Capture territory based on a trail polygon
    captureTerritory(trailPoints, ownerId, p) {
        if (trailPoints.length < 3) return 0;

        // Create a closed polygon: trail + closing segment
        const polygon = trailPoints.map(pt => ({x: pt.x, y: pt.y}));
        
        // Calculate bounding box in Grid Coordinates to minimize checks
        const bbox = getBoundingBox(trailPoints);
        const minCol = Math.max(0, Math.floor(bbox.minX / GRID_CELL_SIZE));
        const maxCol = Math.min(GRID_COLS - 1, Math.floor(bbox.maxX / GRID_CELL_SIZE));
        const minRow = Math.max(0, Math.floor(bbox.minY / GRID_CELL_SIZE));
        const maxRow = Math.min(GRID_ROWS - 1, Math.floor(bbox.maxY / GRID_CELL_SIZE));

        let captureCount = 0;

        // Scan grid cells in bounding box
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                // Center of the cell in world coords
                const cellCenterX = c * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                const cellCenterY = r * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;

                if (pointInPolygon({x: cellCenterX, y: cellCenterY}, polygon)) {
                    const idx = r * GRID_COLS + c;
                    const oldOwner = this.cells[idx];
                    
                    if (oldOwner !== ownerId) {
                        this.cells[idx] = ownerId;
                        this.drawCellToBuffer(c * GRID_CELL_SIZE, r * GRID_CELL_SIZE, ownerId, p);
                        captureCount++;
                    }
                }
            }
        }
        
        // Fill voids logic (simplified): 
        // In a perfect implementation, we would flood fill "empty" areas that are enclosed.
        // For this p5 implementation, polygon capture is the primary mechanic.
        
        return captureCount;
    }
    
    // Clear territory of a dead player
    clearTerritory(ownerId, p) {
        for(let i=0; i < this.cells.length; i++) {
            if(this.cells[i] === ownerId) {
                this.cells[i] = 0; // Reset to neutral
                
                const c = i % GRID_COLS;
                const r = Math.floor(i / GRID_COLS);
                this.drawCellToBuffer(c * GRID_CELL_SIZE, r * GRID_CELL_SIZE, 0, p);
            }
        }
    }

    drawCellToBuffer(x, y, ownerId, p) {
        let c;
        if (ownerId === 0) c = COLORS.BACKGROUND;
        else if (ownerId === 1) c = COLORS.PLAYER_TERRITORY;
        else if (ownerId === 2) c = COLORS.ENEMY_1_TERRITORY;
        else if (ownerId === 3) c = COLORS.ENEMY_2_TERRITORY;
        else if (ownerId === 4) c = COLORS.ENEMY_3_TERRITORY;
        else c = COLORS.BACKGROUND;

        this.buffer.fill(c);
        this.buffer.rect(x, y, GRID_CELL_SIZE, GRID_CELL_SIZE);
    }
    
    getScore(ownerId) {
        let count = 0;
        for(let i=0; i < this.cells.length; i++) {
            if(this.cells[i] === ownerId) count++;
        }
        return Math.floor((count / (GRID_COLS * GRID_ROWS)) * 100);
    }

    render(p) {
        p.image(this.buffer, 0, 0);
        
        // Draw grid lines overlay (optional, maybe too noisy)
        // p.stroke(30);
        // p.strokeWeight(1);
        // for (let x = 0; x <= CANVAS_WIDTH; x += 50) p.line(x, 0, x, CANVAS_HEIGHT);
        // for (let y = 0; y <= CANVAS_HEIGHT; y += 50) p.line(0, y, CANVAS_WIDTH, y);
    }
}