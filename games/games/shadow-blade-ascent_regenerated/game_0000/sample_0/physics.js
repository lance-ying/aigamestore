import { gameState, CANVAS_HEIGHT } from './globals.js';

// Note: p5.collide2D is loaded via script tag in index.html and extends p5 prototype.
// We implement basic AABB collision detection here for robustness.

export function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

export function resolvePlatformCollisions(entity) {
    entity.onGround = false;
    entity.isClimbing = false; // Reset, set true if overlapping ladder

    // Floor collision
    // const groundY = CANVAS_HEIGHT; // removed simple floor, using platforms mostly
    // But let's keep a bottom kill plane
    if (entity.y > gameState.levelHeight + 100) {
         if (entity.type === 'PLAYER') entity.takeDamage(9999);
         else entity.active = false;
         return;
    }

    // Check platforms
    for (let platform of gameState.platforms) {
        if (checkCollision(entity, platform)) {
            // Ladder logic
            if (platform.type === 'LADDER') {
                // If overlapping ladder, we can climb
                if (entity.type === 'PLAYER') {
                    entity.canClimb = true;
                    // Center player on ladder X if they start climbing
                    // Logic handled in input
                }
                continue;
            }

            // One-way platforms (Drop through)
            if (platform.oneWay) {
                // Only collide if coming from top and feet are above platform center
                // And not pressing down+jump (handled in input to disable collision check)
                if (entity.vy >= 0 && 
                    entity.y + entity.height <= platform.y + entity.vy + 10 && // Tolerance
                    !entity.droppingThrough) {
                    
                    entity.y = platform.y - entity.height;
                    entity.vy = 0;
                    entity.onGround = true;
                }
            } else {
                // Solid block collision resolution
                // Determine simplest resolution axis
                const overlapX = (entity.width + platform.width) / 2 - Math.abs((entity.x + entity.width/2) - (platform.x + platform.width/2));
                const overlapY = (entity.height + platform.height) / 2 - Math.abs((entity.y + entity.height/2) - (platform.y + platform.height/2));

                if (overlapX < overlapY) {
                    // X resolution
                    if (entity.x < platform.x) entity.x -= overlapX;
                    else entity.x += overlapX;
                    entity.vx = 0;
                } else {
                    // Y resolution
                    if (entity.y < platform.y) {
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
}