/**
 * Game Entities
 * Definitions for Player (Pico), Walls, Blocks, Collectibles, etc.
 */

import { 
    COLORS, PICO_WIDTH, PICO_HEIGHT, GRAVITY, JUMP_FORCE, 
    MOVE_SPEED, MAX_SPEED, BLOCK_SIZE, REGROUP_FORCE 
} from './globals.js';

/**
 * Base Entity Class
 */
class Entity {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.isStatic = false;
        this.type = 'ENTITY';
        this.dead = false;
    }

    render(p) {
        p.push();
        p.fill(this.color);
        p.noStroke();
        p.rect(this.x, this.y, this.width, this.height);
        p.pop();
    }
}

/**
 * Pico (Player Character)
 */
export class Pico extends Entity {
    constructor(x, y, color) {
        super(x, y, PICO_WIDTH, PICO_HEIGHT, color);
        this.type = 'PICO';
        this.grounded = false;
        this.facing = 1; // 1 Right, -1 Left
        this.stackedOn = null; // Reference to entity below
        this.animTimer = 0;
    }

    applyInput(input, centerOfMassX) {
        // Horizontal Movement
        let targetSpeed = 0;
        if (input.left) {
            targetSpeed = -MAX_SPEED;
            this.facing = -1;
        } else if (input.right) {
            targetSpeed = MAX_SPEED;
            this.facing = 1;
        }

        // Precision mode
        if (input.precision) targetSpeed *= 0.4;

        // Accelerate towards target speed
        if (targetSpeed !== 0) {
            this.vx += (targetSpeed - this.vx) * 0.2;
        }
        
        // Jump
        if (input.jump && this.grounded) {
            this.vy = JUMP_FORCE;
            this.grounded = false;
            // Add a small boost if precision jumping
            if (input.precision) this.vy *= 0.8;
        }

        // Regroup (Magnetic pull to center)
        if (input.regroup) {
            const dx = centerOfMassX - (this.x + this.width/2);
            // Apply force only if grounded or slight air control
            if (Math.abs(dx) > 10) {
                this.vx += Math.sign(dx) * REGROUP_FORCE;
            }
        }
    }

    render(p) {
        // Draw Body
        p.push();
        p.translate(this.x, this.y);
        
        // Squash and stretch
        let sx = 1, sy = 1;
        if (!this.grounded) {
            sx = 0.9; sy = 1.1;
        } else if (Math.abs(this.vx) > 0.1) {
            // Walking wobble
            this.animTimer += 0.2;
            sy = 1 + Math.sin(this.animTimer) * 0.1;
            sx = 1 - Math.sin(this.animTimer) * 0.05;
        }

        // Apply scale from bottom-center
        p.translate(this.width/2, this.height);
        p.scale(sx, sy);
        p.translate(-this.width/2, -this.height);

        // Main shape
        p.fill(this.color);
        p.stroke(0, 0, 0, 50);
        p.strokeWeight(1);
        p.rect(0, 0, this.width, this.height, 4);

        // Eyes
        p.fill(255);
        p.noStroke();
        const eyeX = this.facing === 1 ? 14 : 4;
        const eyeX2 = this.facing === 1 ? 20 : 10;
        
        p.circle(eyeX, 8, 6);
        p.circle(eyeX2, 8, 6);
        
        // Pupils
        p.fill(0);
        p.circle(eyeX + this.facing, 8, 2);
        p.circle(eyeX2 + this.facing, 8, 2);

        p.pop();
    }
}

/**
 * Wall (Static Geometry)
 */
export class Wall extends Entity {
    constructor(x, y, w, h) {
        super(x, y, w, h, COLORS.WALL);
        this.isStatic = true;
        this.type = 'WALL';
    }
    
    render(p) {
        p.push();
        p.fill(this.color);
        p.stroke(0);
        p.strokeWeight(2);
        p.rect(this.x, this.y, this.width, this.height);
        // Pattern
        p.stroke(120);
        p.line(this.x, this.y, this.x + this.width, this.y + this.height);
        p.pop();
    }
}

/**
 * Block (Pushable)
 */
export class Block extends Entity {
    constructor(x, y) {
        super(x, y, BLOCK_SIZE, BLOCK_SIZE, [150, 150, 160]);
        this.type = 'BLOCK';
        this.grounded = false;
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.fill(this.color);
        p.stroke(50);
        p.strokeWeight(2);
        p.rect(0, 0, this.width, this.height, 2);
        
        // Detail
        p.noFill();
        p.stroke(100);
        p.rect(5, 5, this.width-10, this.height-10);
        p.line(0, 0, 5, 5);
        p.line(this.width, 0, this.width-5, 5);
        p.line(0, this.height, 5, this.height-5);
        p.line(this.width, this.height, this.width-5, this.height-5);
        
        p.pop();
    }
}

/**
 * Key (Collectible)
 */
export class Key extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20, COLORS.KEY);
        this.isStatic = true;
        this.type = 'KEY';
        this.collected = false;
        this.bobOffset = 0;
        this.baseY = y;
    }

    update(p) {
        this.bobOffset = Math.sin(p.frameCount * 0.1) * 5;
        this.y = this.baseY + this.bobOffset;
    }
    
    render(p) {
        if (this.collected) return;
        
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Glow
        p.noStroke();
        p.fill(255, 215, 0, 100 + Math.sin(p.frameCount * 0.2) * 50);
        p.circle(0, 0, 30);
        
        // Key Shape
        p.fill(COLORS.KEY);
        p.stroke(200, 150, 0);
        p.strokeWeight(2);
        
        // Head
        p.circle(0, -5, 12);
        p.noFill();
        p.circle(0, -5, 4); // Hole
        
        // Shaft
        p.fill(COLORS.KEY);
        p.rect(-3, 0, 6, 15);
        
        // Teeth
        p.rect(3, 10, 5, 4);
        p.rect(3, 5, 3, 4);
        
        p.pop();
    }
}

/**
 * Door (Goal)
 */
export class Door extends Entity {
    constructor(x, y) {
        super(x, y, 60, 80, COLORS.DOOR_LOCKED);
        this.isStatic = true;
        this.type = 'DOOR';
        this.open = false;
        this.pctOpen = 0;
    }

    update() {
        if (this.open && this.pctOpen < 1) {
            this.pctOpen += 0.05;
        } else if (!this.open && this.pctOpen > 0) {
            this.pctOpen -= 0.05;
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Frame
        p.fill(60);
        p.rect(-5, -5, this.width + 10, this.height + 5);
        
        // Background (Interior)
        p.fill(20);
        p.rect(0, 0, this.width, this.height);
        
        // Door panel
        const doorColor = this.open ? COLORS.DOOR_UNLOCKED : COLORS.DOOR_LOCKED;
        p.fill(doorColor);
        
        // Slide up if open
        const slideH = this.pctOpen * (this.height - 5);
        p.rect(0, 0 - slideH, this.width, this.height);
        
        // Knob
        if (!this.open) {
            p.fill(255, 200, 0);
            p.circle(this.width - 10, this.height / 2, 6);
        }
        
        p.pop();
    }
}