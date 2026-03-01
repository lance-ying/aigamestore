/**
 * automated_testing_controller.js
 * Logic for automated tests
 */

import { gameState } from './globals.js';

export function get_automated_testing_action() {
    // Only return actions if in a test mode
    if (!gameState.controlMode.startsWith('TEST')) return null;

    const p = gameState.player;
    if (!p) return null;

    const actions = [];

    // --- TEST 1: Movement & Jump ---
    if (gameState.controlMode === 'TEST_1') {
        // Move right then left then jump
        const time = gameState.frameCount % 180;
        if (time < 60) return { keyCode: 39 }; // Right
        if (time < 120) return { keyCode: 37 }; // Left
        if (time < 130) return { keyCode: 32 }; // Jump
    }

    // --- TEST 2: Combat ---
    if (gameState.controlMode === 'TEST_2') {
        // Find nearest enemy
        let nearest = null;
        let minDist = 1000;
        
        gameState.entities.forEach(e => {
            if (e.hp > 0 && e !== p && (e.type !== 'coin' && e.type !== 'potion')) {
                const d = Math.abs(e.x - p.x);
                if (d < minDist) {
                    minDist = d;
                    nearest = e;
                }
            }
        });

        if (nearest) {
            // Move to enemy
            if (nearest.x > p.x + 40) return { keyCode: 39 }; // Right
            if (nearest.x < p.x - 40) return { keyCode: 37 }; // Left
            
            // Attack if close
            if (minDist < 60) return { keyCode: 90 }; // Z
        }
    }
    
    return null; // No action
}

// Expose globally
if (typeof window !== 'undefined') {
    window.get_automated_testing_action = get_automated_testing_action;
}