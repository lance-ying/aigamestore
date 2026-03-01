/**
 * entities.js
 * Defines the Player class and Obstacle classes.
 * Contains logic for movement, collision response, and rendering.
 */

import { 
    gameState, 
    PLAYER_SIZE, 
    CANVAS_HEIGHT, 
    GRAVITY, 
    JUMP_FORCE,
    JUMP_HOLD_FORCE,
    MAX_JUMP_FRAMES,
    TERMINAL_VELOCITY,
    COLOR_PLAYER,
    COLOR_SPIKE,
    COLOR_PLATFORM,
    FRICTION,
    TILE_SIZE,
    SPIKE_WIDTH,
    SPIKE_HEIGHT
} from './globals.js';

import { 
    checkRectCollision, 
    checkRectTriangleCollision, 
    resolveCollision 
} from './physics.js';

import { isActionPressed } from './input.js';
import { get_automated_testing_action } from './testing.js';
import { createExplosion, createDust, createTrail } from './particles.js';

/**
 * The Player Character
 */
export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = PLAYER_SIZE;
        this.h = PLAYER_SIZE;
        this.vx = 0;
        this.vy = 0;
        
        // Jump State
        this.onGround = false;
        this.isJumping = false;
        this.jumpFrames = 0;
        this.coyoteTime = 0; // Frames allowed to jump after leaving edge
        
        // Visual Rotation
        this.rotation = 0;
    }

    update(p) {
        // 1. Update Horizontal Movement (Auto-run)
        this.vx = gameState.worldSpeed;
        this.x += this.vx;
        
        // 2. Automated Input Override
        let jumpPressed = isActionPressed('JUMP');
        
        if (gameState.controlMode !== 'HUMAN') {
            const action = get_automated_testing_action(gameState);
            if (action && action.jump) {
                jumpPressed = true;
            }
        }

        // 3. Jump Logic
        // Start Jump
        if (jumpPressed && (this.onGround || this.coyoteTime > 0) && !this.isJumping) {
            this.vy = JUMP_FORCE;
            this.isJumping = true;
            this.onGround = false;
            this.coyoteTime = 0;
            this.jumpFrames = 0;
            createDust(this.x + this.w/2, this.y + this.h);
            
            // Log Jump
            p.logs.player_info.push({ event: 'jump', x: this.x, y: this.y, frame: p.frameCount });
        }
        
        // Variable Jump Height (holding button)
        if (jumpPressed && this.isJumping && this.jumpFrames < MAX_JUMP_FRAMES) {
            this.vy += JUMP_HOLD_FORCE;
            this.jumpFrames++;
        }
        
        // Stop adding force if released
        if (!jumpPressed) {
            this.isJumping = false;
        }

        // 4. Vertical Physics
        this.vy += GRAVITY;
        this.vy = Math.min(this.vy, TERMINAL_VELOCITY);
        this.y += this.vy;
        
        // 5. Ground/Collision Detection
        this.onGround = false;
        
        // Check floor (bottom of screen death pit)
        if (this.y > CANVAS_HEIGHT + 100) {
            this.die(p);
        }

        // Check Entity Collisions
        this.checkCollisions(p);

        // Coyote Time decrement
        if (!this.onGround) {
            this.coyoteTime = Math.max(0, this.coyoteTime - 1);
        }
        
        // Visual Rotation
        if (!this.onGround) {
            this.rotation += 0.15;
        } else {
            // Snap to nearest 90
            const snap = Math.round(this.rotation / (Math.PI/2)) * (Math.PI/2);
            this.rotation += (snap - this.rotation) * 0.2;
        }
        
        // Particles
        if (p.frameCount % 5 === 0) {
            createTrail(this.x, this.y, COLOR_PLAYER);
        }
    }

    checkCollisions(p) {
        // We only check entities that are close to the player to save perf
        const nearby = gameState.entities.filter(e => 
            Math.abs(e.x - this.x) < 100 && 
            Math.abs(e.y - this.y) < 100
        );

        for (const entity of nearby) {
            if (entity.type === 'BLOCK' || entity.type === 'FLOOR') {
                const side = resolveCollision(this, entity);
                if (side) {
                    this.handleBlockCollision(side, entity);
                }
            } else if (entity.type === 'SPIKE') {
                if (checkRectTriangleCollision(this, entity)) {
                    this.die(p);
                }
            }
        }
    }

    handleBlockCollision(side, block) {
        if (side === 'BOTTOM') {
            // Landed on top
            this.y = block.y - this.h;
            this.vy = 0;
            this.onGround = true;
            this.isJumping = false;
            this.coyoteTime = 5;
        } else if (side === 'TOP') {
            // Hit head
            this.y = block.y + block.h;
            this.vy = 0;
        } else if (side === 'LEFT') {
            // Hit wall -> Death
            this.die();
        }
    }

    die(p) {
        if (gameState.gamePhase === "PLAYING") {
            createExplosion(this.x + this.w/2, this.y + this.h/2, COLOR_PLAYER);
            gameState.gamePhase = "GAME_OVER_LOSE";
            
            // Log Death
            if (p && p.logs) {
                p.logs.game_info.push({ 
                    event: 'death', 
                    score: gameState.score, 
                    distance: gameState.distanceTraveled,
                    frame: p.frameCount 
                });
            }
        }
    }

    render(p) {
        p.push();
        p.translate(this.x + this.w/2, this.y + this.h/2);
        p.rotate(this.rotation);
        
        p.fill(COLOR_PLAYER);
        p.stroke(255);
        p.strokeWeight(2);
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.w, this.h);
        
        // Eyes
        p.fill(255);
        p.noStroke();
        p.rect(8, -5, 8, 8); // Right eye
        p.rect(12, -5, 3, 3); // Pupil
        
        p.pop();
    }
}

