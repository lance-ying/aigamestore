import { collideRectRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class AABB {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
}

export function checkCollisions(entity) {
    // Wall/Ground Collisions
    entity.onGround = false;
    entity.pushRight = false;
    entity.pushLeft = false;
    entity.pushTop = false;

    // Check against Platforms
    for (let plat of gameState.platforms) {
        // Broad phase check using simple AABB expansion
        if (entity.x + entity.width + Math.abs(entity.vx) > plat.x &&
            entity.x - Math.abs(entity.vx) < plat.x + plat.width &&
            entity.y + entity.height + Math.abs(entity.vy) > plat.y &&
            entity.y - Math.abs(entity.vy) < plat.y + plat.height) {
            
            resolveCollision(entity, plat);
        }
    }

    // Screen Bounds
    if (entity.x < 0) {
        entity.x = 0;
        entity.vx = 0;
    }
    // Don't clamp right side to allow level progression, but level should have walls
}

function resolveCollision(entity, obstacle) {
    // Previous positions
    const prevBottom = entity.prevY + entity.height;
    const prevTop = entity.prevY;
    const prevRight = entity.prevX + entity.width;
    const prevLeft = entity.prevX;

    const bottom = entity.y + entity.height;
    const top = entity.y;
    const right = entity.x + entity.width;
    const left = entity.x;

    // Determine direction of collision based on previous frame relative position
    
    // Landing on top
    if (prevBottom <= obstacle.y && bottom >= obstacle.y) {
        entity.y = obstacle.y - entity.height;
        entity.vy = 0;
        entity.onGround = true;
        return;
    }
    
    // Hitting bottom (ceiling)
    if (prevTop >= obstacle.y + obstacle.height && top <= obstacle.y + obstacle.height) {
        entity.y = obstacle.y + obstacle.height;
        entity.vy = 0;
        return;
    }
    
    // Hitting left side of obstacle
    if (prevRight <= obstacle.x && right >= obstacle.x) {
        entity.x = obstacle.x - entity.width;
        entity.vx = 0;
        return;
    }
    
    // Hitting right side of obstacle
    if (prevLeft >= obstacle.x + obstacle.width && left <= obstacle.x + obstacle.width) {
        entity.x = obstacle.x + obstacle.width;
        entity.vx = 0;
        return;
    }
}

export function checkEntityCollision(ent1, ent2) {
    return collideRectRect(ent1.x, ent1.y, ent1.width, ent1.height, ent2.x, ent2.y, ent2.width, ent2.height);
}