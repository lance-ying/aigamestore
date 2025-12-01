// AABB Collision Detection
export function checkRectCollision(r1, r2) {
    return (
        r1.x < r2.x + r2.w &&
        r1.x + r1.w > r2.x &&
        r1.y < r2.y + r2.h &&
        r1.y + r1.h > r2.y
    );
}

export function checkCircleRectCollision(circle, rect) {
    // Find closest point on rect to circle center
    let testX = circle.x;
    let testY = circle.y;

    if (circle.x < rect.x) testX = rect.x;
    else if (circle.x > rect.x + rect.w) testX = rect.x + rect.w;

    if (circle.y < rect.y) testY = rect.y;
    else if (circle.y > rect.y + rect.h) testY = rect.y + rect.h;

    let distX = circle.x - testX;
    let distY = circle.y - testY;
    let distance = Math.sqrt((distX * distX) + (distY * distY));

    return distance <= circle.r;
}

export function checkCircleCollision(c1, c2) {
    let dx = c1.x - c2.x;
    let dy = c1.y - c2.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    return dist < c1.r + c2.r;
}

// Spatial Hash for broadphase (simple implementation for this scale)
export function getNearbyEntities(entity, entities, range = 200) {
    return entities.filter(e => 
        Math.abs(e.x - entity.x) < range && 
        Math.abs(e.y - entity.y) < range
    );
}