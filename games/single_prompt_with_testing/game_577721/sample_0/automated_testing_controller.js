/**
 * Automated Testing Controller
 * Provides input actions for automated test scenarios.
 */

import { CANVAS_WIDTH } from './globals.js';

/**
 * Main testing hook
 */
export function get_automated_testing_action(gameState) {
    if (!gameState.player) return null;

    if (gameState.controlMode === 'TEST_1') {
        return runTest1(gameState);
    } else if (gameState.controlMode === 'TEST_2') {
        return runTest2(gameState);
    }
    return null;
}

// TEST 1: Survival / Random
// Just move back and forth and shoot
let test1Dir = 1;
function runTest1(gameState) {
    const player = gameState.player;
    
    // Change direction at edges
    if (player.x > CANVAS_WIDTH - 50) test1Dir = -1;
    if (player.x < 50) test1Dir = 1;

    const keys = [32]; // Always hold space
    
    if (test1Dir === 1) keys.push(39); // Right
    else keys.push(37); // Left
    
    return { keys };
}

// TEST 2: Optimization
// Find best gate and aim for it
function runTest2(gameState) {
    const player = gameState.player;
    const keys = [32]; // Always shoot

    // Find best target
    let targetX = CANVAS_WIDTH / 2;
    let maxScore = -1;

    // Evaluate gates
    gameState.gates.forEach(gate => {
        // Only care if gate is reachable (above player)
        if (gate.y < player.y) {
            let score = 0;
            if (gate.op === 'MULT') score = gate.value * 10;
            else score = gate.value;
            
            // Prioritize gates lower down (closer)
            score += gate.y * 0.01;

            if (score > maxScore) {
                maxScore = score;
                targetX = gate.x + gate.width/2;
            }
        }
    });

    // If no gates, aim at enemy base or clusters of enemies
    if (maxScore === -1 && gameState.enemyBase) {
        targetX = gameState.enemyBase.x;
    }

    // Move towards target
    if (Math.abs(player.x - targetX) > 5) {
        if (player.x < targetX) keys.push(39);
        else keys.push(37);
    }

    return { keys };
}

window.get_automated_testing_action = get_automated_testing_action;