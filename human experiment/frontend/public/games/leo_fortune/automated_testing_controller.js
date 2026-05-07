import { gameState } from './globals.js';

// Simple heuristic bot for testing
export function get_automated_testing_action(state) {
    const player = state.player;
    if (!player) return null;
    
    const actions = { left: false, right: false, up: false, down: false };
    
    if (state.controlMode === "TEST_1") {
        // Strategy: Move right, jump if obstacle or gap detected ahead
        actions.right = true;
        
        // Look ahead
        const lookAheadDist = 60;
        const groundCheckDist = 80;
        
        // Check for ground ahead
        let groundAhead = false;
        const checkX = player.x + lookAheadDist;
        const checkY = player.y + player.r + 10;
        
        for (let plat of state.platforms) {
            if (checkX > plat.x && checkX < plat.x + plat.w &&
                checkY > plat.y && checkY < plat.y + plat.h + 100) {
                groundAhead = true;
                break;
            }
        }
        
        // If no ground ahead, jump
        if (!groundAhead && player.onGround) {
            actions.up = true;
        }
        
        // Check for wall ahead
        let wallAhead = false;
        for (let plat of state.platforms) {
            if (player.x + player.r + 20 > plat.x && player.x < plat.x &&
                player.y > plat.y && player.y < plat.y + plat.h) {
                wallAhead = true;
            }
        }
        
        if (wallAhead && player.onGround) {
            actions.up = true;
        }
        
        // If falling in a pit, hold up to float
        if (player.vy > 2) {
            actions.up = true;
        }
        
        // Detect hazard ahead - Jump
        for (let haz of state.hazards) {
            if (haz.x > player.x && haz.x < player.x + 100 && Math.abs(haz.y - player.y) < 50) {
                if (player.onGround) actions.up = true;
            }
        }
        
    } else if (state.controlMode === "TEST_2") {
        // Random inputs to stress test physics
        if (Math.random() < 0.3) actions.left = true;
        if (Math.random() < 0.3) actions.right = true;
        if (Math.random() < 0.2) actions.up = true;
        if (Math.random() < 0.1) actions.down = true;
    }
    
    return actions;
}