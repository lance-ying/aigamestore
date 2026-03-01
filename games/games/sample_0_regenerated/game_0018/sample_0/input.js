/**
 * Input handling system.
 * Manages keyboard state and provides an interface for both Human and AI control.
 */
import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Key codes
export const KEYS = {
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

// Internal key state
const keyState = {};
const keyPressedThisFrame = {};

/**
 * Called by p5's keyPressed
 */
export function handleKeyPressed(p, keyCode) {
    keyState[keyCode] = true;
    keyPressedThisFrame[keyCode] = true;

    // Log input
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            type: 'PRESS',
            key: keyCode,
            frame: p.frameCount,
            time: Date.now()
        });
    }

    // Global Phase controls (processed immediately)
    if (keyCode === KEYS.ENTER) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
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
        if (["GAME_OVER_WIN", "GAME_OVER_LOSE", "PAUSED"].includes(gameState.gamePhase)) {
            // Restart logic handled in main loop or externally, but phase switch triggers it
            // We set a flag or let the game loop handle the transition back to START
            // For simplicity, we can reload, but per instructions we need to go to START.
            // Actual reset happens in game.js update loop when detecting this transition logic
            gameState.gamePhase = "START"; 
        }
    }
}

/**
 * Called by p5's keyReleased
 */
export function handleKeyReleased(p, keyCode) {
    keyState[keyCode] = false;
    
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            type: 'RELEASE',
            key: keyCode,
            frame: p.frameCount,
            time: Date.now()
        });
    }
}

/**
 * Clears "Pressed This Frame" buffer
 * Call at end of frame
 */
export function clearInputBuffer() {
    for (let key in keyPressedThisFrame) {
        delete keyPressedThisFrame[key];
    }
}

/**
 * Core function to get action state
 * Abstraction layer allows bots to inject inputs
 */
export function getAction(actionName) {
    // If we are in a test mode, get input from the bot controller
    if (gameState.controlMode !== "HUMAN") {
        const botInput = get_automated_testing_action(gameState);
        if (botInput && botInput[actionName]) {
            return true;
        }
        // Fallback: If bot doesn't specify, return false (don't mix inputs)
        return false;
    }

    // Human Input Map
    switch (actionName) {
        case 'LEFT': return keyState[KEYS.LEFT];
        case 'RIGHT': return keyState[KEYS.RIGHT];
        case 'UP': return keyState[KEYS.UP];
        case 'DOWN': return keyState[KEYS.DOWN];
        case 'JUMP': return keyState[KEYS.SPACE]; // Hold allowed for higher jumps? or just trigger?
        case 'JUMP_TRIGGER': return keyPressedThisFrame[KEYS.SPACE];
        case 'SHOOT': return keyState[KEYS.Z];
        case 'GRENADE': return keyPressedThisFrame[KEYS.SHIFT];
        default: return false;
    }
}