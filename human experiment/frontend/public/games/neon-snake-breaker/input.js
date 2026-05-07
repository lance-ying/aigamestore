/**
 * input.js
 * Handles keyboard input, state transitions, and key tracking.
 */

import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Key codes
export const KEYS = {
    ENTER: 13,
    ESC: 27,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SHIFT: 16,
    R: 82,
    Z: 90
};

// Active key state map
const keyState = {};

/**
 * Handle Key Press Event
 * @param {object} p - p5 instance
 */
export function handleKeyPress(p) {
    const code = p.keyCode;
    keyState[code] = true;

    // Log input
    p.logs.inputs.push({
        input_type: 'keyPressed',
        data: { key: p.key, keyCode: code },
        framecount: p.frameCount,
        timestamp: Date.now()
    });

    // Global State Transitions
    switch (gameState.gamePhase) {
        case "START":
            if (code === KEYS.ENTER) {
                transitionToPlaying(p);
            }
            break;
        
        case "PLAYING":
            if (code === KEYS.ESC) {
                gameState.gamePhase = "PAUSED";
            }
            if (code === KEYS.Z) {
                // Activate Fever manually if full (handled in player logic usually, but trigger here)
                if (gameState.player) gameState.player.tryActivateFever();
            }
            break;
            
        case "PAUSED":
            if (code === KEYS.ESC) {
                gameState.gamePhase = "PLAYING";
            }
            break;
            
        case "GAME_OVER_LOSE":
            if (code === KEYS.R) {
                transitionToStart(p);
            }
            break;
    }
}

/**
 * Handle Key Release Event
 * @param {object} p - p5 instance
 */
export function handleKeyRelease(p) {
    const code = p.keyCode;
    keyState[code] = false;

    p.logs.inputs.push({
        input_type: 'keyReleased',
        data: { key: p.key, keyCode: code },
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}

/**
 * Check if a specific key is currently held down
 * @param {number} keyCode 
 * @returns {boolean}
 */
export function isKeyDown(keyCode) {
    return !!keyState[keyCode];
}

/**
 * Process Input for the current frame
 * Handles both Human and AI input
 * @param {object} p - p5 instance
 */
export function processInput(p) {
    // Reset transient input flags on player if needed
    if (!gameState.player) return;

    let action = {
        left: false,
        right: false,
        speedMod: false,
        activateFever: false
    };

    if (gameState.controlMode === "HUMAN") {
        action.left = isKeyDown(KEYS.LEFT);
        action.right = isKeyDown(KEYS.RIGHT);
        action.speedMod = isKeyDown(KEYS.SHIFT);
        action.activateFever = isKeyDown(KEYS.Z);
    } else {
        // Automated Test Input
        const aiAction = get_automated_testing_action(gameState);
        if (aiAction) {
            if (aiAction.keyCode === KEYS.LEFT) action.left = true;
            if (aiAction.keyCode === KEYS.RIGHT) action.right = true;
            if (aiAction.keyCode === KEYS.SHIFT) action.speedMod = true;
            if (aiAction.keyCode === KEYS.Z) action.activateFever = true;
        }
    }

    // Apply to player
    gameState.player.handleInput(action);
}

// Helpers for transitions
function transitionToPlaying(p) {
    gameState.gamePhase = "PLAYING";
    p.logs.game_info.push({
        data: { gamePhase: "PLAYING" },
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}

function transitionToStart(p) {
    gameState.reset();
    // We need to re-initialize the game setup here or in the draw loop
    // But since reset() clears entities, the setup function in game.js needs to create the player again
    // We'll handle full re-initialization in the main game update loop when entering START
    gameState.gamePhase = "START";
    if (window.gameInstance && window.gameInstance.setupGame) {
         window.gameInstance.setupGame(); // Call the setup function attached to instance
    }
}