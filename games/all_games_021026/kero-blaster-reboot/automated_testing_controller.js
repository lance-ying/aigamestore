/**
 * automated_testing_controller.js
 * Provides input overrides for automated testing scenarios.
 */

import { gameState } from './globals.js';
import { KEYS } from './input.js';

/**
 * Returns an object { pressed: [], held: [] } representing keys to simulate.
 */
export function get_automated_testing_action(state) {
    if (!state.player) return null;

    const action = {
        held: [],
        pressed: []
    };

    if (state.controlMode === 'TEST_1') {
        // Strategy: Run Right, Shoot, Random Jump
        action.held.push(KEYS.RIGHT);
        action.held.push(KEYS.Z); // Constant fire

        // Random jump every ~1 second (60 frames)
        if (state.frameCount % 80 === 0) {
            action.pressed.push(KEYS.SPACE);
        }
        
        return action;
    }

    if (state.controlMode === 'TEST_2') {
        // Strategy: God Mode (handled in Player class), Run Right
        // We know the level layout goes right.
        action.held.push(KEYS.RIGHT);
        
        // Jump if stuck (velocity x is low despite holding right)
        if (state.player.grounded && Math.abs(state.player.vx) < 0.1) {
            action.pressed.push(KEYS.SPACE);
        }
        
        // Also jump periodically just in case
        if (state.frameCount % 40 === 0) {
            action.pressed.push(KEYS.SPACE);
        }
        
        return action;
    }

    return null;
}