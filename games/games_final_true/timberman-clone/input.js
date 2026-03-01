/**
 * Input handling module.
 * Captures keyboard events and exposes them to the game loop.
 */

import { gameState, KEYS } from './globals.js';

// Queue to store inputs that need processing in the game loop
// This helps prevent "ghost" inputs or missed inputs between frames
export const inputQueue = [];

export function handleKeyPress(p) {
    const k = p.keyCode;
    gameState.keysPressed[k] = true;

    // Log input
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: k },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }

    // Global Phase Controls
    if (k === KEYS.ESC) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }

    if (k === KEYS.ENTER) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
        }
    }

    if (k === KEYS.R) {
        if (gameState.gamePhase === "GAME_OVER_LOSE" || gameState.gamePhase === "GAME_OVER_WIN") {
            // Restart is handled in game.js main loop logic usually, or we trigger a reset flag
            // But checking phase in draw() is better.
            // We'll set a flag or just reset here if imports allowed (circular dep issue).
            // Better to let game.js poll for R or expose a reset function in globals which we can't import easily if circular.
            // We will let game.js handle the R key logic in its update loop by checking keysPressed or using this event.
            // Actually, we can just export a signal.
        }
    }

    // Gameplay Inputs (Only queue if playing)
    if (gameState.gamePhase === "PLAYING") { // Removed controlMode check as only HUMAN mode exists
        if (k === KEYS.LEFT || k === KEYS.RIGHT) {
            inputQueue.push(k);
        }
    }
}

export function handleKeyRelease(p) {
    gameState.keysPressed[p.keyCode] = false;
    
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            input_type: 'keyReleased',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}

/**
 * Consumes the next input from the queue.
 * @returns {number|null} The keycode or null if empty
 */
export function consumeInput() {
    if (inputQueue.length > 0) {
        return inputQueue.shift();
    }
    return null;
}