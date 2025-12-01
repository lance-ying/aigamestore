import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { checkRectRect, checkCircleRect } from './physics.js';
import { ParticleSystem } from './particles.js';

export class Player {
    constructor() {
        this.x = 100;
        this.y = 200;
        this.w = 30;
        this.h = 40;
        this.vy = 0;
        this.thrustPower = -1.2;
        this.maxVelocity = 10;
        this.isThrusting = false;
        this.rotation = 0;
    }

    update() {
        // Physics
        if (this.isThrusting) {
            this.vy += this.thrustPower;
            
            // Particles
            ParticleSystem.emit(this.x - 5, this.y + 15, 'FIRE', 2);
            ParticleSystem.emit(this.x - 5, this.y + 15, 'SMOKE', 1);
            
            // Shell casings (visual flair)
            if (gameState.frameCount % 5 === 0) {
                ParticleSystem.emit(this.x - 5, this.y + 5, 'SHELL', 1);
            }
            
            // "Bullets" shooting down (visual only lines)
            gameState.projectiles.push({
                x: this.x + 5,
                y: this.y + 20,
                vy: 15,
                life: 20
            });
        } else {
            this.vy += gameState.gravity;
        }

        // Cap velocity
        this.vy = Math.min(Math.max(this.vy, -this.maxVelocity), this.maxVelocity);

        this.y += this.vy;

        // Floor Collision
        if (this.y + this.h > CANVAS_HEIGHT - 20) {
            this.y = CANVAS_HEIGHT - 20 - this.h;
            this.vy = 0;
            // Running on ground particles
            if (Math.abs(this.vy) < 1 && gameState.frameCount % 5 === 0) {
                ParticleSystem.emit(this.x, this.y + this.h, 'SMOKE', 1);
            }
        }

        // Ceiling Collision
        if (this.y < 20) {
            this.y = 20;
            this.vy = 0;
        }
        
        // Tilt animation
        let targetRot = this.vy * 0.05;
        this.rotation = this.rotation * 0.8 + targetRot * 0.2;
    }

    render(p) {
        p.push();
        p.translate(this.x + this.w/2, this.y + this.h/2);
        p.rotate(this.rotation);
        
        // Draw Jetpack
        p.fill(150); // Silver
        p.rect(-15, -10, 10, 25, 2); 
        p.fill(50); // Gun barrel
        p.rect(-15, 15, 10, 10);
        
        // Draw Body
        p.fill(50, 100, 200); // Blue suit
        p.rect(-10, -15, 20, 35, 5);
        
        // Head
        p.fill(255, 200, 180); // Skin
        p.circle(0, -20, 20);
        
        // Goggles
        p.fill(0);
        p.rect(0, -22, 12, 6);
        
        // Arm (holding joystick)
        p.stroke(50, 100, 200);
        p.strokeWeight(6);
        p.line(0, -5, 10, 5);
        
        // Leg
        p.noStroke();
        p.fill(30, 30, 30);
        // Animate leg if running
        if (this.y >= CANVAS_HEIGHT - 20 - this.h - 1) {
            let legOffset = Math.sin(gameState.frameCount * 0.5) * 5;
            p.rect(-5 + legOffset, 15, 6, 10);
            p.rect(5 - legOffset, 15, 6, 10);
        } else {
            p.rect(-5, 18, 6, 12); // Hanging legs
            p.rect(5, 16, 6, 10);
        }

        p.pop();
    }
}

export class Zapper {
    constructor(x, y, length, vertical = false) {
        this.x = x;
        this.y = y;
        this.length = length;
        this.vertical = vertical;
        this.w = vertical ? 20 : length;
        this.h = vertical ? length : 20;
        this.active = true;
        this.zapOffset = 0;
    }

    update() {
        this.x -= gameState.scrollSpeed;
        this.zapOffset += 0.5;
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Draw End Caps
        p.fill(50);
        p.stroke(200);
        p.strokeWeight(2);
        
        if (this.vertical) {
            p.circle(10, 0, 20);
            p.circle(10, this.length, 20);
        } else {
            p.circle(0, 10, 20);
            p.circle(this.length, 10, 20);
        }

        // Electricity
        p.stroke(100, 200, 255);
        p.strokeWeight(3);
        p.noFill();
        
        p.beginShape();
        let segments = 10;
        let step = this.length / segments;
        
        if (this.vertical) {
            p.vertex(10, 0);
            for(let i=1; i<segments; i++) {
                let jitter = Math.sin(i * 10 + this.zapOffset) * 5 + (Math.random()-0.5)*10;
                p.vertex(10 + jitter, i * step);
            }
            p.vertex(10, this.length);
        } else {
            p.vertex(0, 10);
            for(let i=1; i<segments; i++) {
                let jitter = Math.sin(i * 10 + this.zapOffset) * 5 + (Math.random()-0.5)*10;
                p.vertex(i * step, 10 + jitter);
            }
            p.vertex(this.length, 10);
        }
        p.endShape();

        // Glow
        p.stroke(255, 255, 255, 100);
        p.strokeWeight(6);
        if (this.vertical) p.line(10, 0, 10, this.length);
        else p.line(0, 10, this.length, 10);
        
        p.pop();
    }

