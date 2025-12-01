import { gameState } from './globals.js';

export function handleInput(p) {
    // Keys handled in p.keyPressed mainly for discrete actions
    // Continuous checks if needed can go here
}

export function handleKeyPress(p) {
    gameState.keys[p.keyCode] = true;
    
    p.logs.inputs.push({
        input_type: 'keyPressed',
        data: { key: p.key, keyCode: p.keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
    });
    
    const key = p.keyCode;
    
    // Global controls
    if (key === 13) { // ENTER
        if (gameState.gamePhase === "START" || gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            startNewGame(p);
        }
    }
    
    if (key === 82) { // R
        startNewGame(p);
    }
    
    if (key === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }

    // Gameplay controls
    if (gameState.gamePhase === "PLAYING" && gameState.player) {
        if (key === 32 || key === 38) { // Space or Up
            gameState.player.layEgg();
        }
        
        if (key === 90) { // Z - Debug Fever
            gameState.player.activateFever();
        }
    }
}

export function handleKeyRelease(p) {
    gameState.keys[p.keyCode] = false;
}

// Circular dependency solution: Pass startNewGame function or move it to a shared manager. 
// For this architecture, we'll assign it to window or use an exported setup function in game.js.
// Better: We'll implement a reset function in game.js and export it.

import { initGame } from './game.js';

function startNewGame(p) {
    // Call the initialization logic
    initGame(p);
}