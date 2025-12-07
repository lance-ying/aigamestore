import { gameState, GRAVITY, TERMINAL_VELOCITY, WORLD_HEIGHT } from './globals.js';

/**
 * Basic AABB collision detection
 */
export function checkAABB(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

/**
 * Resolves collisions between a dynamic entity and static blocks.
 * Updates entity position and velocity.
 */
export function resolveMapCollisions(entity, blocks) {
    entity.onGround = false;
    
    // Horizontal collision
    let nextX = entity.x + entity.vx;
    let entityRectX = { x: nextX, y: entity.y, width: entity.width, height: entity.height };
    
    for (let block of blocks) {
        if (checkAABB(entityRectX, block)) {
            if (entity.vx > 0) { // Moving right
                entity.x = block.x - entity.width;
                entity.vx = 0;
            } else if (entity.vx < 0) { // Moving left
                entity.x = block.x + block.width;
                entity.vx = 0;
            }
            break; // Handle one collision per axis is usually enough for simple platformers
        }
    }
    if (entity.vx !== 0) entity.x += entity.vx;

    // Vertical collision
    let nextY = entity.y + entity.vy;
    let entityRectY = { x: entity.x, y: nextY, width: entity.width, height: entity.height };
    
    for (let block of blocks) {
        if (checkAABB(entityRectY, block)) {
            if (entity.vy > 0) { // Falling
                entity.y = block.y - entity.height;
                entity.vy = 0;
                entity.onGround = true;
                entity.isJumping = false;
                entity.jumpCount = 0;
            } else if (entity.vy < 0) { // Jumping up
                entity.y = block.y + block.height;
                entity.vy = 0;
            }
            break;
        }
    }
    
    if (!entity.onGround) {
        entity.y += entity.vy;
    }

    // World bounds
    if (entity.y > WORLD_HEIGHT + 100) {
        // Fell off world
        entity.die();
    }
}

export function applyGravity(entity) {
    if (!entity.onGround) {
        entity.vy += GRAVITY;
        if (entity.vy > TERMINAL_VELOCITY) entity.vy = TERMINAL_VELOCITY;
    }
}