/**
 * physics.js
 * Handles collision detection, spatial calculations, and core physics updates.
 */

import { gameState, CANVAS_HEIGHT, CANVAS_WIDTH } from './globals.js';
import { collideRectRect, collideRectCircle, collideLineRect } from 'https://cdn.jsdelivr.net/npm/p5.collide2d@1.0.0/+esm';

/**
 * Basic AABB Collision Check
 */
export function checkAABB(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

/**
 * Resolve Player vs Platform Collision
 * Handles floor, ceiling, and wall collisions.
 * @param {Player} player 
 * @param {Platform} platform 
 */
export function resolvePlatformCollision(player, platform) {
    // Determine previous position to find collision normal
    const prevBottom = player.prevY + player.height;
    const prevTop = player.prevY;
    const prevRight = player.prevX + player.width;
    const prevLeft = player.prevX;

    const curBottom = player.y + player.height;
    const curTop = player.y;
    const curRight = player.x + player.width;
    const curLeft = player.x;

    const platBottom = platform.y + platform.height;
    const platTop = platform.y;
    const platRight = platform.x + platform.width;
    const platLeft = platform.x;

    // Check vertical collision (Landing on top or hitting head on bottom)
    if (player.prevX + player.width > platform.x && player.prevX < platform.x + platform.width) {
        // Coming from top (landing)
        if (prevBottom <= platTop && curBottom >= platTop) {
            player.y = platTop - player.height;
            player.vy = 0;
            if (gameState.gravityDirection === 1) player.onGround = true;
            return;
        }
        // Coming from bottom (ceiling hit)
        if (prevTop >= platBottom && curTop <= platBottom) {
            player.y = platBottom;
            player.vy = 0;
            if (gameState.gravityDirection === -1) player.onGround = true; // "Ground" is ceiling in inverted gravity
            return;
        }
    }

    // Check horizontal collision (Wall hit)
    if (player.prevY + player.height > platform.y && player.prevY < platform.y + platform.height) {
        // Hitting left side of platform
        if (prevRight <= platLeft && curRight >= platLeft) {
            player.x = platLeft - player.width;
            player.vx = 0;
        }
        // Hitting right side of platform
        else if (prevLeft >= platRight && curLeft <= platRight) {
            player.x = platRight;
            player.vx = 0;
        }
    }
}

/**
 * Check collision between player and collectible (Circle/Rect)
 */
export function checkPlayerCollectible(player, collectible) {
    // Approximate collectible as a circle
    return collideRectCircle(
        player.x, player.y, player.width, player.height,
        collectible.x, collectible.y, collectible.size
    );
}

/**
 * Check collision between player and hazard
 */
export function checkPlayerHazard(player, hazard) {
    if (hazard.type === 'SPIKE') {
        // Triangle collision approximation
        // Defines spike vertices based on orientation
        let x1, y1, x2, y2, x3, y3;
        
        // Assume spike pointing up for ground, down for ceiling
        // hazard.x is center-bottom or center-top
        if (hazard.orientation === 'UP') {
            x1 = hazard.x - hazard.width/2; y1 = hazard.y + hazard.height;
            x2 = hazard.x; y2 = hazard.y;
            x3 = hazard.x + hazard.width/2; y3 = hazard.y + hazard.height;
        } else {
            x1 = hazard.x - hazard.width/2; y1 = hazard.y;
            x2 = hazard.x; y2 = hazard.y + hazard.height;
            x3 = hazard.x + hazard.width/2; y3 = hazard.y;
        }

        // Use p5.collide2d functionality manually or simplified rect
        // Using a smaller hitbox rect for spikes is often cleaner for gameplay
        const hitBox = {
            x: hazard.x - hazard.width/3,
            y: hazard.y + (hazard.orientation === 'UP' ? hazard.height/2 : 0),
            width: hazard.width/1.5,
            height: hazard.height/2
        };
        return checkAABB(player, hitBox);
    } 
    else if (hazard.type === 'SAW') {
        return collideRectCircle(
            player.x, player.y, player.width, player.height,
            hazard.x, hazard.y, hazard.radius * 2
        );
    }
    return false;
}

/**
 * Spatial Partitioning: Simple Grid
 * Optimizes collision checks by only checking entities in nearby cells.
 */
export class SpatialGrid {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    clear() {
        this.grid.clear();
    }

    getCellKey(x, y) {
        return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
    }

    insert(entity) {
        // Insert entity into all cells it overlaps
        const startX = Math.floor(entity.x / this.cellSize);
        const endX = Math.floor((entity.x + entity.width) / this.cellSize);
        const startY = Math.floor(entity.y / this.cellSize);
        const endY = Math.floor((entity.y + entity.height) / this.cellSize);

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const key = `${x},${y}`;
                if (!this.grid.has(key)) this.grid.set(key, []);
                this.grid.get(key).push(entity);
            }
        }
    }

    retrieve(area) {
        const found = new Set();
        const startX = Math.floor(area.x / this.cellSize);
        const endX = Math.floor((area.x + area.width) / this.cellSize);
        const startY = Math.floor(area.y / this.cellSize);
        const endY = Math.floor((area.y + area.height) / this.cellSize);

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const key = `${x},${y}`;
                const cellEntities = this.grid.get(key);
                if (cellEntities) {
                    cellEntities.forEach(e => found.add(e));
                }
            }
        }
        return Array.from(found);
    }
}