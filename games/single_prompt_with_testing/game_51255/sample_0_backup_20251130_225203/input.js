import { gameState } from './globals.js';

export function handleInput(p) {
    // Only processed in game loop if needed, mainly relying on keyPressed
}

export function handleKeyPress(p) {
    const key = p.keyCode;
    
    // Log input
    if (p.logs) {
        p.logs.inputs.push({
            type: 'PRESS',
            key: key,
            frame: p.frameCount
        });
    }

    // Global Phase Controls
    if (key === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            gameState.score = 0;
            gameState.hoopsPassed = 0;
            gameState.hoops = [];
            gameState.player = null; // Will be created in updateGame
        }
    }

    if (key === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }

    if (key === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            resetGame(p);
        }
    }

    // Gameplay Controls
    if (gameState.gamePhase === "PLAYING" && gameState.player) {
        if (key === 32 || key === 38) { // SPACE or UP
            gameState.player.jump();
        }
    }
}

export function handleKeyRelease(p) {
    // Optional: Log release if needed
}

export function resetGame(p) {
    gameState.gamePhase = "START";
    gameState.score = 0;
    gameState.hoops = [];
    gameState.particles = [];
    gameState.player = null;
    gameState.shakeIntensity = 0;
}