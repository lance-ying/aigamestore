// physics.js
// Handles collision detection with map tiles and basic physics application

import { gameState, TILE_SIZE, GRAVITY, TERMINAL_VELOCITY } from './globals.js';
import { clamp } from './utils.js';

export class PhysicsBody {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.isCollidingTop = false;
        this.isCollidingLeft = false;
        this.isCollidingRight = false;
    }

    applyGravity() {
        this.vy += GRAVITY;
        if (this.vy > TERMINAL_VELOCITY) this.vy = TERMINAL_VELOCITY;
    }

    applyPhysics(map) {
        // Apply Horizontal Velocity first
        this.x += this.vx;
        this.handleMapCollision(map, true);

        // Apply Vertical Velocity second
        this.y += this.vy;
        this.onGround = false; // Assume in air until proven otherwise
        this.isCollidingTop = false;
        this.handleMapCollision(map, false);
    }

    handleMapCollision(map, isHorizontal) {
        // Calculate grid coordinates of the entity's edges
        // We add a small epsilon to avoid floating point issues at exact tile boundaries
        const epsilon = 0.01;
        
        const leftTile = Math.floor((this.x + epsilon) / TILE_SIZE);
        const rightTile = Math.floor((this.x + this.width - epsilon) / TILE_SIZE);
        const topTile = Math.floor((this.y + epsilon) / TILE_SIZE);
        const bottomTile = Math.floor((this.y + this.height - epsilon) / TILE_SIZE);

        // Iterate through all tiles the entity overlaps
        for (let y = topTile; y <= bottomTile; y++) {
            for (let x = leftTile; x <= rightTile; x++) {
                // Check bounds
                if (y < 0 || y >= map.length || x < 0 || x >= map[0].length) continue;

                const tile = map[y][x];
                
                // If tile is solid (ID 1)
                if (tile === 1) {
                    if (isHorizontal) {
                        // Moving Right
                        if (this.vx > 0) {
                            this.x = x * TILE_SIZE - this.width;
                            this.vx = 0;
                            this.isCollidingRight = true;
                        }
                        // Moving Left
                        else if (this.vx < 0) {
                            this.x = (x + 1) * TILE_SIZE;
                            this.vx = 0;
                            this.isCollidingLeft = true;
                        }
                    } else {
                        // Moving Down (Falling)
                        if (this.vy > 0) {
                            this.y = y * TILE_SIZE - this.height;
                            this.vy = 0;
                            this.onGround = true;
                        }
                        // Moving Up (Jumping into ceiling)
                        else if (this.vy < 0) {
                            this.y = (y + 1) * TILE_SIZE;
                            this.vy = 0;
                            this.isCollidingTop = true;
                        }
                    }
                    return; // Resolve one collision per axis pass is usually sufficient for simple physics
                }
            }
        }
    }
}