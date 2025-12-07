/**
 * Collision detection and physics logic.
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TUNNEL_RADIUS } from './globals.js';
import { normalizeAngle } from './math_utils.js';

export function checkCollisions(p) {
    if (gameState.gamePhase !== "PLAYING") return;

    const player = gameState.player;
    if (!player) return;

    // The player effectively resides at z = 50.
    // We check segments that are crossing this Z plane.
    const playerZ = 50;
    const playerDepthTolerance = 20; // Collision zone depth

    // Find segment overlapping player
    const activeSegment = gameState.tunnelSegments.find(seg => 
        seg.z > playerZ - playerDepthTolerance && seg.z < playerZ + playerDepthTolerance
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
        // angleOffset = PI/2 + PI/8.
        // So Vertex 0 is at PI/2 + PI/8. Vertex 1 at PI/2 + 3PI/8.
        // Panel 0 is between Vertex 0 and 1. Center of Panel 0 is approx PI.
        
        // Let's reverse engineer the visual alignment.
        // Panel `i` is the floor when `rotation` is such that panel `i` is at bottom.
        
        // Let's calculate the index directly from the relative angle.
        // We shift by the offset used in vertex generation.
        const angleOffset = Math.PI / 2 + (Math.PI / 8); 
        
        // We want the panel index where the player IS.
        // The player is at `relativeAngle` in the local tunnel space.
        // Vertices are at `i * step + angleOffset`.
        // Panel `i` is between `vertex i` and `vertex i+1`.
        
        // localAngle approx (i + 0.5) * step + angleOffset
        // Solve for i:
        const step = Math.PI / 4;
        
        // Shift relative angle to align with our indexing
        let adjustedAngle = relativeAngle - angleOffset;
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