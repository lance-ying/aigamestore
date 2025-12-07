// entities.js
// Classes for Player, Enemies, Items, etc.

import { PhysicsBody } from './physics.js';
import { gameState, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { isKeyDown, KEYS } from './input.js';
import { checkAABB, dist } from './utils.js';
import { createParticleExplosion, createBloodSplatter } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// --- Base Entity ---
export class Entity extends PhysicsBody {
    constructor(x, y, width, height, type) {
        super(x, y, width, height);
        this.type = type;
        this.active = true;
        this.facing = 1; // 1 = right, -1 = left
        this.color = '#ffffff';
    }

    update(p) {
        if (!this.active) return;
        this.applyGravity();
        this.applyPhysics(gameState.levelMap);
        
        // Kill bounds
        if (this.y > gameState.levelMap.length * TILE_SIZE) {
            this.die(p);
        }
    }

    render(p, camera) {
        if (!this.active) return;
        p.push();
        p.translate(this.x - camera.x, this.y - camera.y);
        this.drawSprite(p);
        p.pop();
    }

    drawSprite(p) {
        p.fill(this.color);
        p.rect(0, 0, this.width, this.height);
    }
    
    die(p) {
        this.active = false;
    }
}

// --- Player ---
export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 24, 34, 'player'); // slightly smaller than tile
        this.speed = 4;
        this.jumpForce = -10.5;
        this.health = 4;
        this.maxHealth = 4;
        this.invulnerable = 0;
        this.attackCooldown = 0;
        this.state = 'IDLE'; // IDLE, RUN, JUMP, FALL, ATTACK
        this.color = COLORS.PLAYER;
        this.whipHitbox = null;
    }

    update(p) {
        if (this.health <= 0) {
            gameState.gamePhase = 'GAME_OVER_LOSE';
            return;
        }

        this.handleInput(p);
        
        super.update(p); // Physics

        // State management for animation/logic
        if (!this.onGround) {
            this.state = this.vy > 0 ? 'FALL' : 'JUMP';
        } else {
            this.state = Math.abs(this.vx) > 0.1 ? 'RUN' : 'IDLE';
        }

        // Invulnerability
        if (this.invulnerable > 0) this.invulnerable--;

        // Attack Cooldown
        if (this.attackCooldown > 0) this.attackCooldown--;
        
        // Log player state
        if (p.frameCount % 10 === 0 && p.logs && p.logs.player_info) {
             p.logs.player_info.push({
                 x: this.x, y: this.y, 
                 health: this.health,
                 state: this.state,
                 frame: p.frameCount
             });
        }
    }

    handleInput(p) {
        let left = isKeyDown(KEYS.LEFT);
        let right = isKeyDown(KEYS.RIGHT);
        let jump = isKeyDown(KEYS.SPACE);
        let sprint = isKeyDown(KEYS.SHIFT);
        let attack = isKeyDown(KEYS.Z);

        // Automated Testing Override
        if (gameState.controlMode !== 'HUMAN') {
            const action = get_automated_testing_action(gameState);
            if (action) {
                if (action.left) left = true;
                if (action.right) right = true;
                if (action.jump) jump = true;
                if (action.attack) attack = true;
            }
        }

        // Movement
        const currentSpeed = sprint ? this.speed * 1.5 : this.speed;
        
        if (left) {
            this.vx = -currentSpeed;
            this.facing = -1;
        } else if (right) {
            this.vx = currentSpeed;
            this.facing = 1;
        } else {
            this.vx *= 0.5; // Friction
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }

        // Jump
        if (jump && this.onGround) {
            this.vy = this.jumpForce;
            this.onGround = false;
        }

        // Attack
        if (attack && this.attackCooldown === 0) {
            this.performAttack(p);
        }
    }

    performAttack(p) {
        this.attackCooldown = 20;
        // Create hitbox
        const range = 40;
        const hx = this.facing === 1 ? this.x + this.width : this.x - range;
        const hy = this.y + 5;
        const hw = range;
        const hh = 20;
        
        this.whipHitbox = { x: hx, y: hy, width: hw, height: hh, active: true, frame: 5 };
        
        // Check collision with enemies immediately
        gameState.entities.forEach(ent => {
            if (ent instanceof Enemy && ent.active) {
                if (checkAABB(this.whipHitbox, ent)) {
                    ent.takeDamage(1, p);
                    createParticleExplosion(p, ent.x + ent.width/2, ent.y + ent.height/2, COLORS.WALL); // Dust
                }
            }
        });
    }

    takeDamage(amount, p) {
        if (this.invulnerable > 0) return;
        
        this.health -= amount;
        this.invulnerable = 60; // 1 second
        this.vy = -5; // Knockback
        this.vx = -this.facing * 5;
        
        createBloodSplatter(p, this.x + this.width/2, this.y + this.height/2);
        
        if (this.health <= 0) {
            this.die(p);
        }
    }
    
    die(p) {
        gameState.gamePhase = "GAME_OVER_LOSE";
    }

    drawSprite(p) {
        // Draw character
        p.fill(this.invulnerable > 0 && Math.floor(p.frameCount / 4) % 2 === 0 ? 255 : this.color);
        p.noStroke();
        p.rect(0, 0, this.width, this.height, 4);
        
        // Eyes
        p.fill(0);
        const eyeOffset = this.facing === 1 ? 4 : -4;
        p.rect(this.width/2 + eyeOffset, 8, 4, 4);
        
        // Hat
        p.fill(139, 69, 19);
        p.rect(-2, -5, this.width + 4, 8);
        
        // Draw Whip Hitbox debug or effect
        if (this.whipHitbox && this.whipHitbox.frame > 0) {
            p.fill(255, 255, 255, 150);
            p.rect(this.whipHitbox.x - this.x, this.whipHitbox.y - this.y, this.whipHitbox.width, this.whipHitbox.height);
            this.whipHitbox.frame--;
        } else {
            this.whipHitbox = null;
        }
    }
}

