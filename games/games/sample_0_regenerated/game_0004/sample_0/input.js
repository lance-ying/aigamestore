/**
 * Input handling system.
 * Manages keyboard events and maps them to game actions.
 */

import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

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
 * Setup input listeners for the p5 instance.
 * @param {p5} p - The p5 instance
 */
export function setupInput(p) {
    p.keyPressed = function() {
        // Prevent default browser scrolling for arrow keys and space
        if([KEYS.SPACE, KEYS.UP, KEYS.DOWN, KEYS.LEFT, KEYS.RIGHT].indexOf(p.keyCode) > -1) {
            event.preventDefault();
        }

        gameState.keys[p.keyCode] = true;
        
        // Log input
        p.logs.inputs.push({
            type: 'press',
            key: p.key,
            keyCode: p.keyCode,
            frame: p.frameCount,
            time: Date.now()
        });

        // Global Phase Transitions
        handleGlobalInput(p.keyCode, p);
    };

    p.keyReleased = function() {
        gameState.keys[p.keyCode] = false;
        
        p.logs.inputs.push({
            type: 'release',
            key: p.key,
            keyCode: p.keyCode,
            frame: p.frameCount,
            time: Date.now()
        });
    };
}

/**
 * Handles inputs that trigger state changes (Pause, Restart, Start).
 */
function handleGlobalInput(keyCode, p) {
    switch (gameState.gamePhase) {
        case "START":
            if (keyCode === KEYS.ENTER) {
                startGame(p);
            }
            break;
            
        case "PLAYING":
            if (keyCode === KEYS.ESC) {
                gameState.gamePhase = "PAUSED";
            }
            break;
            
        case "PAUSED":
            if (keyCode === KEYS.ESC) {
                gameState.gamePhase = "PLAYING";
            }
            break;
            
        case "GAME_OVER_WIN":
        case "GAME_OVER_LOSE":
            if (keyCode === KEYS.R) {
                resetGame(p);
            }
            break;
    }
}

/**
 * Helper to transition to PLAYING state.
 */
function startGame(p) {
    gameState.gamePhase = "PLAYING";
    // Ensure fresh state if needed, though usually resetGame handles init
    if (!gameState.player) {
        resetGame(p);
        gameState.gamePhase = "PLAYING"; // Reset sets it to start, so force playing
    }
}

/**
 * Completely resets the game state for a new session.
 */
export function resetGame(p) {
    // Clear entities
    gameState.entities = [];
    gameState.platforms = [];
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.collectibles = [];
    gameState.particles = [];
    
    // Reset World Stats
    gameState.score = 0;
    gameState.depth = 0;
    gameState.cameraY = 0;
    gameState.worldGeneratedDepth = 0;
    gameState.combo = 0;
    
    // Re-initialize Player
    // Imported dynamically or handled in game.js to avoid circular deps, 
    // but typically we can initialize here if classes are available.
    // For safety, we signal the game loop to re-init via a flag or method in game.js.
    // Here we will just set phase to START and let game.js handle re-creation if needed.
    // However, per requirements, R goes to START screen.
    gameState.gamePhase = "START";
    
    // Log reset
    p.logs.game_info.push({
        event: "RESET",
        timestamp: Date.now()
    });
    
    // Re-seed for reproducibility? 
    // Requirement says "p.randomSeed(42) in setup". We don't re-seed mid-game to allow variation?
    // Or if we want exact same run, we re-seed. 
    // Usually "Restart" implies a fresh try. Let's strictly follow "No other random seeding".
}

/**
 * Checks if a specific key is currently active.
 * Handles both physical keys and automated testing overrides.
 */
export function isKeyDown(keyCode) {
    // Check automated testing
    if (gameState.controlMode !== "HUMAN") {
        const autoAction = get_automated_testing_action(gameState);
        if (autoAction && autoAction.keys && autoAction.keys.includes(keyCode)) {
            return true;
        }
    }
    return gameState.keys[keyCode] === true;
}