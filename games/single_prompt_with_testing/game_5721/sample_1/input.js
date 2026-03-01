/**
 * Handles keyboard input and updates global input state.
 * Also handles automated testing inputs.
 */

import { gameState } from './globals.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Key Codes
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_SPACE = 32;
const KEY_SHIFT = 16;
const KEY_Z = 90;
const KEY_ENTER = 13;
const KEY_ESC = 27;
const KEY_R = 82;

const activeKeys = {};

export function initInput(p) {
    p.keyPressed = function() {
        activeKeys[p.keyCode] = true;
        
        // Phase transition logic specifically for instant actions
        if (p.keyCode === KEY_ENTER) {
            if (gameState.gamePhase === "START") {
                gameState.gamePhase = "PLAYING";
                logGameInfo(p, "Phase Change: PLAYING");
            }
        }
        
        if (p.keyCode === KEY_ESC) {
            if (gameState.gamePhase === "PLAYING") {
                gameState.gamePhase = "PAUSED";
                logGameInfo(p, "Phase Change: PAUSED");
            } else if (gameState.gamePhase === "PAUSED") {
                gameState.gamePhase = "PLAYING";
                logGameInfo(p, "Phase Change: PLAYING");
            }
        }
        
        if (p.keyCode === KEY_R) {
            if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE" || gameState.gamePhase === "PAUSED") {
                // Signal to main game loop to reset
                gameState.inputs.restart = true;
            }
        }
        
        // Log input
        if (p.logs) {
            p.logs.inputs.push({
                type: 'press',
                key: p.key,
                keyCode: p.keyCode,
                frame: p.frameCount,
                timestamp: Date.now()
            });
        }
    };
    
    p.keyReleased = function() {
        activeKeys[p.keyCode] = false;
        
        if (p.logs) {
            p.logs.inputs.push({
                type: 'release',
                key: p.key,
                keyCode: p.keyCode,
                frame: p.frameCount,
                timestamp: Date.now()
            });
        }
    };
}

function logGameInfo(p, message) {
    if (p.logs && p.logs.game_info) {
        p.logs.game_info.push({
            message: message,
            frame: p.frameCount,
            timestamp: Date.now()
        });
    }
}

/**
 * Called every frame to update the continuous input state in gameState
 */
export function updateInput() {
    // Reset transient flags
    gameState.inputs.restart = false;
    
    // 1. Handle Human Input
    if (gameState.controlMode === "HUMAN") {
        gameState.inputs.left = activeKeys[KEY_LEFT];
        gameState.inputs.right = activeKeys[KEY_RIGHT];
        gameState.inputs.up = activeKeys[KEY_UP];
        gameState.inputs.down = activeKeys[KEY_DOWN];
        gameState.inputs.jump = activeKeys[KEY_SPACE]; // Note: Jumping logic might need edge trigger in Player class
        gameState.inputs.brake = activeKeys[KEY_SHIFT];
        gameState.inputs.boost = activeKeys[KEY_Z];
        gameState.inputs.start = activeKeys[KEY_ENTER];
        gameState.inputs.pause = activeKeys[KEY_ESC];
        gameState.inputs.restart = activeKeys[KEY_R];
    } 
    // 2. Handle Automated Input
    else {
        // Reset all first
        gameState.inputs.left = false;
        gameState.inputs.right = false;
        gameState.inputs.jump = false;
        gameState.inputs.brake = false;
        gameState.inputs.boost = false;
        
        const action = get_automated_testing_action(gameState);
        if (action) {
            // Action can be a single key code or an object of flags
            if (action.left) gameState.inputs.left = true;
            if (action.right) gameState.inputs.right = true;
            if (action.jump) gameState.inputs.jump = true;
            if (action.brake) gameState.inputs.brake = true;
            if (action.boost) gameState.inputs.boost = true;
            
            // Handle restart via bot if game over
            if ((gameState.gamePhase.startsWith("GAME_OVER")) && Math.random() < 0.05) {
                gameState.inputs.restart = true;
            }
             // Handle start via bot
            if (gameState.gamePhase === "START") {
                gameState.inputs.start = true;
                // Force state change here as key press event might be missed
                gameState.gamePhase = "PLAYING"; 
            }
        }
    }
}