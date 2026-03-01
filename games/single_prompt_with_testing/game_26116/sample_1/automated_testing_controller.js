/**
 * Automated Testing Controller.
 * Provides inputs based on game state for automated testing scenarios.
 */

import { gameState } from './globals.js';
import { KEY } from './input.js';

export function get_automated_testing_action(gameState) {
    if (!gameState.player) return null;

    const player = gameState.player;

    // Test 1: Basic Movement Check
    if (gameState.controlMode === "TEST_1") {
        // Run right continuously
        // Jump periodically
        const actions = [];
        
        // Always move right
        actions.push({ keyCode: KEY.RIGHT, type: 'hold' });
        
        // Jump every second roughly
        if (gameState.frameCount % 60 === 0) {
            return { keyCode: KEY.SPACE };
        }
        
        // Return Right key press simulation
        return { keyCode: KEY.RIGHT };
    }

    // Test 2: Gameplay Heuristics (Win Attempt)
    if (gameState.controlMode === "TEST_2") {
        // 1. Move Right towards goal
        // 2. Jump if obstacle or pit detected
        // 3. Shoot if enemy in front
        
        const lookAheadDist = 100;
        
        // Check for enemies in front
        const enemyInFront = gameState.entities.some(e => 
            e.type === 'ENEMY' && 
            e.active &&
            e.x > player.x && 
            e.x < player.x + 300 &&
            Math.abs(e.y - player.y) < 50
        );
        
        if (enemyInFront) {
            // Rapid fire
            if (gameState.frameCount % 10 === 0) return { keyCode: KEY.Z };
        }
        
        // Check for pits (simple check: no platform under a point ahead)
        // This is a simulation/cheat check by looking at platform data directly
        const checkX = player.x + 60; // Look ahead
        const checkY = player.y + 40; // Look down
        
        let solidGround = false;
        for (let plat of gameState.platforms) {
            if (checkX >= plat.x && checkX <= plat.x + plat.w &&
                checkY >= plat.y && checkY <= plat.y + 100) { // Check somewhat below
                solidGround = true;
                break;
            }
        }
        
        // Also jump if wall ahead
        let wallAhead = false;
        for (let plat of gameState.platforms) {
             if (checkX >= plat.x && checkX <= plat.x + plat.w &&
                player.y >= plat.y && player.y <= plat.y + plat.h) {
                wallAhead = true;
                break;
            }
        }

        if ((!solidGround || wallAhead) && player.grounded) {
             return { keyCode: KEY.SPACE };
        }

        // Default: Run right
        return { keyCode: KEY.RIGHT };
    }

    return null;
}

// Helper to inject into window
window.get_automated_testing_action = get_automated_testing_action;