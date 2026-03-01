// Game Entities

import { gameState, PHYSICS, COLORS, STAGE_BOUNDS, CANVAS_WIDTH } from './globals.js';
import { applyPhysics, handlePlatformCollisions, checkBlastZone, checkAttackCollision, applyKnockback } from './physics.js';
import { isKeyDown, isJustPressed, KEYS, getInputVector } from './input.js';
import { createExplosion } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

// Base Entity Class
class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.gravityScale = 1.0;
        this.isStatic = false;
        this.onGround = false;
        this.toRemove = false;
    }

    update(p) {
        applyPhysics(this);
    }

    render(p) {
        p.fill(255);
        p.rect(this.x, this.y, this.width, this.height);
    }
}

// Platform Class
export class Platform extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.isStatic = true;
    }

    render(p) {
        // Main block
        p.fill(COLORS.PLATFORM);
        p.noStroke();
        p.rect(this.x, this.y, this.width, this.height);
        // Top trim
        p.fill(COLORS.PLATFORM_TOP);
        p.rect(this.x, this.y, this.width, 8);
    }
}

// Fighter Base Class
class Fighter extends Entity {
    constructor(x, y, w, h) {
        super(x, y, w, h);
        this.damagePercent = 0;
        this.stocks = 3;
        this.state = "IDLE"; // IDLE, RUN, JUMP, FALL, ATTACK, SPECIAL, STUN, DEAD
        this.facing = 1; // 1 = Right, -1 = Left
        this.hitstun = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
        
        // Attack properties
        this.attackFrame = 0;
        this.currentAttack = null;
        
        // Movement stats
        this.speed = 4;
        this.jumpCount = 0;
        this.maxJumps = 2;
        this.wallJumpCooldown = 0;
    }

    update(p) {
        // Decrease timers
        if (this.hitstun > 0) this.hitstun--;
        if (this.invincibleTimer > 0) {
            this.invincibleTimer--;
            this.invincible = this.invincibleTimer > 0;
        }
        if (this.wallJumpCooldown > 0) this.wallJumpCooldown--;

        // State Management
        if (this.hitstun > 0) {
            this.state = "STUN";
        } else if (this.state === "STUN") {
            this.state = "FALL"; // Recover from stun
        }

        // Check death
        if (checkBlastZone(this)) {
            this.die(p);
        }

        super.update(p);
        handlePlatformCollisions(this);

        // Ground reset
        if (this.onGround && this.vy >= 0) {
            this.jumpCount = 0;
            if (this.state === "FALL" || this.state === "JUMP") {
                this.state = "IDLE";
                createExplosion(this.x + this.width/2, this.y + this.height, 3, 'JUMP');
            }
        } else if (!this.onGround && this.state !== "JUMP" && this.state !== "ATTACK" && this.state !== "SPECIAL" && this.state !== "STUN") {
            this.state = "FALL";
        }
    }

    die(p) {
        this.stocks--;
        createExplosion(this.x, this.y, 20, 'FIRE');
        
        if (this.stocks > 0) {
            this.respawn();
        } else {
            this.state = "DEAD";
            this.toRemove = true;
        }
    }

    respawn() {
        this.x = CANVAS_WIDTH / 2 - this.width / 2;
        this.y = 100;
        this.vx = 0;
        this.vy = 0;
        this.damagePercent = 0;
        this.hitstun = 0;
        this.state = "FALL";
        this.invincible = true;
        this.invincibleTimer = 120; // 2 seconds invincibility
    }
}

// Player Class
export class Player extends Fighter {
    constructor(x, y) {
        super(x, y, 30, 40);
        this.color = COLORS.PLAYER.BODY;
    }

    update(p) {
        // Handle Input
        this.handleInput(p);
        
        super.update(p);
        
        // Animation/Logic for attacks
        if (this.state === "ATTACK" || this.state === "SPECIAL") {
            this.processAttack(p);
        }

        // Log Player Info
        if (p.logs && p.logs.player_info) {
             p.logs.player_info.push({
                x: this.x,
                y: this.y,
                vx: this.vx,
                vy: this.vy,
                state: this.state,
                damage: this.damagePercent,
                frame: p.frameCount
             });
        }
    }

