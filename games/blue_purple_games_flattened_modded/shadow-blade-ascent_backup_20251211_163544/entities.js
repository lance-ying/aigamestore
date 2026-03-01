import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { checkCollision, resolvePlatformCollisions } from './physics.js';

class Entity {
    constructor(x, y, w, h, type) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = type;
        this.vx = 0;
        this.vy = 0;
        this.active = true;
        this.color = [255, 255, 255];
        this.facing = 1; // 1 Right, -1 Left
    }

    update() {}
    render(p) {}
}

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 30, 50, 'PLAYER');
        this.speed = 12; // Increased speed
        this.jumpForce = -15; // Increased jump force
        this.health = 100;
        this.maxHealth = 100;
        this.mana = 50;
        this.maxMana = 50;
        this.xp = 0;
        this.xpThreshold = 100;
        this.level = 1;
        this.onGround = false;
        this.isClimbing = false;
        this.canClimb = false;
        this.droppingThrough = false;
        
        // Combat
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackCooldown = 0;
        this.combo = 0;
        this.comboTimer = 0;
        
        // Dodge
        this.isDodging = false;
        this.dodgeTimer = 0;
        this.invulnerable = false;
        this.invulnerableTimer = 0;
        this.canAirDash = true;
        
        // Stats
        this.attackPower = 10;
        this.defense = 0;
    }

    update(p) {
        // Input Handling is done in game.js via methods, but physics integration is here
        
        // Reset air dash when on ground
        if (this.onGround || this.isClimbing) {
            this.canAirDash = true;
        }

        // Gravity (disabled during dash for cleaner air dash)
        if (!this.isClimbing && !this.isDodging) {
            this.vy += gameState.gravity;
        } else if (this.isDodging) {
            this.vy = 0; // Float during dash
        } else {
            this.vy = 0; // Controlled by input on ladder
        }

        // Apply Velocity
        this.x += this.vx;
        this.y += this.vy;

        // Friction
        this.vx *= gameState.friction;
        if (Math.abs(this.vx) < 0.1) this.vx = 0;

        // Physics Resolution
        this.canClimb = false;
        resolvePlatformCollisions(this);

        // State Timers
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.attackTimer > 0) this.attackTimer--;
        else this.isAttacking = false;

        if (this.dodgeTimer > 0) {
            this.dodgeTimer--;
            // Dash movement override
            this.x += this.facing * 10; // Increased dash speed
        } else {
            this.isDodging = false;
        }

        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer--;
            if (this.invulnerableTimer <= 0) this.invulnerable = false;
        }
        
        if (this.comboTimer > 0) this.comboTimer--;
        else this.combo = 0;

        // Mana Regen
        if (gameState.frameCount % 60 === 0 && this.mana < this.maxMana) this.mana++;
        
        // Level Bounds
        this.x = Math.max(0, Math.min(this.x, gameState.levelWidth - this.width));
        
        // Animation Logging
        if (this.vx !== 0 || this.vy !== 0) {
             p.logs.player_info.push({
                 x: this.x, y: this.y, 
                 state: this.isAttacking ? 'ATTACK' : (this.onGround ? 'RUN' : 'JUMP'),
                 frame: gameState.frameCount
             });
        }
    }

    jump() {
        if (this.onGround || this.isClimbing) {
            this.vy = this.jumpForce;
            this.isClimbing = false;
            this.onGround = false;
        }
    }

    attack(type) {
        if (this.attackCooldown > 0 || this.isDodging) return;

        // Combo logic
        if (this.comboTimer > 0 && this.combo < 3) {
            this.combo++;
        } else {
            this.combo = 1;
        }
        
        this.isAttacking = true;
        this.attackTimer = 15; // Duration of hitbox

        // Set cooldown based on combo step
        if (this.combo < 3) {
            // Fast attacks
            this.attackCooldown = 15; // Allow next hit quickly
            this.comboTimer = 45; // Window to press next key
        } else {
            // Finisher
            this.attackCooldown = 40; // Recovery
            this.comboTimer = 0; // Reset combo
        }

        // Create Hitbox
        let range = 60;
        let damage = this.attackPower;
        let style = 'NORMAL';

        if (type === 'SKILL1') {
            if (this.mana >= 20) {
                this.mana -= 20;
                range = 100;
                damage = this.attackPower * 2;
                style = 'SMASH';
                gameState.screenShake = 10;
            } else {
                return; // Not enough mana
            }
        } else if (type === 'SKILL2') {
             if (this.mana >= 15) {
                this.mana -= 15;
                // Projectile
                const proj = new Projectile(this.x + (this.facing*20), this.y + 10, this.facing * 10, 0, this.attackPower * 1.5, true);
                gameState.projectiles.push(proj);
                gameState.entities.push(proj);
                this.attackCooldown = 40;
                return;
            } else {
                return;
            }
        }

        // Melee Hitbox check immediately
        const hitbox = {
            x: this.facing === 1 ? this.x + this.width : this.x - range,
            y: this.y,
            width: range,
            height: this.height
        };

        // Check enemies
        gameState.enemies.forEach(enemy => {
            if (checkCollision(hitbox, enemy)) {
                enemy.takeDamage(damage + (this.combo * 5)); // Increased Combo bonus damage
                // Knockback
                enemy.vx = this.facing * 5;
                enemy.vy = -5;
                
                // Particle
                for(let i=0; i<5; i++) {
                    gameState.particles.push(new Particle(enemy.x + enemy.width/2, enemy.y + enemy.height/2, [255, 0, 0]));
                }
            }
        });
    }

    dodge() {
        if (this.dodgeTimer === 0) {
            if (this.onGround || this.canAirDash) {
                this.isDodging = true;
                this.dodgeTimer = 15; // 0.25s
                this.invulnerable = true;
                this.invulnerableTimer = 20;
                // Impulse
                this.vx = this.facing * 10;
                
                if (!this.onGround) {
                    this.canAirDash = false;
                }
            }
        }
    }

    takeDamage(amount) {
        if (this.invulnerable) return;
        
        let dmg = Math.max(1, amount - this.defense);
        this.health -= dmg;
        this.invulnerable = true;
        this.invulnerableTimer = 60; // 1 sec mercy
        
        gameState.screenShake = 5;

        if (this.health <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }

    gainXp(amount) {
        this.xp += amount;
        if (this.xp >= this.xpThreshold) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpThreshold;
        this.xpThreshold = Math.floor(this.xpThreshold * 1.5);
        this.maxHealth += 20;
        this.health = this.maxHealth;
        this.maxMana += 10;
        this.mana = this.maxMana;
        this.attackPower += 5;
        // Effect
        for(let i=0; i<20; i++) {
            gameState.particles.push(new Particle(this.x + this.width/2, this.y, [255, 255, 0]));
        }
    }

    render(p) {
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        p.scale(this.facing, 1);
        
        // Flicker if invulnerable
        if (this.invulnerable && Math.floor(gameState.frameCount / 4) % 2 === 0) {
            p.tint(255, 100);
        }

        // Ninja Body
        p.noStroke();
        p.fill(20);
        p.rect(-15, -25, 30, 50); // Body

        // Head
        p.fill(0);
        p.ellipse(0, -25, 25, 25);
        
        // Headband (Red)
        p.fill(200, 0, 0);
        p.rect(-12, -32, 24, 6);
        // Headband tails
        if (Math.abs(this.vx) > 1) {
            p.stroke(200, 0, 0);
            p.strokeWeight(3);
            let flow = Math.sin(gameState.frameCount * 0.5) * 10;
            p.line(-12, -30, -30, -30 + flow);
            p.line(-12, -30, -28, -20 + flow);
            p.noStroke();
        }

        // Eyes
        p.fill(255);
        p.ellipse(4, -25, 6, 4);

        // Weapon
        if (this.isAttacking) {
            p.fill(200);
            // Visual varies by combo
            if (this.combo === 3) p.fill(255, 100, 100); // Red sword on finisher
            
            p.beginShape();
            p.vertex(10, 0);
            p.vertex(50, -10); // Swing arc
            p.vertex(45, 10);
            p.endShape(p.CLOSE);
            
            // Swoosh effect
            p.noFill();
            p.stroke(255, 255, 255, 150);
            p.strokeWeight(2);
            p.arc(0, 0, 80, 80, -p.PI/4, p.PI/4);
        } else {
             // Sheathed sword
             p.stroke(100);
             p.strokeWeight(2);
             p.line(-5, 0, -15, 15);
        }

        // Dodge effect
        if (this.isDodging) {
             p.fill(100, 100, 255, 100);
             p.rect(-20, -25, 30, 50);
        }

        p.pop();
    }
}

