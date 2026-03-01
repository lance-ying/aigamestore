/**
 * input.js
 * Handles keyboard input and translates it into game actions.
 * Supports both human input and automated testing overrides.
 */

import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Key Codes
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_SPACE = 32;
const KEY_SHIFT = 16;
const KEY_Z = 90;
const KEY_ENTER = 13;
const KEY_ESC = 27;
const KEY_R = 82;

// Raw key state map
const keys = {};
const keyPressBuffer = {}; // For handling "just pressed" events

export function handleKeyDown(p, keyCode) {
    keys[keyCode] = true;
    keyPressBuffer[keyCode] = true;

    // Phase Transitions
    if (keyCode === KEY_ENTER) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            p.logs.game_info.push({ event: "Game Start", time: p.millis() });
        }
    }
    
    if (keyCode === KEY_ESC) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }
    
    if (keyCode === KEY_R) {
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Signal to main loop to reset
            gameState.gamePhase = "RESETTING"; 
        }
    }

    // Logging
    p.logs.inputs.push({
        type: "keydown",
        keyCode: keyCode,
        frame: gameState.frameCount
    });
}

export function handleKeyUp(p, keyCode) {
    keys[keyCode] = false;
    p.logs.inputs.push({
        type: "keyup",
        keyCode: keyCode,
        frame: gameState.frameCount
    });
}

/**
 * Updates the gameState.inputs object based on current control mode.
 */
export function updateInputState() {
    // Reset frame-specific triggers
    gameState.inputs.jumpPressed = false;
    gameState.inputs.shootPressed = false;
    gameState.inputs.dashPressed = false;

    if (gameState.controlMode === "HUMAN") {
        updateHumanInput();
    } else {
        updateAutomatedInput();
    }
    
    // Clear buffer after processing
    for (let k in keyPressBuffer) {
        keyPressBuffer[k] = false;
    }
}

function updateHumanInput() {
    gameState.inputs.left = keys[KEY_LEFT];
    gameState.inputs.right = keys[KEY_RIGHT];
    gameState.inputs.up = keys[KEY_UP];
    gameState.inputs.down = keys[KEY_DOWN];
    gameState.inputs.jump = keys[KEY_SPACE];
    gameState.inputs.shoot = keys[KEY_Z];
    gameState.inputs.dash = keys[KEY_SHIFT];
    
    if (keyPressBuffer[KEY_SPACE]) gameState.inputs.jumpPressed = true;
    if (keyPressBuffer[KEY_Z]) gameState.inputs.shootPressed = true;
    if (keyPressBuffer[KEY_SHIFT]) gameState.inputs.dashPressed = true;
}

function updateAutomatedInput() {
    const action = get_automated_testing_action(gameState);
    
    // Default to false
    gameState.inputs.left = false;
    gameState.inputs.right = false;
    gameState.inputs.up = false;
    gameState.inputs.down = false;
    gameState.inputs.jump = false;
    gameState.inputs.shoot = false;
    gameState.inputs.dash = false;

    if (action) {
        if (action.left) gameState.inputs.left = true;
        if (action.right) gameState.inputs.right = true;
        if (action.up) gameState.inputs.up = true;
        if (action.down) gameState.inputs.down = true;
        if (action.jump) gameState.inputs.jump = true;
        if (action.shoot) gameState.inputs.shoot = true;
        if (action.dash) gameState.inputs.dash = true;
        
        // Simulate press triggers
        if (action.jumpPressed) gameState.inputs.jumpPressed = true;
        if (action.shootPressed) gameState.inputs.shootPressed = true;
        if (action.dashPressed) gameState.inputs.dashPressed = true;
    }
}