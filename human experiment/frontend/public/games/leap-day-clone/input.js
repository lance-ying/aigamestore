/**
 * Input handling
 */
import { gameState } from './globals.js';

export function handleInput(p) {
    const player = gameState.player;
    if (!player) return;

    let inputLeft = false;
    let inputRight = false;

    // 1. Get Control Inputs (only HUMAN mode remains)
    if (p.keyIsDown(p.LEFT_ARROW)) inputLeft = true;
    if (p.keyIsDown(p.RIGHT_ARROW)) inputRight = true;
    // Jumping is handled in keyPressed event for single actuation

    // 2. Apply Movement
    if (inputLeft) player.move(-1);
    else if (inputRight) player.move(1);
    else player.move(0);

    // Automated jumping logic has been removed.
    
    // Log inputs
    if (inputLeft || inputRight) {
         p.logs.inputs.push({
            left: inputLeft,
            right: inputRight,
            jump: false, // Automated jump removed, so always false here
            framecount: p.frameCount
         });
    }
}

// Automated testing controller functions have been removed.

// Global key handlers
export function handleKeyPress(p, keyCode) {
    // Game Flow Controls
    if (keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            p.logs.game_info.push({ phase: "PLAYING", time: Date.now() });
        }
    }
    if (keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }
    if (keyCode === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            window.resetGame(p);
        }
    }

    // Player Actions (Human)
    if (gameState.gamePhase === "PLAYING" && gameState.controlMode === "HUMAN") {
        if (keyCode === 32 || keyCode === 38 || keyCode === 90) { // Space, Up, Z
            if (gameState.player) gameState.player.jump();
        }
    }
}