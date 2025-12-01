/**
 * Input handling and state management
 */
import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_test.js';

// Key Codes
export const KEY_ENTER = 13;
export const KEY_ESC = 27;
export const KEY_SPACE = 32;
export const KEY_LEFT = 37;
export const KEY_UP = 38;
export const KEY_RIGHT = 39;
export const KEY_DOWN = 40;
export const KEY_R = 82;
export const KEY_SHIFT = 16;
export const KEY_Z = 90;

export function handleKeyPress(p) {
    gameState.keys[p.keyCode] = true;

    // Logging
    p.logs.inputs.push({
        input_type: 'keyPressed',
        data: { key: p.key, keyCode: p.keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
    });

    // Global Game Phase Transitions
    if (p.keyCode === KEY_ENTER) {
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            p.logs.game_info.push({ event: "Game Started", timestamp: Date.now() });
        }
    }

    if (p.keyCode === KEY_ESC) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }

    if (p.keyCode === KEY_R) {
        if (gameState.gamePhase === "GAME_OVER_LOSE" || gameState.gamePhase === "GAME_OVER_WIN") {
            // Trigger restart logic via a flag or direct call in game loop, 
            // but for simplicity, we usually reset in the update loop or here if we have access to reset function.
            // Since resetGame is in game.js, we might check this key in game.js or export resetGame.
            // For now, let's rely on game.js checking keys or specific restart handling.
        }
    }
}

export function handleKeyRelease(p) {
    gameState.keys[p.keyCode] = false;
    
    p.logs.inputs.push({
        input_type: 'keyReleased',
        data: { key: p.key, keyCode: p.keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
    });
}

// Helper to check if a key is active (Human or Bot)
export function isInputActive(keyCode) {
    // If automated testing is active, override human input
    if (gameState.controlMode.startsWith("TEST")) {
        const action = get_automated_testing_action(gameState);
        if (action && action.keys) {
            return action.keys.includes(keyCode);
        }
        return false;
    }
    
    return gameState.keys[keyCode] === true;
}

// Helper for single-frame trigger actions (like shooting) from bot
export function isInputTriggered(keyCode) {
     if (gameState.controlMode.startsWith("TEST")) {
        const action = get_automated_testing_action(gameState);
        if (action && action.trigger === keyCode) {
            return true;
        }
        return false;
    }
    return gameState.keys[keyCode] === true;
}