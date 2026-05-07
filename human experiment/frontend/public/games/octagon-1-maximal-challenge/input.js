/**
 * Input handling configuration.
 */
import { gameState, ROTATION_SPEED, logGameEvent } from './globals.js';

export function handleInput(p) {
    if (gameState.gamePhase === "PLAYING") {
        
        // Rotation
        if (p.keyIsDown(p.LEFT_ARROW)) {
            gameState.tunnelRotation -= ROTATION_SPEED;
        }
        if (p.keyIsDown(p.RIGHT_ARROW)) {
            gameState.tunnelRotation += ROTATION_SPEED;
        }
        
        // Turbo (Z)
        if (p.keyIsDown(90)) { // Z
            gameState.currentSpeed = Math.min(gameState.currentSpeed + 1, 30);
        } else {
            // Return to normal speed logic
            // handled in game loop
        }
    }
}

export function keyPressed(p) {
    const k = p.keyCode;
    logGameEvent(p, 'input', { keyCode: k, key: p.key, phase: gameState.gamePhase });

    // Global Controls
    if (k === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }

    // Start Phase
    if (gameState.gamePhase === "START") {
        if (k === 13) { // ENTER
            startGame();
        }
    }
    
    // Playing Phase
    if (gameState.gamePhase === "PLAYING") {
        if (k === 32) { // SPACE
            if (gameState.player) gameState.player.flip();
        }
    }
    
    // Game Over Phase
    if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        if (k === 82) { // R
            resetGame();
        }
    }
}

function startGame() {
    gameState.gamePhase = "PLAYING";
    gameState.score = 0;
    gameState.lives = 5;
}

export function resetGame() {
    gameState.gamePhase = "START";
    gameState.score = 0;
    gameState.lives = 5;
    gameState.currentSpeed = 8;
    gameState.tunnelSegments = [];
    gameState.frameCount = 0;
    gameState.tunnelRotation = 0;
    // Re-init happens in main loop when switching to START or init
}