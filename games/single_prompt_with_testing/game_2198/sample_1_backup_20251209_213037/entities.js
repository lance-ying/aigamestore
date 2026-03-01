/**
 * entities.js
 * Contains classes for Player, Platforms, Spikes, and Collectibles.
 */

import { 
    gameState, CANVAS_WIDTH, CANVAS_HEIGHT, 
    PLAYER_WIDTH, PLAYER_HEIGHT, GRAVITY, MAX_GRAVITY, 
    PLAYER_SPEED, PLAYER_MAX_SPEED, PLAYER_JUMP_FORCE,
    PLAYER_JUMP_HOLD_FORCE, PLAYER_MAX_JUMP_FRAMES, 
    FRICTION, COLORS, TILE_SIZE 
} from './globals.js';
import { resolvePlatformCollisions, checkSpikeCollisions, checkTriggerCollisions } from './physics.js';
import { createDust, createExplosion, createSparkle } from './particles.js';

// ------------------------------------------------------------------
// Base Entity Class
// ------------------------------------------------------------------
class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.active = true;
    }

    render(p, cameraX, cameraY) {
        // Base render (debug mostly)
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;
        if (this.isOnScreen(screenX, screenY)) {
            p.fill(255);
            p.rect(screenX, screenY, this.width, this.height);
        }
    }

    isOnScreen(screenX, screenY) {
        return (
            screenX + this.width > 0 && 
            screenX < CANVAS_WIDTH && 
            screenY + this.height > 0 && 
            screenY < CANVAS_HEIGHT
        );
    }
}

// ------------------------------------------------------------------
// Player Entity
// ------------------------------------------------------------------
export class Player extends Entity {
    constructor(x, y) {
        super(x, y, PLAYER_WIDTH, PLAYER_HEIGHT);
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.isJumping = false;
        this.jumpFrames = 0;
        this.facing = 1; // 1 Right, -1 Left
        
        // Squash and stretch animation vars
        this.scaleX = 1;
        this.scaleY = 1;
        
        // Logging helpers
        this.lastX = x;
        this.lastY = y;
    }

    update(p) {
        const inputs = gameState.inputs;

        // 1. Horizontal Movement
        if (inputs.right) {
            this.vx += PLAYER_SPEED;
            this.facing = 1;
        } else if (inputs.left) {
            this.vx -= PLAYER_SPEED;
            this.facing = -1;
        } else {
            // Friction
            this.vx *= FRICTION;
        }

        // Clamp Speed
        this.vx = p.constrain(this.vx, -PLAYER_MAX_SPEED, PLAYER_MAX_SPEED);

        // 2. Vertical Movement (Jump)
        if (inputs.jump) {
            if (this.onGround && !this.isJumping) {
                // Initial Jump
                this.vy = PLAYER_JUMP_FORCE;
                this.isJumping = true;
                this.onGround = false;
                this.jumpFrames = 0;
                
                // Effects
                this.scaleX = 0.7;
                this.scaleY = 1.3;
                createDust(this.x + this.width/2, this.y + this.height, 5);
            } else if (this.isJumping && this.jumpFrames < PLAYER_MAX_JUMP_FRAMES) {
                // Variable Jump Height (holding space)
                this.vy += PLAYER_JUMP_HOLD_FORCE;
                this.jumpFrames++;
            }
        } else {
            // Released space early
            this.isJumping = false;
        }

        // Apply Gravity
        this.vy += GRAVITY;
        this.vy = Math.min(this.vy, MAX_GRAVITY);

        // 3. Apply Velocity
        this.x += this.vx;
        this.y += this.vy;

        // 4. Resolve Collisions
        // Reset onGround before check, will be set true if collision found
        const wasOnGround = this.onGround;
        resolvePlatformCollisions(this, gameState.platforms);

        // Landing Detection for effects
        if (!wasOnGround && this.onGround) {
            this.scaleX = 1.3;
            this.scaleY = 0.7;
            this.isJumping = false;
            createDust(this.x + this.width/2, this.y + this.height, 3);
        }

        // 5. Hazard Collision (Spikes & Pits)
        if (checkSpikeCollisions(this, gameState.hazards) || this.y > CANVAS_HEIGHT + 200) {
            this.die();
        }

        // 6. Collectibles
        const collected = checkTriggerCollisions(this, gameState.collectibles);
        collected.forEach(item => {
            item.collect();
            gameState.score += 50;
        });

        // 7. Animation recovery
        this.scaleX = p.lerp(this.scaleX, 1, 0.1);
        this.scaleY = p.lerp(this.scaleY, 1, 0.1);

        // 8. Log State
        if (p.frameCount % 10 === 0) {
            this.logInfo(p);
        }
    }

