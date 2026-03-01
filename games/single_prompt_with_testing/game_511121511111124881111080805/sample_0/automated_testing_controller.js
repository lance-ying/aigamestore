// automated_testing_controller.js - AI controller for automated testing

import { gameState } from './globals.js';

// ============================================================================
// TEST_1: Basic Movement and Navigation Testing
// ============================================================================

let test1State = {
    phase: 'explore',
    targetZone: 0,
    stuckCounter: 0,
    lastPosition: { x: 0, y: 0 }
};

function getTest1Action() {
    if (!gameState.player) return null;
    
    const zones = [
        { x: 200, y: 200 },  // Garden center
        { x: 600, y: 200 },  // Shops
        { x: 600, y: 600 },  // Village Green
        { x: 200, y: 600 }   // Pond
    ];
    
    const target = zones[test1State.targetZone];
    const dx = target.x - gameState.player.x;
    const dy = target.y - gameState.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check if stuck
    const moved = Math.abs(gameState.player.x - test1State.lastPosition.x) + 
                  Math.abs(gameState.player.y - test1State.lastPosition.y);
    
    if (moved < 1) {
        test1State.stuckCounter++;
    } else {
        test1State.stuckCounter = 0;
    }
    
    test1State.lastPosition = { x: gameState.player.x, y: gameState.player.y };
    
    // If stuck, try different direction
    if (test1State.stuckCounter > 30) {
        test1State.targetZone = (test1State.targetZone + 1) % zones.length;
        test1State.stuckCounter = 0;
    }
    
    // Reached target
    if (distance < 50) {
        test1State.targetZone = (test1State.targetZone + 1) % zones.length;
    }
    
    // Move towards target
    if (Math.abs(dx) > Math.abs(dy)) {
        return { keyCode: dx > 0 ? 39 : 37 }; // Right or Left
    } else {
        return { keyCode: dy > 0 ? 40 : 38 }; // Down or Up
    }
}

// ============================================================================
// TEST_2: Win Strategy - Complete All Tasks
// ============================================================================

let test2State = {
    phase: 'collect',
    targetItemIndex: 0,
    targetTaskIndex: 0,
    hasItem: false,
    stuckTimer: 0,
    lastPosition: { x: 0, y: 0 }
};

function getTest2Action() {
    if (!gameState.player) return null;
    
    // Check if we won
    if (gameState.gamePhase === "GAME_OVER_WIN") {
        return null;
    }
    
    // Get next incomplete task
    const incompleteTasks = gameState.tasks.filter(t => !t.completed);
    if (incompleteTasks.length === 0) return null;
    
    const currentTask = incompleteTasks[0];
    
    // Find the item for this task
    const taskItem = gameState.items.find(item => 
        item.type === currentTask.itemType && !item.pickedUp
    );
    
    if (!taskItem) return null;
    
    // Check if carrying item
    const isCarrying = gameState.player.carrying !== null;
    
    // Determine target
    let targetX, targetY;
    
    if (!isCarrying) {
        // Go to item
        targetX = taskItem.x;
        targetY = taskItem.y;
    } else {
        // Go to task target
        targetX = currentTask.targetX;
        targetY = currentTask.targetY;
    }
    
    const dx = targetX - gameState.player.x;
    const dy = targetY - gameState.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check if stuck
    const moved = Math.abs(gameState.player.x - test2State.lastPosition.x) + 
                  Math.abs(gameState.player.y - test2State.lastPosition.y);
    
    if (moved < 0.5) {
        test2State.stuckTimer++;
    } else {
        test2State.stuckTimer = 0;
    }
    
    test2State.lastPosition = { x: gameState.player.x, y: gameState.player.y };
    
    // If stuck, try honking or moving randomly
    if (test2State.stuckTimer > 60) {
        test2State.stuckTimer = 0;
        return { keyCode: 32 }; // Honk to scare villagers
    }
    
    // Near target
    if (distance < 35) {
        if (!isCarrying && !taskItem.isBeingCarried) {
            // Pick up item
            return { keyCode: 90 }; // Z key
        } else if (isCarrying) {
            // Drop item at target
            return { keyCode: 90 }; // Z key
        }
    }
    
    // Use sprint if far away
    const useSprint = distance > 150 && gameState.player.stamina > 30;
    
    // Move towards target
    let keyCode;
    if (Math.abs(dx) > Math.abs(dy)) {
        keyCode = dx > 0 ? 39 : 37; // Right or Left
    } else {
        keyCode = dy > 0 ? 40 : 38; // Down or Up
    }
    
    // Return action with optional sprint
    return useSprint ? { keyCode: keyCode, sprint: true } : { keyCode: keyCode };
}

// ============================================================================
// MAIN AUTOMATED TESTING FUNCTION
// ============================================================================

export function get_automated_testing_action(gameState) {
    if (gameState.gamePhase !== "PLAYING") {
        return null;
    }
    
    switch (gameState.controlMode) {
        case "TEST_1":
            return getTest1Action();
        case "TEST_2":
            return getTest2Action();
        default:
            return null;
    }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;