    handleInput(p) {
        if (this.state === "STUN" || this.state === "DEAD") return;

        // Automated Testing Override
        let action = null;
        if (gameState.controlMode !== "HUMAN") {
            action = get_automated_testing_action(p, gameState);
        }

        const right = (action && action.keys.includes(KEYS.RIGHT)) || isKeyDown(KEYS.RIGHT);
        const left = (action && action.keys.includes(KEYS.LEFT)) || isKeyDown(KEYS.LEFT);
        const up = (action && action.keys.includes(KEYS.UP)) || isKeyDown(KEYS.UP);
        const down = (action && action.keys.includes(KEYS.DOWN)) || isKeyDown(KEYS.DOWN);
        
        // Use a buffer of 5 frames for action inputs to ensure they register even if frame timing is slightly off
        const jump = (action && action.keys.includes(KEYS.SPACE)) || isJustPressed(p, KEYS.SPACE, 5);
        const attack = (action && action.keys.includes(KEYS.Z)) || isJustPressed(p, KEYS.Z, 5);
        const special = (action && action.keys.includes(KEYS.SHIFT)) || isJustPressed(p, KEYS.SHIFT, 5);

        // Movement (Only if not in commit frames of attack)
        const canMove = this.state !== "ATTACK" && this.state !== "SPECIAL";
        
        if (canMove) {
            if (right) {
                this.vx += PHYSICS.GROUND_ACCEL;
                if (this.vx > this.speed) this.vx = this.speed;
                this.facing = 1;
                if (this.onGround) this.state = "RUN";
            } else if (left) {
                this.vx -= PHYSICS.GROUND_ACCEL;
                if (this.vx < -this.speed) this.vx = -this.speed;
                this.facing = -1;
                if (this.onGround) this.state = "RUN";
            } else {
                if (this.onGround) this.state = "IDLE";
            }
        }

        // Jump
        if (jump) {
            if (this.onGround) {
                this.vy = PHYSICS.JUMP_FORCE;
                this.onGround = false;
                this.state = "JUMP";
                this.jumpCount = 1;
                createExplosion(this.x + 15, this.y + 40, 5, 'JUMP');
            } else if (this.jumpCount < this.maxJumps) {
                this.vy = PHYSICS.DOUBLE_JUMP_FORCE;
                this.jumpCount++;
                this.state = "JUMP";
                createExplosion(this.x + 15, this.y + 40, 5, 'SMOKE');
            } else if ((this.nearWallLeft || this.nearWallRight) && this.wallJumpCooldown === 0) {
                // Wall Jump
                this.vy = PHYSICS.WALL_JUMP_FORCE.Y;
                this.vx = this.nearWallLeft ? PHYSICS.WALL_JUMP_FORCE.X : -PHYSICS.WALL_JUMP_FORCE.X;
                this.wallJumpCooldown = 20;
                this.jumpCount = 1; // Give back a jump
                createExplosion(this.x + (this.nearWallLeft ? 0 : 30), this.y + 20, 5, 'JUMP');
            }
        }

        // Fast Fall
        if (down && !this.onGround && this.vy > 0) {
            this.vy += 1;
        }

        // Attacks
        if (attack && canMove) {
            this.initiateAttack(up, down, left || right);
        }

        // Specials
        if (special && canMove) {
            this.initiateSpecial(up, down, left || right);
        }
    }

    initiateAttack(up, down, side) {
        this.state = "ATTACK";
        this.attackFrame = 0;
        
        if (up) {
            this.currentAttack = { type: 'UP_TILT', duration: 20, damage: 8, kb: 8, angle: -Math.PI/2, w: 40, h: 50, ox: -5, oy: -30 };
        } else if (down && !this.onGround) {
            this.currentAttack = { type: 'DAIR', duration: 30, damage: 10, kb: 7, angle: Math.PI/2, w: 40, h: 40, ox: -5, oy: 20 };
        } else if (side || this.facing !== 0) {
            this.currentAttack = { type: 'F_TILT', duration: 20, damage: 9, kb: 7, angle: -Math.PI/4 * this.facing, w: 50, h: 30, ox: this.facing === 1 ? 20 : -40, oy: 5 };
        } else {
            // Increased duration slightly for better visual feedback
            this.currentAttack = { type: 'JAB', duration: 20, damage: 4, kb: 4, angle: -Math.PI/6 * this.facing, w: 40, h: 20, ox: this.facing === 1 ? 20 : -30, oy: 10 };
        }
    }

