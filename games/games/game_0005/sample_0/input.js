// input.js
// Input handling

import { gameState } from './globals.js';

const keys = {};

export function handleKeyPress(p) {
    keys[p.keyCode] = true;

    // Log input
    if(p.logs) {
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }

    // Phase transitions
    if (p.keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
        } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
             // Although R is for restart, Enter can also convenient restart from win/lose if we reset
             // But instructions say R restarts. Let's keep Enter for Start screen only or purely strictly.
             // Instructions say: "R (82) – restart; returns to the start screen, where the player can press ENTER to play again"
             // So R -> Start Screen. Enter -> Playing.
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
        // Restart game logic handled in game.js via check but we can trigger state change here if needed
        // Ideally, R sends us back to START.
        resetGame(p);
    }
}

export function handleKeyRelease(p) {
    keys[p.keyCode] = false;
    
    if(p.logs) {
        p.logs.inputs.push({
            input_type: 'keyReleased',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}

export function isKeyDown(keyCode) {
    return !!keys[keyCode];
}

export function resetGame(p) {
    // Reset phase
    gameState.gamePhase = "START";
    gameState.score = 0;
    // Re-initialization of entities will happen in p.setup or a specific reset function called by game loop
    // For now, we set a flag or let the game loop handle re-init when transitioning from Start to Playing
    // actually, let's just trigger a re-setup call in the main loop if needed, or simply let the user press Enter.
    // The instructions say "R returns to start screen".
    // We will re-generate the level when entering PLAYING from START.
}

// Key Mapping
export const KEYS = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SPACE: 32,
    SHIFT: 16,
    Z: 90,
    ENTER: 13,
    ESC: 27,
    R: 82
};