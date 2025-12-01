import { gameState, TILE_SIZE } from './globals.js';
import { isOnGround, updatePhysicsEntity, checkCircleCollision, resolveSoftCollision } from './physics.js';
import { isKeyDown, getInputVector } from './input.js';
import { spawnParticles } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// --- PROJECTILE ---
export class Projectile {
    constructor(x, y, angle, owner) {
        this.x = x;
        this.y = y;
        this.speed = 8;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.owner = owner; // 'player' or 'enemy'
        this.radius = 4;
        this.damage = 15;
        this.life = 60; // frames
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        spawnParticles(this.x, this.y, 'magic', 1);
        
        // Collision
        if (this.owner === 'player') {
            for (let enemy of gameState.enemies) {
                if (checkCircleCollision(this, enemy)) {
                    enemy.takeDamage(this.damage);
                    spawnParticles(this.x, this.y, 'spark', 5);
                    this.life = 0;
                    break;
                }
            }
        } else {
            if (gameState.player && checkCircleCollision(this, gameState.player)) {
                gameState.player.takeDamage(this.damage);
                this.life = 0;
            }
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.fill(200, 255, 255);
        p.noStroke();
        p.circle(0, 0, this.radius * 2);
        p.pop();
    }
}

// --- PLAYER ---
export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 12;
        this.friction = 0.8;
        this.speed = 0.8; // Acceleration
        this.maxSpeed = 4;
        
        this.hp = 100;
        this.maxHp = 100;
        
        this.facing = 0; // Angle in radians
        this.state = 'idle'; // idle, move, attack, roll, fall
        this.stateTimer = 0;
        
