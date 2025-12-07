/**
 * entities.js
 * Classes for Game Objects: Player (Ball), Tile, Collectible, Particle.
 */

import { gameState, CONSTANTS, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { PhysicsEngine } from './physics.js';
import { randomRange, randomInt, hexToRgb, lerp } from './utils.js';

/* =========================================
   BASE ENTITY
   ========================================= */
class Entity {
    constructor(x, y, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z; // Height off ground
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        this.ax = 0;
        this.ay = 0;
        this.width = 0;
        this.height = 0;
        this.radius = 0;
        this.visible = true;
        this.dead = false;
        this.color = [255, 255, 255];
    }

    update() {
        // Override in children
    }

    render(p, camera) {
        // Override in children
    }
}

/* =========================================
   PLAYER (BALL)
   ========================================= */
export class Player extends Entity {
    constructor() {
        super(0, 0, 100); // Start centered, slightly behind (0), and in air
        this.radius = 15;
        this.useGravity = true;
        this.color = hexToRgb(COLORS.BALL);
        
        // Gameplay flags
        this.isGrounded = false;
        this.jumpCount = 0;
        this.lastSafeTile = null;
        
        // Visuals
        this.squashX = 1;
        this.squashY = 1;
        this.rotation = 0;
    }

    update() {
        // Input handling is done in game.js via controller, here we just apply physics
        PhysicsEngine.update(this);
        PhysicsEngine.constrainPlayerBounds(this);
        
        // Squash and stretch recovery
        this.squashX = lerp(this.squashX, 1, 0.1);
        this.squashY = lerp(this.squashY, 1, 0.1);
        
        // Rotation based on movement
        this.rotation += this.vx * 0.1;

        // Check death (falling into void)
        if (this.z < CONSTANTS.Z_KILL_THRESHOLD) {
            this.dead = true;
        }
    }

    bounce() {
        this.vz = CONSTANTS.BOUNCE_FORCE;
        this.isGrounded = false;
        // Squash effect
        this.squashX = 1.3;
        this.squashY = 0.7;
    }
    
    slam() {
        this.vz = -CONSTANTS.BOUNCE_FORCE * 1.5; // Fast fall
    }

    render(p, camera) {
        if (!this.visible) return;

        // Calculate screen position
        // Logic Y grows downwards. Camera Y tracks player.
        // Screen Y = (PlayerY - CameraY) + OffsetY - PlayerZ
        
        const screenX = CANVAS_WIDTH / 2 + this.x;
        const screenY_Shadow = (this.y - camera.y) + CONSTANTS.CAMERA_OFFSET_Y;
        const screenY_Ball = screenY_Shadow - this.z;

        // Draw Shadow
        // Shadow shrinks as Z increases
        const shadowScale = clamp(1 - (this.z / 300), 0.2, 1.0);
        p.noStroke();
        p.fill(COLORS.BALL_SHADOW);
        p.ellipse(screenX, screenY_Shadow, this.radius * 2 * shadowScale, this.radius * 0.8 * shadowScale);

        // Draw Ball
        p.push();
        p.translate(screenX, screenY_Ball);
        p.rotate(this.rotation);
        p.scale(this.squashX, this.squashY);
        
        // Ball body
        p.fill(this.color.r, this.color.g, this.color.b);
        p.stroke(200);
        p.strokeWeight(1);
        p.circle(0, 0, this.radius * 2);
        
        // Shine/Highlight
        p.noStroke();
        p.fill(255, 255, 255, 200);
        p.circle(-this.radius * 0.3, -this.radius * 0.3, this.radius * 0.6);
        
        p.pop();
    }
    
    logInfo(p) {
        p.logs.player_info.push({
            x: this.x,
            y: this.y,
            z: this.z,
            vx: this.vx,
            vy: this.vy,
            vz: this.vz,
            framecount: p.frameCount
        });
    }
}

/* =========================================
   TILE
   ========================================= */
export class Tile extends Entity {
    constructor(x, y, width, height, type = 'NORMAL') {
        super(x, y, 0);
        this.width = width;
        this.height = height;
        this.type = type; // NORMAL, MOVING, CRUMBLE
        
        this.active = false; // Has the player landed on it?
        this.processed = false; // Has score been awarded?
        this.pulse = 0;
        
        // Visuals
        const base = hexToRgb(COLORS.TILE_BASE);
        this.color = base;
        
        // Motion for moving tiles
        this.initialX = x;
        this.moveOffset = 0;
        this.moveSpeed = randomRange(1, 3);
        this.moveRange = 50;
    }

    update(frameCount) {
        // Moving logic
        if (this.type === 'MOVING') {
            this.moveOffset = Math.sin(frameCount * 0.05 * this.moveSpeed) * this.moveRange;
            this.x = this.initialX + this.moveOffset;
        }

        // Pulse effect if active (just landed)
        if (this.active) {
            this.pulse = lerp(this.pulse, 0, 0.1);
        }
    }

    render(p, camera) {
        const screenX = CANVAS_WIDTH / 2 + this.x; // Center x relative to screen center
        // Rect is drawn from top-left, so we need to offset by width/2 if x is center
        // Let's assume this.x is the center of the tile
        const drawX = screenX - this.width / 2;
        
        const screenY = (this.y - camera.y) + CONSTANTS.CAMERA_OFFSET_Y;
        
        // Check if on screen (culling)
        if (screenY < -100 || screenY > CANVAS_HEIGHT + 100) return;

        p.push();
        
        // Pseudo-3D effect: Draw thickness
        const thickness = 20;
        
        // Side face (Darker)
        p.fill(30, 30, 40);
        p.noStroke();
        p.rect(drawX, screenY + this.height, this.width, thickness);
        
        // Top face
        let c = this.active ? hexToRgb(COLORS.TILE_ACTIVE) : this.color;
        
        if (this.type === 'MOVING') {
            c = hexToRgb('#8e44ad'); // Purple for moving
        }
        
        // Flash white on land
        if (this.pulse > 0.1) {
            p.fill(255, 255, 255);
        } else {
            p.fill(c.r, c.g, c.b);
        }
        
        // Neon Glow stroke
        p.strokeWeight(2);
        p.stroke(c.r + 50, c.g + 50, c.b + 50);
        
        p.rect(drawX, screenY, this.width, this.height);
        
        // Inner detail
        p.noStroke();
        p.fill(255, 255, 255, 30);
        p.rect(drawX + 5, screenY + 5, this.width - 10, this.height - 10);
        
        p.pop();
    }
    
    onLand() {
        this.active = true;
        this.pulse = 1.0;
        
        // Change color permanently slightly
        this.color = { r: 50, g: 70, b: 90 };
    }
}

/* =========================================
   COLLECTIBLE (GEM)
   ========================================= */
export class Collectible extends Entity {
    constructor(x, y) {
        super(x, y, 30); // Hover at z=30
        this.radius = 12;
        this.baseZ = 30;
        this.angle = randomRange(0, Math.PI * 2);
    }
    
    update(frameCount) {
        this.angle += 0.05;
        // Bob up and down
        this.z = this.baseZ + Math.sin(this.angle) * 10;
    }
    
    render(p, camera) {
        const screenX = CANVAS_WIDTH / 2 + this.x;
        const screenY_Shadow = (this.y - camera.y) + CONSTANTS.CAMERA_OFFSET_Y;
        const screenY_Item = screenY_Shadow - this.z;
        
        if (screenY_Item < -50 || screenY_Item > CANVAS_HEIGHT + 50) return;

        // Shadow
        p.noStroke();
        p.fill(0, 0, 0, 50);
        p.circle(screenX, screenY_Shadow, this.radius);

        // Gem shape (Diamond)
        p.push();
        p.translate(screenX, screenY_Item);
        p.rotate(this.angle);
        
        p.fill(hexToRgb(COLORS.PARTICLE_COLLECT).r, hexToRgb(COLORS.PARTICLE_COLLECT).g, 0, 200);
        p.stroke(255);
        p.strokeWeight(1);
        
        p.beginShape();
        p.vertex(0, -this.radius);
        p.vertex(this.radius, 0);
        p.vertex(0, this.radius);
        p.vertex(-this.radius, 0);
        p.endShape(p.CLOSE);
        
        // Inner highlight
        p.fill(255, 255, 200, 150);
        p.circle(0, -5, 4);
        
        p.pop();
    }
}

/* =========================================
   PARTICLE SYSTEM
   ========================================= */
export class Particle extends Entity {
    constructor(x, y, z, color, speed = 1) {
        super(x, y, z);
        const angle = randomRange(0, Math.PI * 2);
        const mag = randomRange(1, 3) * speed;
        this.vx = Math.cos(angle) * mag;
        this.vy = Math.sin(angle) * mag;
        this.vz = randomRange(2, 6); // Pop up
        this.useGravity = true;
        this.life = 1.0;
        this.decay = randomRange(0.02, 0.05);
        this.color = color; // rgb object or array
        this.size = randomRange(3, 8);
    }
    
    update() {
        PhysicsEngine.update(this);
        this.life -= this.decay;
        if (this.life <= 0 || this.z < -50) {
            this.dead = true;
        }
    }
    
    render(p, camera) {
        if (this.dead) return;
        
        const screenX = CANVAS_WIDTH / 2 + this.x;
        const screenY = (this.y - camera.y) + CONSTANTS.CAMERA_OFFSET_Y - this.z;
        
        p.noStroke();
        // Handle array or object color
        let r, g, b;
        if (Array.isArray(this.color)) {
            [r, g, b] = this.color;
        } else {
            r = this.color.r; g = this.color.g; b = this.color.b;
        }
        
        p.fill(r, g, b, this.life * 255);
        p.circle(screenX, screenY, this.size * this.life);
    }
}

export function spawnParticles(x, y, z, color, count, speed = 1) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, z, color, speed));
    }
}

export function spawnConfetti(x, y, z, count) {
    for (let i = 0; i < count; i++) {
        const c = [randomInt(100,255), randomInt(100,255), randomInt(100,255)];
        gameState.particles.push(new Particle(x, y, z, c, 2));
    }
}