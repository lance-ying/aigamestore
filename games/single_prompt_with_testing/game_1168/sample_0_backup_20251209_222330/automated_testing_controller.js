export function get_automated_testing_action(gameState) {
    const player = gameState.player;
    if (!player) return null;

    // Helper to see inputs
    const actions = {
        left: false,
        right: false,
        jump: false,
        shoot: false
    };

    if (gameState.controlMode === "TEST_1") {
        // Random walking
        if (Math.random() < 0.05) actions.jump = true;
        if (Math.random() < 0.1) {
            // Change direction logic simulated by just picking one
            if (Math.random() < 0.5) actions.left = true;
            else actions.right = true;
        }
        // Keep moving in current direction mostly
        if (player.facing === 1 && Math.random() < 0.9) actions.right = true;
        if (player.facing === -1 && Math.random() < 0.9) actions.left = true;
        
    } else if (gameState.controlMode === "TEST_2") {
        // Try to win: Move up
        // Simple heuristic: Move towards center x, jump if on ground, shoot always
        
        actions.shoot = (gameState.frameCount % 5 === 0);
        
        // Try to stay central
        if (player.x < 200) actions.right = true;
        else if (player.x > 400) actions.left = true;
        else {
            // Random jitter
            if (Math.random() < 0.5) actions.right = true;
            else actions.left = true;
        }

        // Always jump if on ground to climb
        if (player.onGround) actions.jump = true;
        // Double jump occasionally
        if (player.vy > 0 && Math.random() < 0.1) actions.jump = true;
    }

    return actions;
}

window.get_automated_testing_action = get_automated_testing_action;