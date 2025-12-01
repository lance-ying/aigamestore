// automated_test.js
// Logic for automated testing bots

import { gameState, CANVAS_HEIGHT, TILE_SIZE, CANVAS_WIDTH } from './globals.js';
import { KEYS } from './input.js';
import { raycast } from './physics.js';

export function updateAutomatedTest(p) {
    if (gameState.controlMode === 'HUMAN') return;

    // Reset keys first
    gameState.keys[KEYS.SPACE] = false;
    gameState.keys[KEYS.Z] = false;
    gameState.keys[KEYS.DOWN] = false;

    if (gameState.controlMode === 'TEST_1') {
        runSmartAI(p);
    } else if (gameState.controlMode === 'TEST_2') {
        runRandomAI(p);
    }
}

function runSmartAI(p) {
    const player = gameState.player;
    if (!player) return;

    // Look ahead logic
    const lookAheadDist = 120;
    
    // Check for ground immediately ahead
    // We cast a ray downwards slightly ahead of the player
    const groundCheck1 = raycast(player.x + 40, player.y, 0, 1, CANVAS_HEIGHT, gameState.platforms);
    // Further ahead
    const groundCheck2 = raycast(player.x + lookAheadDist, player.y, 0, 1, CANVAS_HEIGHT, gameState.platforms);
    
    // Check for wall ahead
    const wallCheck = raycast(player.x, player.y + player.height/2, 1, 0, 60, gameState.platforms);
    
    // Check for enemies
    let enemyAhead = false;
    for (let e of gameState.entities) {
        if (e.constructor.name === "Enemy" && e.active) {
            const dx = e.x - player.x;
            if (dx > 0 && dx < lookAheadDist && Math.abs(e.y - player.y) < 50) {
                enemyAhead = true;
                break;
            }
        }
    }
    
    // Decision Making
    
    // If Pit ahead or Enemy ahead -> Jump
    // Note: groundCheck returns true if it hits ground. So !groundCheck means pit.
    // However, the raycast implementation in physics.js returns true if hit.
    // We need to check if there is a platform BELOW the point ahead.
    
    // Improve pit detection: check specific point below player projected position
    const pitAhead = !isSolidAt(player.x + 60, player.y + player.height + 10) || 
                     !isSolidAt(player.x + 100, player.y + player.height + 10);

    if (pitAhead || enemyAhead || wallCheck) {
        gameState.keys[KEYS.SPACE] = true;
    }
    
    // If Wall Sliding, definitely jump
    if (player.isWallSliding) {
        gameState.keys[KEYS.SPACE] = true;
    }
    
    // If in air and huge gap, spin
    if (!player.onGround && pitAhead) {
        gameState.keys[KEYS.Z] = true;
    }
}

function isSolidAt(x, y) {
    // Simple point check against platforms
    for (let p of gameState.platforms) {
        if (x >= p.x && x <= p.x + p.width &&
            y >= p.y && y <= p.y + p.height) {
            return true;
        }
    }
    return false;
}

function runRandomAI(p) {
    // Chaos mode
    if (p.random() < 0.05) gameState.keys[KEYS.SPACE] = true;
    if (p.random() < 0.02) gameState.keys[KEYS.Z] = true;
    if (p.random() < 0.02) gameState.keys[KEYS.DOWN] = true;
}

// Expose setControlMode for HTML buttons
window.setControlMode = function(mode) {
    gameState.controlMode = mode;
    console.log("Control Mode set to:", mode);
    // Restart game to apply clean state for test
    if (window.gameInstance) {
        const p = window.gameInstance;
        // Trigger restart logic via key simulation or direct call
        gameState.gamePhase = "START"; // Soft reset
    }
};