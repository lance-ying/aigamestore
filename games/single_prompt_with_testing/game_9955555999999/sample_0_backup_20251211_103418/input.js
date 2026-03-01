/**
 * Input handling module.
 * Manages keyboard state and automated testing inputs.
 */

import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Key codes
export const KEYS = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SPACE: 32, // Jump
    Z: 90,     // Attack
    SHIFT: 16, // Dash
    ENTER: 13,
    ESC: 27,
    R: 82
};

const keyState = {};
const keyPressedThisFrame = {};

/**
 * Updates the input state. Should be called at the start of the game loop.
 * Integrates automated testing inputs if control mode is not HUMAN.
 */
export function updateInput(p) {
    // Reset "pressed this frame" buffer (managed manually for some logic)
    for (let k in keyPressedThisFrame) {
        keyPressedThisFrame[k] = false;
    }

    // If automated testing, override keys
    if (gameState.controlMode !== 'HUMAN') {
        const action = get_automated_testing_action(gameState);
        
        // Reset keys for automation to prevent stuck keys
        // ideally automation sends "hold" vs "press", but for simple tests:
        if (action) {
            // Clear standard inputs to let automation take over
            keyState[KEYS.LEFT] = false;
            keyState[KEYS.RIGHT] = false;
            keyState[KEYS.UP] = false;
            keyState[KEYS.DOWN] = false;
            keyState[KEYS.Z] = false;
            keyState[KEYS.SPACE] = false;
            keyState[KEYS.SHIFT] = false;
            
            // Apply automation action
            if (action.keys) {
                action.keys.forEach(k => keyState[k] = true);
            }
        }
    }
}

/**
 * Handler for p5 keyPressed
 */
export function handleKeyPressed(p) {
    keyState[p.keyCode] = true;
    keyPressedThisFrame[p.keyCode] = true;

    // Log input
    if(p.logs) {
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }

    // Global Phase Transitions
    if (p.keyCode === KEYS.ENTER) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            p.logs.game_info.push({ event: "Game Started", timestamp: Date.now() });
        }
    }
    
    if (p.keyCode === KEYS.ESC) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }
    
    if (p.keyCode === KEYS.R) {
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Restart is handled in main loop by checking flag or direct call, 
            // but here we just signal state change request typically.
            // For simplicity, we trigger a reset in game.js via a flag check or direct function if imported.
            // We'll handle it in the draw loop of game.js to be safe.
        }
    }
}

/**
 * Handler for p5 keyReleased
 */
export function handleKeyReleased(p) {
    keyState[p.keyCode] = false;
    
    if(p.logs) {
        p.logs.inputs.push({
            input_type: 'keyReleased',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}

/**
 * Check if a key is currently held down.
 */
export function isKeyDown(keyCode) {
    return !!keyState[keyCode];
}

/**
 * Check if a key was pressed specifically in this frame (for one-shot actions like jump start).
 * Note: This requires clearing the buffer every frame, which updateInput does.
 * However, p5's keyPressed event fires independently of draw loop. 
 * For simpler "just pressed" logic in games without complex buffering:
 */
export function isKeyPressed(keyCode) {
    // p5 keyIsDown works for hold, but for 'trigger' we rely on our event listener
    // tracking. 
    return keyPressedThisFrame[keyCode]; 
}

/**
 * Manually consume a key press so it doesn't trigger multiple actions
 */
export function consumeKeyPress(keyCode) {
    keyPressedThisFrame[keyCode] = false;
}