import { gameState, GRAVITY, TERMINAL_VELOCITY, TILE_SIZE } from './globals.js';

// AABB Collision Detection
export function checkAABB(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Check collision between a moving entity and static platforms
export function resolvePlatformCollisions(entity) {
    // We check for platforms that are close to the entity to optimize
    // Simple spatial hashing or grid check could go here, but for this scale loop is okay
    // or better, filter by Y range
    
    entity.onGround = false;
    
    // Vertical Collision
    let entityRectY = {
        x: entity.x,
        y: entity.y + entity.vy, // Predict next Y
        width: entity.width,
        height: entity.height
    };

    // Optimization: Filter platforms roughly in range
    const nearbyPlatforms = gameState.platforms.filter(p => 
        Math.abs(p.y - entity.y) < TILE_SIZE * 3 &&
        Math.abs(p.x - entity.x) < TILE_SIZE * 3
    );

    for (let platform of nearbyPlatforms) {
        if (checkAABB(entityRectY, platform)) {
            if (entity.vy > 0) { // Falling
                // Snap to top
                entity.y = platform.y - entity.height;
                entity.vy = 0;
                entity.onGround = true;
            } else if (entity.vy < 0) { // Jumping up
                // Hit head
                entity.y = platform.y + platform.height;
                entity.vy = 0;
            }
        }
    }

    // Horizontal Collision
    let entityRectX = {
        x: entity.x + entity.vx, // Predict next X
        y: entity.y, // Current Y (already resolved mostly, but using current prevents sticking)
        width: entity.width,
        height: entity.height
    };

    // Note: We need to re-check slightly adjusted Y if we snapped to ground to avoid snagging
    // A simplified approach: Apply X movement, check collision, revert if collide.
    
    let collidedX = false;
    for (let platform of nearbyPlatforms) {
        // Platform specific logic: One-way platforms?
        // For now assuming all platforms are solid blocks
        if (checkAABB(entityRectX, platform)) {
             // Basic resolution: stop movement
             entity.vx = 0;
             collidedX = true;
             
             // Snap to edge
             if (entity.x < platform.x) {
                 entity.x = platform.x - entity.width;
             } else {
                 entity.x = platform.x + platform.width;
             }
        }
    }
    
    return collidedX;
}

export function applyPhysics(entity) {
    // Apply Gravity
    entity.vy += GRAVITY;
    if (entity.vy > TERMINAL_VELOCITY) entity.vy = TERMINAL_VELOCITY;

    // Apply Friction (Air vs Ground)
    const friction = entity.onGround ? 0.8 : 0.95;
    entity.vx *= friction;

    // Zero out small velocities
    if (Math.abs(entity.vx) < 0.1) entity.vx = 0;
}

export function checkEntityCollisions() {
    // Projectile vs Enemies
    // Player vs Pickups
    // Player vs Enemies
    
    const projectiles = gameState.entities.filter(e => e.type === "PROJECTILE");
    const enemies = gameState.entities.filter(e => e.type === "ENEMY");
    const collectibles = gameState.entities.filter(e => e.type === "COLLECTIBLE");
    const player = gameState.player;
    
    if (!player || player.dead) return;

    // 1. Projectiles hitting things
    projectiles.forEach(proj => {
        if (proj.dead) return;
        
        // Player bullets vs Enemies
        if (proj.owner === "PLAYER") {
            enemies.forEach(enemy => {
                if (!enemy.dead && checkAABB(proj, enemy)) {
                    enemy.takeDamage(proj.damage);
                    proj.hit();
                }
            });
        }
        // Enemy bullets vs Player
        else if (proj.owner === "ENEMY") {
            if (checkAABB(proj, player)) {
                player.takeDamage(proj.damage);
                proj.hit();
            }
        }
    });

    // 2. Player vs Enemies (Body collision)
    enemies.forEach(enemy => {
        if (!enemy.dead && checkAABB(player, enemy)) {
            // Simple bounce back or damage
            player.takeDamage(10);
            
            // Push player away
            const dx = player.x + player.width/2 - (enemy.x + enemy.width/2);
            player.vx = Math.sign(dx) * 10;
            player.vy = -5;
        }
    });

    // 3. Player vs Collectibles
    collectibles.forEach(item => {
        if (!item.dead && checkAABB(player, item)) {
            item.collect(player);
        }
    });
}