/**
 * Game Entities: Player, Platforms, Enemies, Projectiles
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, TERMINAL_VELOCITY, JUMP_FORCE, PLAYER_SPEED, SUPER_JUMP_FORCE } from './globals.js';
import { ParticleSystem } from './particles.js';

/* --- PLAYER --- */
export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 40;
        this.vx = 0;
        this.vy = 0;
        this.facing = 1; // 1 Right, -1 Left
        this.isDead = false;
        
        // Visuals
        this.squash = 1;
        this.stretch = 1;
        this.noseOffset = 0;
        this.legAngle = 0;
    }

    update(p) {
        // Physics
        this.vy += GRAVITY;
        if (this.vy > TERMINAL_VELOCITY) this.vy = TERMINAL_VELOCITY;
        
        this.x += this.vx;
        this.y += this.vy;

        // Screen Wrapping
        if (this.x > CANVAS_WIDTH) this.x = -this.width;
        else if (this.x < -this.width) this.x = CANVAS_WIDTH;

        // Animation calculations
        if (Math.abs(this.vy) > 1) {
            this.stretch = p.map(Math.abs(this.vy), 0, TERMINAL_VELOCITY, 1, 1.2);
            this.squash = 1 / this.stretch;
        } else {
            this.stretch = p.lerp(this.stretch, 1, 0.1);
            this.squash = p.lerp(this.squash, 1, 0.1);
        }
        
        this.noseOffset = this.facing * 8;
        
        // Death Condition
        if (this.y > CANVAS_HEIGHT + 100) {
            this.die();
        }
    }

    jump(force = JUMP_FORCE) {
        this.vy = force;
        // Animation effect
        this.squash = 0.8;
        this.stretch = 1.2;
    }

    die() {
        if (!this.isDead) {
            this.isDead = true;
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Draw legs
        p.stroke(0);
        p.strokeWeight(2);
        let legOffset = 0;
        if (this.vy < 0) legOffset = 5; // Retract legs when jumping
        p.line(-8, 10, -10, 20 - legOffset);
        p.line(8, 10, 10, 20 - legOffset);

        // Body
        p.noStroke();
        p.fill(150, 255, 100); // Alien Green
        p.ellipse(0, 0, this.width * this.squash, this.height * this.stretch);

        // Eyes
        p.fill(255);
        p.circle(-6, -5, 10);
        p.circle(6, -5, 10);
        
        p.fill(0);
        p.circle(-6 + this.facing*2, -5, 3);
        p.circle(6 + this.facing*2, -5, 3);

        // Snout
        p.fill(100, 200, 50);
        p.ellipse(this.noseOffset, 2, 12, 8);

        p.pop();
    }
}

/* --- PLATFORM --- */
export class Platform {
    constructor(x, y, type = "NORMAL") {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 15;
        this.type = type; // NORMAL, MOVING, BREAKABLE, SPRING
        this.isBroken = false;
        
        // Moving platform properties
        this.speed = 2;
        this.direction = Math.random() > 0.5 ? 1 : -1;
        
        // Spring
        this.hasSpring = (Math.random() < 0.1 && type === "NORMAL");
        this.springActive = false;
    }

    update() {
        if (this.type === "MOVING") {
            this.x += this.speed * this.direction;
            if (this.x <= 0 || this.x + this.width >= CANVAS_WIDTH) {
                this.direction *= -1;
            }
        }
    }

