/**
 * automated_testing_controller.js
 * Logic for automated testing modes.
 * Returns inputs based on game state and test strategy.
 */

export function get_automated_testing_action(gameState) {
    // Safety check
    if (!gameState.player) return null;
    
    const player = gameState.player;
    
    // TEST 1: Basic functionality (Random movements)
    if (gameState.controlMode === 'TEST_1') {
        const rand = Math.random();
        
        // Simple random walk and actions
        if (rand < 0.05) return { keyCode: 32 }; // Jump
        if (rand < 0.1) return { keyCode: 90 };  // Attack
        if (rand < 0.3) return { keyCode: 37 };  // Left
        if (rand < 0.5) return { keyCode: 39 };  // Right
        if (rand < 0.7) return { keyCode: 38 };  // Up
        if (rand < 0.9) return { keyCode: 40 };  // Down
        
        return null;
    }
    
    // TEST 2: Combat AI (Seek and Destroy)
    if (gameState.controlMode === 'TEST_2') {
        // Find nearest enemy
        let nearest = null;
        let minDist = 9999;
        
        gameState.enemies.forEach(e => {
            const d = Math.sqrt(Math.pow(e.x - player.x, 2) + Math.pow(e.y - player.y, 2));
            if (d < minDist) {
                minDist = d;
                nearest = e;
            }
        });
        
        if (nearest) {
            const dx = nearest.x - player.x;
            const dy = nearest.y - player.y;
            
            // Align Y first (Depth)
            if (Math.abs(dy) > 10) {
                if (dy > 0) return { keyCode: 40 }; // Down
                else return { keyCode: 38 };        // Up
            }
            
            // Align X (Approach)
            if (Math.abs(dx) > 50) {
                if (dx > 0) return { keyCode: 39 }; // Right
                else return { keyCode: 37 };        // Left
            }
            
            // Attack in range
            return { keyCode: 90 }; // Attack Z
        } else {
            // No enemies? Move right to trigger next wave
            return { keyCode: 39 };
        }
    }

    // TEST 3: Wall Hugging (Stability)
    if (gameState.controlMode === 'TEST_3') {
        // Jump repeatedly while moving left/up/right/down in cycles
        const timer = (Date.now() / 1000) % 4;
        
        if (Math.random() < 0.1) return { keyCode: 32 }; // Jump spam
        
        if (timer < 1) return { keyCode: 37 }; // Left
        if (timer < 2) return { keyCode: 38 }; // Up
        if (timer < 3) return { keyCode: 39 }; // Right
        return { keyCode: 40 };                // Down
    }
    
    return null;
}