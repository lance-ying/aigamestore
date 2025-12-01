import { gameState, CANVAS_HEIGHT, CANVAS_WIDTH, GRAVITY } from './globals.js';

// Axis-Aligned Bounding Box Collision
export function checkAABB(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Check collision between a physics entity and platforms
export function resolvePlatformCollisions(entity) {
    entity.onGround = false;

    // Ground plane (fallback)
    const groundLevel = CANVAS_HEIGHT - 40;
    if (entity.y + entity.height >= groundLevel) {
        entity.y = groundLevel - entity.height;
        entity.vy = 0;
        entity.onGround = true;
    }

    // Platform objects
    for (let platform of gameState.platforms) {
        // Simple one-way platform logic (falling through top)
        // Check if entity is within horizontal bounds of platform
        if (entity.x + entity.width > platform.x && entity.x < platform.x + platform.width) {
            // Check if entity was previously above the platform
            const prevBottom = entity.lastY + entity.height;
            const currentBottom = entity.y + entity.height;
            
            // If falling down and crossing the platform top surface
            if (entity.vy >= 0 && prevBottom <= platform.y && currentBottom >= platform.y) {
                entity.y = platform.y - entity.height;
                entity.vy = 0;
                entity.onGround = true;
            }
        }
    }
}

export function applyPhysics(entity) {
    // Save last position for collision resolution
    entity.lastX = entity.x;
    entity.lastY = entity.y;

    // Apply Gravity
    entity.vy += GRAVITY;

    // Apply Velocity
    entity.x += entity.vx;
    entity.y += entity.vy;

    // Screen Boundaries (Left/Right)
    // We allow scrolling to the right, but maybe stop at left 0
    if (entity.x < 0) {
        entity.x = 0;
        entity.vx = 0;
    }
    
    // World end boundary (arbitrary large number or generated)
    // For this game, let's say world width is 3000
    if (entity.x > 3000) {
        entity.x = 3000;
        entity.vx = 0;
    }
}