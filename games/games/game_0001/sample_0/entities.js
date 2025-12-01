import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { isKeyDown } from './input.js';
import { resolvePlayerPlatform, checkRectCollision } from './physics.js';
import { createExplosion } from './particles.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.baseRadius = 18;
        this.r = this.baseRadius;
        
        // Physics props
        this.speed = 0.5;
        this.jumpForce = -8; // initial "puff"
        this.floatForce = -0.3; // continuous upward force when inflated
        
        // State
        this.state = "NORMAL"; // NORMAL, INFLATED, DEFLATED
        this.onGround = false;
        this.facing = 1;
        this.rotation = 0;
        
        // Visuals
        this.hairs = [];
        this.initHairs();
    }

    initHairs() {
        for(let i=0; i<12; i++) {
            this.hairs.push({
                angle: (Math.PI * 2 * i) / 12,
                len: Math.random() * 5 + 2
            });
        }
    }

    update(p) {
        // Input Handling
        let accX = 0;
        
        if (isKeyDown(p, p.LEFT_ARROW)) {
            accX = -this.speed;
            this.facing = -1;
        }
        if (isKeyDown(p, p.RIGHT_ARROW)) {
            accX = this.speed;
            this.facing = 1;
        }
        
        // State Logic
        if (isKeyDown(p, p.UP_ARROW)) {
            this.state = "INFLATED";
        } else if (isKeyDown(p, p.DOWN_ARROW)) {
            this.state = "DEFLATED";
        } else {
            this.state = "NORMAL";
        }

        // Apply physics based on state
        let currentGravity = gameState.gravity;
        let currentFriction = gameState.baseFriction;

        if (this.state === "INFLATED") {
            this.r = this.baseRadius * 1.3;
            currentGravity = gameState.gravity * 0.2; // Float
            currentFriction = 0.98; // Slide (low friction)
            
            // Initial jump impulse if on ground
            if (this.onGround) {
                 this.vy = this.jumpForce;
                 this.onGround = false;
                 // Add particle puff
                 createExplosion(this.x, this.y + this.r, [200, 200, 200], 5, gameState);
            } else {
                // In air, apply slight upward float force to counter gravity further
                this.vy += this.floatForce; 
            }
            
        } else if (this.state === "DEFLATED") {
            this.r = this.baseRadius * 0.7;
            currentGravity = gameState.gravity * 2.5; // Heavy
            currentFriction = 0.6; // Brakes (high friction)
        } else {
            this.r = this.baseRadius;
            // Normal movement
        }

        // Apply forces
        this.vx += accX;
        this.vy += currentGravity;
        this.vx *= currentFriction;
        this.vy *= 0.99; // Air resistance

        // Apply velocity
        this.x += this.vx;
        this.y += this.vy;
        
        // Update rotation for visual rolling
        this.rotation += this.vx * 0.1;

        // Reset ground flag before collision checks
        this.onGround = false;

        // Platform Collisions
        gameState.platforms.forEach(platform => {
            resolvePlayerPlatform(this, platform);
        });

        // World Bounds
        if (this.x < 0) { this.x = 0; this.vx = 0; }
        if (this.y > gameState.worldHeight + 100) { 
            this.die(); 
        } // Fall off world
        
        // Hazards
        gameState.hazards.forEach(hazard => {
            // Simple distance check
            let dist = p.dist(this.x, this.y, hazard.x + hazard.w/2, hazard.y + hazard.h/2);
            if (dist < this.r + hazard.w/2) {
                this.die();
            }
        });

        // Coins
        for (let i = gameState.coins.length - 1; i >= 0; i--) {
            let coin = gameState.coins[i];
            let dist = p.dist(this.x, this.y, coin.x, coin.y);
            if (dist < this.r + coin.r) {
                gameState.score += 10;
                createExplosion(coin.x, coin.y, COLORS.coin, 10, gameState);
                gameState.coins.splice(i, 1);
            }
        }
        
        // Goal
        if (gameState.goal) {
            let d = p.dist(this.x, this.y, gameState.goal.x + gameState.goal.w/2, gameState.goal.y + gameState.goal.h/2);
            if (d < this.r + 20) {
                winLevel();
            }
        }
        
        // Log player info periodically or on significant change
        if (p.frameCount % 10 === 0 && p.logs) {
            p.logs.player_info.push({
                x: this.x,
                y: this.y,
                state: this.state,
                vx: this.vx,
                vy: this.vy,
                framecount: p.frameCount
            });
        }
    }

    die() {
        if (gameState.gamePhase !== "PLAYING") return;
        gameState.gamePhase = "GAME_OVER_LOSE";
        createExplosion(this.x, this.y, COLORS.leo, 20, gameState);
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.rotation);

        // Body color based on state
        let c = COLORS.leo;
        if (this.state === "INFLATED") c = COLORS.leoInflated;
        if (this.state === "DEFLATED") c = COLORS.leoDeflated;
        
        p.fill(c);
        p.stroke(p.red(c)*0.8, p.green(c)*0.8, p.blue(c)*0.8);
        p.strokeWeight(2);
        p.circle(0, 0, this.r * 2);
        
        // Eyes
        p.rotate(-this.rotation); // Keep eyes stable-ish or let them roll? 
        // Leo's eyes usually look forward. Let's make them look in moving direction.
        let lookOffset = this.facing * 5;
        
        p.fill(255);
        p.noStroke();
        p.ellipse(lookOffset - 4, -5, 8, 8); // Left eye
        p.ellipse(lookOffset + 4, -5, 8, 8); // Right eye
        
        p.fill(0);
        p.circle(lookOffset - 4 + this.vx, -5, 3);
        p.circle(lookOffset + 4 + this.vx, -5, 3);
        
        // Fuzz
        p.stroke(c);
        p.strokeWeight(1);
        p.noFill();
        p.rotate(this.rotation); // Rotate back to body frame
        for(let hair of this.hairs) {
            let angle = hair.angle + p.noise(p.frameCount * 0.1, hair.angle) * 0.5;
            let hLen = hair.len * (this.state === "INFLATED" ? 1.5 : 1);
            let hx = Math.cos(angle) * (this.r);
            let hy = Math.sin(angle) * (this.r);
            let hx2 = Math.cos(angle) * (this.r + hLen);
            let hy2 = Math.sin(angle) * (this.r + hLen);
            p.line(hx, hy, hx2, hy2);
        }

        p.pop();
    }
}

