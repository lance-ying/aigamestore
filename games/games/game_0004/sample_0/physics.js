// physics.js
// Physics engine for Leo's Fortune clone
import { gameState } from './globals.js';
import { collideRectCircle, collideCircleCircle } from 'https://unpkg.com/p5.collide2d@0.7.3/p5.collide2d.js';

export function checkCollision(circle, rect) {
    return collideRectCircle(rect.x, rect.y, rect.width, rect.height, circle.x, circle.y, circle.radius * 2);
}

// Custom resolution for smooth rolling on rectangles
// Pushes the circle out of the rectangle along the shallowest axis
export function resolveCircleRectCollision(circle, rect) {
    // Find the closest point on the rectangle to the circle center
    let closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    let closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

    // Calculate vector from closest point to circle center
    let dx = circle.x - closestX;
    let dy = circle.y - closestY;
    let distanceSq = dx * dx + dy * dy;

    // Check collision (distance < radius)
    if (distanceSq > 0 && distanceSq < circle.radius * circle.radius) {
        let distance = Math.sqrt(distanceSq);
        
        // Normalize vector
        let nx = dx / distance;
        let ny = dy / distance;
        
        // Calculate penetration depth
        let penetration = circle.radius - distance;
        
        // Move circle out
        circle.x += nx * penetration;
        circle.y += ny * penetration;
        
        // Adjust velocity (simple reflection/slide)
        // Project velocity onto normal
        let dot = circle.vx * nx + circle.vy * ny;
        
        // Apply response if moving towards the object
        if (dot < 0) {
            // Remove velocity along normal (inelastic collision mostly, for rolling)
            // But we want to keep tangential velocity for rolling
            
            // Tangent vector
            let tx = -ny;
            let ty = nx;
            
            // Project velocity onto tangent
            let tanDot = circle.vx * tx + circle.vy * ty;
            
            circle.vx = tx * tanDot;
            circle.vy = ty * tanDot;
            
            // If the normal is pointing up (ground), set onGround flag
            if (ny < -0.5) {
                circle.onGround = true;
            }
            // If normal is pointing down (ceiling), bump head
            if (ny > 0.5) {
                circle.vy *= 0.5; // Dampen ceiling bumps
            }
        }
    }
}

// Simpler AABB check for optimization
export function checkAABB(entity1, entity2) {
    // Entities usually have x, y, radius or width/height
    // Convert circle to bounding box for broad phase
    let r1 = entity1.radius || 0;
    let w1 = entity1.width || r1 * 2;
    let h1 = entity1.height || r1 * 2;
    let x1 = entity1.radius ? entity1.x - r1 : entity1.x;
    let y1 = entity1.radius ? entity1.y - r1 : entity1.y;

    let r2 = entity2.radius || 0;
    let w2 = entity2.width || r2 * 2;
    let h2 = entity2.height || r2 * 2;
    let x2 = entity2.radius ? entity2.x - r2 : entity2.x;
    let y2 = entity2.radius ? entity2.y - r2 : entity2.y;

    return (
        x1 < x2 + w2 &&
        x1 + w1 > x2 &&
        y1 < y2 + h2 &&
        y1 + h1 > y2
    );
}