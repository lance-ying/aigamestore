/**
 * Game entities: Player (Launcher), Balls, Bricks, Items
 */
import { gameState, CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, BRICK_WIDTH } from './globals.js';
import { createExplosion } from './particles.js';
import { colorLerp } from './utils.js';

export class Launcher {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.angle = -Math.PI / 2; // Pointing up
        this.width = 20;
        this.height = 20;
    }

    update(p) {
        // Smoothly interpolate to new position between turns
        // This is instant in this implementation logic (handled in game loop), 
        // but we could add animation here if needed.
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Draw Aim Line if aiming
        if (gameState.turnPhase === "AIMING") {
            this.renderTrajectory(p);
        }

        // Draw Launcher Base
        p.noStroke();
        p.fill(COLORS.LAUNCHER);
        p.circle(0, 0, 15);
        
        // Draw Ball Count
        p.fill(0);
        p.textSize(10);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(gameState.ballCount, 0, 0);
        
        p.pop();
    }

    renderTrajectory(p) {
        // Calculate preview points
        import('./physics.js').then(module => {
            const points = module.getTrajectoryPreview(this.x, this.y, this.angle, p);
            
            p.stroke(255, 255, 255, 100);
            p.strokeWeight(2);
            p.setLineDash([5, 5]); // Dashed line
            
            p.beginShape();
            for (let point of points) {
                p.vertex(point.x, point.y);
            }
            p.endShape();
            p.setLineDash([]); // Reset
        });
    }
}

export class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = CONFIG.BALL_SIZE / 2;
        this.vx = 0;
        this.vy = 0;
        this.speed = CONFIG.BALL_SPEED;
        this.active = false;
        this.launchDelay = 0;
    }

    launch(angle, delayFrames) {
        this.x = gameState.player.x;
        this.y = gameState.player.y;
        this.active = true; // Wait for delay to actually move?
        // To simplify, we'll manage launch queue in game loop, 
        // here just set velocity.
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    update(p, dt) {
        if (!this.active) return;
        
        // dt is percentage of frame, typically 1.0 or less if sub-stepping
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    render(p) {
        if (!this.active) return;
        p.noStroke();
        p.fill(COLORS.BALL);
        p.circle(this.x, this.y, this.radius * 2);
    }
}

export class Brick {
    constructor(col, row, hp) {
        this.width = BRICK_WIDTH - CONFIG.BRICK_GUTTER;
        this.height = CONFIG.BRICK_HEIGHT - CONFIG.BRICK_GUTTER;
        this.col = col;
        this.row = row;
        
        // Calculate screen position
        this.updatePosition();
        
        this.maxHp = hp;
        this.hp = hp;
        this.isDead = false;
    }

    updatePosition() {
        this.x = (this.col * BRICK_WIDTH) + CONFIG.WALL_PADDING + (CONFIG.BRICK_GUTTER / 2);
        this.y = (this.row * CONFIG.BRICK_HEIGHT) + CONFIG.TOP_OFFSET + (CONFIG.BRICK_GUTTER / 2);
    }

    moveDown() {
        this.row++;
        this.updatePosition();
        
        // Check game over condition
        if (this.y + this.height >= CANVAS_HEIGHT - CONFIG.BOTTOM_OFFSET) {
            return true; // Reached bottom
        }
        return false;
    }

    hit(p) {
        this.hp--;
        if (this.hp <= 0) {
            this.destroy(p);
        }
    }

    destroy(p) {
        this.isDead = true;
        gameState.score += this.maxHp * 10;
        createExplosion(this.x + this.width/2, this.y + this.height/2, this.getColor(p));
        
        // Remove from array happens in game loop cleanup or filter
    }

    getColor(p) {
        // Interpolate color based on HP relative to level
        // For visual variety, let's use a gradient from start to end color
        const ratio = Math.min(1, this.hp / (gameState.level * 2)); // Dynamic range
        
        // Use p instance methods instead of p5.prototype to avoid colorMode errors
        return p.lerpColor(
            p.color(COLORS.BRICK_GRADIENT_START.r, COLORS.BRICK_GRADIENT_START.g, COLORS.BRICK_GRADIENT_START.b),
            p.color(COLORS.BRICK_GRADIENT_END.r, COLORS.BRICK_GRADIENT_END.g, COLORS.BRICK_GRADIENT_END.b),
            1 - ratio // High HP = Start Color, Low HP = End Color
        );
    }

    render(p) {
        if (this.isDead) return;

        p.push();
        p.fill(this.getColor(p));
        p.stroke(255, 50);
        p.rect(this.x, this.y, this.width, this.height, 4);
        
        // Draw HP text
        p.fill(255);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(12);
        p.text(this.hp, this.x + this.width/2, this.y + this.height/2);
        p.pop();
    }
}

export class Item {
    constructor(col, row) {
        this.col = col;
        this.row = row;
        this.radius = 10;
        this.updatePosition();
        this.collected = false;
    }

    updatePosition() {
        this.x = (this.col * BRICK_WIDTH) + CONFIG.WALL_PADDING + BRICK_WIDTH/2;
        this.y = (this.row * CONFIG.BRICK_HEIGHT) + CONFIG.TOP_OFFSET + CONFIG.BRICK_HEIGHT/2;
    }

    moveDown() {
        this.row++;
        this.updatePosition();
        if (this.y > CANVAS_HEIGHT - CONFIG.BOTTOM_OFFSET) {
            this.collected = true; // Remove if it goes off screen (or player misses it)
        }
    }

    collect() {
        if (this.collected) return;
        this.collected = true;
        gameState.ballCount++;
        createExplosion(this.x, this.y, COLORS.ITEM_ADD_BALL);
    }

    render(p) {
        if (this.collected) return;
        
        p.push();
        p.stroke(COLORS.ITEM_ADD_BALL);
        p.noFill();
        
        // Pulsing animation
        const s = 10 + Math.sin(p.frameCount * 0.1) * 2;
        p.circle(this.x, this.y, s);
        
        p.fill(COLORS.ITEM_ADD_BALL);
        p.noStroke();
        p.circle(this.x, this.y, 6);
        p.pop();
    }
}

// Add setLineDash to p5 prototype if missing (older versions)
if (!p5.prototype.setLineDash) {
    p5.prototype.setLineDash = function(list) {
        this.drawingContext.setLineDash(list);
    }
}