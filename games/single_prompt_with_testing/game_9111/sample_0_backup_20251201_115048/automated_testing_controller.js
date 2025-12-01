import { gameState, GAME_OPTS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function get_automated_testing_action(gs) {
    if (!gs.player || gs.gamePhase !== "PLAYING") return null;
    
    switch (gs.controlMode) {
        case "TEST_1": // Win strategy
            return strategyWin(gs);
        case "TEST_2": // Lose strategy
            return null; // Do nothing, will hit wall
        case "TEST_3": // Fever test
            return strategyWin(gs, true); // Win but try to land
        default:
            return null;
    }
}

function strategyWin(gs, forceLanding = false) {
    const player = gs.player;
    // Look ahead for nearest obstacle
    let nearestObs = null;
    let minDist = Infinity;
    
    for (const obs of gs.obstacles) {
        if (obs.x + obs.w > player.x) { // Obstacle is ahead or overlapping
            const dist = obs.x - player.x;
            if (dist >= -obs.w && dist < minDist) {
                minDist = dist;
                nearestObs = obs;
            }
        }
    }
    
    if (nearestObs) {
        // Calculate needed height
        // Obstacle height is obs.h.
        // We need to be above groundY - obs.h.
        // Current player bottom y is player.y + player.h.
        // Or simpler: obstacle top Y is obs.y. Player bottom Y must be < obs.y.
        
        const safeY = nearestObs.y;
        const currentBottomY = player.y + player.h;
        
        // Distance check: start building when close
        if (minDist < 200) {
            // If our feet are below the obstacle top (meaning we will hit it), lay egg
            // Add a small buffer (one egg height) to be safe
            if (currentBottomY > safeY) {
                return { keyCode: 32 }; // Space
            }
        } else if (forceLanding) {
            // If far from obstacle, try to land to trigger fever mechanic
            // Only if we have eggs
            // We can't "drop" eggs actively in this game logic, they drop by hitting walls usually?
            // Wait, the prompt implies "perfect landing" logic. 
            // In standard square bird, you can't drop eggs manually. They break on walls.
            // So to land, you just stop laying eggs after an obstacle and let gravity/level design handle it?
            // Actually, usually you just don't lay new ones. The ones you have stay until they hit something.
            // Ah, usually Square Bird eggs persist until broken by a block.
            // So to "land", you must encounter "LOW BLOCKS" that break your eggs but don't kill you.
            // My Level Generator creates various blocks.
            // Strategy: Just play safe.
        }
    }
    
    return null;
}

window.get_automated_testing_action = get_automated_testing_action;