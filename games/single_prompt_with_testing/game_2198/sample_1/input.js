/**
 * input.js
 * Handles keyboard input events and updates the gameState input snapshot.
 * Supports mapping for both Human and Automated Test modes.
 */

import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Key Codes map
const KEY_CODES = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SPACE: 32,
    ENTER: 13,
    ESC: 27,
    R: 82,
    SHIFT: 16,
    Z: 90
};

// Internal tracker for raw key states
const rawKeys = {};

/**
 * Called by p5.keyPressed
 */
export function handleKeyPressed(p, keyCode) {
    rawKeys[keyCode] = true;

    // Phase Transitions based on direct key presses (System keys)
    if (keyCode === KEY_CODES.ENTER) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            logGameInfo(p, "Game Phase Changed: PLAYING");
        } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
             // Enter can also restart from game over
            triggerRestart(p);
        }
    }

    if (keyCode === KEY_CODES.ESC) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
            logGameInfo(p, "Game Phase Changed: PAUSED");
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
            logGameInfo(p, "Game Phase Changed: PLAYING");
        }
    }

    if (keyCode === KEY_CODES.R) {
        triggerRestart(p);
    }
    
    // Log raw input for debugging/analysis constraints
    logInput(p, 'keyPressed', keyCode);
}

/**
 * Called by p5.keyReleased
 */
export function handleKeyReleased(p, keyCode) {
    rawKeys[keyCode] = false;
    logInput(p, 'keyReleased', keyCode);
}

/**
 * Helper to restart game logic
 */
function triggerRestart(p) {
    // The actual reset logic is handled in game.js or by setting a flag
    // For simplicity, we can force a phase change which game.js detects
    // But ideally, game.js should export a reset function.
    // We'll set a flag or handle it via the state machine in game.js
    // For now, let's set phase to START and let the game loop handle re-initialization
    // Actually, game.js's draw loop handles the 'START' phase by showing the start screen.
    // We need to re-init entities. This is best done by a callback or checking specific logic.
    // We will set a flag in gameState that we can check in the update loop.
    
    // However, adhering to the "GAME_OVER->START" constraint:
    // Resetting happens when transition to START or directly via init.
    // We will handle the "Hard Reset" in the main update loop when phase changes to START.
    gameState.gamePhase = "START";
    logGameInfo(p, "Game Phase Changed: START (Restart)");
}

/**
 * Updates the high-level input state in gameState.
 * Should be called once per frame at the start of update().
 */
export function updateInputState(p) {
    // 1. Reset frame inputs
    const inputs = gameState.inputs;
    inputs.left = false;
    inputs.right = false;
    inputs.up = false;
    inputs.down = false;
    inputs.jump = false;

    // 2. Determine source of input (Human vs AI)
    if (gameState.controlMode === "HUMAN") {
        // Map raw keys to actions
        inputs.left = rawKeys[KEY_CODES.LEFT];
        inputs.right = rawKeys[KEY_CODES.RIGHT];
        inputs.up = rawKeys[KEY_CODES.UP];
        inputs.down = rawKeys[KEY_CODES.DOWN];
        inputs.jump = rawKeys[KEY_CODES.SPACE] || rawKeys[KEY_CODES.UP];
        inputs.action = rawKeys[KEY_CODES.Z] || rawKeys[KEY_CODES.SHIFT];
    } else {
        // AI Control
        const action = get_automated_testing_action(gameState);
        if (action) {
            if (action.left) inputs.left = true;
            if (action.right) inputs.right = true;
            if (action.jump) inputs.jump = true;
        }
    }
}

// ------------------------------------------------------------------
// Logging Utilities
// ------------------------------------------------------------------

function logInput(p, type, keyCode) {
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            input_type: type,
            data: { key: p.key, keyCode: keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}

function logGameInfo(p, message) {
    if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
            data: { message: message },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}