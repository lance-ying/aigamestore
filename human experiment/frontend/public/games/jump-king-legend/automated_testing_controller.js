/**
 * Controller for automated testing strategies.
 * Simulates input based on test scenarios.
 */
import { gameState, MAX_JUMP_POWER } from './globals.js';

let testState = {
    timer: 0,
    stage: 0
};

export function get_automated_testing_action(gs) {
    if (!gs.player) return;

    if (gs.controlMode === 'TEST_1') {
        return runJumpTest(gs);
    } else if (gs.controlMode === 'TEST_2') {
        return runWinTest(gs);
    }
    return null;
}

function runJumpTest(gs) {
    // Strategy: Wait, Charge, Jump
    testState.timer++;
    
    if (testState.timer < 60) {
        // Wait initial
        return {};
    } else if (testState.timer < 100) {
        // Charge
        return { keyCode: 32 }; // Space
    } else {
        // Release (no input returns false for space)
        return {};
    }
}

function runWinTest(gs) {
    testState.timer++;
    
    // Step 1: Teleport near top
    if (testState.timer === 10) {
        // Directly modify position (Cheat)
        gs.player.x = 200;
        gs.player.y = 250;
        gs.player.vx = 0;
        gs.player.vy = 0;
    }
    
    // Step 2: Small jump to goal
    if (testState.timer > 20 && testState.timer < 30) {
        return { keyCode: 32 }; // Charge small
    }
    
    return {};
}

// Expose to window
window.get_automated_testing_action = get_automated_testing_action;