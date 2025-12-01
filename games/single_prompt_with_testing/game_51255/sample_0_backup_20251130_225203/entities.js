import { GRAVITY, JUMP_FORCE, FRICTION, MAX_FALL_SPEED, HOOP_SPEED, CANVAS_HEIGHT, CANVAS_WIDTH, gameState } from './globals.js';
import { checkHoopCollisions, checkScore, checkWorldBounds } from './physics.js';
import { createExplosion } from './particles.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.prevY = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 16;
        this.rotation = 0;
        this.angularVelocity = 0;
    }

    update(p) {
        this.prevY = this.y;

        // Apply Forces
        this.vy += GRAVITY;
        this.vx *= FRICTION; // Air resistance
        
        // Cap speed
        this.vy = Math.min(this.vy, MAX_FALL_SPEED);

        // Update Position
        this.x += this.vx;
        this.y += this.vy;
        
        // Rotate ball based on movement
        this.rotation += this.vx * 0.1 + 0.05;

        // Keep player somewhat centered horizontally with a restoring force if bounced
        // The game mechanic is player stays at fixed X relative to camera, but bounces might push them.
        // We gently push them back to x=150
        const targetX = 150;
        const diffX = targetX - this.x;
        this.vx += diffX * 0.05;
        
        // Log info
        if (p.frameCount % 10 === 0 && p.logs) {
            p.logs.player_info.push({
                x: this.x,
                y: this.y,
                vx: this.vx,
                vy: this.vy,
                framecount: p.frameCount,
                timestamp: Date.now()
            });
        }
    }

    jump() {
        this.vy = JUMP_FORCE;
        // Small forward impulse to help correct position if stuck
        this.vx += 1; 
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.rotation);

        // Ball Body
        p.fill(255, 140, 0); // Basketball orange
        p.stroke(0);
        p.strokeWeight(2);
        p.circle(0, 0, this.radius * 2);

        // Ball Lines (Standard Basketball pattern approximation)
        p.noFill();
        p.stroke(20);
        p.strokeWeight(2);
        p.line(-this.radius, 0, this.radius, 0); // Horizontal
        p.line(0, -this.radius, 0, this.radius); // Vertical
        // Curves
        p.arc(0, 0, this.radius * 1.5, this.radius * 2, p.PI / 4, 3 * p.PI / 4);
        p.arc(0, 0, this.radius * 1.5, this.radius * 2, -3 * p.PI / 4, -p.PI / 4);

        p.pop();
    }
}

export class Hoop {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 70; // Diameter of opening
        this.rimRadius = 6;
        this.scored = false;
        
        // Visual net properties
        this.netLength = 50;
        this.netOscillation = 0;
    }

    update(p) {
        this.x -= HOOP_SPEED;
        
        // Net animation
        this.netOscillation += 0.1;
    }

    isOffScreen() {
        return this.x < -100;
    }

    renderBack(p) {
        // Render net (back part)
        p.push();
        p.translate(this.x, this.y);
        
        p.stroke(230);
        p.strokeWeight(1);
        p.noFill();
        
        // Net shape
        const topW = this.width - 5;
        const botW = this.width * 0.4;
        const h = this.netLength;
        
        // Net lines (Crosshatch)
        p.beginShape();
        // Simple procedural net drawing
        for (let i = -topW/2; i <= topW/2; i+=10) {
            let x1 = i;
            let y1 = 0;
            let percent = (i + topW/2) / topW;
            let x2 = -botW/2 + percent * botW;
            let y2 = h;
            
            // Add some sway based on movement
            x2 += Math.sin(this.netOscillation + i * 0.1) * 3;
            
            p.line(x1, y1, x2, y2);
        }
        // Horizontal rings
        for (let j = 0; j <= h; j+=10) {
             let percent = j / h;
             let w = p.lerp(topW, botW, percent);
             let sway = Math.sin(this.netOscillation + j * 0.2) * 3 * percent;
             p.ellipse(sway, j, w, j/5); // Faux 3D perspective
        }
        
        p.pop();
        
        // Back Rim
        p.fill(180, 50, 20);
        p.stroke(100, 20, 10);
        p.circle(this.x + this.width / 2, this.y, this.rimRadius * 2);
    }

    renderFront(p) {
        // Front Rim (rendered after player to create depth)
        p.fill(220, 60, 30); // Brighter red
        p.stroke(120, 30, 15);
        p.strokeWeight(2);
        p.circle(this.x - this.width / 2, this.y, this.rimRadius * 2);
    }
}