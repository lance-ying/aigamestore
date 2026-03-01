/**
 * entities.js
 * Contains the Player class, Obstacles, and Collectibles.
 * This is the core logic for game objects.
 */

import { gameState, COLORS, COLOR_KEYS, CANVAS_WIDTH, CANVAS_HEIGHT, hexToP5Color } from './globals.js';
import { applyPhysics, checkCircleRingCollision, checkCircleRectCollision } from './physics.js';
import { spawnExplosion } from './particles.js';

// ==========================================
// PLAYER CLASS
// ==========================================
export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 8;
        this.vx = 0;
        this.vy = 0;
        this.color = COLORS.CYAN; // Start color
        this.isDead = false;
        this.useGravity = true;
        
        // Trail effect
        this.trail = [];
    }

    update(p) {
        if (this.isDead) return;

        // Apply shared physics
        applyPhysics(this);
        
        // Screen bounds (Horizontal wrap-around?)
        // Let's implement boundaries instead of wrap for this style
        if (this.x < this.radius) {
            this.x = this.radius;
            this.vx *= -0.5;
        }
        if (this.x > CANVAS_WIDTH - this.radius) {
            this.x = CANVAS_WIDTH - this.radius;
            this.vx *= -0.5;
        }

        // Trail Logic
        if (gameState.frameCount % 3 === 0) {
            this.trail.push({ x: this.x, y: this.y, alpha: 200 });
        }
        if (this.trail.length > 10) this.trail.shift();

        // Update collisions
        this.checkCollisions(p);
    }

    jump() {
        // Snappy jump
        this.vy = -6.5; 
    }

    moveHorizontal(dir) {
        this.vx += dir * 0.5;
    }

    setColor(newColor) {
        this.color = newColor;
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        spawnExplosion(this.x, this.y, this.color);
        gameState.gamePhase = "GAME_OVER_LOSE";
    }

    checkCollisions(p) {
        // Check Obstacles
        for (const obs of gameState.obstacles) {
            if (obs.checkCollision(this)) {
                this.die();
                return;
            }
        }

        // Check Items (Stars, Color Changers)
        for (let i = gameState.items.length - 1; i >= 0; i--) {
            const item = gameState.items[i];
            const dx = this.x - item.x;
            const dy = this.y - item.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < this.radius + item.radius) {
                item.collect(this);
                gameState.items.splice(i, 1);
            }
        }
    }

    render(p) {
        if (this.isDead) return;

        // Draw trail
        p.push();
        p.noStroke();
        for (let t of this.trail) {
            const c = p.color(this.color);
            c.setAlpha(t.alpha);
            p.fill(c);
            p.circle(t.x, t.y - gameState.cameraY, this.radius * 1.5);
            t.alpha -= 10;
        }
        p.pop();

        // Draw Player Body
        p.push();
        p.fill(this.color);
        p.noStroke();
        p.circle(this.x, this.y - gameState.cameraY, this.radius * 2);
        
        // Inner Glow
        p.fill(255, 255, 255, 150);
        p.circle(this.x, this.y - gameState.cameraY, this.radius);
        p.pop();
    }
}

// ==========================================
// OBSTACLE CLASSES
// ==========================================

// Base Obstacle Class
class Obstacle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.rotation = 0;
        this.rotationSpeed = 0.02;
    }
    
    update() {
        this.rotation += this.rotationSpeed;
    }
    
    // Abstract method
    checkCollision(player) { return false; }
    render(p) {}
}

/**
 * Ring Obstacle
 * A circle made of 4 colored arcs.
 */
export class RingObstacle extends Obstacle {
    constructor(x, y, radius = 80, speed = 0.03) {
        super(x, y);
        this.radius = radius;
        this.thickness = 15;
        this.rotationSpeed = speed;
        
        // Define 4 segments
        this.segments = [
            { color: COLORS.CYAN,    start: 0,           end: Math.PI / 2 },
            { color: COLORS.MAGENTA, start: Math.PI / 2, end: Math.PI },
            { color: COLORS.YELLOW,  start: Math.PI,     end: Math.PI * 1.5 },
            { color: COLORS.PURPLE,  start: Math.PI * 1.5, end: Math.PI * 2 }
        ];
    }

    checkCollision(player) {
        return checkCircleRingCollision(
            player, 
            this, 
            this.radius - this.thickness/2, 
            this.radius + this.thickness/2, 
            this.segments
        );
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y - gameState.cameraY);
        p.rotate(this.rotation);
        
        p.noFill();
        p.strokeWeight(this.thickness);
        p.strokeCap(p.SQUARE); // Clean edges for segments
        
        for (let seg of this.segments) {
            p.stroke(seg.color);
            p.arc(0, 0, this.radius * 2, this.radius * 2, seg.start, seg.end);
        }
        
        p.pop();
    }
}

/**
 * Cross Obstacle
 * A rotating cross with 4 arms.
 */
export class CrossObstacle extends Obstacle {
    constructor(x, y, size = 120, speed = -0.025) {
        super(x, y);
        this.rotationSpeed = speed;
        this.size = size;
        this.armWidth = 15;
        this.armLength = size / 2;
        
        // Collision helpers: We treat each arm as a rotated rectangle
        this.arms = [
            { color: COLORS.CYAN,    angle: 0 },
            { color: COLORS.MAGENTA, angle: Math.PI / 2 },
            { color: COLORS.YELLOW,  angle: Math.PI },
            { color: COLORS.PURPLE,  angle: Math.PI * 1.5 }
        ];
    }

