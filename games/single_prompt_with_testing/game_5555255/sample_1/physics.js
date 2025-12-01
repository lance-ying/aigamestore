/**
 * Physics engine handling collision detection and resolution
 */
import { gameState, GRAVITY, FRICTION, BOUNCE_RESTITUTION } from './globals.js';
import { ParticleSystem } from './particles.js';

// Helper to check collision between circle and rectangle
// Returns collision manifold { colliding: boolean, normal: {x, y}, depth: number, point: {x, y} }
export function checkCircleRect(circle, rect) {
    // Find the closest point on the rectangle to the circle center
    let closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    let closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

    let dx = circle.x - closestX;
    let dy = circle.y - closestY;
    let distanceSquared = dx * dx + dy * dy;

    if (distanceSquared < (circle.radius * circle.radius)) {
        let distance = Math.sqrt(distanceSquared);
        
        // Handle case where center is inside rect (distance is 0)
        let normalX, normalY, depth;
        
        if (distance === 0) {
            // Determine direction to push out based on closest edge
            // Simple heuristic: push out closest side
            let distLeft = circle.x - rect.x;
            let distRight = (rect.x + rect.width) - circle.x;
            let distTop = circle.y - rect.y;
            let distBottom = (rect.y + rect.height) - circle.y;
            
            let minDist = Math.min(distLeft, distRight, distTop, distBottom);
            
            if (minDist === distTop) { normalX = 0; normalY = -1; depth = circle.radius + distTop; }
            else if (minDist === distBottom) { normalX = 0; normalY = 1; depth = circle.radius + distBottom; }
            else if (minDist === distLeft) { normalX = -1; normalY = 0; depth = circle.radius + distLeft; }
            else { normalX = 1; normalY = 0; depth = circle.radius + distRight; }
        } else {
            normalX = dx / distance;
            normalY = dy / distance;
            depth = circle.radius - distance;
        }

        return {
            colliding: true,
            normal: { x: normalX, y: normalY },
            depth: depth,
            point: { x: closestX, y: closestY }
        };
    }

    return { colliding: false };
}

// Resolve collisions for the player
export function updatePhysics(p, player) {
    // 1. Apply Forces
    player.vy += GRAVITY;
    player.vx *= FRICTION;

    // 2. Update Position
    player.x += player.vx;
    player.y += player.vy;

    // 3. Ground/Platform Collisions
    player.onGround = false;

    // Check all platforms
    for (let platform of gameState.platforms) {
        let col = checkCircleRect(player, platform);
        
        if (col.colliding) {
            // Position Correction
            player.x += col.normal.x * col.depth;
            player.y += col.normal.y * col.depth;

            // Velocity Resolution
            // Reflect velocity vector across normal
            let dot = player.vx * col.normal.x + player.vy * col.normal.y;
            
            // Apply bounce if moving towards the object
            if (dot < 0) {
                // Specialized handling for platform types
                let restitution = BOUNCE_RESTITUTION;
                let friction = 1.0;

                if (platform.type === 'BOUNCY') {
                    restitution = 1.2; // Super bounce
                    // Create particles on bounce
                    gameState.particles.push(new ParticleSystem(col.point.x, col.point.y, 'BOUNCE'));
                } else if (platform.type === 'ICE') {
                    friction = 0.99; // Less friction
                } else if (platform.type === 'SAND') {
                    friction = 0.8; // More friction
                    restitution = 0.2; // Damping
                }

                // If platform is moving, add its velocity
                if (platform.vx) player.vx += platform.vx;
                if (platform.vy) player.vy += platform.vy;

                // Stop sinking
                let jx = - (1 + restitution) * dot * col.normal.x;
                let jy = - (1 + restitution) * dot * col.normal.y;
                
                player.vx += jx;
                player.vy += jy;
                
                // If normal is upwards, we are on ground
                if (col.normal.y < -0.7) {
                    player.onGround = true;
                    // Apply extra friction on ground to prevent infinite sliding
                    player.vx *= 0.95; 
                }
            }
        }
    }

    // 4. Hazard Collisions
    for (let hazard of gameState.hazards) {
        // Simple circle check usually enough for spikes which are often triangles
        // We approximate spikes as small rects or use specialized checks.
        // For simplicity, treating spikes as rects for collision trigger, but lethal.
        let col = checkCircleRect(player, hazard);
        if (col.colliding) {
            player.die();
            return;
        }
    }

    // 5. Collectible Collisions
    for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
        let c = gameState.collectibles[i];
        let dx = player.x - c.x;
        let dy = player.y - c.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < player.radius + c.radius) {
            gameState.score += c.value;
            // Spawn particles
            gameState.particles.push(new ParticleSystem(c.x, c.y, 'COLLECT'));
            
            // Remove collectible
            gameState.collectibles.splice(i, 1);
        }
    }

    // 6. World Bounds
    if (player.y > gameState.cameraY + 600) { // Fell off world
        player.die();
    }
}