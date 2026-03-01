// entities.js - Game entities (Robot, Enemy, Particles)
import { 
    gameState, GRID_SIZE, DIRECTIONS, COLORS, COMMANDS, 
    MAP_OFFSET_X, MAP_OFFSET_Y 
} from './globals.js';

export class Entity {
    constructor(x, y) {
        this.gridX = x;
        this.gridY = y;
        // Pixel coordinates for rendering (smooth movement)
        this.x = x * GRID_SIZE + GRID_SIZE/2;
        this.y = y * GRID_SIZE + GRID_SIZE/2;
        this.targetX = this.x;
        this.targetY = this.y;
        this.isMoving = false;
        this.isDead = false;
    }

    updatePixelPos(p) {
        // Simple lerp for smooth movement
        this.x = p.lerp(this.x, this.targetX, 0.2);
        this.y = p.lerp(this.y, this.targetY, 0.2);
        
        if (p.dist(this.x, this.y, this.targetX, this.targetY) < 1) {
            this.x = this.targetX;
            this.y = this.targetY;
            this.isMoving = false;
        } else {
            this.isMoving = true;
        }
    }

    snapToGrid() {
        this.targetX = this.gridX * GRID_SIZE + GRID_SIZE/2;
        this.targetY = this.gridY * GRID_SIZE + GRID_SIZE/2;
    }
}

export class Robot extends Entity {
    constructor(x, y) {
        super(x, y);
        this.direction = 0; // 0: Right, 1: Down, 2: Left, 3: Up
        this.color = COLORS.PLAYER;
        this.status = "READY"; // READY, BUSY, ERROR, SUCCESS
        this.animTimer = 0;
    }

    update(p) {
        this.updatePixelPos(p);
        this.animTimer += 0.1;
        
        // Log player info for write-only logs
        if (p.frameCount % 60 === 0) {
            p.logs.player_info.push({
                grid_x: this.gridX,
                grid_y: this.gridY,
                direction: this.direction,
                status: this.status,
                framecount: gameState.frameCount,
                timestamp: Date.now()
            });
        }
    }

    render(p) {
        const drawX = MAP_OFFSET_X + this.x;
        const drawY = MAP_OFFSET_Y + this.y;

        p.push();
        p.translate(drawX, drawY);
        
        // Rotate based on direction
        p.rotate(this.direction * p.HALF_PI);

        // Body
        p.fill(this.color);
        p.noStroke();
        p.rectMode(p.CENTER);
        
        // Glitch effect on robot
        if (p.random() < 0.05) {
            p.translate(p.random(-2, 2), p.random(-2, 2));
        }

        // Main chassis
        p.rect(0, 0, 24, 24, 4);
        
        // Direction indicator (Arrow/Head)
        p.fill(0);
        p.triangle(4, -6, 4, 6, 10, 0);
        
        // Glow
        p.noFill();
        p.stroke(COLORS.PLAYER_GLOW);
        p.strokeWeight(2);
        const pulse = p.sin(this.animTimer) * 4;
        p.rect(0, 0, 30 + pulse, 30 + pulse, 5);

        p.pop();
    }
    
    // Actions
    moveForward() {
        const dir = DIRECTIONS[this.direction];
        this.gridX += dir.x;
        this.gridY += dir.y;
        this.snapToGrid();
    }

    turnLeft() {
        this.direction = (this.direction + 3) % 4;
    }

    turnRight() {
        this.direction = (this.direction + 1) % 4;
    }
}

export class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y);
        this.type = type;
        this.pulse = 0;
    }

    update(p) {
        this.updatePixelPos(p);
        this.pulse += 0.1;
    }

    render(p) {
        const drawX = MAP_OFFSET_X + this.x;
        const drawY = MAP_OFFSET_Y + this.y;

        p.push();
        p.translate(drawX, drawY);
        
        p.fill(COLORS.ENEMY);
        p.noStroke();
        
        // Spiky shape for enemy
        const size = 10 + p.sin(this.pulse) * 2;
        p.beginShape();
        for (let i = 0; i < 8; i++) {
            const angle = i * p.TWO_PI / 8;
            const r = (i % 2 === 0) ? size * 1.5 : size * 0.8;
            p.vertex(p.cos(angle) * r, p.sin(angle) * r);
        }
        p.endShape(p.CLOSE);

        // Core
        p.fill(0);
        p.circle(0, 0, 6);

        p.pop();
    }
    
    die(p) {
        this.isDead = true;
        // Spawn particles
        for(let i=0; i<10; i++) {
            gameState.particles.push(new Particle(this.x, this.y, COLORS.ENEMY));
        }
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
        this.decay = Math.random() * 0.05 + 0.02;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    render(p) {
        if (this.life <= 0) return;
        p.push();
        p.noStroke();
        const c = p.color(this.color);
        c.setAlpha(this.life * 255);
        p.fill(c);
        p.circle(MAP_OFFSET_X + this.x, MAP_OFFSET_Y + this.y, 4 * this.life);
        p.pop();
    }
}

// Effect for attack
export class Projectile {
    constructor(x, y, direction) {
        this.x = x * GRID_SIZE + GRID_SIZE/2;
        this.y = y * GRID_SIZE + GRID_SIZE/2;
        this.vx = DIRECTIONS[direction].x * 10;
        this.vy = DIRECTIONS[direction].y * 10;
        this.life = 10; // short range
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    
    render(p) {
        p.push();
        p.stroke(COLORS.PLAYER);
        p.strokeWeight(3);
        p.point(MAP_OFFSET_X + this.x, MAP_OFFSET_Y + this.y);
        p.pop();
    }
}