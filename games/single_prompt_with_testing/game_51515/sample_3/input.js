/**
 * input.js
 * Handles keyboard input, buffering, and converting key presses into game actions.
 */

import { gameState, KEYS } from './globals.js';

/**
 * Processes raw p5.js key events and updates game state or input buffer.
 * @param {object} p - p5 instance
 * @param {string} type - 'pressed' or 'released'
 */
export function handleInput(p, type) {
    if (type === 'pressed') {
        const key = p.keyCode;
        
        // Logging
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: key },
            framecount: p.frameCount,
            timestamp: Date.now()
        });

        // Global Phase Controls
        handlePhaseControls(p, key);

        // Gameplay Controls (Buffering)
        if (gameState.gamePhase === "PLAYING") {
            handleGameplayControls(key);
        }
    } else if (type === 'released') {
        p.logs.inputs.push({
            input_type: 'keyReleased',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}

/**
 * Handles Start, Pause, Restart transitions.
 */
function handlePhaseControls(p, key) {
    switch (gameState.gamePhase) {
        case "START":
            if (key === KEYS.ENTER) {
                startGame(p);
            }
            break;
            
        case "PLAYING":
            if (key === KEYS.ESC) {
                gameState.gamePhase = "PAUSED";
            }
            break;
            
        case "PAUSED":
            if (key === KEYS.ESC) {
                gameState.gamePhase = "PLAYING";
            }
            break;
            
        case "GAME_OVER_WIN":
        case "GAME_OVER_LOSE":
            if (key === KEYS.R) {
                restartGame(p);
            }
            break;
    }
}

/**
 * Buffer movement inputs for the player.
 * Allows for smoother control feel by queueing the next move if current move is finishing.
 */
function handleGameplayControls(key) {
    // Only buffer max 2 moves to prevent crazy lag
    if (gameState.inputQueue.length >= 2) return;

    if (key === KEYS.LEFT || key === KEYS.RIGHT || 
        key === KEYS.UP || key === KEYS.DOWN || 
        key === KEYS.SPACE) {
        
        gameState.inputQueue.push({
            key: key,
            timestamp: Date.now()
        });
    }
    
    if (key === KEYS.Z) {
        // Instant action if possible, or queue
        if (gameState.player) {
            gameState.player.useItem();
        }
    }
}

/**
 * Helper to check if a specific key is currently held down.
 * @param {number} keyCode 
 * @returns {boolean}
 */
export function isKeyDown(p, keyCode) {
    return p.keyIsDown(keyCode);
}

/**
 * Helper to check if Shift is held (Sprint)
 */
export function isSprinting(p) {
    return p.keyIsDown(KEYS.SHIFT);
}

/**
 * Transition Logic: Start Game
 */
function startGame(p) {
    gameState.gamePhase = "PLAYING";
    p.logs.game_info.push({
        data: { action: "GAME_START" },
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}

/**
 * Transition Logic: Restart Game
 */
import { resetGameState } from './globals.js';
import { setupLevel } from './level_gen.js';

function restartGame(p) {
    resetGameState();
    // Re-initialize level
    setupLevel(p);
    gameState.gamePhase = "START"; 
}