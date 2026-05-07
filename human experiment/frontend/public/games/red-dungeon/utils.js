import { TILE_SIZE } from './globals.js';

export function getGridKey(gx, gy) {
    return `${gx},${gy}`;
}

export function gridToWorld(gx, gy) {
    return {
        x: gx * TILE_SIZE,
        y: gy * TILE_SIZE
    };
}

export function worldToGrid(wx, wy) {
    return {
        gx: Math.round(wx / TILE_SIZE),
        gy: Math.round(wy / TILE_SIZE)
    };
}

export function checkRectCollision(r1, r2) {
    return (
        r1.x < r2.x + r2.w &&
        r1.x + r1.w > r2.x &&
        r1.y < r2.y + r2.h &&
        r1.y + r1.h > r2.y
    );
}

// Linear Interpolation
export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

// Ease Out Cubic
export function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
}