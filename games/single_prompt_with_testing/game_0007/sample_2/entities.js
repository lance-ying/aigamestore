import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, COLORS, LEVEL_CONFIG } from './globals.js';
import { applyPhysics } from './physics.js';
import { createExplosion, createDust } from './particles.js';

class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = 0;
        this.height = 0;
        this.markedForDeletion = false;
        this.color = [255, 255, 255];
    }
    
    update(p) {}
    render(p) {}
}

export class Player extends Entity {
    constructor(x, y) {
        super(x, y);
        this.width = 40;
        this.height = 60;
        this.baseHeight = 60;
        this.duckHeight = 35;
        
        this.speed = 0.5;
        this.maxSpeed = 6;
        this.jumpForce = -14;
        this.onGround = false;
        
        this.health = 3;
        this.maxHealth = 3;
        this.facing = 1; // 1 Right, -1 Left
        
        this.isDashing = false;
        this.dashCooldown = 0;
        this.shootCooldown = 0;
        
        this.invulnerable = 0;
        this.blinkTimer = 0;
        
        this.animFrame = 0; // For boiling line animation
    }
    
    update(p) {
        // Physics
        if (!this.isDashing) {
            applyPhysics(this);
        } else {
            // Dash physics
            this.x += this.vx;
            this.dashTimer--;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
                this.vx = 0;
                this.vy = 0;
            }
        }
        
        // Ground Collision
        if (this.y + this.height/2 >= GROUND_Y) {
            this.y = GROUND_Y - this.height/2;
            this.vy = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }
        
        // Cooldowns
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.invulnerable > 0) this.invulnerable--;
        
        // Animation
        this.animFrame++;
    }
    
    moveLeft() {
        if (this.isDashing) return;
        this.vx -= this.speed;
        if (this.vx < -this.maxSpeed) this.vx = -this.maxSpeed;
        this.facing = -1;
    }
    
    moveRight() {
        if (this.isDashing) return;
        this.vx += this.speed;
        if (this.vx > this.maxSpeed) this.vx = this.maxSpeed;
        this.facing = 1;
    }
    
    duck() {
        if (this.onGround) {
            this.height = this.duckHeight;
            // Shift y down so feet stay on ground
            // Actually, physics handles center, so we need to adjust visual/hitbox
        }
    }
    
    standUp() {
        if (this.height !== this.baseHeight && !this.checkCeiling()) {
             this.height = this.baseHeight;
             // Push up if stuck in floor? Physics handles it next frame
        }
    }
    
    checkCeiling() { return false; } // For now
    
    jump() {
        if (this.onGround && !this.isDashing) {
            this.vy = this.jumpForce;
            this.onGround = false;
            createDust(this.x, this.y + this.height/2);
        }
    }
    
    dash() {
        if (this.dashCooldown <= 0 && !this.isDashing) {
            this.isDashing = true;
            this.dashTimer = 10;
            this.dashCooldown = 60;
            this.vx = this.facing * 15;
            this.vy = 0;
            this.invulnerable = 15; // I-frames during dash
            createDust(this.x, this.y);
        }
    }
    
    shoot(p) {
        if (this.shootCooldown <= 0) {
            const projX = this.x + (this.facing * (this.width/2 + 10));
            const projY = this.y - 10;
            new Projectile(projX, projY, this.facing * 12, 0, 'PLAYER');
            this.shootCooldown = 10;
        }
    }
    
    takeDamage(amount) {
        if (this.invulnerable > 0) return;
        
        this.health -= amount;
        this.invulnerable = 60; // 1 second invulnerability
        gameState.screenShake = 10;
        
        if (this.health <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }
    
    render(p) {
        if (this.invulnerable > 0) {
            this.blinkTimer++;
            if (this.blinkTimer % 4 < 2) return; // Blink effect
        }
        
        p.push();
        p.translate(this.x, this.y);
        p.scale(this.facing, 1);
        
        // Draw vintage cup character
        p.stroke(0);
        p.strokeWeight(2);
        
        // Boiling line effect helper
        const wobble = () => p.random(-1, 1);
        
        // Legs
        p.stroke(COLORS.PLAYER.SHOES);
        p.line(-5, 20, -10 + wobble(), 30 + wobble());
        p.line(5, 20, 10 + wobble(), 30 + wobble());
        
        // Shoes
        p.fill(COLORS.PLAYER.SHOES);
        p.noStroke();
        p.ellipse(-12, 32, 15, 10);
        p.ellipse(12, 32, 15, 10);
        
        // Shorts (Red)
        p.fill(COLORS.PLAYER.SHORTS);
        p.stroke(0);
        p.rectMode(p.CENTER);
        p.rect(0, 15, 25 + wobble(), 20 + wobble(), 5);
        
        // Body/Head (Cup)
        p.fill(COLORS.PLAYER.HEAD);
        p.stroke(0);
        // Cup shape
        p.beginShape();
        p.vertex(-15 + wobble(), -25 + wobble()); // Top Left
        p.vertex(15 + wobble(), -25 + wobble());  // Top Right
        p.vertex(12 + wobble(), 5 + wobble());   // Bottom Right
        p.bezierVertex(10, 15, -10, 15, -12 + wobble(), 5 + wobble()); // Bottom curve
        p.endShape(p.CLOSE);
        
        // Handle
        p.noFill();
        p.strokeWeight(3);
        p.arc(-15, -10, 15, 15, p.PI/2, 3*p.PI/2);
        
        // Straw
        p.stroke(COLORS.PLAYER.STRAW);
        p.strokeWeight(4);
        p.line(5, -25, 10 + wobble(), -35 + wobble());
        p.line(10, -35, 2 + wobble(), -40 + wobble()); // Bent part
        
        // Face
        p.fill(0);
        p.noStroke();
        // Eyes (Pacman style eyes)
        p.arc(5, -15, 6, 10, 0, p.TWO_PI);
        p.arc(-2, -15, 6, 10, 0, p.TWO_PI);
        // Nose
        p.fill(COLORS.PLAYER.STRAW);
        p.circle(2, -8, 4);
        // Smile
        p.noFill();
        p.stroke(0);
        p.strokeWeight(1);
        p.arc(2, -2, 10, 8, 0, p.PI);
        
        p.pop();
        
        // Debug Hitbox
        // p.noFill(); p.stroke(255, 0, 0); p.rectMode(p.CENTER); p.rect(this.x, this.y, this.width, this.height);
    }
}

