/**
 * Input Handling Module
 * 
 * Manages keyboard state, input buffering, and control mapping.
 * Provides an abstraction layer over raw keycodes.
 */

import { gameState } from './globals.js';

// Key Constants
export const KEYS = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SPACE: 32, // Jump
    SHIFT: 16, // Special
    Z: 90,     // Attack
    ENTER: 13, // Start
    ESC: 27,   // Pause
    R: 82      // Restart
};

// State tracking
const keyState = {};
const keyPressedFrame = {}; // Frame count when key was last pressed

// Input Buffer (allows pressing a button slightly before an action is possible)
const INPUT_BUFFER_FRAMES = 5;

/**
 * Updates the key state when a key is pressed.
 * @param {object} p - p5 instance
 * @param {number} keyCode - The key code pressed
 */
export function handleKeyDown(p, keyCode) {
    keyState[keyCode] = true;
    keyPressedFrame[keyCode] = p.frameCount;
    
    // Log input
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            input_type: 'keyDown',
            data: { key: p.key, keyCode: keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }

    // Global Game Flow Controls
    handleGlobalControls(p, keyCode);
}

/**
 * Updates the key state when a key is released.
 * @param {object} p - p5 instance
 * @param {number} keyCode - The key code released
 */
export function handleKeyUp(p, keyCode) {
    keyState[keyCode] = false;
    
    // Log input
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            input_type: 'keyUp',
            data: { key: p.key, keyCode: keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}

/**
 * Global game flow control logic (Pause, Start, Restart).
 */
function handleGlobalControls(p, keyCode) {
    if (keyCode === KEYS.ENTER) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            gameState.resetMatch(); // Ensure clean state
            // Note: Actual entity creation happens in game.js logic or setup
        }
    }
    
    if (keyCode === KEYS.ESC) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }
    
    if (keyCode === KEYS.R) {
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            gameState.gamePhase = "START";
        }
    }
}

/**
 * Check if a key is currently held down.
 * @param {number} keyCode 
 * @returns {boolean}
 */
export function isKeyDown(keyCode) {
    return !!keyState[keyCode];
}

/**
 * Check if a key was pressed within the input buffer window.
 * Useful for ensuring jump inputs aren't missed.
 * @param {object} p - p5 instance
 * @param {number} keyCode 
 * @returns {boolean}
 */
export function wasKeyPressed(p, keyCode) {
    if (!keyPressedFrame[keyCode]) return false;
    return (p.frameCount - keyPressedFrame[keyCode]) <= INPUT_BUFFER_FRAMES;
}

/**
 * Consumes a buffered key press (prevents it from triggering twice).
 * @param {number} keyCode 
 */
export function consumeKey(keyCode) {
    keyPressedFrame[keyCode] = -100; // Set to old frame
}

/**
 * Get directional input vector.
 * @returns {object} { x: -1|0|1, y: -1|0|1 }
 */
export function getInputVector() {
    let x = 0;
    let y = 0;
    
    if (isKeyDown(KEYS.LEFT)) x -= 1;
    if (isKeyDown(KEYS.RIGHT)) x += 1;
    if (isKeyDown(KEYS.UP)) y -= 1;
    if (isKeyDown(KEYS.DOWN)) y += 1;
    
    return { x, y };
}