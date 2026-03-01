/**
 * input.js
 * Handles keyboard input events and maps them to game actions.
 */

import { gameState } from './globals.js';
import { handleAttackInput, handleFury, initCombat } from './combat_manager.js';
import { Player } from './entities.js';
import { CANVAS_WIDTH, GROUND_Y } from './globals.js';

export function handleKeyPress(p) {
    const k = p.keyCode;
    
    // Log input
    p.logs.inputs.push({
        input_type: 'keyPressed',
        data: { key: p.key, keyCode: k },
        framecount: p.frameCount,
        timestamp: Date.now()
    });

    // Global Controls
    if (k === 27) { // ESC
        if (gameState.gamePhase === 'PLAYING') {
            gameState.gamePhase = 'PAUSED';
        } else if (gameState.gamePhase === 'PAUSED') {
            gameState.gamePhase = 'PLAYING';
        }
    }

    if (gameState.gamePhase === 'START') {
        if (k === 13) { // ENTER
            startGame();
        }
    } else if (gameState.gamePhase === 'PLAYING') {
        // Since controlMode is always HUMAN, no need for the conditional check
        if (k === 37) { // LEFT ARROW
            handleAttackInput(-1);
        } else if (k === 39) { // RIGHT ARROW
            handleAttackInput(1);
        } else if (k === 32) { // SPACE
            handleFury();
        }
    } else if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
        if (k === 82) { // R
            resetGame();
        }
    }
}

export function startGame() {
    resetGame(); // Ensure fresh state
    gameState.gamePhase = 'PLAYING';
}

export function resetGame() {
    gameState.gamePhase = 'START';
    gameState.score = 0;
    gameState.combo = 0;
    gameState.furyMeter = 0;
    gameState.enemies = [];
    gameState.particles = [];
    gameState.floatingTexts = [];
    gameState.difficultyLevel = 1;
    gameState.kills = 0;
    gameState.misses = 0;
    gameState.perfectHits = 0;
    gameState.player = new Player(CANVAS_WIDTH / 2, GROUND_Y);
    gameState.isMissStunned = false;
    
    initCombat();
    
    // Log reset
    if (window.gameInstance && window.gameInstance.logs) {
         window.gameInstance.logs.game_info.push({
            data: { event: "GAME_RESET" },
            framecount: window.gameInstance.frameCount,
            timestamp: Date.now()
        });
    }
}