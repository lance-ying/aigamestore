import { gameState, TILE_SIZE, COLORS } from './globals.js';
import { worldToGrid, getMapKey } from './utils.js';
import { TILE_WALL, TILE_SPIKE } from './map.js';

// Helper to simulate path validity
function isMoveSafe(startGridX, startGridY, dx, dy) {
    let x = startGridX;
    let y = startGridY;
    let steps = 0;
    
    // Simulate sliding until hit wall
    while(true) {
        x += dx;
        y += dy;
        steps++;
        const key = getMapKey(x, y);
        const tile = gameState.map[key];
        
        if (tile === TILE_WALL) {
            // Hit wall, check where we stopped (x-dx, y-dy)
            const stopX = x - dx;
            const stopY = y - dy;
            // Safe spot?
            // Check immediate surroundings for spikes?
            // For now, assume landing next to a wall is generally safe unless ON a spike
            // But we can check if the tile we ARE on is safe.
            return { safe: true, stopX, stopY, dist: steps };
        }
        
        if (tile === TILE_SPIKE) {
            return { safe: false }; // Dies on path
        }
        
        if (steps > 50) return { safe: true, stopX: x, stopY: y, dist: steps }; // Infinite loop guard
    }
}

let actionCooldown = 0;

export function get_automated_testing_action(gs) {
    if (gs.gamePhase !== 'PLAYING') {
        if (gs.gamePhase === 'START' || gs.gamePhase.includes('GAME_OVER')) {
             return { keyCode: 13 }; // Press ENTER
        }
        return null;
    }
    
    if (gs.player.state !== 'IDLE') return null; // Wait until stopped
    
    if (actionCooldown > 0) {
        actionCooldown--;
        return null;
    }
    
    const p = gs.player;
    const gx = Math.round(p.x / TILE_SIZE);
    const gy = Math.round(p.y / TILE_SIZE);
    
    if (gs.controlMode === 'TEST_1') {
        // Pathfinder
        const directions = [
            { dx: 0, dy: -1, key: 38 }, // Up (Preferred)
            { dx: -1, dy: 0, key: 37 }, // Left
            { dx: 1, dy: 0, key: 39 },  // Right
            { dx: 0, dy: 1, key: 40 }   // Down
        ];
        
        let bestDir = null;
        let maxScore = -Infinity;
        
        for (let dir of directions) {
            const result = isMoveSafe(gx, gy, dir.dx, dir.dy);
            if (result.safe) {
                // Heuristic: Height gained (negative Y is up) + safety
                let score = (gy - result.stopY) * 2; // Gaining height is good
                
                // Avoid going down unless necessary
                if (dir.dy > 0) score -= 100;
                
                // Avoid Tide
                if (result.stopY * TILE_SIZE > gs.tideY - 100) score -= 500;
                
                if (score > maxScore) {
                    maxScore = score;
                    bestDir = dir;
                }
            }
        }
        
        if (bestDir) {
            actionCooldown = 5;
            return { keyCode: bestDir.key };
        }
        
        // Stuck? Random move to unstick
        return { keyCode: 38 };
    }
    
    if (gs.controlMode === 'TEST_2') {
        // Random Chaos
        actionCooldown = 10;
        const keys = [37, 38, 39, 40];
        return { keyCode: keys[Math.floor(Math.random() * keys.length)] };
    }
    
    if (gs.controlMode === 'TEST_3') {
        // Shield Test
        if (gs.coins < 50) gs.coins = 50; // Cheat
        if (!p.shieldActive) return { keyCode: 32 };
        return null;
    }

    return null;
}