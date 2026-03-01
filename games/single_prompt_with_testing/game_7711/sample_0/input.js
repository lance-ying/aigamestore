/**
 * input.js
 * Input handling and Controller logic.
 */

import { gameState, logGameEvent } from './globals.js';
import { HexMath } from './utils.js';
import { GameLogic } from './logic.js';
import { get_automated_testing_action } from './testing.js';

export function handleInput(p) {
    // If automated test, override input
    if (gameState.controlMode !== 'HUMAN') {
        const action = get_automated_testing_action(gameState);
        if (action) {
            processKey(p, action.keyCode, action.shiftKey);
        }
        return;
    }
}

export function handleKeyPress(p) {
    processKey(p, p.keyCode, p.keyIsDown(16)); // 16 is SHIFT
}

function processKey(p, keyCode, isShift) {
    // Global State Controls
    if (keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            logGameEvent(p, "PHASE_CHANGE", "PLAYING");
        }
        return;
    }
    
    if (keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        return;
    }
    
    if (keyCode === 82) { // R
        if (gameState.gamePhase.startsWith("GAME_OVER")) {
             window.gameInstance.resetGame();
        }
        return;
    }

    // Gameplay Controls
    if (gameState.gamePhase !== "PLAYING" || gameState.turnPhase !== "PLAYER_INPUT") return;

    // Cursor Movement
    let dCol = 0;
    let dRow = 0;
    
    if (keyCode === 37) dCol = -1; // LEFT
    if (keyCode === 38) dRow = -1; // UP
    if (keyCode === 39) dCol = 1;  // RIGHT
    if (keyCode === 40) dRow = 1;  // DOWN
    
    if (dCol !== 0 || dRow !== 0) {
        // Move cursor in offset coords
        const newCol = gameState.cursor.col + dCol;
        const newRow = gameState.cursor.row + dRow;
        
        // Clamp to grid
        if (gameState.grid && 
            newCol >= 0 && newCol < gameState.grid.cols &&
            newRow >= 0 && newRow < gameState.grid.rows) {
            
            gameState.cursor.col = newCol;
            gameState.cursor.row = newRow;
            const axial = HexMath.offsetToAxial(newCol, newRow);
            gameState.cursor.q = axial.q;
            gameState.cursor.r = axial.r;
        }
        return;
    }
    
    // Actions
    if (keyCode === 32) { // SPACE
        const targetTile = gameState.grid.getTile(gameState.cursor.q, gameState.cursor.r);
        if (targetTile) {
            if (isShift) {
                GameLogic.handlePlayerAction('JUMP', { tile: targetTile });
            } else {
                GameLogic.handlePlayerAction('MOVE', { tile: targetTile });
            }
        }
    }
    
    if (keyCode === 90) { // Z
        GameLogic.handlePlayerAction('WAIT', {});
    }
}