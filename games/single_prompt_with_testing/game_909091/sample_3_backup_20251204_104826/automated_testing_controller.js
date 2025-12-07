/**
 * Automated testing logic.
 */
import { gameState } from './globals.js';

let testState = {
    step: 0,
    timer: 0
};

export function get_automated_testing_action(gameState) {
    const p = window.gameInstance;
    if (!p) return;

    if (gameState.controlMode === "TEST_1") {
        return runTest1(gameState);
    } else if (gameState.controlMode === "TEST_2") {
        return runTest2(gameState);
    } else if (gameState.controlMode === "TEST_3") {
        return runTest3(gameState);
    }
    return null;
}

// TEST 1: Charge and Jump Vertical
function runTest1(gameState) {
    testState.timer++;
    
    // Wait for start
    if (gameState.gamePhase === "START") return { keyCode: 13 }; // ENTER
    
    if (gameState.gamePhase === "PLAYING") {
        if (testState.step === 0) {
            // Hold Space
            if (testState.timer < 30) return { keyCode: 32 }; 
            else {
                testState.step = 1;
                testState.timer = 0;
                return null; // Release
            }
        }
    }
    return null;
}

// TEST 2: Jump to Platform
function runTest2(gameState) {
    testState.timer++;
    if (gameState.gamePhase === "START") return { keyCode: 13 };
    
    if (gameState.gamePhase === "PLAYING") {
        // Step 0: Move Right slightly to align better (if needed)
        // Starting pos is 100,200. First platform is 200, -150 relative to ground.
        // Actually start pos is set in game.js. Let's assume start x=50.
        // Platform 1 is at x=200, y=WORLD_HEIGHT-150.
        
        if (testState.step === 0) {
            // Walk right for 20 frames
            if (testState.timer < 40) return { keyCode: 39 };
            testState.step = 1;
            testState.timer = 0;
            return null;
        }
        if (testState.step === 1) {
            // Wait to stop
            if (testState.timer < 10) return null;
            testState.step = 2;
            testState.timer = 0;
        }
        if (testState.step === 2) {
            // Charge jump right
            if (testState.timer < 30) return { keyCode: 32 }; // Hold Space
            // On release frame, also hold Right to direct jump
            testState.step = 3; 
            return { keyCode: 39 };
        }
    }
    return null;
}

// TEST 3: Wall Bounce
function runTest3(gameState) {
    testState.timer++;
    if (gameState.gamePhase === "START") return { keyCode: 13 };
    
    if (gameState.gamePhase === "PLAYING") {
        // Walk left into wall
        if (testState.timer < 100) return { keyCode: 37 };
        
        // Jump while holding left
        if (testState.timer > 100 && testState.timer < 120) return { keyCode: 32 };
        
        // Release
        return null;
    }
    return null;
}

// Attach to window
window.get_automated_testing_action = get_automated_testing_action;