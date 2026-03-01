import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { resolvePlayerPlatformCollisions, checkCircleRect } from './physics.js';
import { KEYS, isKeyDown } from './input.js';
import { createExplosion } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

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
        this.jumpForce = -13; // Increased from -10 to make high jumps reachable
        this.floatForce = -0.3; // Counter-gravity
        this.heavyGravity = 0.8; // Extra gravity
        
        this.onGround = false;
        
        // States
        this.isInflated = false;
        this.isDeflated = false;
        
        // Fur visuals
        this.furOffsets = [];
        for(let i=0; i<12; i++) {
            this.furOffsets.push(Math.random() * 5);
        }
    }
    
    update(p) {
        // Input Handling
        let inputLeft = false;
        let inputRight = false;
        let inputUp = false;
        let inputDown = false;
        
        if (gameState.controlMode === "HUMAN") {
            inputLeft = isKeyDown(KEYS.LEFT);
            inputRight = isKeyDown(KEYS.RIGHT);
            inputUp = isKeyDown(KEYS.UP) || isKeyDown(KEYS.SPACE);
            inputDown = isKeyDown(KEYS.DOWN);
        } else {
            // Automated testing input
            const action = get_automated_testing_action(gameState);
            if (action) {
                if (action.left) inputLeft = true;
                if (action.right) inputRight = true;
                if (action.up) inputUp = true;
                if (action.down) inputDown = true;
            }
        }
        
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
        // Important: This function updates x and y directly based on platform collisions
        resolvePlayerPlatformCollisions(this, gameState.platforms);
        
        // Update Rotation for visual effect
        this.angle += this.vx / this.r;
        
        // World Bounds (Death at bottom)
        if (this.y > gameState.worldHeight + 100) {
            this.die();
        }
        
        // Check Hazards
        this.checkHazards();
        
        // Check Collectibles
        this.checkCoins();
        
        // Check Exit
        this.checkExit();
    }
    
    checkHazards() {
        for (let hazard of gameState.hazards) {
            // Use accurate Circle-Rect collision for hazards
            // This fixes the "invisible spike" issue where large hazards created huge radial kill zones
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
                // Collect
                gameState.score += 100;
                gameState.coinsCollected++;
                createExplosion(coin.x, coin.y, 10, [255, 215, 0]);
                gameState.coins.splice(i, 1);
            }
        }
    }
    
    checkExit() {
        if (!gameState.exit) return;
        
        // Requirement: Must collect all coins to use the exit
        if (gameState.coinsCollected < gameState.totalCoinsInLevel) {
            return;
        }
        
        const ex = gameState.exit.x + gameState.exit.w/2;
        const ey = gameState.exit.y + gameState.exit.h/2;
        const dist = Math.sqrt(Math.pow(this.x - ex, 2) + Math.pow(this.y - ey, 2));
        
        if (dist < this.r + 20) {
            // Level Complete - Trigger Loading Screen
            gameState.gamePhase = "LEVEL_COMPLETE";
            gameState.transitionTimer = 2.0; // 2 seconds loading screen
        }
    }
    
    die() {
        if (gameState.gamePhase === "PLAYING") {
            gameState.gamePhase = "GAME_OVER_LOSE";
            createExplosion(this.x, this.y, 30, [0, 255, 200]);
        }
    }
    
    render(p) {
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
            if (i % 2 === 0) rOff += 3; // Spike out
            else rOff -= 1; 
            
            const x = Math.cos(a) * rOff;
            const y = Math.sin(a) * rOff;
            p.vertex(x, y);
        }
        p.endShape(p.CLOSE);
        
        // Eyes (don't rotate with body to look stabilized? No, let them rotate for roll effect or stabilize)
        // To make it look like he is rolling, eyes should rotate.
        // To make it look like he is looking forward, we counter-rotate eyes.
        // Let's rotate eyes to show rolling!
        
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
        
        // Log player info periodically
        if (p.frameCount % 60 === 0) {
            p.logs.player_info.push({
                x: this.x,
                y: this.y,
                vx: this.vx,
                vy: this.vy,
                state: this.isInflated ? "float" : (this.isDeflated ? "heavy" : "normal"),
                frame: p.frameCount
            });
        }
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
        // Wood texture/color
        p.fill(101, 67, 33);
        p.stroke(60, 40, 20);
        p.strokeWeight(2);
        p.rect(this.x, this.y, this.w, this.h);
        
        // Detail lines
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
        p.rotate(this.angle); // Spin 3D effect simulation
        p.scale(Math.sin(this.angle), 1); // Flip effect
        
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
        // Spikes look
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
        // Pipe connector
        p.rect(this.x - 5, this.y, this.w + 10, 20);
        // Pipe body
        p.rect(this.x, this.y + 20, this.w, this.h - 20);
        
        p.fill(0);
        p.noStroke();
        p.rect(this.x + 5, this.y + 5, this.w - 10, 15);
    }
}