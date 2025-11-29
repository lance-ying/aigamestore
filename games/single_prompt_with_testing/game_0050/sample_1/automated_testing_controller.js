export function get_automated_testing_action(gameState) {
    if (!gameState.player) return null;

    const mode = gameState.controlMode;
    const player = gameState.player;
    const pX = player.x;
    const pY = player.y;

    if (mode === "TEST_1") {
        // Survival Mode: Just circle in the middle
        // If heading is not matching circle tangent, turn
        // Simple square pattern logic
        const cx = 300, cy = 200;
        const dist = Math.sqrt((pX - cx)**2 + (pY - cy)**2);
        
        // If too far, turn towards center
        if (dist > 100) {
             const angleToCenter = Math.atan2(cy - pY, cx - pX);
             let diff = angleToCenter - player.heading;
             while (diff < -Math.PI) diff += Math.PI * 2;
             while (diff > Math.PI) diff -= Math.PI * 2;
             
             if (diff > 0.1) return { keyIsDown: "RIGHT" };
             if (diff < -0.1) return { keyIsDown: "LEFT" };
        } else {
            // Just turn right slowly to circle
            return { keyIsDown: "RIGHT" };
        }
    }
    
    if (mode === "TEST_2") {
        // Capture Mode: Go out, turn, come back
        // Phase based on frameCount is brittle, but simple for this
        const cycle = gameState.frameCount % 300;
        
        if (cycle < 60) return null; // Go straight
        if (cycle < 100) return { keyIsDown: "RIGHT" }; // Turn 90 deg approx
        if (cycle < 160) return null; // Go straight parallel
        if (cycle < 200) return { keyIsDown: "RIGHT" }; // Turn back
        // Should return to base
    }

    return null;
}