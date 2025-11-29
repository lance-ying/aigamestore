// physics.js - Collision detection and resolution
import { TILE_SIZE, gameState } from './globals.js';

// Check collision between a dynamic entity and the static tile map
export function checkMapCollision(entity) {
    // Determine grid range to check based on entity position
    const startCol = Math.floor(entity.x / TILE_SIZE);
    const endCol = Math.floor((entity.x + entity.width) / TILE_SIZE);
    const startRow = Math.floor(entity.y / TILE_SIZE);
    const endRow = Math.floor((entity.y + entity.height) / TILE_SIZE);

    entity.onGround = false;
    entity.onWall = false;

    // We check vertical collisions first, then horizontal
    // This isn't perfect continuous collision detection, but sufficient for this scale
    
    // 1. Vertical Collision (Floor/Ceiling)
    // Predict next Y
    let nextY = entity.y + entity.vy;
    let collidedY = false;

    // Check downward (Floor)
    if (entity.vy >= 0) {
        for (let r = startRow; r <= endRow + 1; r++) { // Check one row below
            for (let c = startCol; c <= endCol; c++) {
                const tile = getTile(c, r);
                if (tile && tile.solid) {
                    const tileTop = r * TILE_SIZE;
                    // If we are currently above the tile and moving down into it
                    if (entity.y + entity.height <= tileTop + 5 && nextY + entity.height > tileTop) {
                        entity.y = tileTop - entity.height;
                        entity.vy = 0;
                        entity.onGround = true;
                        collidedY = true;
                        
                        // Handle special tiles
                        if (tile.type === 'SPIKE') {
                            if (entity.takeDamage) entity.takeDamage();
                        }
                    }
                }
            }
        }
    } 
    // Check upward (Ceiling)
    else if (entity.vy < 0) {
        for (let r = startRow - 1; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const tile = getTile(c, r);
                if (tile && tile.solid) {
                    const tileBottom = (r + 1) * TILE_SIZE;
                    if (entity.y >= tileBottom - 5 && nextY < tileBottom) {
                        entity.y = tileBottom;
                        entity.vy = 0;
                        collidedY = true;
                    }
                }
            }
        }
    }

    if (!collidedY) {
        entity.y = nextY;
    }

    // 2. Horizontal Collision (Walls)
    // Update grid range for new Y
    const newStartRow = Math.floor(entity.y / TILE_SIZE);
    const newEndRow = Math.floor((entity.y + entity.height - 0.1) / TILE_SIZE); // -0.1 to avoid foot collision with floor acting as wall

    let nextX = entity.x + entity.vx;
    let collidedX = false;

    // Check Right
    if (entity.vx > 0) {
        for (let r = newStartRow; r <= newEndRow; r++) {
            for (let c = startCol; c <= endCol + 1; c++) {
                const tile = getTile(c, r);
                if (tile && tile.solid) {
                    const tileLeft = c * TILE_SIZE;
                    if (entity.x + entity.width <= tileLeft + 5 && nextX + entity.width > tileLeft) {
                        entity.x = tileLeft - entity.width;
                        entity.vx = 0;
                        collidedX = true;
                        entity.pushingWall = true;
                    }
                }
            }
        }
    }
    // Check Left
    else if (entity.vx < 0) {
        for (let r = newStartRow; r <= newEndRow; r++) {
            for (let c = startCol - 1; c <= endCol; c++) {
                const tile = getTile(c, r);
                if (tile && tile.solid) {
                    const tileRight = (c + 1) * TILE_SIZE;
                    if (entity.x >= tileRight - 5 && nextX < tileRight) {
                        entity.x = tileRight;
                        entity.vx = 0;
                        collidedX = true;
                        entity.pushingWall = true;
                    }
                }
            }
        }
    }

    if (!collidedX) {
        entity.x = nextX;
        entity.pushingWall = false;
    }
}

function getTile(col, row) {
    if (row < 0 || row >= gameState.levelMap.length || col < 0 || col >= gameState.levelMap[0].length) {
        return null;
    }
    const tileChar = gameState.levelMap[row][col];
    
    // Map chars to properties
    switch(tileChar) {
        case '#': return { solid: true, type: 'GROUND' }; // Ground
        case 'G': return { solid: true, type: 'GRASS' };  // Grass top
        case 'S': return { solid: true, type: 'SPIKE' };  // Spikes
        case 'B': return { solid: true, type: 'BLOCK' };  // Solid block
        default: return null;
    }
}

// Simple AABB (Axis-Aligned Bounding Box) collision detection
export function checkEntityCollision(ent1, ent2) {
    return (ent1.x < ent2.x + ent2.width &&
            ent1.x + ent1.width > ent2.x &&
            ent1.y < ent2.y + ent2.height &&
            ent1.y + ent1.height > ent2.y);
}