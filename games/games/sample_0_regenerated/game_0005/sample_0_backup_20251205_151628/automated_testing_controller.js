/**
 * automated_testing_controller.js
 * Controls automated input for testing scenarios.
 */

import { KEYS } from './input.js';
import { TILE_SIZE } from './globals.js';

let actionCooldown = 0;
let currentAction = null;

export function get_automated_testing_action(gameState) {
    if (gameState.gamePhase !== "PLAYING") return null;

    if (actionCooldown > 0) {
        actionCooldown--;
        return currentAction;
    }

    const { controlMode, player, level } = gameState;

    if (controlMode === 'TEST_1') {
        // Random Survival
        const actions = [KEYS.LEFT, KEYS.RIGHT, KEYS.SPACE, null, null];
        const choice = actions[Math.floor(Math.random() * actions.length)];
        
        currentAction = choice ? { keyCode: choice } : null;
        actionCooldown = Math.floor(Math.random() * 20) + 5;
        return currentAction;

    } else if (controlMode === 'TEST_2') {
        // Pathfinding Heuristic
        if (!player || !level) return null;

        const targetX = level.exitPos.x;
        const targetY = level.exitPos.y;
        
        const dx = targetX - player.x;
        const dy = targetY - player.y;

        // Simple State Machine
        // 1. If we can go down, do it (Wait, gravity handles falling, just move sideways)
        // 2. Move towards X
        // 3. Jump if stuck (y not changing much)
        
        let code = null;

        // If target is to the right
        if (dx > 10) {
            code = KEYS.RIGHT;
        } else if (dx < -10) {
            code = KEYS.LEFT;
        }

        // Random jump to clear obstacles
        if (Math.random() < 0.1) {
            code = KEYS.SPACE;
        }
        
        // Attack enemies if close
        // (Simplified check)
        if (Math.random() < 0.05) {
            code = KEYS.Z;
        }

        currentAction = code ? { keyCode: code } : null;
        actionCooldown = 10;
        return currentAction;
    }

    return null;
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;