/**
 * Controller for automated testing strategies.
 */
import { CANVAS_WIDTH } from './globals.js';

export function get_automated_testing_action(gameState) {
    const player = gameState.player;
    if (!player) return null;

    switch (gameState.controlMode) {
        case "TEST_1": // Movement & Gravity
            // Move Right then Jump
            if (gameState.frameCount < 60) {
                return { moveRight: true };
            } else if (gameState.frameCount < 90) {
                return { moveRight: true, jump: true };
            }
            return { moveRight: false };

        case "TEST_2": // Combat
            // Move to first enemy and attack
            const target = gameState.enemies[0];
            if (target && target.active) {
                const dist = target.x - player.x;
                if (dist > 50) {
                    return { moveRight: true };
                } else if (dist < -50) {
                    return { moveLeft: true };
                } else {
                    // Attack range
                    return { attack: true };
                }
            }
            return { moveRight: true }; // Search

        case "TEST_3": // Switching
            // Toggle Switch every 60 frames
            if (gameState.frameCount % 60 === 0) {
                return { switchChar: true };
            }
            return {};

        case "TEST_2_WIN": // Boss Rush (Internal Mapping for TEST_2 button if desired, or custom)
             // Not exposed in button list but good for logic
             return {};

        default:
            return null;
    }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;

// Expose helper to set mode from HTML
window.setControlMode = function(mode) {
    const state = window.getGameState();
    if (state) {
        state.controlMode = mode;
        console.log("Control Mode set to:", mode);
        
        // Update button UI
        document.querySelectorAll('.control-button').forEach(btn => btn.classList.remove('active'));
        if (mode === 'HUMAN') document.getElementById('humanModeBtn').classList.add('active');
        if (mode === 'TEST_1') document.getElementById('test_1_ModeBtn').classList.add('active');
        if (mode === 'TEST_2') document.getElementById('test_2_ModeBtn').classList.add('active');
    }
};