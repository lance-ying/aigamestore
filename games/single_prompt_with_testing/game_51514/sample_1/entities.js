/**
 * entities.js
 * Definitions for all game objects: Player, Enemies, Platforms, etc.
 */

import { 
    gameState, CANVAS_WIDTH, CANVAS_HEIGHT, 
    GRAVITY_FORCE, MOVE_SPEED, JUMP_FORCE, 
    COLORS, GRAVITY_COOLDOWN, DASH_SPEED, DASH_DURATION, DASH_COOLDOWN, INVULNERABILITY_TIME
} from './globals.js';
import { resolvePlatformCollision, checkPlayerHazard, checkPlayerCollectible, checkAABB } from './physics.js';
import { spawnParticles } from './particles.js';
import { isKeyDown, KEYS } from './input.js';

// ==========================================
// Base Entity
// ==========================================
export class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.markedForDeletion = false;
    }
    
    update(p) { }
    
    render(p) {
        // Debug render
        p.stroke(255);
        p.noFill();
        p.rect(this.x, this.y, this.width, this.height);
    }
}

// ==========================================
// Player
// ==========================================
export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20); // 20x20 pixel size
        this.prevX = x;
        this.prevY = y;
        
        // State
        this.onGround = false;
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashCooldownTimer = 0;
        this.gravityCooldownTimer = 0;
        this.invulnerabilityTimer = 0;
        this.facing = 1; // 1 = Right, -1 = Left
        
        // Stats
        this.health = 3;
        this.maxHealth = 3;
        
        // Physics overrides
        this.gravityScale = 1;
    }
    
    update(p) {
        // Store previous position for collision resolution
        this.prevX = this.x;
        this.prevY = this.y;
        
        // 1. Handle Input (Movement)
        let dir = 0;
        if (isKeyDown(KEYS.LEFT)) dir = -1;
        if (isKeyDown(KEYS.RIGHT)) dir = 1;
        
        // Face direction
        if (dir !== 0) this.facing = dir;
        
        // Horizontal Movement
        if (this.isDashing) {
            this.vx = this.facing * DASH_SPEED;
            // Spawn dash afterimage
            if (gameState.frameCount % 2 === 0) {
                spawnParticles(this.x + this.width/2, this.y + this.height/2, 'DASH', 1);
            }
        } else {
            // Smooth acceleration/deceleration
            const targetSpeed = dir * MOVE_SPEED;
            this.vx = p.lerp(this.vx, targetSpeed, 0.2);
        }
        
        // 2. Handle Action Inputs
        
        // Jump
        if (isKeyDown(KEYS.SPACE) && this.onGround && !this.isDashing) {
            // Jump direction depends on gravity
            this.vy = -JUMP_FORCE * gameState.gravityDirection;
            this.onGround = false;
            spawnParticles(this.x + this.width/2, this.y + (gameState.gravityDirection === 1 ? this.height : 0), 'TRAIL', 3);
        }
        
        // Gravity Flip
        if (this.gravityCooldownTimer > 0) this.gravityCooldownTimer--;
        
        // Logic: Z pressed, cooldown ready
        if (isKeyDown(KEYS.Z) && this.gravityCooldownTimer === 0 && !this.isDashing) {
            gameState.gravityDirection *= -1;
            this.gravityCooldownTimer = GRAVITY_COOLDOWN;
            this.onGround = false; // Detach from surface
            // Slight boost to help unstick? No, physics engine handles it.
            // Add visual effect
            spawnParticles(this.x + this.width/2, this.y + this.height/2, 'GRAVITY', 10);
        }
        
        // Dash
        if (this.dashCooldownTimer > 0) this.dashCooldownTimer--;
        if (this.dashTimer > 0) {
            this.dashTimer--;
            if (this.dashTimer === 0) {
                this.isDashing = false;
                this.vx = 0; // Stop momentum after dash
            }
        }
        
        if (isKeyDown(KEYS.SHIFT) && this.dashCooldownTimer === 0 && !this.isDashing) {
            this.isDashing = true;
            this.dashTimer = DASH_DURATION;
            this.dashCooldownTimer = DASH_COOLDOWN;
            // Impulse
            this.vx = this.facing * DASH_SPEED;
            this.vy = 0; // Defy gravity during dash
        }
        
        // 3. Apply Physics
        if (!this.isDashing) {
            // Gravity
            this.vy += GRAVITY_FORCE * gameState.gravityDirection;
            
            // Terminal Velocity check
            if (Math.abs(this.vy) > 15) this.vy = 15 * Math.sign(this.vy);
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        // 4. World Bounds (Death)
        if (this.y > CANVAS_HEIGHT + 100 || this.y < -100) {
            this.die();
        }
        
        // 5. Update Timers
        if (this.invulnerabilityTimer > 0) this.invulnerabilityTimer--;
        
        // 6. Particle Trail (if moving fast)
        if (Math.abs(this.vx) > 3 && gameState.frameCount % 5 === 0) {
            spawnParticles(this.x + this.width/2, this.y + this.height/2, 'TRAIL', 1);
        }
    }
    
    takeDamage(amount) {
        if (this.isDashing || this.invulnerabilityTimer > 0) return;
        
        this.health -= amount;
        this.invulnerabilityTimer = INVULNERABILITY_TIME;
        
        // Visual feedback
        spawnParticles(this.x + this.width/2, this.y + this.height/2, 'EXPLOSION', 5);
        gameState.shakeTimer = 10;
        gameState.shakeMagnitude = 5;
        
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        spawnParticles(this.x + this.width/2, this.y + this.height/2, 'EXPLOSION', 20);
        gameState.gamePhase = "GAME_OVER_LOSE";
    }
    
    render(p) {
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Rotate based on gravity
        if (gameState.gravityDirection === -1) {
            p.rotate(p.PI);
            p.scale(-1, 1); // Fix mirroring when upside down
        }
        
        // Flash if invulnerable
        if (this.invulnerabilityTimer > 0 && Math.floor(gameState.frameCount / 4) % 2 === 0) {
            p.fill(COLORS.PLAYER_DAMAGED);
        } else {
            p.fill(COLORS.PLAYER);
        }
        
        // Draw Neon Cube
        p.stroke(255);
        p.strokeWeight(2);
        
        // Shape
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.width, this.height, 4);
        
        // Inner detail
        p.noFill();
        p.stroke(255, 255, 255, 150);
        p.rect(0, 0, this.width * 0.6, this.height * 0.6);
        
        p.pop();
    }
}

