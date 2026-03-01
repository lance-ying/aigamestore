/**
 * Automated Testing Controller
 * 
 * Simulates input for automated testing scenarios.
 */

import { gameState } from './globals.js';
import { KEYS } from './input.js';

let testStep = 0;
let waitTimer = 0;

export function get_automated_testing_action() {
    if (!gameState.player) return null;
    
    const p = gameState.player;
    waitTimer++;

    // Helper to generate key press object
    const press = (code) => ({ keyCode: code });

    if (gameState.controlMode === "TEST_1") {
        // Test Movement & Jumping
        if (waitTimer < 60) {
            return press(KEYS.RIGHT);
        } else if (waitTimer < 80) {
            // Jump
            return { keyCode: KEYS.SPACE, held: true, concurrent: KEYS.RIGHT }; 
            // Note: Simplistic return, real implementation handles one key per frame usually or array
            // Here we assume the input handler logs this. For this simple engine, we might just return the primary key.
            // Let's toggle space:
            return press(KEYS.SPACE);
        } else if (waitTimer < 120) {
            return press(KEYS.RIGHT);
        }
    }
    
    if (gameState.controlMode === "TEST_2") {
        // Collect Item Logic (Walk to bubble wand in Room 1,0)
        // Assume start at 0,0. Walk right to exit.
        if (gameState.currentRoomX === 0) {
            return press(KEYS.RIGHT);
        }
        if (gameState.currentRoomX === 1) {
            // Walk to item
            const targetX = 15 * 20; // 300
            if (p.x < targetX) return press(KEYS.RIGHT);
            // Once collected (logic handled in game), switch item
            if (gameState.collectedItems.length > 0 && waitTimer % 60 === 0) {
                return press(KEYS.SHIFT);
            }
        }
    }

    return null;
}

// Hook for window
if (typeof window !== 'undefined') {
    window.get_automated_testing_action = get_automated_testing_action;
}