/**
 * input.js
 * Handles keyboard input, state changes, and cursor movement.
 */

import { gameState, GAME_PHASES, CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { handleStationInteraction, handleLineSwitch, handleDeletion } from './game_logic.js';

// Input State
const keys = {};

export function initInput(p) {
    p.keyPressed = function() {
        keys[p.keyCode] = true;
        
        // Logging
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });

        // Global State Controls
        if (p.keyCode === 13) { // ENTER
            if (gameState.gamePhase === GAME_PHASES.START) {
                gameState.gamePhase = GAME_PHASES.PLAYING;
                p.logs.game_info.push({ event: "GAME_START", timestamp: Date.now() });
            }
        }
        
        if (p.keyCode === 27) { // ESC
            if (gameState.gamePhase === GAME_PHASES.PLAYING) {
                gameState.gamePhase = GAME_PHASES.PAUSED;
            } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
                gameState.gamePhase = GAME_PHASES.PLAYING;
            }
        }
        
        if (p.keyCode === 82) { // R
            if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
                gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
                // Restart logic handled in game.js via signal or direct check
                window.location.reload(); // Simple reload for full reset, or implement soft reset
            }
        }

        // Gameplay Controls
        if (gameState.gamePhase === GAME_PHASES.PLAYING) {
            if (p.keyCode === 90) { // Z
                handleLineSwitch();
            }
            
            if (p.keyCode === 32) { // SPACE
                const isShift = keys[16];
                if (isShift) {
                    handleDeletion();
                } else {
                    handleStationInteraction();
                }
            }
        }
    };

    p.keyReleased = function() {
        keys[p.keyCode] = false;
        
        p.logs.inputs.push({
            input_type: 'keyReleased',
            data: { key: p.key, keyCode: p.keyCode },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    };
}

export function handleInput(p) {
    // Continuous Input Handling (Cursor Movement)
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;

    let dx = 0;
    let dy = 0;
    const speed = CONFIG.CURSOR_SPEED;

    if (keys[37]) dx -= speed; // Left
    if (keys[39]) dx += speed; // Right
    if (keys[38]) dy -= speed; // Up
    if (keys[40]) dy += speed; // Down

    // Diagonal correction
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }

    gameState.cursor.x += dx;
    gameState.cursor.y += dy;

    // Constrain cursor
    gameState.cursor.x = Math.max(0, Math.min(CANVAS_WIDTH, gameState.cursor.x));
    gameState.cursor.y = Math.max(0, Math.min(CANVAS_HEIGHT, gameState.cursor.y));
}

// Helper to check key state externally
export function isKeyDown(keyCode) {
    return !!keys[keyCode];
}