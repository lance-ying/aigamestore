import { TILE_SIZE, gameState } from './globals.js';

export function checkTileCollision(entity, newX, newY) {
    // Determine the edges of the entity
    const left = newX;
    const right = newX + entity.width;
    const top = newY;
    const bottom = newY + entity.height;

    // Convert to tile coordinates
    const tileLeft = Math.floor(left / TILE_SIZE);
    const tileRight = Math.floor((right - 0.01) / TILE_SIZE);
    const tileTop = Math.floor(top / TILE_SIZE);
    const tileBottom = Math.floor((bottom - 0.01) / TILE_SIZE);

    // Check bounds
    if (tileLeft < 0 || tileRight >= gameState.levelLength || tileTop < 0 || tileBottom >= gameState.tiles[0].length) {
        // Treat out of bounds (except top) as solid or void depending on design
        // For this game: sides are walls, bottom is pit (death), top is open
        if (tileBottom >= gameState.tiles[0].length) return "PIT";
        if (tileLeft < 0 || tileRight >= gameState.levelLength) return "WALL";
        return null;
    }

    // Check tiles
    for (let y = tileTop; y <= tileBottom; y++) {
        for (let x = tileLeft; x <= tileRight; x++) {
            if (y < 0) continue; // Skip checking above sky
            const tile = gameState.tiles[x][y];
            if (tile && tile.solid) {
                return {
                    type: "SOLID",
                    tileX: x * TILE_SIZE,
                    tileY: y * TILE_SIZE,
                    tileObj: tile
                };
            }
        }
    }

    return null;
}

export function resolveEntityMapCollision(entity) {
    // Horizontal
    const collisionX = checkTileCollision(entity, entity.x + entity.vx, entity.y);
    if (collisionX) {
        if (collisionX === "PIT") {
             // Let them fall
        } else if (collisionX === "WALL") {
            entity.vx = 0;
        } else if (collisionX.type === "SOLID") {
            // Move to edge of tile
            if (entity.vx > 0) {
                entity.x = collisionX.tileX - entity.width;
            } else if (entity.vx < 0) {
                entity.x = collisionX.tileX + TILE_SIZE;
            }
            entity.vx = 0;
            
            // Interact with block
            if (entity.vx === 0 && entity.onSideCollision) entity.onSideCollision(collisionX.tileObj);
        }
    } else {
        entity.x += entity.vx;
    }

    // Vertical
    const collisionY = checkTileCollision(entity, entity.x, entity.y + entity.vy);
    if (collisionY) {
        if (collisionY === "PIT") {
             entity.y += entity.vy; // Fall to death
        } else if (collisionY === "WALL") {
             // Should verify x bounds, usually handled by X check, but safeguard
        } else if (collisionY.type === "SOLID") {
            if (entity.vy > 0) { // Landing
                entity.y = collisionY.tileY - entity.height;
                entity.onGround = true;
                entity.vy = 0;
            } else if (entity.vy < 0) { // Hitting head
                entity.y = collisionY.tileY + TILE_SIZE;
                entity.vy = 0;
                // Interact with block (break brick, hit question)
                if (entity.onHeadHit) entity.onHeadHit(collisionX ? collisionX.tileObj : collisionY.tileObj);
            }
        }
    } else {
        entity.y += entity.vy;
        entity.onGround = false;
    }
}