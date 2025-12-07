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
    // A segment at 'z' defines the tunnel walls from 'z' to 'z + SEGMENT_DEPTH'.
    // We need to find the segment that contains the player's Z position.
    const activeSegment = gameState.tunnelSegments.find(seg => 
        seg.z <= playerZ && seg.z + SEGMENT_DEPTH > playerZ
    );

    if (activeSegment) {
        // Determine which tunnel facet the player is currently "on".
        // The tunnel rotates. The player is fixed at screen bottom (angle PI/2) or top (-PI/2).
        
        // Formula:
        // World Angle of Panel i = rotation + i * (PI/4) + offset
        // Player Angle in World = PI/2 (Bottom)
        // We need to find 'i' such that Panel Angle is approx Player Angle.
        
        // Actually, easiest way: Transform Player Angle into Tunnel Local Space.
        // localPlayerAngle = PlayerAngle - TunnelRotation
        
        let playerScreenAngle = Math.PI / 2; // Bottom (6 o'clock)
        if (player.isTop) playerScreenAngle = -Math.PI / 2; // Top (12 o'clock)
        
        // Normalize
        playerScreenAngle = normalizeAngle(playerScreenAngle);
        
        // Tunnel Rotation
        const tunnelRot = normalizeAngle(gameState.tunnelRotation);
        
        // Relative Angle
        let relativeAngle = normalizeAngle(playerScreenAngle - tunnelRot);
        
        // Convert to index 0-7
        // Each segment is PI/4 wide (45 deg).
        // Center of segment 0 is at PI/2 + PI/8 relative to start? 
        // Based on getOctagonVertices: i * step + rotation + angleOffset
        
        // Let's calculate the index directly from the relative angle.
        // We shift by the offset used in vertex generation.
        
        // We want the panel index where the player IS.
        // The player is at `relativeAngle` in the local tunnel space.
        // Vertices are at `i * step + angleOffset`.
        // Panel `i` is between `vertex i` and `vertex i+1`.
        
        // localAngle approx (i + 0.5) * step + angleOffset
        // Solve for i:
        const step = Math.PI / 4;
        
        // Shift relative angle to align with our indexing
        let adjustedAngle = relativeAngle - ANGLE_OFFSET;
        adjustedAngle = normalizeAngle(adjustedAngle);
        
        // Map to 0-7
        // Because of the wrap around, we need to be careful with negative mod.
        let rawIndex = adjustedAngle / step;
        
        // The floor logic is simple: map angle to 8 buckets.
        let index = Math.floor(rawIndex);
        if (index < 0) index += 8;
        index = index % 8;
        
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