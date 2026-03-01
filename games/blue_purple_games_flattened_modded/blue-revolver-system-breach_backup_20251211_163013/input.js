/**
 * input.js
 * Handles keyboard input and provides an abstraction layer for controls.
 */

import { gameState, GAME_PHASES } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Key Codes
const KEYS = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SPACE: 32,
    SHIFT: 16,
    Z: 90,
    ENTER: 13,
    ESC: 27,
    R: 82
};

// Input State
const keyState = {};
const keyMap = {
    [KEYS.LEFT]: 'left',
    [KEYS.UP]: 'up',
    [KEYS.RIGHT]: 'right',
    [KEYS.DOWN]: 'down',
    [KEYS.SPACE]: 'shoot',
    [KEYS.SHIFT]: 'focus',
    [KEYS.Z]: 'special',
    [KEYS.ENTER]: 'start',
    [KEYS.ESC]: 'pause',
    [KEYS.R]: 'restart'
};

/**
 * Process key press events from p5
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

    // Global Phase Controls
    if (code === KEYS.ENTER) {
        if (gameState.gamePhase === GAME_PHASES.START) {
            gameState.gamePhase = GAME_PHASES.PLAYING;
            gameState.waveFrame = 0; // Reset wave timer
        }
    } else if (code === KEYS.ESC) {
        if (gameState.gamePhase === GAME_PHASES.PLAYING) {
            gameState.gamePhase = GAME_PHASES.PAUSED;
        } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
            gameState.gamePhase = GAME_PHASES.PLAYING;
        }
    } else if (code === KEYS.R) {
        if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
            gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
            // Reload page or reset state handled in main loop
            // But for this architecture, we signal a reset
            window.location.reload(); 
        }
    }
}

/**
 * Process key release events
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
 * Returns the current state of a specific action.
 * Abstracts whether input comes from Human or AI.
 */
export function getActionInput(actionName) {
    // If automated testing is active and not HUMAN
    if (gameState.controlMode !== "HUMAN") {
        const aiAction = get_automated_testing_action(gameState);
        if (aiAction && aiAction[actionName]) {
            return true;
        }
        // AI usually returns keyCodes, mapping back might be complex 
        // so we rely on the specific implementation of the test controller
        // to set a virtual state or return an object compatible here.
        // For simplicity in this implementation, the AI controller will mimic
        // pressing keys if we used a virtual keyboard, but here we'll pull direct values.
        
        // Revised approach: The AI controller returns an object like { left: true, shoot: true }
        if (aiAction && aiAction[actionName]) return true;
        return false;
    }

    // Human Input
    // Find key code for action name
    for (const [code, name] of Object.entries(keyMap)) {
        if (name === actionName) {
            return keyState[code] === true;
        }
    }
    return false;
}