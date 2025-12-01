import { gameState, GRAVITY, MOVE_SPEED, JUMP_FORCE, TERMINAL_VELOCITY, CANVAS_HEIGHT, CANVAS_WIDTH, LEVEL_LENGTH } from './globals.js';
import { checkPlatformCollisions, checkEnemyCollisions, checkCollectibleCollisions } from './physics.js';
import { createExplosion } from './particles.js';

export class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.markedForDeletion = false;
    }

    update() {}
    render(p) {}
}

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 30, 40);
        this.onGround = false;
        this.isDead = false;
        this.runSpeed = MOVE_SPEED;
        this.jumpTimer = 0; // For variable jump height
    }

    update(p) {
        if (this.isDead) {
            // Death animation logic
            this.vy += GRAVITY;
            this.y += this.vy;
            return;
        }

        // Apply input forces (handled in game.js/input.js, but logic applied here)
        // Auto run
        this.vx = this.runSpeed;
        
        // Fast fall logic
        if (gameState.keys[40]) { // Down arrow
            this.vy += 0.5;
        }

        // Apply Gravity
        this.vy += GRAVITY;
        this.vy = Math.min(this.vy, TERMINAL_VELOCITY);

        // Apply Velocity X
        this.x += this.vx;

        // Apply Velocity Y
        this.y += this.vy;

        // Check Collisions
        this.onGround = checkPlatformCollisions(this);

        // Check Enemy Collisions
        if (checkEnemyCollisions(this)) {
            this.die();
        }

        // Check Collectibles
        checkCollectibleCollisions(this);

        // Check Void (Fall off map)
        if (this.y > CANVAS_HEIGHT + 200) {
            this.die();
        }
        
        // Check Win
        if (this.x >= LEVEL_LENGTH) {
            gameState.gamePhase = "GAME_OVER_WIN";
            gameState.score += 1000;
        }

        // Update distance
        gameState.distanceTraveled = Math.floor(this.x);
    }

    jump() {
        if (this.onGround) {
            this.vy = JUMP_FORCE;
            this.onGround = false;
            // Spawn jump particles
            createExplosion(this.x + this.width/2, this.y + this.height, 5, [255, 255, 255]);
        }
    }
    
    stopJump() {
        // Variable jump height: if button released, cut upward velocity
        if (this.vy < -3) {
            this.vy = -3;
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.vy = -8; // Hop up before falling
        // Turn off collisions for falling off screen
        gameState.gamePhase = "GAME_OVER_LOSE";
    }

    render(p) {
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Rotation effect when jumping
        if (!this.onGround && !this.isDead) {
           // p.rotate(p.frameCount * 0.1); 
        }

        if (this.isDead) {
            p.fill(150);
            p.rotate(p.PI); // Upside down
        } else {
            p.fill(255, 0, 0); // Mario Red
        }
        
        // Draw Body (Overalls)
        p.noStroke();
        p.rectMode(p.CENTER);
        p.fill(0, 0, 200); // Blue overalls
        p.rect(0, 5, 20, 20);
        
        // Draw Head
        p.fill(255, 200, 150); // Skin
        p.circle(0, -10, 24);
        
        // Hat
        p.fill(255, 0, 0);
        p.arc(0, -14, 26, 20, p.PI, 0);
        p.rect(0, -14, 26, 4); // Hat brim
        
        // Legs (animation)
        p.fill(0, 0, 200);
        if (this.onGround && !this.isDead) {
            // Run cycle
            const legOffset = p.sin(p.frameCount * 0.4) * 10;
            p.rect(-8, 18, 8, 10 + legOffset);
            p.rect(8, 18, 8, 10 - legOffset);
        } else {
            // Jump pose
            p.rect(-8, 18, 8, 10);
            p.rect(8, 15, 8, 8);
        }

        p.pop();
    }
}

export class Platform extends Entity {
    constructor(x, y, width, height, type = "normal") {
        super(x, y, width, height);
        this.type = type; // normal, brick, block, pipe
    }

