/**
 * Automated testing bot logic.
 * Decides key presses based on game state and selected test mode.
 */

export function get_automated_testing_action(gameState) {
    const player = gameState.player;
    if (!player) return null;

    if (gameState.controlMode === 'TEST_1') {
        return runSurvivalTest(gameState, player);
    } else if (gameState.controlMode === 'TEST_2') {
        return runWinTest(gameState, player);
    }
    
    return null;
}

function runSurvivalTest(gameState, player) {
    // Strategy: Hold Right, Jump if blocked or pit ahead
    // Simple raycast logic simulation
    
    // Check if wall is immediately in front
    let wallAhead = false;
    for (let p of gameState.platforms) {
        if (p.x > player.x && p.x < player.x + 100 &&
            p.y < player.y + player.height && p.y + p.height > player.y) {
            wallAhead = true;
        }
    }
    
    // Check for pit
    let groundAhead = false;
    for (let p of gameState.platforms) {
        if (p.x < player.x + 80 && p.x + p.width > player.x + 80 &&
            p.y >= player.y + player.height) {
            groundAhead = true;
        }
    }
    
    // Action Logic
    if (wallAhead || !groundAhead) {
        return { keyCode: 32 }; // Jump
    }
    
    return { keyCode: 39 }; // Move Right
}

function runWinTest(gameState, player) {
    // Strategy: Hardcoded waypoints for speedrunning or smarter heuristic
    // Since implementing full A* is too much code, we use a coordinate based trigger system
    
    const x = player.x;
    
    // Dash if available and safe (simple logic)
    if (player.canDash && player.dashCooldown === 0) {
        // Dash across long gaps
        if (x > 650 && x < 800) return { keyCode: 16 }; // Dash over first big gap
    }

    // Specific Jump Points (tuned to level_generator.js layout)
    if ((x > 250 && x < 280) || // Jump to first plat
        (x > 380 && x < 420) || // Jump to second
        (x > 580 && x < 620) || // Jump gap
        (x > 1350 && x < 1380)) // Jump wall
    {
        return { keyCode: 32 };
    }
    
    // Constant movement
    return { keyCode: 39 };
}