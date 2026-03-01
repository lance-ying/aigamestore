import { gameState } from './globals.js';
import { CELL_TYPE } from './grid.js';

// Controller for automated testing
export function get_automated_testing_action() {
    if (!gameState) return null;
    
    // Only run if control mode is set
    if (gameState.controlMode === "TEST_1") {
        return runRandomTest();
    } else if (gameState.controlMode === "TEST_2") {
        return runSolutionTest();
    }
    
    return null;
}

// TEST 1: Random Inputs
function runRandomTest() {
    // 5% chance to press R
    if (Math.random() < 0.005) return { keyCode: 82 };
    
    // 10% chance to press Space
    if (Math.random() < 0.1) return { keyCode: 32 };
    
    // Movement
    const moves = [37, 38, 39, 40];
    return { keyCode: moves[Math.floor(Math.random() * moves.length)] };
}

// TEST 2: Solve the puzzle
// State machine for bot
let botState = {
    step: 0,
    colorIndex: 0,
    pathIndex: 0,
    waiting: 0
};

function runSolutionTest() {
    if (gameState.gamePhase === "START" || gameState.gamePhase === "GAME_OVER_WIN") {
        return { keyCode: 13 }; // Press Enter
    }
    
    if (gameState.gamePhase !== "PLAYING") return null;
    
    // Reset bot state if level changed
    if (gameState.completedColors.length === 0 && botState.colorIndex >= gameState.activeColors.length) {
        botState = { step: 0, colorIndex: 0, pathIndex: 0, waiting: 0 };
    }

    // Delay for visualization
    if (botState.waiting > 0) {
        botState.waiting--;
        return null;
    }
    botState.waiting = 2; // Move every 3 frames

    const colorIdx = botState.colorIndex;
    
    // If we have done all colors
    if (colorIdx >= gameState.activeColors.length) {
        return null; 
    }
    
    const solutionPath = gameState.solutionPaths[colorIdx];
    
    // Phase 1: Move to Start
    if (botState.step === 0) {
        const startPos = solutionPath[0];
        
        // Move towards start
        if (gameState.cursor.x < startPos.x) return { keyCode: 39 };
        if (gameState.cursor.x > startPos.x) return { keyCode: 37 };
        if (gameState.cursor.y < startPos.y) return { keyCode: 40 };
        if (gameState.cursor.y > startPos.y) return { keyCode: 38 };
        
        // At start position
        botState.step = 1;
        return { keyCode: 32 }; // Start drawing
    }
    
    // Phase 2: Trace Path
    if (botState.step === 1) {
        botState.pathIndex++;
        
        // If we reached end of path
        if (botState.pathIndex >= solutionPath.length) {
            botState.step = 0;
            botState.pathIndex = 0;
            botState.colorIndex++;
            return { keyCode: 32 }; // Stop drawing (though auto-stop usually happens)
        }
        
        const target = solutionPath[botState.pathIndex];
        
        if (target.x > gameState.cursor.x) return { keyCode: 39 };
        if (target.x < gameState.cursor.x) return { keyCode: 37 };
        if (target.y > gameState.cursor.y) return { keyCode: 40 };
        if (target.y < gameState.cursor.y) return { keyCode: 38 };
    }
    
    return null;
}

window.get_automated_testing_action = get_automated_testing_action;