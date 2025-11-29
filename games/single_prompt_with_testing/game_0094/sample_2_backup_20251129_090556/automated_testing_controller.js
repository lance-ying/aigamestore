// automated_testing_controller.js
import { gameState, PLANT_TYPES, GRID_COLS, GRID_ROWS } from './globals.js';

// State machine for the test bot
let botState = {
    actionQueue: [],
    lastCheck: 0,
    targetSun: null,
    targetLane: null
};

function getGridContent(col, row) {
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return null;
    return gameState.grid[col][row];
}

// Simple pathfinding to a target (col, row)
function moveTowards(targetCol, targetRow) {
    const dCol = targetCol - gameState.cursor.col;
    const dRow = targetRow - gameState.cursor.row;
    
    if (dCol > 0) return 39; // Right
    if (dCol < 0) return 37; // Left
    if (dRow > 0) return 40; // Down
    if (dRow < 0) return 38; // Up
    return null;
}

function getTest1Action() {
    // 1. Collect Sun (Priority)
    if (gameState.suns.length > 0) {
        // Find uncollected sun
        const sun = gameState.suns.find(s => !s.collected);
        if (sun) {
            // Map sun pixel to grid
            const gridCol = Math.floor((sun.x - 20) / ((600-40)/9));
            const gridRow = Math.floor((sun.y - 60) / ((400-70)/5));
            
            // Clamp
            const safeCol = Math.max(0, Math.min(GRID_COLS-1, gridCol));
            const safeRow = Math.max(0, Math.min(GRID_ROWS-1, gridRow));
            
            // Check if we are there
            if (gameState.cursor.col === safeCol && gameState.cursor.row === safeRow) {
                return 32; // Space to "collect" (though proximity handles it, space is good)
            }
            const move = moveTowards(safeCol, safeRow);
            if (move) return move;
        }
    }

    // 2. Select Plant Logic
    // Desired: Sunflower in Col 0, Peashooter in Col 1+
    
    // Check Col 0 for empty spots
    for(let r=0; r<GRID_ROWS; r++) {
        if (!getGridContent(0, r)) {
            // Need sunflower
            if (gameState.selectedPlantIndex !== 0) return 90; // Cycle 'Z' to Sunflower (index 0)
            
            // If we have sun, go there
            if (gameState.sun >= 50) {
                if (gameState.cursor.col === 0 && gameState.cursor.row === r) {
                    return 32; // Plant
                }
                const move = moveTowards(0, r);
                if (move) return move;
            }
        }
    }
    
    // Check lanes with zombies for Peashooters
    // Simple strategy: fill Col 1, then Col 2
    for(let c=1; c<3; c++) {
        for(let r=0; r<GRID_ROWS; r++) {
            if (!getGridContent(c, r)) {
                 // Need peashooter
                if (gameState.selectedPlantIndex !== 1) return 90; // Cycle 'Z' to Peashooter (index 1)
                
                 if (gameState.sun >= 100) {
                    if (gameState.cursor.col === c && gameState.cursor.row === r) {
                        return 32; // Plant
                    }
                    const move = moveTowards(c, r);
                    if (move) return move;
                }
            }
        }
    }
    
    return null;
}

export function get_automated_testing_action(gs) {
    if (gs.gamePhase !== "PLAYING") return null;

    if (gs.controlMode === "TEST_1") {
        const keyCode = getTest1Action();
        if (keyCode) return { keyCode };
    }
    
    if (gs.controlMode === "TEST_3") {
         // Plant Wallnut in front of zombie
         if (gs.zombies.length > 0) {
             const zombie = gs.zombies[0];
             const targetRow = zombie.row;
             const targetCol = 7; // front-ish
             
             if (gs.selectedPlantIndex !== 2) return { keyCode: 90 }; // Cycle to Wallnut
             
             if (gs.sun >= 50 && !getGridContent(targetCol, targetRow)) {
                  if (gs.cursor.col === targetCol && gs.cursor.row === targetRow) {
                      return { keyCode: 32 };
                  }
                  const move = moveTowards(targetCol, targetRow);
                  if (move) return { keyCode: move };
             }
         }
    }

    return null;
}