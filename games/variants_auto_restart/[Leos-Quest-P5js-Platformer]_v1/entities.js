import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { resolvePlayerPlatformCollisions, checkCircleRect } from './physics.js';
import { KEYS, isKeyDown } from './input.js';
import { createExplosion } from './particles.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        
        // Stats
        this.baseRadius = 15;
        this.r = this.baseRadius;
        this.angle = 0; // For rolling animation
        
        // Physics constants
        this.speed = 0.5;
        this.maxSpeed = 8;
        this.jumpForce = -13; 
        this.floatForce = -0.3; 
        this.heavyGravity = 0.8; 
        
        this.onGround = false;
        
        // States
        this.isInflated = false;
        this.isDeflated = false;
        
        // Invulnerability
        this.invulnerableTimer = 0;
        
        // Fur visuals
        this.furOffsets = [];
        for(let i=0; i<12; i++) {
            this.furOffsets.push(Math.random() * 5);
        }
    }
    
    update(p) {
        // Decrease invulnerability timer
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= gameState.deltaTime;
        }

        // Input Handling (now only HUMAN mode)
        let inputLeft = isKeyDown(KEYS.LEFT);
        let inputRight = isKeyDown(KEYS.RIGHT);
        let inputUp = isKeyDown(KEYS.UP) || isKeyDown(KEYS.SPACE);
        let inputDown = isKeyDown(KEYS.DOWN);
        
        // State Changes
        this.isInflated = inputUp && !this.onGround;
        this.isDeflated = inputDown;
        
        // Size Changes
        if (this.isInflated) {
            this.r = this.baseRadius * 1.3;
        } else if (this.isDeflated) {
            this.r = this.baseRadius * 0.7;
        } else {
            this.r = this.baseRadius;
        }
        
        // Horizontal Movement
        if (inputLeft) {
            this.vx -= this.speed;
        }
        if (inputRight) {
            this.vx += this.speed;
        }
        
        // Jump
        if (inputUp && this.onGround) {
            this.vy = this.jumpForce;
            this.onGround = false;
            // Add particles for jump
            createExplosion(this.x, this.y + this.r, 5, [200, 200, 200]);
        }
        
        // Physics Application
        // Gravity
        let g = gameState.gravity;
        if (this.isInflated && this.vy > 0) g *= 0.3; // Float (reduced gravity falling)
        if (this.isDeflated) g *= 2.0; // Fast fall
        
        this.vy += g;
        
        // Friction / Air Resistance
        if (this.onGround) {
            this.vx *= gameState.groundFriction;
        } else {
            this.vx *= gameState.airResistance;
        }
        
        // Terminal Velocity
        const terminal = this.isDeflated ? 20 : (this.isInflated ? 3 : 12);
        this.vy = Math.min(this.vy, terminal);
        this.vx = Math.max(Math.min(this.vx, this.maxSpeed), -this.maxSpeed);
        
        // Collision Resolution
        resolvePlayerPlatformCollisions(this, gameState.platforms);
        
        // Update Rotation for visual effect
        this.angle += this.vx / this.r;
        
        // World Bounds (Death at bottom)
        if (this.y > gameState.worldHeight + 100) {
            this.die();
        }
        
        // Check Interactions
        this.checkHazards();
        this.checkCoins();
        this.checkMonsters();
        this.checkHearts();
        this.checkExit();
    }
    
    checkHazards() {
        for (let hazard of gameState.hazards) {
            if (checkCircleRect(this, hazard)) {
                this.die();
            }
        }
    }
    
    checkCoins() {
        for (let i = gameState.coins.length - 1; i >= 0; i--) {
            const coin = gameState.coins[i];
            const dist = Math.sqrt(Math.pow(this.x - coin.x, 2) + Math.pow(this.y - coin.y, 2));
            if (dist < this.r + coin.r) {
                gameState.score += 100;
                gameState.coinsCollected++;
                createExplosion(coin.x, coin.y, 10, [255, 215, 0]);
                gameState.coins.splice(i, 1);
            }
        }
    }

    checkMonsters() {
        if (this.invulnerableTimer > 0) return;

        for (let monster of gameState.monsters) {
            // Simple circle collision
            const dist = Math.sqrt(Math.pow(this.x - monster.x, 2) + Math.pow(this.y - monster.y, 2));
            if (dist < this.r + monster.r) {
                this.takeDamage();
                // Knockback
                this.vx = (this.x - monster.x) > 0 ? 5 : -5;
                this.vy = -5;
                break; // Only one hit per frame
            }
        }
    }

    checkHearts() {
        for (let i = gameState.heartPickups.length - 1; i >= 0; i--) {
            const heart = gameState.heartPickups[i];
            const dist = Math.sqrt(Math.pow(this.x - heart.x, 2) + Math.pow(this.y - heart.y, 2));
            if (dist < this.r + heart.r) {
                if (gameState.currentHearts < gameState.maxHearts) {
                    gameState.currentHearts++;
                    createExplosion(heart.x, heart.y, 10, [255, 50, 50]);
                    gameState.heartPickups.splice(i, 1);
                }
            }
        }
    }
    
    checkExit() {
        if (!gameState.exit) return;
        
        if (gameState.coinsCollected < gameState.totalCoinsInLevel) {
            return;
        }
        
        const ex = gameState.exit.x + gameState.exit.w/2;
        const ey = gameState.exit.y + gameState.exit.h/2;
        const dist = Math.sqrt(Math.pow(this.x - ex, 2) + Math.pow(this.y - ey, 2));
        
        if (dist < this.r + 20) {
            gameState.gamePhase = "LEVEL_COMPLETE";
            gameState.transitionTimer = 2.0;
        }
    }
    
    takeDamage() {
        gameState.currentHearts--;
        createExplosion(this.x, this.y, 15, [255, 0, 0]);
        
        if (gameState.currentHearts <= 0) {
            gameState.gamePhase = "GAME_OVER_FINAL";
        } else {
            this.invulnerableTimer = 2.0; // 2 seconds invulnerability
        }
    }

    die() {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "GAME_OVER_LOSE";
            createExplosion(this.x, this.y, 30, [0, 255, 200]);
        }
    }
    
    render(p) {
        // Flicker if invulnerable
        if (this.invulnerableTimer > 0 && Math.floor(gameState.frameCount / 4) % 2 === 0) {
            return;
        }

        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.angle);
        
        // Draw Furball Body
        p.fill(0, 180, 160); // Teal
        p.stroke(0, 100, 90);
        p.strokeWeight(1);
        
        // Fur effect
        const segments = 12;
        p.beginShape();
        for (let i = 0; i < segments * 2; i++) {
            const a = (Math.PI * 2 * i) / (segments * 2);
            let rOff = this.r;
            if (i % 2 === 0) rOff += 3; 
            else rOff -= 1; 
            
            const x = Math.cos(a) * rOff;
            const y = Math.sin(a) * rOff;
            p.vertex(x, y);
        }
        p.endShape(p.CLOSE);
        
        // Eyes
        p.fill(255);
        p.noStroke();
        p.ellipse(5, -5, 8, 8);
        p.ellipse(12, -5, 8, 8);
        
        p.fill(0);
        p.ellipse(6, -5, 3, 3);
        p.ellipse(13, -5, 3, 3);
        
        // Mustache
        p.noFill();
        p.stroke(0);
        p.strokeWeight(2);
        p.arc(9, 2, 10, 5, p.PI, 0);
        
        p.pop();
    }
}