/**
 * Base Obstacle Class
 */
export class Entity {
    constructor(x, y, w, h, type) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.type = type;
        this.markedForDeletion = false;
    }

    render(p) {
        // Override in subclasses
    }
}

export class Block extends Entity {
    constructor(x, y, w, h) {
        super(x, y, w, h, 'BLOCK');
    }

    render(p) {
        p.fill(COLOR_PLATFORM);
        p.stroke(80);
        p.strokeWeight(1);
        p.rect(this.x, this.y, this.w, this.h);
        
        // Detail: bevel
        p.noStroke();
        p.fill(120, 120, 140);
        p.rect(this.x + 2, this.y + 2, this.w - 4, 4);
    }
}

export class Floor extends Entity {
    constructor(x, y, w) {
        super(x, y, w, TILE_SIZE, 'FLOOR');
    }
    
    render(p) {
        p.fill(COLOR_PLATFORM);
        p.stroke(80);
        p.rect(this.x, this.y, this.w, this.h);
        
        // Pattern
        p.stroke(90);
        for(let i=0; i<this.w; i+=20) {
            p.line(this.x + i, this.y, this.x + i, this.y + this.h);
        }
    }
}

export class Spike extends Entity {
    constructor(x, y) {
        // Spikes are typically placed on top of blocks or floors
        super(x, y, SPIKE_WIDTH, SPIKE_HEIGHT, 'SPIKE');
    }

    render(p) {
        p.fill(COLOR_SPIKE);
        p.noStroke();
        p.triangle(
            this.x, this.y + this.h,           // Bottom Left
            this.x + this.w/2, this.y,         // Top Tip
            this.x + this.w, this.y + this.h   // Bottom Right
        );
        
        // Shine
        p.fill(255, 100, 100, 100);
        p.triangle(
            this.x + 10, this.y + this.h,
            this.x + this.w/2, this.y + 10,
            this.x + this.w/2, this.y + this.h
        );
    }
}