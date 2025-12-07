/**
 * input.js
 * Handles keyboard input.
 */

import { gameState, logGameEvent } from './globals.js';

export function handleInput(p) {
    gameState.keys = gameState.keys || {};
    
    // Define Keys
    const ENTER = 13;
    const ESC = 27;
    const R_KEY = 82;
    const SPACE = 32;

    p.keyPressed = function() {
        gameState.keys[p.keyCode] = true;
        logGameEvent(p, 'input', { key: p.key, code: p.keyCode, action: 'pressed' });

        // Global Phase Controls
        if (p.keyCode === ENTER) {
            if (gameState.gamePhase === 'START') {
                startGame(p);
            }
        }
        
        if (p.keyCode === ESC) {
            if (gameState.gamePhase === 'PLAYING') {
                gameState.gamePhase = 'PAUSED';
            } else if (gameState.gamePhase === 'PAUSED') {
                gameState.gamePhase = 'PLAYING';
            }
        }

        if (p.keyCode === R_KEY) {
            if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
                resetGame(p);
            }
        }

        if (p.keyCode === SPACE || p.keyCode === p.UP_ARROW) {
            gameState.keys.jumpPressed = true; // Buffer jump
        }
    };

    p.keyReleased = function() {
        gameState.keys[p.keyCode] = false;
        logGameEvent(p, 'input', { key: p.key, code: p.keyCode, action: 'released' });
    };
}

// Helpers to start/reset game logic
// Note: These manipulate gameState directly.
function startGame(p) {
    gameState.gamePhase = 'PLAYING';
    gameState.score = 0;
    gameState.roomsCleared = 0;
    gameState.lives = 3;
    // Initial Level Generation Triggered in game.js loop
    gameState.needsReset = true;
}

function resetGame(p) {
    gameState.gamePhase = 'START';
    gameState.score = 0;
    // Cleanup handled in game loop
}