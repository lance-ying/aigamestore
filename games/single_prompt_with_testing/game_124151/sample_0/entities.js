/**
 * entities.js
 * Definitions for Player, Enemy, and other game objects.
 */

import { gameState, COLORS, TILE_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Physics } from './physics.js';
import { Stats, CombatSystem } from './rpg_systems.js';
import { inputState } from './input.js';
import { createParticleExplosion } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

class Entity {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = radius;
        this.type = 'ENTITY';
        this.facing = 1; // 1 Right, -1 Left
        this.isDead = false;
        this.flashTime = 0;
        this.animationFrame = 0;
    }

    update() {
        Physics.applyMovement(this);
        if (this.flashTime > 0) this.flashTime--;
        this.animationFrame++;
    }

    render(p, cameraX, cameraY) {
        // Base render (override in children)
        p.fill(255);
        p.circle(this.x - cameraX, this.y - cameraY, this.radius * 2);
    }
    
    die() {
        this.isDead = true;
    }
}

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 15);
        this.type = 'PLAYER';
        this.stats = new Stats({
            maxHp: 150,
            maxMp: 60,
            strength: 15,
            speed: 4,
            defense: 2
        });
        
        // Combat State
        this.attackCooldown = 0;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.isAttacking = false;
        
        // Dash State
        this.isDashing = false;
        this.dashCooldown = 0;
        this.dashDuration = 0;
        this.dashVector = { x: 0, y: 0 };
    }

    update(p) {
        // AI Control Override for Testing
        let ctrl = inputState;
        if (gameState.controlMode !== "HUMAN") {
            const autoAction = get_automated_testing_action(gameState);
            if (autoAction) {
                // Map autoAction to inputState-like structure for internal logic
                ctrl = {
                    horizontal: 0,
                    vertical: 0,
                    attack: false,
                    skill: false,
                    dash: false
                };
                
                // Decode keyCode from test controller
                if (autoAction.keyCode === 37) ctrl.horizontal = -1;
                if (autoAction.keyCode === 39) ctrl.horizontal = 1;
                if (autoAction.keyCode === 38) ctrl.vertical = -1;
                if (autoAction.keyCode === 40) ctrl.vertical = 1;
                if (autoAction.keyCode === 32) ctrl.attack = true;
                if (autoAction.keyCode === 90) ctrl.skill = true;
                if (autoAction.keyCode === 16) ctrl.dash = true;
                
                // Diagonal normalization for AI
                if (ctrl.horizontal !== 0 && ctrl.vertical !== 0) {
                     ctrl.horizontal *= 0.707;
                     ctrl.vertical *= 0.707;
                }
            }
        }

        // Handle Cooldowns
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.comboTimer > 0) this.comboTimer--;
        if (this.comboTimer === 0) this.comboCount = 0; // Reset combo

        // Movement Logic
        if (this.isDashing) {
            this.dashDuration--;
            this.vx = this.dashVector.x * (this.stats.speed * 3);
            this.vy = this.dashVector.y * (this.stats.speed * 3);
            
            // Create afterimage particles
            if (this.dashDuration % 3 === 0) {
               // visuals handled in particle system or render
            }
            
            if (this.dashDuration <= 0) {
                this.isDashing = false;
                this.vx = 0;
                this.vy = 0;
            }
        } else if (!this.isAttacking || this.attackCooldown < 10) { 
            // Allow movement if not in heavy attack frame
            this.vx = ctrl.horizontal * this.stats.speed;
            this.vy = ctrl.vertical * this.stats.speed;
            
            // Friction applied in physics, but we override for crisp RPG movement
            // So we manually set velocity based on input here
        } else {
            // Stop during attack windup
            this.vx = 0;
            this.vy = 0;
        }

        // Update Direction
        if (ctrl.horizontal > 0) this.facing = 1;
        if (ctrl.horizontal < 0) this.facing = -1;

        // Action: Dash
        if (ctrl.dash && !this.isDashing && this.dashCooldown === 0 && (ctrl.horizontal !== 0 || ctrl.vertical !== 0)) {
            this.startDash(ctrl.horizontal, ctrl.vertical);
        }

        // Action: Attack
        if (ctrl.attack && this.attackCooldown === 0) {
            this.performAttack(p);
        }

        // Action: Skill
        if (ctrl.skill && this.stats.mp >= 20 && this.attackCooldown === 0) {
            this.performSkill(p);
        }
        
        // Base Physics Update
        super.update();
        Physics.resolveEntityCollisions(this); // Collide with enemies
        
        // Log player info
        if (p.frameCount % 30 === 0) {
            p.logs.player_info.push({
                x: this.x, y: this.y, hp: this.stats.hp, level: this.stats.level,
                framecount: p.frameCount, timestamp: Date.now()
            });
        }
        
        // Game Over Check
        if (this.stats.hp <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }

    startDash(dx, dy) {
        this.isDashing = true;
        this.dashDuration = 10;
        this.dashCooldown = 60;
        this.dashVector = { x: dx, y: dy };
    }

    performAttack(p) {
        this.isAttacking = true;
        this.attackCooldown = 20; // Frames between attacks
        this.comboTimer = 40;     // Window to continue combo
        this.comboCount++;
        
        if (this.comboCount > 3) this.comboCount = 1;

        // Determine hitbox position
        const range = 40;
        const hitX = this.x + (this.facing === 1 ? range : -range); // Simplified for side facing
        // Better 8-way hitbox? Keep it simple: Direction of facing or movement
        
        // Attack Hitbox Visual & Logic
        const hitbox = { x: this.x + (this.facing * 30), y: this.y, radius: 25 };
        
        // Check hits
        let hitSomething = false;
        gameState.entities.forEach(entity => {
            if (entity.type === 'ENEMY' && !entity.isDead) {
                if (Physics.checkCircleCollision(hitbox, entity)) {
                    // Combo damage multiplier
                    let mult = 1.0 + (this.comboCount * 0.2);
                    let dmg = CombatSystem.calculateDamage(this, entity, mult);
                    CombatSystem.applyHit(this, entity, dmg, p);
                    hitSomething = true;
                }
            }
        });

        // Visual Swing Effect
        createParticleExplosion(hitbox.x, hitbox.y, 3, COLORS.ui.xp);
    }
    
    performSkill(p) {
        this.stats.mp -= 20;
        this.attackCooldown = 45;
        this.isAttacking = true;
        
        // Spin Attack (AOE around player)
        const range = 60;
        
        createParticleExplosion(this.x, this.y, 20, COLORS.ui.mp); // Big blue explosion
        
        gameState.entities.forEach(entity => {
            if (entity.type === 'ENEMY' && !entity.isDead) {
                const dist = Math.sqrt(Math.pow(entity.x - this.x, 2) + Math.pow(entity.y - this.y, 2));
                if (dist < range + entity.radius) {
                    let dmg = CombatSystem.calculateDamage(this, entity, 2.0); // 2x Damage
                    CombatSystem.applyHit(this, entity, dmg, p);
                }
            }
        });
    }

    render(p, cameraX, cameraY) {
        p.push();
        p.translate(this.x - cameraX, this.y - cameraY);
        
        if (this.facing === -1) p.scale(-1, 1); // Flip horizontal
        
        // Flash if damaged
        if (this.flashTime > 0 && Math.floor(this.flashTime / 2) % 2 === 0) {
            p.tint(255, 0, 0); // Not working with shapes, manual color override
            p.fill(255, 100, 100);
        } else {
            p.fill(COLORS.player.skin);
        }

        // Shadow
        p.fill(0, 50);
        p.noStroke();
        p.ellipse(0, 15, 20, 8);

        // Body / Armor
        p.fill(COLORS.player.armor); // Armor
        p.stroke(0);
        p.strokeWeight(1);
        p.rect(-10, -10, 20, 25, 5); // Torso

        // Head
        p.fill(COLORS.player.skin);
        p.circle(0, -15, 20); // Head circle

        // Hair (Anime style spikes)
        p.fill(COLORS.player.hair);
        p.triangle(-12, -20, -5, -28, 0, -18);
        p.triangle(-5, -28, 5, -28, 0, -18);
        p.triangle(0, -18, 5, -28, 12, -20);
        
        // Face
        p.fill(0);
        p.circle(4, -15, 2); // Eye (side view-ish)
        
        // Weapon (Sword)
        p.push();
        if (this.isAttacking) {
            // Swing animation
            let swingProgress = 1 - (this.attackCooldown / 20);
            p.rotate(p.PI/2 + (swingProgress * p.PI)); 
            p.translate(15, 0);
        } else {
            // Idle hold
            p.rotate(-p.PI / 4);
            p.translate(15, 10);
        }
        
        // Blade
        p.fill(200);
        p.rect(0, -3, 30, 6);
        // Hilt
        p.fill(100);
        p.rect(-5, -4, 5, 8);
        p.pop();

        // Skill visual overlay (Spin)
        if (this.isAttacking && this.attackCooldown > 30) {
            p.noFill();
            p.stroke(COLORS.ui.mp);
            p.strokeWeight(3);
            p.circle(0, 0, 80 * Math.random());
        }

        p.pop();
    }
}

