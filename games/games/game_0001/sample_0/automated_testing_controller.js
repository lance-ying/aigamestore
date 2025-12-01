export function get_automated_testing_action(gameState) {
    // Basic AI for testing
    // Strategy: Move right. 
    // If player velocity X is low (stuck), Jump/Float (Up).
    // Randomly deflate (Down) to test state transitions.
    
    const p = gameState.player;
    if (!p) return null;

    // Check bounds for goal direction (Goal is always to the right in this game)
    const goalX = gameState.goal ? gameState.goal.x : 10000;
    
    if (gameState.controlMode === "TEST_1") {
        // Simple "Move Right" solver
        if (p.x < goalX) {
            // Obstacle handling: If blocked (vx close to 0 but trying to move), jump
            if (Math.abs(p.vx) < 0.2) {
                return { keyCode: 38 }; // UP (Jump/Float)
            }
            
            // Random float to cross gaps
            if (Math.random() < 0.05) {
                return { keyCode: 38 }; // UP
            }
            
            return { keyCode: 39 }; // RIGHT
        }
    } else if (gameState.controlMode === "TEST_2") {
        // Chaos mode
        const r = Math.random();
        if (r < 0.25) return { keyCode: 37 }; // Left
        if (r < 0.5) return { keyCode: 39 }; // Right
        if (r < 0.75) return { keyCode: 38 }; // Up
        return { keyCode: 40 }; // Down
    }
    
    return null;
}