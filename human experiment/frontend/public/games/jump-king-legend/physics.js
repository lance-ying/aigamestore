/**
 * Physics engine handling collision detection, resolution, and movement integration.
 * Uses p5.collide2d for intersection checks.
 */
import { gameState, GRAVITY, FRICTION_GROUND, FRICTION_AIR, BOUNCE_FACTOR, TERMINAL_VELOCITY, CANVAS_HEIGHT } from './globals.js';
// We assume p5.collide2d is loaded globally as per constraints, but we can also use direct AABB for rectangles for speed.
// Since the constraint says "Allowed libraries: p5.collide2D", we will use it where appropriate.

export class PhysicsBody {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.isStatic = false;
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
        
        // Cap Terminal Velocity
        if (this.vy > TERMINAL_VELOCITY) this.vy = TERMINAL_VELOCITY;

        // Apply Position
        this.x += this.vx;
        this.y += this.vy;

        // Apply Friction
        if (this.onGround) {
            this.vx *= FRICTION_GROUND;
        } else {
            this.vx *= FRICTION_AIR;
        }
        
        // Stop very small velocities
        if (Math.abs(this.vx) < 0.01) this.vx = 0;
    }
}

/**
 * Checks AABB Collision between two rects
 */
export function checkAABB(r1, r2) {
    return (
        r1.x < r2.x + r2.width &&
        r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height &&
        r1.y + r1.height > r2.y
    );
}

/**
 * Resolves collisions between a dynamic body (player) and a list of static bodies (platforms).
 * Handles specific mechanics like wall bouncing and floor snapping.
 */
export function resolveCollisions(entity, obstacles) {
    entity.onGround = false;
    
    // Horizontal Collision First
    let xCollided = false;
    let potentialX = entity.x;
    
    // We check against the position after updatePhysics has already run.
    // To resolve, we might need to separate axes.
    // Actually, a robust way is to move X, check, resolve. Move Y, check, resolve.
    // However, our update function moves both. Let's backtrack for clean resolution.
    
    // Reset position to previous frame (approximate by subtracting V)
    // This is a simplification. A better way for this specific game type:
    // 1. Store previous valid position.
    // 2. Move X. Check. If collide -> bounce/stop.
    // 3. Move Y. Check. If collide -> land/bonk head.
    
    // Revert integration done in updatePhysics to do step-by-step
    entity.x -= entity.vx;
    entity.y -= entity.vy;
    
    // --- X Axis ---
    entity.x += entity.vx;
    let collisionX = null;
    
    for (let obs of obstacles) {
        if (checkAABB(entity, obs)) {
            collisionX = obs;
            break;
        }
    }
    
    if (collisionX) {
        // Resolve X
        if (entity.vx > 0) {
            // Hitting left side of wall
            entity.x = collisionX.x - entity.width;
            // Bounce
            entity.vx = -entity.vx * BOUNCE_FACTOR;
        } else if (entity.vx < 0) {
            // Hitting right side of wall
            entity.x = collisionX.x + collisionX.width;
            // Bounce
            entity.vx = -entity.vx * BOUNCE_FACTOR;
        }
        
        // Add particle effect for bonk?
        // TODO: Signal bonk
    }
    
    // --- Y Axis ---
    entity.y += entity.vy;
    let collisionY = null;
    
    for (let obs of obstacles) {
        if (checkAABB(entity, obs)) {
            collisionY = obs;
            break;
        }
    }
    
    if (collisionY) {
        // Resolve Y
        if (entity.vy > 0) {
            // Falling down, hitting floor
            entity.y = collisionY.y - entity.height;
            entity.vy = 0;
            entity.onGround = true;
        } else if (entity.vy < 0) {
            // Jumping up, hitting ceiling
            entity.y = collisionY.y + collisionY.height;
            entity.vy = 0;
            // Maybe a small bounce down?
            entity.vy = 0.5;
        }
    }
    
    // World Bounds
    if (entity.x < 0) {
        entity.x = 0;
        entity.vx = -entity.vx * BOUNCE_FACTOR;
    }
    if (entity.x + entity.width > 600) { // HARDCODED WIDTH CHECK
        entity.x = 600 - entity.width;
        entity.vx = -entity.vx * BOUNCE_FACTOR;
    }
    
    // Bottom bound (Floor of world)
    if (entity.y + entity.height > 4000) { // HARDCODED WORLD HEIGHT
        entity.y = 4000 - entity.height;
        entity.vy = 0;
        entity.onGround = true;
    }
}