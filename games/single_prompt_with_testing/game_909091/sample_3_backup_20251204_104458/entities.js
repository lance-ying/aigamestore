/**
 * Game entities: Player, Platform, Decoration.
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_HEIGHT } from './globals.js';
import { applyPhysics } from './physics.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 45;
        
        this.vx = 0;
        this.vy = 0;
        
        // Stats
        this.moveSpeed = 4;
        this.jumpPowerMax = 16;
        this.jumpPowerMin = 5;
        
        // State
        this.onGround = false;
        this.isCharging = false;
        this.chargeStartTime = 0;
        this.chargeDuration = 0;
        this.maxChargeTime = 1000; // ms
        this.facing = 1; // 1 Right, -1 Left
        
        // Animation
        this.color = [200, 50, 50];
        this.animTimer = 0;
    }

    update(p) {
        // Handle Charge Logic
        if (this.isCharging) {
            this.chargeDuration = p.millis() - this.chargeStartTime;
            if (this.chargeDuration > this.maxChargeTime) {
                this.chargeDuration = this.maxChargeTime;
            }
            // While charging, horizontal velocity is killed? 
            // In Jump King, you stand still while charging.
            this.vx = 0;
        }

        applyPhysics(this, p);
        
        // Animation timer
        this.animTimer += 1;

        // Log position for debugging/analysis
        if (p.frameCount % 10 === 0 && p.logs) {
            p.logs.player_info.push({
                x: this.x, 
                y: this.y, 
                vx: this.vx, 
                vy: this.vy, 
                state: this.isCharging ? "CHARGING" : (this.onGround ? "GROUND" : "AIR"),
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
        
        // Update high score (height)
        // World coordinates: 0 is top, WORLD_HEIGHT is bottom.
        // So height score is WORLD_HEIGHT - y
        const currentHeight = Math.floor(WORLD_HEIGHT - this.y);
        if (currentHeight > gameState.maxHeight) {
            gameState.maxHeight = currentHeight;
            gameState.score = currentHeight;
        }
        
        // Win Condition check
        if (this.y < 100) { // Top of the world
            gameState.gamePhase = "GAME_OVER_WIN";
        }
    }

    render(p) {
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Flip sprite based on facing
        if (this.facing === -1) p.scale(-1, 1);
        
        // Draw Shadow
        p.noStroke();
        p.fill(0, 50);
        p.ellipse(0, this.height/2 - 2, 25, 8);

        // Body
        if (this.isCharging) {
            // Squish effect
            const squish = p.map(this.chargeDuration, 0, this.maxChargeTime, 1, 0.8);
            p.scale(1/squish, squish);
            p.fill(255, 100, 100); // Lighter red when charging
        } else {
            p.fill(this.color);
        }
        
        // Cape
        p.fill(150, 0, 0);
        p.rect(-10, -15, 8, 30);
        
        // Armor
        p.fill(this.color);
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.width, this.height, 4);
        
        // Helmet Visor
        p.fill(0);
        p.rect(4, -10, 16, 6);
        
        // Horns
        p.fill(220);
        p.triangle(-10, -20, -15, -30, -5, -20);
        p.triangle(0, -20, 5, -30, 5, -20);

        p.pop();
        
        // Charge Bar (above head)
        if (this.isCharging) {
            p.push();
            const chargePct = this.chargeDuration / this.maxChargeTime;
            p.translate(this.x, this.y - 20);
            p.fill(50);
            p.rect(0, 0, this.width, 8);
            p.fill(255, 255, 0);
            p.rect(1, 1, (this.width-2) * chargePct, 6);
            p.pop();
        }
    }
}

export class Platform {
    constructor(x, y, w, h, type = "NORMAL") {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = type; // NORMAL, ICE, SAND (affects friction - nice to have, implemented base friction only for now)
    }

    render(p) {
        p.push();
        p.noStroke();
        
        // Visual styling for bricks
        p.fill(80, 80, 90);
        p.rect(this.x, this.y, this.width, this.height);
        
        // Brick texture pattern
        p.stroke(60, 60, 70);
        p.strokeWeight(2);
        const brickW = 20;
        const brickH = 10;
        
        // Don't draw too many lines for performance, just simple pattern
        p.noFill();
        p.rect(this.x, this.y, this.width, this.height);
        
        // Highlights
        p.stroke(100, 100, 110);
        p.line(this.x, this.y, this.x + this.width, this.y);
        p.line(this.x, this.y, this.x, this.y + this.height);
        
        // Shadow
        p.stroke(40, 40, 50);
        p.line(this.x + this.width, this.y, this.x + this.width, this.y + this.height);
        p.line(this.x, this.y + this.height, this.x + this.width, this.y + this.height);
        
        p.pop();
    }
}

export class Decoration {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // "CLOUD", "TORCH", "GRASS"
        this.seed = Math.random() * 1000;
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        if (this.type === "CLOUD") {
            p.fill(255, 255, 255, 100);
            p.noStroke();
            const size = 30 + p.sin(p.frameCount * 0.02 + this.seed) * 5;
            p.circle(0, 0, size);
            p.circle(15, 5, size * 0.8);
            p.circle(-15, 5, size * 0.8);
        } else if (this.type === "TORCH") {
            // Holder
            p.fill(100, 50, 0);
            p.rect(-2, 0, 4, 15);
            // Flame
            const flicker = p.random(0.8, 1.2);
            p.fill(255, 100 + flicker * 50, 0);
            p.circle(0, -5, 10 * flicker);
            p.fill(255, 255, 0);
            p.circle(0, -5, 5 * flicker);
        } else if (this.type === "GRASS") {
            p.stroke(50, 200, 50);
            p.strokeWeight(2);
            p.noFill();
            p.beginShape();
            p.vertex(0, 0);
            p.bezierVertex(5, -5, 5, -15, 10 + p.sin(p.frameCount * 0.05 + this.seed)*2, -10);
            p.endShape();
        }
        
        p.pop();
    }
}

export class Artifact {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Glow
        p.noStroke();
        for (let i = 5; i > 0; i--) {
            p.fill(255, 215, 0, 50 - i * 10);
            p.circle(0, 0, i * 15 + p.sin(p.frameCount * 0.05) * 10);
        }
        
        // Diamond shape
        p.fill(255, 255, 200);
        p.rotate(p.frameCount * 0.02);
        p.rectMode(p.CENTER);
        p.rect(0, 0, 20, 20);
        
        p.pop();
    }
}