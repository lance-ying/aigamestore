// input.js
// Handles Keyboard Input

import { gameState, logGameEvent } from './globals.js';
import { Hex } from './hex_lib.js';
import { resolvePlayerAction, isValidMove, isValidAttack, generateLevel, getEntityAt } from './logic.js';

export function handleInput(p) {
    // Only handle press events here. p5.keyPressed calls this.
    const key = p.keyCode;
    
    // Global Inputs
    if (key === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
    }
    
    if (key === 82) { // R
        if (gameState.gamePhase.startsWith("GAME_OVER")) {
            gameState.gamePhase = "START"; // Return to start to reset
        }
    }
    
    if (key === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            gameState.level = 1;
            gameState.score = 0;
            gameState.player = null; // Reset player
            generateLevel(1);
        }
    }
    
    // Gameplay Inputs
    if (gameState.gamePhase === "PLAYING" && gameState.turnState === "PLAYER_INPUT") {
        let movedCursor = false;
        
        // Cursor Movement
        // Map Arrows to hex neighbors somewhat intuitively
        // We track a virtual pixel position for cursor and snap to hex
        
        // Simpler approach: Directional neighbors
        // But arrow keys (4) < Hex neighbors (6)
        // Let's use "Virtual Coordinate" approach.
        // Or simply cycle neighbors? No.
        
        // Let's try: Up/Down modify R. Left/Right modify Q?
        // In pointy top:
        // Right (1, 0), Left (-1, 0)
        // Down-Right (0, 1), Down-Left (-1, 1)
        // Up-Right (1, -1), Up-Left (0, -1)
        
        // Mapping:
        // Left: (-1, 0)
        // Right: (1, 0)
        // Up: (0, -1) [Drifts Left] or (1, -1) [Drifts Right]?
        // Let's make Up/Down move vertically.
        // Current hex: (q, r).
        // Up -> check neighbors, pick one with lowest Y pixel.
        // Down -> check neighbors, pick highest Y pixel.
        
        const currentPos = Hex.toPixel(gameState.cursor);
        let targetDir = null;
        
        if (key === 37) { // Left
             targetDir = {x: -1, y: 0};
        } else if (key === 39) { // Right
             targetDir = {x: 1, y: 0};
        } else if (key === 38) { // Up
             targetDir = {x: 0, y: -1};
        } else if (key === 40) { // Down
             targetDir = {x: 0, y: 1};
        }
        
        if (targetDir) {
            const neighbors = Hex.neighbors(gameState.cursor);
            let best = null;
            let maxDot = -Infinity;
            
            for (let n of neighbors) {
                const nPos = Hex.toPixel(n);
                const dx = nPos.x - currentPos.x;
                const dy = nPos.y - currentPos.y;
                // Normalize
                const len = Math.sqrt(dx*dx + dy*dy);
                const ndx = dx/len;
                const ndy = dy/len;
                
                const dot = ndx * targetDir.x + ndy * targetDir.y;
                if (dot > maxDot) {
                    maxDot = dot;
                    best = n;
                }
            }
            
            // Only move cursor if dot product is reasonable (avoid jumping backwards)
            if (best && maxDot > 0.5) {
                gameState.cursor = best;
                // Clamp cursor to map bounds? Not strictly necessary but good UX
            }
        }
        
        // Actions
        if (key === 32) { // Space
            const cursorHex = gameState.cursor;
            // Determine intent
            if (isValidMove(cursorHex)) {
                resolvePlayerAction('MOVE', cursorHex);
            } else if (isValidAttack(cursorHex)) {
                resolvePlayerAction('ATTACK', cursorHex);
            }
        }
        
        if (key === 90) { // Z
            resolvePlayerAction('WAIT', null);
        }
        
        // Log inputs
        if (p.logs) {
            p.logs.inputs.push({
                key: key,
                cursor: gameState.cursor,
                frame: gameState.frameCount
            });
        }
    }
}