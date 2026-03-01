/**
 * automated_testing_controller.js
 * Logic for AI agents used in testing modes.
 */

import { CANVAS_WIDTH, CONFIG } from './globals.js';
import { KEYS } from './input.js';

/**
 * Returns a key action based on game state and current testing mode
 */
export function get_automated_testing_action(gameState) {
    if (!gameState.player) return null;

    switch (gameState.controlMode) {
        case "TEST_1": // Smart Survival
            return getSurvivalAction(gameState);
        case "TEST_2": // Suicide (Hit big blocks)
            return getSuicideAction(gameState);
        case "TEST_3": // Fever Test
            return getFeverTestAction(gameState);
        default:
            return null;
    }
}

function getSurvivalAction(state) {
    const player = state.player;
    // Look ahead window
    const lookAheadY = player.y - 250; // Blocks are above player
    
    // Find relevant entities
    // We want food, avoid blocks unless unavoidable
    let bestX = player.x;
    let maxScore = -9999;
    
    // Sample a few target X positions (lanes)
    const laneWidth = CONFIG.BLOCK_SIZE;
    const numLanes = Math.floor(CANVAS_WIDTH / laneWidth);
    
    for (let i = 0; i < numLanes; i++) {
        let laneX = i * laneWidth + laneWidth/2;
        let laneScore = 0;
        
        // Check objects in this lane
        // Food
        state.foods.forEach(f => {
            if (Math.abs(f.x - laneX) < laneWidth/2 && f.y < player.y && f.y > lookAheadY) {
                laneScore += f.value * 10;
            }
        });
        
        // Blocks
        state.blocks.forEach(b => {
            if (Math.abs((b.x + b.size/2) - laneX) < laneWidth/2 && b.y < player.y && b.y > lookAheadY) {
                // If block value is high, bad. If low, acceptable if no other path.
                // We strongly prefer avoiding any block if possible, but if we must, choose smallest.
                laneScore -= b.value * 5; 
            }
        });
        
        // Bias towards center slightly to stay safe
        laneScore -= Math.abs(laneX - CANVAS_WIDTH/2) * 0.01;
        
        // Bias towards current position to avoid jitter
        laneScore -= Math.abs(laneX - player.x) * 0.1;
        
        if (laneScore > maxScore) {
            maxScore = laneScore;
            bestX = laneX;
        }
    }
    
    // Steering
    if (Math.abs(player.x - bestX) > 5) {
        return player.x < bestX ? { keyCode: KEYS.RIGHT } : { keyCode: KEYS.LEFT };
    }
    
    return null;
}

function getSuicideAction(state) {
    const player = state.player;
    // Target the BIGGEST block
    let target = null;
    let maxVal = -1;
    
    state.blocks.forEach(b => {
        if (b.y < player.y && b.value > maxVal) {
            maxVal = b.value;
            target = b;
        }
    });
    
    if (target) {
        let targetX = target.x + target.size/2;
        if (Math.abs(player.x - targetX) > 5) {
             return player.x < targetX ? { keyCode: KEYS.RIGHT } : { keyCode: KEYS.LEFT };
        }
    }
    return null;
}

function getFeverTestAction(state) {
    // Play normally but hit Z when ready
    if (state.feverValue >= CONFIG.FEVER_MAX) {
        return { keyCode: KEYS.Z };
    }
    return getSurvivalAction(state); // Fallback to survival behavior
}

// Expose to window for testing hooks
window.get_automated_testing_action = get_automated_testing_action;