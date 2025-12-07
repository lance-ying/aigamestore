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
        // Structured tunnel-based generation ensuring no traps
        // First, fill everything with walls
        for (let y = startY; y < endY; y++) {
            for (let x = 0; x < this.gridCols; x++) {
                gameState.map[getMapKey(x, y)] = TILE_WALL;
            }
        }
        
        // Create multiple vertical shafts with guaranteed width
        const numPaths = 2 + Math.floor(p.random(2)); // 2-3 vertical paths
        const pathPositions = [];
        
        // Generate path positions with spacing
        for (let i = 0; i < numPaths; i++) {
            const minX = 3 + i * Math.floor((this.gridCols - 6) / numPaths);
            const maxX = minX + Math.floor((this.gridCols - 6) / numPaths) - 2;
            pathPositions.push(Math.floor(p.random(minX, maxX)));
        }
        
        // Carve vertical shafts - ALWAYS keep them open vertically
        for (let pathX of pathPositions) {
            for (let y = startY; y < endY; y++) {
                // Carve a 3-tile wide vertical shaft (always consistent)
                for (let dx = -1; dx <= 1; dx++) {
                    const x = pathX + dx;
                    if (x > 0 && x < this.gridCols - 1) {
                        const key = getMapKey(x, y);
                        delete gameState.map[key];
                    }
                }
                
                // Add coins occasionally in the center
                if (p.random() < 0.06) {
                    gameState.map[getMapKey(pathX, y)] = TILE_COIN;
                }
            }
        }
        
        // Create horizontal connecting corridors MORE FREQUENTLY to prevent isolation
        for (let y = startY; y < endY; y += Math.floor(p.random(2, 4))) {
            // Connect adjacent paths with horizontal corridors
            for (let i = 0; i < pathPositions.length - 1; i++) {
                const startPath = pathPositions[i];
                const endPath = pathPositions[i + 1];
                
                const minX = Math.min(startPath, endPath);
                const maxX = Math.max(startPath, endPath);
                
                // Carve horizontal corridor - 2 tiles high for safety
                for (let x = minX; x <= maxX; x++) {
                    delete gameState.map[getMapKey(x, y)];
                    // Add a second row to create a proper corridor
                    if (y > startY) {
                        delete gameState.map[getMapKey(x, y - 1)];
                    }
                }
            }
        }
        
        // Add extra horizontal passages at regular intervals to guarantee connectivity
        for (let y = startY; y < endY; y += 3) {
            // Create a full-width passage every 3 rows to ensure no traps
            const passageWidth = Math.floor(this.gridCols * 0.7);
            const startX = Math.floor((this.gridCols - passageWidth) / 2);
            
            for (let x = startX; x < startX + passageWidth; x++) {
                if (x > 0 && x < this.gridCols - 1) {
                    delete gameState.map[getMapKey(x, y)];
                }
            }
        }
        
        // Add side alcoves for variety (but ensure they don't block main paths)
        for (let y = startY; y < endY; y++) {
            if (p.random() < 0.1) {
                for (let x = 1; x < this.gridCols - 1; x++) {
                    const key = getMapKey(x, y);
                    if (gameState.map[key] === TILE_WALL) {
                        // Check if next to an empty space
                        const leftEmpty = !gameState.map[getMapKey(x-1, y)];
                        const rightEmpty = !gameState.map[getMapKey(x+1, y)];
                        
                        if (leftEmpty || rightEmpty) {
                            // Small alcove
                            delete gameState.map[key];
                            break; // One per row
                        }
                    }
                }
            }
        }
        
        // Place coins in safe locations
        for (let y = startY; y < endY; y++) {
            for (let x = 2; x < this.gridCols - 2; x++) {
                const key = getMapKey(x, y);
                if (!gameState.map[key] && p.random() < 0.03) {
                    // Ensure space above for collection
                    const hasSpaceAbove = !gameState.map[getMapKey(x, y-1)];
                    if (hasSpaceAbove) {
                        gameState.map[key] = TILE_COIN;
                    }
                }
            }
        }
        
        // CAREFULLY place spikes - only on floors/ceilings in side areas
        for (let y = startY; y < endY; y++) {
            for (let x = 2; x < this.gridCols - 2; x++) {
                const key = getMapKey(x, y);
                if (!gameState.map[key] && gameState.map[key] !== TILE_COIN) {
                    // Check if this is in a main vertical path (safe zone)
                    let inSafePath = false;
                    for (let pathX of pathPositions) {
                        if (Math.abs(x - pathX) <= 1) {
                            inSafePath = true;
                            break;
                        }
                    }
                    
                    // Only place spikes OUTSIDE main safe paths with LOW probability
                    if (!inSafePath && p.random() < 0.015) {
                        // Make sure spike is on a floor or ceiling, not floating
                        const hasFloor = gameState.map[getMapKey(x, y + 1)] === TILE_WALL;
                        const hasCeiling = gameState.map[getMapKey(x, y - 1)] === TILE_WALL;
                        
                        // Also ensure there's a way to avoid it (space on sides)
                        const leftClear = !gameState.map[getMapKey(x - 1, y)];
                        const rightClear = !gameState.map[getMapKey(x + 1, y)];
                        
                        if ((hasFloor || hasCeiling) && (leftClear || rightClear)) {
                            gameState.map[key] = TILE_SPIKE;
                        }
                    }
                }
            }
        }
        
        // Ensure borders are always walls
        for (let y = startY; y < endY; y++) {
            gameState.map[getMapKey(0, y)] = TILE_WALL;
            gameState.map[getMapKey(this.gridCols - 1, y)] = TILE_WALL;
        }
        
        // ENHANCED safety pass: ensure continuous upward paths with horizontal access
        for (let y = startY; y < endY; y++) {
            let hasAccessibleUpwardPath = false;
            
            // Check if there's a vertical passage with horizontal access
            for (let x = 2; x < this.gridCols - 2; x++) {
                const current = getMapKey(x, y);
                const above = getMapKey(x, y - 1);
                const left = getMapKey(x - 1, y);
                const right = getMapKey(x + 1, y);
                
                // Empty tile with empty above AND accessible from sides
                if (!gameState.map[current] && !gameState.map[above]) {
                    if (!gameState.map[left] || !gameState.map[right]) {
                        hasAccessibleUpwardPath = true;
                        break;
                    }
                }
            }
            
            // If no accessible upward path found, create one in the center
            if (!hasAccessibleUpwardPath) {
                const safeX = Math.floor(this.gridCols / 2);
                // Create a 5-wide passage to guarantee accessibility
                for (let dx = -2; dx <= 2; dx++) {
                    const x = safeX + dx;
                    if (x > 0 && x < this.gridCols - 1) {
                        delete gameState.map[getMapKey(x, y)];
                        delete gameState.map[getMapKey(x, y - 1)];
                        if (y < endY - 1) {
                            delete gameState.map[getMapKey(x, y + 1)];
                        }
                    }
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