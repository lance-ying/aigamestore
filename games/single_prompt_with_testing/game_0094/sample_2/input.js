// input.js
import { gameState, PLANT_KEYS, GRID_COLS, GRID_ROWS } from './globals.js';
import { handlePlanting, handleShovel } from './logic.js';

export function handleInput(p, keyCode, simulated = false) {
    if (gameState.gamePhase !== "PLAYING") return;
    
    // Log input with size limit
    if (p.addLog && !simulated) {
        p.addLog("inputs", {
            input_type: 'keyCode',
            data: { keyCode: keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }

    // Cursor Movement
    if (keyCode === p.LEFT_ARROW || keyCode === 37) {
        gameState.cursor.col = Math.max(0, gameState.cursor.col - 1);
    } else if (keyCode === p.RIGHT_ARROW || keyCode === 39) {
        gameState.cursor.col = Math.min(GRID_COLS - 1, gameState.cursor.col + 1);
    } else if (keyCode === p.UP_ARROW || keyCode === 38) {
        gameState.cursor.row = Math.max(0, gameState.cursor.row - 1);
    } else if (keyCode === p.DOWN_ARROW || keyCode === 40) {
        gameState.cursor.row = Math.min(GRID_ROWS - 1, gameState.cursor.row + 1);
    }

    // Cycle Plants (Z)
    if (keyCode === 90) { // Z
        gameState.selectedPlantIndex = (gameState.selectedPlantIndex + 1) % PLANT_KEYS.length;
    }

    // Action (Space)
    if (keyCode === 32) { // SPACE
        // Check for SHIFT key for Shovel mode
        // p5 keyIsDown(16) checks Shift
        if (p.keyIsDown && p.keyIsDown(16)) {
            handleShovel();
        } else {
            handlePlanting();
        }
        
        // Also check if we can collect any sun at current cursor (manual collect override)
        // This logic is also in Sun.update, but pressing Space ensures collection feels responsive
        // We'll iterate suns
        /* 
        NOTE: Sun collection logic is proximity based in update loop, 
        but explicit action can trigger it too if we wanted. 
        For now, let's keep it proximity based on cursor pos.
        */
    }
}