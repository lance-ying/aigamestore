import { gameState } from './globals.js';

export const KEYS = {
    ENTER: 13,
    ESC: 27,
    SPACE: 32,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    R: 82,
    Z: 90,
    SHIFT: 16
};

export function handleInput(p) {
    p.keyPressed = function() {
        gameState.keys[p.keyCode] = true;
        
        // Logging
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });

        // Global Phase Controls
        if (p.keyCode === KEYS.ENTER) {
            if (gameState.gamePhase === "START") {
                gameState.gamePhase = "PLAYING";
                gameState.subPhase = "SHOP";
                p.logs.game_info.push({ phase: "PLAYING", subPhase: "SHOP", timestamp: Date.now() });
            } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
                // Return to title
                resetGame(true);
            }
        }

        if (p.keyCode === KEYS.R) {
            resetGame(true);
        }

        if (p.keyCode === KEYS.ESC) {
            if (gameState.gamePhase === "PLAYING") {
                gameState.gamePhase = "PAUSED";
            } else if (gameState.gamePhase === "PAUSED") {
                gameState.gamePhase = "PLAYING";
            }
        }
    };

    p.keyReleased = function() {
        gameState.keys[p.keyCode] = false;
        p.logs.inputs.push({
            input_type: 'keyReleased',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };
}

export function isKeyDown(keyCode) {
    return gameState.keys[keyCode] === true;
}

export function resetGame(fullReset = false) {
    gameState.gamePhase = "START";
    gameState.subPhase = "SHOP";
    gameState.frameCount = 0;
    
    // Reset Logic
    gameState.cameraY = 0;
    gameState.depth = 0;
    gameState.caughtFish = [];
    gameState.airborneFish = [];
    gameState.projectiles = [];
    gameState.particles = [];
    
    if (fullReset) {
        gameState.money = 0;
        gameState.lineLengthLevel = 1;
        gameState.gunLevel = 1;
        gameState.lureSpeedLevel = 1;
    }
}