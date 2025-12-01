import { gameState, CANVAS_HEIGHT } from './globals.js';
import { collideRectRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@0.7.3/p5.collide2d.js'; // Pseudo-import for context, actually loaded via script tag

// Note: p5.collide2D functions are globally available via window.p5.prototype usually, 
// or simpler, we implement basic AABB for robustness if the library fails to load or for custom needs.
// We will use the p5 instance methods if available, or math.

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