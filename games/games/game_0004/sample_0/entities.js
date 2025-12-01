// entities.js
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, FRICTION, GROUND_FRICTION, AIR_RESISTANCE } from './globals.js';
import { isKeyPressed, KEYS } from './input.js';
import { resolveCircleRectCollision } from './physics.js';
import { Particle } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        
        // Properties
        this.baseRadius = 20;
        this.radius = this.baseRadius;
        this.rotation = 0;
        this.onGround = false;
        
        // Fur styling
        this.furCount = 24;
        this.furLength = 5;
        this.furAngleOffsets = Array(this.furCount).fill(0).map(() => Math.random() * 0.5);
        
        // Physics constants adjustments based on state
        this.accel = 0.4;
        this.maxSpeed = 8;
        this.jumpForce = -9;
        this.inflateBuoyancy = -0.25; // Counter-gravity
        
        // State
        this.isInflated = false;
        this.isDeflated = false;
    }

    update(p) {
        // --- Input Handling ---
        let moveLeft = isKeyPressed(KEYS.LEFT);
        let moveRight = isKeyPressed(KEYS.RIGHT);
        let inflate = isKeyPressed(KEYS.SPACE) || isKeyPressed(KEYS.UP);
        let deflate = isKeyPressed(KEYS.DOWN);
        let sprint = isKeyPressed(KEYS.SHIFT);
        
        // Automated Testing Override
        if (gameState.controlMode !== "HUMAN") {
            const action = get_automated_testing_action(gameState);
            if (action) {
                if (action.moveLeft) moveLeft = true;
                if (action.moveRight) moveRight = true;
                if (action.inflate) inflate = true;
                if (action.deflate) deflate = true;
            }
        }

        // --- State Changes ---
        this.isInflated = inflate;
        this.isDeflated = deflate;

        // Radius and Physics Property Adjustments
        let targetRadius = this.baseRadius;
        let currentGravity = GRAVITY;
        let currentFriction = this.onGround ? GROUND_FRICTION : AIR_RESISTANCE;

        if (this.isInflated) {
            targetRadius = 30;
            currentGravity = GRAVITY * 0.3; // Floatier
        } else if (this.isDeflated) {
            targetRadius = 15;
            currentGravity = GRAVITY * 1.5; // Heavier
        }

        // Smooth radius transition
        this.radius = p.lerp(this.radius, targetRadius, 0.15);

        // --- Movement Physics ---
        
        // Horizontal force
        let force = this.accel;
        if (sprint) force *= 1.5;
        if (this.isInflated && !this.onGround) force *= 0.5; // Less control in air when puffed

        if (moveLeft) this.vx -= force;
        if (moveRight) this.vx += force;

        // Vertical forces
        this.vy += currentGravity;
        
        // Buoyancy / Jump assist from inflation
        if (this.isInflated && this.vy > 0) {
            this.vy -= 0.1; // Fall slower
        }

        // Jump mechanism (only when on ground, or slight coyote time could be added)
        // In Leo's Fortune, "Inflate" makes you jump if you are on ground
        if (this.isInflated && this.onGround) {
             this.vy = this.jumpForce;
             this.onGround = false; // Detach
             // Add puff particles
             for(let i=0; i<5; i++) {
                 gameState.particles.push(new Particle(this.x, this.y + this.radius, 'puff'));
             }
        }

        // Apply Friction
        this.vx *= currentFriction;
        this.vy *= AIR_RESISTANCE; // Always some air drag

        // Limit speed
        this.vx = p.constrain(this.vx, -this.maxSpeed, this.maxSpeed);
        // Terminal velocity
        this.vy = p.constrain(this.vy, -20, 20);

        // --- Update Position ---
        this.x += this.vx;
        this.y += this.vy;
        
        // Rotation based on movement
        this.rotation += this.vx * 0.1;

        // --- Collision Detection & Resolution ---
        this.onGround = false; // Reset, set true in resolution if collision is from bottom

        // Check platforms
        gameState.platforms.forEach(platform => {
             resolveCircleRectCollision(this, platform);
        });

        // Check Hazards
        gameState.hazards.forEach(hazard => {
            let d = p.dist(this.x, this.y, hazard.x, hazard.y);
            if (d < this.radius + hazard.radius) {
                gameState.gamePhase = "GAME_OVER_LOSE";
            }
        });

        // Check Collectibles
        for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
            let c = gameState.collectibles[i];
            let d = p.dist(this.x, this.y, c.x, c.y);
            if (d < this.radius + c.radius) {
                gameState.score += 10;
                gameState.particles.push(new Particle(c.x, c.y, 'sparkle'));
                gameState.collectibles.splice(i, 1);
            }
        }
        
        // Check World Bounds (Fall off map)
        if (this.y > CANVAS_HEIGHT + 200) { // Local coords, but we check relative to camera later? 
            // Actually gameState coords are world coords.
            if (this.y > gameState.worldHeight + 100) {
                gameState.gamePhase = "GAME_OVER_LOSE";
            }
        }
        
        // Level completion (Goal)
        // Assume goal is at end of world
        if (this.x > gameState.worldWidth - 100) {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
        
        // Log info
        if (p.frameCount % 10 === 0 && p.logs.player_info) {
             p.logs.player_info.push({
                 x: this.x, y: this.y, vx: this.vx, vy: this.vy,
                 state: this.isInflated ? 'inflated' : (this.isDeflated ? 'deflated' : 'normal'),
                 framecount: p.frameCount
             });
        }
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.rotation);

        // Draw body
        p.noStroke();
        
        // Color changes based on state
        let bodyColor = p.color(0, 180, 150); // Teal
        if (this.isInflated) bodyColor = p.color(100, 220, 255); // Light Blue
        if (this.isDeflated) bodyColor = p.color(50, 100, 80); // Dark Green
        
        p.fill(bodyColor);
        p.circle(0, 0, this.radius * 2);

        // Draw Fur
        p.stroke(p.red(bodyColor) - 20, p.green(bodyColor) - 20, p.blue(bodyColor) - 20);
        p.strokeWeight(2);
        for (let i = 0; i < this.furCount; i++) {
            let angle = (p.TWO_PI / this.furCount) * i;
            let startX = p.cos(angle) * (this.radius * 0.8);
            let startY = p.sin(angle) * (this.radius * 0.8);
            
            // Dynamic fur lag
            let lagAngle = angle - (this.vx * 0.05); 
            let endX = p.cos(lagAngle) * (this.radius + this.furLength);
            let endY = p.sin(lagAngle) * (this.radius + this.furLength);
            
            p.line(startX, startY, endX, endY);
        }

        // Draw Eyes (Mustache face)
        p.rotate(-this.rotation); // Keep face upright-ish? No, Leo rolls. Face rotates.
        // Actually Leo's face usually stays somewhat oriented or rolls with him. Rolling with him looks better.
        // Let's keep the rotation for the face.
        
        p.fill(255);
        p.noStroke();
        // Eyes
        p.ellipse(5, -5, 8, 8);
        p.ellipse(15, -5, 8, 8);
        p.fill(0);
        p.circle(5 + (this.vx*0.5), -5, 3);
        p.circle(15 + (this.vx*0.5), -5, 3);
        
        // Mustache
        p.noFill();
        p.stroke(50, 30, 0);
        p.strokeWeight(3);
        p.arc(10, 2, 20, 10, p.PI, 0);

        p.pop();
    }
}

