// entities.js
// Game Entities

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_HEIGHT } from './globals.js';
import { KEYS, isKeyDown } from './input.js';
import { resolvePlatformCollision, checkCircleRect, checkCircleTriangle } from './physics.js';
import { createExplosion } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 20;
        
        this.state = "NORMAL"; // NORMAL, INFLATED, DEFLATED
        this.onGround = false;
        
        // Hair animation
        this.hairOffsets = [];
        for(let i=0; i<36; i++) this.hairOffsets.push(Math.random() * 5);
        
        this.dead = false;
    }
    
    update(p) {
        if (this.dead) return;
        
        // Automated Inputs overrule manual if in test mode
        let left = false;
        let right = false;
        let up = false;
        let down = false;
        
        if (gameState.controlMode === 'HUMAN') {
            left = isKeyDown(KEYS.LEFT);
            right = isKeyDown(KEYS.RIGHT);
            up = isKeyDown(KEYS.SPACE) || isKeyDown(KEYS.UP);
            down = isKeyDown(KEYS.DOWN);
        } else {
            const action = get_automated_testing_action(gameState);
            if (action) {
                if (action.left) left = true;
                if (action.right) right = true;
                if (action.jump) up = true;
                if (action.down) down = true;
            }
        }
        
        // Physics Coefficients based on state
        let acc = 0.5;
        let maxSpeed = 8;
        let currentGravity = gameState.gravity;
        let currentFriction = gameState.friction;
        
        // State Machine logic
        if (up) {
            this.state = "INFLATED";
            currentGravity = gameState.gravity * 0.3; // Low gravity
            currentFriction = 0.99; // Low friction (slide)
            acc = 0.2; // Slower acceleration in air
            this.radius = 25; // Grow slightly
        } else if (down) {
            this.state = "DEFLATED";
            currentGravity = gameState.gravity * 2.5; // Heavy
            currentFriction = 0.8; // High friction
            maxSpeed = 12; // Can roll fast down slopes (if we had slopes), otherwise just heavy
            this.radius = 15; // Shrink
        } else {
            this.state = "NORMAL";
            this.radius = 20;
        }
        
        // Movement
        if (left) this.vx -= acc;
        if (right) this.vx += acc;
        
        // Apply Gravity
        this.vy += currentGravity;
        
        // Apply Friction
        this.vx *= currentFriction;
        this.vy *= 0.99; // slight air resistance
        
        // Cap horizontal speed
        // Actually, let physics limit it mostly via friction, but clamp for sanity
        // If inflated, we can't move as sharply, handled by low acc
        
        // Update Position
        this.x += this.vx;
        this.y += this.vy;
        
        // Reset flags
        this.onGround = false;
        
        // Check Platform Collisions
        for (let platform of gameState.platforms) {
            if (resolvePlatformCollision(this, platform)) {
                // Collision resolved in helper
            }
        }
        
        // Check World Bounds
        if (this.y > WORLD_HEIGHT + 100) {
            this.die();
        }
        if (this.x < this.radius) {
            this.x = this.radius;
            this.vx = 0;
        }
        
        // Log player info
        if (p.logs && p.frameCount % 5 === 0) {
            p.logs.player_info.push({
                x: this.x,
                y: this.y,
                vx: this.vx,
                vy: this.vy,
                state: this.state,
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
    }
    
    die() {
        if (this.dead) return;
        this.dead = true;
        createExplosion(this.x, this.y, 20, "DEATH");
        gameState.gamePhase = "GAME_OVER_LOSE";
    }
    
    render(p) {
        if (this.dead) return;
        
        p.push();
        p.translate(this.x, this.y);
        
        // Rotate body based on vx
        p.rotate(p.frameCount * (this.vx * 0.05));
        
        // Draw Fuzz
        p.stroke(0, 180, 150);
        p.strokeWeight(2);
        const hairLen = 5;
        const numHairs = 16;
        for (let i = 0; i < numHairs; i++) {
            let angle = (p.TWO_PI / numHairs) * i;
            // Add some "wind" effect based on velocity
            let offset = Math.sin(p.frameCount * 0.2 + i) * 2;
            let startX = Math.cos(angle) * (this.radius - 2);
            let startY = Math.sin(angle) * (this.radius - 2);
            let endX = Math.cos(angle) * (this.radius + hairLen + offset);
            let endY = Math.sin(angle) * (this.radius + hairLen + offset);
            p.line(startX, startY, endX, endY);
        }
        
        // Draw Body
        p.fill(0, 200, 180);
        p.noStroke();
        p.circle(0, 0, this.radius * 2);
        
        // Draw Eyes
        p.fill(255);
        // Eye position adjusts with state or velocity slightly
        let eyeOffsetX = (this.vx / 10) * 5;
        p.circle(-6 + eyeOffsetX, -5, 8);
        p.circle(6 + eyeOffsetX, -5, 8);
        
        // Pupils
        p.fill(0);
        p.circle(-6 + eyeOffsetX, -5, 3);
        p.circle(6 + eyeOffsetX, -5, 3);
        
        // Mustache / Mouth
        p.noFill();
        p.stroke(0);
        p.strokeWeight(2);
        p.arc(0, 5, 10, 5, 0, p.PI);
        
        p.pop();
    }
}

export class Platform {
    constructor(x, y, w, h, type = "NORMAL") {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = type; // NORMAL, MOVING
    }
    
    render(p) {
        p.push();
        if (this.type === "NORMAL") {
            // Wood/Ground texture
            p.fill(80, 60, 40);
            p.stroke(60, 40, 20);
            p.rect(this.x, this.y, this.width, this.height, 5);
            
            // Texture detail
            p.stroke(100, 80, 60);
            p.line(this.x + 5, this.y + 5, this.x + this.width - 5, this.y + 5);
        }
        p.pop();
    }
}

export class Hazard {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // SPIKE, SAW
        this.width = 30;
        this.height = 30;
        
        // Hitbox points for spike
        this.p1 = {x: x, y: y + 30};
        this.p2 = {x: x + 15, y: y};
        this.p3 = {x: x + 30, y: y + 30};
    }
    
    update(p) {
        if (!gameState.player || gameState.player.dead) return;
        
        // Collision check
        if (this.type === "SPIKE") {
            // Simple circle vs triangle check
            if (checkCircleTriangle(gameState.player, this.p1, this.p2, this.p3)) {
                gameState.player.die();
            }
        }
    }
    
    render(p) {
        p.push();
        p.fill(150, 50, 50);
        p.stroke(100, 0, 0);
        if (this.type === "SPIKE") {
            p.triangle(this.x, this.y + 30, this.x + 15, this.y, this.x + 30, this.y + 30);
        }
        p.pop();
    }
}

export class Collectible {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.collected = false;
        this.baseY = y;
    }
    
    update(p) {
        if (this.collected) return;
        
        // Floating animation
        this.y = this.baseY + Math.sin(p.frameCount * 0.05) * 5;
        
        // Check collision with player
        if (gameState.player && !gameState.player.dead) {
            const dx = gameState.player.x - this.x;
            const dy = gameState.player.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < this.radius + gameState.player.radius) {
                this.collect();
            }
        }
    }
    
    collect() {
        this.collected = true;
        gameState.score += 1;
        createExplosion(this.x, this.y, 10, "SPARKLE");
        
        // Check win condition? 
        // Or exit door unlocks?
        // Let's open door if all coins collected
        if (gameState.score === gameState.totalCoins && gameState.exitDoor) {
            gameState.exitDoor.locked = false;
        }
    }
    
    render(p) {
        if (this.collected) return;
        
        p.push();
        p.translate(this.x, this.y);
        p.rotate(p.frameCount * 0.05);
        
        p.fill(255, 215, 0); // Gold
        p.stroke(218, 165, 32);
        p.strokeWeight(2);
        
        // Draw coin shape (octagon roughly circle)
        p.circle(0, 0, this.radius * 2);
        p.fill(255, 240, 150);
        p.circle(0, 0, this.radius * 1.5);
        
        p.pop();
    }
}

export class ExitDoor {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 80;
        this.locked = true;
    }
    
    update(p) {
        if (!gameState.player) return;
        
        // Check collision
        if (checkCircleRect(gameState.player, this)) {
            if (!this.locked) {
                gameState.gamePhase = "GAME_OVER_WIN";
            }
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Frame
        p.fill(100);
        p.rect(0, 0, this.width, this.height);
        
        // Door
        if (this.locked) {
            p.fill(50, 0, 0); // Red closed
            p.rect(5, 5, this.width - 10, this.height - 10);
            
            // Lock icon
            p.fill(200, 200, 0);
            p.circle(this.width/2, this.height/2, 10);
        } else {
            p.fill(0, 0, 0); // Open void
            p.rect(5, 5, this.width - 10, this.height - 10);
            
            // Light emanating
            p.fill(255, 255, 255, 100);
            p.noStroke();
            p.rect(10, 10, this.width - 20, this.height - 20);
        }
        
        p.pop();
    }
}