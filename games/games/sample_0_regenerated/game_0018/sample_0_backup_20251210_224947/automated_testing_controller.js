/**
 * Controller for Automated Testing Modes
 */

export function get_automated_testing_action(gameState) {
    const action = {};
    const player = gameState.player;
    
    if (!player) return action; // No player, no action

    // Mode Dispatch
    if (gameState.controlMode === "TEST_1") {
        return runTest1(gameState);
    } else if (gameState.controlMode === "TEST_2") {
        return runTest2(gameState);
    } else if (gameState.controlMode === "TEST_3") {
        return runTest3(gameState);
    }
    
    return action;
}

/**
 * TEST_1: Basic Mobility Randomizer
 */
function runTest1(gameState) {
    const action = {};
    const frame = gameState.frameCount;
    
    // Random Movement
    if (Math.random() < 0.05) {
        // Change direction occasionally
    }
    
    // Per frame noise
    if (frame % 60 < 30) action.RIGHT = true;
    else action.LEFT = true;
    
    // Random jumping
    if (Math.random() < 0.02) action.JUMP_TRIGGER = true;
    
    // Occasional shooting
    if (Math.random() < 0.1) action.SHOOT = true;
    
    return action;
}

/**
 * TEST_2: Aggressive Win Attempt
 */
function runTest2(gameState) {
    const action = {};
    const player = gameState.player;
    
    // Always move right
    action.RIGHT = true;
    
    // Shoot constantly to clear path
    action.SHOOT = true;
    
    // Jump if there's an obstacle ahead (simple raycast simulation logic)
    // Or just jump periodically to clear gaps/walls
    const wallAhead = gameState.platforms.some(p => 
        p.x > player.x && p.x < player.x + 100 && // Ahead
        p.y < player.y + player.height && p.y + p.height > player.y // Same height
    );
    
    const gapAhead = !gameState.platforms.some(p => 
        p.x < player.x + 50 && p.x + p.width > player.x + 50 && // Floor ahead
        p.y > player.y // Below
    );
    
    if (wallAhead || gapAhead) {
        action.JUMP_TRIGGER = true;
        // Hold jump for higher jumps
        action.JUMP = true; 
    }
    
    // Throw grenade at bosses (entities with high health)
    const bossNearby = gameState.entities.some(e => e.type === 'enemy' && e.aiType === 'boss' && Math.abs(e.x - player.x) < 300);
    if (bossNearby && Math.random() < 0.05) {
        action.GRENADE = true;
    }
    
    return action;
}

/**
 * TEST_3: Stress Test
 */
function runTest3(gameState) {
    const action = {};
    // Stay put and spam everything
    action.SHOOT = true;
    if (gameState.frameCount % 10 === 0) action.GRENADE = true;
    if (gameState.frameCount % 5 === 0) action.JUMP_TRIGGER = true;
    return action;
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;