export class Platform {
    constructor(x, y, w, h, type = 'normal') {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = type; // normal, wood, metal
    }

    render(p) {
        // Cull if offscreen
        if (this.x > gameState.cameraX + CANVAS_WIDTH || this.x + this.width < gameState.cameraX ||
            this.y > gameState.cameraY + CANVAS_HEIGHT || this.y + this.height < gameState.cameraY) {
            return;
        }

        p.push();
        if (this.type === 'wood') {
            p.fill(101, 67, 33);
            p.stroke(80, 50, 20);
            p.strokeWeight(2);
            p.rect(this.x, this.y, this.width, this.height, 4);
            // Wood grain texture
            p.stroke(120, 80, 40, 100);
            p.line(this.x + 5, this.y + 5, this.x + this.width - 5, this.y + 5);
            p.line(this.x + 5, this.y + 15, this.x + this.width - 20, this.y + 15);
        } else if (this.type === 'metal') {
            p.fill(100, 100, 110);
            p.stroke(50);
            p.rect(this.x, this.y, this.width, this.height);
            // Rivets
            p.fill(150);
            p.noStroke();
            p.circle(this.x + 5, this.y + 5, 4);
            p.circle(this.x + this.width - 5, this.y + 5, 4);
            p.circle(this.x + 5, this.y + this.height - 5, 4);
            p.circle(this.x + this.width - 5, this.y + this.height - 5, 4);
        } else {
            p.fill(50, 50, 60); // Dark ground
            p.rect(this.x, this.y, this.width, this.height);
            // Grass on top
            p.stroke(50, 200, 50);
            p.strokeWeight(3);
            p.line(this.x, this.y, this.x + this.width, this.y);
        }
        p.pop();
    }
}

export class Collectible {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.wobble = Math.random() * Math.PI;
    }
    
    render(p) {
        // Optimization: Cull
        if (this.x > gameState.cameraX + CANVAS_WIDTH + 20 || this.x < gameState.cameraX - 20) return;

        this.wobble += 0.05;
        let yOffset = Math.sin(this.wobble) * 3;
        
        p.push();
        p.translate(this.x, this.y + yOffset);
        p.fill(255, 215, 0); // Gold
        p.stroke(200, 150, 0);
        p.strokeWeight(2);
        p.circle(0, 0, this.radius * 2);
        
        // Inner detail
        p.fill(255, 230, 100);
        p.circle(0, 0, this.radius * 1.2);
        
        // Shine
        p.fill(255);
        p.noStroke();
        p.circle(-4, -4, 4);
        p.pop();
    }
}

export class Hazard {
    constructor(x, y, type='spike') {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.type = type;
    }
    
    render(p) {
        if (this.x > gameState.cameraX + CANVAS_WIDTH + 20 || this.x < gameState.cameraX - 20) return;

        p.push();
        p.translate(this.x, this.y);
        if (this.type === 'spike') {
            p.fill(150, 50, 50);
            p.stroke(50);
            // Draw spiked ball shape
            p.beginShape();
            for (let i = 0; i < 8; i++) {
                let angle = (p.TWO_PI / 8) * i;
                let r1 = this.radius;
                let r2 = this.radius * 0.4;
                p.vertex(p.cos(angle) * r1, p.sin(angle) * r1);
                p.vertex(p.cos(angle + 0.4) * r2, p.sin(angle + 0.4) * r2);
            }
            p.endShape(p.CLOSE);
        }
        p.pop();
    }
}