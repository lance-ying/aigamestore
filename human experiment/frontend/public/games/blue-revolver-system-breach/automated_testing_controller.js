/**
 * automated_testing_controller.js
 * Logic for automated testing scenarios (Survival, Aggressive, Focus).
 */

import { distSq } from './utils.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

/**
 * Main entry point for AI actions.
 * @param {Object} gameState - The global game state
 * @returns {Object} Key states { left: bool, up: bool, ... }
 */
export function get_automated_testing_action(gameState) {
    if (!gameState.player) return null;
    
    const actions = {
        left: false, right: false, up: false, down: false,
        shoot: true, // Always shoot by default
        focus: false,
        special: false
    };

    const pX = gameState.player.x;
    const pY = gameState.player.y;

    // Helper: Move towards target
    const moveTo = (tx, ty) => {
        const threshold = 5;
        if (pX < tx - threshold) actions.right = true;
        if (pX > tx + threshold) actions.left = true;
        if (pY < ty - threshold) actions.down = true;
        if (pY > ty + threshold) actions.up = true;
    };

    // Helper: Avoid nearest bullet
    const avoidBullets = (criticalDist = 40) => {
        let nearestDist = Infinity;
        let threat = null;

        for (const b of gameState.enemyBullets) {
            const d = distSq(pX, pY, b.x, b.y);
            if (d < nearestDist) {
                nearestDist = d;
                threat = b;
            }
        }

        // If threat is close, move away
        if (threat && nearestDist < criticalDist * criticalDist) {
            const dx = pX - threat.x;
            const dy = pY - threat.y;
            // Move in direction of delta
            if (dx > 0) actions.right = true;
            else actions.left = true;
            
            if (dy > 0) actions.down = true;
            else actions.up = true;
            
            return true; // dodging active
        }
        return false;
    };

    switch (gameState.controlMode) {
        case "TEST_1": // Survival
            // Prioritize dodging
            if (!avoidBullets(60)) {
                // If safe, stay in center bottom
                moveTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
            }
            // Occasional bomb if overwhelmed
            if (gameState.enemyBullets.length > 50 && Math.random() < 0.01) {
                actions.special = true;
            }
            break;

        case "TEST_2": // Aggressive
            // Find nearest enemy to align X
            let targetEnemy = null;
            let minDist = Infinity;
            for (const e of gameState.enemies) {
                const d = distSq(pX, pY, e.x, e.y);
                if (d < minDist) {
                    minDist = d;
                    targetEnemy = e;
                }
            }

            // Dodge short range
            const dodging = avoidBullets(30);
            
            if (!dodging && targetEnemy) {
                // Align X
                if (pX < targetEnemy.x - 10) actions.right = true;
                else if (pX > targetEnemy.x + 10) actions.left = true;
            }
            
            // Use bomb for score/clearing
            if (gameState.bombs > 1 && gameState.enemyBullets.length > 30) {
                actions.special = true;
            }
            break;

        case "TEST_3": // Focus
            actions.focus = true;
            actions.shoot = false; // Just dodge
            
            // Move through gaps? Simplified: just dodge very carefully
            if (!avoidBullets(40)) {
                 moveTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
            }
            break;
    }

    return actions;
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;