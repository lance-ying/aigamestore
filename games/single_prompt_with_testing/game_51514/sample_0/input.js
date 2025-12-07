/**
 * input.js
 * Handles keyboard input, maps keys to actions, and manages input state.
 */

import { gameState } from './globals.js';

// Key Codes
export const KEYS = {
    ENTER: 13,
    ESC: 27,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SHIFT: 16,
    Z: 90,
    R: 82
};

/**
 * Updates the input state at the start of the frame.
 * Should be called from the main game loop.
 */
export function updateInput() {
    // Copy current keys to prevKeys for edge detection if needed in logic
    // (Though p5.js keyPressed/keyReleased events handle the raw state toggle)
    // This function can be used for things like input buffering if implemented later.
}

/**
 * Handles p5.js keyPressed event.
 * @param {object} p - p5 instance
 */
export function handleKeyPressed(p) {
    const code = p.keyCode;
    gameState.keys[code] = true;

    // Log input
    p.logs.inputs.push({
        type: 'press',
        key: p.key,
        keyCode: code,
        frame: p.frameCount,
        time: Date.now()
    });

    // Global Phase Transitions
    switch (gameState.gamePhase) {
        case "START":
            if (code === KEYS.ENTER) {
                startGame(p);
            }
            break;
            
        case "PLAYING":
            if (code === KEYS.ESC) {
                gameState.gamePhase = "PAUSED";
            }
            break;
            
        case "PAUSED":
            if (code === KEYS.ESC) {
                gameState.gamePhase = "PLAYING";
            }
            break;
            
        case "GAME_OVER_WIN":
        case "GAME_OVER_LOSE":
            if (code === KEYS.R) {
                resetGame(p);
            }
            break;
    }
}

/**
 * Handles p5.js keyReleased event.
 * @param {object} p - p5 instance
 */
export function handleKeyReleased(p) {
    const code = p.keyCode;
    gameState.keys[code] = false;
    
    p.logs.inputs.push({
        type: 'release',
        key: p.key,
        keyCode: code,
        frame: p.frameCount,
        time: Date.now()
    });
}

/**
 * Helper to check if a specific key is currently held down.
 * @param {number} keyCode 
 * @returns {boolean}
 */
export function isKeyDown(keyCode) {
    return !!gameState.keys[keyCode];
}

/**
 * Internal function to trigger game start logic.
 * Imports startLevel from game.js indirectly or we handle it via state change.
 * To avoid circular imports, we just change state here, and game.js reacts.
 */
function startGame(p) {
    gameState.gamePhase = "PLAYING";
    p.logs.game_info.push({ event: "GAME_START", frame: p.frameCount });
}

/**
 * Internal function to trigger game reset.
 */
function resetGame(p) {
    // We set a flag or state that the main loop picks up to re-initialize
    // Or we call the setup function again if accessible.
    // Better pattern: Set phase to START, let game loop re-init entities if needed.
    // But since we need to rebuild the level, we'll rely on game.js to detect "R" in Game Over,
    // which effectively happened in handleKeyPressed. 
    // We just need to signal the engine to rebuild.
    
    // For this architecture, we will simply set phase to START. 
    // The game loop will see this. But we need to actually re-run the level setup.
    // We will attach a custom event to the window or gameState to signal "REBUILD_LEVEL".
    gameState.shouldRebuild = true; 
    gameState.gamePhase = "START";
}