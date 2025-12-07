/**
 * automated_testing_controller.js
 * Logic for automated bot testing.
 */

import { isWalkable, isSolid } from './physics.js';
import { TILE_SIZE } from './globals.js';

export function get_automated_testing_action(gameState) {
    const mode = gameState.controlMode;
    const p = gameState.player;
    
    if (!p) return null;
    
    // Limit action frequency to simulate human input speed roughly (or make it superhuman)
    // For testing, we can do every frame checks but the input queue handles buffering.
    // If input queue is full, don't spam.
    if (gameState.inputQueue.length > 0) return null;

    if (mode === "TEST_1") {
        // Strategy: Move Right if possible. Avoid immediate walls.
        // Simple heuristic.
        
        // Check Right
        if (isWalkable(p.col + 1, p.row) && !isHazard(p.col + 1, p.row, gameState)) {
            return { keyCode: 39 }; // Right
        }
        // Check Up
        if (isWalkable(p.col, p.row - 1) && !isHazard(p.col, p.row - 1, gameState)) {
            return { keyCode: 38 }; // Up
        }
        // Check Down
        if (isWalkable(p.col, p.row + 1) && !isHazard(p.col, p.row + 1, gameState)) {
            return { keyCode: 40 }; // Down
        }
        
        // If stuck, wait or panic move left (bad idea but better than nothing)
        return { keyCode: 32 }; // Wait
        
    } else if (mode === "TEST_2") {
        // Random Chaos
        const keys = [37, 38, 39, 40, 32];
        const k = keys[Math.floor(Math.random() * keys.length)];
        return { keyCode: k };
    }
    
    return null;
}

// Simple hazard check for AI
function isHazard(col, row, gameState) {
    // Check for spikes
    // We iterate entities. Not efficient but fine for test bot.
    for (let e of gameState.entities) {
        if (e.constructor.name === "SpikeTrap" && e.col === col && e.row === row) {
            // Avoid even if safe currently, just to be safe
            return true;
        }
    }
    return false;
}

// Expose globally
if (typeof window !== 'undefined') {
    window.get_automated_testing_action = get_automated_testing_action;
}