export class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y, type === 'BOSS' ? 40 : 15);
        this.enemyType = type; // SLIME, WOLF, BOSS
        this.type = 'ENEMY';
        
        // Stats based on type and current game level
        const scaling = 1 + (gameState.level * 0.2);
        
        if (type === 'SLIME') {
            this.stats = new Stats({ maxHp: 30 * scaling, strength: 5 * scaling, speed: 1.5, defense: 0 });
            this.xpValue = 20;
            this.color = COLORS.enemies.slime;
            this.attackRange = 25;
            this.detectRange = 250;
        } else if (type === 'WOLF') {
            this.stats = new Stats({ maxHp: 50 * scaling, strength: 10 * scaling, speed: 3.5, defense: 1 });
            this.xpValue = 45;
            this.color = COLORS.enemies.wolf;
            this.attackRange = 35;
            this.detectRange = 350;
        } else if (type === 'BOSS') {
            this.stats = new Stats({ maxHp: 500 * scaling, strength: 25 * scaling, speed: 2.0, defense: 5 });
            this.xpValue = 1000;
            this.color = COLORS.enemies.boss;
            this.attackRange = 60;
            this.detectRange = 600;
        }

        // AI State
        this.state = 'IDLE'; // IDLE, CHASE, ATTACK, COOLDOWN
        this.stateTimer = 0;
        this.target = null;
    }

    update(p) {
        super.update();
        if (this.isDead) return;

        // Target Player
        if (!this.target && gameState.player) {
            this.target = gameState.player;
        }

        if (this.target) {
            const dist = Math.sqrt(Math.pow(this.target.x - this.x, 2) + Math.pow(this.target.y - this.y, 2));

            // State Machine
            switch (this.state) {
                case 'IDLE':
                    if (dist < this.detectRange) {
                        this.state = 'CHASE';
                    } else {
                        // Random wander
                        if (p.frameCount % 60 === 0) {
                            this.vx = (Math.random() - 0.5) * this.stats.speed;
                            this.vy = (Math.random() - 0.5) * this.stats.speed;
                        }
                    }
                    break;
                    
                case 'CHASE':
                    if (dist > this.detectRange * 1.5) {
                        this.state = 'IDLE';
                        this.vx = 0; this.vy = 0;
                    } else if (dist < this.attackRange) {
                        this.state = 'ATTACK';
                        this.stateTimer = 30; // Windup
                        this.vx = 0; this.vy = 0;
                    } else {
                        // Move towards player
                        const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                        this.vx = Math.cos(angle) * this.stats.speed;
                        this.vy = Math.sin(angle) * this.stats.speed;
                        
                        // Face player
                        this.facing = this.vx > 0 ? 1 : -1;
                    }
                    break;
                    
                case 'ATTACK':
                    this.stateTimer--;
                    if (this.stateTimer <= 0) {
                        // Execute Attack
                        if (dist < this.attackRange + 10) { // If still close enough
                            let dmg = CombatSystem.calculateDamage(this, this.target);
                            CombatSystem.applyHit(this, this.target, dmg, p);
                        }
                        this.state = 'COOLDOWN';
                        this.stateTimer = 60; // 1s cooldown
                    }
                    break;
                    
                case 'COOLDOWN':
                    this.stateTimer--;
                    if (this.stateTimer <= 0) {
                        this.state = 'CHASE';
                    }
                    break;
            }
        }
        
        // Separate from other enemies
        Physics.resolveEntityCollisions(this);
    }
    
    die() {
        super.die();
        // Drop loot or chance (simple potion logic could go here)
        if (this.enemyType === 'BOSS') {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
    }

    render(p, cameraX, cameraY) {
        if (this.isDead) return;
        
        p.push();
        p.translate(this.x - cameraX, this.y - cameraY);
        
        if (this.flashTime > 0) p.fill(255);
        else p.fill(this.color);
        
        p.stroke(0);
        p.strokeWeight(1);
        
        // Render based on type
        if (this.enemyType === 'SLIME') {
            // Wobble effect
            let wobble = Math.sin(p.frameCount * 0.2) * 2;
            p.ellipse(0, 0, this.radius * 2 + wobble, this.radius * 2 - wobble);
            // Face
            p.fill(0);
            p.circle(-5, -2, 3);
            p.circle(5, -2, 3);
        } else if (this.enemyType === 'WOLF') {
            if (this.facing === -1) p.scale(-1, 1);
            p.rect(-10, -10, 20, 15); // Body
            p.circle(10, -10, 12); // Head
            p.fill(255, 0, 0);
            p.circle(12, -12, 3); // Red eye
        } else if (this.enemyType === 'BOSS') {
            // Big menacing spikey thing
            p.beginShape();
            for (let i = 0; i < 8; i++) {
                let angle = (i / 8) * p.TWO_PI + (p.frameCount * 0.05);
                let r = this.radius + (i % 2 === 0 ? 10 : 0);
                p.vertex(Math.cos(angle) * r, Math.sin(angle) * r);
            }
            p.endShape(p.CLOSE);
            
            // Health bar for boss
            p.fill(50);
            p.rect(-30, -50, 60, 8);
            p.fill(255, 0, 0);
            p.rect(-30, -50, 60 * (this.stats.hp / this.stats.maxHp), 8);
        }
        
        // Attack warning
        if (this.state === 'ATTACK') {
            p.noFill();
            p.stroke(255, 0, 0);
            p.circle(0, 0, this.stateTimer); // Shrinking circle
        }

        p.pop();
    }
}