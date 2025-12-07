import { TILE_SIZE } from './globals.js';

// Convert world coordinate to grid coordinate
export function worldToGrid(val) {
    return Math.floor(val / TILE_SIZE);
}

// Generate spatial key for map
export function getMapKey(col, row) {
    return `${col},${row}`;
}

// Check AABB Intersection
export function checkAABB(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Random Range with Seed (using p5 instance)
export function randomRange(p, min, max) {
    return p.random(min, max);
}

// Pick random from array
export function randomChoice(p, arr) {
    return arr[Math.floor(p.random(arr.length))];
}