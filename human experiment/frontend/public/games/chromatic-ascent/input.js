/**
 * input.js
 * Handles keyboard input and input logging.
 */

import { gameState, resetGameState, getGameState } from './globals.js';

export function handleInput(p) {
    p.keyPressed = function() {
        // Log Input
        p.logs.inputs.push({
            type: 'keyPressed',
            key: p.key,
            keyCode: p.keyCode,
            frameCount: p.frameCount
        });

        // Global Phase Controls
        if (p.keyCode === 13) { // ENTER
            if (gameState.gamePhase === "START") {
                gameState.gamePhase = "PLAYING";
                // If initializing fresh game, setup handled in game.js via check
            }
        }
        
        if (p.keyCode === 27) { // ESC
            if (gameState.gamePhase === "PLAYING") {
                gameState.gamePhase = "PAUSED";
            } else if (gameState.gamePhase === "PAUSED") {
                gameState.gamePhase = "PLAYING";
            }
        }
        
        if (p.keyCode === 82) { // R
            if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
                resetGameState();
                // Ensure the main game loop knows to re-init
                // We'll rely on the game loop checking "player === null" in PLAYING state
                // or we force START
                gameState.gamePhase = "START";
            }
        }

        // Gameplay Controls
        if (gameState.gamePhase === "PLAYING" && gameState.player) {
            // Jump: SPACE (32) or UP ARROW (38)
            if (p.keyCode === 32 || p.keyCode === 38) {
                gameState.player.jump();
            }
        }
    };

    p.keyReleased = function() {
        // We can track held keys in gameState if needed for smooth movement
        // Arrow keys for horizontal adjustment
    };
}

export function handleContinuousInput(p) {
    if (gameState.gamePhase === "PLAYING" && gameState.player) {
        if (p.keyIsDown(p.LEFT_ARROW)) {
            gameState.player.moveHorizontal(-1);
        }
        if (p.keyIsDown(p.RIGHT_ARROW)) {
            gameState.player.moveHorizontal(1);
        }
    }
}