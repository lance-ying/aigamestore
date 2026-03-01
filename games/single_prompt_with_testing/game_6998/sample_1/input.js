/**
 * Handles keyboard input events and state.
 * Translates keycodes to abstract game actions.
 */
import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Key mappings
const KEY_CODES = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SPACE: 32,
    SHIFT: 16,
    ENTER: 13,
    ESC: 27,
    R: 82,
    Z: 90
};

// State of keys
const keys = {};
const keyPressFrame = {}; // Frame count when key was pressed (for justPressed)

export function handleInput(p) {
    // If not in human mode, use automated controller
    if (gameState.controlMode !== "HUMAN") {
        const autoAction = get_automated_testing_action(gameState);
        if (autoAction) {
            // Simulate key press for one frame
            // Note: This is a simplified simulation. 
            // For sustained movement, the controller needs to return the key repeatedly.
            if (autoAction.keyCode) {
                keys[autoAction.keyCode] = true;
            }
            // Clear other keys not pressed by bot to avoid stuck keys
            Object.values(KEY_CODES).forEach(code => {
                if (code !== autoAction.keyCode) {
                    keys[code] = false;
                }
            });
        }
    }
}

// Check if a key is currently held down
export function isKeyDown(keyCode) {
    return !!keys[keyCode];
}

// Check if a key was pressed THIS frame
export function isKeyPressed(p, keyCode) {
    return keyPressFrame[keyCode] === p.frameCount;
}

export function setupInput(p) {
    p.keyPressed = function() {
        keys[p.keyCode] = true;
        keyPressFrame[p.keyCode] = p.frameCount;

        // Log input
        if (p.logs && p.logs.inputs) {
            p.logs.inputs.push({
                type: 'PRESS',
                key: p.key,
                keyCode: p.keyCode,
                frame: p.frameCount
            });
        }

        // Global Phase Transitions
        if (p.keyCode === KEY_CODES.ENTER) {
            if (gameState.gamePhase === "START") {
                gameState.gamePhase = "PLAYING";
            }
        } else if (p.keyCode === KEY_CODES.ESC) {
            if (gameState.gamePhase === "PLAYING") {
                gameState.gamePhase = "PAUSED";
            } else if (gameState.gamePhase === "PAUSED") {
                gameState.gamePhase = "PLAYING";
            }
        } else if (p.keyCode === KEY_CODES.R) {
            if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
                // Trigger game reset in main loop
                window.resetGameInstance();
            }
        }
    };

    p.keyReleased = function() {
        keys[p.keyCode] = false;
        
        if (p.logs && p.logs.inputs) {
            p.logs.inputs.push({
                type: 'RELEASE',
                key: p.key,
                keyCode: p.keyCode,
                frame: p.frameCount
            });
        }
    };
}