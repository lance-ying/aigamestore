// entities.js - Game Objects
import { gameState, FRICTION, MOVE_SPEED, JUMP_FORCE, BOMB_FUSE_TIME, BOMB_BLAST_RADIUS, BOMB_FORCE, GRAVITY, TILE_SIZE, AIR_RESISTANCE } from './globals.js';
import { updateEntityPhysics, checkExplosion, checkAABB } from './physics.js';
import { particleSystem } from './particles.js';

export class Entity {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // "PLAYER", "PLATFORM", "BLOCK", "BOMB", "COLLECTIBLE", "HAZARD", "GOAL"
        this.vx = 0;
        this.vy = 0;
        this.active = true;
    }
    
    update() {
        // Base update
    }

    render(p) {
        // Base render
    }
}

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 24, 24, "PLAYER");
        this.color = [100, 255, 100];
        this.onGround = false;
        this.facing = 1; // 1 Right, -1 Left
        this.isDead = false;
        
        // Caterpillar tail segments
        this.tail = [];
        this.tailLength = 4;
        for(let i=0; i<this.tailLength; i++) {
            this.tail.push({x: x, y: y});
        }
        
        this.bombCooldown = 0;
    }

    update(p) {
        if (this.isDead) return;

        // Decrease cooldowns
        if (this.bombCooldown > 0) this.bombCooldown--;

        // Tail logic (follow head)
        // Store current head pos history slightly delayed or spring interp would be better
        // Simple follow:
        let targetX = this.x;
        let targetY = this.y;
        
        for (let i = 0; i < this.tail.length; i++) {
            let seg = this.tail[i];
            let dx = targetX - seg.x;
            let dy = targetY - seg.y;
            let dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist > 10) { // Spacing
                seg.x += dx * 0.2;
                seg.y += dy * 0.2;
            }
            // Update target for next segment
            targetX = seg.x;
            targetY = seg.y;
        }

        // Apply friction
        this.vx *= this.onGround ? FRICTION : AIR_RESISTANCE;

        // Physics Update
        updateEntityPhysics(this);

        // Interaction with Collectibles
        for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
            let c = gameState.collectibles[i];
            if (checkAABB(this, c)) {
                c.collect();
            }
        }

        // Interaction with Hazards
        for (let h of gameState.hazards) {
            // Precise hitbox for spikes (usually smaller than tile)
            let hitbox = { x: h.x + 5, y: h.y + 10, width: h.width - 10, height: h.height - 10};
            if (checkAABB(this, hitbox)) {
                this.die();
            }
        }

        // Interaction with Goal
        if (gameState.goal && checkAABB(this, gameState.goal)) {
            gameState.gamePhase = "GAME_OVER_WIN";
        }

        // Log Position
        if (p.frameCount % 60 === 0) {
            p.logs.player_info.push({
                x: this.x,
                y: this.y,
                vx: this.vx,
                vy: this.vy,
                timestamp: Date.now()
            });
        }
    }

    placeBomb() {
        if (this.bombCooldown > 0) return;
        
        const bombX = this.x + this.width/2 - 10;
        const bombY = this.y + this.height/2 - 10;
        const bomb = new Bomb(bombX, bombY);
        gameState.bombs.push(bomb);
        
        this.bombCooldown = 30; // Half second cooldown
    }

    jump() {
        if (this.onGround) {
            this.vy = JUMP_FORCE;
            this.onGround = false;
        }
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;
        particleSystem.createExplosion(this.x, this.y, 30);
        setTimeout(() => {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }, 1000);
    }

    render(p) {
        if (this.isDead) return;

        // Draw Tail
        p.fill(50, 200, 50);
        p.stroke(30, 100, 30);
        p.strokeWeight(1);
        
        for(let i = this.tail.length-1; i >= 0; i--) {
            let seg = this.tail[i];
            let size = 18 - i * 2; // Tapering
            p.circle(seg.x + this.width/2, seg.y + this.height/2, size);
        }

        // Draw Head
        p.fill(100, 255, 100);
        p.circle(this.x + this.width/2, this.y + this.height/2, 24);
        
        // Face
        p.fill(0);
        // Eyes
        let eyeOffsetX = this.facing * 5;
        p.circle(this.x + this.width/2 + eyeOffsetX + 3, this.y + 10, 4);
        p.circle(this.x + this.width/2 + eyeOffsetX - 3, this.y + 10, 4);
        
        // Antennae
        p.stroke(100, 255, 100);
        p.strokeWeight(2);
        p.line(this.x + this.width/2, this.y + 5, this.x + this.width/2 + 5, this.y - 5);
        p.line(this.x + this.width/2, this.y + 5, this.x + this.width/2 - 5, this.y - 5);
    }
}

