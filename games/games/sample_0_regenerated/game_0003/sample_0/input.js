/**
 * input.js
 * Handles keyboard input events and updates the gameState input snapshot.
 */

import { gameState } from './globals.js';

// Key Codes
const KEYS = {
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

// Track raw key states
const keyState = {};

export function initInput(p) {
    p.keyPressed = function() {
        keyState[p.keyCode] = true;

        // Log input event
        p.logs.inputs.push({
            type: 'press',
            key: p.key,
            keyCode: p.keyCode,
            frame: p.frameCount
        });

        handleGlobalHotkeys(p.keyCode);
    };

    p.keyReleased = function() {
        keyState[p.keyCode] = false;
        
        // Log input event
        p.logs.inputs.push({
            type: 'release',
            key: p.key,
            keyCode: p.keyCode,
            frame: p.frameCount
        });
    };
}

function handleGlobalHotkeys(keyCode) {
    // Game Phase Transitions
    if (keyCode === KEYS.ENTER) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
        }
    } else if (keyCode === KEYS.ESC) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    } else if (keyCode === KEYS.R) {
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Signal to main game loop to restart
            gameState.shouldRestart = true; 
        }
    }
}

export function updateInputState() {
    // Update the simplified input state used by entities
    gameState.inputs.left = keyState[KEYS.LEFT] || false;
    gameState.inputs.right = keyState[KEYS.RIGHT] || false;
    gameState.inputs.up = keyState[KEYS.UP] || false;
    gameState.inputs.down = keyState[KEYS.DOWN] || false;
    gameState.inputs.jump = keyState[KEYS.SPACE] || false;
    gameState.inputs.sprint = keyState[KEYS.SHIFT] || false;
    gameState.inputs.attack = keyState[KEYS.Z] || false;
}

// For automated testing override
export function overrideInputState(fakeInput) {
    gameState.inputs = { ...gameState.inputs, ...fakeInput };
}