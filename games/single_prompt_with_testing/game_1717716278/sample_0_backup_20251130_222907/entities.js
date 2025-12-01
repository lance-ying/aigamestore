/**
 * Game entities: Player, Coin
 */
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, Body, World } = Matter;
import { gameState, COLORS, DIVE_FORCE, GLIDE_LIFT } from './globals.js';
import { drawBody } from './renderer.js';

export class Player {
    constructor(p, x, y) {
        this.p = p;
        this.radius = 15;
        
        // Create physics body
        this.body = Bodies.circle(x, y, this.radius, {
            label: 'player',
            friction: 0.0, // Frictionless for sliding
            frictionAir: 0.01,
            restitution: 0.0, // No bounce
            density: 0.002
        });
        
        World.add(gameState.world, this.body);
        
        this.onGround = false;
        this.trail = [];
        this.maxTrail = 20;
    }
    
    update() {
        // Handle trail
        if (this.p.frameCount % 5 === 0) {
            this.trail.push({ x: this.body.position.x, y: this.body.position.y });
            if (this.trail.length > this.maxTrail) this.trail.shift();
        }
        
        // Apply physics based on input
        if (gameState.isDiving) {
            // Dive: Apply heavy downward force
            // If on ground, this increases speed on downslope due to physics engine resolution
            // If in air, falls faster
            Body.applyForce(this.body, this.body.position, { x: 0, y: DIVE_FORCE });
        } else {
            // Glide/Fly
            // If moving fast horizontally, generate some lift
            if (!this.onGround && this.body.velocity.x > 5) {
                // Lift is proportional to speed
                const lift = Math.min(GLIDE_LIFT * this.body.velocity.x, 0.01); 
                Body.applyForce(this.body, this.body.position, { x: 0, y: lift });
            }
        }
        
        // Rotate body to match velocity for visual effect
        if (Math.abs(this.body.velocity.x) > 0.1 || Math.abs(this.body.velocity.y) > 0.1) {
            const angle = Math.atan2(this.body.velocity.y, this.body.velocity.x);
            Body.setAngle(this.body, angle);
        }
        
        // Limit speed to prevent tunneling or game breaking
        const maxSpeed = 30;
        const speed = Math.sqrt(this.body.velocity.x**2 + this.body.velocity.y**2);
        if (speed > maxSpeed) {
            const ratio = maxSpeed / speed;
            Body.setVelocity(this.body, {
                x: this.body.velocity.x * ratio,
                y: this.body.velocity.y * ratio
            });
        }
        
        // Ensure x velocity doesn't go negative (move backwards)
        if (this.body.velocity.x < 0) {
            Body.setVelocity(this.body, { x: 0, y: this.body.velocity.y });
        }
    }
    
    render(p) {
        // Draw trail
        p.push();
        p.noStroke();
        for (let i = 0; i < this.trail.length; i++) {
            const pos = this.trail[i];
            const alpha = p.map(i, 0, this.trail.length, 0, 200);
            p.fill(255, 255, 255, alpha);
            p.circle(pos.x, pos.y, this.radius);
        }
        p.pop();
        
        // Draw Bird
        p.push();
        p.translate(this.body.position.x, this.body.position.y);
        p.rotate(this.body.angle);
        
        // Body
        p.fill(COLORS.player);
        p.noStroke();
        p.circle(0, 0, this.radius * 2);
        
        // Eye
        p.fill(255);
        p.circle(this.radius/2, -this.radius/2, this.radius/1.5);
        p.fill(0);
        p.circle(this.radius/2 + 2, -this.radius/2, 3);
        
        // Beak
        p.fill(255, 200, 0);
        p.triangle(this.radius/2, 0, this.radius * 1.5, 5, this.radius/2, 10);
        
        // Wing
        p.fill(200, 50, 0);
        if (gameState.isDiving) {
            // Folded wing
            p.ellipse(-5, 5, 15, 10);
        } else {
            // Open wing
            p.push();
            p.rotate(-0.5);
            p.ellipse(0, -10, 20, 10);
            p.pop();
        }
        
        p.pop();
    }
}

export class Coin {
    constructor(p, x, y) {
        this.p = p;
        this.value = 50;
        this.collected = false;
        this.startY = y;
        
        // Sensor body for collision
        this.body = Bodies.circle(x, y, 10, {
            label: 'coin',
            isStatic: true,
            isSensor: true
        });
        
        World.add(gameState.world, this.body);
    }
    
    update() {
        if (this.collected) return;
        // Bob animation
        const offset = Math.sin(this.p.frameCount * 0.1) * 5;
        // We can't move static bodies easily without recreating or setting position
        Body.setPosition(this.body, { x: this.body.position.x, y: this.startY + offset });
    }
    
    render(p) {
        if (this.collected) return;
        
        p.push();
        p.translate(this.body.position.x, this.body.position.y);
        p.rotate(this.p.frameCount * 0.05);
        
        p.fill(COLORS.coin);
        p.stroke(255, 165, 0);
        p.strokeWeight(2);
        
        // Draw star-like coin
        p.beginShape();
        for (let i = 0; i < 5; i++) {
            const angle = Math.PI * 2 * i / 5 - Math.PI / 2;
            const x = Math.cos(angle) * 12;
            const y = Math.sin(angle) * 12;
            p.vertex(x, y);
            
            const angleInner = Math.PI * 2 * (i + 0.5) / 5 - Math.PI / 2;
            const xi = Math.cos(angleInner) * 5;
            const yi = Math.sin(angleInner) * 5;
            p.vertex(xi, yi);
        }
        p.endShape(p.CLOSE);
        
        p.pop();
    }
}