/**
 * automated_testing_controller.js
 * Logic for automated testing modes.
 */

import { gameState, BLOCK, TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT } from './globals.js';
import { KEYS } from './input.js';

export function get_automated_testing_action(gameState) {
    // Return an action object { keyCode: number } or null
    
    if (gameState.controlMode === "TEST_1") {
        // Simple Jump Check
        // Jump every 60 frames
        if (gameState.frameCount % 120 < 20) {
            return { keyCode: KEYS.RIGHT };
        }
        if (gameState.frameCount % 120 === 30) {
            return { keyCode: KEYS.SPACE };
        }
        return null;
    }

    if (gameState.controlMode === "TEST_2") {
        // Cheat to Win
        // Teleport player near core? No, simulating inputs is safer logic-wise, 
        // but finding core blindly is hard.
        // Let's implement a "Cheat" via direct modification in update loop for teleport,
        // but here we return keys to break the block.
        
        // Strategy: 
        // 1. Locate Core.
        // 2. Teleport player next to it (done via hack in game loop or just assume we are there).
        // 3. Press Z to break it.
        
        // Note: The actual teleport logic is better placed in the game loop if specific to test mode,
        // but since we only control keys here, let's just spam Z and assume the player is positioned.
        
        // See game.js updateGame() for the teleport hack.
        return { keyCode: KEYS.Z };
    }

    return null;
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;