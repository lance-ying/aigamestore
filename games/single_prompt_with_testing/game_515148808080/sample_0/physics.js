/**
 * physics.js
 * Collision detection and resolution.
 */

import { TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { checkAABB } from './math_utils.js';

// Import p5.collide2D dynamically if needed, or rely on global scope if loaded in HTML.
// Since constraints say "Allowed libraries: p5.js, p5.collide2D", we assume they are available globally or we implement wrappers.

/**
 * Resolves collision between an entity and a TileMap.
 * Modifies entity position and velocity directly.
 * @param {Entity} entity 
 * @param {TileMap} map 
 */
export function resolveMapCollision(entity, map) {
    // We check corners of the entity to see which tiles it overlaps
    
    // Horizontal Collision
    let entityLeft = entity.x;
    let entityRight = entity.x + entity.w;
    let entityTop = entity.y;
    let entityBottom = entity.y + entity.h;

    // Check Right
    if (entity.vx > 0) {
        let tileX = Math.floor((entityRight + entity.vx) / TILE_SIZE);
        let topTileY = Math.floor(entityTop / TILE_SIZE);
        let bottomTileY = Math.floor((entityBottom - 0.1) / TILE_SIZE); // -0.1 to avoid floor catching

        if (map.isSolid(tileX, topTileY) || map.isSolid(tileX, bottomTileY)) {
            entity.x = (tileX * TILE_SIZE) - entity.w;
            entity.vx = 0;
        }
    }
    // Check Left
    else if (entity.vx < 0) {
        let tileX = Math.floor((entityLeft + entity.vx) / TILE_SIZE);
        let topTileY = Math.floor(entityTop / TILE_SIZE);
        let bottomTileY = Math.floor((entityBottom - 0.1) / TILE_SIZE);

        if (map.isSolid(tileX, topTileY) || map.isSolid(tileX, bottomTileY)) {
            entity.x = (tileX + 1) * TILE_SIZE;
            entity.vx = 0;
        }
    }

    // Apply X movement to recalculate positions for Y check
    entity.x += entity.vx;
    entityLeft = entity.x;
    entityRight = entity.x + entity.w;

    // Vertical Collision
    // Check Down
    if (entity.vy > 0) {
        let tileY = Math.floor((entityBottom + entity.vy) / TILE_SIZE);
        let leftTileX = Math.floor(entityLeft / TILE_SIZE);
        let rightTileX = Math.floor((entityRight - 0.1) / TILE_SIZE);

        if (map.isSolid(leftTileX, tileY) || map.isSolid(rightTileX, tileY)) {
            entity.y = (tileY * TILE_SIZE) - entity.h;
            entity.vy = 0;
            entity.isGrounded = true;
        } else {
            entity.isGrounded = false;
        }
    }
    // Check Up
    else if (entity.vy < 0) {
        let tileY = Math.floor((entityTop + entity.vy) / TILE_SIZE);
        let leftTileX = Math.floor(entityLeft / TILE_SIZE);
        let rightTileX = Math.floor((entityRight - 0.1) / TILE_SIZE);

        if (map.isSolid(leftTileX, tileY) || map.isSolid(rightTileX, tileY)) {
            entity.y = (tileY + 1) * TILE_SIZE;
            entity.vy = 0;
        }
    }
    
    // Apply Y movement
    entity.y += entity.vy;
}

/**
 * Checks entity vs entity collision using p5.collide2D if available, or custom AABB.
 */
export function checkEntityCollision(ent1, ent2) {
    if (window.collideRectRect) {
        return window.collideRectRect(ent1.x, ent1.y, ent1.w, ent1.h, ent2.x, ent2.y, ent2.w, ent2.h);
    }
    return checkAABB(
        {x: ent1.x, y: ent1.y, w: ent1.w, h: ent1.h},
        {x: ent2.x, y: ent2.y, w: ent2.w, h: ent2.h}
    );
}