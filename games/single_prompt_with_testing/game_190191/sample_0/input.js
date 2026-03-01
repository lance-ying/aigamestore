// Input Handling

import { gameState } from './globals.js';
import { LetterEntity } from './entities.js';
import { resetLevel } from './levels.js';

// Key Codes
const KEY_ENTER = 13;
const KEY_BACKSPACE = 8;
const KEY_SPACE = 32;
const KEY_ESC = 27;
const KEY_R = 82;

export function handleKeyPressed(p, keyCode, key) {
    // Global Controls
    if (keyCode === KEY_ESC) {
        if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "SIMULATING" || gameState.gamePhase === "PLANNING") {
            gameState.previousPhase = gameState.gamePhase;
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = gameState.previousPhase;
        }
        return;
    }
    
    if (keyCode === KEY_R) {
        if (gameState.gamePhase === "SIMULATING" || gameState.gamePhase === "PLANNING" || gameState.gamePhase === "PLAYING") {
            resetLevel();
        }
        return;
    }

    // Phase Specific
    if (gameState.gamePhase === "START") {
        if (keyCode === KEY_ENTER) {
            gameState.gamePhase = "PLANNING";
            resetLevel(); // Load level 0
        }
    } else if (gameState.gamePhase === "PLANNING") {
        handleTypingInput(keyCode, key);
    }
}

function handleTypingInput(keyCode, key) {
    if (keyCode === KEY_ENTER) {
        // Spawn Entities
        if (gameState.inputString.length > 0) {
            spawnLetters();
            gameState.gamePhase = "SIMULATING";
        }
    } else if (keyCode === KEY_BACKSPACE) {
        gameState.inputString = gameState.inputString.slice(0, -1);
    } else if (key.length === 1) {
        // Alpha numeric filter
        if (/[a-zA-Z0-9_\-\.\s]/.test(key)) {
            // Limit length
            if (gameState.inputString.length < 20) {
                gameState.inputString += key;
            }
        }
    }
}

function spawnLetters() {
    const spacing = 18;
    const startX = gameState.spawnX;
    const startY = gameState.spawnY;
    
    for (let i = 0; i < gameState.inputString.length; i++) {
        const char = gameState.inputString[i];
        if (char === ' ') continue; // Skip spaces
        
        const x = startX + i * spacing;
        // Small random offset y to prevent perfect stacking issues
        const y = startY - Math.random() * 2; 
        
        const letter = new LetterEntity(char, x, y);
        gameState.physicsBodies.push(letter);
    }
}

// Automated Testing Hook
export function get_automated_testing_action() {
    // Very basic automation simulation
    if (gameState.controlMode === "TEST_1") {
        // Test Typing
        if (gameState.gamePhase === "PLANNING") {
             if (gameState.inputString.length < 5) return { key: 'a', keyCode: 65 };
        }
    }
    return null;
}