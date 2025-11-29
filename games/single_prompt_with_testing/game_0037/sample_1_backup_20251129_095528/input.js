// input.js - Keyboard handling
import { gameState } from './globals.js';

const keys = {};

export function handleInput(p) {
    // Only processed inside p.keyPressed/Released in game.js usually,
    // but this helper provides state checking
}

export function isKeyDown(keyCode) {
    return !!keys[keyCode];
}

export function registerKeyPress(p, keyCode) {
    keys[keyCode] = true;
    
    // Phase transitions
    if (keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            startGame();
        }
    }
    
    if (keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }
    
    if (keyCode === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || 
            gameState.gamePhase === "GAME_OVER_LOSE" || 
            gameState.gamePhase === "PLAYING") {
            resetGame(p);
        }
    }
}

export function registerKeyRelease(keyCode) {
    keys[keyCode] = false;
}

import { resetGame, startGame } from './game.js';