/**
 * Automated Testing Controller
 */

import { BLOCK_SIZE } from './globals.js';
import { getGridKey } from './iso_math.js';

let lastActionFrame = 0;

export function get_automated_testing_action(gameState) {
    const player = gameState.player;
    if (!player) return null;

    if (gameState.controlMode === "TEST_1") {
        // SMART STRATEGY: Look ahead and switch if void
        // Look 1 block ahead in current direction
        
        // Determine current direction vector
        let nextGridX = Math.round(player.x / BLOCK_SIZE);
        let nextGridZ = Math.round(player.z / BLOCK_SIZE);
        
        // Current direction: 0 = +X, 1 = +Z
        if (player.direction === 0) {
            nextGridX += 1;
        } else {
            nextGridZ += 1;
        }
        
        const key = getGridKey(nextGridX, nextGridZ);
        
        // Also check one more step to be safe (since we are moving continuously)
        // If immediate next is missing, we MUST switch
        // But since we are on the edge, we might need to check if we are *approaching* the edge.
        
        // Check if the block ahead exists
        if (!gameState.blocks.has(key)) {
            // Path blocked or ends in this direction. Switch!
            // Wait, we need to make sure we don't switch endlessly if both are blocked (which shouldn't happen in valid path)
            // But we need to switch only once per tile.
            
            // Debounce: Don't switch if we just switched? 
            // Better: Check if we are close to the center of the current tile.
            // If we are past the center, and next is void, switch.
            
            // Normalized position within tile [0, 1]
            // Actually, physics is simple. If (next block is invalid), switch.
            // But if we switch, we go the other way. We assume the other way is valid (procedural generation guarantees one valid path).
            
            // To prevent spamming switch every frame while looking at void:
            // Check if we are "aligned" enough to switch safely? 
            // No, just switch. The logic is: "If I keep going, I die. So turn."
            
            // Only switch if enough time passed since last switch to avoid 1-frame flip-flop if both forward and side are tricky?
            // Actually, if we switch, 'player.direction' changes. So on next frame, we look at a DIFFERENT 'nextGrid'.
            // If that 'nextGrid' is valid, we won't switch back.
            // So simply returning switch action is fine.
            
            // But we only want to switch once per decision point.
            // Let's add a small cooldown.
            if (gameState.frameCount - lastActionFrame > 10) {
                lastActionFrame = gameState.frameCount;
                return { switch: true };
            }
        }
    } 
    else if (gameState.controlMode === "TEST_2") {
        // RANDOM / STRESS
        // Switch randomly
        if (Math.random() < 0.05 && gameState.frameCount - lastActionFrame > 15) {
            lastActionFrame = gameState.frameCount;
            return { switch: true };
        }
    }
    
    return null;
}