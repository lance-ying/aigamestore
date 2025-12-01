import { gameState, GAME_PHASES, GAME_OVER_PHASES } from './globals.js';
import { loadLevel, resetGame } from './levels.js';

// Key Codes
const KEY_ENTER = 13;
const KEY_ESC = 27;
const KEY_R = 82;
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_SPACE = 32;
const KEY_SHIFT = 16;
const KEY_Z = 90;

export function handleKeyPress(p) {
    const code = p.keyCode;
    gameState.keys[code] = true;

    // Log input
    p.logs.inputs.push({
        type: 'press',
        key: code,
        frame: p.frameCount,
        time: Date.now()
    });

    // Phase Transitions
    if (code === KEY_ENTER) {
        if (gameState.gamePhase === GAME_PHASES.START) {
            gameState.currentLevel = 1;
            gameState.score = 0;
            resetGame(p);
            gameState.gamePhase = GAME_PHASES.PLAYING;
        } else if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
            if (gameState.currentLevel < gameState.maxLevels) {
                gameState.currentLevel++;
                resetGame(p); // Loads next level
                gameState.gamePhase = GAME_PHASES.PLAYING;
            } else {
                gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
            }
        }
    }

    if (code === KEY_ESC) {
        if (gameState.gamePhase === GAME_PHASES.PLAYING) {
            gameState.gamePhase = GAME_PHASES.PAUSED;
        } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
            gameState.gamePhase = GAME_PHASES.PLAYING;
        }
    }

    if (code === KEY_R) {
        if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
            gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
            gameState.currentLevel = 1;
            gameState.score = 0;
            gameState.gamePhase = GAME_PHASES.START;
        }
    }
}

export function handleKeyRelease(p) {
    const code = p.keyCode;
    gameState.keys[code] = false;
    
    p.logs.inputs.push({
        type: 'release',
        key: code,
        frame: p.frameCount,
        time: Date.now()
    });
}

export function isKeyDown(code) {
    return !!gameState.keys[code];
}