/**
 * Collision detection and physics logic.
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TUNNEL_RADIUS, SEGMENT_DEPTH, logGameEvent } from './globals.js';
import { normalizeAngle, ANGLE_OFFSET } from './math_utils.js';

export function checkCollisions(p) {
    if (gameState.gamePhase !== "PLAYING") return;

    const player = gameState.player;
    if (!player) return;
    
    // Invincible while flipping (mid-air)
    if (player.isFlipping) return;

    // The player effectively resides at z = 50.
    const playerZ = 50;

    // Find segment overlapping player
    const activeSegment = gameState.tunnelSegments.find(seg => 
        seg.z <= playerZ && seg.z + SEGMENT_DEPTH > playerZ
    );

    if (activeSegment) {
        // Determine which tunnel facet the player is currently "on".
        
        let playerScreenAngle = Math.PI / 2; // Bottom (6 o'clock)
        if (player.isTop) playerScreenAngle = -Math.PI / 2; // Top (12 o'clock)
        
        // Normalize
        playerScreenAngle = normalizeAngle(playerScreenAngle);
        
        // Tunnel Rotation
        const tunnelRot = normalizeAngle(gameState.tunnelRotation);
        
        // Relative Angle
        let relativeAngle = normalizeAngle(playerScreenAngle - tunnelRot);
        
        // Calculate the index directly from the relative angle.
        const step = Math.PI / 4;
        
        // Shift relative angle to align with our indexing
        let adjustedAngle = relativeAngle - ANGLE_OFFSET;
        adjustedAngle = normalizeAngle(adjustedAngle);
        
        // Map to 0-7
        let rawIndex = adjustedAngle / step;
        
        // Robust modulo logic to handle negative numbers correctly
        let index = Math.floor(rawIndex);
        index = ((index % 8) + 8) % 8;
        
        // Check the wall type at this index
        const wallType = activeSegment.walls[index];
        
        // 0 = Safe, 1 = Obstacle, 2 = Gap, 3 = Coin
        if (wallType === 3) {
            // Collect Coin
            gameState.score += 500; // Bonus score
            activeSegment.walls[index] = 0; // Remove coin
            // Sparkle effect
            gameState.particleSystem.spawn(0, player.isTop ? -200 : 200, 50, 5, 'spark');
            logGameEvent(p, 'collection', { type: 'coin', score: gameState.score });
        }
        else if (wallType === 1 || wallType === 2) {
            // Hit Hazard
            if (player.invulnTimer > 0) return; // Safe if invulnerable
            
            handleCollision(p, wallType === 1 ? "HIT_OBSTACLE" : "FELL_IN_GAP");
        }
    }
}

function handleCollision(p, cause) {
    gameState.lives--;
    gameState.cameraShake = 20;
    
    // Visual feedback
    gameState.particles.push(
        gameState.particleSystem.spawn(0, gameState.player.isTop ? -200 : 200, 50, 20, 'explosion')
    );
    
    if (gameState.lives <= 0) {
        // Game Over
        console.log("Game Over: " + cause);
        logGameEvent(p, 'collision', { cause: cause, score: gameState.score, fatal: true });
        gameState.gamePhase = "GAME_OVER_LOSE";
    } else {
        // Just hurt
        console.log("Hit: " + cause + ". Lives left: " + gameState.lives);
        logGameEvent(p, 'collision', { cause: cause, score: gameState.score, fatal: false });
        
        // Grant temporary invulnerability (2 seconds at 60fps)
        gameState.player.invulnTimer = 120;
        
        // Slow down slightly as penalty
        gameState.currentSpeed = Math.max(gameState.currentSpeed * 0.5, 8);
    }
}