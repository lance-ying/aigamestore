import { gameState, TOWER_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

let testState = {
    step: 0,
    timer: 0,
    initialized: false
};

export function get_automated_testing_action() {
    if (!testState.initialized) {
        testState.initialized = true;
        testState.step = 0;
        testState.timer = 0;
    }
    
    testState.timer++;
    
    switch (gameState.controlMode) {
        case "TEST_1": // Win strategy
            return runTest1Strategy();
        case "TEST_2": // Random inputs
            return runTest2Random();
        default:
            return null;
    }
}

function runTest1Strategy() {
    // Strategy:
    // 0. Wait for start
    // 1. Move cursor to (100, 150) - good spot near start
    // 2. Build Dart Monkey
    // 3. Start Wave
    // 4. Wait for money, then upgrade
    
    const targetX = 100;
    const targetY = 150;
    
    if (gameState.gamePhase === "START") {
        return { keyCode: 13 }; // Enter to start
    }
    
    if (gameState.gamePhase === "PLAYING") {
        // Simple state machine
        
        // 1. Move Cursor
        const dx = targetX - gameState.cursor.x;
        const dy = targetY - gameState.cursor.y;
        
        if (Math.abs(dx) > 5) return { keyCode: dx > 0 ? 39 : 37 };
        if (Math.abs(dy) > 5) return { keyCode: dy > 0 ? 40 : 38 };
        
        // 2. Build if not built (check tower count)
        if (gameState.towers.length === 0) {
            // Ensure Dart Monkey selected (default)
            if (gameState.money >= 200) return { keyCode: 32 }; // Space
        }
        
        // 3. Start wave if idle
        if (!gameState.waveActive && gameState.towers.length > 0) {
            return { keyCode: 13 };
        }
        
        // 4. Upgrade if tower exists and we have money
        if (gameState.towers.length > 0) {
            // Select tower if not selected
            if (!gameState.selectedTower) {
                 return { keyCode: 32 }; // Space (at cursor loc)
            } else {
                // Upgrade
                 if (gameState.money > 200) return { keyCode: 16 }; // Shift
            }
        }
    }
    
    return null;
}

function runTest2Random() {
    if (gameState.gamePhase === "START") return { keyCode: 13 };
    
    // Randomly spam keys
    const keys = [37, 38, 39, 40, 32, 90, 16, 13];
    if (Math.random() < 0.2) { // 20% chance to press key per frame
        const key = keys[Math.floor(Math.random() * keys.length)];
        return { keyCode: key };
    }
    return null;
}