export class Boss extends Entity {
    constructor(x, y, level = 1) {
        super(x, y);
        this.width = 120;
        this.height = 140;
        this.radius = 60;
        
        // Configure based on level
        this.level = level;
        const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];
        
        this.health = config.health;
        this.maxHealth = config.health;
        this.attackSpeed = config.attackSpeed;
        this.projectileSpeed = config.projectileSpeed;
        this.allowedAttacks = config.allowedAttacks;
        this.phase2Threshold = config.phase2Health;
        this.phase3Threshold = config.phase3Health;
        
        this.state = "IDLE"; // IDLE, ATTACK_SPIT, ATTACK_SLAM, ATTACK_ROOTS
        this.stateTimer = 0;
        
        this.phase = 1;
        
        // Bobbing animation
        this.startY = y;
        this.bobOffset = 0;
        
        // Face state
        this.faceState = "ANGRY"; 
    }
    
    update(p) {
        // Simple state machine
        this.stateTimer++;
        
        // Idle Bobbing
        this.bobOffset = p.sin(p.frameCount * 0.05) * 10;
        this.y = this.startY + this.bobOffset;
        
        if (this.state === "IDLE") {
            if (this.stateTimer > this.attackSpeed) {
                // Choose attack based on phase and random
                const rand = p.random();
                const availableAttacks = this.allowedAttacks.slice();
                
                if (availableAttacks.includes('SPIT') && rand < 0.4) {
                    this.startAttackSpit();
                } else if (availableAttacks.includes('SLAM') && rand < 0.7 && this.phase > 1) {
                    this.startAttackSlam();
                } else if (availableAttacks.includes('ROOTS') && this.phase > 1) {
                    this.startAttackRoots();
                } else {
                    this.startAttackSpit();
                }
            }
        } else if (this.state === "ATTACK_SPIT") {
            const shotTiming = this.level >= 7 ? 20 : 30;
            if (this.stateTimer === shotTiming || this.stateTimer === shotTiming*2 || (this.phase > 2 && this.stateTimer === shotTiming*3)) {
                this.fireProjectile(p);
            }
            if (this.stateTimer > 120) {
                this.state = "IDLE";
                this.stateTimer = 0;
            }
        } else if (this.state === "ATTACK_SLAM") {
            // Jump up and slam down
            if (this.stateTimer === 20) {
                this.startY -= 100; // Jump
            }
            if (this.stateTimer === 60) {
                this.startY += 100; // Slam
                gameState.screenShake = 20;
                // Shockwave logic would go here (spawn projectiles left/right on ground)
                new Projectile(this.x - 50, GROUND_Y - 20, -5, 0, 'BOSS_SHOCKWAVE');
                if (this.level >= 4) {
                    new Projectile(this.x + 50, GROUND_Y - 20, 5, 0, 'BOSS_SHOCKWAVE');
                }
            }
            if (this.stateTimer > 100) {
                this.state = "IDLE";
                this.stateTimer = 0;
            }
        } else if (this.state === "ATTACK_ROOTS") {
            // Telegraph roots
            if (this.stateTimer % 30 === 0 && this.stateTimer < 90) {
                // Spawn warning particles under player?
            }
            if (this.stateTimer === 100) {
                // Spawn root damage zone at player X
                if (gameState.player) {
                    new Projectile(gameState.player.x, GROUND_Y, 0, -2, 'BOSS_ROOT');
                    if (this.level >= 6) {
                        new Projectile(gameState.player.x - 80, GROUND_Y, 0, -2, 'BOSS_ROOT');
                        new Projectile(gameState.player.x + 80, GROUND_Y, 0, -2, 'BOSS_ROOT');
                    }
                }
            }
            if (this.stateTimer > 150) {
                this.state = "IDLE";
                this.stateTimer = 0;
            }
        }
        
        // Check health for phase transition
        if (this.health < this.phase2Threshold && this.phase === 1) this.phase = 2;
        if (this.health < this.phase3Threshold && this.phase === 2) this.phase = 3;
        
        if (this.health <= 0) {
            if (gameState.currentLevel >= gameState.maxLevel) {
                gameState.gamePhase = "GAME_OVER_WIN";
            } else {
                gameState.gamePhase = "LEVEL_COMPLETE";
            }
            createExplosion(this.x, this.y, 20);
        }
    }
    
    startAttackSpit() {
        this.state = "ATTACK_SPIT";
        this.stateTimer = 0;
        this.faceState = "MOUTH_OPEN";
    }
    
    startAttackSlam() {
        this.state = "ATTACK_SLAM";
        this.stateTimer = 0;
        this.faceState = "GRIMACE";
    }
    
    startAttackRoots() {
        this.state = "ATTACK_ROOTS";
        this.stateTimer = 0;
        this.faceState = "CONCENTRATE";
    }
    
    fireProjectile(p) {
        // Aim at player
        const player = gameState.player;
        if (!player) return;
        
        const dx = player.x - (this.x - 40);
        const dy = player.y - (this.y + 20);
        const dist = Math.sqrt(dx*dx + dy*dy);
        const speed = this.projectileSpeed;
        
        new Projectile(this.x - 40, this.y + 20, (dx/dist)*speed, (dy/dist)*speed, 'BOSS');
    }
    
    takeDamage(amount) {
        this.health -= amount;
        this.flashTimer = 5;
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        if (this.flashTimer > 0) {
            p.tint(255, 100, 100); // Red flash
            this.flashTimer--;
        }
        
        const wobble = () => p.random(-2, 2);
        
        // Radish Body
        p.fill(COLORS.BOSS.SKIN);
        p.stroke(0);
        p.strokeWeight(3);
        
        p.beginShape();
        p.vertex(0, -60 + wobble()); // Top center
        p.bezierVertex(60, -60, 70, 0, 60 + wobble(), 60 + wobble()); // Right side
        p.bezierVertex(20, 90, -20, 90, -60 + wobble(), 60 + wobble()); // Bottom / Left side
        p.bezierVertex(-70, 0, -60, -60, 0, -60 + wobble()); // Left / Top
        p.endShape(p.CLOSE);
        
        // Leaves (Hair)
        p.fill(COLORS.BOSS.LEAVES);
        p.beginShape();
        p.vertex(-10, -60);
        p.bezierVertex(-40, -100, -80, -80, -20, -60);
        p.vertex(0, -55);
        p.bezierVertex(20, -110, 80, -90, 10, -60);
        p.endShape();
        
        // Face
        p.fill(255);
        p.stroke(0);
        p.strokeWeight(2);
        
        // Eyes
        p.ellipse(-25, -20, 25, 30);
        p.ellipse(25, -20, 25, 30);
        
        p.fill(0);
        // Pupils look at player
        let lookX = 0;
        if (gameState.player) {
            lookX = (gameState.player.x - this.x) * 0.05;
            lookX = p.constrain(lookX, -10, 10);
        }
        p.circle(-25 + lookX, -20, 5);
        p.circle(25 + lookX, -20, 5);
        
        // Brows
        p.strokeWeight(4);
        p.noFill();
        p.stroke(0);
        p.line(-40, -40, -10, -30); // Angry
        p.line(40, -40, 10, -30);
        
        // Mouth
        p.fill(0);
        if (this.state === "ATTACK_SPIT") {
             p.circle(0, 20, 30); // Open mouth
        } else {
             // Tooth grin
             p.fill(255);
             p.rectMode(p.CENTER);
             p.rect(0, 20, 60, 20, 5);
             p.line(-30, 20, 30, 20); // Teeth line
             p.line(0, 10, 0, 30);
             p.line(-15, 10, -15, 30);
             p.line(15, 10, 15, 30);
        }

        p.pop();
        
        // Health Bar (Boss)
        const hpPct = this.health / this.maxHealth;
        p.noStroke();
        p.fill(100);
        p.rect(CANVAS_WIDTH/2, CANVAS_HEIGHT - 20, 400, 10);
        p.fill(COLORS.BOSS.SKIN);
        p.rectMode(p.CORNER);
        p.rect(CANVAS_WIDTH/2 - 200, CANVAS_HEIGHT - 25, 400 * hpPct, 10);
        p.rectMode(p.CENTER);
    }
}

