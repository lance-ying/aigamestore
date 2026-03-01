/**
 * Physics engine handling collision detection and resolution.
 */
import { gameState, GRAVITY, FRICTION, CANVAS_HEIGHT } from './globals.js';
import { checkAABB, pointInRect, dist } from './utils.js';

export class PhysicsBody {
    constructor(x, y, w, h, isStatic = false) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.vx = 0;
        this.vy = 0;
        this.isStatic = isStatic;
        this.onGround = false;
        this.isCollidingTop = false;
        this.isCollidingBottom = false;
        this.isCollidingLeft = false;
        this.isCollidingRight = false;
    }

    applyForce(fx, fy) {
        if (this.isStatic) return;
        this.vx += fx;
        this.vy += fy;
    }

    updatePhysics() {
        if (this.isStatic) return;

        // Apply Gravity
        this.vy += GRAVITY;

        // Apply Velocity
        this.x += this.vx;
        this.checkHorizontalCollisions();
        
        this.y += this.vy;
        this.checkVerticalCollisions();

        // Friction (Ground) and Air Resistance
        if (this.onGround) {
            this.vx *= FRICTION;
        } else {
            this.vx *= 0.95; // Air drag
        }

        // Clamp very small velocities to 0
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
        if (Math.abs(this.vy) < 0.1) this.vy = 0;

        // Reset flags for next frame (logic handled in checks)
    }

    checkHorizontalCollisions() {
        this.isCollidingLeft = false;
        this.isCollidingRight = false;

        for (let platform of gameState.platforms) {
            if (checkAABB(this, platform)) {
                // Determine direction
                if (this.vx > 0) { // Moving Right
                    this.x = platform.x - this.width;
                    this.isCollidingRight = true;
                    this.vx = 0;
                } else if (this.vx < 0) { // Moving Left
                    this.x = platform.x + platform.width;
                    this.isCollidingLeft = true;
                    this.vx = 0;
                }
            }
        }
    }

    checkVerticalCollisions() {
        this.onGround = false;
        this.isCollidingTop = false;

        for (let platform of gameState.platforms) {
            // One-way platforms? Let's stick to solid for simplicity first, or check platform type
            // Implementation of simple solid blocks:
            if (checkAABB(this, platform)) {
                if (this.vy > 0) { // Falling
                    this.y = platform.y - this.height;
                    this.onGround = true;
                    this.vy = 0;
                } else if (this.vy < 0) { // Jumping up
                    this.y = platform.y + platform.height;
                    this.isCollidingTop = true;
                    this.vy = 0;
                }
            }
        }
        
        // World Bounds (Bottom) - Death pit handling usually done in Entity update, but clamp here
        if (this.y > gameState.levelHeight + 200) {
            // Fell off world
            // Entity specific handling will catch this
        }
    }
}

/**
 * Raycast helper (simplified) for instant hit weapons
 */
export function raycast(x1, y1, x2, y2, checkEntities = []) {
    // Basic Bresenham or stepping implementation is too heavy in JS for many checks
    // We'll use a stepping method
    const steps = dist(x1, y1, x2, y2) / 10;
    const dx = (x2 - x1) / steps;
    const dy = (y2 - y1) / steps;
    
    let cx = x1;
    let cy = y1;
    
    for (let i = 0; i < steps; i++) {
        cx += dx;
        cy += dy;
        
        // Check platforms
        for (let p of gameState.platforms) {
            if (pointInRect(cx, cy, p.x, p.y, p.width, p.height)) {
                return { hit: true, x: cx, y: cy, type: 'wall', object: p };
            }
        }
        
        // Check provided entities
        for (let e of checkEntities) {
            if (pointInRect(cx, cy, e.x, e.y, e.width, e.height)) {
                return { hit: true, x: cx, y: cy, type: 'entity', object: e };
            }
        }
    }
    
    return { hit: false, x: x2, y: y2 };
}