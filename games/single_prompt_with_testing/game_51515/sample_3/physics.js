/**
 * physics.js
 * Handles collision detection, grid mathematics, and entity movement logic.
 */

import { TILE_SIZE, gameState, GRID_ROWS, CANVAS_HEIGHT } from './globals.js';

/**
 * Converts a grid coordinate to screen pixel coordinate (Center of tile).
 */
export function gridToScreen(gridX, gridY) {
    return {
        x: gridX * TILE_SIZE,
        y: gridY * TILE_SIZE
    };
}

/**
 * Converts screen pixel coordinate to grid coordinate.
 */
export function screenToGrid(screenX, screenY) {
    return {
        x: Math.floor(screenX / TILE_SIZE),
        y: Math.floor(screenY / TILE_SIZE)
    };
}

/**
 * Linear Interpolation
 */
export function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end;
}

/**
 * Checks if a specific tile coordinate is solid (Wall).
 * @param {number} gx 
 * @param {number} gy 
 * @returns {boolean}
 */
export function isSolid(gx, gy) {
    const key = `${gx},${gy}`;
    const tile = gameState.tiles.get(key);
    
    // If no tile exists, it's a pit (not solid wall, but hole)
    // We treat walls as specific tile types.
    if (tile && tile.type === 'WALL') return true;
    
    return false;
}

/**
 * Checks if a specific tile is a Pit (Void/Hole).
 * @param {number} gx 
 * @param {number} gy 
 * @returns {boolean}
 */
export function isPit(gx, gy) {
    const key = `${gx},${gy}`;
    return !gameState.tiles.has(key); // If map has no entry, it's empty space (pit)
}

/**
 * Checks rectangular collision between two entities.
 * Used for dynamic entity-entity collision (Player vs Enemy).
 */
export function checkAABB(ent1, ent2) {
    // Entities usually have visual x/y (pixels) and width/height
    return (
        ent1.visualX < ent2.visualX + ent2.width &&
        ent1.visualX + ent1.width > ent2.visualX &&
        ent1.visualY < ent2.visualY + ent2.height &&
        ent1.visualY + ent1.height > ent2.visualY
    );
}

/**
 * Check if the grid position contains any "Hazard" entity (Trap).
 * @param {number} gx 
 * @param {number} gy 
 * @returns {Entity|null}
 */
export function getHazardAt(gx, gy) {
    for (let entity of gameState.entities) {
        if (entity.gridX === gx && entity.gridY === gy && entity.isHazard) {
            return entity;
        }
    }
    return null;
}

/**
 * Check if the grid position contains a Collectible.
 * @param {number} gx 
 * @param {number} gy 
 * @returns {Entity|null}
 */
export function getCollectibleAt(gx, gy) {
    for (let entity of gameState.entities) {
        if (entity.gridX === gx && entity.gridY === gy && entity.type === 'COLLECTIBLE') {
            return entity;
        }
    }
    return null;
}

/**
 * Spatial Hashing helper for performance optimization if entity count grows.
 * (Simplified implementation for this scope).
 */
export class SpatialGrid {
    constructor() {
        this.buckets = new Map();
    }
    
    clear() {
        this.buckets.clear();
    }
    
    add(entity) {
        const key = `${Math.round(entity.gridX)},${Math.round(entity.gridY)}`;
        if (!this.buckets.has(key)) this.buckets.set(key, []);
        this.buckets.get(key).push(entity);
    }
    
    get(gx, gy) {
        const key = `${gx},${gy}`;
        return this.buckets.get(key) || [];
    }
}