/**
 * automated_test.js
 * Automated testing controller.
 */

import { gameState, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function getAutomatedAction(p) {
    if (gameState.gamePhase !== 'PLAYING') {
        // Simple heuristic to get out of menus
        if (gameState.gamePhase === 'START' || gameState.gamePhase === 'GAME_OVER_LOSE') {
            return { enter: true, restart: true }; // Just signal generic 'go'
        }
        return {};
    }

    const mode = gameState.controlMode;
    const player = gameState.player;
    if (!player) return {};

    // Simulate key presses
    const actions = {
        [p.LEFT_ARROW]: false,
        [p.RIGHT_ARROW]: false,
        [p.UP_ARROW]: false,
        [p.DOWN_ARROW]: false,
        [32]: false // Space
    };

    if (mode === 'TEST_1') {
        // TEST_1: Move Right blindly, jump randomly
        actions[p.RIGHT_ARROW] = true;
        if (p.frameCount % 120 === 0) { // Jump every 2 seconds
            actions[32] = true;
            gameState.keys.jumpPressed = true;
        }
    } 
    else if (mode === 'TEST_2') {
        // TEST_2: Heuristic AI
        // Move towards the right edge
        actions[p.RIGHT_ARROW] = true;

        // Look ahead
        const map = gameState.currentRoom;
        const gridX = Math.floor((player.x + player.w + 5) / TILE_SIZE);
        const gridY = Math.floor((player.y + player.h) / TILE_SIZE);

        // Jump if wall ahead
        if (map.isSolid(gridX, Math.floor(player.y / TILE_SIZE)) || map.isHazard(gridX, Math.floor(player.y / TILE_SIZE) + 1)) {
            actions[32] = true;
            gameState.keys.jumpPressed = true;
        }
        // Jump if gap ahead
        else if (!map.isSolid(gridX, gridY) && player.isGrounded) {
             actions[32] = true;
             gameState.keys.jumpPressed = true;
        }
    }

    // Apply to real input state for the game loop to pick up
    // Note: This overrides physical keyboard input during test mode
    gameState.keys[p.LEFT_ARROW] = actions[p.LEFT_ARROW];
    gameState.keys[p.RIGHT_ARROW] = actions[p.RIGHT_ARROW];
    gameState.keys[p.UP_ARROW] = actions[p.UP_ARROW];
    gameState.keys[p.DOWN_ARROW] = actions[p.DOWN_ARROW];
    if (actions[32]) gameState.keys[32] = true;
}

// Hook for buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Focus canvas
    window.focus();
};