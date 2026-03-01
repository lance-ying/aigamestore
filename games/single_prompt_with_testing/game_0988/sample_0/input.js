/**
 * input.js
 * Handles keyboard input events and automated testing hooks.
 */

import { gameState } from './globals.js';

export function handleKeyDown(p) {
    gameState.keys[p.keyCode] = true;

    // Phase Transitions
    if (p.keyCode === 13) { // ENTER
        if (gameState.gamePhase === 'START') {
            startGame();
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
        if (gameState.gamePhase.startsWith('GAME_OVER')) {
            resetGame();
        }
    }

    // Log input
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            input_type: 'keydown',
            data: { keyCode: p.keyCode, key: p.key },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}

export function handleKeyUp(p) {
    gameState.keys[p.keyCode] = false;
}

// Helper to start game logic
function startGame() {
    gameState.gamePhase = 'PLAYING';
    gameState.startTime = Date.now();
    
    // Initialize things if not already
    if (!gameState.player) {
        import('./game.js').then(module => {
           // This dynamic import is just a failsafe, logic usually in main reset
        });
    }
}

// Access the reset function from game.js (circular dependency work-around via window)
function resetGame() {
    if (window.resetGameInstance) {
        window.resetGameInstance();
    }
}