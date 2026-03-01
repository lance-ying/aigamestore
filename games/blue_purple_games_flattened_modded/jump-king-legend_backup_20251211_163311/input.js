/**
 * Handles keyboard input and maps keys to game actions.
 * Updates the gameState.keys object.
 */
import { gameState, logGameInfo } from './globals.js';

// Key Codes
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_SPACE = 32;
const KEY_SHIFT = 16;
const KEY_ENTER = 13;
const KEY_ESC = 27;
const KEY_R = 82;
const KEY_Z = 90;

export function handleInput(p) {
    // Phase transitions are handled in keyPressed/keyReleased events in game.js usually,
    // but continuous state checks happen here or are queried from gameState.keys
}

export function handleKeyPressed(p) {
    const k = p.keyCode;
    
    // Log raw input
    if (p.logs) {
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: k },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }

    // Global State Controls
    if (k === KEY_ENTER) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            gameState.startTime = Date.now();
            logGameInfo(p, "game_info", { action: "START_GAME" });
        }
    }
    
    if (k === KEY_ESC) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }
    
    if (k === KEY_R) {
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
             // Reset logic is handled in game.js via a flag or direct call, 
             // but here we just signal the phase change to START which triggers reset in loop
             // Actually, we should probably call a reset function. 
             // For safety, let's set a flag that the game loop checks.
             gameState.shouldReset = true;
        }
    }

    // Gameplay Controls
    if (k === KEY_LEFT) gameState.keys.left = true;
    if (k === KEY_RIGHT) gameState.keys.right = true;
    if (k === KEY_UP) gameState.keys.up = true;
    if (k === KEY_DOWN) gameState.keys.down = true;
    if (k === KEY_SPACE) gameState.keys.jump = true;
    if (k === KEY_SHIFT) gameState.keys.walkSlow = true;
    if (k === KEY_Z) gameState.keys.action = true;
}

export function handleKeyReleased(p) {
    const k = p.keyCode;

    // Log raw input
    if (p.logs) {
        p.logs.inputs.push({
            input_type: 'keyReleased',
            data: { key: p.key, keyCode: k },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }

    if (k === KEY_LEFT) gameState.keys.left = false;
    if (k === KEY_RIGHT) gameState.keys.right = false;
    if (k === KEY_UP) gameState.keys.up = false;
    if (k === KEY_DOWN) gameState.keys.down = false;
    if (k === KEY_SPACE) gameState.keys.jump = false;
    if (k === KEY_SHIFT) gameState.keys.walkSlow = false;
    if (k === KEY_Z) gameState.keys.action = false;
}