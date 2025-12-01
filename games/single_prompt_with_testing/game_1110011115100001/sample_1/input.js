import { gameState } from './globals.js';

export function handleInput(p) {
    // Phase control logic
    if (p.keyIsDown(13)) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
        }
    }
    
    // Game controls snapshot
    gameState.keys = {};
    if (gameState.gamePhase === "PLAYING") {
        gameState.keys[37] = p.keyIsDown(37); // Left
        gameState.keys[39] = p.keyIsDown(39); // Right
        gameState.keys[38] = p.keyIsDown(38); // Up
        gameState.keys[40] = p.keyIsDown(40); // Down
        gameState.keys[32] = p.keyIsDown(32); // Space
        gameState.keys[16] = p.keyIsDown(16); // Shift
        gameState.keys[90] = p.keyIsDown(90); // Z
    }
}

export function handleKeyPress(p) {
    // Single trigger events
    if (p.keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }
    
    if (p.keyCode === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            gameState.gamePhase = "START";
            // Note: Actual level reset happens when switching to PLAYING in game loop usually, 
            // or we trigger it here. Let's trigger via a flag or just reset phase to START.
            // Level regen logic is better called in start.
        }
    }
}