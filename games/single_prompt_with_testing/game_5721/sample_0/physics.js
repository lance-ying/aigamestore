import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CONSTANTS } from './globals.js';
import { normalizeAngle } from './utils.js';

export function updatePhysics(dt) {
    if (!gameState.ball) return;
    
    const ball = gameState.ball;
    
    // Check collision with platforms
    checkPlatformCollisions(ball);
    
    // Check failure condition (falling too far behind camera or missed goal)
    // Actually, game over is usually hitting a trap. Falling is good.
    // If we fall past the last level, we win.
}

function checkPlatformCollisions(ball) {
    // Find nearby platform
    // Platforms are at y = 0, -gap, -2gap...
    // Find closest platform below ball
    
    // Ball Y position relative to world
    const ballY = ball.mesh.position.y;
    const ballRadius = CONSTANTS.BALL_RADIUS;
    
    // Current logical rotation of the ball relative to the tower
    // The tower rotates, so the ball's angle relative to the platform is derived from towerRotation.
    // Ball is fixed at Z+ (angle 0 in world space? No, usually +Z is 0 or PI/2 depending on conventions)
    // Three.js: +Z is towards viewer. +X is right.
    // Atan2(z, x) for (0, 0, 2.5) -> Atan2(2.5, 0) = PI/2.
    // Our physics angular system is Clockwise (0=X, PI/2=Z).
    const ballWorldAngle = Math.PI / 2; 
    
    // Relative angle on the platform
    // Platform rotates by towerRotation (Three.js is CCW).
    // In our CW physics system, PlatformAngle = -towerRotation.
    // RelativeAngle = BallAngle - PlatformAngle = BallAngle - (-towerRotation) = BallAngle + towerRotation.
    const relativeAngle = normalizeAngle(ballWorldAngle + gameState.towerRotation);
    
    for (const platform of gameState.platforms) {
        // Simple bounding box check on Y
        // Platform surface is at platform.y
        // We care about top surface for bounce
        
        const platformTop = platform.y + CONSTANTS.PLATFORM_HEIGHT / 2;
        const platformBottom = platform.y - CONSTANTS.PLATFORM_HEIGHT / 2;
        
        // Check if ball is intersecting the platform disc vertically
        // We only bounce if we are falling and hitting the top
        if (ball.velocity.y < 0 && 
            ballY - ballRadius <= platformTop && 
            ballY - ballRadius >= platformTop - 0.5) { // Tolerance
            
            // We are at the height of a platform.
            // Check if we are over a gap or solid
            
            // Check sectors
            if (platform.isGoal) {
                // Win!
                gameState.gamePhase = "GAME_OVER_WIN";
                return;
            }
            
            // Gap check: if gapAngle +/- gapSize/2 contains relativeAngle
            // Gap is defined as the empty space.
            const halfGap = platform.gapSize / 2;
            const gapStart = normalizeAngle(platform.gapAngle - halfGap);
            const gapEnd = normalizeAngle(platform.gapAngle + halfGap);
            
            // Helper to check arc inclusion
            const inGap = isAngleBetween(relativeAngle, gapStart, gapEnd);
            
            if (inGap) {
                // Pass through - Score up if we just passed a level
                if (!platform.passed) {
                    gameState.score += 10;
                    platform.passed = true;
                    // Trigger sound/effect?
                }
            } else {
                // Hit solid - check Trap
                let hitTrap = false;
                
                // Iterate sectors to find which one we hit
                for (const sector of platform.sectors) {
                    // Check if relativeAngle is inside this sector
                    // Sector angles were defined in local space of platform generation.
                    const sStart = normalizeAngle(sector.start);
                    const sEnd = normalizeAngle(sector.end);
                    
                    if (isAngleBetween(relativeAngle, sStart, sEnd)) {
                        if (sector.isTrap) hitTrap = true;
                        break;
                    }
                }
                
                if (hitTrap) {
                    gameState.gamePhase = "GAME_OVER_LOSE";
                    // Death effect
                    ball.destroy(); // hide ball
                } else {
                    // Bounce
                    ball.bounce();
                    // Add score for bounce? Maybe not, prevents farming.
                }
            }
        }
    }
}

function isAngleBetween(target, start, end) {
    // Check if target is in [start, end] dealing with wrap around
    if (start < end) {
        return target >= start && target <= end;
    } else {
        return target >= start || target <= end;
    }
}