/**
 * Automated Testing Controller
 * Implements logic for TEST_1 (Win) and TEST_2 (Chaos).
 */

import { gameState, CANVAS_WIDTH } from './globals.js';

export function get_automated_testing_action(state) {
    if (state.controlMode === "TEST_1") {
        return runWinTest(state);
    } else if (state.controlMode === "TEST_2") {
        return runChaosTest(state);
    }
    return null;
}

/**
 * TEST_1: Attempt to solve the level
 * Strategy: Move towards key, then towards door. Jump obstacles.
 */
function runWinTest(state) {
    if (!state.picos || state.picos.length === 0) return null;
    
    // Calculate squad center
    let cx = 0, cy = 0;
    for (let p of state.picos) {
        cx += p.x;
        cy += p.y;
    }
    cx /= state.picos.length;
    cy /= state.picos.length;
    
    let target = null;
    
    // 1. Determine Target
    if (!state.hasKey) {
        // Target is the first key (assuming one)
        if (state.collectibles.length > 0) {
            target = state.collectibles[0];
        }
    } else {
        // Target is door
        target = state.door;
    }
    
    if (!target) return null; // Idle if no target
    
    // 2. Determine Move
    const dx = target.x - cx;
    const dy = target.y - cy;
    
    let keyCode = null;
    
    // Horizontal Move
    if (Math.abs(dx) > 10) {
        keyCode = dx > 0 ? 39 : 37; // Right : Left
    }
    
    // Jump Logic: If blocked or target is high
    // Simple logic: Jump periodically if not moving fast horizontally or if target is high
    const movingSlowly = Math.abs(state.picos[0].vx) < 0.5;
    const targetIsHigh = (target.y < cy - 50);
    
    // If we have a direction but are stuck, jump
    if (keyCode && movingSlowly && state.frameCount % 20 === 0) {
        keyCode = 32; // SPACE
    }
    
    // If target is high and we are close horizontally, jump
    if (targetIsHigh && Math.abs(dx) < 100 && state.frameCount % 40 === 0) {
        keyCode = 32;
    }
    
    // Regroup occasionally to keep squad together
    if (state.frameCount % 100 > 90) {
        keyCode = 90; // Z
    }
    
    // Interactions
    if (state.gamePhase === "LEVEL_COMPLETE") {
        keyCode = 13; // ENTER
    }
    if (state.gamePhase === "GAME_OVER_WIN") {
        // Done
    }

    return { keyCode };
}

/**
 * TEST_2: Chaos / Physics Stress Test
 * Randomly spams keys
 */
function runChaosTest(state) {
    const keys = [37, 38, 39, 40, 32, 90, 16]; // Arrows, Space, Z, Shift
    const randIndex = Math.floor(Math.random() * keys.length);
    
    // Hold keys for a few frames to make movement visible
    if (state.frameCount % 10 === 0) {
        return { keyCode: keys[randIndex] };
    }
    return null;
}

// Bind to window for instructions compatibility
window.get_automated_testing_action = get_automated_testing_action;