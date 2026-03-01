/**
 * input.js
 * Handles keyboard events and translates them into game actions.
 */

import { gameState } from './globals.js';
import { calculateMoveRange, calculateAttackTargets, executeAttack } from './logic.js';
import { isValidGrid } from './utils.js';

export function handleInput(p, key, keyCode) {
    // Log Input
    gameState.logs.inputs.push({
        key: key,
        keyCode: keyCode,
        phase: gameState.gamePhase,
        frame: gameState.frameCount
    });

    // Global Phase Controls
    if (keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START") gameState.gamePhase = "PLAYING";
    }
    if (keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }
    if (keyCode === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            // Need full reset, usually handled by window reload or robust reset function
            // Simple phase reset not enough, handled in game.js via callback or check
            window.location.reload(); 
        }
    }

    if (gameState.gamePhase !== "PLAYING") return;
    if (gameState.turnPhase !== "PLAYER_START" && gameState.turnPhase !== "PLAYER_ACTION") return;
    if (gameState.isAnimating) return; // Block input during animations

    const cursor = gameState.cursor;

    // Movement Controls
    if (keyCode === p.LEFT_ARROW) {
        if (cursor.x > 0) cursor.x--;
    } else if (keyCode === p.RIGHT_ARROW) {
        if (cursor.x < 7) cursor.x++; // Hardcoded col-1
    } else if (keyCode === p.UP_ARROW) {
        if (cursor.y > 0) cursor.y--;
    } else if (keyCode === p.DOWN_ARROW) {
        if (cursor.y < 5) cursor.y++; // Hardcoded row-1
    }

    // Selection / Action (SPACE)
    if (keyCode === 32) { 
        handleSpaceKey(p);
    }

    // Cancel / Deselect (Z)
    if (keyCode === 90) {
        if (gameState.selectionState !== "NONE") {
            gameState.selectionState = "NONE";
            gameState.selectedUnit = null;
            gameState.validMoves = [];
            gameState.validTargets = [];
        }
    }

    // End Turn (SHIFT)
    if (keyCode === 16) {
        // Simple shift press ends turn if no selection
        if (gameState.selectionState === "NONE") {
            gameState.turnPhase = "ENEMY_ATTACK"; // Advance turn
        } else if (gameState.selectionState === "TARGETING") {
            // If targeting, shift can mean 'Undo Move'
            const unit = gameState.selectedUnit;
            // Revert position
            if (unit.prevPos) {
                gameState.grid[unit.gridX][unit.gridY].entity = null; // Clear current
                unit.gridX = unit.prevPos.x;
                unit.gridY = unit.prevPos.y;
                gameState.grid[unit.gridX][unit.gridY].entity = unit;
                unit.pixelX = unit.prevPos.px;
                unit.pixelY = unit.prevPos.py;
                
                gameState.selectionState = "MOVING";
                // Recalc moves
                gameState.validMoves = calculateMoveRange(unit);
            }
        }
    }
}

function handleSpaceKey(p) {
    const tile = gameState.grid[gameState.cursor.x][gameState.cursor.y];
    
    if (gameState.selectionState === "NONE") {
        // Select Unit
        if (tile.entity && tile.entity.type === "MECH" && !tile.entity.hasActed) {
            gameState.selectedUnit = tile.entity;
            gameState.selectionState = "MOVING";
            gameState.validMoves = calculateMoveRange(gameState.selectedUnit);
        }
    } else if (gameState.selectionState === "MOVING") {
        // Confirm Move
        // Check if cursor in validMoves
        const valid = gameState.validMoves.some(m => m.x === gameState.cursor.x && m.y === gameState.cursor.y);
        
        if (valid) {
            // Save prev pos for undo
            gameState.selectedUnit.prevPos = {
                x: gameState.selectedUnit.gridX,
                y: gameState.selectedUnit.gridY,
                px: gameState.selectedUnit.pixelX,
                py: gameState.selectedUnit.pixelY
            };

            // Execute Move
            const u = gameState.selectedUnit;
            gameState.grid[u.gridX][u.gridY].entity = null;
            u.gridX = gameState.cursor.x;
            u.gridY = gameState.cursor.y;
            gameState.grid[u.gridX][u.gridY].entity = u;
            
            // Switch to targeting
            gameState.selectionState = "TARGETING";
            gameState.validTargets = calculateAttackTargets(u);
            gameState.validMoves = [];
        } else if (tile.entity === gameState.selectedUnit) {
            // Clicked self, stay here and attack
            gameState.selectedUnit.prevPos = {
                x: gameState.selectedUnit.gridX,
                y: gameState.selectedUnit.gridY,
                px: gameState.selectedUnit.pixelX,
                py: gameState.selectedUnit.pixelY
            };
            gameState.selectionState = "TARGETING";
            gameState.validTargets = calculateAttackTargets(gameState.selectedUnit);
            gameState.validMoves = [];
        }
    } else if (gameState.selectionState === "TARGETING") {
        // Confirm Attack
        const valid = gameState.validTargets.some(t => t.x === gameState.cursor.x && t.y === gameState.cursor.y);
        
        if (valid) {
            executeAttack(gameState.selectedUnit, gameState.cursor.x, gameState.cursor.y);
            gameState.selectedUnit.hasActed = true;
            gameState.selectionState = "NONE";
            gameState.selectedUnit = null;
            gameState.validTargets = [];
        }
    }
}