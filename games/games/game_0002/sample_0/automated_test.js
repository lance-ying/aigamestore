import { gameState } from './globals.js';

export function get_automated_testing_action(p, player) {
    const mode = gameState.controlMode;
    const actions = { left: false, right: false, up: false, down: false };

    if (mode === "TEST_1") {
        // Test basic mechanics: Move Right, occasionally Float
        actions.right = true;
        
        // Float every 2 seconds
        if (p.frameCount % 120 > 60) {
            actions.up = true;
        }
        
    } else if (mode === "TEST_2") {
        // Smart Bot / Win Strategy
        actions.right = true;
        
        // Look ahead
        const lookAheadDist = 150;
        const groundY = 360; // Approx
        
        // Simple logic: If blocked or pit, Jump/Float
        // Check for hazards ahead
        const hazardAhead = gameState.hazards.some(h => 
            h.x > player.x && h.x < player.x + lookAheadDist && 
            Math.abs(h.y - player.y) < 100
        );

        // Check for pit (no platform below ahead)
        // Sample a point ahead and below
        const checkX = player.x + 80;
        const checkY = player.y + 50;
        const platformBelow = gameState.platforms.some(plat => 
            checkX >= plat.x && checkX <= plat.x + plat.width &&
            checkY < plat.y + plat.height && checkY > plat.y - 100
        );
        
        // Check wall ahead
        const wallAhead = gameState.platforms.some(plat => 
            plat.x > player.x + player.radius && 
            plat.x < player.x + 60 &&
            player.y > plat.y && player.y < plat.y + plat.height
        );

        if (!platformBelow || hazardAhead || wallAhead) {
            actions.up = true; // Float/Jump
        } else {
            // Precise landing optimization
            // If we are high up and safe ground is below, deflate to land faster
            const highUp = player.y < 200;
            if (highUp && platformBelow && !hazardAhead) {
                actions.down = true;
            }
        }
        
        // Handle Tunnel (Ceiling) collision avoidance? 
        // Just push right usually works unless blocked.
        
    } else if (mode === "TEST_3") {
        // Suicide run
        // Find nearest spike
        const spike = gameState.hazards[0];
        if (spike) {
            if (player.x < spike.x) actions.right = true;
            else actions.left = true;
            // Don't jump
        } else {
            actions.right = true; // Fall off world if no spikes
        }
    }

    return actions;
}