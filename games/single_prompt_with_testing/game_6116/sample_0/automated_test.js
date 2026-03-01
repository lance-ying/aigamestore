// automated_test.js
// Automated testing logic

import { KEYS } from './input.js';
import { gameState } from './globals.js';

let testState = {
    step: 0,
    timer: 0,
    startHeight: 0
};

export function get_automated_testing_action(gs) {
    if (gs.controlMode === 'TEST_1') {
        return runTest1(gs);
    } else if (gs.controlMode === 'TEST_2') {
        return runTest2(gs);
    } else if (gs.controlMode === 'TEST_3') { // Mapped to the second button in UI usually or extra
        // Placeholder
        return null;
    }
    return null;
}

// TEST 1: Vertical Jump Verification
function runTest1(gs) {
    if (!gs.player) return null;
    
    testState.timer++;
    
    // 1. Wait a bit
    if (testState.timer < 30) {
        return { keys: [] };
    }
    
    // 2. Charge Jump (Hold Space)
    if (testState.timer < 60) {
        return { keys: [KEYS.SPACE] };
    }
    
    // 3. Release (Jump)
    // 4. Wait for landing
    return { keys: [] };
}

// TEST 2: Wall Bounce
function runTest2(gs) {
    if (!gs.player) return null;
    
    testState.timer++;
    
    // 1. Walk Left to wall
    if (testState.timer < 60) {
        return { keys: [KEYS.LEFT] };
    }
    
    // 2. Charge Jump + Right (Into Right Wall eventually? No, let's hit Left Wall)
    // Wall is at x=50. Player starts around center.
    // If we walk left for 1 sec, we are at wall.
    // Let's jump RIGHT into the RIGHT wall.
    
    if (testState.timer < 120) {
        // Walk Right
        return { keys: [KEYS.RIGHT] };
    }
    
    // 3. Charge Big Jump + Right
    if (testState.timer < 160) {
        return { keys: [KEYS.SPACE, KEYS.RIGHT] };
    }
    
    // 4. Release (Fly right)
    return { keys: [] };
}

window.get_automated_testing_action = get_automated_testing_action;