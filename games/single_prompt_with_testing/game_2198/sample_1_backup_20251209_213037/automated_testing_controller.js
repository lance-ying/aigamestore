/**
 * automated_testing_controller.js
 * Logic for AI agents used in testing.
 */

import { TILE_SIZE } from './globals.js';

/**
 * Returns a simulated input object {left, right, jump} based on current state
 */
export function get_automated_testing_action(gameState) {
    const player = gameState.player;
    if (!player) return null;

    switch(gameState.controlMode) {
        case "TEST_1": // Monkey Test
            return runMonkeyTest(gameState);
        case "TEST_2": // Heuristic AI
            return runHeuristicAI(gameState);
        case "TEST_3": // Physics Test (Vertical Jump)
            return { left: false, right: false, jump: gameState.frameCount % 60 < 10 };
        default:
            return null;
    }
}

function runMonkeyTest(gameState) {
    // Random chaotic inputs
    // We use a pseudo-random determiner based on frameCount to be somewhat reproducible if seeded, 
    // but here we just want chaos.
    const r = Math.random();
    return {
        right: r > 0.4, // Bias towards moving right
        left: r < 0.1,
        jump: Math.random() > 0.8
    };
}

function runHeuristicAI(gameState) {
    // Scan ahead
    const player = gameState.player;
    const lookAheadDist = 120;
    
    let jumpNeeded = false;
    
    // Check for hazards in front
    const hazardAhead = gameState.hazards.some(h => 
        h.x > player.x && 
        h.x < player.x + lookAheadDist &&
        Math.abs(h.y - player.y) < TILE_SIZE * 2
    );

    // Check for pits (lack of platforms)
    // We check a point in front and below
    const checkX = player.x + TILE_SIZE * 2.5;
    const checkY = player.y + TILE_SIZE + 5;
    const platformUnder = gameState.platforms.some(p => 
        checkX > p.x && checkX < p.x + p.width &&
        checkY > p.y && checkY < p.y + p.height
    );
    
    // Logic
    if (hazardAhead) jumpNeeded = true;
    if (!platformUnder && player.onGround) jumpNeeded = true;
    
    return {
        right: true, // Always run
        left: false,
        jump: jumpNeeded
    };
}

// Expose globally for the example HTML buttons to call
window.setControlMode = function(mode) {
    console.log("Setting control mode to:", mode);
    // We access the exported gameState from globals via window
    const gs = window.getGameState();
    if (gs) {
        gs.controlMode = mode;
        // Visual feedback on buttons is handled in HTML/CSS usually, 
        // but we need to reset game to apply test cleanly
        
        // Optional: Trigger restart to ensure clean test state
        // window.gameInstance.p.keyPressed({keyCode: 82}); // Simulate R press?
        // Better to just let user press R or Enter.
    }
    
    // Update button styles
    document.querySelectorAll('.control-button').forEach(btn => btn.classList.remove('active'));
    if (mode === 'HUMAN') document.getElementById('humanModeBtn').classList.add('active');
    else if (mode === 'TEST_1') document.getElementById('test_1_ModeBtn').classList.add('active');
    else if (mode === 'TEST_2') document.getElementById('test_2_ModeBtn').classList.add('active');
}