/**
 * Input Handling Module
 */
import { gameState } from './globals.js';

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

const keyState = {};

export function initInput(p) {
    p.keyPressed = function() {
        keyState[p.keyCode] = true;
        
        // Log raw input
        p.logs.inputs.push({
            type: 'pressed',
            keyCode: p.keyCode,
            key: p.key,
            frame: p.frameCount,
            time: Date.now()
        });

        // Global Phase Transitions
        if (p.keyCode === KEYS.ENTER && gameState.gamePhase === "START") {
            // Trigger game initialization (load level, create player)
            gameState.shouldReset = true;
        }
        else if (p.keyCode === KEYS.ESC) {
            if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
            else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        }
        else if (p.keyCode === KEYS.R && (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE")) {
            // Signal main game loop to reset
            gameState.shouldReset = true;
        }
    };

    p.keyReleased = function() {
        keyState[p.keyCode] = false;
        
        p.logs.inputs.push({
            type: 'released',
            keyCode: p.keyCode,
            key: p.key,
            frame: p.frameCount,
            time: Date.now()
        });
    };
}

/**
 * Updates the gameState.input object based on current key states
 * This abstracts the actual key codes from the game logic
 */
export function updateInputState() {
    // Reset input map
    const i = gameState.input;
    
    // Check automation override first
    if (gameState.controlMode !== "HUMAN") {
        if (window.get_automated_testing_action) {
            const action = window.get_automated_testing_action(gameState);
            if (action) {
                // Apply simulated input
                // Note: This is a simplified simulation. 
                // A robust system would map these properly.
                // For now, we assume the action returns keyCodes to simulate in keyState
                // or sets the flags directly.
                // Let's assume action sets flags directly for simplicity:
                i.left = action.left || false;
                i.right = action.right || false;
                i.up = action.up || false;
                i.down = action.down || false;
                i.jump = action.jump || false;
                i.throw = action.throw || false;
                i.crouch = action.crouch || false;
                return; 
            }
        }
    }

    // Normal Human Input
    i.left = keyState[KEYS.LEFT];
    i.right = keyState[KEYS.RIGHT];
    i.up = keyState[KEYS.UP];
    i.down = keyState[KEYS.DOWN];
    i.jump = keyState[KEYS.SPACE];
    i.throw = keyState[KEYS.Z]; // Used for grabbing/eating too
    i.crouch = keyState[KEYS.DOWN]; // Semantically down is crouch
    i.run = keyState[KEYS.SHIFT]; // Use Shift for run/crawl speed mod
}