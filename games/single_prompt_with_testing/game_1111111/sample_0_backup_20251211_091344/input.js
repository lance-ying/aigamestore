/**
 * Input handling for keyboard events.
 */
import { gameState } from './globals.js';

const keys = {};

export function handleInput(p) {
    // Only processed inside specific entity updates usually, 
    // but we track state here.
}

export function handleKeyPressed(p) {
    keys[p.keyCode] = true;

    // Log input
    if (p.logs) {
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }

    // Phase Transitions
    if (p.keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            logGameInfo(p, "Phase Change: PLAYING");
        } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
             // Optional: Enter could also restart
             resetGame(p);
        }
    }

    if (p.keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
            logGameInfo(p, "Phase Change: PAUSED");
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
            logGameInfo(p, "Phase Change: PLAYING");
        }
    }

    if (p.keyCode === 82) { // R
        if (gameState.gamePhase.includes("GAME_OVER")) {
            resetGame(p);
        }
    }
}

export function handleKeyReleased(p) {
    keys[p.keyCode] = false;
    
    if (p.logs) {
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

function logGameInfo(p, message) {
    if (p.logs) {
        p.logs.game_info.push({
            data: { message: message, gamePhase: gameState.gamePhase },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}

// Reset function needs to be imported dynamically or attached to window to avoid circular deps if Game.js imports Input.js
// We will assign the reset function in Game.js
let resetGameFn = () => {};
export function registerResetFunction(fn) {
    resetGameFn = fn;
}
function resetGame(p) {
    resetGameFn(p);
}

// Key Mapping
export const KEYS = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    Z: 90,      // Jump
    X: 88,      // Unused/Alternate
    SPACE: 32,  // Item
    SHIFT: 16   // Grapple
};