export class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y, 30, 50, 'ENEMY');
        this.enemyType = type; // 'MINION', 'ARCHER', 'GUARD', 'BOSS'
        this.hp = 30;
        this.maxHp = 30;
        this.damage = 5; // Reduced from 10
        this.patrolStart = x - 100;
        this.patrolEnd = x + 100;
        this.state = 'PATROL'; // PATROL, CHASE, ATTACK
        this.attackTimer = 0;
        this.flashTimer = 0;
        
        // Type specifics
        if (type === 'ARCHER') { this.hp = 20; this.color = [50, 50, 150]; }
        if (type === 'GUARD') { this.hp = 60; this.width = 40; this.height = 60; this.damage = 8; this.color = [100, 50, 50]; } // Damage reduced from 15
        if (type === 'BOSS') { 
            this.hp = 500; 
            this.maxHp = 500; 
            this.width = 60; 
            this.height = 90; 
            this.damage = 15; // Reduced from 20
            this.color = [150, 0, 150];
            this.patrolStart = x - 300;
            this.patrolEnd = x + 300;
        }
    }

    update() {
        if (!this.active) return;
        
        this.vy += gameState.gravity;
        
        // AI Logic
        const distToPlayer = Math.abs(gameState.player.x - this.x);
        const playerDir = Math.sign(gameState.player.x - this.x);
        
        // Patrol
        if (this.state === 'PATROL') {
            if (this.x <= this.patrolStart) this.facing = 1;
            if (this.x >= this.patrolEnd) this.facing = -1;
            this.vx = this.facing * 1; // Slow patrol

            if (distToPlayer < 200 && Math.abs(gameState.player.y - this.y) < 100) {
                this.state = 'CHASE';
            }
        }
        else if (this.state === 'CHASE') {
             this.facing = playerDir;
             
             if (this.enemyType === 'ARCHER') {
                 // Keep distance
                 if (distToPlayer < 150) this.vx = -this.facing * 2;
                 else if (distToPlayer > 250) this.vx = this.facing * 2;
                 else this.vx = 0;
                 
                 // Attack logic
                 if (this.attackTimer === 0 && distToPlayer < 300) {
                     this.shoot();
                     this.attackTimer = 120; // 2 sec cooldown
                 }
             } else {
                 // Melee
                 this.vx = this.facing * 2.5;
                 if (distToPlayer < 40) {
                     this.vx = 0;
                     if (this.attackTimer === 0) {
                         this.attack();
                         this.attackTimer = 60;
                     }
                 }
             }

             if (distToPlayer > 400) this.state = 'PATROL';
        }

        // Apply physics
        this.x += this.vx;
        this.y += this.vy;
        resolvePlatformCollisions(this);

        // Timers
        if (this.attackTimer > 0) this.attackTimer--;
        if (this.flashTimer > 0) this.flashTimer--;
    }

    shoot() {
        const proj = new Projectile(this.x + this.width/2, this.y + 20, this.facing * 6, 0, this.damage, false);
        gameState.projectiles.push(proj);
        gameState.entities.push(proj);
    }

    attack() {
        // Simple melee hitbox
        const hitbox = {
            x: this.facing === 1 ? this.x + this.width : this.x - 30,
            y: this.y,
            width: 30,
            height: this.height
        };
        if (checkCollision(hitbox, gameState.player)) {
            gameState.player.takeDamage(this.damage);
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.flashTimer = 10;
        // Particle splatter
        gameState.particles.push(new Particle(this.x + this.width/2, this.y + this.height/2, [100, 0, 100]));
        
        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.active = false;
        gameState.score += (this.enemyType === 'BOSS' ? 500 : (this.enemyType === 'GUARD' ? 50 : 25));
        
        // Drop loot
        if (Math.random() < 0.3) {
            gameState.collectibles.push(new Collectible(this.x, this.y, 'GOLD'));
        } else if (Math.random() < 0.1) {
            gameState.collectibles.push(new Collectible(this.x, this.y, 'POTION'));
        }

        gameState.player.gainXp(this.enemyType === 'BOSS' ? 100 : 20);

        // Remove from lists
        const idx = gameState.enemies.indexOf(this);
        if (idx > -1) gameState.enemies.splice(idx, 1);
        
        // Boss Logic
        if (this.enemyType === 'BOSS') {
            setTimeout(() => {
                gameState.gamePhase = 'LEVEL_TRANSITION';
                gameState.lastFrameTime = Date.now(); // Reset delta needed
            }, 1000);
        }
    }

    render(p) {
        if (!this.active) return;
        
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        p.scale(this.facing, 1);
        
        if (this.flashTimer > 0) p.fill(255);
        else p.fill(this.color);
        
        // Draw shape based on type
        if (this.enemyType === 'BOSS') {
            p.rect(-30, -45, 60, 90);
            // Crown/Horns
            p.fill(255, 0, 0);
            p.triangle(-20, -45, -10, -60, 0, -45);
            p.triangle(0, -45, 10, -60, 20, -45);
        } else {
            p.rect(-15, -25, 30, 50);
        }

        // Eyes
        p.fill(255, 0, 0);
        p.ellipse(5, -15, 5, 5);
        
        // Health bar
        p.fill(0);
        p.rect(-20, -40, 40, 5);
        p.fill(255, 0, 0);
        p.rect(-20, -40, 40 * (this.hp / this.maxHp), 5);

        p.pop();
    }
}

