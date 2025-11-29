import { GRID_CELL_SIZE, gameState, COLORS } from './globals.js';
import { worldToGrid, pointInPolygon, getBoundingBox } from './utils.js';

export class GameGrid {
    constructor(p, worldWidth, worldHeight) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.gridCols = Math.ceil(worldWidth / GRID_CELL_SIZE);
        this.gridRows = Math.ceil(worldHeight / GRID_CELL_SIZE);
        
        // Flat array for performance
        this.cells = new Uint8Array(this.gridCols * this.gridRows).fill(0);
        
        // p5.Graphics buffer for rendering the territories efficiently
        this.buffer = p.createGraphics(worldWidth, worldHeight);
        this.buffer.noStroke();
        this.buffer.background(p.color(COLORS.BACKGROUND));
        
        this.needsUpdate = true;
    }

    reset(p) {
        this.cells.fill(0);
        this.buffer.background(p.color(COLORS.BACKGROUND));
        this.needsUpdate = true;
    }

    setSpawnArea(centerX, centerY, radius, ownerId, p) {
        const gridPos = worldToGrid(centerX, centerY, GRID_CELL_SIZE);
        const radiusInCells = Math.floor(radius / GRID_CELL_SIZE);
        
        const minCol = Math.max(0, gridPos.col - radiusInCells);
        const maxCol = Math.min(this.gridCols - 1, gridPos.col + radiusInCells);
        const minRow = Math.max(0, gridPos.row - radiusInCells);
        const maxRow = Math.min(this.gridRows - 1, gridPos.row + radiusInCells);

        let changed = false;
        
        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                const dx = c - gridPos.col;
                const dy = r - gridPos.row;
                if (dx * dx + dy * dy <= radiusInCells * radiusInCells) {
                    const idx = r * this.gridCols + c;
                    if (this.cells[idx] !== ownerId) {
                        this.cells[idx] = ownerId;
                        changed = true;
                        
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
        const gp = worldToGrid(x, y, GRID_CELL_SIZE);
        if (gp.col < 0 || gp.col >= this.gridCols || gp.row < 0 || gp.row >= this.gridRows) return false;
        return this.cells[gp.row * this.gridCols + gp.col] === ownerId;
    }

    captureTerritory(trailPoints, ownerId, p) {
        if (trailPoints.length < 3) return 0;

        const polygon = trailPoints.map(pt => ({x: pt.x, y: pt.y}));
        
        const bbox = getBoundingBox(trailPoints);
        const minCol = Math.max(0, Math.floor(bbox.minX / GRID_CELL_SIZE));
        const maxCol = Math.min(this.gridCols - 1, Math.floor(bbox.maxX / GRID_CELL_SIZE));
        const minRow = Math.max(0, Math.floor(bbox.minY / GRID_CELL_SIZE));
        const maxRow = Math.min(this.gridRows - 1, Math.floor(bbox.maxY / GRID_CELL_SIZE));

        let captureCount = 0;

        for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
                const cellCenterX = c * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;
                const cellCenterY = r * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;

                if (pointInPolygon({x: cellCenterX, y: cellCenterY}, polygon)) {
                    const idx = r * this.gridCols + c;
                    const oldOwner = this.cells[idx];
                    
                    if (oldOwner !== ownerId) {
                        this.cells[idx] = ownerId;
                        this.drawCellToBuffer(c * GRID_CELL_SIZE, r * GRID_CELL_SIZE, ownerId, p);
                        captureCount++;
                    }
                }
            }
        }
        
        return captureCount;
    }
    
    clearTerritory(ownerId, p) {
        for(let i=0; i < this.cells.length; i++) {
            if(this.cells[i] === ownerId) {
                this.cells[i] = 0;
                
                const c = i % this.gridCols;
                const r = Math.floor(i / this.gridCols);
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
        else if (ownerId === 5) c = COLORS.ENEMY_4_TERRITORY;
        else if (ownerId === 6) c = COLORS.ENEMY_5_TERRITORY;
        else c = COLORS.BACKGROUND;

        this.buffer.fill(c);
        this.buffer.rect(x, y, GRID_CELL_SIZE, GRID_CELL_SIZE);
    }
    
    getScore(ownerId) {
        let count = 0;
        for(let i=0; i < this.cells.length; i++) {
            if(this.cells[i] === ownerId) count++;
        }
        return Math.floor((count / (this.gridCols * this.gridRows)) * 100);
    }

    render(p) {
        p.image(this.buffer, 0, 0);
    }
}