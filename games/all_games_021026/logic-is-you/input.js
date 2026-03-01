import { gameState, PHASES } from './globals.js';
import { handleInput, saveHistory, restoreHistory } from './physics.js';
import { loadLevel } from './game.js';
import { LEVELS } from './levels.js';

export function setupInput(p) {
    p.keyPressed = function() {
        // Log input
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });

        if (gameState.gamePhase === PHASES.START) {
            if (p.keyCode === p.ENTER) {
                gameState.gamePhase = PHASES.PLAYING;
                loadLevel(0);
            }
        } else if (gameState.gamePhase === PHASES.PLAYING) {
            // Gameplay Controls
            if (p.keyCode === p.ESCAPE) {
                gameState.gamePhase = PHASES.PAUSED;
            } else if (p.key === 'r' || p.key === 'R') {
                loadLevel(gameState.currentLevelIndex);
            } else if (p.key === 'z' || p.key === 'Z') {
                restoreHistory();
            } else if (p.keyCode === 32) { // Space - Skip Level (Debug)
                // nextLevel(); 
            } else {
                handleInput(p, p.keyCode);
            }
        } else if (gameState.gamePhase === PHASES.PAUSED) {
            if (p.keyCode === p.ESCAPE) {
                gameState.gamePhase = PHASES.PLAYING;
            }
        } else if (gameState.gamePhase === PHASES.GAME_OVER_WIN) {
            if (p.keyCode === p.ENTER) {
                nextLevel();
            } else if (p.key === 'r' || p.key === 'R') {
                loadLevel(gameState.currentLevelIndex);
                gameState.gamePhase = PHASES.PLAYING;
            }
        }
    };
    
    p.keyReleased = function() {
        p.logs.inputs.push({
            input_type: 'keyReleased',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };
}

function nextLevel() {
    gameState.currentLevelIndex++;
    if (gameState.currentLevelIndex >= LEVELS.length) {
        gameState.currentLevelIndex = 0; // Loop back
    }
    loadLevel(gameState.currentLevelIndex);
    gameState.gamePhase = PHASES.PLAYING;
}