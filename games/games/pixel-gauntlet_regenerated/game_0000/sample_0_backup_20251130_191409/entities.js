import { gameState, GRAVITY, FRICTION, CANVAS_HEIGHT } from './globals.js';
import { checkCollision, resolvePlatformCollisions } from './physics.js';

class Entity {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.type = type;
        this.markedForDeletion = false;
    }

    update(p) {}
    render(p) {}
}

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 30, 50, 'PLAYER');
        this.speed = 5;
        this.jumpPower = -12;
        this.onGround = false;
        this.facing = 1; // 1 Right, -1 Left
        this.health = 100;
        this.maxHealth = 100;
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackDuration = 15;
        this.attackCooldown = 0;
        this.invincibleTimer = 0;
    }

    update(p) {
        // Controls
        const keys = gameState.keys;
        // Support Arrows (37-40) and WASD (implicitly handled if mapped, but complying to Hard Constraints: Arrows)
        // Hard constraints: Arrow keys (37-40), Space (32), Shift (16), Z (90)
        
        let moveLeft = keys[37];
        let moveRight = keys[39];
        let jump = keys[32] || keys[38]; // Space or Up
        let attack = keys[90] || keys[16]; // Z or Shift

        // Automated Input Override
        if (gameState.controlMode !== 'HUMAN' && window.get_automated_testing_action) {
            const action = window.get_automated_testing_action(gameState);
            if (action) {
                if (action.moveLeft) moveLeft = true;
                if (action.moveRight) moveRight = true;
                if (action.jump) jump = true;
                if (action.attack) attack = true;
            }
        }

        // Horizontal Movement
        if (moveLeft) {
            this.vx = -this.speed;
            this.facing = -1;
        } else if (moveRight) {
            this.vx = this.speed;
            this.facing = 1;
        } else {
            this.vx *= FRICTION;
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }

        // Jumping
        if (jump && this.onGround) {
            this.vy = this.jumpPower;
            this.onGround = false;
        }

        // Attacking
        if (this.attackCooldown > 0) this.attackCooldown--;
        
        if (attack && !this.isAttacking && this.attackCooldown === 0) {
            this.isAttacking = true;
            this.attackTimer = this.attackDuration;
            this.attackCooldown = 30;
            
            // Create Attack Hitbox
            const reach = 40;
            const attackX = this.facing === 1 ? this.x + this.width : this.x - reach;
            const attackBox = { x: attackX, y: this.y + 10, width: reach, height: 30 };
            
            // Check Hits
            gameState.entities.forEach(entity => {
                if (entity instanceof Enemy && checkCollision(attackBox, entity)) {
                    entity.takeDamage(25); // Player damage
                    // Knockback enemy
                    entity.vx = this.facing * 5;
                    entity.vy = -3;
                    // Spawn particle
                    spawnParticles(entity.x + entity.width/2, entity.y + entity.height/2, 5, [255, 255, 255]);
                }
            });
        }

        if (this.isAttacking) {
            this.attackTimer--;
            if (this.attackTimer <= 0) {
                this.isAttacking = false;
            }
        }

        // Apply Physics
        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;

        // Platform Collisions
        resolvePlatformCollisions(this);

        // World Bounds
        if (this.x < 0) this.x = 0;
        if (this.y > CANVAS_HEIGHT + 100) { // Fell off world
            this.health = 0; 
        }

        // Invincibility
        if (this.invincibleTimer > 0) this.invincibleTimer--;

        // Check Entity Collisions (Items, Enemy Bodies)
        gameState.entities.forEach(entity => {
            if (checkCollision(this, entity)) {
                if (entity instanceof Collectible) {
                    entity.collect(this);
                } else if (entity instanceof Enemy && !entity.isDead && this.invincibleTimer === 0) {
                    // Touch damage
                    this.takeDamage(10);
                    // Knockback player
                    this.vx = (this.x < entity.x ? -1 : 1) * 8;
                    this.vy = -5;
                } else if (entity instanceof Projectile && this.invincibleTimer === 0) {
                     this.takeDamage(entity.damage);
                     entity.markedForDeletion = true;
                }
            }
        });

        // Death
        if (this.health <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.invincibleTimer = 60; // 1 second
        spawnParticles(this.x + this.width/2, this.y + this.height/2, 10, [255, 0, 0]);
        if (this.health < 0) this.health = 0;
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Blink if invincible
        if (this.invincibleTimer > 0 && Math.floor(p.frameCount / 4) % 2 === 0) {
            p.pop();
            return;
        }

        // Body
        p.fill(0, 100, 255);
        p.noStroke();
        p.rect(0, 0, this.width, this.height);

        // Eyes
        p.fill(255);
        if (this.facing === 1) {
            p.rect(20, 10, 5, 5);
            p.rect(20, 25, 5, 5); // Walking animation bob
        } else {
            p.rect(5, 10, 5, 5);
            p.rect(5, 25, 5, 5);
        }

        // Attack Visual
        if (this.isAttacking) {
            p.fill(255, 255, 0, 150);
            if (this.facing === 1) p.rect(this.width, 10, 40, 30);
            else p.rect(-40, 10, 40, 30);
        }

        p.pop();
    }
}

