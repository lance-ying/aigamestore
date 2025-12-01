import { gameState } from './globals.js';

const keys = {};

export function initInput(p) {
    p.keyPressed = function() {
        keys[p.keyCode] = true;
        
        // Log input
        if (p.logs && p.logs.inputs) {
            p.logs.inputs.push({
                type: "press",
                key: p.key,
                keyCode: p.keyCode,
                frame: p.frameCount,
                timestamp: Date.now()
            });
        }
        
        handlePhaseInput(p);
    };
    
    p.keyReleased = function() {
        keys[p.keyCode] = false;
        
        if (p.logs && p.logs.inputs) {
            p.logs.inputs.push({
                type: "release",
                key: p.key,
                keyCode: p.keyCode,
                frame: p.frameCount,
                timestamp: Date.now()
            });
        }
    };
}

function handlePhaseInput(p) {
    const code = p.keyCode;
    
    // ENTER - Start Game / Next Level
    if (code === 13) { 
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            logGameInfo(p, "Phase Changed to PLAYING");
        } else if (gameState.gamePhase === "GAME_OVER_WIN") {
            window.nextLevel();
        } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
            window.resetGame();
        }
    }
    
    // ESC - Pause
    if (code === 27) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
            logGameInfo(p, "Game PAUSED");
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
            logGameInfo(p, "Game RESUMED");
        }
    }
    
    // R - Restart
    if (code === 82) {
        window.resetGame();
        logGameInfo(p, "Game Restarted via R");
    }
}

export function isKeyDown(keyCode) {
    return !!keys[keyCode];
}

function logGameInfo(p, message) {
    if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
            event: message,
            frame: p.frameCount,
            timestamp: Date.now()
        });
    }
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