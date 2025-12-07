/**
 * Game entities: Player, Enemies, Items, Terrain
 */
import { 
    gameState, CANVAS_WIDTH, CANVAS_HEIGHT, 
    GRAVITY, FRICTION, AIR_RESISTANCE, JUMP_FORCE, MOVE_SPEED, WALL_SLIDE_SPEED, WALL_JUMP_FORCE,
    COLORS
} from './globals.js';
import { resolveMapCollision, checkAABB } from './physics.js';
import { spawnJumpDust, spawnCollectEffect } from './particles.js';

// Base Entity
class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.vx = 0;
        this.vy = 0;
        this.active = true;
    }
    
    update(p) {}
    render(p) {}
}

// Player Character
export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 24, 24);
        this.color = COLORS.player;
        this.onGround = false;
        this.onWall = false;
        this.wallSide = 0; // -1 left, 1 right
        this.jumpsLeft = 2;
        this.facing = 1;
        this.invincible = 0;
        this.flashTimer = 0;
    }

    update(p) {
        if (this.invincible > 0) this.invincible--;

        // Apply Physics
        this.vy += GRAVITY;
        this.vx *= this.onGround ? FRICTION : AIR_RESISTANCE;

        // Wall sliding
        if (this.onWall && this.vy > 0) {
            this.vy = Math.min(this.vy, WALL_SLIDE_SPEED);
            this.jumpsLeft = 2; // Reset jumps on wall
        }

        // Apply Velocity
        this.x += this.vx;
        this.y += this.vy;

        // World Bounds (Horizontal)
        if (this.x < 0) { this.x = 0; this.vx = 0; }
        if (this.x + this.width > CANVAS_WIDTH) { this.x = CANVAS_WIDTH - this.width; this.vx = 0; }
        
        // Death at bottom of world (fallback)
        if (this.y > gameState.worldHeight + 100) {
            this.die();
        }

        // Resolve Collision with Level
        resolveMapCollision(this, gameState.walls);

        // Reset jumps on ground
        if (this.onGround) {
            this.jumpsLeft = 2;
        }

        // Check Interactions
        this.checkHazards();
        this.checkCollectibles();
        this.checkCheckpoints();
        
        // Update Log
        if (p.frameCount % 60 === 0) {
            p.logs.player_info.push({
                x: this.x, y: this.y, 
                vx: this.vx, vy: this.vy, 
                jumps: this.jumpsLeft,
                lives: gameState.lives
            });
        }
    }
    
    move(dir) {
        this.vx += dir * 1.5; // Acceleration
        const maxSpeed = MOVE_SPEED;
        this.vx = Math.max(Math.min(this.vx, maxSpeed), -maxSpeed);
        if (dir !== 0) this.facing = dir;
    }

    jump() {
        if (this.onWall && !this.onGround) {
            // Wall Jump
            this.vy = WALL_JUMP_FORCE.y;
            this.vx = this.wallSide === 1 ? -WALL_JUMP_FORCE.x : WALL_JUMP_FORCE.x;
            this.jumpsLeft = 1; // Consume one jump
            spawnJumpDust(this.x + this.width/2, this.y + this.height);
        } else if (this.jumpsLeft > 0) {
            // Normal / Double Jump
            this.vy = JUMP_FORCE;
            this.jumpsLeft--;
            spawnJumpDust(this.x + this.width/2, this.y + this.height);
        }
    }
    
    checkHazards() {
        if (this.invincible > 0) return;

        // Spikes
        for (let spike of gameState.hazards) {
            if (checkAABB(this, spike)) {
                this.die();
                return;
            }
        }
        
        // Enemies
        for (let enemy of gameState.enemies) {
            if (checkAABB(this, enemy)) {
                // Mario style goomba stomp? No, Leap Day is one-hit death usually.
                this.die();
                return;
            }
        }
    }
    
    checkCollectibles() {
        for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
            let item = gameState.collectibles[i];
            if (item.active && checkAABB(this, item)) {
                item.collect();
            }
        }
    }

    checkCheckpoints() {
        for (let cp of gameState.checkpoints) {
            if (!cp.triggered && checkAABB(this, cp)) {
                cp.trigger();
            }
        }
    }

    die() {
        gameState.lives--;
        spawnCollectEffect(this.x, this.y); // Death poof
        
        if (gameState.lives <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        } else {
            this.respawn();
        }
    }

    respawn() {
        this.vx = 0;
        this.vy = 0;
        this.invincible = 60; // 1 second invulnerability
        
        if (gameState.currentCheckpoint) {
            this.x = gameState.currentCheckpoint.x;
            this.y = gameState.currentCheckpoint.y;
        } else {
            // Default start
            this.x = CANVAS_WIDTH / 2 - 12;
            this.y = gameState.worldHeight - 100;
        }
    }

    render(p) {
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Squash and stretch
        let stretchX = 1;
        let stretchY = 1;
        if (Math.abs(this.vy) > 1) { stretchX = 0.8; stretchY = 1.2; }
        if (Math.abs(this.vx) > 1) { stretchX = 1.1; stretchY = 0.9; }
        
        p.scale(stretchX * this.facing, stretchY);
        
        // Flash if invincible
        if (this.invincible > 0 && Math.floor(p.frameCount / 4) % 2 === 0) {
            p.fill(255);
        } else {
            p.fill(this.color);
        }
        
        p.stroke(COLORS.playerOutline);
        p.strokeWeight(2);
        
        // Body
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.width, this.height, 5);
        
        // Eyes
        p.fill(255);
        p.noStroke();
        p.circle(4, -4, 6);
        p.circle(4, -4, 6); // Cyclops or side view? Side view one eye visible usually, let's do two
        p.circle(-2, -4, 6); // Actually side view usually shows two eyes on same side in cartoons
        
        p.fill(0);
        p.circle(5, -4, 2);
        p.circle(-1, -4, 2);
        
        p.pop();
    }
}

