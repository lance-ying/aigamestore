// input.js - Keyboard handling
import { gameState } from './globals.js';
import { LEVELS } from './level.js';

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
        } else if (gameState.gamePhase === "GAME_OVER_WIN") {
            // Advance to next level
            gameState.currentLevel++;
            if (gameState.currentLevel >= LEVELS.length) {
                // Completed all levels, loop back or show victory
                gameState.currentLevel = 0;
            }
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
    
    // Level selection (when not playing)
    if (keyCode === 78) { // N - Next Level
        if (gameState.gamePhase === "START") {
            gameState.currentLevel = (gameState.currentLevel + 1) % LEVELS.length;
        }
    }
    
    if (keyCode === 80) { // P - Previous Level
        if (gameState.gamePhase === "START") {
            gameState.currentLevel = (gameState.currentLevel - 1 + LEVELS.length) % LEVELS.length;
        }
    }
}

export function registerKeyRelease(keyCode) {
    keys[keyCode] = false;
}

import { resetGame, startGame } from './game.js';