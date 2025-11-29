// automated_testing_controller.js
import { gameState } from './globals.js';

export function get_automated_testing_action(gs) {
    // Safety check
    if (!gs.player) return null;

    if (gs.controlMode === "TEST_1") {
        // Test 1: Move right continuously, jump gaps
        // Strategy: Always hold right. If x position mod something suggests obstacle, jump.
        // Actually, let's play safe: Jump periodically or if velocity drops unexpectedly.
        
        let actions = { key: 'RIGHT' };
        
        // Simple heuristic: if we are stopped but holding right, we hit a wall, so jump
        if (gs.player.vx < 0.5 && gs.player.facing === 1) {
            if (gs.frameCount % 60 < 10) return { key: 'SPACE' }; // Tap jump
        }
        
        // Hardcoded jumps for the specific level layout
        // P starts at 0. Gaps/Obstacles are at specific coords.
        const playerGridX = Math.floor(gs.player.x / 40);
        
        // Jump over initial enemy or gap (approx col 15)
        if (playerGridX > 12 && playerGridX < 16) {
             return { key: 'SPACE' };
        }
        
        // Spring jump
        if (playerGridX > 20 && playerGridX < 23) {
             // Just run, spring handles it
        }

        return actions;
    } 
    else if (gs.controlMode === "TEST_2") {
        // Test 2: Get rings then get hit
        const playerGridX = Math.floor(gs.player.x / 40);
        
        // 1. Get ring (Run right)
        if (playerGridX < 19) {
            return { key: 'RIGHT' };
        }
        
        // 2. We should have rings now (RRR at col 19). Now find enemy.
        // Enemy at row 10, col 30 approx?
        // Let's just run right until we hit something.
        
        // If we have rings and hit an enemy, we test the scatter mechanic.
        // Just run right blindly.
        return { key: 'RIGHT' };
    }
    
    return null;
}