    render(p) {
        if (this.isBroken) return;

        p.push();
        
        // Draw Spring
        if (this.hasSpring) {
            p.fill(200, 50, 50);
            p.rect(this.x + this.width/2 - 5, this.y - (this.springActive ? 15 : 5), 10, (this.springActive ? 15 : 5));
        }

        // Draw Platform
        p.stroke(0);
        p.strokeWeight(1);
        
        if (this.type === "NORMAL" || this.type === "SPRING") {
            p.fill(100, 230, 100); // Green
        } else if (this.type === "MOVING") {
            p.fill(100, 150, 255); // Blue
        } else if (this.type === "BREAKABLE") {
            p.fill(160, 100, 50); // Brown
            // Cracks
            p.stroke(100, 50, 0);
            p.line(this.x + 10, this.y + 2, this.x + 20, this.y + 12);
            p.line(this.x + 40, this.y + 12, this.x + 50, this.y + 2);
        }
        
        p.rect(this.x, this.y, this.width, this.height, 5);
        
        // Highlight
        p.noStroke();
        p.fill(255, 255, 255, 50);
        p.rect(this.x + 5, this.y + 2, this.width - 10, this.height/2 - 2, 3);
        
        p.pop();
    }
}

/* --- ENEMY --- */
export class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 30;
        this.vx = Math.random() > 0.5 ? 1.5 : -1.5;
        this.angle = 0;
        this.isDead = false;
        this.type = Math.random() > 0.5 ? "FLYER" : "FLOATER";
    }

    update() {
        this.x += this.vx;
        this.y += Math.sin(this.angle) * 0.5;
        this.angle += 0.1;

        if (this.x <= 0 || this.x + this.width >= CANVAS_WIDTH) {
            this.vx *= -1;
        }
    }

    render(p) {
        if (this.isDead) return;
        
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        
        if (this.type === "FLYER") {
            // Bat-like monster
            p.fill(180, 50, 180);
            p.beginShape();
            p.vertex(-20, 0);
            p.vertex(-10, -10);
            p.vertex(0, 0);
            p.vertex(10, -10);
            p.vertex(20, 0);
            p.vertex(0, 15);
            p.endShape(p.CLOSE);
            
            // Wings animation
            p.fill(120, 30, 120);
            let wingY = Math.sin(this.angle * 2) * 5;
            p.triangle(-20, 0, -35, -10 + wingY, -15, 10);
            p.triangle(20, 0, 35, -10 + wingY, 15, 10);
            
            // Eyes
            p.fill(255, 255, 0);
            p.circle(-5, -2, 5);
            p.circle(5, -2, 5);
        } else {
            // Blob monster
            p.fill(255, 100, 100);
            p.circle(0, 0, 30);
            
            // Mouth
            p.fill(0);
            p.ellipse(0, 5, 10, 5 + Math.sin(this.angle)*2);
            
            // One Eye
            p.fill(255);
            p.circle(0, -5, 12);
            p.fill(0);
            p.circle(Math.sin(this.angle)*2, -5, 4);
        }
        
        p.pop();
    }
}

/* --- PROJECTILE --- */
export class Projectile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 4;
        this.vy = -12;
        this.active = true;
    }

    update() {
        this.y += this.vy;
        if (this.y < -50) this.active = false;
    }

    render(p) {
        if (!this.active) return;
        p.push();
        p.fill(255, 200, 0);
        p.noStroke();
        p.circle(this.x, this.y, this.radius * 2);
        p.pop();
    }
}

/* --- COLLECTIBLE --- */
export class Collectible {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.collected = false;
        this.rot = 0;
    }

    update() {
        this.rot += 0.05;
    }

    render(p) {
        if (this.collected) return;
        
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.rot);
        p.fill(255, 215, 0);
        p.noStroke();
        
        // Draw star
        p.beginShape();
        for(let i = 0; i < 5; i++) {
            let angle = p.TWO_PI * i / 5 - p.HALF_PI;
            let x1 = Math.cos(angle) * this.radius;
            let y1 = Math.sin(angle) * this.radius;
            p.vertex(x1, y1);
            angle += p.TWO_PI / 10;
            let x2 = Math.cos(angle) * (this.radius * 0.4);
            let y2 = Math.sin(angle) * (this.radius * 0.4);
            p.vertex(x2, y2);
        }
        p.endShape(p.CLOSE);
        p.pop();
    }
}