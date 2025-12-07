/**
 * automated_testing_controller.js
 * AI controller for automated tests.
 */

import { gameState, KEYS } from './globals.js';
import { isSolid, isPit } from './physics.js';

export function get_automated_testing_action() {
    if (!gameState.player || gameState.player.isMoving) return null;

    if (gameState.controlMode === 'TEST_1') {
        // Simple forward movement test
        // Move right continuously
        return { keyCode: KEYS.RIGHT };
    } 
    else if (gameState.controlMode === 'TEST_2') {
        // "Win" mode: Try to survive by pathfinding
        return getSurvivalAction();
    }
    
    return null;
}

function getSurvivalAction() {
    const px = gameState.player.gridX;
    const py = gameState.player.gridY;
    
    // Priority: Right > Up/Down > Left
    // Check Right
    if (isValidMove(px + 1, py)) return { keyCode: KEYS.RIGHT };
    
    // Check Up
    if (isValidMove(px, py - 1)) return { keyCode: KEYS.UP };
    
    // Check Down
    if (isValidMove(px, py + 1)) return { keyCode: KEYS.DOWN };
    
    return { keyCode: KEYS.SPACE }; // Panic/Wait
}

function isValidMove(x, y) {
    return !isSolid(x, y) && !isPit(x, y);
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;