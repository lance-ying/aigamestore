import { TILE_SIZE, GRAVITY, TERMINAL_VELOCITY, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, gameState } from './globals.js';
import { checkAABB, isOnScreen, randomRange } from './utils.js';
import { resolveEntityMapCollision } from './physics.js';
import { createParticleExplosion } from './particles.js';

class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.vx = 0;
        this.vy = 0;
        this.markedForDeletion = false;
    }

    update(p) {}
    render(p) {}
}

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 24, 36);
        this.speed = 5;
        this.jumpForce = -11;
        this.onGround = false;
        this.facing = 1; // 1 Right, -1 Left
        this.health = 3;
        this.maxHealth = 3;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.cooldown = 0;
        
        // Animation
        this.animTimer = 0;
        this.frameIndex = 0;
    }

    update(p) {
        // Physics
        this.vy += GRAVITY;
        if (this.vy > TERMINAL_VELOCITY) this.vy = TERMINAL_VELOCITY;

        // Friction / Movement applied by Input, here just drag
        this.vx *= 0.85; 
        if (Math.abs(this.vx) < 0.1) this.vx = 0;

        resolveEntityMapCollision(this);
        
        // Check Pit Death
        if (this.y > CANVAS_HEIGHT + TILE_SIZE * 2) {
            this.die();
        }

        // Invincibility
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }
        
        // Cooldown for shooting
        if (this.cooldown > 0) this.cooldown--;
        
        // Animation state
        this.animTimer++;
    }

    jump() {
        if (this.onGround) {
            this.vy = this.jumpForce;
            this.onGround = false;
        }
    }
    
    shoot() {
        if (this.cooldown <= 0) {
            const px = this.facing === 1 ? this.x + this.width : this.x - 10;
            const py = this.y + this.height / 2;
            new Projectile(px, py, this.facing);
            this.cooldown = 20;
        }
    }

    takeDamage(amount) {
        if (this.invincible) return;
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        } else {
            this.invincible = true;
            this.invincibleTimer = 60;
            // Knockback
            this.vy = -5;
            this.vx = -this.facing * 5;
        }
    }
    
    heal() {
        if (this.health < this.maxHealth) this.health++;
    }

    die() {
        gameState.gamePhase = "GAME_OVER_LOSE";
    }

    render(p) {
        // Blink if invincible
        if (this.invincible && Math.floor(p.frameCount / 4) % 2 === 0) return;

        p.push();
        p.translate(this.x + this.width / 2, this.y + this.height / 2);
        p.scale(this.facing, 1);

        // Draw Lep
        // Body
        p.fill(COLORS.LEP_SUIT);
        p.noStroke();
        p.rect(-10, -8, 20, 26, 4); 
        
        // Head
        p.fill(COLORS.LEP_SKIN);
        p.circle(0, -12, 22);
        
        // Beard
        p.fill(220, 100, 0); // Orange
        p.arc(0, -12, 22, 22, 0, p.PI);
        
        // Hat
        p.fill(COLORS.LEP_HAT);
        p.rect(-14, -28, 28, 8); // Brim
        p.rect(-10, -42, 20, 16); // Top
        p.fill(0); // Band
        p.rect(-10, -32, 20, 4);
        p.fill(255, 215, 0); // Buckle
        p.rect(-3, -32, 6, 4);

        // Legs/Boots (Animation)
        p.fill(0);
        if (Math.abs(this.vx) > 0.5) {
             // Running
             const offset = Math.sin(this.animTimer * 0.5) * 5;
             p.rect(-8 + offset, 16, 6, 6);
             p.rect(2 - offset, 16, 6, 6);
        } else {
             // Standing
             p.rect(-8, 16, 6, 6);
             p.rect(2, 16, 6, 6);
        }

        p.pop();
    }
    
    onHeadHit(tileObj) {
        if (tileObj && tileObj.type === 2) { // Brick
            // Maybe break?
        } else if (tileObj && tileObj.type === 3) { // Question Block
            if (tileObj.active) {
                tileObj.active = false; // Deactivate
                // Spawn clover or coin
                if (Math.random() > 0.7) {
                    new Collectible(tileObj.x * TILE_SIZE, (tileObj.y - 1) * TILE_SIZE, 'CLOVER');
                } else {
                    gameState.score += 50;
                    // Visual effect for coin pop
                    createParticleExplosion(tileObj.x * TILE_SIZE + TILE_SIZE/2, tileObj.y * TILE_SIZE, COLORS.GOLD);
                }
            }
        }
    }
}

