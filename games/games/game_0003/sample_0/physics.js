import { collideRectCircle, collideCircleCircle, collidePointCircle } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';
import { gameState } from './globals.js';

export function checkCollisions() {
    const player = gameState.player;
    if (!player) return;

    // 1. Platforms (Rectangles)
    player.isGrounded = false;
    
    // Sort platforms by distance to optimize? For now, just iterate.
    for (const plat of gameState.platforms) {
        // Simple AABB broadphase check
        if (player.x + player.radius + 10 > plat.x && 
            player.x - player.radius - 10 < plat.x + plat.w &&
            player.y + player.radius + 10 > plat.y && 
            player.y - player.radius - 10 < plat.y + plat.h) {
            
            // Detailed collision
            const hit = collideRectCircle(plat.x, plat.y, plat.w, plat.h, player.x, player.y, player.radius * 2);
            
            if (hit) {
                resolveCircleRect(player, plat);
            }
        }
    }

    // 2. Hazards
    for (const hazard of gameState.hazards) {
        let hit = false;
        if (hazard.type === 'spike') {
             // Treat spikes as triangles
             // Simple hitbox: smaller circle or point checks
             hit = collidePointCircle(hazard.x, hazard.y - hazard.h/2, player.x, player.y, player.radius * 2 * 0.8);
             if (!hit) {
                 // Check base corners
                 hit = collidePointCircle(hazard.x - hazard.w/2, hazard.y + hazard.h/2, player.x, player.y, player.radius * 2 * 0.8) ||
                       collidePointCircle(hazard.x + hazard.w/2, hazard.y + hazard.h/2, player.x, player.y, player.radius * 2 * 0.8);
             }
        } else {
            // Rect hazard
             hit = collideRectCircle(hazard.x, hazard.y, hazard.w, hazard.h, player.x, player.y, player.radius * 2 * 0.9);
        }

        if (hit) {
            player.die();
            return; // Stop processing physics if dead
        }
    }

    // 3. Collectibles
    for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
        const c = gameState.collectibles[i];
        if (collideCircleCircle(player.x, player.y, player.radius * 2, c.x, c.y, c.r * 2)) {
            c.collect();
            gameState.collectibles.splice(i, 1);
        }
    }
    
    // 4. Exit
    if (gameState.exit && gameState.score >= gameState.totalCoinsInLevel) {
        const exit = gameState.exit;
        if (collideCircleCircle(player.x, player.y, player.radius * 2, exit.x, exit.y, exit.r * 2)) {
            gameState.gamePhase = "LEVEL_COMPLETE";
        }
    }
}

function resolveCircleRect(circle, rect) {
    // Determine closest point on rect to circle center
    let testX = circle.x;
    let testY = circle.y;

    if (circle.x < rect.x) testX = rect.x;
    else if (circle.x > rect.x + rect.w) testX = rect.x + rect.w;

    if (circle.y < rect.y) testY = rect.y;
    else if (circle.y > rect.y + rect.h) testY = rect.y + rect.h;

    const distX = circle.x - testX;
    const distY = circle.y - testY;
    const distance = Math.sqrt((distX * distX) + (distY * distY));

    if (distance <= circle.radius) {
        // Collision normal
        let nx = distX;
        let ny = distY;
        
        // Normalize
        if (distance === 0) { 
            // Center is inside rect, push up by default
            ny = -1; nx = 0; 
        } else {
            nx /= distance;
            ny /= distance;
        }

        // Penetration depth
        const depth = circle.radius - distance;

        // Resolve position
        circle.x += nx * depth;
        circle.y += ny * depth;

        // Velocity resolution
        // Check relative velocity
        const velAlongNormal = circle.vx * nx + circle.vy * ny;

        // Only resolve if moving towards object
        if (velAlongNormal < 0) {
            const restitution = 0.2; // Little bounce
            
            // Apply impulse
            let j = -(1 + restitution) * velAlongNormal;
            
            circle.vx += j * nx;
            circle.vy += j * ny;

            // Friction
            if (ny < -0.7) { // Top collision (Ground)
                circle.isGrounded = true;
                // Friction logic handled in entity update based on flag
            }
        }
    }
}