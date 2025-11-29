// utils.js
// Utility functions for math and generation

export function dist(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

export function rectIntersect(r1, r2) {
    return !(r2.x > r1.x + r1.w || 
             r2.x + r2.w < r1.x || 
             r2.y > r1.y + r1.h || 
             r2.y + r2.h < r1.y);
}

// Custom seeded random to ensure reproducibility within p5 instance context if needed, 
// though we use p.random(). This is a helper for logic outside p5 draw loop if necessary.
// For this game, we pass 'p' to most update functions, so we use p.random().

export function checkCircleRectCollision(circle, rect) {
    // Find the closest point to the circle within the rectangle
    let closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
    let closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));

    // Calculate the distance between the circle's center and this closest point
    let distanceX = circle.x - closestX;
    let distanceY = circle.y - closestY;

    // If the distance is less than the circle's radius, an intersection occurs
    let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    return distanceSquared < (circle.r * circle.r);
}