        this.attackCooldown = 0;
        this.rollCooldown = 0;
    }
    
    update(p) {
        if (this.state === 'fall') {
            this.updateFall(p);
            return;
        }

        // Automated Testing Override
        let input = { x: 0, y: 0, attack: false, shoot: false, roll: false };
        if (gameState.controlMode === 'HUMAN') {
            const vec = getInputVector();
            input.x = vec.x;
            input.y = vec.y;
            input.attack = isKeyDown(90); // Z
            input.shoot = isKeyDown(32); // Space
            input.roll = isKeyDown(16); // Shift
        } else {
            const action = get_automated_testing_action(gameState);
            if (action) {
                if (action.move) { input.x = action.move.x; input.y = action.move.y; }
                if (action.attack) input.attack = true;
                if (action.shoot) input.shoot = true;
                if (action.roll) input.roll = true;
            }
        }

        // Movement
        if (this.state !== 'roll') {
            if (input.x !== 0 || input.y !== 0) {
                this.vx += input.x * this.speed;
                this.vy += input.y * this.speed;
                this.facing = Math.atan2(input.y, input.x);
                
                // Walking dust
                if (p.frameCount % 10 === 0) spawnParticles(this.x, this.y + 10, 'dust', 1);
            }
            
            // Limit speed
            const vel = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
            if (vel > this.maxSpeed) {
                this.vx = (this.vx / vel) * this.maxSpeed;
                this.vy = (this.vy / vel) * this.maxSpeed;
            }
        }
        
        updatePhysicsEntity(this);

        // Actions
        if (this.state === 'idle' || this.state === 'move') {
            // Roll
            if (input.roll && this.rollCooldown <= 0 && (input.x !== 0 || input.y !== 0)) {
                this.state = 'roll';
                this.stateTimer = 20; // 20 frames roll
                this.rollCooldown = 60;
                this.vx = Math.cos(this.facing) * 8;
                this.vy = Math.sin(this.facing) * 8;
                spawnParticles(this.x, this.y, 'dust', 5);
            }
            // Attack (Hammer)
            else if (input.attack && this.attackCooldown <= 0) {
                this.performAttack(p, 'melee');
            }
            // Shoot (Bow)
            else if (input.shoot && this.attackCooldown <= 0) {
                this.performAttack(p, 'range');
            }
        }

        // State Management
        if (this.state === 'roll') {
            this.stateTimer--;
            if (this.stateTimer <= 0) this.state = 'idle';
        }

        // Cooldowns
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.rollCooldown > 0) this.rollCooldown--;

        // Ground check (Not while rolling to give some leniency, or strict?)
        // Let's make rolling allow crossing gaps slightly or just safety
        if (this.state !== 'roll' && !isOnGround(this.x, this.y)) {
            this.fall(p);
        }
        
        // Log player info
        if (p.logs && p.logs.player_info) {
            p.logs.player_info.push({
                x: this.x,
                y: this.y,
                hp: this.hp,
                state: this.state,
                framecount: p.frameCount
            });
        }
    }
    
    performAttack(p, type) {
        this.attackCooldown = type === 'melee' ? 30 : 40;
        
        if (type === 'melee') {
            // Create a hit arc
            const reach = 40;
            const centerAngle = this.facing;
            const hitSomething = false;
            
            // Visual effect
            gameState.particles.push(new Particle(this.x + Math.cos(this.facing)*20, this.y + Math.sin(this.facing)*20, 'spark'));

            // Check enemies in arc
            gameState.enemies.forEach(e => {
                const dx = e.x - this.x;
                const dy = e.y - this.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < reach + e.radius) {
                    const angle = Math.atan2(dy, dx);
                    let angleDiff = angle - centerAngle;
                    // Normalize -PI to PI
                    while (angleDiff > Math.PI) angleDiff -= Math.PI*2;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI*2;
                    
                    if (Math.abs(angleDiff) < Math.PI / 2) {
                        e.takeDamage(25);
                        e.knockback(this.facing, 5);
                        spawnParticles(e.x, e.y, 'blood', 3);
                        gameState.shake = 5;
                    }
                }
            });
        } else {
            // Shoot
            gameState.projectiles.push(new Projectile(this.x, this.y, this.facing, 'player'));
        }
    }
    
    takeDamage(amount) {
        if (this.state === 'roll') return; // Invincible
        this.hp -= amount;
        spawnParticles(this.x, this.y, 'blood', 5);
        gameState.shake = 3;
        if (this.hp <= 0) {
            this.hp = 0;
            gameState.gamePhase = 'GAME_OVER_LOSE';
        }
    }
    
    fall(p) {
        this.state = 'fall';
        this.stateTimer = 60; // 1 second to respawn
        this.hp -= 20; // Penalty
        if (this.hp <= 0) gameState.gamePhase = 'GAME_OVER_LOSE';
    }
    
    updateFall(p) {
        this.x += 0; // Stop moving x
        this.y += 2; // Fall down screen (y is technically 'down' in 2d, but visually we can scale down)
        this.stateTimer--;
        
        if (this.stateTimer <= 0 && this.hp > 0) {
            // Respawn at last stable spot (simplified: nearest active tile center)
            const nearestTile = this.findNearestSafeTile();
            if (nearestTile) {
                this.x = nearestTile.x;
                this.y = nearestTile.y;
                this.vx = 0;
                this.vy = 0;
                this.state = 'idle';
            }
        }
    }
    
    findNearestSafeTile() {
        let nearest = null;
        let minDst = Infinity;
        for (let tile of gameState.tiles.values()) {
            if (tile.isActive && tile.animProgress >= 1) {
                const d = (tile.x - this.x)**2 + (tile.y - this.y)**2;
                if (d < minDst) {
                    minDst = d;
                    nearest = tile;
                }
            }
        }
        return nearest;
    }

    render(p) {
        if (this.state === 'fall') {
            const scale = this.stateTimer / 60;
            p.push();
            p.translate(this.x, this.y);
            p.scale(scale);
            p.fill(200, 200, 200);
            p.circle(0, 0, this.radius * 2);
            p.pop();
            return;
        }

        p.push();
        p.translate(this.x, this.y);
        
        // Shadow
        p.fill(0, 0, 0, 100);
        p.ellipse(0, 15, 20, 8);
        
        // Body (Kid has white hair, red scarf)
        p.rotate(this.state === 'roll' ? p.frameCount * 0.5 : 0);
        
        // Scarf
        p.fill(200, 50, 50);
        p.rect(-8, -10, 16, 20, 4);
        
        // Head
        p.fill(255, 220, 180); // Skin
        p.circle(0, -8, 16);
        
        // Hair
        p.fill(240);
        p.arc(0, -10, 18, 16, Math.PI, 0);
        
        // Weapon Indicator
        p.rotate(this.facing - (this.state === 'roll' ? p.frameCount * 0.5 : 0));
        p.fill(100);
        p.rect(10, -2, 15, 4); // Weapon pointing direction
        
        p.pop();
    }
}

