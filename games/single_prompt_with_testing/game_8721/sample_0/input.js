/**
 * input.js
 * Handles keyboard input events and state updates.
 */

import { gameState } from './globals.js';

// Key Codes
const KEY_CODES = {
    ENTER: 13,
    ESC: 27,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SHIFT: 16,
    Z: 90,
    R: 82
};

// Helper to update key state
function setKey(keyCode, isPressed) {
    switch (keyCode) {
        case KEY_CODES.ENTER: gameState.keys.enter = isPressed; break;
        case KEY_CODES.ESC: gameState.keys.esc = isPressed; break;
        case KEY_CODES.SPACE: gameState.keys.space = isPressed; break;
        case KEY_CODES.LEFT: gameState.keys.left = isPressed; break;
        case KEY_CODES.UP: gameState.keys.up = isPressed; break;
        case KEY_CODES.RIGHT: gameState.keys.right = isPressed; break;
        case KEY_CODES.DOWN: gameState.keys.down = isPressed; break;
        case KEY_CODES.SHIFT: gameState.keys.shift = isPressed; break;
        case KEY_CODES.Z: gameState.keys.z = isPressed; break;
        case KEY_CODES.R: gameState.keys.r = isPressed; break;
    }
}

export function handleKeyPressed(p) {
    // Log input
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            type: "PRESS",
            key: p.key,
            keyCode: p.keyCode,
            frame: p.frameCount,
            time: Date.now()
        });
    }

    setKey(p.keyCode, true);
    handlePhaseTransitions(p);
}

export function handleKeyReleased(p) {
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            type: "RELEASE",
            key: p.key,
            keyCode: p.keyCode,
            frame: p.frameCount,
            time: Date.now()
        });
    }

    setKey(p.keyCode, false);
}

function handlePhaseTransitions(p) {
    // START -> PLAYING
    if (gameState.gamePhase === "START" && gameState.keys.enter) {
        gameState.gamePhase = "PLAYING";
        // Reset necessary game variables just in case
        gameState.startTime = p.millis();
    }
    
    // PLAYING <-> PAUSED
    else if (gameState.gamePhase === "PLAYING" && gameState.keys.esc) {
        gameState.gamePhase = "PAUSED";
    }
    else if (gameState.gamePhase === "PAUSED" && gameState.keys.esc) {
        gameState.gamePhase = "PLAYING";
    }
    
    // GAME_OVER -> START (Restart)
    else if ((gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") && gameState.keys.r) {
        // Full reset is handled in game.js via a function call, but we signal intent here
        // Usually, we call a reset function. Since we need access to the game setup,
        // we can set a flag or rely on the game loop to check 'R' in the GAME_OVER state.
        // For this architecture, we will handle the logic in the update loop of game.js or here if we import reset.
        // We will signal via gamePhase transition in game.js update loop to keep dependencies clean.
    }
}