export class Platform {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }
    
    render(p) {
        p.fill(101, 67, 33);
        p.stroke(60, 40, 20);
        p.strokeWeight(2);
        p.rect(this.x, this.y, this.w, this.h);
        
        p.stroke(120, 80, 40);
        p.line(this.x + 5, this.y, this.x + 5, this.y + this.h);
        p.line(this.x + this.w - 5, this.y, this.x + this.w - 5, this.y + this.h);
    }
}

export class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.r = 10;
        this.angle = 0;
    }
    
    render(p) {
        this.angle += 0.05;
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.angle);
        p.scale(Math.sin(this.angle), 1);
        
        p.fill(255, 215, 0);
        p.stroke(200, 150, 0);
        p.strokeWeight(2);
        p.circle(0, 0, this.r * 2);
        
        p.fill(255, 240, 100);
        p.noStroke();
        p.circle(0, 0, this.r * 1.5);
        
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
        p.fill(150);
        p.stroke(100);
        
        const spikesCount = Math.floor(this.w / 10);
        for(let i=0; i<spikesCount; i++) {
            const sx = this.x + i * 10;
            const sy = this.y + this.h;
            p.triangle(sx, sy, sx + 5, this.y, sx + 10, sy);
        }
    }
}

export class ExitPipe {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.w = 50;
        this.h = 60;
    }
    
    render(p) {
        p.fill(0, 150, 50);
        p.stroke(0, 100, 0);
        p.strokeWeight(3);
        p.rect(this.x - 5, this.y, this.w + 10, 20);
        p.rect(this.x, this.y + 20, this.w, this.h - 20);
        
        p.fill(0);
        p.noStroke();
        p.rect(this.x + 5, this.y + 5, this.w - 10, 15);
    }
}

export class Monster {
    constructor(x, y, range) {
        this.startX = x;
        this.x = x;
        this.y = y;
        this.r = 15;
        this.vx = 1.5;
        this.range = range || 100;
        this.facingRight = true;
    }

    update(p) {
        this.x += this.vx;
        
        // Simple patrol logic
        if (this.x > this.startX + this.range) {
            this.vx = -Math.abs(this.vx);
            this.facingRight = false;
        } else if (this.x < this.startX - this.range) {
            this.vx = Math.abs(this.vx);
            this.facingRight = true;
        }
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Body
        p.fill(200, 50, 50);
        p.stroke(100, 0, 0);
        p.strokeWeight(2);
        
        // Spiky shape
        p.beginShape();
        for(let i=0; i<8; i++) {
            let angle = (Math.PI * 2 * i) / 8;
            let r = this.r + (i%2==0 ? 2 : -2);
            p.vertex(Math.cos(angle)*r, Math.sin(angle)*r);
        }
        p.endShape(p.CLOSE);
        
        // Eyes
        p.fill(255);
        p.noStroke();
        p.ellipse(this.facingRight ? 5 : -5, -5, 8, 8);
        p.fill(0);
        p.ellipse(this.facingRight ? 7 : -7, -5, 3, 3);
        
        // Angry eyebrows
        p.stroke(0);
        p.strokeWeight(2);
        p.line(this.facingRight ? 2 : -8, -10, this.facingRight ? 8 : -2, -8);
        
        p.pop();
    }
}

export class HeartItem {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.r = 12;
        this.pulse = 0;
    }

    render(p) {
        this.pulse += 0.1;
        let scale = 1 + Math.sin(this.pulse) * 0.1;
        
        p.push();
        p.translate(this.x, this.y);
        p.scale(scale);
        
        p.fill(255, 50, 50);
        p.stroke(150, 0, 0);
        p.strokeWeight(2);
        
        // Heart shape
        p.beginShape();
        p.vertex(0, 5);
        p.bezierVertex(5, -5, 10, -10, 0, -15);
        p.bezierVertex(-10, -10, -5, -5, 0, 5);
        p.endShape(p.CLOSE);
        
        p.pop();
    }
}