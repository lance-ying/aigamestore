// input.js - Input handling and control management

import { gameState, KEY_LEFT, KEY_UP, KEY_RIGHT, KEY_DOWN, KEY_SPACE, 
         KEY_SHIFT, KEY_Z, KEY_ENTER, KEY_ESC, KEY_R } from './globals.js';

// ============================================================================
// INPUT STATE
// ============================================================================

export const inputState = {
    keys: {},
    prevKeys: {},
    mouseX: 0,
    mouseY: 0
};

// ============================================================================
// KEY PRESS HANDLER
// ============================================================================

export function handleKeyPress(p) {
    inputState.keys[p.keyCode] = true;
    
    // Log input
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: gameState.frameCount,
            timestamp: Date.now()
        });
    }
    
    // Handle game phase controls
    if (p.keyCode === KEY_ENTER) {
        if (gameState.gamePhase === "START") {
            startGame(p);
        }
    }
    
    if (p.keyCode === KEY_ESC) {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
            logPhaseChange(p, "PAUSED");
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
            logPhaseChange(p, "PLAYING");
        }
    }
    
    if (p.keyCode === KEY_R) {
        if (gameState.gamePhase === "GAME_OVER_WIN" || 
            gameState.gamePhase === "GAME_OVER_LOSE") {
            resetGame(p);
        }
    }
    
    // Handle gameplay controls
    if (gameState.gamePhase === "PLAYING") {
        if (p.keyCode === KEY_SPACE && gameState.player) {
            gameState.player.honk(p);
        }
    }
}

// ============================================================================
// KEY RELEASE HANDLER
// ============================================================================

export function handleKeyRelease(p) {
    inputState.keys[p.keyCode] = false;
    
    // Log input
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            input_type: 'keyReleased',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: gameState.frameCount,
            timestamp: Date.now()
        });
    }
}

// ============================================================================
// GAME STATE MANAGEMENT
// ============================================================================

function startGame(p) {
    gameState.gamePhase = "PLAYING";
    logPhaseChange(p, "PLAYING");
    
    // Initialize game if needed
    if (!gameState.player) {
        const { initializeGame } = require('./game.js');
        initializeGame(p);
    }
}

function resetGame(p) {
    // Clear all entities
    gameState.entities = [];
    gameState.villagers = [];
    gameState.items = [];
    gameState.obstacles = [];
    gameState.particles = [];
    gameState.honkEffects = [];
    gameState.tasks = [];
    
    // Reset state
    gameState.player = null;
    gameState.score = 0;
    gameState.tasksCompleted = 0;
    gameState.cameraX = 0;
    gameState.cameraY = 0;
    
    // Return to start
    gameState.gamePhase = "START";
    logPhaseChange(p, "START");
}

function logPhaseChange(p, newPhase) {
    if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
            data: { gamePhase: newPhase },
            framecount: gameState.frameCount,
            timestamp: Date.now()
        });
    }
}

// ============================================================================
// INPUT UTILITIES
// ============================================================================

export function isKeyPressed(keyCode) {
    return inputState.keys[keyCode] === true;
}

export function wasKeyJustPressed(keyCode) {
    return inputState.keys[keyCode] === true && inputState.prevKeys[keyCode] !== true;
}

export function updatePreviousKeys() {
    inputState.prevKeys = { ...inputState.keys };
}

// ============================================================================
// AUTOMATED TESTING
// ============================================================================

export function applyAutomatedControl(p) {
    if (gameState.controlMode === "HUMAN") {
        return;
    }
    
    const action = window.get_automated_testing_action?.(gameState);
    if (!action) return;
    
    // Simulate key press
    if (action.keyCode) {
        inputState.keys[action.keyCode] = true;
        
        // Auto-release after one frame
        setTimeout(() => {
            inputState.keys[action.keyCode] = false;
        }, 50);
    }
}

// Expose input state to gameState
gameState.keys = inputState.keys;