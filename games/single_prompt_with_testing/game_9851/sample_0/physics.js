/**
 * Physics engine handling collision detection and spatial queries.
 * Wraps p5.collide2d for convenience and specific game logic.
 */

import { gameState, TILE_SIZE } from './globals.js';

/**
 * Checks collision between a dynamic entity and the static world tiles.
 * Resolves collision by modifying entity position.
 * @param {Entity} entity 
 */
export function handleWorldCollision(entity) {
    // Calculate tile range to check based on entity bounding box
    // Adding a buffer to check surrounding tiles
    const startCol = Math.floor((entity.x - entity.width) / TILE_SIZE);
    const endCol = Math.floor((entity.x + entity.width * 2) / TILE_SIZE);
    const startRow = Math.floor((entity.y - entity.height) / TILE_SIZE);
    const endRow = Math.floor((entity.y + entity.height * 2) / TILE_SIZE);

    // X Axis Collision
    let nextX = entity.x + entity.vx;
    let nextY = entity.y; // Keep Y constant to test X movement

    for (let c = startCol; c <= endCol; c++) {
        for (let r = startRow; r <= endRow; r++) {
            const tile = getTileAt(c, r);
            if (tile && tile.solid) {
                // Check if moving to nextX would collide
                if (checkRectOverlap(
                    nextX, entity.y, entity.width, entity.height,
                    c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE
                )) {
                    // Collision detected on X
                    if (entity.vx > 0) { // Moving Right
                        entity.x = c * TILE_SIZE - entity.width - 0.1;
                    } else if (entity.vx < 0) { // Moving Left
                        entity.x = (c + 1) * TILE_SIZE + 0.1;
                    }
                    entity.vx = 0;
                    nextX = entity.x; // Update nextX for subsequent checks if needed
                }
            }
        }
    }

    // Apply X position
    entity.x += entity.vx;

    // Y Axis Collision
    nextX = entity.x; // Use resolved X
    nextY = entity.y + entity.vy;

    for (let c = startCol; c <= endCol; c++) {
        for (let r = startRow; r <= endRow; r++) {
            const tile = getTileAt(c, r);
            if (tile && tile.solid) {
                if (checkRectOverlap(
                    entity.x, nextY, entity.width, entity.height,
                    c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE
                )) {
                    // Collision detected on Y
                    if (entity.vy > 0) { // Moving Down
                        entity.y = r * TILE_SIZE - entity.height - 0.1;
                    } else if (entity.vy < 0) { // Moving Up
                        entity.y = (r + 1) * TILE_SIZE + 0.1;
                    }
                    entity.vy = 0;
                }
            }
        }
    }
    
    // Apply Y position
    entity.y += entity.vy;
}

/**
 * Checks overlap between two AABBs (Axis Aligned Bounding Boxes).
 */
export function checkRectOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
    return (
        x1 < x2 + w2 &&
        x1 + w1 > x2 &&
        y1 < y2 + h2 &&
        y1 + h1 > y2
    );
}

/**
 * Retrieves tile data from the global map.
 */
export function getTileAt(col, row) {
    if (row >= 0 && row < gameState.mapHeight && col >= 0 && col < gameState.mapWidth) {
        return gameState.world[row][col];
    }
    return null; // Out of bounds
}

/**
 * Checks collision between an entity (AABB) and a circle (Projectile/Attack).
 */
export function checkEntityHit(entity, circleX, circleY, radius) {
    return collideRectCircle(
        entity.x, entity.y, entity.width, entity.height,
        circleX, circleY, radius * 2
    );
}

/**
 * Internal implementation of collideRectCircle to avoid external dependency issues.
 * Based on p5.collide2d logic.
 */
function collideRectCircle(rx, ry, rw, rh, cx, cy, diameter) {
    let testX = cx;
    let testY = cy;

    // which edge is closest?
    if (cx < rx)         testX = rx;      // left edge
    else if (cx > rx + rw) testX = rx + rw;   // right edge

    if (cy < ry)         testY = ry;      // top edge
    else if (cy > ry + rh) testY = ry + rh;   // bottom edge

    // get distance from closest edges
    const distX = cx - testX;
    const distY = cy - testY;
    const distance = Math.sqrt((distX * distX) + (distY * distY));

    return distance <= diameter / 2;
}

/**
 * Simple raycast to check line of sight between two entities.
 * Checks against walls.
 */
export function hasLineOfSight(entity1, entity2) {
    // Sample points along the line
    const steps = 10;
    const dx = entity2.x - entity1.x;
    const dy = entity2.y - entity1.y;
    
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const cx = entity1.x + dx * t + entity1.width/2;
        const cy = entity1.y + dy * t + entity1.height/2;
        
        const col = Math.floor(cx / TILE_SIZE);
        const row = Math.floor(cy / TILE_SIZE);
        
        const tile = getTileAt(col, row);
        if (tile && tile.solid) {
            return false;
        }
    }
    return true;
}