export class Projectile extends Entity {
    constructor(x, y, vx, vy, type) {
        super(x, y);
        this.vx = vx;
        this.vy = vy;
        this.type = type; // 'PLAYER', 'BOSS', 'BOSS_SHOCKWAVE', 'BOSS_ROOT'
        
        if (type === 'PLAYER') {
            this.width = 20;
            this.height = 10;
            this.damage = 1;
            this.color = COLORS.PROJECTILE_PLAYER;
        } else if (type === 'BOSS') {
            this.width = 20;
            this.height = 20;
            this.damage = 1;
            this.color = COLORS.BOSS.DIRT;
        } else if (type === 'BOSS_SHOCKWAVE') {
            this.width = 30;
            this.height = 60;
            this.damage = 1;
            this.color = [255, 200, 100];
        } else if (type === 'BOSS_ROOT') {
            this.width = 40;
            this.height = 100;
            this.damage = 1;
            this.lifetime = 60;
            this.vy = -10; // shoot up
            this.color = COLORS.BOSS.LEAVES;
        }
        
        gameState.projectiles.push(this);
    }
    
    update(p) {
        this.x += this.vx;
        this.y += this.vy;
        
        // Screen bounds cleanup
        if (this.x < -50 || this.x > CANVAS_WIDTH + 50 || this.y < -50 || this.y > CANVAS_HEIGHT + 50) {
            this.markedForDeletion = true;
        }
        
        // Logic for specialized projectiles
        if (this.type === 'BOSS_ROOT') {
            // Stop rising at some point
            if (this.y < GROUND_Y - 80) this.vy = 0;
            this.lifetime--;
            if (this.lifetime <= 0) this.markedForDeletion = true;
        }
        
        if (this.type === 'BOSS_SHOCKWAVE') {
            // Stay on ground
             if (this.y + this.height/2 < GROUND_Y) this.vy += 0.5; // gravity
             else { this.y = GROUND_Y - this.height/2; this.vy = 0; }
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.fill(this.color);
        p.noStroke();
        
        if (this.type === 'PLAYER') {
            // Finger gun blast shape
            p.ellipse(0, 0, 20, 10);
            p.fill(255);
            p.ellipse(-5, -2, 10, 4);
        } else if (this.type === 'BOSS') {
            // Dirt clod
            p.circle(0, 0, 15);
            p.fill(80, 60, 40);
            p.circle(3, 3, 5);
        } else if (this.type === 'BOSS_SHOCKWAVE') {
            // Energy wave
            p.arc(0, 20, 30, 60, p.PI, 0);
        } else if (this.type === 'BOSS_ROOT') {
            // Spiky root
            p.triangle(-10, 50, 10, 50, 0, -40);
        }
        
        p.pop();
    }
}