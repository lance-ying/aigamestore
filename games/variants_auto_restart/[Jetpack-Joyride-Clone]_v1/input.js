/**
 * Input handling for Keyboard.
 */

import { gameState } from './globals.js';

const keys = {};

export function handleInput(p) {
    // Check for control keys
    const up = isKeyDown(p.UP_ARROW) || isKeyDown(32); // 32 is SPACE
    
    return up; // Return active state of 'thrust'
}

export function setupInput(p) {
    p.keyPressed = function() {
        keys[p.keyCode] = true;
        
        // Phase transitions
        if (p.keyCode === 13) { // ENTER
            if (gameState.gamePhase === 'START') {
                gameState.gamePhase = 'PLAYING';
            }
        }
        
        if (p.keyCode === 27) { // ESC
            if (gameState.gamePhase === 'PLAYING') {
                gameState.gamePhase = 'PAUSED';
            } else if (gameState.gamePhase === 'PAUSED') {
                gameState.gamePhase = 'PLAYING';
            }
        }
        
        if (p.keyCode === 82) { // R
            // If game is over or paused, request a restart. Game.js will handle the actual restart.
            if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE' || gameState.gamePhase === 'PAUSED') {
                gameState.restartRequested = true;
            }
        }
        
        // Vehicle Special ability
        if (p.keyCode === 90) { // Z
            // Trigger special
        }
    };

    p.keyReleased = function() {
        keys[p.keyCode] = false;
    };
}

function isKeyDown(code) {
    return !!keys[code];
}