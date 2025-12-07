/**
 * Game Entity Classes: Robot, Enemy, Effect
 */
import { COMMANDS, DIR, TILE_SIZE, COLORS, GRID_OFFSET_X, GRID_OFFSET_Y, gameState } from './globals.js';

export class Entity {
    constructor(x, y) {
        this.gridX = x;
        this.gridY = y;
        this.pixelX = this.getPixelX(x);
        this.pixelY = this.getPixelY(y);
        this.isDead = false;
    }

    getPixelX(gridX) {
        return GRID_OFFSET_X + gridX * TILE_SIZE + TILE_SIZE / 2;
    }

    getPixelY(gridY) {
        return GRID_OFFSET_Y + gridY * TILE_SIZE + TILE_SIZE / 2;
    }

    updateLerp(p) {
        // Smoothly interpolate pixel position to grid position
        const targetX = this.getPixelX(this.gridX);
        const targetY = this.getPixelY(this.gridY);
        this.pixelX = p.lerp(this.pixelX, targetX, 0.2);
        this.pixelY = p.lerp(this.pixelY, targetY, 0.2);
    }
}

export class Robot extends Entity {
    constructor(id, x, y, direction = DIR.RIGHT) {
        super(x, y);
        this.id = id;
        this.direction = direction;
        this.commands = new Array(8).fill(COMMANDS.EMPTY);
        this.initialState = { x, y, direction };
        this.color = COLORS.ROBOT;
    }

    reset() {
        this.gridX = this.initialState.x;
        this.gridY = this.initialState.y;
        this.direction = this.initialState.direction;
        this.pixelX = this.getPixelX(this.gridX);
        this.pixelY = this.getPixelY(this.gridY);
        this.isDead = false;
    }

    render(p, isActive) {
        if (this.isDead) return;

        this.updateLerp(p);

        p.push();
        p.translate(this.pixelX, this.pixelY);
        
        // Body
        p.rectMode(p.CENTER);
        p.fill(isActive ? COLORS.ROBOT_ACTIVE : COLORS.ROBOT);
        p.stroke(255);
        p.strokeWeight(isActive ? 3 : 1);
        p.rect(0, 0, TILE_SIZE * 0.7, TILE_SIZE * 0.7, 5);

        // Direction Indicator (Eye/Arrow)
        p.rotate(this.getRotationAngle(p));
        p.fill(255);
        p.noStroke();
        p.triangle(
            -5, -5,
            -5, 5,
            10, 0
        );
        p.pop();
    }

    getRotationAngle(p) {
        if (this.direction === DIR.RIGHT) return 0;
        if (this.direction === DIR.DOWN) return p.HALF_PI;
        if (this.direction === DIR.LEFT) return p.PI;
        if (this.direction === DIR.UP) return -p.HALF_PI;
        return 0;
    }
}

export class Enemy extends Entity {
    constructor(x, y, type = 'STATIC') {
        super(x, y);
        this.type = type;
        this.color = COLORS.ENEMY;
        this.pulse = 0;
    }

    update(p) {
        this.updateLerp(p);
        this.pulse = (p.sin(p.frameCount * 0.1) + 1) * 0.5; // 0 to 1
    }

    render(p) {
        if (this.isDead) return;
        
        this.update(p);

        p.push();
        p.translate(this.pixelX, this.pixelY);
        p.fill(this.color);
        p.noStroke();
        
        // Spiky shape
        const radius = TILE_SIZE * 0.3 + (this.pulse * 5);
        p.beginShape();
        for (let i = 0; i < 8; i++) {
            const angle = i * (p.TWO_PI / 8);
            const r = (i % 2 === 0) ? radius : radius * 0.5;
            p.vertex(p.cos(angle) * r, p.sin(angle) * r);
        }
        p.endShape(p.CLOSE);
        
        // Core
        p.fill(255, 200, 200);
        p.circle(0, 0, TILE_SIZE * 0.15);
        p.pop();
    }
}

export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 1.0;
        this.decay = 0.05;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.circle(this.x, this.y, 4 * this.life);
    }
}