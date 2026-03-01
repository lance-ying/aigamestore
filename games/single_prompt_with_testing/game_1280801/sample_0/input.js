import { gameState, logs } from './globals.js';
import { CELL_TYPE } from './grid.js';
import { spawnPulseEffect } from './particles.js';
import { getColorObj } from './utils.js';

// Input handling Logic
export function handleInput(p, keyCode) {
    logs.inputs.push({
        type: 'keydown',
        keyCode: keyCode,
        frame: gameState.frameCount,
        time: Date.now()
    });

    // Global phase controls
    if (keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") gameState.gamePhase = "PAUSED";
        else if (gameState.gamePhase === "PAUSED") gameState.gamePhase = "PLAYING";
        return;
    }

    if (keyCode === 82) { // R - Restart level
        if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "GAME_OVER_WIN") {
            gameState.grid.clearPipes();
            gameState.cursor.isDrawing = false;
            gameState.cursor.drawingColorIndex = -1;
            
            // Reset phase if we were in win screen
            if (gameState.gamePhase === "GAME_OVER_WIN") {
                gameState.gamePhase = "PLAYING";
            }
        }
        return;
    }
    
    if (gameState.gamePhase === "START") {
        if (keyCode === 13) { // ENTER
            gameState.gamePhase = "PLAYING";
        }
        return;
    }
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        if (keyCode === 13) { // ENTER - Next Level
            gameState.levelIndex++;
            window.startLevel(gameState.levelIndex);
            gameState.gamePhase = "PLAYING";
        }
        return;
    }

    if (gameState.gamePhase !== "PLAYING") return;

    // GAMEPLAY INPUTS
    const c = gameState.cursor;
    const grid = gameState.grid;
    
    // Movement
    let dx = 0;
    let dy = 0;
    if (keyCode === 37) dx = -1; // Left
    if (keyCode === 39) dx = 1;  // Right
    if (keyCode === 38) dy = -1; // Up
    if (keyCode === 40) dy = 1;  // Down
    
    if (dx !== 0 || dy !== 0) {
        const nx = c.x + dx;
        const ny = c.y + dy;
        
        if (nx >= 0 && nx < gameState.gridWidth && ny >= 0 && ny < gameState.gridHeight) {
            c.x = nx;
            c.y = ny;
            
            // If drawing, try to extend pipe
            if (c.isDrawing) {
                attemptPipeExtension(nx, ny);
            }
        }
    }
    
    // Action (Space/Z)
    if (keyCode === 32 || keyCode === 90) {
        handleAction();
    }
}

function handleAction() {
    const c = gameState.cursor;
    const cell = gameState.grid.getCell(c.x, c.y);
    
    // Case 1: Stop drawing if already drawing
    if (c.isDrawing) {
        c.isDrawing = false;
        c.drawingColorIndex = -1;
        
        // Check if we ended on a valid connection? Logic handled in extension
        checkWinCondition();
        return;
    }
    
    // Case 2: Start drawing from a DOT
    if (cell.type === CELL_TYPE.DOT) {
        startDrawing(cell.colorIndex, c.x, c.y);
        return;
    }
    
    // Case 3: Start drawing from end of existing pipe
    if (cell.type === CELL_TYPE.PIPE && cell.colorIndex !== -1) {
        // Check if this cell is an endpoint of the current path
        const path = gameState.paths[cell.colorIndex];
        if (path && path.length > 0) {
            const last = path[path.length - 1];
            if (last.x === c.x && last.y === c.y) {
                // Resume drawing
                c.isDrawing = true;
                c.drawingColorIndex = cell.colorIndex;
                return;
            }
            // If we click in the middle of a pipe, maybe cut it there?
            // "Cut" logic: remove all segments after this point
            const idx = path.findIndex(pt => pt.x === c.x && pt.y === c.y);
            if (idx !== -1) {
                // Slice path
                const newPath = path.slice(0, idx + 1);
                gameState.paths[cell.colorIndex] = newPath;
                
                // Clear grid cells that were removed
                const removed = path.slice(idx + 1);
                removed.forEach(pt => {
                    const rc = gameState.grid.getCell(pt.x, pt.y);
                    if (rc.type === CELL_TYPE.PIPE) rc.reset();
                });
                
                // Resume drawing from here
                gameState.grid.updateConnections();
                c.isDrawing = true;
                c.drawingColorIndex = cell.colorIndex;
                
                // Remove from completed if it was complete
                const completeIdx = gameState.completedColors.indexOf(cell.colorIndex);
                if (completeIdx > -1) gameState.completedColors.splice(completeIdx, 1);
            }
        }
    }
}

