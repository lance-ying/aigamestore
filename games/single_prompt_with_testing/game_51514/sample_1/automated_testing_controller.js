/**
 * automated_testing_controller.js
 * Generates inputs for automated testing modes.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { KEYS } from './input.js';

export function get_automated_testing_action(currentGameState) {
    // Only run if player exists
    if (!currentGameState.player) return null;
    
    const player = currentGameState.player;
    const mode = currentGameState.controlMode;
    
    if (mode === "TEST_1") {
        // TEST_1: Basic Survival
        // Always move right
        // Randomly jump or flip gravity to test stability
        
        const actions = [{ keyCode: KEYS.RIGHT }]; // Always hold Right
        
        // Random Jump (1% chance per frame)
        if (Math.random() < 0.01) {
            actions.push({ keyCode: KEYS.SPACE });
        }
        
        // Random Gravity Flip (0.5% chance)
        if (Math.random() < 0.005) {
            actions.push({ keyCode: KEYS.Z });
        }
        
        return actions; // Return array of keys to press
    }
    
    if (mode === "TEST_2") {
        // TEST_2: Greedy Seeker
        // Move towards portal X
        // Jump/Flip if obstacle detected
        
        const actions = [];
        
        // 1. Move towards goal
        if (currentGameState.portal) {
            if (player.x < currentGameState.portal.x) actions.push({ keyCode: KEYS.RIGHT });
            else actions.push({ keyCode: KEYS.LEFT });
        } else {
            actions.push({ keyCode: KEYS.RIGHT });
        }
        
        // 2. Obstacle Detection (Simulated Raycast)
        let hazardAhead = false;
        const lookAheadDist = 100;
        
        // Check hazards
        currentGameState.hazards.forEach(h => {
            if (h.x > player.x && h.x < player.x + lookAheadDist) {
                // If hazard is on our vertical level
                // Simple check: is it a floor spike and are we on floor?
                // Or ceiling spike and we on ceiling?
                
                const onSameLevel = Math.abs(h.y - player.y) < 100;
                if (onSameLevel) hazardAhead = true;
            }
        });
        
        // Check pits
        // (Simplified: if no platform under us in 50px)
        let groundAhead = false;
        const checkX = player.x + 50;
        const checkY = gameState.gravityDirection === 1 ? player.y + 50 : player.y - 50;
        
        currentGameState.platforms.forEach(p => {
            if (checkX >= p.x && checkX <= p.x + p.width) {
                 // rough height check
                 if (Math.abs(p.y - checkY) < 100) groundAhead = true;
            }
        });
        
        if (hazardAhead || !groundAhead) {
            // Decision: Jump or Flip?
            // If already airborne, flip. If grounded, jump.
            if (player.onGround) {
                actions.push({ keyCode: KEYS.SPACE });
            } else {
                actions.push({ keyCode: KEYS.Z });
            }
        }
        
        return actions;
    }
    
    return null;
}

// Helper to inject input into p5 key handling
// We need to modify how the game loop handles input if testing mode is active
// This is handled in game.js logic loop