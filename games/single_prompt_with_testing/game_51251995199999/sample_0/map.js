import { gameState, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { getMapKey, worldToGrid } from './utils.js';

// Tile Types
export const TILE_EMPTY = 0;
export const TILE_WALL = 1;
export const TILE_SPIKE = 2;
export const TILE_COIN = 3;

export class LevelManager {
    constructor() {
        this.gridCols = Math.ceil(CANVAS_WIDTH / TILE_SIZE);
        this.lastGeneratedY = 0; // The Y coordinate (grid) of the top generated row
        this.noiseOffset = 0;
    }
    
    reset() {
        gameState.map = {};
        gameState.entities = gameState.entities.filter(e => e.type === 'PLAYER'); // Keep player, clear others
        this.lastGeneratedY = Math.ceil(CANVAS_HEIGHT / TILE_SIZE) + 2;
        this.generateChunk(window.gameInstance, 0, this.lastGeneratedY); // Generate initial area
        
        // Initial safe zone
        for (let x = 0; x < this.gridCols; x++) {
             for (let y = 0; y < 10; y++) {
                 // Clear starting area
                 const key = getMapKey(x, Math.floor(gameState.player.y/TILE_SIZE) - y);
                 delete gameState.map[key];
             }
        }
        
        // Floor
        for (let x = 0; x < this.gridCols; x++) {
            const key = getMapKey(x, worldToGrid(CANVAS_HEIGHT - TILE_SIZE));
            gameState.map[key] = TILE_WALL;
        }
    }
    
    update(p) {
        // Generate new chunks as player moves up
        // Player moves into negative Y.
        // If playerY is close to lastGeneratedY * TILE_SIZE, generate more
        const playerGridY = worldToGrid(gameState.player.y);
        const buffer = 20; // Generate 20 rows ahead
        
        if (playerGridY - buffer < this.lastGeneratedY) {
            this.generateChunk(p, this.lastGeneratedY - 20, this.lastGeneratedY);
            this.lastGeneratedY -= 20;
        }
        
        // Cleanup old chunks (below tide) to save memory
        const tideGridY = worldToGrid(gameState.tideY);
        Object.keys(gameState.map).forEach(key => {
            const [x, y] = key.split(',').map(Number);
            if (y > tideGridY + 5) {
                delete gameState.map[key];
            }
        });
    }
    
    generateChunk(p, startY, endY) {
        // Procedural generation using a drunkard's walk or noise for paths
        // For a tomb/maze feel, we want corridors.
        
        for (let y = startY; y < endY; y++) {
            for (let x = 0; x < this.gridCols; x++) {
                // Borders
                if (x === 0 || x === this.gridCols - 1) {
                    gameState.map[getMapKey(x, y)] = TILE_WALL;
                    continue;
                }
                
                // Noise based walls
                const n = p.noise(x * 0.1, y * 0.1);
                if (n > 0.55) {
                    gameState.map[getMapKey(x, y)] = TILE_WALL;
                    
                    // Chance for spike on wall
                    if (p.random() < 0.05) {
                         // Check neighbors to place spike correctly? 
                         // For simplicity, spikes are separate tiles that kill you
                         // We'll overlay a spike object later or just use tile ID
                    }
                } else {
                    // Empty space
                    // Chance for coin
                    if (p.random() < 0.05) {
                        gameState.map[getMapKey(x, y)] = TILE_COIN;
                    } 
                    // Chance for spike trap in open
                    else if (p.random() < 0.01) {
                        gameState.map[getMapKey(x, y)] = TILE_SPIKE;
                    }
                }
            }
        }
        
        // Ensure a path exists (rudimentary)
        // Carve a winding path up the center
        let cx = Math.floor(this.gridCols / 2);
        for (let y = endY; y > startY; y--) {
            // Wiggle x
            cx += Math.floor(p.random(-2, 3));
            cx = p.constrain(cx, 1, this.gridCols - 2);
            
            // Clear path 
            for(let w = -1; w <= 1; w++) {
                const key = getMapKey(cx + w, y);
                if (gameState.map[key] === TILE_WALL) {
                    delete gameState.map[key];
                }
                // Ensure no spikes on the safe path
                if (gameState.map[key] === TILE_SPIKE) {
                    delete gameState.map[key];
                }
            }
        }
    }
    
    render(p) {
        // Render visible tiles
        const startCol = 0;
        const endCol = this.gridCols;
        const startRow = worldToGrid(gameState.cameraY);
        const endRow = startRow + Math.ceil(CANVAS_HEIGHT / TILE_SIZE) + 1;
        
        p.push();
        p.strokeWeight(1);
        
        for (let y = startRow; y <= endRow; y++) {
            for (let x = startCol; x < endCol; x++) {
                const key = getMapKey(x, y);
                const tile = gameState.map[key];
                
                if (tile) {
                    const px = x * TILE_SIZE;
                    const py = y * TILE_SIZE - gameState.cameraY;
                    
                    if (tile === TILE_WALL) {
                        p.fill(COLORS.WALL);
                        p.stroke(COLORS.WALL_STROKE);
                        p.rect(px, py, TILE_SIZE, TILE_SIZE);
                        
                        // Inner detail for aesthetic
                        p.noStroke();
                        p.fill(COLORS.WALL_STROKE);
                        p.rect(px + 5, py + 5, TILE_SIZE - 10, TILE_SIZE - 10);
                    } else if (tile === TILE_SPIKE) {
                        p.fill(COLORS.SPIKE);
                        p.noStroke();
                        // Draw spike triangle
                        p.triangle(
                            px + TILE_SIZE/2, py,
                            px, py + TILE_SIZE,
                            px + TILE_SIZE, py + TILE_SIZE
                        );
                    } else if (tile === TILE_COIN) {
                        // Coins are rendered as entities usually, but for tile map efficiency we can draw here
                        // Or spawn entities. Let's draw here for performance.
                        p.fill(COLORS.COIN);
                        p.noStroke();
                        const s = TILE_SIZE * 0.6 + Math.sin(gameState.frameCount * 0.1) * 2;
                        p.circle(px + TILE_SIZE/2, py + TILE_SIZE/2, s);
                    }
                }
            }
        }
        p.pop();
    }
}