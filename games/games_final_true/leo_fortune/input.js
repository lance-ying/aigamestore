import { gameState } from './globals.js';

const keys = {};

export function initInput(p) {
    p.keyPressed = function() {
        keys[p.keyCode] = true;
        
        handlePhaseInput(p);
    };
    
    p.keyReleased = function() {
        keys[p.keyCode] = false;
    };
}

function handlePhaseInput(p) {
    const code = p.keyCode;
    
    // ENTER - Start Game / Next Level
    if (code === 13) { 
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
        } else if (gameState.gamePhase === "GAME_OVER_WIN") {
            window.nextLevel();
        } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
            window.resetGame();
        } else if (gameState.gamePhase === "GAME_COMPLETE") {
            window.goToTitle();
        }
    }
    
    // ESC - Pause
    if (code === 27) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }
    
    // R - Restart
    if (code === 82) {
        window.resetGame();
    }
}

export function isKeyDown(keyCode) {
    return !!keys[keyCode];
}

export const KEYS = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    SPACE: 32,
    ENTER: 13,
    ESC: 27,
    R: 82,
    SHIFT: 16
};