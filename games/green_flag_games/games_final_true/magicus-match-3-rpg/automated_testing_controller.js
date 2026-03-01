import { gameState, GRID_COLS, GRID_ROWS } from './globals.js';

let lastActionFrame = 0;
let actionQueue = [];

export function get_automated_testing_action(gs) {
    if (gs.frameCount - lastActionFrame < 15) return null; // Delay between actions
    lastActionFrame = gs.frameCount;

    // Handle Start Screen
    if (gs.gamePhase === "START") {
        return { keyCode: 13 }; // Enter
    }
    
    // Handle Game Over
    if (gs.gamePhase === "GAME_OVER_WIN" || gs.gamePhase === "GAME_OVER_LOSE") {
        return null; // Stop
    }

    // If queue has actions, perform them
    if (actionQueue.length > 0) {
        return actionQueue.shift();
    }

    if (gs.turnState !== "PLAYER_INPUT") return null;

    // Strategy: Find valid match
    const move = findBestMove();
    if (move) {
        // Generate key sequence to perform move
        generateMoveActions(move);
        if (actionQueue.length > 0) {
            return actionQueue.shift();
        }
    }

    return null;
}

function findBestMove() {
    // Brute force check all horizontal swaps
    for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS - 1; c++) {
            if (checkSwapResults(c, r, c + 1, r)) {
                return { from: {c, r}, to: {c: c+1, r} };
            }
        }
    }
    
    // Vertical swaps
    for (let c = 0; c < GRID_COLS; c++) {
        for (let r = 0; r < GRID_ROWS - 1; r++) {
            if (checkSwapResults(c, r, c, r + 1)) {
                return { from: {c, r}, to: {c, r: r+1} };
            }
        }
    }
    
    return null;
}

function checkSwapResults(c1, r1, c2, r2) {
    // Simulate swap
    const t1 = gameState.grid[c1][r1].type;
    const t2 = gameState.grid[c2][r2].type;
    
    // Temporarily swap
    gameState.grid[c1][r1].type = t2;
    gameState.grid[c2][r2].type = t1;
    
    const hasMatch = hasMatchAt(c1, r1) || hasMatchAt(c2, r2);
    
    // Swap back
    gameState.grid[c1][r1].type = t1;
    gameState.grid[c2][r2].type = t2;
    
    return hasMatch;
}

function hasMatchAt(c, r) {
    const type = gameState.grid[c][r].type;
    // Horiz
    let count = 1;
    let i = 1;
    while(c-i >= 0 && gameState.grid[c-i][r].type === type) { count++; i++; }
    i = 1;
    while(c+i < GRID_COLS && gameState.grid[c+i][r].type === type) { count++; i++; }
    if (count >= 3) return true;
    
    // Vert
    count = 1;
    i = 1;
    while(r-i >= 0 && gameState.grid[c][r-i].type === type) { count++; i++; }
    i = 1;
    while(r+i < GRID_ROWS && gameState.grid[c][r+i].type === type) { count++; i++; }
    if (count >= 3) return true;
    
    return false;
}

function generateMoveActions(move) {
    // 1. Navigate to 'from'
    pathTo(move.from.c, move.from.r);
    // 2. Select
    actionQueue.push({ keyCode: 90 }); // Z
    // 3. Navigate to 'to'
    pathTo(move.to.c, move.to.r);
    // 4. Confirm
    actionQueue.push({ keyCode: 90 }); // Z
}

function pathTo(tc, tr) {
    const cc = gameState.cursor.c;
    const cr = gameState.cursor.r;
    
    // X diff
    const dx = tc - cc;
    for(let i=0; i<Math.abs(dx); i++) {
        actionQueue.push({ keyCode: dx > 0 ? 39 : 37 });
    }
    
    // Y diff
    const dy = tr - cr;
    for(let i=0; i<Math.abs(dy); i++) {
        actionQueue.push({ keyCode: dy > 0 ? 40 : 38 });
    }
    
    // Update predicted cursor state for pathfinding consistency in same batch
    gameState.cursor.c = tc;
    gameState.cursor.r = tr;
}

window.get_automated_testing_action = get_automated_testing_action;