// ==========================================
// Platform
// ==========================================
export class Platform extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height);
    }
    
    render(p) {
        // Draw only if on screen (culling)
        const screenX = this.x - gameState.cameraX;
        if (screenX < -this.width || screenX > CANVAS_WIDTH) return;
        
        p.push();
        p.fill(COLORS.PLATFORM);
        p.stroke(COLORS.PLATFORM_STROKE);
        p.strokeWeight(2);
        p.rect(screenX, this.y - gameState.cameraY, this.width, this.height, 2);
        
        // Grid texture detail
        p.stroke(COLORS.PLATFORM_STROKE[0], COLORS.PLATFORM_STROKE[1], COLORS.PLATFORM_STROKE[2], 50);
        p.line(screenX, this.y - gameState.cameraY, screenX + this.width, this.y + this.height - gameState.cameraY);
        p.line(screenX + this.width, this.y - gameState.cameraY, screenX, this.y + this.height - gameState.cameraY);
        p.pop();
    }
}

// ==========================================
// Hazard
// ==========================================
export class Hazard extends Entity {
    constructor(x, y, type) {
        super(x, y, 30, 30);
        this.type = type; // 'SPIKE', 'SAW'
        this.orientation = 'UP'; // UP, DOWN (for spikes)
        this.rotation = 0;
        
        if (type === 'SAW') {
            this.radius = 18;
            this.width = 36;
            this.height = 36;
        }
    }
    
    update(p) {
        if (this.type === 'SAW') {
            this.rotation += 0.15;
            
            // Patrol movement for saws (optional simple bobbing)
            this.y += Math.sin(gameState.frameCount * 0.05) * 0.5;
        }
    }
    
    render(p) {
        const screenX = this.x - gameState.cameraX;
        if (screenX < -50 || screenX > CANVAS_WIDTH + 50) return;
        
        p.push();
        p.translate(screenX, this.y - gameState.cameraY);
        p.fill(COLORS.SPIKE);
        p.noStroke();
        
        if (this.type === 'SPIKE') {
            // Draw Triangle
            p.beginShape();
            if (this.orientation === 'UP') {
                p.vertex(-this.width/2, this.height);
                p.vertex(0, 0);
                p.vertex(this.width/2, this.height);
            } else {
                p.vertex(-this.width/2, 0);
                p.vertex(0, this.height);
                p.vertex(this.width/2, 0);
            }
            p.endShape(p.CLOSE);
        } else if (this.type === 'SAW') {
            p.rotate(this.rotation);
            p.fill(0);
            p.stroke(COLORS.SPIKE);
            p.strokeWeight(3);
            
            // Draw Saw blade
            p.circle(0, 0, this.radius * 2);
            for(let i=0; i<8; i++) {
                p.rotate(p.PI/4);
                p.line(this.radius * 0.5, 0, this.radius * 1.2, 0);
            }
        }
        
        p.pop();
    }
}

