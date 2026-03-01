/**
 * testing.js
 * Implements automated testing controllers.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { checkRectCollision } from './physics.js';

/**
 * Returns the desired input action based on the current testing mode.
 * @param {object} gameState 
 * @returns {object|null} { jump: boolean }
 */
export function get_automated_testing_action(gameState) {
    if (gameState.controlMode === 'TEST_1') {
        return runTest1(gameState);
    } else if (gameState.controlMode === 'TEST_2') {
        return runTest2(gameState);
    }
    return null;
}

// TEST 1: Blind Jumper
// Jumps every 60 frames (1 second)
function runTest1(gameState) {
    if (gameState.frameCount % 60 === 0) {
        return { jump: true };
    }
    return null;
}

// TEST 2: Intelligent Agent
// Uses raycasting/lookahead to avoid obstacles
function runTest2(gameState) {
    const player = gameState.player;
    if (!player) return null;

    // Parameters
    const lookAheadDistance = 200; // How far to scan
    const jumpThreshold = 80;      // Jump when obstacle is this close

    // Define a "scanner" rectangle extending from player
    const scanner = {
        x: player.x + player.w,
        y: player.y,
        w: lookAheadDistance,
        h: player.h
    };

    // Check for impending obstacles
    // We filter obstacles that are strictly to the right and overlapping Y
    const threats = gameState.entities.filter(e => {
        // Is it ahead?
        const isAhead = e.x > player.x;
        // Is it within range?
        const isInRange = e.x < player.x + lookAheadDistance;
        // Is it dangerous? (Spike or Vertical Wall)
        // Walls are Blocks where the top is above player bottom
        const isWall = e.type === 'BLOCK' && (e.y < player.y + player.h - 5);
        const isSpike = e.type === 'SPIKE';
        
        return isAhead && isInRange && (isWall || isSpike);
    });
    
    // Also check for pits (gaps in floor)
    // We scan floor level at a few points ahead
    let pitDetected = false;
    const groundY = CANVAS_HEIGHT - 50;
    
    // Check a point shortly ahead where we will land
    const landingCheckX = player.x + 120;
    const hasGround = gameState.entities.some(e => {
        return (e.type === 'FLOOR' || e.type === 'BLOCK') &&
               e.x < landingCheckX && (e.x + e.w) > landingCheckX &&
               e.y >= groundY - 20; // Roughly ground level
    });
    
    if (!hasGround && player.onGround) {
        pitDetected = true;
    }

    if (threats.length > 0) {
        // Find closest threat
        const closest = threats.reduce((prev, curr) => (prev.x < curr.x) ? prev : curr);
        const distance = closest.x - (player.x + player.w);
        
        if (distance < jumpThreshold) {
            return { jump: true };
        }
    }
    
    if (pitDetected) {
         return { jump: true };
    }

    return null;
}

// Expose globally for the test runner if needed
window.get_automated_testing_action = get_automated_testing_action;