    render(p) {
        p.push();
        if (this.type === "pipe") {
            p.fill(0, 180, 0);
            p.stroke(0, 100, 0);
            p.strokeWeight(2);
            p.rect(this.x, this.y, this.width, this.height);
            // Pipe Top details
            p.rect(this.x - 4, this.y, this.width + 8, 30);
        } else if (this.type === "block") {
            // Question block
            p.fill(255, 215, 0); // Gold
            p.stroke(184, 134, 11);
            p.strokeWeight(2);
            p.rect(this.x, this.y, this.width, this.height);
            // Question mark
            p.fill(184, 134, 11);
            p.noStroke();
            p.textSize(20);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("?", this.x + this.width/2, this.y + this.height/2);
        } else if (this.type === "brick") {
             p.fill(139, 69, 19); // Brown
             p.stroke(0);
             p.rect(this.x, this.y, this.width, this.height);
             // Brick pattern
             p.stroke(100, 50, 10);
             p.line(this.x, this.y + this.height/2, this.x + this.width, this.y + this.height/2);
             p.line(this.x + this.width/2, this.y, this.x + this.width/2, this.y + this.height/2);
        } else {
            // Ground / Normal
            p.fill(139, 69, 19); // Dirt brown
            p.noStroke();
            p.rect(this.x, this.y, this.width, this.height);
            // Grass top
            p.fill(34, 139, 34);
            p.rect(this.x, this.y, this.width, 15);
        }
        p.pop();
    }
}

export class Enemy extends Entity {
    constructor(x, y) {
        super(x, y, 30, 30);
        this.vx = -1; // Move left slowly
        this.squashed = false;
        this.squashTimer = 0;
    }

    update() {
        if (this.squashed) {
            this.squashTimer++;
            if (this.squashTimer > 30) this.markedForDeletion = true;
            return;
        }

        this.x += this.vx;
        this.y += this.vy;
        this.vy += GRAVITY;

        // Simple ground collision for enemy
        let onGround = false;
        for (let plat of gameState.platforms) {
            if (checkAABB(this, plat)) {
                 if (this.y + this.height - this.vy <= plat.y + 10) { // Coming from top
                    this.y = plat.y - this.height;
                    this.vy = 0;
                    onGround = true;
                 } else {
                     // Hit wall turn around
                     this.vx *= -1;
                 }
            }
        }
    }

    die() {
        this.squashed = true;
        this.vx = 0;
        createExplosion(this.x + this.width/2, this.y + this.height/2, 8, [150, 50, 50]);
    }

    render(p) {
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        
        if (this.squashed) {
            p.scale(1, 0.2); // Flatten
            p.translate(0, 30);
        }

        // Goomba-like body
        p.fill(139, 69, 19);
        p.noStroke();
        // Triangle/mush shape
        p.arc(0, 5, 30, 35, p.PI, 0);
        p.rectMode(p.CENTER);
        p.rect(0, 10, 20, 10);
        
        // Feet
        p.fill(0);
        const waddle = this.squashed ? 0 : p.sin(p.frameCount * 0.3) * 5;
        p.ellipse(-10 + waddle, 15, 12, 10);
        p.ellipse(10 - waddle, 15, 12, 10);

        // Eyes
        p.fill(255);
        p.circle(-6, 0, 8);
        p.circle(6, 0, 8);
        p.fill(0);
        p.circle(-6, 0, 3);
        p.circle(6, 0, 3);

        p.pop();
    }
}

export class Coin extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20);
        this.bobOffset = 0;
    }

    collect() {
        this.markedForDeletion = true;
        gameState.score += 50;
        gameState.coins += 1;
        createExplosion(this.x + 10, this.y + 10, 6, [255, 215, 0]);
    }

    render(p) {
        this.bobOffset = p.sin(p.frameCount * 0.1) * 3;
        
        p.push();
        p.translate(this.x + 10, this.y + 10 + this.bobOffset);
        // Spin effect
        const scaleX = Math.abs(p.sin(p.frameCount * 0.1));
        p.scale(scaleX, 1);
        
        p.fill(255, 215, 0);
        p.stroke(200, 150, 0);
        p.strokeWeight(2);
        p.ellipse(0, 0, 18, 22);
        
        p.fill(200, 150, 0);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(0, 0, 4, 12);
        p.pop();
    }
}

export class Flagpole extends Entity {
    constructor(x, y) {
        super(x, y, 20, 300);
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Pole
        p.fill(100);
        p.rect(0, 0, 10, 300);
        
        // Ball top
        p.fill(255, 215, 0);
        p.circle(5, 0, 20);
        
        // Flag
        p.fill(255, 0, 0);
        p.triangle(10, 20, 60, 40, 10, 60);
        
        // Base
        p.fill(50, 100, 50); // Green block
        p.rect(-20, 280, 50, 20);
        
        p.pop();
    }
}