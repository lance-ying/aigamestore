/**
 * physics.js
 * Handles movement integration, collision detection, and physics resolution.
 */

import { gameState, CONSTANTS } from './globals.js';

// Local helper for collision detection to avoid external dependencies
function checkRectCircleCollision(rx, ry, rw, rh, cx, cy, r) {
    // rx, ry: Top-Left corner of rectangle
    // rw, rh: Width and Height
    // cx, cy: Center of circle
    // r: Radius of circle

    let testX = cx;
    let testY = cy;

    // Find closest point on rect to circle center
    if (cx < rx) testX = rx;
    else if (cx > rx + rw) testX = rx + rw;

    if (cy < ry) testY = ry;
    else if (cy > ry + rh) testY = ry + rh;

    const distX = cx - testX;
    const distY = cy - testY;
    const distance = Math.sqrt((distX * distX) + (distY * distY));

    return distance <= r;
}

export class PhysicsEngine {
    static update(entity) {
        // Apply Lateral (X) Physics
        entity.vx += entity.ax;
        entity.vx *= CONSTANTS.LATERAL_FRICTION;
        entity.x += entity.vx;
        entity.ax = 0; // Reset acceleration
        
        // Apply Forward (Y) Physics
        // In this game, entities might move forward automatically or be static
        entity.y += entity.vy;
        
        // Apply Vertical (Z) Physics (Bounce/Gravity)
        if (entity.useGravity) {
            entity.vz -= CONSTANTS.GRAVITY;
            entity.z += entity.vz;
        }
    }

    /**
     * Checks if the player (ball) has landed on any tile.
     * Only checks when ball is falling and near z=0.
     */
    static checkLanding(player, tiles) {
        // Only check collision if player is falling and close to ground plane (z=0)
        if (player.vz < 0 && player.z <= 5 && player.z >= -CONSTANTS.GRAVITY * 2) {
            
            // Define player footprint (circle/point) on the ground
            // We give a little leeway by using a smaller radius for the "feet"
            const footprintRadius = player.radius * 0.5;

            for (let tile of tiles) {
                // Determine collision box
                // Tile.x is the Center X (based on rendering logic), but collision math expects Top-Left
                const tileLeft = tile.x - tile.width / 2;
                const tileTop = tile.y;

                if (checkRectCircleCollision(
                    tileLeft, tileTop, 
                    tile.width, tile.height,
                    player.x, player.y,
                    footprintRadius
                )) {
                    return tile; // Return the tile we landed on
                }
            }
        }
        return null;
    }

    static checkCollectibleCollision(player, collectibles) {
        // Check if player center is close to collectible center
        // Collectibles are floating, so we check X, Y and Z range
        
        for (let i = collectibles.length - 1; i >= 0; i--) {
            const c = collectibles[i];
            
            // 2D distance check
            const distSq = (player.x - c.x)**2 + (player.y - c.y)**2;
            const threshold = (player.radius + c.radius)**2;
            
            if (distSq < threshold) {
                // Height check: ball must be within reasonable Z range of the gem
                // Gems hover around z=20-40. Ball jumps up to z=100+.
                // Let's make collection generous: if you jump "through" it (xy align), you get it.
                if (Math.abs(player.z - c.z) < 60) {
                    return i; // Return index of collected item
                }
            }
        }
        return -1;
    }

    /**
     * Apply forces to keep player within world bounds (X-axis)
     */
    static constrainPlayerBounds(player) {
        const halfWidth = CONSTANTS.LANE_WIDTH / 2;
        if (player.x < -halfWidth) {
            player.x = -halfWidth;
            player.vx *= -0.5; // Bounce off wall with damping
        } else if (player.x > halfWidth) {
            player.x = halfWidth;
            player.vx *= -0.5;
        }
    }
}