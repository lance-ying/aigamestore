/**
 * Input Handling Module
 * Manages keyboard state and maps inputs to game actions.
 */

import { gameState } from './globals.js';

// Key Codes
export const KEYS = {
    ENTER: 13,
    ESC: 27,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SHIFT: 16,
    Z: 90, // Switch Agent
    X: 88, // Regroup
    R: 82,
    D: 68 // Debug toggle
};

// State tracking
const keyState = {};
const keyPressedThisFrame = {};

/**
 * Initialize input listeners
 * Called from p5 setup
 */
export function initInput(p) {
    // Reset state
    for (let k in KEYS) {
        keyState[KEYS[k]] = false;
        keyPressedThisFrame[KEYS[k]] = false;
    }
}

/**
 * Handle key press event
 * @param {object} p - p5 instance
 */
export function handleKeyPressed(p) {
    const code = p.keyCode;
    keyState[code] = true;
    keyPressedThisFrame[code] = true;
    
    // Log input
    if (p.logs) {
        p.logs.inputs.push({
            type: "PRESS",
            key: code,
            frame: p.frameCount,
            time: Date.now()
        });
    }

    // Global Phase Controls
    handlePhaseTransitions(p, code);
}

/**
 * Handle key release event
 * @param {object} p - p5 instance
 */
export function handleKeyReleased(p) {
    const code = p.keyCode;
    keyState[code] = false;
    
    // Log input
    if (p.logs) {
        p.logs.inputs.push({
            type: "RELEASE",
            key: code,
            frame: p.frameCount,
            time: Date.now()
        });
    }
}

/**
 * Clear "pressed this frame" flags
 * Should be called at the end of every draw loop
 */
export function clearInputFrame() {
    for (let key in keyPressedThisFrame) {
        keyPressedThisFrame[key] = false;
    }
}

/**
 * Check if a key is currently held down
 * @param {number} keyCode 
 * @returns {boolean}
 */
export function isKeyDown(keyCode) {
    return keyState[keyCode] === true;
}

/**
 * Check if a key was pressed specifically this frame
 * @param {number} keyCode 
 * @returns {boolean}
 */
export function wasKeyPressed(keyCode) {
    return keyPressedThisFrame[keyCode] === true;
}

/**
 * Handle Game Phase Transitions based on Input
 */
function handlePhaseTransitions(p, code) {
    switch (gameState.gamePhase) {
        case "START":
            if (code === KEYS.ENTER) {
                gameState.gamePhase = "PLAYING";
                // Trigger level load if needed is handled in game loop
            }
            break;
            
        case "PLAYING":
            if (code === KEYS.ESC) {
                gameState.gamePhase = "PAUSED";
            }
            if (code === KEYS.R) {
                // Restart level
                gameState.shouldRestartLevel = true;
            }
            if (code === KEYS.D) {
                gameState.debugMode = !gameState.debugMode;
            }
            break;
            
        case "PAUSED":
            if (code === KEYS.ESC) {
                gameState.gamePhase = "PLAYING";
            }
            break;
            
        case "LEVEL_COMPLETE":
            if (code === KEYS.ENTER) {
                // Advance to next level logic
                gameState.shouldNextLevel = true;
            }
            break;
            
        case "GAME_OVER_WIN":
        case "GAME_OVER_LOSE":
            if (code === KEYS.R || code === KEYS.ENTER) {
                gameState.gamePhase = "START";
                gameState.shouldResetGame = true;
            }
            break;
    }
}

/**
 * Get current input vector and action flags
 * Used by player controllers
 */
export function getInputState() {
    // If automated testing is active, return that instead
    if (gameState.controlMode !== "HUMAN") {
        return getAutomatedInputState();
    }

    return {
        left: isKeyDown(KEYS.LEFT),
        right: isKeyDown(KEYS.RIGHT),
        up: isKeyDown(KEYS.UP),
        down: isKeyDown(KEYS.DOWN),
        jump: wasKeyPressed(KEYS.SPACE),
        switchAgent: wasKeyPressed(KEYS.Z),
        regroup: isKeyDown(KEYS.X),
        precision: isKeyDown(KEYS.SHIFT),
        interact: wasKeyPressed(KEYS.ENTER)
    };
}

/**
 * Mock input state for automated testing
 * Uses the globally exposed decision function
 */
function getAutomatedInputState() {
    // Default empty state
    const input = {
        left: false,
        right: false,
        up: false,
        down: false,
        jump: false,
        switchAgent: false,
        regroup: false,
        precision: false,
        interact: false
    };
    
    if (window.get_automated_testing_action) {
        const action = window.get_automated_testing_action(gameState);
        if (action) {
            // Map keycode to state
            if (action.keyCode === KEYS.LEFT) input.left = true;
            if (action.keyCode === KEYS.RIGHT) input.right = true;
            if (action.keyCode === KEYS.UP) input.up = true;
            if (action.keyCode === KEYS.DOWN) input.down = true;
            if (action.keyCode === KEYS.SPACE) input.jump = true;
            if (action.keyCode === KEYS.Z) input.switchAgent = true;
            if (action.keyCode === KEYS.X) input.regroup = true;
        }
    }
    
    return input;
}