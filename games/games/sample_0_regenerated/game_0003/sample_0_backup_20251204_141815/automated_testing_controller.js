/**
 * automated_testing_controller.js
 * Logic for automated testing modes.
 */

import { gameState, TILE_SIZE } from './globals.js';
import { overrideInputState } from './input.js';

let actionCooldown = 0;

export function get_automated_testing_action() {
    // Reset inputs
    const inputs = {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false,
        sprint: false,
        attack: false
    };

    if (gameState.controlMode === 'TEST_1') {
        // TEST_1: Stability Stress Test
        // Random actions
        if (Math.random() < 0.1) inputs.jump = true;
        if (Math.random() < 0.05) inputs.attack = true;
        
        const dir = Math.random();
        if (dir < 0.3) inputs.left = true;
        else if (dir < 0.6) inputs.right = true;
        
        if (Math.random() < 0.1) inputs.sprint = true;
        
        return inputs;
        
    } else if (gameState.controlMode === 'TEST_2') {
        // TEST_2: Win Strategy (Pathfinding Heuristic)
        
        if (!gameState.player || !gameState.exitPortal) return inputs;
        
        const player = gameState.player;
        const target = gameState.exitPortal;
        
        // Horizontal movement towards target
        const dx = target.x - player.x;
        
        if (dx > 20) {
            inputs.right = true;
        } else if (dx < -20) {
            inputs.left = true;
        }
        
        // Jump obstacle logic
        // Look ahead
        const aheadX = inputs.right ? player.x + player.width + 10 : (inputs.left ? player.x - 10 : player.x);
        
        // Simple "wall or gap" detection (using our access to game state tiles implicitly via physics logic or just blindly jumping)
        // Let's implement a blind "stuck" detector
        if (Math.abs(player.vx) < 0.5 && (inputs.left || inputs.right)) {
            // We are trying to move but stopped -> Jump
            inputs.jump = true;
        }
        
        // Also jump if target is higher
        if (target.y < player.y - 50 && Math.random() < 0.05) {
            inputs.jump = true;
        }
        
        // Sprint to be faster
        inputs.sprint = true;
        
        return inputs;
    }
    
    return null;
}

// Hook into game loop
export function updateAutomatedInput() {
    if (gameState.controlMode !== "HUMAN") {
        const autoInputs = get_automated_testing_action();
        if (autoInputs) {
            overrideInputState(autoInputs);
        }
    }
}