export class Bomb extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20, "BOMB");
        this.timer = BOMB_FUSE_TIME;
        this.fuseColor = 0;
    }

    update() {
        this.timer--;
        
        // Physics for bomb (falls)
        updateEntityPhysics(this);
        // Apply significant friction so it doesn't slide forever
        this.vx *= 0.8; 

        if (this.timer <= 0) {
            this.explode();
        }
    }

    explode() {
        this.active = false;
        // Visuals
        particleSystem.createExplosion(this.x + this.width/2, this.y + this.height/2);
        
        // Logic
        checkExplosion(this.x + this.width/2, this.y + this.height/2, BOMB_BLAST_RADIUS, BOMB_FORCE);
    }

    render(p) {
        const pulse = Math.abs(Math.sin(p.frameCount * 0.2)) * 5;
        
        // Flash red near explosion
        if (this.timer < 30 && (Math.floor(this.timer / 4) % 2 === 0)) {
            p.fill(255, 0, 0);
        } else {
            p.fill(50);
        }
        
        p.stroke(0);
        p.strokeWeight(1);
        p.circle(this.x + 10, this.y + 10, 20 + pulse);
        
        // Fuse spark
        p.stroke(255, 200, 0);
        p.strokeWeight(2);
        p.line(this.x + 10, this.y, this.x + 10, this.y - 8);
        
        if (Math.random() > 0.5) {
            particleSystem.createSparkles(this.x + 10, this.y - 8);
        }
    }
}

export class Platform extends Entity {
    constructor(x, y, w, h) {
        super(x, y, w, h, "PLATFORM");
    }

    render(p) {
        // Tiled rendering
        p.fill(40, 30, 50); // Dark purple/brown soil
        p.stroke(60, 50, 70);
        p.strokeWeight(1);
        p.rect(this.x, this.y, this.width, this.height);
        
        // Grass top
        p.fill(50, 100, 60);
        p.noStroke();
        p.rect(this.x, this.y, this.width, 5);
    }
}

export class DestructibleBlock extends Entity {
    constructor(x, y) {
        super(x, y, TILE_SIZE, TILE_SIZE, "BLOCK");
    }

    destroy() {
        if (!this.active) return;
        this.active = false;
        particleSystem.createBlockDebris(this.x, this.y);
    }

    render(p) {
        p.fill(120, 100, 80); // Cracked stone/wood color
        p.stroke(0);
        p.strokeWeight(2);
        p.rect(this.x, this.y, this.width, this.height);
        
        // Cracks
        p.stroke(60, 40, 20);
        p.line(this.x + 5, this.y + 5, this.x + 20, this.y + 20);
        p.line(this.x + 35, this.y + 5, this.x + 20, this.y + 20);
    }
}

export class Collectible extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20, "COLLECTIBLE");
        this.baseY = y;
        this.offset = Math.random() * Math.PI * 2;
    }

    update() {
        // Bobbing motion
        this.y = this.baseY + Math.sin(gameState.frameCount * 0.05 + this.offset) * 5;
    }

    collect() {
        if (!this.active) return;
        this.active = false;
        gameState.score += 100;
        particleSystem.createSparkles(this.x + 10, this.y + 10);
    }

    render(p) {
        p.push();
        p.translate(this.x + 10, this.y + 10);
        p.rotate(gameState.frameCount * 0.05);
        p.fill(255, 255, 100);
        p.noStroke();
        // Draw star
        p.beginShape();
        for (let i = 0; i < 5; i++) {
            let angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            let r1 = 10;
            let r2 = 5;
            p.vertex(Math.cos(angle) * r1, Math.sin(angle) * r1);
            angle += (Math.PI * 2) / 10;
            p.vertex(Math.cos(angle) * r2, Math.sin(angle) * r2);
        }
        p.endShape(p.CLOSE);
        p.pop();
    }
}

export class Hazard extends Entity {
    constructor(x, y, w, h) {
        super(x, y, w, h, "HAZARD");
    }
    
    render(p) {
        // Spikes
        p.fill(200, 50, 50);
        p.noStroke();
        
        const spikeWidth = 10;
        const spikeCount = this.width / spikeWidth;
        
        for(let i=0; i<spikeCount; i++) {
            p.triangle(
                this.x + i * spikeWidth, this.y + this.height,
                this.x + i * spikeWidth + spikeWidth/2, this.y,
                this.x + (i+1) * spikeWidth, this.y + this.height
            );
        }
    }
}

export class Goal extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40, "GOAL");
    }

    render(p) {
        // Golden Leaf
        p.push();
        p.translate(this.x + 20, this.y + 20);
        // Glow
        p.noStroke();
        p.fill(255, 215, 0, 100 + Math.sin(gameState.frameCount * 0.1) * 50);
        p.circle(0, 0, 60);
        
        // Leaf shape
        p.fill(255, 215, 0);
        p.rotate(Math.sin(gameState.frameCount * 0.02) * 0.2);
        p.ellipse(0, 0, 30, 50);
        p.stroke(200, 150, 0);
        p.strokeWeight(2);
        p.line(0, -20, 0, 20); // Vein
        p.pop();
    }
}