import { gameState, GAME_PHASES, logs } from './globals.js';

// Key codes
export const KEYS = {
    ENTER: 13,
    ESC: 27,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    R: 82,
    SHIFT: 16
};

// Track key states
const keyState = {};

export function handleKeyDown(p, keyCode) {
    keyState[keyCode] = true;

    // Log input
    logs.inputs.push({
        type: 'keydown',
        key: keyCode,
        frame: gameState.frameCount,
        timestamp: Date.now()
    });

    // Phase Transitions
    switch (gameState.gamePhase) {
        case GAME_PHASES.START:
            if (keyCode === KEYS.ENTER) {
                startGame();
            }
            break;
        case GAME_PHASES.PLAYING:
            if (keyCode === KEYS.ESC) {
                gameState.gamePhase = GAME_PHASES.PAUSED;
                logGameInfo("Phase Changed", "PAUSED");
            }
            break;
        case GAME_PHASES.PAUSED:
            if (keyCode === KEYS.ESC) {
                gameState.gamePhase = GAME_PHASES.PLAYING;
                logGameInfo("Phase Changed", "PLAYING");
            }
            break;
        case GAME_PHASES.GAME_OVER_WIN:
        case GAME_PHASES.GAME_OVER_LOSE:
            if (keyCode === KEYS.R) {
                resetGameAndStart();
            }
            break;
    }
}

export function handleKeyUp(p, keyCode) {
    keyState[keyCode] = false;
    
    logs.inputs.push({
        type: 'keyup',
        key: keyCode,
        frame: gameState.frameCount,
        timestamp: Date.now()
    });
}

export function isKeyDown(keyCode) {
    return !!keyState[keyCode];
}

// Helper to clear keys (e.g., on restart)
export function clearKeys() {
    for (const k in keyState) {
        keyState[k] = false;
    }
}

// Internal helpers to interface with game.js logic
function startGame() {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    gameState.startTime = Date.now();
    logGameInfo("Phase Changed", "PLAYING");
}

function resetGameAndStart() {
    // This triggers the reset logic in the main loop
    gameState.gamePhase = GAME_PHASES.START;
    // We let the player press Enter again, or strictly follow R -> Start Screen
    logGameInfo("Phase Changed", "START (Reset)");
}

function logGameInfo(action, details) {
    logs.game_info.push({
        action: action,
        details: details,
        frame: gameState.frameCount,
        timestamp: Date.now()
    });
}