    checkCollision(player) {
        // Check each arm
        for (let arm of this.arms) {
            // Construct a temporary rect object for collision check
            // The rect is effectively defined by (x,y) of center, w, h, and total rotation
            
            // Total rotation of this arm in world space
            const totalRotation = this.rotation + arm.angle;
            
            // We need to model the arm position. 
            // In local space, the arm center is at (radius/2, 0) rotated by angle
            // Actually, simplified: center is (0,0). Each arm extends out.
            // Let's treat the cross as 2 long rectangles intersecting, but color logic requires 4 segments.
            // Approach: 4 rectangles, each offset from center.
            
            const offsetDist = this.armLength / 2;
            const cx = Math.cos(totalRotation) * offsetDist + this.x;
            const cy = Math.sin(totalRotation) * offsetDist + this.y;
            
            const rect = {
                x: cx,
                y: cy,
                w: this.armLength,
                h: this.armWidth,
                rotation: totalRotation,
                color: arm.color
            };
            
            if (checkCircleRectCollision(player, rect)) {
                return true;
            }
        }
        return false;
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y - gameState.cameraY);
        p.rotate(this.rotation);
        
        p.noStroke();
        p.rectMode(p.CENTER);
        
        // Draw 4 arms
        // Arm 1 (0 deg)
        p.fill(COLORS.CYAN);
        p.push(); p.translate(this.armLength/2, 0); p.rect(0, 0, this.armLength, this.armWidth, 5); p.pop();
        
        // Arm 2 (90 deg)
        p.fill(COLORS.MAGENTA);
        p.push(); p.rotate(Math.PI/2); p.translate(this.armLength/2, 0); p.rect(0, 0, this.armLength, this.armWidth, 5); p.pop();
        
        // Arm 3 (180 deg)
        p.fill(COLORS.YELLOW);
        p.push(); p.rotate(Math.PI); p.translate(this.armLength/2, 0); p.rect(0, 0, this.armLength, this.armWidth, 5); p.pop();

        // Arm 4 (270 deg)
        p.fill(COLORS.PURPLE);
        p.push(); p.rotate(Math.PI*1.5); p.translate(this.armLength/2, 0); p.rect(0, 0, this.armLength, this.armWidth, 5); p.pop();

        p.pop();
    }
}

/**
 * Double Ring Obstacle
 * Two concentric rings rotating in opposite directions.
 */
export class DoubleRingObstacle extends Obstacle {
    constructor(x, y) {
        super(x, y);
        this.inner = new RingObstacle(x, y, 60, 0.03);
        this.outer = new RingObstacle(x, y, 90, -0.02);
    }
    
    update() {
        // Sync position if container moves (not needed here but good practice)
        this.inner.update();
        this.outer.update();
    }
    
    checkCollision(player) {
        return this.inner.checkCollision(player) || this.outer.checkCollision(player);
    }
    
    render(p) {
        this.inner.render(p);
        this.outer.render(p);
    }
}

// ==========================================
// COLLECTIBLE CLASSES
// ==========================================

class Item {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.collected = false;
    }
    collect(player) {} // Abstract
    render(p) {}
}

export class Star extends Item {
    constructor(x, y) {
        super(x, y);
        this.value = 1;
    }
    
    collect(player) {
        gameState.score += this.value;
        spawnExplosion(this.x, this.y, '#FFFFFF');
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y - gameState.cameraY);
        // Bobbing animation
        const offset = Math.sin(gameState.frameCount * 0.1) * 3;
        p.translate(0, offset);
        
        p.fill(255);
        p.noStroke();
        
        // Draw Star shape
        p.beginShape();
        for (let i = 0; i < 5; i++) {
            const angle = Math.PI * 2 * i / 5 - Math.PI / 2;
            const r1 = this.radius;
            const r2 = this.radius * 0.5;
            p.vertex(Math.cos(angle) * r1, Math.sin(angle) * r1);
            const angle2 = angle + Math.PI / 5;
            p.vertex(Math.cos(angle2) * r2, Math.sin(angle2) * r2);
        }
        p.endShape(p.CLOSE);
        p.pop();
    }
}

export class ColorChanger extends Item {
    constructor(x, y) {
        super(x, y);
        this.radius = 10;
    }
    
    collect(player) {
        // Pick a random color distinct from current
        let newColor = player.color;
        while(newColor === player.color) {
            const idx = Math.floor(Math.random() * COLOR_KEYS.length);
            newColor = COLOR_KEYS[idx];
        }
        player.setColor(newColor);
        spawnExplosion(this.x, this.y, newColor);
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y - gameState.cameraY);
        
        // Draw 4 distinct quadrants to represent switching
        p.noStroke();
        const r = this.radius;
        
        p.fill(COLORS.CYAN);
        p.arc(0, 0, r*2, r*2, 0, Math.PI/2);
        p.fill(COLORS.MAGENTA);
        p.arc(0, 0, r*2, r*2, Math.PI/2, Math.PI);
        p.fill(COLORS.YELLOW);
        p.arc(0, 0, r*2, r*2, Math.PI, Math.PI*1.5);
        p.fill(COLORS.PURPLE);
        p.arc(0, 0, r*2, r*2, Math.PI*1.5, Math.PI*2);
        
        p.pop();
    }
}