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
    // onGround, onWall, wallSide are reset at the beginning of Player.update
    // and set here if a collision occurs.

    for (let wall of walls) {
        // Optimization: Check if close enough to matter using broadphase AABB
        // Previous check was flawed for wide walls: Math.abs(entity.x - wall.x) > entity.width + 10
        if (entity.x + entity.width + 20 < wall.x || 
            entity.x > wall.x + wall.width + 20 ||
            entity.y + entity.height + 20 < wall.y ||
            entity.y > wall.y + wall.height + 20) {
            continue;
        }

        // Check intersection
        if (checkAABB(entity, wall)) {
            // Determine penetration depth
            const overlapX = (entity.width + wall.width) / 2 - Math.abs((entity.x + entity.width / 2) - (wall.x + wall.width / 2));
            const overlapY = (entity.height + wall.height) / 2 - Math.abs((entity.y + entity.height / 2) - (wall.y + wall.height / 2));

            // Resolve along shallowest axis
            if (overlapX < overlapY) {
                // Horizontal collision
                if (entity.x < wall.x) { // Entity hit wall from left
                    entity.x = wall.x - entity.width;
                    entity.wallSide = 1; // Wall is on right relative to player
                } else { // Entity hit wall from right
                    entity.x = wall.x + wall.width;
                    entity.wallSide = -1; // Wall is on left relative to player
                }
                entity.vx = 0;
                entity.onWall = true;
            } else {
                // Vertical collision
                if (entity.y < wall.y) { // Entity hit wall from top (landing on it)
                    entity.y = wall.y - entity.height;
                    entity.vy = 0;
                    entity.onGround = true;
                } else { // Entity hit wall from bottom (jumping into it)
                    entity.y = wall.y + wall.height;
                    entity.vy = 0;
                }
            }
        }
    }
}