/**
 * input.js
 * Handles keyboard input states and mapping.
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

// Input State
export const inputState = {
    keys: {},
    prevKeys: {}, // To detect key down events
    
    // Virtual axes
    horizontal: 0,
    vertical: 0,
    
    // Actions
    attack: false,
    skill: false,
    dash: false,
    confirm: false,
    pause: false,
    restart: false
};

export function initInput(p) {
    // p5.js keyPressed and keyReleased callbacks are set in main game file
    // They update the inputState.keys object
}

export function handleInput(p) {
    // Update previous frame keys logic if needed, but for simplicity
    // we handle simple state checks here.
    
    // Reset axis
    inputState.horizontal = 0;
    inputState.vertical = 0;

    // Movement
    if (isKeyDown(KEYS.LEFT)) inputState.horizontal -= 1;
    if (isKeyDown(KEYS.RIGHT)) inputState.horizontal += 1;
    if (isKeyDown(KEYS.UP)) inputState.vertical -= 1;
    if (isKeyDown(KEYS.DOWN)) inputState.vertical += 1;
    
    // Normalize diagonal movement
    if (inputState.horizontal !== 0 && inputState.vertical !== 0) {
        const invSqrt2 = 0.7071;
        inputState.horizontal *= invSqrt2;
        inputState.vertical *= invSqrt2;
    }

    // Actions (True only on the frame pressed if we wanted strictly trigger-based, 
    // but for simple checks we just read state)
    inputState.attack = isKeyDown(KEYS.SPACE);
    inputState.skill = isKeyDown(KEYS.Z);
    inputState.dash = isKeyDown(KEYS.SHIFT);
    inputState.confirm = isKeyDown(KEYS.ENTER);
    inputState.pause = isKeyDown(KEYS.ESC);
    inputState.restart = isKeyDown(KEYS.R);

    // Logging
    if (p.keyIsPressed && p.frameCount % 10 === 0) { // Throttle logs
        p.logs.inputs.push({
            input_type: 'keyState',
            data: { 
                h: inputState.horizontal, 
                v: inputState.vertical, 
                attack: inputState.attack 
            },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}

// Helper to check key state safely
function isKeyDown(keyCode) {
    return inputState.keys[keyCode] === true;
}

// Event Handlers for p5
export function onKeyPressed(p, keyCode) {
    inputState.keys[keyCode] = true;
    
    // Global Phase Transitions handled immediately on press
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
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Logic to restart is handled in main loop by checking flag or calling reset
            window.resetGame();
        }
    }
}

export function onKeyReleased(p, keyCode) {
    inputState.keys[keyCode] = false;
}