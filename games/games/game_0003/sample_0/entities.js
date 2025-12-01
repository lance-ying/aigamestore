import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { CONTROLS, isKeyPressed } from './input.js';
import { get_automated_testing_action } from './testing.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.baseRadius = 20;
        this.radius = 20;
        this.angle = 0; // For rolling visualization
        
        // Physics params
        this.moveSpeed = 0.4;
        this.maxSpeed = 8;
        this.jumpForce = -7;
        this.inflateGravity = 0.15;
        this.deflateGravity = 1.2;
        this.normalGravity = 0.5;
        
        this.isGrounded = false;
        this.isInflated = false;
        this.isDeflated = false;
        
        // Visuals
        this.hairs = [];
        for(let i=0; i<16; i++) {
            this.hairs.push({
                angle: (Math.PI * 2 * i) / 16,
                len: 5 + Math.random() * 5
            });
        }
        
        gameState.player = this;
    }

    update() {
        // Handle Input
        let left = isKeyPressed(CONTROLS.LEFT);
        let right = isKeyPressed(CONTROLS.RIGHT);
        let up = isKeyPressed(CONTROLS.SPACE) || isKeyPressed(CONTROLS.UP);
        let down = isKeyPressed(CONTROLS.DOWN);

        // Automated Testing Override
        if (gameState.controlMode !== "HUMAN") {
            const action = get_automated_testing_action(gameState);
            if (action) {
                if (action.left) left = true;
                if (action.right) right = true;
                if (action.up) up = true;
                if (action.down) down = true;
            }
        }

        // State Determination
        this.isInflated = up;
        this.isDeflated = down;

        // Physics Modifications based on State
        let currentGravity = this.normalGravity;
        let currentFriction = gameState.friction;
        
        if (this.isInflated) {
            currentGravity = this.inflateGravity;
            this.radius = this.baseRadius * 1.2; // Grow
            currentFriction = 0.95; // Floaty air resistance
        } else if (this.isDeflated) {
            currentGravity = this.deflateGravity;
            this.radius = this.baseRadius * 0.8; // Shrink
        } else {
            this.radius = this.baseRadius;
        }

        // Horizontal Movement
        if (left) this.vx -= this.moveSpeed;
        if (right) this.vx += this.moveSpeed;

        // Apply Forces
        this.vy += currentGravity;
        
        // Friction
        if (this.isGrounded) {
            this.vx *= gameState.groundFriction;
            // Add rolling momentum boost?
        } else {
            this.vx *= gameState.airResistance;
        }

        // Limit Speed
        this.vx = Math.max(Math.min(this.vx, this.maxSpeed), -this.maxSpeed);
        // Terminal velocity
        this.vy = Math.min(this.vy, 15);

        // Position Update
        this.x += this.vx;
        this.y += this.vy;

        // Rolling Angle
        this.angle += this.vx / this.radius;

        // Boundary Checks (World)
        if (this.x < this.radius) { this.x = this.radius; this.vx = 0; }
        if (this.y > gameState.worldHeight + 100) { this.die(); } // Fall off world
    }

    die() {
        gameState.gamePhase = "GAME_OVER_LOSE";
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.angle);

        // Body
        p.noStroke();
        if (this.isDeflated) p.fill(46, 139, 87); // Darker green heavy
        else if (this.isInflated) p.fill(144, 238, 144); // Light green floaty
        else p.fill(60, 179, 113); // Medium sea green

        p.circle(0, 0, this.radius * 2);

        // Hairs
        p.stroke(34, 139, 34);
        p.strokeWeight(2);
        for (let h of this.hairs) {
            let startR = this.radius;
            let endR = this.radius + h.len;
            p.line(
                Math.cos(h.angle) * startR, Math.sin(h.angle) * startR,
                Math.cos(h.angle) * endR, Math.sin(h.angle) * endR
            );
        }

        // Eyes
        p.rotate(-this.angle); // Counter rotate eyes to look forward/velocity dir
        // Look ahead
        let lookX = Math.sign(this.vx) * 8;
        let lookY = -5;
        p.fill(255);
        p.noStroke();
        p.circle(lookX - 4, lookY, 8);
        p.circle(lookX + 4, lookY, 8);
        p.fill(0);
        p.circle(lookX - 4, lookY, 3);
        p.circle(lookX + 4, lookY, 3);

        p.pop();
    }
}

export class Platform {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        gameState.platforms.push(this);
    }

    render(p) {
        p.fill(50, 40, 60); // Dark rock color
        p.stroke(70, 60, 80);
        p.rect(this.x, this.y, this.w, this.h);
        
        // Detail texture
        p.stroke(80, 70, 90, 100);
        p.noFill();
        p.rect(this.x + 5, this.y + 5, this.w - 10, this.h - 10);
    }
}

export class Hazard {
    constructor(x, y, w, h, type) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.type = type; // 'spike', 'saw'
        gameState.hazards.push(this);
    }

    render(p) {
        p.fill(200, 50, 50);
        p.noStroke();
        
        if (this.type === 'spike') {
            p.triangle(
                this.x - this.w/2, this.y + this.h/2,
                this.x, this.y - this.h/2,
                this.x + this.w/2, this.y + this.h/2
            );
        } else {
            p.rect(this.x, this.y, this.w, this.h);
        }
    }
}

export class Collectible {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.r = 12;
        this.collected = false;
        this.floatOffset = Math.random() * Math.PI * 2;
        gameState.collectibles.push(this);
        gameState.totalCoinsInLevel++;
    }

    collect() {
        this.collected = true;
        gameState.score++;
        // Spawn particles
        for(let i=0; i<5; i++) {
            gameState.particles.push(new Particle(this.x, this.y, [255, 215, 0]));
        }
    }

    render(p) {
        const floatY = Math.sin(p.frameCount * 0.05 + this.floatOffset) * 5;
        p.push();
        p.translate(this.x, this.y + floatY);
        p.rotate(p.frameCount * 0.05); // Spin
        p.fill(255, 215, 0); // Gold
        p.stroke(218, 165, 32);
        p.strokeWeight(2);
        p.circle(0, 0, this.r * 2);
        p.fill(218, 165, 32);
        p.textSize(12);
        p.textAlign(p.CENTER, p.CENTER);
        p.noStroke();
        p.text("$", 0, 0);
        p.pop();
    }
}

export class Exit {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.r = 30;
        gameState.exit = this;
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Pulse effect
        let pulse = 1 + Math.sin(p.frameCount * 0.1) * 0.1;
        
        if (gameState.score >= gameState.totalCoinsInLevel) {
            p.fill(0, 200, 255, 100);
            p.stroke(0, 255, 255);
            // Rotate rings
            p.push();
            p.rotate(p.frameCount * 0.02);
            p.rectMode(p.CENTER);
            p.noFill();
            p.rect(0, 0, this.r * 1.5, this.r * 1.5);
            p.pop();
        } else {
            p.fill(100, 100, 100, 100);
            p.stroke(150);
        }
        
        p.strokeWeight(2);
        p.circle(0, 0, this.r * 2 * pulse);
        
        p.fill(255);
        p.noStroke();
        p.textSize(10);
        p.text(gameState.score >= gameState.totalCoinsInLevel ? "EXIT" : "LOCKED", 0, 0);
        p.pop();
    }
}

export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.color = color;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.02;
    }

    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.circle(this.x, this.y, 4 * this.life);
    }
}