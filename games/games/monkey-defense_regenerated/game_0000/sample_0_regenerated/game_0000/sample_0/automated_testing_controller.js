import { gameState, TOWER_TYPES } from './globals.js';

export function get_automated_testing_action(currentGameState) {
    if (currentGameState.controlMode === "HUMAN") return null;

    if (currentGameState.controlMode === "TEST_1") {
        return handleTest1(currentGameState);
    }
    if (currentGameState.controlMode === "TEST_2") {
        // Do nothing, let game lose
        return null;
    }
    if (currentGameState.controlMode === "TEST_3") {
        return handleTest3(currentGameState);
    }
    return null;
}

// TEST 1: Win / Build Strategy
// Move to (100, 150) - near start
// Place DART MONKEY
let t1Step = 0;
function handleTest1(gs) {
    const targetX = 100;
    const targetY = 150;
    
    // 0: Move to position
    if (t1Step === 0) {
        if (Math.abs(gs.cursor.x - targetX) > 5) {
            return gs.cursor.x < targetX ? { keyCode: 39 } : { keyCode: 37 };
        }
        if (Math.abs(gs.cursor.y - targetY) > 5) {
            return gs.cursor.y < targetY ? { keyCode: 40 } : { keyCode: 38 };
        }
        t1Step = 1;
    }
    
    // 1: Ensure Dart Monkey Selected (Default is 0, so ok)
    if (t1Step === 1) {
        t1Step = 2;
        return null; 
    }
    
    // 2: Build
    if (t1Step === 2) {
        // Only build if money allows and no tower there
        if (gs.money >= 200 && gs.towers.length === 0) {
            t1Step = 3;
            return { keyCode: 32 }; // Space
        }
    }
    
    // 3: Wait
    return null;
}

// TEST 3: Cycle Towers
let t3Timer = 0;
function handleTest3(gs) {
    t3Timer++;
    // Press Z every 30 frames
    if (t3Timer % 30 === 0) {
        return { keyCode: 90 };
    }
    return null;
}

window.get_automated_testing_action = get_automated_testing_action;