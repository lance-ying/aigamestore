/**
 * entities.js
 * Classes for Game Entities: Knife, Target, Apple, Boss.
 */

import { gameState, GAME_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { normalizeAngle } from './physics.js';

/**
 * The Knife projectile.
 */
export class Knife {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 12;
        this.height = 50;
        this.state = "READY"; // READY, FLYING, STUCK, REBOUND
        this.angle = 0; // Relative angle on target when stuck
        this.vx = 0;
        this.vy = 0;
        
        // For rebound physics
        this.rotSpeed = 0; 
    }

    throw() {
        if (this.state === "READY") {
            this.state = "FLYING";
            this.vy = -GAME_CONFIG.knifeSpeed;
        }
    }

    update() {
        if (this.state === "FLYING") {
            this.y += this.vy;
        } else if (this.state === "REBOUND") {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += GAME_CONFIG.gravity; // Gravity
            this.angle += this.rotSpeed;
            
            // Remove if off screen
            if (this.y > CANVAS_HEIGHT + 50) {
                // Determine removal logic in game loop
            }
        }
    }

    rebound() {
        this.state = "REBOUND";
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = 5 + Math.random() * 5;
        this.rotSpeed = (Math.random() - 0.5) * 0.5;
    }

    render(p) {
        p.push();
        
        if (this.state === "STUCK") {
            // Render relative to target in Target.render() usually, 
            // but if we render here, we need coordinate transformation.
            // We'll let the Target render its stuck knives to handle rotation easily.
            // This render method is for Flying/Ready/Rebound knives.
        } else if (this.state === "REBOUND") {
            p.translate(this.x, this.y);
            p.rotate(this.angle);
            this.drawKnifeGraphic(p);
        } else {
            // READY or FLYING
            p.translate(this.x, this.y);
            // No rotation for straight throw
            this.drawKnifeGraphic(p);
        }
        
        p.pop();
    }

    // Helper to draw the vector art of the knife
    drawKnifeGraphic(p) {
        p.noStroke();
        
        // Handle
        p.fill(GAME_CONFIG.colors.knifeHandle);
        p.rectMode(p.CENTER);
        p.rect(0, 15, 10, 20, 2);
        
        // Guard
        p.fill(80);
        p.rect(0, 5, 14, 4);
        
        // Blade
        p.fill(GAME_CONFIG.colors.knifeBlade);
        p.beginShape();
        p.vertex(-4, 5);
        p.vertex(4, 5);
        p.vertex(4, -20); // Straight part
        p.vertex(0, -30); // Tip
        p.vertex(-4, -20);
        p.endShape(p.CLOSE);
        
        // Shine on blade
        p.fill(255, 255, 255, 150);
        p.beginShape();
        p.vertex(0, -28);
        p.vertex(2, -18);
        p.vertex(0, -20);
        p.endShape(p.CLOSE);
    }
}

/**
 * The Apple collectible.
 */
export class Apple {
    constructor(angle) {
        this.angle = angle; // Angle relative to target
        this.radius = 12;
        this.hit = false;
    }
    
    render(p, targetRadius) {
        if (this.hit) return;
        
        // Calculate position relative to target center (0,0 local)
        // Apple sits on the edge
        const dist = targetRadius; 
        const x = Math.cos(this.angle) * dist;
        const y = Math.sin(this.angle) * dist;
        
        p.push();
        p.translate(x, y);
        p.rotate(this.angle + Math.PI / 2); // Rotate to stick out perpendicular
        
        // Apple Body
        p.fill(200, 30, 30);
        p.stroke(150, 20, 20);
        p.strokeWeight(1);
        p.circle(0, 0, this.radius * 2);
        
        // Shine
        p.noStroke();
        p.fill(255, 255, 255, 100);
        p.circle(-3, -3, 6);
        
        // Stem
        p.stroke(80, 50, 20);
        p.strokeWeight(2);
        p.line(0, -this.radius + 2, 0, -this.radius - 5);
        
        // Leaf
        p.noStroke();
        p.fill(50, 180, 50);
        p.ellipse(3, -this.radius - 3, 6, 3);
        
        p.pop();
    }
}