    initiateSpecial(up, down, side) {
        this.state = "SPECIAL";
        this.attackFrame = 0;

        if (up) {
            // Recovery
            // Added hitbox dimensions so it can hit enemies and render
            this.currentAttack = { 
                type: 'UP_SPECIAL', 
                duration: 40, 
                damage: 12, 
                kb: 10, 
                angle: -Math.PI/2,
                w: 40, h: 50, ox: -5, oy: -10 
            };
            this.vy = -12; // Boost up
            createExplosion(this.x + 15, this.y + 40, 15, 'FIRE');
        } else {
            // Fireball
            // Added visual dimensions for rendering the casting pose
            this.currentAttack = { 
                type: 'NEUTRAL_SPECIAL', 
                duration: 30,
                w: 30, h: 30, ox: this.facing === 1 ? 25 : -25, oy: 5
            };
            // Spawn projectile
            const projVk = this.facing * 8;
            gameState.projectiles.push(new Projectile(this.x + (this.facing===1?30:-10), this.y + 15, projVk, 0, this));
        }
    }

    processAttack(p) {
        this.attackFrame++;
        
        if (this.attackFrame > this.currentAttack.duration) {
            this.state = this.onGround ? "IDLE" : "FALL";
            this.currentAttack = null;
            return;
        }

        // Hitbox detection logic (Active frames usually in middle)
        if (this.currentAttack.type === 'NEUTRAL_SPECIAL') return; // Handled by projectile
        
        // Define active window (e.g., frame 5 to duration - 5)
        if (this.attackFrame >= 5 && this.attackFrame <= this.currentAttack.duration - 5) {
            // Create hitbox object
            const hitbox = {
                x: this.x + this.currentAttack.ox,
                y: this.y + this.currentAttack.oy,
                width: this.currentAttack.w,
                height: this.currentAttack.h
            };

            // Debug render hitbox
            // p.push(); p.noFill(); p.stroke(255, 0, 0); p.rect(hitbox.x, hitbox.y, hitbox.width, hitbox.height); p.pop();

            // Check vs Enemies
            gameState.enemies.forEach(enemy => {
                if (checkAttackCollision(hitbox, enemy)) {
                    // Apply hit
                    if (enemy.invincibleTimer <= 0) {
                        applyKnockback(enemy, this.x, this.y, this.currentAttack.kb, 
                            (this.currentAttack.angle !== undefined) ? (this.facing === -1 && this.currentAttack.type !== 'UP_TILT' && this.currentAttack.type !== 'DAIR' ? Math.PI - this.currentAttack.angle : this.currentAttack.angle) : -Math.PI/4, 
                            this.currentAttack.damage
                        );
                        enemy.invincibleTimer = 10; // Brief immunity to prevent multi-hit same frame
                        createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 5, 'HIT');
                        gameState.camera.shake = 5;
                    }
                }
            });
        }
    }

    render(p) {
        p.push();
        // Invincibility flicker
        if (this.invincible && p.frameCount % 4 < 2) p.tint(255, 100);

        // Visual feedback for attack startup (white flash)
        if ((this.state === "ATTACK" || this.state === "SPECIAL") && this.attackFrame < 5) {
            p.fill(255, 255, 200); // Light flash
        } else {
            p.fill(this.color);
        }

        // Body
        p.noStroke();
        p.rect(this.x, this.y, this.width, this.height, 5);

        // Mane/Fire
        p.fill(COLORS.PLAYER.MANE);
        p.circle(this.x + this.width/2, this.y + 5, 25);

        // Eyes
        p.fill(255);
        if (this.facing === 1) {
            p.circle(this.x + 20, this.y + 10, 6);
        } else {
            p.circle(this.x + 10, this.y + 10, 6);
        }

        // Attack Visuals (Hitbox rendering)
        // Now renders for both ATTACK and SPECIAL states
        if ((this.state === "ATTACK" || this.state === "SPECIAL") && this.currentAttack) {
            // Only draw the "fire" hitbox during active frames
            if (this.attackFrame >= 5 && this.attackFrame <= this.currentAttack.duration - 5) {
                p.fill(COLORS.PLAYER.FIRE);
                // Draw swipe based on attack type
                const hx = this.x + this.currentAttack.ox;
                const hy = this.y + this.currentAttack.oy;
                p.rect(hx, hy, this.currentAttack.w, this.currentAttack.h);
            }
        }

        p.pop();
    }
}

