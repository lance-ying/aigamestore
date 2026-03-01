/**
 * Level generation and tilemap handling.
 */
import { CANVAS_WIDTH, CANVAS_HEIGHT, PALETTE } from './globals.js';
import { Enemy, Boss } from './entities.js';
import { gameState } from './globals.js';

export class Level {
    constructor(width, height) {
        this.tileSize = 40;
        this.cols = Math.ceil(width / this.tileSize);
        this.rows = Math.ceil(height / this.tileSize);
        this.width = width;
        this.height = height;
        this.tiles = new Array(this.cols * this.rows).fill(null);
        
        this.generate();
    }
    
    generate() {
        // Simple procedural generation
        // Floor
        for (let c = 0; c < this.cols; c++) {
            this.setTile(c, this.rows - 1, 1); // Ground
            this.setTile(c, this.rows - 2, 1); // Ground Deep
        }
        
        // Walls
        for (let r = 0; r < this.rows; r++) {
            this.setTile(0, r, 1);
            this.setTile(this.cols - 1, r, 1);
        }
        
        // Platforms
        for (let c = 5; c < this.cols - 5; c += 6) {
            const h = Math.floor(this.rows - 4 - Math.random() * 3);
            this.setTile(c, h, 2); // Platform
            this.setTile(c+1, h, 2);
            this.setTile(c+2, h, 2);
            
            // Spawn Enemy occasionally
            if (Math.random() < 0.5) {
                gameState.enemies.push(new Enemy((c+1) * this.tileSize, (h-1) * this.tileSize));
            }
        }
        
        // Boss Room at end
        gameState.enemies.push(new Boss((this.cols - 4) * this.tileSize, (this.rows - 5) * this.tileSize));
    }
    
    setTile(col, row, type) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;
        this.tiles[row * this.cols + col] = {
            type: type,
            solid: true,
            color: type === 1 ? PALETTE.ground : PALETTE.groundDetail
        };
    }
    
    getTile(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return null;
        return this.tiles[row * this.cols + col];
    }
    
    getTileAt(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);
        return this.getTile(col, row);
    }
    
    render(p, camera) {
        const startCol = Math.floor(camera.x / this.tileSize);
        const endCol = startCol + Math.ceil(CANVAS_WIDTH / this.tileSize) + 1;
        const startRow = Math.floor(camera.y / this.tileSize);
        const endRow = startRow + Math.ceil(CANVAS_HEIGHT / this.tileSize) + 1;
        
        for (let c = startCol; c < endCol; c++) {
            for (let r = startRow; r < endRow; r++) {
                const tile = this.getTile(c, r);
                if (tile) {
                    p.fill(tile.color);
                    p.stroke(20);
                    p.strokeWeight(1);
                    p.rect(c * this.tileSize, r * this.tileSize, this.tileSize, this.tileSize);
                    
                    // Detail (cracks)
                    p.stroke(tile.color[0]+20, tile.color[1]+20, tile.color[2]+20);
                    if ((c + r) % 3 === 0) p.line(c*this.tileSize + 5, r*this.tileSize + 5, c*this.tileSize + 15, r*this.tileSize + 15);
                }
            }
        }
    }
}