/**
 * The main target (Log). Can be a Boss.
 */
export class Target {
    constructor(isBoss = false, stage = 1) {
        this.x = CANVAS_WIDTH / 2;
        this.y = GAME_CONFIG.targetCenterY;
        this.radius = GAME_CONFIG.targetRadius;
        this.isBoss = isBoss;
        this.stage = stage;
        
        this.rotation = 0;
        this.apples = [];
        
        // Rotation Pattern
        // Patterns define how the speed changes over time
        this.rotationPattern = this.generatePattern(stage, isBoss);
        this.patternTimer = 0;
        this.currentSpeed = 0;
        
        // Visuals
        this.textureSeed = Math.random() * 1000;
        this.pulse = 0;
    }

    generatePattern(stage, isBoss) {
        // Difficulty scaler
        const baseSpeed = 0.02 + (stage * 0.002);
        
        if (isBoss) {
            // Boss patterns are erratic
            return [
                { duration: 120, speed: baseSpeed * 2 },
                { duration: 60, speed: -baseSpeed * 2 }, // Quick reverse
                { duration: 90, speed: baseSpeed * 0.5 }, // Slow
                { duration: 40, speed: baseSpeed * 3 }, // Burst
                { duration: 30, speed: 0 } // Stop
            ];
        } else {
            // Normal patterns
            const type = stage % 4;
            switch(type) {
                case 0: // Constant
                    return [{ duration: 9999, speed: baseSpeed }];
                case 1: // Stop and Go
                    return [
                        { duration: 120, speed: baseSpeed },
                        { duration: 60, speed: 0 },
                        { duration: 120, speed: baseSpeed }
                    ];
                case 2: // Reverse
                    return [
                        { duration: 180, speed: baseSpeed },
                        { duration: 180, speed: -baseSpeed }
                    ];
                case 3: // Variable
                    return [
                        { duration: 120, speed: baseSpeed },
                        { duration: 120, speed: baseSpeed * 2 },
                        { duration: 120, speed: baseSpeed * 0.5 }
                    ];
            }
        }
        return [{ duration: 9999, speed: 0.03 }];
    }

    update() {
        // Handle rotation pattern
        const currentPhase = this.rotationPattern[0];
        
        // Lerp speed for smoothness
        this.currentSpeed = this.lerp(this.currentSpeed, currentPhase.speed, 0.1);
        this.rotation += this.currentSpeed;
        
        // Normalize rotation
        this.rotation = normalizeAngle(this.rotation);
        
        // Timer for pattern
        this.patternTimer++;
        if (this.patternTimer >= currentPhase.duration) {
            this.patternTimer = 0;
            // Cycle pattern
            this.rotationPattern.push(this.rotationPattern.shift());
        }
        
        // Pulse effect when hit (handled via external setting of this.pulse)
        if (this.pulse > 0) this.pulse -= 1;
    }

    lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }

    addApple(angle) {
        this.apples.push(new Apple(angle));
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Apply rotation
        p.rotate(this.rotation);
        
        // Draw stuck knives FIRST so they appear behind the front of the log but on it
        // Actually, in 2D, if we draw knives here, they rotate with the canvas.
        // We draw them before the log if they are 'behind' (top half) and after if 'front'?
        // No, simple layering: Log -> Knives. Knives stick OUT of the log.
        // But to make it look like they are embedded, we can draw the log, then the knives.
        
        // Draw Stuck Knives (Handles sticking out)
        // We need to iterategameState.stuckKnives
        // But wait, the knives in gameState.stuckKnives need to be rendered RELATIVE to this rotation.
        // In game.js, we push knives to gameState.stuckKnives.
        // Here we render them.
        
        // Draw Apples
        this.apples.forEach(apple => apple.render(p, this.radius));
        
        // Draw the Log/Target Body
        if (this.isBoss) {
            this.renderBossVisuals(p);
        } else {
            this.renderLogVisuals(p);
        }
        
        // Draw Stuck Knives ON TOP of the log (the handles)
        gameState.stuckKnives.forEach(knife => {
            p.push();
            // Calculate position on the circle edge
            // The knife angle is the angle on the log where it is stuck.
            // Since we already rotated the coordinate system by this.rotation,
            // we just rotate by knife.angle.
            p.rotate(knife.angle);
            p.translate(0, this.radius); // Move to edge
            
            // The knife is sticking IN. 
            // In Knife.render, (0,0) is center.
            // We want the blade inside, handle outside.
            // Let's adjust manually.
            p.translate(0, 0); // At edge
            
            // Draw knife
            // Since we are at the edge, rotated correctly:
            // Pointing out? Standard knife points UP (neg Y).
            // We want handle OUT, blade IN.
            // So if we rotate PI, it points IN. 
            // Actually, let's just draw it relative to local (0,0) which is edge.
            
            p.rotate(Math.PI); // Point outward
            
            // Draw simplified knife for stuck state
            p.noStroke();
            // Handle
            p.fill(GAME_CONFIG.colors.knifeHandle);
            p.rectMode(p.CENTER);
            p.rect(0, 20, 10, 24, 2);
            // Guard
            p.fill(80);
            p.rect(0, 8, 14, 4);
            // Blade (partially hidden/embedded)
            p.fill(GAME_CONFIG.colors.knifeBlade);
            p.rect(0, 0, 8, 10); // Small bit visible
            
            p.pop();
        });
        
        p.pop();
    }

    renderLogVisuals(p) {
        const r = this.radius + (this.pulse > 0 ? 2 : 0);
        
        // Main Wood
        p.fill(GAME_CONFIG.colors.woodLight);
        p.stroke(GAME_CONFIG.colors.woodDark);
        p.strokeWeight(4);
        p.circle(0, 0, r * 2);
        
        // Rings
        p.noFill();
        p.stroke(GAME_CONFIG.colors.woodDark);
        p.strokeWeight(2);
        p.circle(0, 0, r * 1.4);
        p.circle(0, 0, r * 0.8);
        p.circle(0, 0, r * 0.3);
        
        // Texture lines (cracks) based on seed
        p.push();
        p.stroke(GAME_CONFIG.colors.woodDark);
        p.strokeWeight(2);
        const count = 5;
        for (let i = 0; i < count; i++) {
            const angle = (this.textureSeed + i * (Math.PI * 2 / count)) % (Math.PI * 2);
            const len = r * (0.4 + Math.sin(i * 132) * 0.2);
            p.rotate(angle);
            p.line(0, 0, 0, len);
            p.rotate(-angle);
        }
        p.pop();
    }
    
    renderBossVisuals(p) {
        const r = this.radius + (this.pulse > 0 ? 3 : 0);
        const bossType = this.stage % 3; // 3 boss types
        
        if (bossType === 0) {
            // CHEESE BOSS
            p.fill(255, 220, 50); // Yellow
            p.stroke(200, 150, 0);
            p.strokeWeight(4);
            p.circle(0, 0, r * 2);
            // Holes
            p.fill(200, 150, 0);
            p.noStroke();
            p.circle(10, 10, 15);
            p.circle(-20, 20, 10);
            p.circle(20, -20, 12);
            p.circle(-10, -30, 8);
        } else if (bossType === 1) {
            // TIRE BOSS
            p.fill(40); // Dark Grey
            p.stroke(20);
            p.strokeWeight(4);
            p.circle(0, 0, r * 2);
            // Hubcap
            p.fill(150);
            p.circle(0, 0, r);
            // Treads
            p.stroke(20);
            p.strokeWeight(5);
            for(let i=0; i<8; i++) {
                p.rotate(Math.PI/4);
                p.line(r-10, 0, r, 0);
            }
        } else {
            // TOMATO BOSS
            p.fill(220, 40, 40); // Red
            p.stroke(150, 20, 20);
            p.strokeWeight(4);
            p.circle(0, 0, r * 2);
            // Green top
            p.fill(50, 180, 50);
            p.noStroke();
            p.rectMode(p.CENTER);
            p.rect(0, 0, 20, 20);
            p.push();
            for(let i=0; i<5; i++) {
                p.rotate(Math.PI*2/5);
                p.triangle(0, 0, 5, 25, -5, 25);
            }
            p.pop();
        }
    }
}