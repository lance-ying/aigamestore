/**
 * Automated Controller logic for testing modes.
 * Determines the next action based on game state.
 */

import { gameState, SIDE, KEYS } from './globals.js';

/**
 * Determines the automated action for the current frame.
 * @returns {object|null} Object containing keyCode to press, or null.
 */
export function get_automated_testing_action() {
    if (gameState.gamePhase !== "PLAYING") return null;

    // Throttle inputs to strictly one per frame, or even slower to simulate reaction time?
    // For 'Win' mode, we can go fast (every few frames).
    // For 'Test', we follow the strategy.
    
    // Simple throttle to avoid 60 moves per second which depletes tree instantly
    if (gameState.frameCount % 5 !== 0) return null;

    if (gameState.controlMode === "TEST_1" || gameState.controlMode === "TEST_2") {
        return getSmartAction();
    }
    
    return null;
}

function getSmartAction() {
    if (!gameState.tree || !gameState.player) return null;

    // Look at the segment immediately "above" the player's head interaction zone.
    // In our Tree logic, the bottom segment (index 0) is what we chop.
    // The segment at index 1 is what falls down to become the new bottom.
    // IF index 0 has a branch, we are already dead if we are on that side (collision happens on chop).
    // But collision check happens AFTER move.
    
    // Strategy:
    // We want to chop the current bottom segment (index 0).
    // We need to be on a side that is SAFE for index 0 (if it had a branch we'd be dead already or it's on other side).
    // wait, branches at index 0 are dangerous if we are on that side.
    // BUT, we also need to check index 1 (the one coming down).
    // Actually, in Timberman:
    // You chop the bottom block. 
    // The danger is the branch on the bottom block (if you move into it) OR the branch on the block above (if it falls on you).
    // Actually, usually the branch on the bottom block is already avoided.
    // When you chop, the bottom block disappears, and the one above falls.
    // If the one above (index 1) has a branch on your CURRENT side, you die when it falls.
    // So you must move to the OTHER side if index 1 has a branch on your side.
    
    const nextSegment = gameState.tree.segments[1]; // The one that will fall to player level
    const currentSegment = gameState.tree.segments[0];
    
    // Default: Stay on current side
    let targetSide = gameState.player.side;
    
    // If the next segment has a branch, we MUST NOT be on that side
    if (nextSegment && nextSegment.hasBranch) {
        targetSide = (nextSegment.branchSide === SIDE.LEFT) ? SIDE.RIGHT : SIDE.LEFT;
    }
    
    // Exception for Test 2 (Crash): Intentionally hit the branch
    if (gameState.controlMode === "TEST_2" && gameState.score > 5) {
        // After a few points, suicide
        if (nextSegment && nextSegment.hasBranch) {
            targetSide = nextSegment.branchSide;
        }
    }

    // Convert side to Key
    if (targetSide === SIDE.LEFT) return { keyCode: KEYS.LEFT };
    if (targetSide === SIDE.RIGHT) return { keyCode: KEYS.RIGHT };
    
    return null;
}

window.get_automated_testing_action = get_automated_testing_action;