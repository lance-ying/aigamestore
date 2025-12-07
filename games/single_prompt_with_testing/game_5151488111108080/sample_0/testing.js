/**
 * testing.js
 * Automated testing controller logic.
 */

import { gameState, CONSTANTS } from './globals.js';
import { KEYS } from './input.js';

export function get_automated_testing_action(gameState) {
    if (!gameState.player || gameState.gamePhase !== "PLAYING") return null;
    
    const mode = gameState.controlMode;
    
    if (mode === "TEST_1") {
        return runBotSurvival(gameState);
    } else if (mode === "TEST_2") {
        return runBotRandom(gameState);
    }
    
    return null;
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;

function runBotSurvival(state) {
    const player = state.player;
    const tiles = state.world.tiles; // Access directly from world manager if possible, or filtered entities
    
    // Find nearest tile ahead of player
    // Since tiles are sorted by Y usually, or we can iterate
    let targetTile = null;
    let minDist = Infinity;
    
    // Look ahead logic
    const lookAheadY = player.y; 
    
    // Find the first tile that has y > player.y (is ahead)
    // Note: In our coordinate system, Player moves +Y. Tiles are at higher Y.
    // But we need the tile currently under us or immediately next.
    // If player is in air, they need to aim for the tile at the landing spot.
    
    // Simple heuristic: Find tile with center Y closest to (player.y + distance_per_jump)
    // But exact physics prediction is hard.
    // Easier: Find the tile with the smallest positive (tile.y - player.y)
    
    let candidates = tiles.filter(t => t.y > player.y);
    candidates.sort((a, b) => a.y - b.y);
    
    if (candidates.length > 0) {
        targetTile = candidates[0];
    } else {
        // Fallback to start platform if array empty
        return null;
    }
    
    if (targetTile) {
        // Steer towards tile center X
        const dx = targetTile.x - player.x;
        const tolerance = 5;
        
        if (dx > tolerance) {
            return { keyCode: KEYS.RIGHT };
        } else if (dx < -tolerance) {
            return { keyCode: KEYS.LEFT };
        }
    }
    
    return null;
}

function runBotRandom(state) {
    // Random input every 10 frames
    if (state.frameCount % 10 === 0) {
        const r = Math.random();
        if (r < 0.33) return { keyCode: KEYS.LEFT };
        if (r < 0.66) return { keyCode: KEYS.RIGHT };
        // else no input
    }
    return null;
}