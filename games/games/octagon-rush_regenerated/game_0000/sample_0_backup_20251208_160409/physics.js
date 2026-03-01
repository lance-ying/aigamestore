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
        
        // 0 = Safe, 1 = Obstacle, 2 = Gap
        if (wallType === 1) {
            // Hit Obstacle
            handleCollision(p, "HIT_OBSTACLE");
        } else if (wallType === 2) {
            // Hit Gap -> Fall
            handleCollision(p, "FELL_IN_GAP");
        }
    }
}

function handleCollision(p, cause) {
    console.log("Collision: " + cause);
    logGameEvent(p, 'collision', { cause: cause, score: gameState.score });
    
    // Create explosion effect
    gameState.particles.push(
        gameState.particleSystem.spawn(0, gameState.player.isTop ? -200 : 200, 50, 20, 'explosion')
    );
    
    // Shake screen
    gameState.cameraShake = 20;
    
    // End Game
    gameState.gamePhase = "GAME_OVER_LOSE";
}