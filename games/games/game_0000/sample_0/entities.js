import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { resolvePlayerCollisions, checkCircleRectCollision } from './physics.js';
import { Particle } from './particles.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.lastY = y;
        
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        
        // Visuals
        this.angle = 0; // Rotation angle
        this.furOffset = 0;
        
        // Physics Params
        this.baseRadius = 18;
        this.radius = 18;
        
        // States
        this.state = "NORMAL"; // NORMAL, INFLATED, DEFLATED
        this.onGround = false;
        this.facing = 1;
        this.isDead = false;
        
        gameState.player = this;
        gameState.entities.push(this);
    }
    
    update(p, inputKeys) {
        if (this.isDead) return;
        
        this.lastY = this.y;
        
        // Input Handling
        let acc = 0.5;
        let maxSpeed = 6;
        
        // State Logic
        if (inputKeys.down) {
            this.state = "DEFLATED";
            this.radius = 12; // Smaller
            maxSpeed = 8; // Faster roll
            // Heavier gravity effect managed below
        } else if (inputKeys.jump && !this.onGround && this.vy > -5) {
            // Holding jump in air -> Inflate/Glide
            this.state = "INFLATED";
            this.radius = 28; // Bigger
            acc = 0.2; // Less control
        } else {
            this.state = "NORMAL";
            this.radius = this.baseRadius; // Target radius
        }
        
        // Movement
        if (inputKeys.left) {
            this.vx -= acc;
            this.facing = -1;
        }
        if (inputKeys.right) {
            this.vx += acc;
            this.facing = 1;
        }
        
        // Jump
        if (inputKeys.jumpPressed && this.onGround) {
            this.vy = -10; // Jump force
            this.onGround = false;
            
            // Spawn particles
            for(let i=0; i<5; i++) {
                gameState.particles.push(new Particle(this.x, this.y + this.radius, "dust"));
            }
        }
        
        // Apply Physics
        
        // Gravity
        let g = gameState.gravity;
        if (this.state === "INFLATED") g *= 0.3; // Float
        if (this.state === "DEFLATED") g *= 1.5; // Heavy
        
        this.vy += g;
        
        // Friction
        let f = gameState.friction;
        if (!this.onGround) f = gameState.airResistance;
        if (this.state === "INFLATED") f = 0.92; // Air drag
        
        this.vx *= f;
        this.vy *= gameState.airResistance;
        
        // Clamp speed
        this.vx = Math.min(Math.max(this.vx, -maxSpeed), maxSpeed);
        
        // Apply Velocity
        this.x += this.vx;
        this.y += this.vy;
        
        // Update Rotation (Visual)
        this.angle += this.vx / this.radius;
        
        // Collisions
        resolvePlayerCollisions(this);
        
        // Collectibles
        for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
            const coin = gameState.collectibles[i];
            const dist = Math.sqrt(Math.pow(this.x - coin.x, 2) + Math.pow(this.y - coin.y, 2));
            if (dist < this.radius + coin.radius) {
                coin.collect();
            }
        }
        
        // Exit Level
        for (let exit of gameState.exits) {
             if (checkCircleRectCollision(this, exit)) {
                 gameState.gamePhase = "LEVEL_COMPLETE";
             }
        }
        
        // Particle trail
        if (Math.abs(this.vx) > 3 && this.onGround && gameState.frameCount % 5 === 0) {
            gameState.particles.push(new Particle(this.x, this.y + this.radius, "dust"));
        }
    }
    
    die() {
        if (this.isDead) return;
        this.isDead = true;
        gameState.gamePhase = "GAME_OVER_LOSE";
        
        // Explosion of particles
        for(let i=0; i<20; i++) {
            gameState.particles.push(new Particle(this.x, this.y, "sparkle"));
        }
    }
    
    render(p) {
        if (this.isDead) return;
        
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.angle);
        
        // Draw Body (Fluff ball)
        // Dynamic color based on state
        let c = p.color(0, 200, 100); // Leo Green
        if (this.state === "INFLATED") c = p.color(100, 255, 150);
        if (this.state === "DEFLATED") c = p.color(0, 100, 50);
        
        p.fill(c);
        p.stroke(0, 100, 0);
        p.strokeWeight(1);
        
        // Draw Fur (Noise loop)
        p.beginShape();
        for (let a = 0; a < p.TWO_PI; a += 0.2) {
            let rOff = p.map(p.noise(Math.cos(a) + 1, Math.sin(a) + 1, gameState.frameCount * 0.1), 0, 1, -3, 3);
            let r = this.radius + rOff;
            p.vertex(r * Math.cos(a), r * Math.sin(a));
        }
        p.endShape(p.CLOSE);
        
        // Eyes (Keep them upright by counter-rotating)
        p.rotate(-this.angle);
        
        // Eye White
        p.fill(255);
        p.noStroke();
        p.ellipse(-6, -5, 8, 8);
        p.ellipse(6, -5, 8, 8);
        
        // Eye Pupil
        p.fill(0);
        // Look direction based on velocity
        let lookX = p.map(this.vx, -6, 6, -2, 2);
        p.ellipse(-6 + lookX, -5, 3, 3);
        p.ellipse(6 + lookX, -5, 3, 3);
        
        // Mustache
        p.fill(50, 20, 0);
        p.arc(0, 2, 20, 10, p.PI, 0);
        
        p.pop();
    }
}

