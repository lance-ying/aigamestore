/**
 * Procedural Dungeon Generation
 */
import { gameState, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Wall, SpikeTrap, Enemy, Coin } from './entities.js';

// Grid size
const COLS = Math.floor(CANVAS_WIDTH / TILE_SIZE); // 15
const CHUNK_ROWS = 10; // Generate 10 rows at a time

export function initDungeon() {
    // Initial safe zone
    gameState.generatedY = CANVAS_HEIGHT; // Start from bottom of screen
    
    // Generate initial flat area
    generateChunk(CANVAS_HEIGHT - (TILE_SIZE * 5), 5, 'SAFE');
    // Generate first obstacle chunk
    generateChunk(CANVAS_HEIGHT - (TILE_SIZE * 15), 10, 'NORMAL');
    gameState.generatedY = CANVAS_HEIGHT - (TILE_SIZE * 15);
}

export function updateDungeon(p) {
    // Generate new chunks as player moves up
    // Camera Y follows player. As Camera Y decreases (moves up), we need more world.
    const horizon = gameState.cameraY - CANVAS_HEIGHT;
    
    if (gameState.generatedY > horizon) {
        // Need more rows
        const rowsToGen = 10;
        const startY = gameState.generatedY - (rowsToGen * TILE_SIZE);
        generateChunk(startY, rowsToGen, 'RANDOM');
        gameState.generatedY = startY;
        
        // Cleanup old entities
        cleanupEntities(gameState.cameraY + CANVAS_HEIGHT + 200);
    }
}

function generateChunk(startY, rows, type) {
    for (let r = 0; r < rows; r++) {
        let y = startY + (r * TILE_SIZE);
        let rowType = type === 'SAFE' ? 'SAFE' : (Math.random() < 0.3 ? 'MAZE' : (Math.random() < 0.6 ? 'TRAPS' : 'ENEMIES'));
        
        if (type === 'RANDOM' && r === 0) rowType = 'SAFE'; // Buffer row

        // Always walls on edges
        gameState.walls.push(new Wall(0, y));
        gameState.walls.push(new Wall(CANVAS_WIDTH - TILE_SIZE, y));

        // Fill row based on type
        for (let c = 1; c < COLS - 1; c++) {
            let x = c * TILE_SIZE;
            
            if (rowType === 'MAZE') {
                if (Math.random() < 0.3) {
                    gameState.walls.push(new Wall(x, y));
                } else if (Math.random() < 0.05) {
                    gameState.coins.push(new Coin(x + TILE_SIZE/2, y + TILE_SIZE/2));
                }
            } else if (rowType === 'TRAPS') {
                if (Math.random() < 0.4) {
                    // Offset phase based on column to create waves
                    gameState.traps.push(new SpikeTrap(x, y, c * 10));
                } else if (Math.random() < 0.1) {
                    gameState.coins.push(new Coin(x + TILE_SIZE/2, y + TILE_SIZE/2));
                }
            } else if (rowType === 'ENEMIES') {
                 if (Math.random() < 0.1) {
                     let enemyType = Math.random() < 0.5 ? "SLIME" : "BAT";
                     gameState.enemies.push(new Enemy(x + TILE_SIZE/2, y + TILE_SIZE/2, enemyType));
                 }
            }
            // SAFE does nothing (empty floor)
        }
    }
}

function cleanupEntities(thresholdY) {
    // Remove entities below the screen (thresholdY is higher value than current visible area if coordinate system is down+, but here Y is consistent)
    // Actually, Y coordinates are normal (0 at top). We move UP into negative numbers or smaller numbers?
    // Wait, initial Player Y is CANVAS_HEIGHT. Camera moves up (decreasing Y).
    // So "Old" stuff is at HIGHER Y values.
    
    gameState.walls = gameState.walls.filter(e => e.y < thresholdY);
    gameState.traps = gameState.traps.filter(e => e.y < thresholdY);
    gameState.enemies = gameState.enemies.filter(e => e.y < thresholdY);
    gameState.coins = gameState.coins.filter(e => e.y < thresholdY);
}