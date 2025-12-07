// input.js - Input handling
import { gameState } from './globals.js';
import { resetGameState } from './globals.js';
import { loadLevel } from './level.js';

export const keys = {};

export function handleInput(p) {
    // Only process inputs in PLAYING phase
    if (gameState.gamePhase !== "PLAYING") return;

    const player = gameState.player;
    if (!player) return;

    let dx = 0;
    
    // Human Controls
    if (gameState.controlMode === "HUMAN") {
        const speed = keys[16] ? 2 : 5; // Shift for slow
        
        if (keys[p.LEFT_ARROW]) {
            player.vx -= 1; // Acceleration feel
            if(player.vx < -speed) player.vx = -speed;
            player.facing = -1;
            dx = -1;
        }
        if (keys[p.RIGHT_ARROW]) {
            player.vx += 1;
            if(player.vx > speed) player.vx = speed;
            player.facing = 1;
            dx = 1;
        }
        
        if (!keys[p.LEFT_ARROW] && !keys[p.RIGHT_ARROW]) {
            // Decel happens in entity update via friction
        }

        if (keys[32]) { // Space
            player.jump();
            // Prevent holding space for rapid fire jumps (optional, but better feel)
            keys[32] = false; 
        }

        if (keys[90]) { // Z
            player.placeBomb();
            keys[90] = false; // Single press
        }
    }
    // Automated modes handled in game loop via automated_test.js
}

export function keyPressed(p) {
    keys[p.keyCode] = true;

    p.logs.inputs.push({
        type: 'press',
        keyCode: p.keyCode,
        frame: p.frameCount,
        time: Date.now()
    });

    // Phase Transitions
    if (p.keyCode === 13) { // ENTER
        if (gameState.gamePhase === "START") {
            gameState.gamePhase = "PLAYING";
            // Start bg music if we had any
        }
    }

    if (p.keyCode === 27) { // ESC
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "PAUSED";
        } else if (gameState.gamePhase === "PAUSED") {
            gameState.gamePhase = "PLAYING";
        }
    }

    if (p.keyCode === 82) { // R
        if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
            resetGameState();
            loadLevel(); // Rebuild level
            gameState.gamePhase = "START";
        }
    }
}

export function keyReleased(p) {
    keys[p.keyCode] = false;
    p.logs.inputs.push({
        type: 'release',
        keyCode: p.keyCode,
        frame: p.frameCount,
        time: Date.now()
    });
}