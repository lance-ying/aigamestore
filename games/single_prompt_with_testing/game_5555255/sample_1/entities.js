/**
 * Game entities: Player, Platforms, Objects
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, MOVE_ACCEL, MAX_SPEED, JUMP_FORCE, TILE_SIZE } from './globals.js';
import { isKeyDown } from './input.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.color = { r: 0, g: 255, b: 255 }; // Cyan
        this.rotation = 0;
    }

    update(p) {
        // Input Handling
        if (isKeyDown(p, p.LEFT_ARROW)) {
            this.vx -= MOVE_ACCEL;
        }
        if (isKeyDown(p, p.RIGHT_ARROW)) {
            this.vx += MOVE_ACCEL;
        }
        if (isKeyDown(p, 16)) { // SHIFT - Brake
            this.vx *= 0.85;
        }

        // Jump
        if (isKeyDown(p, 32) && this.onGround) {
            this.vy = JUMP_FORCE;
            this.onGround = false;
        }

        // Cap speed
        if (this.vx > MAX_SPEED) this.vx = MAX_SPEED;
        if (this.vx < -MAX_SPEED) this.vx = -MAX_SPEED;

        // Simulate rotation for visuals
        this.rotation += this.vx * 0.1;

        // Logging
        if (gameState.frameCount % 10 === 0 && p.logs) {
             p.logs.player_info.push({
                x: this.x,
                y: this.y,
                vx: this.vx,
                vy: this.vy,
                framecount: gameState.frameCount,
                timestamp: Date.now()
            });
        }
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.rotation);
        
        // Glow effect
        p.drawingContext.shadowBlur = 15;
        p.drawingContext.shadowColor = p.color(this.color.r, this.color.g, this.color.b);
        
        p.fill(this.color.r, this.color.g, this.color.b);
        p.noStroke();
        p.circle(0, 0, this.radius * 2);
        
        // Detail inside ball to see rotation
        p.fill(255);
        p.circle(this.radius * 0.5, 0, this.radius * 0.4);
        
        p.pop();
        p.drawingContext.shadowBlur = 0; // Reset shadow
    }
    
    die() {
        gameState.gamePhase = "GAME_OVER_LOSE";
    }
}

export class Platform {
    constructor(x, y, w, h, type = 'NORMAL') {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = type; // NORMAL, BOUNCY, MOVING, VANISHING
        
        // Moving platform props
        this.vx = 0;
        this.vy = 0;
        this.startX = x;
        this.range = 100;
        this.speed = 2;
        
        if (this.type === 'MOVING') {
            this.vx = this.speed;
        }
    }

    update() {
        if (this.type === 'MOVING') {
            this.x += this.vx;
            if (this.x > this.startX + this.range || this.x < this.startX) {
                this.vx *= -1;
            }
        }
    }

    render(p) {
        p.push();
        if (this.type === 'NORMAL') {
            p.fill(50, 50, 70);
            p.stroke(100, 100, 150);
        } else if (this.type === 'BOUNCY') {
            p.fill(255, 0, 100); // Pink
            p.stroke(255, 100, 150);
            p.drawingContext.shadowBlur = 10;
            p.drawingContext.shadowColor = 'magenta';
        } else if (this.type === 'MOVING') {
            p.fill(0, 100, 255); // Blue
            p.stroke(0, 200, 255);
        } else if (this.type === 'VANISHING') {
            p.fill(100, 100, 100, 150);
            p.stroke(150);
        }
        
        p.rectMode(p.CORNER);
        p.strokeWeight(2);
        p.rect(this.x, this.y, this.width, this.height, 4);
        p.pop();
        p.drawingContext.shadowBlur = 0;
    }
}

export class Hazard {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
    }
    
    render(p) {
        p.push();
        p.fill(255, 0, 0); // Red
        p.noStroke();
        
        // Draw spikes
        let spikeCount = Math.floor(this.width / 20);
        for(let i=0; i<spikeCount; i++) {
            let sx = this.x + i * 20;
            p.triangle(sx, this.y + this.height, sx + 10, this.y, sx + 20, this.y + this.height);
        }
        p.pop();
    }
}

export class Collectible {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.value = 100;
        this.floatOffset = Math.random() * Math.PI * 2;
    }
    
    render(p) {
        let floatY = Math.sin(gameState.frameCount * 0.05 + this.floatOffset) * 5;
        p.push();
        p.translate(this.x, this.y + floatY);
        p.rotate(gameState.frameCount * 0.05);
        
        p.fill(255, 255, 0);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(0, 0, 12, 12); // Diamond shape due to rotation
        
        p.drawingContext.shadowBlur = 15;
        p.drawingContext.shadowColor = 'yellow';
        p.pop();
        p.drawingContext.shadowBlur = 0;
    }
}