    die() {
        createExplosion(this.x + this.width/2, this.y + this.height/2);
        gameState.gamePhase = "GAME_OVER_LOSE";
    }

    logInfo(p) {
        if (p.logs && p.logs.player_info) {
            p.logs.player_info.push({
                screen_x: this.x - gameState.camera.x,
                screen_y: this.y - gameState.camera.y,
                game_x: this.x,
                game_y: this.y,
                vx: this.vx,
                vy: this.vy,
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
    }

    render(p, cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;

        p.push();
        p.translate(screenX + this.width/2, screenY + this.height/2);
        p.scale(this.scaleX, this.scaleY);
        
        // Draw Shadow
        if (this.onGround) {
            p.noStroke();
            p.fill(0, 50);
            p.ellipse(0, this.height/2 + 2, this.width, 10);
        }

        // Draw Body
        p.stroke(COLORS.PLAYER_OUTLINE);
        p.strokeWeight(2);
        p.fill(COLORS.PLAYER);
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.width, this.height, 4);

        // Draw Face
        p.noStroke();
        p.fill(255);
        // Eyes
        const lookOffset = this.vx * 0.5;
        p.rect(-6 + lookOffset, -5, 6, 6);
        p.rect(6 + lookOffset, -5, 6, 6);
        p.fill(0);
        p.rect(-6 + lookOffset + (this.facing*1), -5, 2, 2);
        p.rect(6 + lookOffset + (this.facing*1), -5, 2, 2);

        p.pop();
    }
}

// ------------------------------------------------------------------
// Environment Entities
// ------------------------------------------------------------------
export class Platform extends Entity {
    constructor(x, y, w, h) {
        super(x, y, w, h);
    }

    render(p, cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;

        if (this.isOnScreen(screenX, screenY)) {
            p.noStroke();
            p.fill(COLORS.GROUND);
            p.rect(screenX, screenY, this.width, this.height);
            
            // Top highlight for depth
            p.fill(255, 255, 255, 30);
            p.rect(screenX, screenY, this.width, 4);
        }
    }
}

export class Spike extends Entity {
    constructor(x, y) {
        super(x, y, TILE_SIZE, TILE_SIZE); // Spikes fill a tile
    }

    render(p, cameraX, cameraY) {
        const screenX = this.x - cameraX;
        const screenY = this.y - cameraY;

        if (this.isOnScreen(screenX, screenY)) {
            p.noStroke();
            p.fill(COLORS.SPIKE);
            p.triangle(
                screenX, screenY + this.height,
                screenX + this.width / 2, screenY,
                screenX + this.width, screenY + this.height
            );
        }
    }
}

export class Collectible extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20); // Width/Height for AABB
        this.radius = 10;
        this.collected = false;
        this.baseY = y;
        this.offset = Math.random() * Math.PI * 2;
    }

    collect() {
        if (!this.collected) {
            this.collected = true;
            createSparkle(this.x + this.width/2, this.y + this.height/2, 10);
        }
    }

    render(p, cameraX, cameraY) {
        if (this.collected) return;

        // Bobbing animation
        const bobY = Math.sin(p.frameCount * 0.1 + this.offset) * 5;
        const screenX = this.x - cameraX;
        const screenY = this.baseY + bobY - cameraY;

        if (this.isOnScreen(screenX, screenY)) {
            p.push();
            p.translate(screenX + this.radius, screenY + this.radius);
            p.rotate(p.frameCount * 0.05);
            
            // Glow
            p.noStroke();
            p.fill(COLORS.ORB[0], COLORS.ORB[1], COLORS.ORB[2], 100);
            p.circle(0, 0, this.radius * 2 + Math.sin(p.frameCount * 0.2) * 5);
            
            // Core
            p.fill(COLORS.ORB);
            p.rectMode(p.CENTER);
            p.rect(0, 0, this.radius, this.radius);
            
            p.pop();
        }
    }
}