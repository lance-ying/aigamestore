import { gameState, logGameInfo } from './globals.js';

const keys = {};

// Key Codes
export const K = {
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

export function handleInput(p) {
    p.keyPressed = function() {
        keys[p.keyCode] = true;
        
        logGameInfo(p, 'input', { type: 'press', key: p.key, code: p.keyCode });

        // Phase Transitions
        if (p.keyCode === K.ENTER) {
            if (gameState.gamePhase === "START") {
                startNewGame(p);
            }
        }
        
        if (p.keyCode === K.ESC) {
            if (gameState.gamePhase === "PLAYING") {
                gameState.gamePhase = "PAUSED";
            } else if (gameState.gamePhase === "PAUSED") {
                gameState.gamePhase = "PLAYING";
            }
        }

        if (p.keyCode === K.R) {
            if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
                gameState.gamePhase = "START";
            }
        }

        // Gameplay Actions (Trigger once)
        if (gameState.gamePhase === "PLAYING" && gameState.player) {
            if (p.keyCode === K.SPACE) {
                gameState.player.tryJump();
            }
            if (p.keyCode === K.Z) {
                gameState.player.attack();
            }
            if (p.keyCode === K.SHIFT) {
                gameState.player.roll();
            }
        }
    };

    p.keyReleased = function() {
        keys[p.keyCode] = false;
        logGameInfo(p, 'input', { type: 'release', key: p.key, code: p.keyCode });
        
        if (gameState.gamePhase === "PLAYING" && gameState.player) {
            if (p.keyCode === K.SPACE) {
                gameState.player.endJump();
            }
        }
    };
}

export function isKeyDown(keyCode) {
    return !!keys[keyCode];
}

import { generateLevel } from './level.js';
import { Player } from './entities.js';

function startNewGame(p) {
    // Reset State
    gameState.entities = [];
    gameState.platforms = [];
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.collectibles = [];
    gameState.particles = [];
    gameState.score = 0;
    gameState.level = 1;
    gameState.cameraX = 0;
    
    // Generate Level
    generateLevel(p);
    
    // Create Player (Position set by level generator usually, but default here)
    // Level generation sets the spawn point in gameState.spawnPoint
    const startX = gameState.spawnPoint ? gameState.spawnPoint.x : 100;
    const startY = gameState.spawnPoint ? gameState.spawnPoint.y : 200;
    
    gameState.player = new Player(startX, startY);
    gameState.entities.push(gameState.player);

    gameState.gamePhase = "PLAYING";
    logGameInfo(p, 'game', { phase: "PLAYING" });
}