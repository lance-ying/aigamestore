import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

// Simple AABB Collision
export function checkRectCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Circle to Rectangle Collision
// Returns collision info or null
export function checkCircleRectCollision(circle, rect) {
    // Find closest point on rect to circle center
    let testX = circle.x;
    let testY = circle.y;
    
    if (circle.x < rect.x) testX = rect.x;
    else if (circle.x > rect.x + rect.width) testX = rect.x + rect.width;
    
    if (circle.y < rect.y) testY = rect.y;
    else if (circle.y > rect.y + rect.height) testY = rect.y + rect.height;
    
    let distX = circle.x - testX;
    let distY = circle.y - testY;
    let distance = Math.sqrt((distX * distX) + (distY * distY));
    
    if (distance <= circle.radius) {
        return {
            collided: true,
            distance: distance,
            normalX: (distance > 0) ? distX / distance : 0, // Approx normal
            normalY: (distance > 0) ? distY / distance : -1, // Default up if inside
            closestX: testX,
            closestY: testY,
            overlap: circle.radius - distance
        };
    }
    return null;
}

// Resolve collisions for the player
export function resolvePlayerCollisions(player) {
    player.onGround = false;
    
    // Check platforms
    for (let platform of gameState.platforms) {
        const collision = checkCircleRectCollision(player, platform);
        
        if (collision) {
            // Determine side of collision
            // We mainly care about floor (top of rect) vs walls
            
            // Simple resolution: push out along the axis of least overlap
            // But for platformer feel, we check relative positions
            
            // Check if player was previously above the platform
            const prevBottom = player.lastY + player.radius;
            
            // Top collision (Floor)
            if (player.y < platform.y && Math.abs(player.x - collision.closestX) < player.radius * 0.9) {
                // Landed on top
                player.y = platform.y - player.radius;
                player.vy = 0;
                player.onGround = true;
            }
            // Bottom collision (Ceiling)
            else if (player.y > platform.y + platform.height) {
                player.y = platform.y + platform.height + player.radius;
                player.vy *= -0.5; // Bounce off ceiling slightly
            }
            // Side collisions
            else {
                // Push horizontally
                if (player.x < platform.x) {
                    player.x = platform.x - player.radius;
                    player.vx = 0;
                } else {
                    player.x = platform.x + platform.width + player.radius;
                    player.vx = 0;
                }
            }
        }
    }
    
    // Check Hazard Collisions
    for (let hazard of gameState.hazards) {
        // Assume hazards are triangular spikes or rects
        // Using circle-rect for hitbox simplicity, or point check
        
        // Simple distance check for now or AABB
        // Approximating hazard as a smaller rect inside its bounds
        const hazardRect = {
            x: hazard.x + 5,
            y: hazard.y + 10,
            width: hazard.width - 10,
            height: hazard.height - 10
        };
        
        const collision = checkCircleRectCollision(player, hazardRect);
        if (collision) {
            player.die();
        }
    }
    
    // World Bounds
    if (player.x < player.radius) {
        player.x = player.radius;
        player.vx = 0;
    }
    // No right bound usually in scrolling games, but let's clamp to extreme if needed
    // Bottom bound is death
    if (player.y > CANVAS_HEIGHT + 200 + gameState.cameraY) { // Fall off world
        player.die();
    }
}