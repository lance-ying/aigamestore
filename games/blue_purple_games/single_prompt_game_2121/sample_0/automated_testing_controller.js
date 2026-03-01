// Automated Testing Logic

import { KEYS } from './input.js';
import { CANVAS_WIDTH } from './globals.js';

export function get_automated_testing_action(p, gameState) {
    const player = gameState.player;
    if (!player) return { keys: [] };

    const action = { keys: [] };

    if (gameState.controlMode === "TEST_1") {
        // TEST_1: Survival Strategy
        // Stay near center, jump if falling
        const centerX = CANVAS_WIDTH / 2;
        
        if (player.x < centerX - 50) {
            action.keys.push(KEYS.RIGHT);
        } else if (player.x > centerX + 50) {
            action.keys.push(KEYS.LEFT);
        }

        // Recover
        if (player.y > 250 && !player.onGround) {
            action.keys.push(KEYS.SPACE);
            action.keys.push(KEYS.UP);
            action.keys.push(KEYS.SHIFT); // Up special
        }
    } 
    else if (gameState.controlMode === "TEST_2") {
        // TEST_2: Combat Strategy
        // Find nearest enemy
        let target = null;
        let minDist = 1000;
        
        gameState.enemies.forEach(e => {
            const d = Math.sqrt(Math.pow(e.x - player.x, 2) + Math.pow(e.y - player.y, 2));
            if (d < minDist) {
                minDist = d;
                target = e;
            }
        });

        if (target) {
            if (player.x < target.x - 40) {
                action.keys.push(KEYS.RIGHT);
            } else if (player.x > target.x + 40) {
                action.keys.push(KEYS.LEFT);
            } else {
                // Attack range
                if (p.frameCount % 20 < 10) action.keys.push(KEYS.Z);
            }
        }
    }

    return action;
}