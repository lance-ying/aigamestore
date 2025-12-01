import { gameState } from './globals.js';
import { collideRectCircle, collideLineCircle, collidePointCircle } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@0.7.3/p5.collide2d.js';

/**
 * Checks and resolves collisions between a circular entity (Player) and rectangular platforms/obstacles.
 * Uses a projection method to push the entity out of the collider.
 */
export function resolveCircleRectCollision(circle, rect) {
    // Basic AABB check first for performance
    if (circle.x + circle.radius < rect.x ||
        circle.x - circle.radius > rect.x + rect.width ||
        circle.y + circle.radius < rect.y ||
        circle.y - circle.radius > rect.y + rect.height) {
        return false;
    }

    // Find the closest point on the rectangle to the circle center
    let closestX = clamp(circle.x, rect.x, rect.x + rect.width);
    let closestY = clamp(circle.y, rect.y, rect.y + rect.height);

    // Calculate the distance vector
    let distanceX = circle.x - closestX;
    let distanceY = circle.y - closestY;

    // If distance is less than radius, collision occurred
    let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    let radiusSquared = circle.radius * circle.radius;

    if (distanceSquared < radiusSquared && distanceSquared > 0) {
        let distance = Math.sqrt(distanceSquared);
        
        // Calculate overlap
        let overlap = circle.radius - distance;
        
        // Normalize distance vector
        let nx = distanceX / distance;
        let ny = distanceY / distance;

        // Move circle out of collision
        circle.x += nx * overlap;
        circle.y += ny * overlap;

        // Adjust velocity based on normal
        // Project velocity onto the normal
        let dot = circle.vx * nx + circle.vy * ny;
        
        // Apply bounce/slide
        if (dot < 0) {
            // Remove velocity component towards the wall
            circle.vx -= dot * nx;
            circle.vy -= dot * ny;
            
            // Apply friction if touching a surface
            // Identify if floor, ceiling, or wall based on normal
            if (ny < -0.5) { // Floor
                circle.onGround = true;
                // Friction
                circle.vx *= rect.friction || 0.8;
            } else if (ny > 0.5) { // Ceiling
                circle.vy *= 0.5; // Dampen ceiling hit
            }
        }
        
        return true;
    }
    
    // Handle case where center is inside rect (deep penetration)
    if (distanceSquared === 0) {
        // Push up by default if exactly inside
        circle.y -= circle.radius;
        return true;
    }

    return false;
}

export function checkCircleTriangleCollision(circle, triangle) {
    // Using p5.collide2D logic equivalent for poly-circle
    // Simple check: distance to vertices and distance to line segments
    
    // Check vertices
    if (distSq(circle.x, circle.y, triangle.x1, triangle.y1) < circle.radius * circle.radius) return true;
    if (distSq(circle.x, circle.y, triangle.x2, triangle.y2) < circle.radius * circle.radius) return true;
    if (distSq(circle.x, circle.y, triangle.x3, triangle.y3) < circle.radius * circle.radius) return true;

    // Check edges
    if (collideLineCircle(triangle.x1, triangle.y1, triangle.x2, triangle.y2, circle.x, circle.y, circle.radius)) return true;
    if (collideLineCircle(triangle.x2, triangle.y2, triangle.x3, triangle.y3, circle.x, circle.y, circle.radius)) return true;
    if (collideLineCircle(triangle.x3, triangle.y3, triangle.x1, triangle.y1, circle.x, circle.y, circle.radius)) return true;

    // Check if center is inside
    if (pointInTriangle(circle.x, circle.y, triangle.x1, triangle.y1, triangle.x2, triangle.y2, triangle.x3, triangle.y3)) return true;

    return false;
}

// Utilities
function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
}

function distSq(x1, y1, x2, y2) {
    return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
}

function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
    // Barycentric coordinates technique
    let areaOrig = Math.abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1));
    let area1 = Math.abs((x1 - px) * (y2 - py) - (x2 - px) * (y1 - py));
    let area2 = Math.abs((x2 - px) * (y3 - py) - (x3 - px) * (y2 - py));
    let area3 = Math.abs((x3 - px) * (y1 - py) - (x1 - px) * (y3 - py));
    return Math.abs(area1 + area2 + area3 - areaOrig) < 0.1;
}