export class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y, 30, 30);
        this.type = type; // 'SNAIL', 'BEE'
        this.speed = type === 'BEE' ? 1.5 : 1;
        this.vx = -this.speed;
        this.patrolStart = x;
        this.patrolDist = 100;
        
        gameState.enemies.push(this);
        gameState.entities.push(this);
    }

    update(p) {
        if (!isOnScreen(this.x, this.y, this.width, this.height)) return;

        if (this.type === 'SNAIL') {
            this.vy += GRAVITY;
            resolveEntityMapCollision(this);
            
            // Patrol turn around
            if (this.vx === 0) this.vx = -this.vx || this.speed; // Hit wall
            
            // Edge detection
            // Check tile ahead and below
            const lookAheadX = this.vx > 0 ? this.x + this.width + 5 : this.x - 5;
            const lookAheadY = this.y + this.height + 5;
            // Simply turn around if logic fails or simple timer
            if (p.frameCount % 200 === 0) this.vx *= -1;
            
        } else if (this.type === 'BEE') {
            // Flying sin wave
            this.x += this.vx;
            this.y = this.y + Math.sin(p.frameCount * 0.1) * 2;
            if (p.frameCount % 180 === 0) this.vx *= -1;
        }
        
        // Player Collision
        const player = gameState.player;
        if (player && checkAABB(this, player)) {
            // Check if player jumped on top
            const hitFromAbove = player.vy > 0 && player.y + player.height - player.vy <= this.y + this.height * 0.5;
            
            if (hitFromAbove) {
                this.die();
                player.vy = -6; // Bounce
                gameState.score += 100;
            } else {
                player.takeDamage(1);
            }
        }
    }

    die() {
        this.markedForDeletion = true;
        createParticleExplosion(this.x + this.width/2, this.y + this.height/2, [100, 100, 100]);
    }

    render(p) {
        if (!isOnScreen(this.x, this.y, this.width, this.height)) return;
        
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        if (this.vx > 0) p.scale(-1, 1);
        
        if (this.type === 'SNAIL') {
            p.fill(200, 100, 200); // Shell
            p.arc(0, 5, 26, 26, p.PI, 0);
            p.fill(100, 200, 100); // Body
            p.rect(-15, 5, 30, 10, 5);
            // Eyes
            p.fill(255);
            p.circle(-10, -5, 8);
            p.circle(5, -5, 8);
            p.fill(0);
            p.circle(-10, -5, 3);
            p.circle(5, -5, 3);
        } else {
            // BEE
            p.fill(255, 255, 0);
            p.ellipse(0, 0, 30, 20); // Body
            p.fill(0);
            p.rect(-5, -10, 5, 20); // Stripe
            p.rect(5, -10, 5, 20); // Stripe
            p.fill(200, 255, 255, 150); // Wings
            p.ellipse(0, -12, 20, 15);
        }
        p.pop();
    }
}

export class Collectible extends Entity {
    constructor(x, y, type) {
        super(x, y, 20, 20);
        this.type = type; // 'COIN', 'CLOVER', 'POT'
        this.baseY = y;
        this.bobOffset = randomRange({random: Math.random}, 0, 6);
        
        gameState.collectibles.push(this);
        gameState.entities.push(this);
    }

    update(p) {
        // Bobbing animation
        this.y = this.baseY + Math.sin(p.frameCount * 0.1 + this.bobOffset) * 5;
        
        const player = gameState.player;
        if (player && checkAABB(this, player)) {
            if (this.type === 'COIN') {
                gameState.score += 10;
            } else if (this.type === 'CLOVER') {
                player.heal();
                gameState.score += 20;
            } else if (this.type === 'POT') {
                gameState.score += 1000;
                gameState.gamePhase = "GAME_OVER_WIN";
            }
            this.markedForDeletion = true;
        }
    }

    render(p) {
        if (!isOnScreen(this.x, this.y, this.width, this.height)) return;

        const cx = this.x + this.width/2;
        const cy = this.y + this.height/2;

        if (this.type === 'COIN') {
            p.fill(COLORS.GOLD);
            p.stroke(200, 180, 0);
            p.strokeWeight(2);
            p.circle(cx, cy, 16);
            p.noStroke();
            p.fill(255, 255, 200);
            p.textSize(10);
            p.text("$", cx, cy);
        } else if (this.type === 'CLOVER') {
            p.fill(0, 200, 0);
            p.noStroke();
            p.push();
            p.translate(cx, cy);
            for(let i=0; i<4; i++) {
                p.rotate(p.PI/2);
                p.ellipse(0, -5, 10, 10);
            }
            p.pop();
        } else if (this.type === 'POT') {
            p.fill(0);
            p.arc(cx, cy + 5, 30, 25, 0, p.PI); // Pot
            p.fill(COLORS.GOLD);
            p.ellipse(cx, cy, 25, 10); // Gold pile
            
            // Rainbow logic handled in particle system or just simple rects behind
        }
    }
}

export class Projectile extends Entity {
    constructor(x, y, dir) {
        super(x, y, 10, 10);
        this.vx = dir * 8;
        this.life = 60;
        gameState.projectiles.push(this);
        gameState.entities.push(this);
    }

    update(p) {
        this.x += this.vx;
        this.life--;
        if (this.life <= 0) this.markedForDeletion = true;

        // Enemy collision
        gameState.enemies.forEach(enemy => {
            if (checkAABB(this, enemy)) {
                enemy.die();
                this.markedForDeletion = true;
                gameState.score += 50;
            }
        });
        
        // Wall collision (simple)
        if (checkTileCollision(this, this.x, this.y) === "WALL" || checkTileCollision(this, this.x, this.y)?.type === "SOLID") {
             this.markedForDeletion = true;
        }
    }

    render(p) {
        p.fill(100, 50, 0); // Pinecone color
        p.ellipse(this.x + 5, this.y + 5, 10, 10);
    }
}