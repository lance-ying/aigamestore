import { gameState, PHASE_PLAYING, PHASE_START, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';

// Key codes
const KEY_ENTER = 13;
const KEY_ESC = 27;
const KEY_R = 82;
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_Z = 90;
const KEY_SPACE = 32;
const KEY_SHIFT = 16;

const keys = {};

export function handleKeyDown(p, keyCode) {
    keys[keyCode] = true;
    
    // Log input
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            input_type: 'keyPressed',
            data: { keyCode: keyCode, key: p.key },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }

    // Phase transitions
    if (keyCode === KEY_ENTER) {
        if (gameState.gamePhase === PHASE_START) {
            gameState.gamePhase = PHASE_PLAYING;
            resetGame(p);
        }
    }
    
    if (keyCode === KEY_ESC) {
        if (gameState.gamePhase === PHASE_PLAYING) {
            gameState.gamePhase = PHASE_PAUSED;
        } else if (gameState.gamePhase === PHASE_PAUSED) {
            gameState.gamePhase = PHASE_PLAYING;
        }
    }
    
    if (keyCode === KEY_R) {
        if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
            gameState.gamePhase = PHASE_START;
        }
    }
}

export function handleKeyUp(p, keyCode) {
    keys[keyCode] = false;
    
    if (p.logs && p.logs.inputs) {
        p.logs.inputs.push({
            input_type: 'keyReleased',
            data: { keyCode: keyCode, key: p.key },
            framecount: p.frameCount,
            timestamp: Date.now()
        });
    }
}

export function isKeyDown(keyCode) {
    return !!keys[keyCode];
}

export function getInputVector() {
    let dx = 0;
    let dy = 0;
    
    if (isKeyDown(KEY_LEFT)) dx -= 1;
    if (isKeyDown(KEY_RIGHT)) dx += 1;
    if (isKeyDown(KEY_UP)) dy -= 1;
    if (isKeyDown(KEY_DOWN)) dy += 1;
    
    // Normalize if moving diagonally
    if (dx !== 0 && dy !== 0) {
        const len = Math.sqrt(dx*dx + dy*dy);
        dx /= len;
        dy /= len;
    }
    
    return { x: dx, y: dy };
}

// Helper to reset game from input context (circular dependency avoidance via function injection if needed, 
// but here we will just export a reset function from game.js and import it, or attach to window)
import { resetGame } from './game.js';