// game entities classes
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, INITIAL_BLOCK_HEIGHT, getBlockColor } from './globals.js';

export class Block {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
    }

    render(p) {
        p.push();
        p.fill(this.color);
        p.stroke(255, 50); // Subtle highlight
        p.strokeWeight(1);
        p.rectMode(p.CENTER);
        p.rect(this.x, this.y, this.width, this.height);
        
        // Inner shine for neon look
        p.noStroke();
        p.fill(255, 50);
        p.rect(this.x, this.y - this.height * 0.25, this.width * 0.9, this.height * 0.1);
        p.pop();
    }
}

export class ActiveBlock extends Block {
    constructor(y, width, height, color, speed, index) {
        // Start from left or right side based on index parity
        const startX = (index % 2 === 0) ? -width : CANVAS_WIDTH + width;
        super(startX, y, width, height, color);
        
        this.direction = (index % 2 === 0) ? 1 : -1;
        this.speed = speed;
        this.index = index;
    }

    update() {
        this.x += this.speed * this.direction;
        
        // Bounce logic (though usually in stacker it's strictly loop or bounce)
        // We will make it oscillate with some margin
        const limit = CANVAS_WIDTH / 2 + 250; // allow going off screen slightly
        if (this.x > limit && this.direction > 0) {
            this.direction = -1;
        } else if (this.x < -limit + CANVAS_WIDTH && this.direction < 0) {
            this.direction = 1;
        }
    }
}

export class Debris extends Block {
    constructor(x, y, width, height, color) {
        super(x, y, width, height, color);
        this.vx = (Math.random() - 0.5) * 5;
        this.vy = -Math.random() * 5; // Initial upward pop
        this.rotation = 0;
        this.rotSpeed = (Math.random() - 0.5) * 0.2;
        this.alpha = 255;
    }

    update() {
        // Physics logic handled in physics.js loop generally, but we can do simple updates here
        this.alpha -= 2; // Fade out
    }
    
    isDead() {
        return this.alpha <= 0 || this.y > CANVAS_HEIGHT + 200; // Cleanup buffer
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.rotation);
        
        // Extract RGB components to apply alpha
        const c = p.color(this.color);
        p.fill(p.red(c), p.green(c), p.blue(c), this.alpha);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.width, this.height);
        p.pop();
    }
}

export class BackgroundParticle {
    constructor(p) {
        this.x = p.random(CANVAS_WIDTH);
        this.y = p.random(CANVAS_HEIGHT * 2); // Taller area for parallax
        this.size = p.random(1, 3);
        this.speedY = p.random(0.2, 1.5);
        this.alpha = p.random(50, 200);
    }
    
    update(cameraY) {
        // Simple parallax: move down relative to camera, wrap around
        this.y += this.speedY;
        
        // Wrap logic relative to camera viewport
        const screenY = this.y - cameraY * 0.5; // 0.5 parallax factor
        if (screenY > CANVAS_HEIGHT) {
            this.y -= CANVAS_HEIGHT * 1.5;
            this.x = Math.random() * CANVAS_WIDTH;
        }
    }
    
    render(p, cameraY) {
        const screenY = this.y - cameraY * 0.5;
        p.fill(255, 255, 255, this.alpha);
        p.noStroke();
        p.circle(this.x, screenY, this.size);
    }
}