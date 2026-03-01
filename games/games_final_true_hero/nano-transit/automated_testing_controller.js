/**
 * automated_testing_controller.js
 * Controls automated testing actions based on gameState.
 */

import { gameState, GAME_PHASES, SHAPES } from './globals.js';
import { distance } from './utils.js';

let step = 0;
let waitTimer = 0;

export function get_automated_testing_action(gameState) {
    const mode = gameState.controlMode;
    
    // Always start game if in Start Screen
    if (gameState.gamePhase === GAME_PHASES.START) {
        return { keyCode: 13 }; // ENTER
    }
    
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return null;

    if (mode === "TEST_1") {
        // Basic Connection Test
        // 1. Move to Station 0
        // 2. Press Space
        // 3. Move to Station 1
        // 4. Press Space
        return runConnectionTest(gameState);
    } 
    else if (mode === "TEST_2") {
        // Win/Play Strategy
        return runAutoPlayStrategy(gameState);
    }

    return null;
}

function runConnectionTest(state) {
    const stations = state.stations;
    if (stations.length < 2) return null;
    
    const targetA = stations[0];
    const targetB = stations[1];
    
    // Simple state machine via static vars or checking state
    // Check if line 0 has station 0
    const line = state.lines[0];
    const hasA = line.stations.includes(targetA);
    const hasB = line.stations.includes(targetB);
    
    const cursor = state.cursor;
    
    if (!hasA) {
        // Move to A
        if (distance(cursor.x, cursor.y, targetA.x, targetA.y) > 5) {
            return moveTowards(cursor, targetA);
        } else {
            return { keyCode: 32 }; // Space
        }
    } else if (!hasB) {
        // Move to B
        if (distance(cursor.x, cursor.y, targetB.x, targetB.y) > 5) {
            return moveTowards(cursor, targetB);
        } else {
            return { keyCode: 32 }; // Space
        }
    }
    
    return null; // Test done
}

function runAutoPlayStrategy(state) {
    // Primitive AI: 
    // Find nearest unconnected station to any existing line endpoint
    // If no lines, start one.
    
    // Just connect random stations for simulation
    const stations = state.stations;
    if (stations.length === 0) return null;

    const cursor = state.cursor;
    
    // Pick a target station based on step counter (mocking state)
    // In real implementation, this would need a persistent AI state
    const targetIdx = Math.floor((Date.now() / 2000) % stations.length);
    const target = stations[targetIdx];
    
    if (distance(cursor.x, cursor.y, target.x, target.y) > 10) {
        return moveTowards(cursor, target);
    } else {
        // Press space occasionally
        if (Math.random() < 0.1) return { keyCode: 32 };
    }
    
    return null;
}

function moveTowards(cursor, target) {
    const dx = target.x - cursor.x;
    const dy = target.y - cursor.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? { keyCode: 39 } : { keyCode: 37 };
    } else {
        return dy > 0 ? { keyCode: 40 } : { keyCode: 38 };
    }
}