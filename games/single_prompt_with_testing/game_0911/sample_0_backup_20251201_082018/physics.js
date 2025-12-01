import { TILE, TILE_SIZE, WORLD_WIDTH_TILES, WORLD_HEIGHT_TILES, gameState } from './globals.js';
import { collideRectRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

// AABB Collision check
export function checkAABB(rect1, rect2) {
    return collideRectRect(rect1.x, rect1.y, rect1.width, rect1.height, rect2.x, rect2.y, rect2.width, rect2.height);
}

// Check if a tile is solid
export function isTileSolid(type) {
    return type !== TILE.AIR;
}

// Get tile at specific world coordinates
export function getTileAt(x, y) {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    
    if (tx < 0 || tx >= WORLD_WIDTH_TILES || ty < 0 || ty >= WORLD_HEIGHT_TILES) {
        return TILE.BEDROCK; // Out of bounds is solid
    }
    
    return gameState.worldMap[tx][ty];
}

// Set tile at world coordinates
export function setTileAt(x, y, type) {
    const tx = Math.floor(x / TILE_SIZE);
    const ty = Math.floor(y / TILE_SIZE);
    
    if (tx >= 0 && tx < WORLD_WIDTH_TILES && ty >= 0 && ty < WORLD_HEIGHT_TILES) {
        // Don't break bedrock
        if (gameState.worldMap[tx][ty] === TILE.BEDROCK) return false;
        
        gameState.worldMap[tx][ty] = type;
        return true;
    }
    return false;
}

// Resolve map collisions for an entity
export function resolveMapCollision(entity) {
    // Horizontal Collision
    let entityLeft = Math.floor(entity.x / TILE_SIZE);
    let entityRight = Math.floor((entity.x + entity.width - 0.1) / TILE_SIZE);
    let entityTop = Math.floor(entity.y / TILE_SIZE);
    let entityBottom = Math.floor((entity.y + entity.height - 0.1) / TILE_SIZE);

    // Check Right
    if (entity.vx > 0) {
        if (isTileSolid(getTileAt(entity.x + entity.width + entity.vx, entity.y)) ||
            isTileSolid(getTileAt(entity.x + entity.width + entity.vx, entity.y + entity.height - 0.1))) {
            entity.vx = 0;
            entity.x = (entityRight + 1) * TILE_SIZE - entity.width - 0.01;
        }
    }
    // Check Left
    else if (entity.vx < 0) {
        if (isTileSolid(getTileAt(entity.x + entity.vx, entity.y)) ||
            isTileSolid(getTileAt(entity.x + entity.vx, entity.y + entity.height - 0.1))) {
            entity.vx = 0;
            entity.x = (entityLeft) * TILE_SIZE + TILE_SIZE; // Snap to right side of tile
        }
    }
    
    entity.x += entity.vx;

    // Vertical Collision
    entityLeft = Math.floor(entity.x / TILE_SIZE);
    entityRight = Math.floor((entity.x + entity.width - 0.1) / TILE_SIZE);
    
    // Check Down
    if (entity.vy > 0) {
        // Check bottom corners after applying velocity
        const checkY = entity.y + entity.height + entity.vy;
        if (isTileSolid(getTileAt(entity.x, checkY)) ||
            isTileSolid(getTileAt(entity.x + entity.width - 0.1, checkY))) {
            entity.vy = 0;
            entity.onGround = true;
            // Snap to top of tile
            entity.y = Math.floor(checkY / TILE_SIZE) * TILE_SIZE - entity.height; 
        } else {
            entity.onGround = false;
        }
    }
    // Check Up
    else if (entity.vy < 0) {
        const checkY = entity.y + entity.vy;
        if (isTileSolid(getTileAt(entity.x, checkY)) ||
            isTileSolid(getTileAt(entity.x + entity.width - 0.1, checkY))) {
            entity.vy = 0;
            // Snap to bottom of tile
            entity.y = (Math.floor(checkY / TILE_SIZE) + 1) * TILE_SIZE; 
        }
    }
    
    entity.y += entity.vy;
}