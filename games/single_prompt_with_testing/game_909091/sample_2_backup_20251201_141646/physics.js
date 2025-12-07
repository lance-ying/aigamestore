/**
 * Physics and collision detection system
 */
// Removed: import { collideRectRect } from 'https://unpkg.com/p5.collide2d@0.7.3/p5.collide2d.js';
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export function checkAABB(rect1, rect2) {
    // Access collideRectRect from the global p5 prototype
    return window.p5.prototype.collideRectRect(
        rect1.x, rect1.y, rect1.width, rect1.height,
        rect2.x, rect2.y, rect2.width, rect2.height
    );
}

// Simple bounding box class
export class AABB {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }
}

/**
 * Resolves collision between a dynamic entity and static map geometry
 */
export function resolveMapCollision(entity, walls) {
    entity.onGround = false;
    entity.onWall = false;
    entity.wallSide = 0; // -1 left, 1 right

    for (let wall of walls) {
        // Expand wall bounds slightly for robust checking
        // Check if close enough to matter
        if (Math.abs(entity.x - wall.x) > 100 || Math.abs(entity.y - wall.y) > 100) continue;

        // Check intersection
        if (checkAABB(entity, wall)) {
            // Determine penetration depth
            const overlapX = (entity.width + wall.width) / 2 - Math.abs((entity.x + entity.width / 2) - (wall.x + wall.width / 2));
            const overlapY = (entity.height + wall.height) / 2 - Math.abs((entity.y + entity.height / 2) - (wall.y + wall.height / 2));

            // Resolve along shallowest axis
            if (overlapX < overlapY) {
                // Horizontal collision
                if (entity.x < wall.x) {
                    entity.x -= overlapX;
                    entity.wallSide = 1; // Wall is on right
                } else {
                    entity.x += overlapX;
                    entity.wallSide = -1; // Wall is on left
                }
                entity.vx = 0;
                entity.onWall = true;
            } else {
                // Vertical collision
                if (entity.y < wall.y) {
                    entity.y -= overlapY;
                    entity.vy = 0;
                    entity.onGround = true;
                } else {
                    entity.y += overlapY;
                    entity.vy = 0;
                }
            }
        }
    }
}