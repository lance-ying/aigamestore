import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function dist(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

export function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

export function checkCircleCollision(c1, c2) {
    const d = dist(c1.x, c1.y, c2.x, c2.y);
    return d < (c1.radius + c2.radius);
}

export function checkRectCircleCollision(rect, circle) {
    // Closest point on rect to circle center
    let testX = circle.x;
    let testY = circle.y;

    if (circle.x < rect.x) testX = rect.x;
    else if (circle.x > rect.x + rect.w) testX = rect.x + rect.w;

    if (circle.y < rect.y) testY = rect.y;
    else if (circle.y > rect.y + rect.h) testY = rect.y + rect.h;

    const distX = circle.x - testX;
    const distY = circle.y - testY;
    const distance = Math.sqrt((distX * distX) + (distY * distY));

    return distance <= circle.radius;
}