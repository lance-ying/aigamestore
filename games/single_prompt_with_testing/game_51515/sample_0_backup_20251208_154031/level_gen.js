import { gameState, TILE_SIZE } from './globals.js';
import { Player, SpikeTrap, Slime, Coin } from './entities.js';
import { getGridKey } from './utils.js';

const WIDTH_TILES = 11; // Odd number allows for centered path
const BUFFER_ROWS = 20; // How many rows ahead to generate

export function setupLevel(p) {
    // Generate initial safe zone
    for (let y = 5; y >= -10; y--) {
        generateRow(y, p);
    }
    
    gameState.minGenY = -10;
    
    // Spawn Player at 0, 3 (middle bottom)
    gameState.player = new Player(Math.floor(WIDTH_TILES / 2), 3);
    gameState.entities.push(gameState.player);
}

export function updateLevelGen(p) {
    if (!gameState.player) return;
    
    const playerGy = gameState.player.gy;
    
    // Generate new rows ahead
    while (gameState.minGenY > playerGy - BUFFER_ROWS) {
        gameState.minGenY--;
        generateRow(gameState.minGenY, p);
    }
    
    // Cull old rows (behind doom wall or far behind player)
    // For simplicity in this demo, we keep map small in memory, but Map can handle many keys.
    // If performance issues arise, we would delete keys > playerGy + 10
}

function generateRow(y, p) {
    // Determine row characteristics based on randomness
    const rand = p.random();
    
    // Always ensure walls on edges
    for (let x = 0; x < WIDTH_TILES; x++) {
        const key = getGridKey(x, y);
        
        // Edges are walls
        if (x === 0 || x === WIDTH_TILES - 1) {
            gameState.grid.set(key, { type: 'wall', x, y });
            continue;
        }
        
        // Start area is safe floor
        if (y > -5) {
            gameState.grid.set(key, { type: 'floor', x, y });
            continue;
        }

        // Procedural Generation Logic
        let type = 'floor';
        
        // Random holes
        if (p.random() < 0.1) {
            type = 'hole';
        }
        
        // Random inner walls (obstacles)
        if (type !== 'hole' && p.random() < 0.15) {
            type = 'wall';
        }
        
        // Ensure path exists? 
        // A simple robust PCG would use pathfinders. 
        // Here we rely on randomness and the fact that 15% wall density usually leaves paths.
        // We can force a clear center path every few rows to prevent blocking.
        if (x === Math.floor(WIDTH_TILES/2) && y % 3 === 0) {
            type = 'floor';
        }
        
        gameState.grid.set(key, { type, x, y });
        
        // Add Entities on Floor
        if (type === 'floor') {
            // Difficulty scaling based on depth (y is negative)
            // Increase spawn rates as we go deeper
            const depth = Math.abs(y);
            const difficultyFactor = depth * 0.001; 

            // Spikes
            if (p.random() < 0.05 + difficultyFactor) {
                const trap = new SpikeTrap(x, y, p.random(100));
                gameState.entities.push(trap);
            }
            // Slimes (rarer)
            else if (p.random() < 0.02 + difficultyFactor) {
                const slime = new Slime(x, y, 2, p.random() > 0.5 ? 'x' : 'y');
                gameState.entities.push(slime);
            }
            // Coins
            else if (p.random() < 0.05) {
                const coin = new Coin(x, y);
                gameState.entities.push(coin);
            }
        }
    }
}