export class Platform {
    constructor(x, y, w, h, type = "normal") {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = type; // normal, wood, stone
        gameState.platforms.push(this);
    }
    
    render(p) {
        // Only render if on screen
        if (this.x - gameState.cameraX > CANVAS_WIDTH || this.x + this.width - gameState.cameraX < 0) return;
        
        p.fill(this.type === "wood" ? 100 : 50);
        if (this.type === "wood") p.fill(139, 69, 19);
        if (this.type === "stone") p.fill(100, 100, 100);
        
        p.stroke(0);
        p.strokeWeight(2);
        p.rect(this.x, this.y, this.width, this.height);
        
        // Decorative lines
        p.stroke(0, 0, 0, 50);
        p.noFill();
        if (this.type === "wood") {
            p.line(this.x, this.y + 5, this.x + this.width, this.y + 5);
        }
    }
}

export class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseY = y;
        this.radius = 10;
        this.collected = false;
        gameState.collectibles.push(this);
    }
    
    collect() {
        if (this.collected) return;
        this.collected = true;
        gameState.score += 50;
        
        // Remove from list
        const idx = gameState.collectibles.indexOf(this);
        if (idx > -1) gameState.collectibles.splice(idx, 1);
        
        // Sparkles
        for(let i=0; i<8; i++) {
            gameState.particles.push(new Particle(this.x, this.y, "sparkle"));
        }
    }
    
    render(p) {
        if (this.x - gameState.cameraX > CANVAS_WIDTH || this.x - gameState.cameraX < -50) return;

        // Bobbing animation
        const offset = Math.sin(gameState.frameCount * 0.05) * 5;
        
        p.push();
        p.translate(this.x, this.baseY + offset);
        
        // Rotate (fake 3D spin)
        const scaleX = Math.abs(Math.sin(gameState.frameCount * 0.05));
        
        p.fill(255, 215, 0);
        p.stroke(218, 165, 32);
        p.strokeWeight(2);
        p.ellipse(0, 0, this.radius * 2 * scaleX, this.radius * 2);
        
        p.pop();
    }
}

export class Spike {
    constructor(x, y, w) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = 20;
        gameState.hazards.push(this);
    }
    
    render(p) {
        if (this.x - gameState.cameraX > CANVAS_WIDTH || this.x - gameState.cameraX < -50) return;

        p.fill(100);
        p.stroke(50);
        
        const spikeCount = Math.floor(this.width / 10);
        for(let i=0; i<spikeCount; i++) {
            p.triangle(
                this.x + i*10, this.y + 20,
                this.x + i*10 + 5, this.y,
                this.x + i*10 + 10, this.y + 20
            );
        }
    }
}

export class LevelExit {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        gameState.exits.push(this);
    }
    
    render(p) {
        if (this.x - gameState.cameraX > CANVAS_WIDTH || this.x - gameState.cameraX < -50) return;
        
        p.fill(0, 0, 0, 100);
        p.stroke(255);
        p.rect(this.x, this.y, this.width, this.height, 10, 10, 0, 0);
        
        // Glow inside
        p.fill(255, 255, 255, Math.sin(gameState.frameCount * 0.1) * 100 + 100);
        p.noStroke();
        p.rect(this.x + 5, this.y + 5, this.width - 10, this.height - 5, 5, 5, 0, 0);
    }
}