import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { isKeyDown, KEYS } from './input.js';
import { PhysicsEngine } from './physics.js';
import { createExplosion } from './particles.js';
import { get_automated_testing_action } from './automated_test.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.originalRadius = 20;
        this.vx = 0;
        this.vy = 0;
        
        // Physics Params
        this.acc = 0.5;
        this.maxSpeed = 8;
        this.friction = 0.90;
        this.gravityScale = 1.0;
        
        // State
        this.isInflated = false;
        this.isDeflated = false;
        this.onGround = false;
        this.dead = false;
        
        // Visuals
        this.hairs = [];
        this.hairOffset = 0;
        this.generateHairs();
    }
    
    generateHairs() {
        for(let i=0; i<36; i++) {
            this.hairs.push({
                angle: (Math.PI * 2 / 36) * i,
                len: Math.random() * 5 + 5
            });
        }
    }

    update(p) {
        if (this.dead) return;

        // 1. Input Handling
        let inputLeft = isKeyDown(KEYS.LEFT);
        let inputRight = isKeyDown(KEYS.RIGHT);
        let inputUp = isKeyDown(KEYS.UP);
        let inputDown = isKeyDown(KEYS.DOWN);

        // Override for Automation
        if (gameState.controlMode !== "HUMAN") {
            const action = get_automated_testing_action(p, this);
            if (action) {
                if (action.left) inputLeft = true;
                if (action.right) inputRight = true;
                if (action.up) inputUp = true;
                if (action.down) inputDown = true;
            }
        }

        // 2. State Changes (Inflate/Deflate)
        this.isInflated = inputUp;
        this.isDeflated = inputDown;

        // Adjust properties based on state
        if (this.isInflated) {
            this.radius = this.originalRadius * 1.3;
            this.gravityScale = 0.15; // Float
            this.friction = 0.98; // Glidy
        } else if (this.isDeflated) {
            this.radius = this.originalRadius * 0.8;
            this.gravityScale = 3.0; // Heavy
            this.friction = 0.95;
        } else {
            this.radius = this.originalRadius;
            this.gravityScale = 1.0;
            this.friction = 0.90;
        }

        // 3. Movement Forces
        if (inputLeft) this.vx -= this.acc;
        if (inputRight) this.vx += this.acc;

        // Apply Gravity
        this.vy += gameState.gravity * this.gravityScale;

        // Apply Friction
        this.vx *= this.friction;
        
        // Cap terminal velocity
        const termVel = this.isDeflated ? 20 : (this.isInflated ? 3 : 12);
        this.vy = Math.min(this.vy, termVel); // Falling down max
        // Upward max? usually unrestricted by drag in simple physics but let's damp it
        if (this.isInflated && this.vy < -5) this.vy *= 0.9; 

        // 4. Update Position
        this.x += this.vx;
        this.y += this.vy;

        // 5. Collisions
        // Bounds
        if (this.x < this.radius) { this.x = this.radius; this.vx = 0; }
        if (this.y > gameState.worldHeight) { this.die(); } // Fall off world

        // Platforms
        this.onGround = PhysicsEngine.checkCollision(this, gameState.platforms);

        // Hazards
        if (PhysicsEngine.checkHazardCollision(this, gameState.hazards)) {
            this.die();
        }

        // Collectibles
        for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
            const c = gameState.collectibles[i];
            const d = p.dist(this.x, this.y, c.x, c.y);
            if (d < this.radius + c.radius) {
                createExplosion(c.x, c.y, 5, 'SPARKLE');
                gameState.score += 100;
                gameState.collectedCoins++;
                gameState.collectibles.splice(i, 1);
            }
        }
        
        // Goal
        if (gameState.goal) {
            const d = p.dist(this.x, this.y, gameState.goal.x, gameState.goal.y);
            if (d < this.radius + gameState.goal.width) {
                gameState.gamePhase = "GAME_OVER_WIN";
            }
        }
    }
    
    die() {
        this.dead = true;
        createExplosion(this.x, this.y, 20, 'DEATH');
        gameState.gamePhase = "GAME_OVER_LOSE";
    }

    render(p) {
        if (this.dead) return;

        p.push();
        p.translate(this.x, this.y);
        
        // Rotate based on velocity for rolling effect
        const rotationSpeed = this.vx * 0.1;
        this.hairOffset += rotationSpeed;
        p.rotate(this.hairOffset);

        // Draw Furball Body
        p.noStroke();
        // Color based on state
        if (this.isDeflated) p.fill(40, 150, 120); // Darker/Heavy
        else if (this.isInflated) p.fill(100, 255, 200); // Lighter/Airy
        else p.fill(64, 224, 208); // Turquoise

        // Main body
        p.circle(0, 0, this.radius * 2 - 4);

        // Hairs
        p.stroke(this.isDeflated ? [30,120,100] : [50, 200, 180]);
        p.strokeWeight(2);
        const time = p.millis() * 0.005;
        
        for(let hair of this.hairs) {
            const angle = hair.angle;
            const rInner = this.radius - 2;
            const wave = p.noise(Math.cos(angle) + time, Math.sin(angle) + time) * 5;
            const len = hair.len + (this.isInflated ? 5 : 0) - (this.isDeflated ? 3 : 0);
            
            const x1 = Math.cos(angle) * rInner;
            const y1 = Math.sin(angle) * rInner;
            const x2 = Math.cos(angle) * (rInner + len + wave);
            const y2 = Math.sin(angle) * (rInner + len + wave);
            
            p.line(x1, y1, x2, y2);
        }
        
        // Eyes (Keep upright by rotating back)
        p.rotate(-this.hairOffset);
        
        // Eye wobble
        const eyeX = this.vx * 1.5;
        const eyeY = this.vy * 1.5 - 5;
        
        p.fill(255);
        p.noStroke();
        p.circle(eyeX - 8, eyeY, 12);
        p.circle(eyeX + 8, eyeY, 12);
        
        p.fill(0);
        p.circle(eyeX - 8 + this.vx*0.2, eyeY, 4);
        p.circle(eyeX + 8 + this.vx*0.2, eyeY, 4);
        
        // Mustache/Mouth
        p.noFill();
        p.stroke(255);
        p.strokeWeight(3);
        p.arc(eyeX, eyeY + 10, 20, 10, 0, Math.PI);

        p.pop();
    }
}

