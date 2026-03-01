import { gameState, logs } from './globals.js';

// Input State
export const inputState = {
    keys: {},
    axis: {
        x: 0, // -1 (Left) to 1 (Right)
        y: 0  // -1 (Forward/Up) to 1 (Backward/Down)
    },
    brake: false
};

// Input Handling Setup
export function setupInput() {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}

function handleKeyDown(event) {
    const code = event.keyCode;
    inputState.keys[code] = true;
    
    // Logging
    logs.inputs.push({
        input_type: 'keydown',
        data: { key: event.key, keyCode: code },
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
    
    // Global State Controls
    handleGlobalControls(code);
}

function handleKeyUp(event) {
    const code = event.keyCode;
    inputState.keys[code] = false;
    
    logs.inputs.push({
        input_type: 'keyup',
        data: { key: event.key, keyCode: code },
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}

function handleGlobalControls(code) {
    // ENTER - Start Game
    if (code === 13 && gameState.gamePhase === "START") {
        gameState.gamePhase = "PLAYING";
    }
    
    // ESC - Pause / Unpause
    if (code === 27) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }
    
    // R - Restart
    if (code === 82) {
        if (gameState.gamePhase === "GAME_OVER_WIN" || 
            gameState.gamePhase === "GAME_OVER_LOSE" ||
            gameState.gamePhase === "PLAYING") {
            // Signal main loop to reset
            gameState.shouldReset = true;
        }
    }
}

// Update Input Axis per frame
export function updateInput() {
    // Reset axis
    inputState.axis.x = 0;
    inputState.axis.y = 0;
    inputState.brake = false;
    
    // Check Control Mode
    if (gameState.controlMode === 'TEST_1') {
        // Test 1: Auto tilt forward
        inputState.axis.y = -1.0;
        return;
    }
    
    // Human Controls
    // Up / W
    if (inputState.keys[38] || inputState.keys[87]) {
        inputState.axis.y = -1;
    }
    // Down / S
    if (inputState.keys[40] || inputState.keys[83]) {
        inputState.axis.y = 1;
    }
    // Left / A
    if (inputState.keys[37] || inputState.keys[65]) {
        inputState.axis.x = -1;
    }
    // Right / D
    if (inputState.keys[39] || inputState.keys[68]) {
        inputState.axis.x = 1;
    }
    // Space (Brake)
    if (inputState.keys[32]) {
        inputState.brake = true;
    }
}