// ==========================================
// Enemy
// ==========================================
export class Enemy extends Entity {
    constructor(x, y, patrolDistance) {
        super(x, y, 25, 25);
        this.startX = x;
        this.patrolDist = patrolDistance;
        this.speed = 2;
        this.dir = 1;
        this.radius = 12.5;
    }
    
    update(p) {
        // Patrol logic
        this.x += this.speed * this.dir;
        
        if (this.x > this.startX + this.patrolDist) this.dir = -1;
        if (this.x < this.startX) this.dir = 1;
        
        // Simple bobbing
        this.y += Math.sin(gameState.frameCount * 0.1) * 0.5;
        
        // Check collision with player
        if (gameState.player) {
            const dx = gameState.player.x + gameState.player.width/2 - (this.x); // Center to Center approx
            const dy = gameState.player.y + gameState.player.height/2 - (this.y);
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < this.radius + gameState.player.width/2) {
                gameState.player.takeDamage(1);
            }
        }
    }
    
    render(p) {
        const screenX = this.x - gameState.cameraX;
        if (screenX < -50 || screenX > CANVAS_WIDTH + 50) return;
        
        p.push();
        p.translate(screenX, this.y - gameState.cameraY);
        
        // Drone Body
        p.fill(COLORS.ENEMY);
        p.noStroke();
        p.circle(0, 0, this.radius * 2);
        
        // Scanning Eye
        p.fill(255);
        const eyeOffset = Math.sin(gameState.frameCount * 0.2) * 5;
        p.circle(eyeOffset, -5, 8);
        p.fill(255, 0, 0);
        p.circle(eyeOffset, -5, 4);
        
        // Hover prop (visual)
        p.stroke(255, 100);
        p.line(-15, -15, 15, -15);
        
        p.pop();
    }
}

// ==========================================
// Collectible
// ==========================================
export class Collectible extends Entity {
    constructor(x, y) {
        super(x, y, 15, 15);
        this.size = 15;
        this.rotation = 0;
        this.startY = y;
    }
    
    update(p) {
        this.rotation += 0.05;
        this.y = this.startY + Math.sin(gameState.frameCount * 0.1) * 5;
        
        // Check player collision
        if (gameState.player && !this.markedForDeletion) {
            if (checkPlayerCollectible(gameState.player, this)) {
                this.collect();
            }
        }
    }
    
    collect() {
        this.markedForDeletion = true;
        gameState.score += 100;
        spawnParticles(this.x, this.y, 'COLLECT', 8);
    }
    
    render(p) {
        const screenX = this.x - gameState.cameraX;
        if (screenX < -20 || screenX > CANVAS_WIDTH + 20) return;
        
        p.push();
        p.translate(screenX, this.y - gameState.cameraY);
        p.rotate(this.rotation);
        
        p.fill(COLORS.COLLECTIBLE);
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.size, this.size);
        
        p.pop();
    }
}

// ==========================================
// Portal
// ==========================================
export class Portal extends Entity {
    constructor(x, y) {
        super(x, y, 40, 80);
    }
    
    update(p) {
        if (gameState.player) {
            if (checkAABB(gameState.player, this)) {
                gameState.gamePhase = "LEVEL_COMPLETE";
            }
        }
    }
    
    render(p) {
        const screenX = this.x - gameState.cameraX;
        if (screenX < -50 || screenX > CANVAS_WIDTH + 50) return;
        
        p.push();
        p.translate(screenX + this.width/2, this.y - gameState.cameraY + this.height/2);
        
        // Swirling effect
        p.noFill();
        p.stroke(COLORS.PORTAL);
        p.strokeWeight(3);
        
        for(let i=0; i<3; i++) {
            p.push();
            p.rotate(gameState.frameCount * 0.05 + (i * p.PI/3));
            p.ellipse(0, 0, 20 + i*10, 60 + i*5);
            p.pop();
        }
        
        // Particles emitted from portal
        if (gameState.frameCount % 5 === 0) {
            // purely visual particles handled in render for ease here
            // ideally in update
        }
        
        p.pop();
    }
}