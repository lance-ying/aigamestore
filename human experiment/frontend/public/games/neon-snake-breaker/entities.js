/**
 * entities.js
 * Game entity classes.
 */

import { gameState, CONFIG, COLORS, CANVAS_HEIGHT, CANVAS_WIDTH } from './globals.js';
import { createTextPopup } from './particles.js';

export class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.toRemove = false;
    }
    
    update(p) {
        // Base update logic (e.g., scrolling)
        if (!gameState.isFrozen) {
            this.y += gameState.scrollSpeed;
        }
        
        // Remove if off screen bottom
        if (this.y > CANVAS_HEIGHT + 100) {
            this.toRemove = true;
        }
    }

    render(p) {}
}

/**
 * The Snake (Player)
 */
export class Snake {
    constructor(x, y) {
        this.x = x;
        this.y = y; // Typically fixed, but can wobble
        this.radius = CONFIG.PLAYER_RADIUS;
        this.length = CONFIG.INITIAL_SNAKE_LENGTH;
        this.trail = []; // Stores previous positions for the body
        this.vx = 0;
        this.maxTrailLength = 1000; // Increased cap to prevent memory issues with wider spacing
    }

    handleInput(action) {
        const speed = action.speedMod ? CONFIG.LATERAL_SPEED_FAST : CONFIG.LATERAL_SPEED;
        this.vx = 0;
        if (action.left) this.vx = -speed;
        if (action.right) this.vx = speed;
        
        if (action.activateFever) {
            this.tryActivateFever();
        }
    }

    tryActivateFever() {
        if (gameState.feverValue >= CONFIG.FEVER_MAX && !gameState.isFeverActive) {
            gameState.isFeverActive = true;
            gameState.feverTimer = CONFIG.FEVER_DURATION;
            gameState.feverValue = 0;
        }
    }

    update(p) {
        // Update physics
        this.x += this.vx;

        // Constrain to screen
        this.x = p.constrain(this.x, this.radius, CANVAS_WIDTH - this.radius);

        // Move trail points down to simulate forward movement (vertical snake)
        if (!gameState.isFrozen) {
            for (let point of this.trail) {
                point.y += gameState.scrollSpeed;
            }
        }

        // Update trail for body rendering
        // We push the current head position to the front
        this.trail.unshift({x: this.x, y: this.y});
        
        // We only keep as many trail points as we need for visual length
        // Spacing factor is roughly 6, so we need length * 6 + buffer
        if (this.trail.length > this.length * 6 + 20) {
            this.trail.pop();
        }

        // Fever Logic
        if (gameState.isFeverActive) {
            gameState.feverTimer--;
            // Auto-move forward fast (simulated by faster scroll speed in game.js)
            if (gameState.feverTimer <= 0) {
                gameState.isFeverActive = false;
            }
        }
        
        // Log player info periodically
        if (p.frameCount % 10 === 0) {
            p.logs.player_info.push({
                x: this.x,
                y: this.y,
                length: this.length,
                score: gameState.score,
                timestamp: Date.now()
            });
        }
    }

    render(p) {
        // Draw body
        p.noStroke();
        const bodySpacing = 6; // Increased from 2 to make circles farther apart
        
        for (let i = 1; i < this.length; i++) {
            let idx = i * bodySpacing;
            if (idx >= this.trail.length) break;
            
            let pos = this.trail[idx];
            // Visual size slightly decreases towards tail
            let size = (this.radius * 2) * (1 - (i / (this.length + 10)) * 0.3);
            
            if (gameState.isFeverActive) {
                p.fill(p.random(200, 255), p.random(50, 150), p.random(100, 255));
            } else {
                p.fill(...COLORS.PLAYER);
            }
            p.circle(pos.x, pos.y, size);
        }

        // Draw Head
        if (gameState.isFeverActive) {
            p.fill(255, 255, 255);
            p.drawingContext.shadowBlur = 20;
            p.drawingContext.shadowColor = p.color(...COLORS.FEVER);
        } else {
            p.fill(...COLORS.PLAYER);
            p.drawingContext.shadowBlur = 0;
        }
        
        p.circle(this.x, this.y, this.radius * 2);
        p.drawingContext.shadowBlur = 0; // Reset

        // Draw Length Text
        p.fill(255); // Changed to white for better contrast
        p.textSize(16); // Increased size
        p.textStyle(p.BOLD);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(this.length, this.x, this.y - 22); // Adjusted Y offset
    }
}

/**
 * Block Obstacle
 */
export class Block extends Entity {
    constructor(x, y, value) {
        super(x, y);
        this.size = CONFIG.BLOCK_SIZE;
        this.value = value;
        this.maxValue = value; // Store original for color mapping
        this.color = this.getColor();
    }

    getColor() {
        // Map value to color gradient
        // Simple thresholding for now
        if (this.value <= 5) return COLORS.BLOCK_LOW;
        if (this.value <= 20) return COLORS.BLOCK_MED;
        return COLORS.BLOCK_HIGH;
    }

    render(p) {
        // Update color based on current value (damage feedback)
        this.color = this.getColor();
        
        p.push();
        p.translate(this.x, this.y);
        
        p.fill(...this.color);
        p.stroke(255, 50);
        p.strokeWeight(2);
        
        // Rounded rect
        p.rect(0, 0, this.size, this.size, 5);
        
        // Text
        p.textAlign(p.CENTER, p.CENTER);
        p.fill(255);
        p.stroke(0);
        p.strokeWeight(3);
        p.textSize(28);
        p.textStyle(p.BOLD);
        p.text(this.value, this.size/2, this.size/2);
        
        p.pop();
    }
}

/**
 * Food (Ball)
 */
export class Food extends Entity {
    constructor(x, y, value) {
        super(x, y);
        this.radius = 12; // Slightly larger for better visibility
        this.value = value;
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        p.fill(...COLORS.FOOD);
        p.noStroke();
        p.circle(0, 0, this.radius * 2);
        
        // Pulse animation
        const pulse = 1 + p.sin(p.frameCount * 0.1) * 0.1;
        p.stroke(...COLORS.FOOD);
        p.noFill();
        p.circle(0, 0, this.radius * 2 * pulse);

        // Text
        p.textAlign(p.CENTER, p.CENTER);
        p.fill(0);
        p.noStroke();
        p.textSize(14);
        p.textStyle(p.BOLD);
        p.text(this.value, 0, 0);
        
        p.pop();
    }
}

/**
 * Vertical Wall
 */
export class Wall extends Entity {
    constructor(x, y, height) {
        super(x, y);
        this.height = height;
        this.width = CONFIG.WALL_WIDTH;
    }

    render(p) {
        p.push();
        p.stroke(...COLORS.WALL);
        p.strokeWeight(this.width);
        p.line(this.x, this.y, this.x, this.y + this.height);
        p.pop();
    }
}