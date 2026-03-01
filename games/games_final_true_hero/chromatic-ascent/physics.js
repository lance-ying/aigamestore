/**
 * physics.js
 * Handles collision detection, geometric calculations, and physics updates.
 */

import { gameState, COLOR_KEYS, CANVAS_HEIGHT, CANVAS_WIDTH } from './globals.js';

/**
 * Basic AABB Collision Check
 */
export function checkAABB(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.w &&
        rect1.x + rect1.w > rect2.x &&
        rect1.y < rect2.y + rect2.h &&
        rect1.y + rect1.h > rect2.y
    );
}

/**
 * Check collision between a Circle (Player) and a Ring Segment (Arc)
 * This is crucial for the rotating circle obstacles.
 * 
 * @param {Object} player - The player entity
 * @param {Object} obstacle - The obstacle entity
 * @param {Number} innerRadius - Inner radius of the ring
 * @param {Number} outerRadius - Outer radius of the ring
 * @param {Array} segments - Array of color segments [{color, startAngle, endAngle}, ...]
 */
export function checkCircleRingCollision(player, obstacle, innerRadius, outerRadius, segments) {
    const dx = player.x - obstacle.x;
    const dy = player.y - obstacle.y;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);
    
    // Check if player is within the radial band of the ring
    // We add/subtract player radius to be strict about touching
    const playerRadius = player.radius;
    
    // If clearly outside or clearly inside the ring band, no collision
    // Collision happens if the player's body overlaps the ring's thickness
    const overlapsRing = (dist + playerRadius > innerRadius) && (dist - playerRadius < outerRadius);
    
    if (!overlapsRing) return false; // Safe (passed through center or outside)

    // Calculate angle of player relative to obstacle center
    let angle = Math.atan2(dy, dx);
    
    // Normalize angle to 0 - 2PI range
    if (angle < 0) angle += Math.PI * 2;
    
    // Adjust for obstacle rotation
    // The obstacle rotates, effectively shifting the angles of segments
    // Alternatively, we can rotate the player angle inversely
    let relativeAngle = angle - obstacle.rotation;
    
    // Normalize relative angle
    while (relativeAngle < 0) relativeAngle += Math.PI * 2;
    while (relativeAngle >= Math.PI * 2) relativeAngle -= Math.PI * 2;
    
    // Find which segment this angle corresponds to
    // Segments are usually 4 equal parts (0-PI/2, PI/2-PI, etc.)
    // But we iterate to be generic
    
    for (let seg of segments) {
        // Check if relativeAngle is within segment
        // Handle wrapping at 2PI
        let start = seg.start;
        let end = seg.end;
        
        let inSegment = false;
        if (start < end) {
            inSegment = (relativeAngle >= start && relativeAngle <= end);
        } else {
            // Segment wraps around 0 (e.g., 300deg to 30deg)
            inSegment = (relativeAngle >= start || relativeAngle <= end);
        }
        
        if (inSegment) {
            // Collision with this segment!
            // Check color match
            if (player.color !== seg.color) {
                return true; // Collision with WRONG color -> Death
            }
            // If color matches, it's safe, effectively "no collision"
        }
    }
    
    return false;
}

/**
 * Check collision between Circle (Player) and a Rotating Rectangle (Cross/Bar)
 * Uses Separating Axis Theorem concept or simple relative coordinate transformation
 */
export function checkCircleRectCollision(player, rectObstacle) {
    // Transform player into rect's local space to handle rotation easily
    const dx = player.x - rectObstacle.x;
    const dy = player.y - rectObstacle.y;
    
    const cos = Math.cos(-rectObstacle.rotation);
    const sin = Math.sin(-rectObstacle.rotation);
    
    // Player pos relative to rect center, unrotated
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    
    // Rect definition (centered at 0,0 in local space)
    const halfW = rectObstacle.w / 2;
    const halfH = rectObstacle.h / 2;
    
    // Find closest point on rect to circle center
    const closestX = Math.max(-halfW, Math.min(localX, halfW));
    const closestY = Math.max(-halfH, Math.min(localY, halfH));
    
    // Distance check
    const distX = localX - closestX;
    const distY = localY - closestY;
    const distanceSquared = (distX * distX) + (distY * distY);
    
    if (distanceSquared < (player.radius * player.radius)) {
        // Geometric collision detected. Now check color.
        if (player.color !== rectObstacle.color) {
            return true;
        }
    }
    return false;
}

/**
 * Main physics update function for basic entities
 */
export function applyPhysics(entity) {
    // Apply gravity
    if (entity.useGravity) {
        entity.vy += gameState.gravity;
        // Terminal velocity cap
        if (entity.vy > gameState.terminalVelocity) {
            entity.vy = gameState.terminalVelocity;
        }
    }
    
    // Apply velocity
    entity.x += entity.vx;
    entity.y += entity.vy;
    
    // Apply friction/drag if needed
    entity.vx *= 0.95; // Horizontal drag
}

/**
 * Camera Logic
 * Moves the camera up as the player climbs.
 * Does not scroll down (infinite climb style).
 */
export function updateCamera(p) {
    if (!gameState.player) return;
    
    // Target Y is the player's position relative to screen center
    // We want player to be at ~2/3 height of screen (CANVAS_HEIGHT * 0.6)
    const targetY = gameState.player.y - (CANVAS_HEIGHT * 0.6);
    
    // Only scroll up (since y decreases going up, we check if target < current)
    if (targetY < gameState.cameraY) {
        // Smooth lerp for camera
        gameState.cameraY = p.lerp(gameState.cameraY, targetY, 0.1);
    }
    
    // "Floor" logic - if player falls below camera + height, they die
    if (gameState.player.y > gameState.cameraY + CANVAS_HEIGHT + 50) {
        gameState.player.die();
    }
}