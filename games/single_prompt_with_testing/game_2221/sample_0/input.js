/**
 * input.js
 * Handles keyboard input tracking and logging.
 */

import { gameState, KEYS } from './globals.js';

// Internal key state tracking
const keys = {};
const keyPressFrame = {}; // Track which frame a key was pressed to prevent holding trigger

export function initInput(p) {
    p.keyPressed = function() {
        keys[p.keyCode] = true;
        keyPressFrame[p.keyCode] = p.frameCount;
        
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

        // Global Phase Transitions
        if (p.keyCode === KEYS.ENTER) {
            if (gameState.gamePhase === "START") {
                gameState.gamePhase = "PLAYING";
                logGameInfo(p, "Phase changed to PLAYING");
            }
        }
        
        if (p.keyCode === KEYS.ESC) {
            if (gameState.gamePhase === "PLAYING") {
                gameState.gamePhase = "PAUSED";
            } else if (gameState.gamePhase === "PAUSED") {
                gameState.gamePhase = "PLAYING";
            }
        }
        
        if (p.keyCode === KEYS.R) {
            if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
                // Signal to main game loop to reset
                gameState._shouldReset = true; 
            }
        }
    };

    p.keyReleased = function() {
        keys[p.keyCode] = false;
        
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

export function isKeyDown(keyCode) {
    return !!keys[keyCode];
}

export function isKeyPressed(keyCode) {
    // Returns true only on the frame the key was pressed
    return keys[keyCode] && keyPressFrame[keyCode] === gameState.frameCount;
}

function logGameInfo(p, message) {
    if (p.logs) {
        p.logs.game_info.push({
            message: message,
            frame: p.frameCount,
            timestamp: Date.now()
        });
    }
}