export function get_automated_testing_action(gameState) {
    if (!gameState.player) return null;

    if (gameState.controlMode === "TEST_1") {
        // Test 1: Move right to collect coin
        // Simple strategy: Always hold right
        return { right: true };
    } 
    
    if (gameState.controlMode === "TEST_2") {
        // Test 2: Complete level
        // Heuristic: Move right. 
        // If there is a gap or wall ahead, jump (Inflate).
        // If high up and need to drop, down (Deflate).
        
        let action = { right: true, up: false, down: false };
        
        const player = gameState.player;
        
        // Check for pits/obstacles ahead
        // This is a naive check simulating "visual" confirmation
        let dangerAhead = false;
        let wallAhead = false;
        
        // Raycast-ish check forward
        for(let haz of gameState.hazards) {
            if (haz.x > player.x && haz.x < player.x + 150) {
                // Hazard ahead
                if (haz.y > player.y) dangerAhead = true; // Pit/Floor hazard
            }
        }
        
        for(let plat of gameState.platforms) {
             // Wall check
             if (plat.x > player.x && plat.x < player.x + 50 && plat.y < player.y && plat.y + plat.h > player.y) {
                 wallAhead = true;
             }
        }
        
        if (dangerAhead || wallAhead) {
            action.up = true; // Float
        }
        
        return action;
    }

    if (gameState.controlMode === "TEST_3") {
        // Test 3: Die
        // Find nearest hazard and move towards it
        if (gameState.hazards.length > 0) {
            const h = gameState.hazards[0];
            if (h.x > gameState.player.x) return { right: true };
            return { left: true };
        }
        return { right: true };
    }

    return null;
}