// Static Wall/Block
export class Wall extends Entity {
    constructor(x, y, w, h) {
        super(x, y, w, h);
    }

    render(p) {
        // Only render if on screen
        if (this.y > gameState.cameraY + CANVAS_HEIGHT || this.y + this.height < gameState.cameraY) return;

        p.push();
        p.fill(COLORS.wall);
        p.stroke(40);
        p.strokeWeight(1);
        p.rect(this.x, this.y, this.width, this.height);
        
        // Grass top
        p.fill(COLORS.wallTop);
        p.noStroke();
        p.rect(this.x, this.y, this.width, 6);
        p.pop();
    }
}

// Deadly Spike
export class Spike extends Entity {
    constructor(x, y, w) {
        super(x, y, w, w); // Square area but triangular visual
        this.realH = w;
    }

    render(p) {
        if (this.y > gameState.cameraY + CANVAS_HEIGHT || this.y + this.height < gameState.cameraY) return;

        p.push();
        p.fill(COLORS.spike);
        p.noStroke();
        
        // Draw multiple triangles if wide
        const spikes = Math.floor(this.width / 20);
        const w = this.width / spikes;
        
        for (let i = 0; i < spikes; i++) {
            const bx = this.x + i * w;
            const by = this.y + this.height;
            p.triangle(bx, by, bx + w/2, by - this.height, bx + w, by);
        }
        p.pop();
    }
}

// Moving Enemy
export class Enemy extends Entity {
    constructor(x, y, patrolWidth) {
        super(x, y, 30, 30);
        this.startX = x;
        this.patrolWidth = patrolWidth;
        this.vx = 2;
        this.speed = 2;
    }

    update() {
        this.x += this.vx;
        
        if (this.x > this.startX + this.patrolWidth || this.x < this.startX) {
            this.vx *= -1;
        }
    }

    render(p) {
        if (this.y > gameState.cameraY + CANVAS_HEIGHT || this.y + this.height < gameState.cameraY) return;

        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        p.fill(COLORS.enemy);
        p.noStroke();
        
        // Pulsing
        const scale = 1 + Math.sin(gameState.frameCount * 0.1) * 0.1;
        p.scale(scale);
        
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.width, this.height, 5);
        
        // Eyes
        p.fill(255);
        p.rect(-6, -4, 6, 6);
        p.rect(6, -4, 6, 6);
        p.fill(0);
        p.rect(-6, -4, 2, 2);
        p.rect(6, -4, 2, 2);
        
        // Mouth
        p.fill(0);
        p.rect(0, 6, 16, 4);
        
        p.pop();
    }
}

// Collectible Fruit
export class Fruit extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20);
        this.baseY = y;
        this.oscillation = Math.random() * Math.PI * 2;
    }

    update() {
        if (!this.active) return;
        this.oscillation += 0.05;
        this.y = this.baseY + Math.sin(this.oscillation) * 5;
    }

    collect() {
        this.active = false;
        gameState.score += 50;
        spawnCollectEffect(this.x + 10, this.y + 10);
    }

    render(p) {
        if (!this.active) return;
        if (this.y > gameState.cameraY + CANVAS_HEIGHT || this.y + this.height < gameState.cameraY) return;

        p.push();
        p.translate(this.x + 10, this.y + 10);
        p.fill(COLORS.fruit);
        p.noStroke();
        p.circle(0, 0, 16);
        // Leaf
        p.fill(COLORS.wallTop);
        p.ellipse(0, -10, 8, 4);
        p.pop();
    }
}

// Checkpoint Flag
export class Checkpoint extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40);
        this.triggered = false;
    }

    trigger() {
        this.triggered = true;
        gameState.currentCheckpoint = { x: this.x + 10, y: this.y };
        spawnCollectEffect(this.x + 20, this.y);
    }

    render(p) {
        if (this.y > gameState.cameraY + CANVAS_HEIGHT || this.y + this.height < gameState.cameraY) return;

        p.push();
        p.translate(this.x, this.y);
        
        // Pole
        p.stroke(100);
        p.strokeWeight(4);
        p.line(10, 0, 10, 40);
        
        // Flag
        p.noStroke();
        p.fill(this.triggered ? COLORS.checkpointActive : COLORS.checkpoint);
        
        // Wave animation
        p.beginShape();
        p.vertex(10, 5);
        for(let i=0; i<=20; i+=5) {
            p.vertex(10 + i, 5 + Math.sin(gameState.frameCount * 0.1 + i*0.2) * 2);
        }
        p.vertex(30, 25);
        p.vertex(10, 25);
        p.endShape(p.CLOSE);
        
        p.pop();
    }
}

// Win Trophy
export class Trophy extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40);
    }
    
    update(p) {
        if (checkAABB(gameState.player, this)) {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
    }

    render(p) {
        p.push();
        p.translate(this.x + 20, this.y + 20);
        p.fill(COLORS.trophy);
        p.stroke(255);
        p.strokeWeight(2);
        
        // Cup
        p.arc(0, 0, 30, 30, 0, Math.PI, p.OPEN);
        p.rectMode(p.CENTER);
        p.rect(0, 20, 10, 10);
        p.rect(0, 28, 20, 6);
        
        // Sparkle
        if (p.frameCount % 20 < 10) {
            p.stroke(255);
            p.line(-10, -10, -15, -15);
            p.line(10, -10, 15, -15);
        }
        p.pop();
    }
}