    checkCollision(player) {
        // Simple AABB check for the "kill zone" (slightly smaller than visual)
        let hitBox = {
            x: this.x + 5,
            y: this.y + 5,
            w: this.w - 10,
            h: this.h - 10
        };
        return checkRectRect(hitBox, {x: player.x, y: player.y, w: player.w, h: player.h});
    }
}

export class Missile {
    constructor(y) {
        this.x = CANVAS_WIDTH + 50;
        this.y = y;
        this.w = 40;
        this.h = 20;
        this.state = 'WARNING'; // WARNING, LAUNCHING, ACTIVE
        this.timer = 60; // 1 second warning
        this.speed = 0;
        this.targetY = y;
    }

    update(playerY) {
        if (this.state === 'WARNING') {
            this.timer--;
            // Track player slightly
            let dy = playerY - this.y;
            this.y += dy * 0.1;
            
            if (this.timer <= 0) {
                this.state = 'ACTIVE';
                this.speed = gameState.scrollSpeed * 2.5; // Faster than scroll
            }
        } else if (this.state === 'ACTIVE') {
            this.x -= this.speed;
            
            // Smoke trail
            if (gameState.frameCount % 3 === 0) {
                ParticleSystem.emit(this.x + 40, this.y + 10, 'SMOKE', 1);
            }
        }
    }

    render(p) {
        if (this.state === 'WARNING') {
            // Draw warning sign on right edge
            let drawX = CANVAS_WIDTH - 40;
            p.push();
            p.fill(255, 0, 0, (Math.sin(gameState.frameCount * 0.5) + 1) * 128); // Blink
            p.noStroke();
            p.rect(drawX, this.y - 15, 30, 30, 5);
            p.fill(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(20);
            p.text("!", drawX + 15, this.y);
            p.pop();
        } else {
            // Draw Missile
            p.push();
            p.translate(this.x, this.y);
            p.fill(200, 50, 50); // Red body
            p.rect(0, 0, 40, 20, 5);
            p.fill(50); // Fins
            p.triangle(40, 5, 50, -5, 40, 15);
            p.triangle(40, 5, 50, 25, 40, 15);
            p.fill(255, 200, 0); // Flame
            p.triangle(40, 5, 60 + Math.random()*10, 10, 40, 15);
            p.pop();
        }
    }

    checkCollision(player) {
        if (this.state !== 'ACTIVE') return false;
        return checkRectRect(
            {x: this.x, y: this.y, w: this.w, h: this.h},
            {x: player.x, y: player.y, w: player.w, h: player.h}
        );
    }
}

export class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.collected = false;
        this.spin = 0;
    }

    update() {
        this.x -= gameState.scrollSpeed;
        this.spin += 0.1;
    }

    render(p) {
        if (this.collected) return;
        
        p.push();
        p.translate(this.x, this.y);
        
        // 3D spin effect using width scale
        let w = Math.cos(this.spin) * this.radius * 2;
        
        p.fill(255, 215, 0); // Gold
        p.stroke(200, 150, 0);
        p.strokeWeight(2);
        p.ellipse(0, 0, Math.abs(w), this.radius * 2);
        
        p.fill(255, 240, 100);
        p.noStroke();
        p.ellipse(0, 0, Math.abs(w) * 0.6, this.radius * 1.2);
        
        p.pop();
    }

    checkCollision(player) {
        if (this.collected) return false;
        return checkCircleRect(this.x, this.y, this.radius, player.x, player.y, player.w, player.h);
    }
}

export class Background {
    constructor() {
        this.elements = [];
        this.wallX = 0;
    }

    update() {
        this.wallX -= gameState.scrollSpeed * 0.5;
        if (this.wallX <= -100) this.wallX = 0;
    }

    render(p) {
        // Lab Walls
        p.fill(80, 80, 90);
        p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); // Base gray

        p.stroke(60, 60, 70);
        p.strokeWeight(2);
        
        // Vertical pillars/seams
        for (let i = 0; i < CANVAS_WIDTH / 100 + 2; i++) {
            let x = this.wallX + i * 100;
            p.line(x, 0, x, CANVAS_HEIGHT);
            
            // Rivets
            p.noStroke();
            p.fill(50);
            p.circle(x, 50, 5);
            p.circle(x, CANVAS_HEIGHT - 50, 5);
            p.stroke(60, 60, 70);
        }

        // Horizontal Stripes (pipes)
        p.noStroke();
        p.fill(60, 60, 70);
        p.rect(0, 50, CANVAS_WIDTH, 20);
        p.rect(0, CANVAS_HEIGHT - 70, CANVAS_WIDTH, 20);
        
        // Floor and Ceiling warning stripes
        this.drawStripes(p, 0);
        this.drawStripes(p, CANVAS_HEIGHT - 20);
    }
    
    drawStripes(p, y) {
        p.fill(30);
        p.rect(0, y, CANVAS_WIDTH, 20);
        p.fill(255, 200, 0);
        for(let i=0; i<CANVAS_WIDTH; i+=40) {
            let offset = (gameState.distance % 40);
            p.quad(i - offset, y, i + 20 - offset, y, i + 10 - offset, y + 20, i - 10 - offset, y + 20);
        }
    }
}