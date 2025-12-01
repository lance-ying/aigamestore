// automated_testing_controller.js
import { gameState } from './globals.js';

export function get_automated_testing_action(state) {
    if (!state.player) return null;

    const action = {
        moveLeft: false,
        moveRight: false,
        inflate: false,
        deflate: false
    };

    if (state.controlMode === 'TEST_1') {
        // Simple move right
        action.moveRight = true;
    } 
    else if (state.controlMode === 'TEST_2') {
        // Test jumping mechanics
        action.moveRight = true;
        // Jump periodically
        if (state.frameCount % 120 < 20) {
            action.inflate = true;
        }
    }
    else if (state.controlMode === 'TEST_3') {
        // Try to win (dumb AI)
        action.moveRight = true;
        
        // Simple heuristic: if x velocity is low but we are trying to move right, we might be stuck -> Jump
        if (Math.abs(state.player.vx) < 1.0) {
            action.inflate = true;
        }
        
        // Also jump over gaps (if y velocity starts increasing rapidly downwards?)
        // Hard to detect gaps without raycasting.
        // Let's just bunny hop periodically to simulate 'skill'
        if (state.frameCount % 100 < 15) {
            action.inflate = true;
        }
        
        // Deflate if we are too high to land quickly
        if (state.player.y < 100) {
            action.deflate = true;
        }
    }

    return action;
}