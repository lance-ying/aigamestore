// physics.js
// Collision detection and basic physics math

// AABB Collision (Axis-Aligned Bounding Box)
export function checkAABB(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Circle to Rectangle Collision
// Returns collision info or null
export function checkCircleRect(circle, rect) {
    // Find the closest point to the circle within the rectangle
    let testX = circle.x;
    let testY = circle.y;

    if (circle.x < rect.x) testX = rect.x;      // Test left edge
    else if (circle.x > rect.x + rect.width) testX = rect.x + rect.width;   // right edge

    if (circle.y < rect.y) testY = rect.y;      // top edge
    else if (circle.y > rect.y + rect.height) testY = rect.y + rect.height; // bottom edge

    // Get distance from closest edges
    let distX = circle.x - testX;
    let distY = circle.y - testY;
    let distance = Math.sqrt((distX * distX) + (distY * distY));

    if (distance <= circle.radius) {
        return {
            collided: true,
            distance: distance,
            normalX: distX / (distance || 1),
            normalY: distY / (distance || 1),
            overlap: circle.radius - distance,
            closestX: testX,
            closestY: testY
        };
    }
    return null;
}

// Circle to Triangle (Spikes) - Simplified as Circle to Point/Line or just multiple points
// For this game, spikes are roughly triangular. We can check circle vs polygon.
// We'll use a simplified check: Circle vs 3 points of triangle + check inside.
export function checkCircleTriangle(circle, p1, p2, p3) {
    // Import collide2d functionality or implement custom.
    // Constraints allow p5.collide2d.
    // Assuming p5.collide2d is loaded in window (via HTML script tag)
    // We can use window.collideCirclePoly
    
    if (window.collideCirclePoly) {
        const poly = [
            {x: p1.x, y: p1.y},
            {x: p2.x, y: p2.y},
            {x: p3.x, y: p3.y}
        ];
        return window.collideCirclePoly(circle.x, circle.y, circle.radius * 2, poly);
    }
    
    // Fallback if library fails
    return false;
}

// Physics Solver for Player vs Platform
export function resolvePlatformCollision(player, platform) {
    const col = checkCircleRect(player, platform);
    if (col && col.collided) {
        // Resolve position
        // If overlap is small and mostly vertical, assume landing/ceiling hit
        // If overlap is horizontal, wall hit
        
        // Simple logic: Push out along the axis of least penetration?
        // Actually, checkCircleRect gives us the closest point. 
        // We push the player away from that point.
        
        let nx = col.normalX;
        let ny = col.normalY;
        
        // Fix for "inside" rect center case where distance is 0
        if (col.distance === 0) {
             // Heuristic: push up
             nx = 0;
             ny = -1;
             col.overlap = player.radius; // Push out fully
        }

        player.x += nx * col.overlap;
        player.y += ny * col.overlap;

        // Adjust velocity (kill velocity into the wall/floor)
        // Dot product of velocity and normal
        let vDotN = player.vx * nx + player.vy * ny;
        if (vDotN < 0) {
            // Remove velocity component along normal
            player.vx -= vDotN * nx;
            player.vy -= vDotN * ny;
            
            // Friction/Restitution
            // If hitting floor (ny < -0.5), apply friction to vx
            if (ny < -0.5) {
                player.onGround = true;
            }
            // If hitting ceiling (ny > 0.5), bounce slightly?
            // If hitting wall (abs(nx) > 0.5), kill x speed
        }
        return true;
    }
    return false;
}