/**
 * automated_testing_controller.js
 * Handles automated inputs for testing scenarios.
 */

import { gameState } from './globals.js';

function getTest1Action() {
    // TEST 1: Basic Movement to Goal (Level 1)
    // Goal is roughly at 4,4,0. Start 0,0,0.
    // Simple script: Move Right 4 times, Move Down 4 times?
    // In Iso:
    // +x is Down-Right (Right Arrow)
    // +y is Down-Left (Down Arrow) 
    
    if (!gameState.player) return null;
    if (gameState.player.isMoving) return null; // Wait for move
    
    // Script based on position
    const { gridX, gridY } = gameState.player;
    
    if (gridX < 4) return { keyCode: 39 }; // Right Arrow (+X)
    if (gridY < 4) return { keyCode: 40 }; // Down Arrow (+Y)
    
    return null;
}

function getTest2Action() {
    // TEST 2: Rotate and Cross (Level 2)
    // Start 0,0,0. Gap at 1,0,0. Rotator at 3,0,0.
    // Need to rotate once to connect bridge.
    
    if (!gameState.player) return null;
    if (gameState.player.isMoving) return null;
    
    // Hardcoded timing
    if (gameState.frameCount < 60) return null; // Wait start
    
    // Press Z once if not done
    // We don't have a variable tracking if we pressed Z.
    // Use frameCount or player pos.
    
    if (gameState.player.gridX === 0 && gameState.frameCount > 60 && gameState.frameCount < 70) {
        // Press Z
        return { key: 'z', keyCode: 90 };
    }
    
    // Move
    if (gameState.frameCount > 100) {
        if (gameState.player.gridX < 3) return { keyCode: 39 }; // Right
        if (gameState.player.gridY < 3) return { keyCode: 40 }; // Down (to goal)
    }
    
    return null;
}

export function get_automated_testing_action() {
    switch (gameState.controlMode) {
        case "TEST_1":
            return getTest1Action();
        case "TEST_2":
            return getTest2Action();
        default:
            return null;
    }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;