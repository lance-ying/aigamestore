import { gameState } from './globals.js';

export function applyTestInputs() {
    if (gameState.controlMode === "HUMAN") return;
    
    // Reset keys mock
    gameState.keys = {};
    const player = gameState.player;
    if (!player) return;

    if (gameState.controlMode === "TEST_1") {
        // Move Right constantly
        gameState.keys[39] = true;
        // Jump periodically
        if (gameState.frameCount % 60 === 0) {
            gameState.keys[32] = true;
        }
    } 
    else if (gameState.controlMode === "TEST_2") {
        // Find nearest enemy
        let nearest = null;
        let minMsg = 9999;
        gameState.entities.forEach(e => {
            if (e.constructor.name === "Enemy" && !e.isDead) {
                const d = Math.abs(e.x - player.x);
                if (d < minMsg) {
                    minMsg = d;
                    nearest = e;
                }
            }
        });
        
        if (nearest) {
            // Move towards
            if (player.x < nearest.x - 30) gameState.keys[39] = true;
            else if (player.x > nearest.x + 30) gameState.keys[37] = true;
            
            // Attack if close
            if (minMsg < 60) {
                if (gameState.frameCount % 10 < 5) gameState.keys[90] = true; // Mash Z
            }
        }
    }
    else if (gameState.controlMode === "TEST_3") {
        // Collect stones
        let target = null;
        if (gameState.collectibles.length > 0) {
            target = gameState.collectibles[0]; // Just target first
        }
        
        if (target) {
            if (player.x < target.x) gameState.keys[39] = true;
            else gameState.keys[37] = true;
            
            // Jump obstacles
            // Simple heuristic: if velocity x is near 0 but we want to move, jump
            if (Math.abs(player.vx) < 1 && Math.abs(player.x - target.x) > 10) {
                gameState.keys[32] = true;
            }
            
            // Also jump if target is high
            if (target.y < player.y - 50 && Math.abs(player.x - target.x) < 100) {
                gameState.keys[32] = true;
            }
        }
    }
}

// Expose for external tools if needed
window.get_automated_testing_action = function() {
    // This function returns a single key code action for the frame if needed by external runner
    // But we are injecting directly into gameState.keys for smoother multi-key control internally
    // We return a representative key for logging purposes
    if (gameState.keys[39]) return { keyCode: 39 };
    if (gameState.keys[32]) return { keyCode: 32 };
    if (gameState.keys[90]) return { keyCode: 90 };
    return null;
};