function startDrawing(colorIndex, x, y) {
    const c = gameState.cursor;
    const grid = gameState.grid;
    
    // Clear existing path for this color if we start from the DOT
    const existingPath = gameState.paths[colorIndex];
    if (existingPath.length > 0) {
        // Clear grid cells
        existingPath.forEach(pt => {
            const cell = grid.getCell(pt.x, pt.y);
            if (cell.type === CELL_TYPE.PIPE) cell.reset();
        });
    }
    
    // Initialize new path
    gameState.paths[colorIndex] = [{x, y}];
    
    // Remove from completed list
    const idx = gameState.completedColors.indexOf(colorIndex);
    if (idx > -1) gameState.completedColors.splice(idx, 1);
    
    gameState.grid.updateConnections();
    
    c.isDrawing = true;
    c.drawingColorIndex = colorIndex;
}

function attemptPipeExtension(x, y) {
    const c = gameState.cursor;
    const grid = gameState.grid;
    const colorIdx = c.drawingColorIndex;
    const path = gameState.paths[colorIdx];
    
    // Cannot extend if no path
    if (!path || path.length === 0) return;
    
    const currentHead = path[path.length - 1];
    
    // Check if backtracking (moving to previous cell)
    if (path.length >= 2) {
        const prev = path[path.length - 2];
        if (prev.x === x && prev.y === y) {
            // Backtrack: Remove last segment
            const oldHead = path.pop();
            const cell = grid.getCell(oldHead.x, oldHead.y);
            if (cell.type === CELL_TYPE.PIPE) cell.reset();
            grid.updateConnections();
            return;
        }
    }
    
    const targetCell = grid.getCell(x, y);
    
    // Validation:
    // 1. Cannot cross obstacles or other colors
    if (targetCell.colorIndex !== -1 && targetCell.colorIndex !== colorIdx) return; // Occupied by other
    
    // 2. Cannot cross self (loop), unless backtracking which is handled above
    if (targetCell.colorIndex === colorIdx && targetCell.type === CELL_TYPE.PIPE) {
        // We hit our own pipe.
        // Usually in Flow, this "cuts" the loop.
        // Find index
        const idx = path.findIndex(pt => pt.x === x && pt.y === y);
        if (idx !== -1) {
            // Cut path
            const removed = path.slice(idx + 1);
            gameState.paths[colorIdx] = path.slice(0, idx + 1);
            removed.forEach(pt => {
                const rc = grid.getCell(pt.x, pt.y);
                if (rc.type === CELL_TYPE.PIPE) rc.reset();
            });
            grid.updateConnections();
            return;
        }
    }
    
    // 3. Valid move to EMPTY cell
    if (targetCell.type === CELL_TYPE.EMPTY) {
        targetCell.type = CELL_TYPE.PIPE;
        targetCell.colorIndex = colorIdx;
        path.push({x, y});
        grid.updateConnections();
        return;
    }
    
    // 4. Valid move to TARGET DOT
    if (targetCell.type === CELL_TYPE.DOT && targetCell.colorIndex === colorIdx) {
        // Connected!
        path.push({x, y});
        grid.updateConnections();
        
        // Mark as completed
        if (!gameState.completedColors.includes(colorIdx)) {
            gameState.completedColors.push(colorIdx);
            // Visual effect
            const screenPos = gridToScreen(x, y);
            spawnPulseEffect(screenPos.x, screenPos.y, getColorObj(colorIdx));
        }
        
        // Stop drawing
        c.isDrawing = false;
        c.drawingColorIndex = -1;
        
        checkWinCondition();
    }
}

function checkWinCondition() {
    // 1. All colors connected?
    if (gameState.completedColors.length !== gameState.activeColors.length) return;
    
    // 2. Board full?
    if (!gameState.grid.isFull()) return;
    
    // Win!
    gameState.gamePhase = "GAME_OVER_WIN";
    // Fireworks
    for(let i=0; i<10; i++) {
        setTimeout(() => {
            spawnPulseEffect(
                Math.random() * 600, 
                Math.random() * 400, 
                getColorObj(Math.floor(Math.random() * gameState.activeColors.length))
            );
        }, i * 200);
    }
}

// Helper to convert grid coord to screen coord for effects (Duplicate of render logic, simplified)
import { GRID_OFFSET_X, GRID_OFFSET_Y, GRID_SIZE_PX } from './globals.js';
function gridToScreen(gx, gy) {
    const cellSize = GRID_SIZE_PX / gameState.gridWidth;
    return {
        x: GRID_OFFSET_X + gx * cellSize + cellSize/2,
        y: GRID_OFFSET_Y + gy * cellSize + cellSize/2
    };
}