// --- ENEMY ---
export class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'scumbag', 'windbag'
        this.hp = type === 'scumbag' ? 50 : 30;
        this.maxHp = this.hp;
        this.radius = 15;
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.9;
        this.speed = type === 'scumbag' ? 0.2 : 0;
        this.detectRange = 300;
        this.attackRange = type === 'scumbag' ? 30 : 200;
        this.attackCooldown = 0;
    }
    
    update(p) {
        if (!gameState.player) return;
        const player = gameState.player;
        const dist = Math.sqrt((player.x - this.x)**2 + (player.y - this.y)**2);
        
        updatePhysicsEntity(this);
        
        // Fall check
        if (!isOnGround(this.x, this.y)) {
            this.die(); // Enemies just die if they fall
            return;
        }
        
        if (dist < this.detectRange) {
            if (this.type === 'scumbag') {
                // Chase
                if (dist > 20) {
                    const angle = Math.atan2(player.y - this.y, player.x - this.x);
                    this.vx += Math.cos(angle) * this.speed;
                    this.vy += Math.sin(angle) * this.speed;
                }
                
                // Attack
                if (dist < this.attackRange && this.attackCooldown <= 0) {
                    player.takeDamage(10);
                    this.attackCooldown = 60;
                }
            } else if (this.type === 'windbag') {
                // Flee if too close
                if (dist < 100) {
                    const angle = Math.atan2(player.y - this.y, player.x - this.x);
                    this.vx -= Math.cos(angle) * 0.1;
                    this.vy -= Math.sin(angle) * 0.1;
                }
                
                // Shoot
                if (this.attackCooldown <= 0) {
                    const angle = Math.atan2(player.y - this.y, player.x - this.x);
                    gameState.projectiles.push(new Projectile(this.x, this.y, angle, 'enemy'));
                    this.attackCooldown = 100;
                }
            }
        }
        
        if (this.attackCooldown > 0) this.attackCooldown--;
        
        // Soft collisions with other enemies
        gameState.enemies.forEach(e => {
            if (e !== this) resolveSoftCollision(this, e);
        });
    }
    
    knockback(angle, force) {
        this.vx += Math.cos(angle) * force;
        this.vy += Math.sin(angle) * force;
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) this.die();
    }
    
    die() {
        const idx = gameState.enemies.indexOf(this);
        if (idx !== -1) {
            gameState.enemies.splice(idx, 1);
            spawnParticles(this.x, this.y, 'dust', 10);
            gameState.score += 100;
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Shadow
        p.fill(0, 0, 0, 100);
        p.ellipse(0, 15, 20, 8);
        
        if (this.type === 'scumbag') {
            // Blobby blue thing
            p.fill(50, 100, 200);
            // Squish animation
            const bounce = Math.sin(p.frameCount * 0.2) * 2;
            p.ellipse(0, 0 - bounce, 24, 24 + bounce);
            
            // Eyes
            p.fill(255, 255, 0);
            p.circle(-5, -5 - bounce, 4);
            p.circle(5, -5 - bounce, 4);
        } else {
            // Floating orange thing
            p.fill(200, 100, 50);
            const float = Math.sin(p.frameCount * 0.1) * 5;
            p.translate(0, float);
            p.rectMode(p.CENTER);
            p.rect(0, 0, 20, 30);
            p.fill(255);
            p.circle(0, -5, 10); // Cyclops eye
        }
        
        // Health bar
        const hpPct = this.hp / this.maxHp;
        p.fill(50, 0, 0);
        p.rect(-10, -25, 20, 4);
        p.fill(255, 0, 0);
        p.rect(-10, -25, 20 * hpPct, 4);
        
        p.pop();
    }
}