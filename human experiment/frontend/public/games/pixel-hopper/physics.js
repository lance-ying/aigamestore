import { gameState, GRID_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function checkCollisions(p) {
    const player = gameState.player;
    if (!player || player.isDead) return;

    // 1. Get the lane the player is currently on
    // Lane index corresponds to player.gridY (negative because world goes up)
    // Actually, let's map player world Y to lane index.
    // In our system, gridY = 0 is start. gridY = -1 is one forward.
    // Lane manager stores lanes such that index 0 is at gridY = 0?
    // Let's defer to how LaneManager handles coordinates.
    // Assuming LaneManager.getLaneAt(gridY) exists.
    
    const currentLane = gameState.laneManager.getLaneAt(player.gridY);
    
    if (!currentLane) return; // Should not happen

    // 2. Check collisions based on lane type
    
    // A. Solid Static Obstacles (Trees) - handled in movement logic (pre-move check)
    //    But we double check here just in case.
    
    // B. Dynamic Obstacles (Cars, Trains)
    if (currentLane.type === 'ROAD' || currentLane.type === 'RAIL') {
        const playerRect = player.getHitbox();
        
        for (let obstacle of currentLane.obstacles) {
            const obsRect = obstacle.getHitbox();
            if (p.collideRectRect(
                playerRect.x, playerRect.y, playerRect.w, playerRect.h,
                obsRect.x, obsRect.y, obsRect.w, obsRect.h
            )) {
                player.die("CRUSHED");
                return;
            }
        }
    }
    
    // C. Water Logic (Logs)
    if (currentLane.type === 'WATER') {
        // Assume unsafe until proven safe by a log
        let onLog = false;
        const playerRect = player.getHitbox();
        
        // Slightly shrink player hitbox for log standing to be forgiving
        const footRect = {
            x: playerRect.x + 5,
            y: playerRect.y + 5,
            w: playerRect.w - 10,
            h: playerRect.h - 10
        };

        for (let log of currentLane.obstacles) {
            const logRect = log.getHitbox();
            if (p.collideRectRect(
                footRect.x, footRect.y, footRect.w, footRect.h,
                logRect.x, logRect.y, logRect.w, logRect.h
            )) {
                onLog = true;
                // Move player with log
                if (!player.isMoving) {
                    player.visualX += log.speed;
                    // Update grid X roughly to track (though visual is detached)
                    // We only enforce grid X snap when hopping. 
                    // While on log, we float.
                }
                break;
            }
        }
        
        // If mid-jump, we are safe (flying over water)
        // If not moving and not on log -> Drown
        if (!onLog && !player.isMoving && !player.isJumping()) {
            player.die("DROWNED");
            return;
        }
    }
    
    // 3. Screen Bounds
    // If player drifted off screen while on log
    if (player.visualX < -GRID_SIZE || player.visualX > CANVAS_WIDTH + GRID_SIZE) {
        player.die("OFF_SCREEN");
    }
    
    // Camera catch up (Eagle)
    // If player falls too far behind camera
    const screenY = player.visualY - gameState.cameraY;
    if (screenY > CANVAS_HEIGHT + GRID_SIZE) {
        player.die("EAGLE");
    }
}

export function isSolid(gridX, gridY) {
    const lane = gameState.laneManager.getLaneAt(gridY);
    if (!lane) return true; // Void is solid/unsafe
    
    // Check trees/rocks
    // Lane stores obstacles. Static obstacles map by X.
    if (lane.staticMap && lane.staticMap[gridX]) {
        return true;
    }
    
    return false;
}