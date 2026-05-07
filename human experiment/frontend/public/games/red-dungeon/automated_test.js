import { getGameState, TILE_SIZE, PHASE_PLAYING } from './globals.js';
import { getGridKey } from './utils.js';

// Controller for automated testing
window.get_automated_testing_action = function(gameState) {
    if (gameState.gamePhase !== PHASE_PLAYING) return null;

    if (gameState.controlMode === 'TEST_1') {
        return getTest1Action(gameState);
    }
    if (gameState.controlMode === 'TEST_2') {
        return getTest2Action(gameState);
    }
    return null;
};

let lastActionTime = 0;
const ACTION_DELAY = 150; // ms

function getTest1Action(gameState) {
    const now = Date.now();
    if (now - lastActionTime < ACTION_DELAY) return null;
    
    const p = gameState.player;
    if (!p || p.moveState !== "IDLE") return null;
    
    // Strategy: Move UP (dy = -1) if possible. If blocked, try LEFT/RIGHT.
    // Avoid Traps.
    
    const possibleMoves = [
        { dx: 0, dy: -1, code: 38, pref: 3 }, // Up (Best)
        { dx: 1, dy: 0, code: 39, pref: 2 },  // Right
        { dx: -1, dy: 0, code: 37, pref: 2 }, // Left
        { dx: 0, dy: 0, code: 32, pref: 0 }   // Wait
    ];
    
    let bestMove = null;
    let maxScore = -999;
    
    for (let move of possibleMoves) {
        const tx = p.gx + move.dx;
        const ty = p.gy + move.dy;
        const key = getGridKey(tx, ty);
        const tile = gameState.grid.get(key);
        
        let score = move.pref;
        
        // 1. Wall/Bounds Check
        if (!tile || tile.type === 'wall') {
            score = -100;
        } else if (tile.type === 'hole') {
            score = -50;
        }
        
        // 2. Entity/Trap Check
        if (score > -10) {
            const tWx = tx * TILE_SIZE;
            const tWy = ty * TILE_SIZE;
            
            // Check entities at this location
            for (let e of gameState.entities) {
                if (e === p) continue;
                if (e.isDangerous && e.isActive()) {
                    // Simple distance check
                    const dx = Math.abs(e.x - tWx);
                    const dy = Math.abs(e.y - tWy);
                    if (dx < 20 && dy < 20) {
                        score = -80; // Trap here
                    }
                }
            }
        }
        
        if (score > maxScore) {
            maxScore = score;
            bestMove = move;
        }
    }
    
    if (bestMove) {
        lastActionTime = now;
        return { keyCode: bestMove.code };
    }
    return null;
}

function getTest2Action(gameState) {
    // Chaos mode
    const now = Date.now();
    // Faster inputs
    if (now - lastActionTime < 50) return null;
    
    const keys = [37, 38, 39, 40, 32];
    const randKey = keys[Math.floor(Math.random() * keys.length)];
    lastActionTime = now;
    return { keyCode: randKey };
}