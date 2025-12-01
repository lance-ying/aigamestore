// input.js
// Input handling module

import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

export function handleInput(p) {
    // 1. Check for Automated Inputs first
    const autoAction = get_automated_testing_action(gameState, p);
    if (autoAction) {
        if (autoAction.keyDown) {
            handlePhaseKeys(p, autoAction.keyDown); // For Start/Restart
            if (autoAction.keyDown === 32 || autoAction.keyDown === 40) {
                gameState.isDiving = true;
            }
        } else if (autoAction.keyUp) {
             if (autoAction.keyUp === 32 || autoAction.keyUp === 40) {
                gameState.isDiving = false;
            }
        }
        // Continuous state from automation
        if (autoAction.isDiving !== undefined) {
            gameState.isDiving = autoAction.isDiving;
        }
        return;
    }

    // 2. Human Input (only if not automated override active implicitly by the logic above)
    // Actually, we use p5's keyIsDown for continuous gameplay input
    if (gameState.controlMode === "HUMAN") {
        if (p.keyIsDown(p.DOWN_ARROW) || p.keyIsDown(32)) { // 32 is SPACE
            gameState.isDiving = true;
        } else {
            gameState.isDiving = false;
        }
    }
}

export function handleKeyPress(p) {
    // Log input
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            type: 'press',
            key: p.key,
            keyCode: p.keyCode,
            frame: p.frameCount
        });
    }

    // Phase transitions
    if (p.keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
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
        if (gameState.gamePhase === "GAME_OVER_LOSE") {
            // Need to reset game in game.js, but we can signal here or call a global reset
            window.resetGame(p);
        }
    }
}

export function handleKeyRelease(p) {
    // Log input
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            type: 'release',
            key: p.key,
            keyCode: p.keyCode,
            frame: p.frameCount
        });
    }
}

// Helper for automated discrete key presses (Start/Restart)
function handlePhaseKeys(p, keyCode) {
    if (keyCode === 13 || keyCode === 82) { // Enter or R
         // Simulate key press logic
         if (keyCode === 13 && gameState.gamePhase === "START") gameState.gamePhase = "PLAYING";
         if (keyCode === 82 && gameState.gamePhase === "GAME_OVER_LOSE") window.resetGame(p);
    }
}