// --- Enemies ---
export class Enemy extends Entity {
    constructor(x, y, w, h, type) {
        super(x, y, w, h, type);
        this.hp = 1;
        this.damage = 1;
    }
    
    takeDamage(amount, p) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.die(p);
        }
    }
    
    die(p) {
        this.active = false;
        createBloodSplatter(p, this.x + this.width/2, this.y + this.height/2);
        gameState.score += 100;
    }
    
    checkPlayerCollision(p) {
        if (!gameState.player || !gameState.player.active) return;
        
        if (checkAABB(this, gameState.player)) {
            // Mario-style stomp logic check
            const playerBottom = gameState.player.y + gameState.player.height;
            const enemyTop = this.y + 10;
            
            if (gameState.player.vy > 0 && playerBottom < this.y + this.height * 0.7) {
                // Stomp success
                this.takeDamage(1, p);
                gameState.player.vy = -6; // Bounce
            } else {
                // Hurt player
                gameState.player.takeDamage(this.damage, p);
            }
        }
    }
}

export class Snake extends Enemy {
    constructor(x, y) {
        super(x, y, 30, 20, 'snake');
        this.color = COLORS.SNAKE;
        this.speed = 2;
        this.vx = this.speed;
        // Position correction for shorter height
        this.y += (TILE_SIZE - 20); 
    }
    
    update(p) {
        if (!this.active) return;
        
        // Patrol logic: turn around at walls or cliffs
        super.update(p);
        
        // Check walls (colliding left/right set by PhysicsBody)
        if (this.isCollidingLeft || this.isCollidingRight) {
            this.vx *= -1;
            this.facing *= -1;
        }
        
        // Check cliffs (look ahead)
        // Simplified: just reverse if hitting wall for now, complex cliff detection requires map lookups
        // Let's add basic cliff detection
        const lookAheadX = this.vx > 0 ? this.x + this.width + 5 : this.x - 5;
        const tileX = Math.floor(lookAheadX / TILE_SIZE);
        const tileY = Math.floor((this.y + this.height + 2) / TILE_SIZE);
        
        if (tileY < gameState.levelMap.length && tileX >= 0 && tileX < gameState.levelMap[0].length) {
            if (gameState.levelMap[tileY][tileX] === 0) { // Empty space below ahead
                this.vx *= -1;
                this.facing *= -1;
            }
        }

        this.checkPlayerCollision(p);
    }
}