// Enemy Class
export class Enemy extends Fighter {
    constructor(x, y) {
        super(x, y, 30, 30);
        this.speed = 2;
        this.stocks = 1;
        this.attackCooldown = 0;
    }

    update(p) {
        this.aiBehavior(p);
        super.update(p);
    }

    aiBehavior(p) {
        if (this.state === "STUN" || this.state === "DEAD") return;

        const player = gameState.player;
        if (!player) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // Move towards player
        if (Math.abs(dx) > 40) {
            if (dx > 0) {
                this.vx += 0.5;
                if (this.vx > this.speed) this.vx = this.speed;
                this.facing = 1;
            } else {
                this.vx -= 0.5;
                if (this.vx < -this.speed) this.vx = -this.speed;
                this.facing = -1;
            }
        } else {
            this.vx *= 0.8;
        }

        // Jump if player is above or to cross gaps
        if (dy < -50 && this.onGround && Math.random() < 0.05) {
            this.vy = PHYSICS.JUMP_FORCE;
            this.onGround = false;
        }

        // Attack
        if (dist < 50 && this.attackCooldown <= 0) {
            // Simple tackle
            this.vx = (dx > 0 ? 1 : -1) * 8;
            this.vy = -2;
            this.attackCooldown = 60;
            
            // Hitbox check
            if (Math.abs(dx) < 40 && Math.abs(dy) < 40) {
                 if (player.invincibleTimer <= 0) {
                     applyKnockback(player, this.x, this.y, 6, Math.atan2(dy, dx), 5);
                     player.invincibleTimer = 30;
                     gameState.camera.shake = 5;
                 }
            }
        }

        if (this.attackCooldown > 0) this.attackCooldown--;
    }

    render(p) {
        p.push();
        p.fill(COLORS.ENEMY.BODY);
        p.rect(this.x, this.y, this.width, this.height, 4);
        
        // Eyes
        p.fill(COLORS.ENEMY.EYES);
        p.rect(this.x + 5, this.y + 8, 8, 4);
        p.rect(this.x + 17, this.y + 8, 8, 4);

        // Damage overlay
        if (this.damagePercent > 50) {
            p.fill(255, 0, 0, 100);
            p.rect(this.x, this.y, this.width, this.height);
        }

        p.pop();
    }
}

// Projectile Class
export class Projectile extends Entity {
    constructor(x, y, vx, vy, owner) {
        super(x, y, 15, 15);
        this.vx = vx;
        this.vy = vy;
        this.owner = owner; // Usually player
        this.life = 60;
        this.gravityScale = 0; // Fly straight
    }

    update(p) {
        this.life--;
        if (this.life <= 0) {
            this.toRemove = true;
            return;
        }

        this.x += this.vx;
        this.y += this.vy;
        
        // Create trail
        if (p.frameCount % 4 === 0) {
            createExplosion(this.x + 7, this.y + 7, 1, 'FIRE');
        }

        // Check collision with Enemies
        gameState.enemies.forEach(enemy => {
            if (checkAABB(this, enemy)) {
                if (enemy.invincibleTimer <= 0) {
                    applyKnockback(enemy, this.x, this.y, 6, Math.atan2(enemy.y - this.y, enemy.x - this.x), 6);
                    enemy.invincibleTimer = 10;
                    this.toRemove = true;
                    createExplosion(this.x, this.y, 5, 'FIRE');
                }
            }
        });

        // Bounds
        if (checkBlastZone(this)) this.toRemove = true;
    }

    render(p) {
        p.fill(255, 150, 0);
        p.circle(this.x + 7, this.y + 7, 14);
        p.fill(255, 255, 0);
        p.circle(this.x + 7, this.y + 7, 8);
    }
}