/**
 * input.js
 * Handles keyboard input and input logging.
 */

import { gameState, resetGame, resetLevelState } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

export function handleInput(p) {
    // Only process input if window is focused or explicit click
    // Note: p5 handles this via events, but we want to poll state or event-driven?
    // The requirement says use p.keyPressed etc in main file.
    // Here we can contain logic to interpret those keys.
}

export function handleKeyPressed(p) {
    // Log input
    p.logs.inputs.push({
        input_type: 'keyPressed',
        data: { key: p.key, keyCode: p.keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
    });

    const k = p.keyCode;
    
    // ENTER - Start Game / Next Level (debug)
    if (k === 13) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            resetGame();
        } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            gameState.gamePhase = "START";
        }
    }

    // R - Restart
    if (k === 82) {
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            gameState.gamePhase = "START";
        }
    }

    // ESC - Pause
    if (k === 27) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }

    // Gameplay Controls: SPACE (32) or Z (90)
    if ((k === 32 || k === 90) && gameState.gamePhase === "PLAYING") {
        throwKnife();
    }
}

export function handleAutomatedInput() {
    // Check if automated mode is active
    if (gameState.controlMode === "HUMAN") return;
    
    if (gameState.gamePhase === "PLAYING") {
        const action = get_automated_testing_action(gameState);
        if (action && action.throw) {
            throwKnife();
        }
    } else if (gameState.gamePhase === "START" || gameState.gamePhase.startsWith("GAME_OVER")) {
        // Auto restart for testing continuity
        if (Math.random() < 0.05) {
             if (gameState.gamePhase === "START") {
                gameState.gamePhase = "PLAYING";
                resetGame();
             } else {
                 gameState.gamePhase = "START";
             }
        }
    }
}

function throwKnife() {
    // Check if we can throw
    if (gameState.activeKnife && gameState.activeKnife.state === "READY") {
        gameState.activeKnife.throw();
        gameState.knivesRemaining--;
        // We will spawn a new ready knife after a delay or animation check in game loop
    }
}