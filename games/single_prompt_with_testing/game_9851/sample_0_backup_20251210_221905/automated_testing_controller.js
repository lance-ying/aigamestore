/**
 * Automated testing logic for "Castle Hammerwatch Lite".
 * Simulates user input based on test scenarios.
 */

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { dist } from './utils.js';

// Key Codes
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_Z = 90;    // Attack
const KEY_SHIFT = 16; // Dash
const KEY_SPACE = 32; // Interact
const KEY_ENTER = 13;

let lastActionFrame = 0;
let currentDirection = null;
let modeState = {
    target: null,
    stuckTimer: 0,
    lastPos: {x:0, y:0}
};

export function get_automated_testing_action(currentState) {
    if (currentState.gamePhase === "START" || currentState.gamePhase === "GAME_OVER_LOSE" || currentState.gamePhase === "GAME_OVER_WIN") {
        // Press Enter to start/restart
        return { keyCode: KEY_ENTER, type: 'press' };
    }

    if (currentState.gamePhase !== "PLAYING") return null;

    switch (currentState.controlMode) {
        case "TEST_1": // Random Wandering / Survival
            return test1_survival(currentState);
        case "TEST_2": // Aggressive / Objective
            return test2_objective(currentState);
        default:
            return null;
    }
}

function test1_survival(state) {
    // Change direction every 30-60 frames
    if (!currentDirection || state.frameCount - lastActionFrame > 45) {
        const dirs = [KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN];
        currentDirection = dirs[Math.floor(Math.random() * dirs.length)];
        lastActionFrame = state.frameCount;
        
        // Occasionally stop
        if (Math.random() < 0.2) currentDirection = null;
    }

    if (currentDirection) {
        return { keyCode: currentDirection, type: 'hold' };
    }
    return null;
}

function test2_objective(state) {
    const player = state.player;
    if (!player) return null;

    // 1. Attack nearby enemies
    let nearestEnemy = null;
    let minDist = 9999;
    
    state.enemies.forEach(e => {
        const d = dist(player.x, player.y, e.x, e.y);
        if (d < minDist) {
            minDist = d;
            nearestEnemy = e;
        }
    });

    if (nearestEnemy && minDist < 150) {
        // Move towards enemy
        if (minDist < 40) {
            // Attack range
            return { keyCode: KEY_Z, type: 'press' };
        } else {
            // Chase
            return getMoveKey(player, nearestEnemy);
        }
    }

    // 2. Collect Keys/Pickups
    if (state.pickups.length > 0) {
        const target = state.pickups[0]; // Just target first one
        return getMoveKey(player, target);
    }
    
    // 3. Find Exit/Door
    // Simplified: Just move right and down generally
    if (Math.random() < 0.5) return { keyCode: KEY_RIGHT, type: 'hold' };
    return { keyCode: KEY_DOWN, type: 'hold' };
}

function getMoveKey(player, target) {
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? { keyCode: KEY_RIGHT, type: 'hold' } : { keyCode: KEY_LEFT, type: 'hold' };
    } else {
        return dy > 0 ? { keyCode: KEY_DOWN, type: 'hold' } : { keyCode: KEY_UP, type: 'hold' };
    }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;