export class Platform {
    constructor(x, y, w, h, type = 'solid') {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.type = type; // solid, wood, stone
    }

    render(p) {
        p.fill(COLORS.ground);
        if(this.type === 'wood') p.fill(100, 60, 30);
        if(this.type === 'stone') p.fill(100, 100, 110);
        
        p.stroke(30);
        p.strokeWeight(2);
        p.rect(this.x, this.y, this.w, this.h, 4);
        
        // Texture detail
        p.noStroke();
        p.fill(0, 0, 0, 30);
        p.rect(this.x, this.y + this.h - 5, this.w, 5); // Shadow at bottom
    }
}

export class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.r = 10;
        this.bobOffset = Math.random() * Math.PI;
    }

    render(p) {
        let bobY = Math.sin(p.frameCount * 0.1 + this.bobOffset) * 3;
        p.push();
        p.translate(this.x, this.y + bobY);
        p.fill(COLORS.coin);
        p.stroke(255, 240, 100);
        p.strokeWeight(1);
        p.circle(0, 0, this.r * 2);
        p.fill(255, 200, 0);
        p.circle(0, 0, this.r * 1.4);
        p.pop();
    }
}

export class Hazard {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    
    render(p) {
        p.fill(COLORS.spike);
        p.noStroke();
        // Draw spikes
        let spikeCount = Math.floor(this.w / 10);
        for(let i=0; i<spikeCount; i++) {
            p.triangle(
                this.x + i*10, this.y + this.h,
                this.x + i*10 + 5, this.y,
                this.x + i*10 + 10, this.y + this.h
            );
        }
    }
}

export class Goal {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.active = false;
    }
    
    render(p) {
        p.noStroke();
        // Pulsing portal effect
        let pulse = Math.sin(p.frameCount * 0.1) * 5;
        p.fill(100, 200, 255, 150);
        p.rect(this.x - pulse/2, this.y - pulse/2, this.w + pulse, this.h + pulse, 10);
        
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(12);
        p.text("EXIT", this.x + this.w/2, this.y - 10);
    }
}

function winLevel() {
    if (gameState.currentLevelIndex < 2) { // Assume 3 levels: 0, 1, 2
        gameState.currentLevelIndex++;
        window.loadLevel(gameState.currentLevelIndex);
    } else {
        gameState.gamePhase = "GAME_OVER_WIN";
    }
}