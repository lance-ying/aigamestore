// automated_testing_controller.js
import { getTerrainAngle } from './math_utils.js';

export function get_automated_testing_action(gameState, p) {
    if (gameState.controlMode === 'HUMAN') return null;
    
    // Handle Phase transitions automatically
    if (gameState.gamePhase === "START") {
        return { keyDown: 13 }; // Press Enter
    }
    if (gameState.gamePhase === "GAME_OVER_LOSE") {
        return { keyDown: 82 }; // Press R
    }
    
    if (gameState.gamePhase !== "PLAYING") return null;

    const player = gameState.player;
    if (!player) return null;

    if (gameState.controlMode === 'TEST_1') {
        // Simple periodic diving
        // Toggle every 60 frames
        const shouldDive = (p.frameCount % 120) < 60;
        return { isDiving: shouldDive };
    }

    if (gameState.controlMode === 'TEST_2') {
        // Smart physics exploitation
        const angle = getTerrainAngle(p, player.x);
        
        // Logic:
        // 1. If in air and very high: Dive to gain speed (convert potential to kinetic)
        // 2. If on ground or close to ground:
        //    - If slope is downward (angle > 0): DIVE (slide)
        //    - If slope is upward (angle < 0): RELEASE (glide/fly)
        
        const isHigh = player.y < 100; // Screen coordinates, lower is higher
        const isMovingDown = player.vy > 0;
        
        // Slope angle is in radians. Positive = Downhill (since Y increases downwards)
        const isDownhill = angle > 0.1; 
        const isUphill = angle < -0.1;
        
        let shouldDive = false;
        
        if (player.onGround) {
            // On ground: Slide on downhills
            if (isDownhill) shouldDive = true;
            else shouldDive = false;
        } else {
            // In air
            // Dive if we want to hit the ground on a downhill
            // This requires prediction, but simple heuristic:
            // If we are moving down, and the ground below is downhill, dive
            if (isMovingDown && isDownhill) shouldDive = true;
            
            // Or just dive to get back to ground quickly if we are just floating
            if (isHigh) shouldDive = true;
        }
        
        return { isDiving: shouldDive };
    }

    return null;
}