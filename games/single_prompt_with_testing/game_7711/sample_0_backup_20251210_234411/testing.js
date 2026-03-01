/**
 * testing.js
 * Automated testing bots.
 */

import { HexMath } from './utils.js';
import { Pathfinder } from './grid.js';

export function get_automated_testing_action(gameState) {
    if (gameState.gamePhase !== 'PLAYING') {
        if (gameState.gamePhase === 'START') return { keyCode: 13, shiftKey: false }; // ENTER
        if (gameState.gamePhase.startsWith('GAME_OVER')) return { keyCode: 82, shiftKey: false }; // R
        return null;
    }

    if (gameState.turnPhase !== 'PLAYER_INPUT') return null;

    // Use a delay to simulate human speed and prevent stack overflow if logic is too fast
    if (Date.now() % 500 < 50) return null; // Very basic throttling

    switch (gameState.controlMode) {
        case "TEST_1": return getSurvivalAction(gameState);
        case "TEST_2": return getSpeedrunAction(gameState);
        default: return null;
    }
}

function getSurvivalAction(gameState) {
    // 1. Check health, if low, run away from enemies
    // 2. Otherwise, attack isolated enemies
    // 3. Else wait
    
    // For simplicity: Move to cursor first, then execute
    // We need to emulate the "Move cursor then Space" flow
    // But since we can inject commands, let's cheat and move cursor to target instantly then press space
    
    // Find best tile
    const pTile = gameState.grid.getTile(gameState.player.q, gameState.player.r);
    const neighbors = gameState.grid.getNeighbors(pTile);
    
    let bestTile = null;
    let maxScore = -999;
    
    neighbors.forEach(n => {
        let score = 0;
        if (n.type === 'LAVA') score -= 50;
        if (n.type === 'WALL') score -= 100;
        
        // Enemy proximity
        let closestEnemyDist = 999;
        gameState.enemies.forEach(e => {
            const dist = HexMath.distance(n, gameState.grid.getTile(e.q, e.r));
            if (dist < closestEnemyDist) closestEnemyDist = dist;
        });
        
        if (n.entity) { // Attack
             // Only attack if not surrounded
             if (closestEnemyDist > 1) score += 20; 
             else score -= 10; // Dangerous
        } else {
             score += closestEnemyDist * 2; // Prefer distance
        }
        
        // Prefer Exit slightly
        if (n.type === 'EXIT') score += 100;
        
        if (score > maxScore) {
            maxScore = score;
            bestTile = n;
        }
    });
    
    if (bestTile) {
        // We need to move cursor to bestTile.
        // But handling multi-step cursor movement is hard in one frame.
        // HACK: Teleport cursor state for the test
        gameState.cursor.col = bestTile.col;
        gameState.cursor.row = bestTile.row;
        gameState.cursor.q = bestTile.q;
        gameState.cursor.r = bestTile.r;
        
        return { keyCode: 32, shiftKey: false }; // SPACE
    }
    
    return { keyCode: 90, shiftKey: false }; // WAIT
}

function getSpeedrunAction(gameState) {
    // A* to Exit
    const pTile = gameState.grid.getTile(gameState.player.q, gameState.player.r);
    
    // Find Exit
    let exitTile = null;
    gameState.grid.tileArray.forEach(t => { if(t.type === 'EXIT') exitTile = t; });
    
    if (!exitTile) return null;
    
    const path = Pathfinder.findPath(pTile, exitTile, gameState.grid, true); // Ignore entities for pathing planning
    
    if (path && path.length > 0) {
        const next = path[0];
        gameState.cursor.col = next.col;
        gameState.cursor.row = next.row;
        gameState.cursor.q = next.q;
        gameState.cursor.r = next.r;
        
        // If entity there, check if we can jump over?
        if (next.entity) {
            // Attack!
             return { keyCode: 32, shiftKey: false };
        }
        
        // Jump heuristic: if path[1] is valid and path[0] is lava/enemy
        if (path.length > 1) {
            const jumpTarget = path[1];
             // Simple logic: random jump to speed up?
             // Not implemented for simplicity, just move.
        }
        
        return { keyCode: 32, shiftKey: false };
    }
    
    return { keyCode: 90, shiftKey: false }; // WAIT
}