export class Enemy extends Entity {
    constructor(x, y, width, height, type, hp) {
        super(x, y, width, height, type);
        this.health = hp;
        this.maxHealth = hp;
        this.isDead = false;
        this.patrolStart = x - 100;
        this.patrolEnd = x + 100;
        this.direction = 1;
        this.speed = 1;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.isDead = true;
            this.markedForDeletion = true;
            
            // Score
            let points = 10;
            if (this.type === 'BAT') points = 15;
            if (this.type === 'KNIGHT') points = 50;
            if (this.type === 'BOSS') points = 200;
            gameState.score += points;

            spawnParticles(this.x + this.width/2, this.y + this.height/2, 20, [100, 100, 100]);
        }
    }

    update(p) {
        if (this.isDead) return;

        // Basic AI
        const player = gameState.player;
        const dist = Math.sqrt(Math.pow(player.x - this.x, 2) + Math.pow(player.y - this.y, 2));

        if (this.type === 'SLIME') {
            // Patrol
            this.x += this.speed * this.direction;
            if (this.x > this.patrolEnd) this.direction = -1;
            if (this.x < this.patrolStart) this.direction = 1;
            
            // Gravity
            this.vy += GRAVITY;
            this.y += this.vy;
            resolvePlatformCollisions(this);
            
        } else if (this.type === 'BAT') {
            // Fly towards player if close
            if (dist < 200) {
                this.x += (player.x - this.x) * 0.01;
                this.y += (player.y - this.y) * 0.01;
            } else {
                // Bob in place
                this.y += Math.sin(p.frameCount * 0.1);
            }
        } else if (this.type === 'KNIGHT') {
             // Slower patrol, heavy
            this.x += (this.speed * 0.5) * this.direction;
            if (this.x > this.patrolEnd) this.direction = -1;
            if (this.x < this.patrolStart) this.direction = 1;
            
            this.vy += GRAVITY;
            this.y += this.vy;
            resolvePlatformCollisions(this);
        } else if (this.type === 'BOSS') {
            // Move back and forth
            this.x += Math.sin(p.frameCount * 0.02) * 2;
            this.vy += GRAVITY;
            this.y += this.vy;
            resolvePlatformCollisions(this);
            
            // Shoot projectiles
            if (p.frameCount % 120 === 0) {
                const proj = new Projectile(this.x, this.y + 20, player.x, player.y);
                gameState.entities.push(proj);
            }
        }
    }

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        if (this.type === 'SLIME') {
            p.fill(50, 200, 50);
            const squash = Math.sin(p.frameCount * 0.2) * 5;
            p.rect(0, 10 - squash, this.width, this.height + squash);
        } else if (this.type === 'BAT') {
            p.fill(150, 50, 200);
            p.ellipse(this.width/2, this.height/2, this.width, this.height);
            // Wings
            if (Math.floor(p.frameCount / 5) % 2 === 0) {
                p.triangle(0, 10, -10, -5, 10, 10);
                p.triangle(this.width, 10, this.width + 10, -5, this.width - 10, 10);
            }
        } else if (this.type === 'KNIGHT') {
            p.fill(150);
            p.rect(0, 0, this.width, this.height);
            p.fill(50); // visor
            p.rect(5, 10, 30, 5);
        } else if (this.type === 'BOSS') {
            p.fill(200, 20, 20);
            p.rect(0, 0, this.width, this.height);
            // Angry Eyes
            p.fill(255, 255, 0);
            p.rect(10, 20, 20, 10);
            p.rect(50, 20, 20, 10);
        }
        
        // Health Bar above enemy
        if (this.health < this.maxHealth) {
            p.fill(255, 0, 0);
            p.rect(0, -10, this.width, 5);
            p.fill(0, 255, 0);
            p.rect(0, -10, this.width * (this.health / this.maxHealth), 5);
        }

        p.pop();
    }
}

export class Platform extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height, 'PLATFORM');
    }
    
    render(p) {
        p.fill(100, 80, 60); // Brownish
        p.stroke(80, 60, 40);
        p.strokeWeight(2);
        p.rect(this.x, this.y, this.width, this.height);
        
        // Grass top
        p.stroke(50, 200, 50);
        p.line(this.x, this.y, this.x + this.width, this.y);
        p.noStroke();
    }
}

export class Collectible extends Entity {
    constructor(x, y, subType) {
        super(x, y, 20, 20, 'ITEM');
        this.subType = subType; // 'POTION', 'BOOST'
    }

    collect(player) {
        if (this.subType === 'POTION') {
            player.health = Math.min(player.maxHealth, player.health + 20);
            gameState.score += 5;
        } else if (this.subType === 'BOOST') {
            // NotImplemented: Boost logic, just score for now
            gameState.score += 10;
        }
        this.markedForDeletion = true;
        spawnParticles(this.x + 10, this.y + 10, 10, [255, 255, 0]);
    }

    render(p) {
        p.push();
        p.translate(this.x + 10, this.y + 10 + Math.sin(p.frameCount * 0.1) * 3);
        
        if (this.subType === 'POTION') {
            p.fill(0, 255, 0);
            p.circle(0, 0, 15);
            p.fill(255); // shine
            p.circle(-3, -3, 5);
        } else {
            p.fill(255, 215, 0); // Gold
            p.rectMode(p.CENTER);
            p.rotate(p.frameCount * 0.05);
            p.rect(0, 0, 15, 15);
        }
        p.pop();
    }
}

export class Projectile extends Entity {
    constructor(x, y, targetX, targetY) {
        super(x, y, 10, 10, 'PROJECTILE');
        const angle = Math.atan2(targetY - y, targetX - x);
        this.speed = 4;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.damage = 15;
        this.lifetime = 120;
    }

    update(p) {
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime--;
        if (this.lifetime <= 0) this.markedForDeletion = true;
    }

    render(p) {
        p.fill(255, 50, 50);
        p.circle(this.x + 5, this.y + 5, 10);
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
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.rect(this.x, this.y, 4, 4);
    }
}

function spawnParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push(new Particle(x, y, color));
    }
}