export class Projectile extends Entity {
    constructor(x, y, vx, vy, damage, isPlayer) {
        super(x, y, 10, 10, 'PROJECTILE');
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.isPlayer = isPlayer;
        this.lifetime = 120;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime--;
        
        if (this.lifetime <= 0) {
            this.active = false;
            return;
        }

        // Collision
        if (this.isPlayer) {
            gameState.enemies.forEach(enemy => {
                if (checkCollision(this, enemy)) {
                    enemy.takeDamage(this.damage);
                    this.active = false;
                }
            });
        } else {
            if (checkCollision(this, gameState.player)) {
                gameState.player.takeDamage(this.damage);
                this.active = false;
            }
        }
        
        // Remove inactive
        if (!this.active) {
            const idx = gameState.projectiles.indexOf(this);
            if (idx > -1) gameState.projectiles.splice(idx, 1);
        }
    }

    render(p) {
        p.fill(this.isPlayer ? [100, 255, 255] : [255, 50, 50]);
        p.noStroke();
        p.ellipse(this.x + 5, this.y + 5, 10, 10);
    }
}

export class Collectible extends Entity {
    constructor(x, y, type) {
        super(x, y, 16, 16, 'COLLECTIBLE');
        this.itemType = type; // GOLD, POTION
        this.bobOffset = Math.random() * Math.PI;
    }

    update() {
        this.bobOffset += 0.1;
        
        if (checkCollision(this, gameState.player)) {
            if (this.itemType === 'GOLD') {
                gameState.score += 10;
            } else if (this.itemType === 'POTION') {
                gameState.player.health = Math.min(gameState.player.health + 25, gameState.player.maxHealth);
            }
            this.active = false;
            const idx = gameState.collectibles.indexOf(this);
            if (idx > -1) gameState.collectibles.splice(idx, 1);
        }
    }

    render(p) {
        const yOff = Math.sin(this.bobOffset) * 5;
        if (this.itemType === 'GOLD') {
            p.fill(255, 215, 0);
            p.circle(this.x + 8, this.y + 8 + yOff, 12);
        } else {
            p.fill(255, 0, 0);
            p.rect(this.x + 4, this.y + 4 + yOff, 8, 12);
        }
    }
}

export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 30;
        this.color = color;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    
    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 8);
        p.rect(this.x, this.y, 4, 4);
    }
}

export class Platform {
    constructor(x, y, w, h, type, oneWay=false) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = type; // NORMAL, LADDER
        this.oneWay = oneWay;
    }
}