import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, RESTITUTION } from './globals.js';
import { collideCircleCircle, collidePointRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

// Check collision between ball and hoop rims
export function checkHoopCollisions(player, hoop, p) {
    let collided = false;

    // Hoop consists of two rims (circles)
    const rims = [
        { x: hoop.x - hoop.width / 2, y: hoop.y }, // Left/Front rim
        { x: hoop.x + hoop.width / 2, y: hoop.y }  // Right/Back rim
    ];

    rims.forEach(rim => {
        // Check collision using p5.collide2D or simple distance
        const dx = player.x - rim.x;
        const dy = player.y - rim.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = player.radius + hoop.rimRadius;

        if (dist < minDist) {
            collided = true;
            
            // Resolve Collision (Elastic bounce)
            // Normal vector
            const nx = dx / dist;
            const ny = dy / dist;

            // Penetration depth
            const overlap = minDist - dist;
            
            // Separate
            player.x += nx * overlap;
            player.y += ny * overlap;

            // Reflect velocity
            // v' = v - (1 + e) * (v . n) * n
            const dotProduct = player.vx * nx + player.vy * ny;
            
            // Only bounce if moving towards the collider
            if (dotProduct < 0) {
                const impulse = -(1 + RESTITUTION) * dotProduct;
                player.vx += impulse * nx;
                player.vy += impulse * ny;
            }
        }
    });

    return collided;
}

// Check if player scored (passed through sensor)
export function checkScore(player, hoop) {
    if (hoop.scored) return "NONE";

    // Sensor area between rims
    // We strictly check if the ball crosses the line segment defined by the rims moving downwards
    
    // Check if player is within the horizontal bounds of the hoop
    const withinX = player.x > (hoop.x - hoop.width/2 + player.radius) && 
                    player.x < (hoop.x + hoop.width/2 - player.radius);
    
    // Check if player crossed the Y threshold downwards
    // We use previous Y to detect crossing
    const crossedY = player.prevY <= hoop.y && player.y > hoop.y;

    if (withinX && crossedY) {
        hoop.scored = true;
        
        // Determine if Swish (perfect shot)
        // Swish if the ball is close to the center X
        const centerDist = Math.abs(player.x - hoop.x);
        const isSwish = centerDist < 10;
        
        return isSwish ? "SWISH" : "NORMAL";
    }

    return "NONE";
}

export function checkWorldBounds(player) {
    // Floor
    if (player.y + player.radius >= CANVAS_HEIGHT) {
        return true; // Hit ground
    }
    
    // Ceiling
    if (player.y - player.radius <= 0) {
        return true; // Hit ceiling
    }
    
    return false;
}