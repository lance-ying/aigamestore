import { gameState } from './globals.js';
import { collideRectCircle, collidePointCircle, collideCircleCircle } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

export class PhysicsEngine {
    static checkCollision(player, platforms) {
        let onGround = false;
        
        // Simple AABB/Circle resolution logic
        // We check collisions and push the player out
        
        for (const platform of platforms) {
            // Optimization: Only check nearby platforms
            if (platform.x > player.x + player.radius + 50 || 
                platform.x + platform.width < player.x - player.radius - 50) continue;

            const hit = collideRectCircle(
                platform.x, platform.y, platform.width, platform.height,
                player.x, player.y, player.radius * 2
            );

            if (hit) {
                PhysicsEngine.resolveCollision(player, platform);
                // Check if we landed on top
                if (player.y < platform.y && player.vy >= 0) {
                    // Refined check: is center mostly above?
                    if (player.y + player.radius <= platform.y + 10) {
                        onGround = true;
                    }
                }
            }
        }
        
        return onGround;
    }

    static resolveCollision(circle, rect) {
        // Find closest point on rect to circle center
        let testX = circle.x;
        let testY = circle.y;

        if (circle.x < rect.x) testX = rect.x;
        else if (circle.x > rect.x + rect.width) testX = rect.x + rect.width;
        
        if (circle.y < rect.y) testY = rect.y;
        else if (circle.y > rect.y + rect.height) testY = rect.y + rect.height;

        const distX = circle.x - testX;
        const distY = circle.y - testY;
        const distance = Math.sqrt(distX * distX + distY * distY);

        if (distance <= circle.radius) {
            // Normalize direction
            let nx = distX / distance;
            let ny = distY / distance;
            
            // If center is inside (distance 0), push up
            if (distance === 0) {
                nx = 0; 
                ny = -1;
            }

            const overlap = circle.radius - distance;

            // Apply resolution
            circle.x += nx * overlap;
            circle.y += ny * overlap;

            // Friction / Slide response
            // If hitting a wall (nx dominant), kill X velocity
            if (Math.abs(nx) > Math.abs(ny)) {
                circle.vx *= 0.5;
            } else {
                // Hitting floor/ceiling
                circle.vy = 0;
            }
        }
    }

    static checkHazardCollision(player, hazards) {
        for (const hazard of hazards) {
            // Hazard is usually a triangle or circle. Let's assume triangle spikes for now or small circles.
            // Using simpler point checks or circle checks
            
            if (hazard.type === 'SPIKE') {
                // AABB check first
                if (player.x + player.radius < hazard.x || player.x - player.radius > hazard.x + hazard.width) continue;
                
                // Detailed check - treat spike as triangle
                // Vertices: (x, y+h), (x+w/2, y), (x+w, y+h)
                const p1 = { x: hazard.x, y: hazard.y + hazard.height };
                const p2 = { x: hazard.x + hazard.width / 2, y: hazard.y };
                const p3 = { x: hazard.x + hazard.width, y: hazard.y + hazard.height };
                
                // p5.collide2D uses arrays of vectors or xy objects
                // We'll approximate spike collision as a circle-polygon collision
                // Or simplified: check distance to center if close
                
                // For robustness, define a hitbox smaller than visual
                const hit = collideCircleCircle(player.x, player.y, player.radius * 2, hazard.x + hazard.width/2, hazard.y + hazard.height/2, hazard.width);
                if (hit) return true;
            }
        }
        return false;
    }
}