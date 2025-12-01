// entities.js
// Entity classes

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { applyPhysics } from './physics.js';
import { getTerrainHeight } from './math_utils.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 5; // Initial push
        this.vy = 0;
        this.radius = 15;
        this.rotation = 0;
        this.onGround = false;
        
        gameState.player = this;
        gameState.entities.push(this);
    }
    
    update(p) {
        applyPhysics(p, this);
        
        // Calculate rotation based on velocity
        const targetRotation = Math.atan2(this.vy, this.vx);
        // Smooth rotation
        this.rotation = p.lerp(this.rotation, targetRotation, 0.2);
        
        // Check bounds (don't fall off world to left, though camera prevents this mostly)
        if (this.x < 0) {
            this.x = 0;
            this.vx = Math.max(0, this.vx);
        }
        
        // Check game over (Night caught up)
        if (this.x < gameState.nightX) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.rotation);
        
        // Draw Bird Body
        p.noStroke();
        
        // Color based on state
        if (gameState.isDiving) {
            p.fill(255, 100, 100); // Reddish when diving
            p.scale(1.1, 0.9); // Squish effect
        } else {
            p.fill(255, 220, 0); // Yellow/Gold normal
        }
        
        // Body
        p.ellipse(0, 0, this.radius * 2, this.radius * 1.8);
        
        // Eye
        p.fill(255);
        p.circle(8, -5, 10);
        p.fill(0);
        p.circle(10, -5, 3);
        
        // Beak
        p.fill(255, 150, 0);
        p.triangle(10, 0, 20, 5, 10, 10);
        
        // Wing
        p.fill(255, 255, 200);
        if (gameState.isDiving) {
            // Folded wing
            p.ellipse(-5, 0, 15, 8);
        } else {
            // Flapping wing animation
            const flap = Math.sin(p.frameCount * 0.5) * 5;
            p.ellipse(-5, -5 + flap, 18, 12);
        }
        
        p.pop();
        
        // Draw Trail/Particles if fast
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 10 && p.frameCount % 5 === 0) {
            gameState.particles.push(new Particle(this.x - 10, this.y, [255, 255, 255, 100]));
        }
    }
}

export class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.collected = false;
        
        // Align to ground initially
        this.baseYOffset = -40; // Float above ground
    }
    
    update(p) {
        // Recalculate Y to follow terrain + bobbing
        const terrainY = getTerrainHeight(p, this.x);
        const bob = Math.sin(p.frameCount * 0.05) * 10;
        this.y = terrainY + this.baseYOffset + bob;
        
        // Check collision with player
        if (!this.collected && gameState.player) {
            const dx = gameState.player.x - this.x;
            const dy = gameState.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < this.radius + gameState.player.radius) {
                this.collect();
            }
        }
    }
    
    collect() {
        this.collected = true;
        gameState.score += 100;
        
        // Push back night slightly
        gameState.nightX -= 100;
        
        // Particles
        for(let i=0; i<10; i++) {
            gameState.particles.push(new Particle(this.x, this.y, [255, 215, 0]));
        }
    }
    
    render(p) {
        if (this.collected) return;
        
        p.push();
        p.translate(this.x, this.y);
        
        // Spin
        p.rotate(p.frameCount * 0.05);
        
        p.fill(255, 215, 0);
        p.stroke(255, 165, 0);
        p.strokeWeight(2);
        p.circle(0, 0, this.radius * 2);
        
        // Shine
        p.noStroke();
        p.fill(255, 255, 200, 200);
        p.circle(-5, -5, 6);
        
        p.pop();
    }
}

export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.03;
        this.size = 5 + Math.random() * 5;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.size *= 0.95;
    }
    
    isDead() {
        return this.life <= 0;
    }
    
    render(p) {
        p.push();
        const c = p.color(this.color[0], this.color[1], this.color[2]);
        c.setAlpha(this.life * 255);
        p.fill(c);
        p.noStroke();
        p.circle(this.x, this.y, this.size);
        p.pop();
    }
}