export class Bat extends Enemy {
    constructor(x, y) {
        super(x, y, 25, 20, 'bat');
        this.color = COLORS.BAT;
        this.state = 'SLEEP';
        this.target = null;
    }
    
    update(p) {
        if (!this.active) return;
        
        // Don't apply gravity if hanging
        if (this.state === 'SLEEP') {
            if (gameState.player && dist(this.x, this.y, gameState.player.x, gameState.player.y) < 200) {
                this.state = 'FLY';
            }
        } else {
            // Fly towards player
            if (gameState.player) {
                const dx = gameState.player.x - this.x;
                const dy = gameState.player.y - this.y;
                const angle = Math.atan2(dy, dx);
                this.vx = Math.cos(angle) * 2;
                this.vy = Math.sin(angle) * 2;
            }
            this.x += this.vx;
            this.y += this.vy;
            
            // Simple map collision (bounce)
            // Just resolving slightly to avoid sticking inside walls too much
            // For bats, maybe they phase through walls or just get pushed out lightly.
            // Let's ignore wall collision for bats to be annoying like real Spelunky bats.
        }
        
        this.checkPlayerCollision(p);
    }
    
    drawSprite(p) {
        p.fill(this.color);
        if (this.state === 'SLEEP') {
            p.ellipse(this.width/2, this.height/2, this.width, this.height);
        } else {
            // Flapping
            const wingY = Math.sin(p.frameCount * 0.5) * 10;
            p.circle(this.width/2, this.height/2, 15);
            p.rect(0, 5 + wingY, 10, 5); // Wings
            p.rect(this.width - 10, 5 + wingY, 10, 5);
        }
    }
}

// --- Collectibles ---
export class Item extends Entity {
    constructor(x, y, type, value) {
        super(x, y, 20, 20, type);
        this.value = value;
        this.collected = false;
        
        if (type === 'gold') this.color = COLORS.GOLD;
        if (type === 'gem') this.color = COLORS.GEM;
    }
    
    update(p) {
        super.update(p); // Items have gravity
        
        if (gameState.player && checkAABB(this, gameState.player)) {
            this.collect(p);
        }
    }
    
    collect(p) {
        this.active = false;
        gameState.score += this.value;
        gameState.money += this.value;
        // Sparkle effect
        createParticleExplosion(p, this.x + 10, this.y + 10, this.color);
    }
    
    drawSprite(p) {
        p.fill(this.color);
        p.noStroke();
        if (this.type === 'gold') {
            p.rect(2, 5, 16, 10); // Bar shape
        } else {
            p.triangle(10, 0, 20, 10, 10, 20); // Diamond shape part 1
            p.triangle(10, 0, 0, 10, 10, 20); // Diamond shape part 2
        }
    }
}

// --- Level Exit ---
export class Exit extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40, 'exit');
        this.color = COLORS.EXIT;
    }
    
    update(p) {
        // Static
        if (gameState.player && checkAABB(this, gameState.player)) {
            // Player must press ENTER or UP to enter (let's make it auto on overlap for simplicity or specific key)
            // Or just check center overlap
            const cx = this.x + this.width/2;
            const cy = this.y + this.height/2;
            const px = gameState.player.x + gameState.player.width/2;
            const py = gameState.player.y + gameState.player.height/2;
            
            if (dist(cx, cy, px, py) < 20) {
                 nextLevel(p);
            }
        }
    }
    
    drawSprite(p) {
        p.fill(30);
        p.rect(0, 0, 40, 40);
        p.fill(0);
        p.rect(5, 5, 30, 35); // Doorway
        p.fill(255);
        p.circle(30, 20, 4); // Knob
    }
}

function nextLevel(p) {
    gameState.gamePhase = 'TRANSITION';
    setTimeout(() => {
        gameState.currentLevel++;
        if (p.generateLevel) p.generateLevel(); // Call generation via game instance
        gameState.gamePhase = 'PLAYING';
    }, 500);
}