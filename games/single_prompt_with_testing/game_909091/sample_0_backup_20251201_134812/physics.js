// Physics engine and collision detection
import { collideRectRect, collideRectCircle } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/dist/p5.collide2d.js';
import { TILE_SIZE, gameState, CANVAS_HEIGHT } from './globals.js';

/**
 * Checks if a rectangle collides with any solid tile in the world.
 * Returns the tile object if collision occurs, or null.
 */
export function checkTileCollision(entity, tiles) {
    for (const tile of tiles) {
        if (!tile.isSolid) continue;
        
        // Simple broadphase: Check if tile is close enough
        if (Math.abs(tile.x - entity.x) > TILE_SIZE * 2 || 
            Math.abs(tile.y - entity.y) > TILE_SIZE * 2) {
            continue;
        }

        const collision = collideRectRect(
            entity.x, entity.y, entity.width, entity.height,
            tile.x, tile.y, tile.width, tile.height
        );

        if (collision) {
            return tile;
        }
    }
    return null;
}

/**
 * Resolves AABB collision between an entity and a tile.
 * Modifies entity position and velocity.
 */
export function resolveTileCollision(entity, tile) {
    // Calculate overlap depths
    const entityBottom = entity.y + entity.height;
    const tileBottom = tile.y + tile.height;
    const entityRight = entity.x + entity.width;
    const tileRight = tile.x + tile.width;

    const b_collision = tileBottom - entity.y;
    const t_collision = entityBottom - tile.y;
    const l_collision = entityRight - tile.x;
    const r_collision = tileRight - entity.x;

    // Determine smallest overlap to decide collision side
    // Give preference to vertical collisions (floor/ceiling) for platformers
    
    if (t_collision < b_collision && t_collision < l_collision && t_collision < r_collision) {
        // Top collision (Entity landing on tile)
        if(entity.vy >= 0) {
            entity.y = tile.y - entity.height;
            entity.vy = 0;
            entity.onGround = true;
        }
    } else if (b_collision < t_collision && b_collision < l_collision && b_collision < r_collision) {
        // Bottom collision (Entity hitting head on tile)
        if(entity.vy < 0) {
            entity.y = tile.y + tile.height;
            entity.vy = 0;
            // Trigger block interaction if applicable
            if(tile.interact) tile.interact();
        }
    } else if (l_collision < r_collision && l_collision < t_collision && l_collision < b_collision) {
        // Left collision (Entity moving right into tile)
        entity.x = tile.x - entity.width;
        entity.vx = 0;
    } else {
        // Right collision (Entity moving left into tile)
        entity.x = tile.x + tile.width;
        entity.vx = 0;
    }
}

/**
 * General entity physics update (Gravity, Friction)
 */
export function applyPhysics(entity, gravity = 0.6, friction = 0.8) {
    // Apply gravity
    entity.vy += gravity;

    // Apply friction
    if (entity.onGround) {
        entity.vx *= friction;
    } else {
        entity.vx *= 0.95; // Air resistance
    }

    // Stop very small velocities
    if (Math.abs(entity.vx) < 0.1) entity.vx = 0;
}

/**
 * Bounds checking to keep entities within world limits
 */
export function constrainToWorld(entity, worldWidth, worldHeight) {
    if (entity.x < 0) {
        entity.x = 0;
        entity.vx = 0;
    }
    // Don't constrain X max strictly to allow finishing level if trigger is far right
    
    // Death pit check
    if (entity.y > worldHeight + 100) {
        if (entity.die) entity.die();
        else entity.isActive = false;
    }
}