export class Platform {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }
    render(p) {
        p.push();
        // Texture or gradient
        p.fill(80, 60, 50); // Wood/Earth color
        p.stroke(60, 40, 30);
        p.rect(this.x, this.y, this.width, this.height, 5);
        
        // Detail
        p.stroke(100, 80, 70);
        p.line(this.x + 5, this.y + 5, this.x + this.width - 5, this.y + 5);
        p.pop();
    }
}

export class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.bobOffset = Math.random() * Math.PI;
    }
    render(p) {
        const bob = Math.sin(p.millis() * 0.005 + this.bobOffset) * 5;
        p.push();
        p.translate(this.x, this.y + bob);
        p.fill(255, 215, 0); // Gold
        p.stroke(218, 165, 32);
        p.strokeWeight(2);
        p.circle(0, 0, this.radius * 2);
        p.fill(218, 165, 32);
        p.textSize(12);
        p.textAlign(p.CENTER, p.CENTER);
        p.noStroke();
        p.text("$", 0, 0);
        p.pop();
    }
}

export class Spike {
    constructor(x, y, w) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = 30;
        this.type = 'SPIKE';
    }
    render(p) {
        p.push();
        p.fill(150);
        p.stroke(100);
        const spikesCount = Math.floor(this.width / 20);
        for(let i=0; i<spikesCount; i++) {
            const sx = this.x + i * 20;
            p.triangle(sx, this.y + this.height, sx + 10, this.y, sx + 20, this.y + this.height);
        }
        p.pop();
    }
}

export class Goal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 60;
    }
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.fill(139, 69, 19); // Chest brown
        p.rect(-30, -30, 60, 40);
        p.arc(0, -30, 60, 40, Math.PI, 0);
        p.fill(255, 215, 0);
        p.rect(-5, -25, 10, 15); // Lock
        
        // Shine
        if (p.frameCount % 60 < 30) {
            p.noFill();
            p.stroke(255, 255, 0, 150);
            p.circle(0, 0, 80);
        }
        p.pop();
    }
}