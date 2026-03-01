/**
 * Core entity definitions: Player, Enemy, Platform, Collectible.
 * Each entity manages its own update and render logic.
 */
import { 
    gameState, 
    COLORS, 
    CANVAS_WIDTH, 
    CANVAS_HEIGHT, 
    GRAVITY, 
    FRICTION 
} from './globals.js';
import { checkAABB, resolvePlatformCollision, applyPhysics, checkRectCircle } from './physics.js';
import { isKeyDown, isKeyPressed } from './input.js';
import { spawnParticles } from './particles.js';

// Base Entity Class
class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.active = true;
        this.color = '#fff';
    }

    update(p) {}
    
    render(p) {
        if (!this.active) return;
        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;
        
        // Simple visibility check
        if (screenX + this.width < 0 || screenX > CANVAS_WIDTH ||
            screenY + this.height < 0 || screenY > CANVAS_HEIGHT) return;

        p.fill(this.color);
        p.noStroke();
        p.rect(screenX, screenY, this.width, this.height);
    }
}

// ------------------------------------------------------------------
// PLAYER CLASS
// ------------------------------------------------------------------
export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 30, 30);
        this.color = COLORS.player;
        this.speed = 5;
        this.jumpForce = -12;
        this.onGround = false;
        this.facing = 1; // 1 = right, -1 = left
        this.health = 100;
        this.maxHealth = 100;
        this.invincible = false;
        this.invincibleTimer = 0;
        
        // Abilities
        this.canDash = false;
        this.dashCooldown = 0;
        this.isDashing = false;
        
        this.animTimer = 0;
    }

    update(p) {
        // 1. Input Handling
        if (gameState.controlMode === "HUMAN" || gameState.controlMode.startsWith("TEST")) {
            // Horizontal Movement
            if (isKeyDown(37)) { // Left
                this.vx -= 1; // Acceleration
                this.facing = -1;
            } else if (isKeyDown(39)) { // Right
                this.vx += 1; // Acceleration
                this.facing = 1;
            } else {
                // Friction
                this.vx *= FRICTION;
            }

            // Cap Speed
            const maxSpd = this.isDashing ? 12 : this.speed;
            this.vx = p.constrain(this.vx, -maxSpd, maxSpd);

            // Jump
            if (isKeyDown(32) && this.onGround) {
                this.vy = this.jumpForce;
                this.onGround = false;
                spawnParticles(this.x + this.width/2, this.y + this.height, 'DUST', 5);
            }

            // Dash Ability (Shift)
            if (isKeyDown(16) && this.canDash && this.dashCooldown <= 0) {
                this.performDash();
            }
        }

        // 2. Physics
        applyPhysics(this);
        
        // Update horizontal pos
        this.x += this.vx;
        
        // Dash cleanup
        if (this.isDashing) {
            this.vx = this.facing * 15; // Force dash speed
            this.vy = 0; // Anti-gravity during dash
            if (p.frameCount % 5 === 0) {
                spawnParticles(this.x + this.width/2, this.y + this.height/2, 'DUST', 2);
            }
        }
        
        // Cooldowns
        if (this.dashCooldown > 0) this.dashCooldown--;
        if (this.isDashing && this.dashCooldown < 45) this.isDashing = false; // Dash lasts 15 frames (60 - 45)

        // Invincibility
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }

        // 3. Environment Collisions
        this.onGround = false;
        for (let plat of gameState.platforms) {
            resolvePlatformCollision(this, plat);
        }

        // 4. Entity Interactions
        this.checkEntityCollisions(p);

        // 5. World Bounds (Death Pit)
        if (this.y > gameState.worldHeight + 100) {
            this.die();
        }

        // Animation State
        this.animTimer++;
    }

    performDash() {
        this.isDashing = true;
        this.dashCooldown = 60; // 1 second cooldown
        spawnParticles(this.x + this.width/2, this.y + this.height/2, 'EXPLOSION', 10);
    }

    checkEntityCollisions(p) {
        // Collectibles
        for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
            let item = gameState.collectibles[i];
            if (checkRectCircle(this, item)) {
                item.collect();
                gameState.collectibles.splice(i, 1);
            }
        }

        // Enemies
        if (!this.invincible) {
            for (let enemy of gameState.enemies) {
                if (checkAABB(this, enemy)) {
                    // Goomba Stomp Logic
                    if (this.vy > 0 && this.y + this.height - this.vy < enemy.y + enemy.height / 2) {
                        // Success stomp
                        enemy.die();
                        this.vy = -8; // Bounce
                        spawnParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 'EXPLOSION', 8);
                        gameState.score += 50;
                    } else if (this.isDashing) {
                        // Dash kill
                        enemy.die();
                        spawnParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, 'EXPLOSION', 12);
                        gameState.score += 50;
                    } else {
                        // Player hurt
                        this.takeDamage(20);
                        // Knockback
                        this.vx = -this.facing * 10;
                        this.vy = -5;
                    }
                }
            }
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.invincible = true;
        this.invincibleTimer = 60; // 1 second
        spawnParticles(this.x + this.width/2, this.y + this.height/2, 'EXPLOSION', 5);
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        gameState.gamePhase = "GAME_OVER_LOSE";
        spawnParticles(this.x + this.width/2, this.y + this.height/2, 'EXPLOSION', 20);
    }

    render(p) {
        const sx = this.x - gameState.camera.x;
        const sy = this.y - gameState.camera.y;

        p.push();
        p.translate(sx + this.width/2, sy + this.height/2);
        
        // Scale for facing and dash stretch
        let scaleX = this.facing;
        let scaleY = 1;
        
        // Squash and stretch
        if (Math.abs(this.vy) > 1) {
            scaleX *= 0.8;
            scaleY = 1.2;
        } else if (Math.abs(this.vx) > 1) {
            scaleX *= 1.1;
            scaleY = 0.9;
        }
        
        p.scale(scaleX, scaleY);

        // Blinking if invincible
        if (this.invincible && Math.floor(p.frameCount / 4) % 2 === 0) {
            p.fill(255, 100, 100, 100);
        } else {
            p.fill(this.color);
        }
        
        p.stroke(COLORS.player_outline);
        p.strokeWeight(2);
        
        // Body (Cat Box)
        p.rectMode(p.CENTER);
        p.rect(0, 0, this.width, this.height, 4);
        
        // Ears
        p.fill(this.color);
        p.triangle(-10, -15, -15, -25, -5, -15);
        p.triangle(10, -15, 15, -25, 5, -15);
        
        // Face
        p.noStroke();
        p.fill(0);
        // Eyes
        p.ellipse(-5, -2, 4, 8);
        p.ellipse(5, -2, 4, 8);
        
        // Dash Effect Aura
        if (this.canDash) {
            p.noFill();
            p.stroke(COLORS.powerup);
            p.strokeWeight(1);
            p.circle(0, 0, 40 + Math.sin(p.frameCount * 0.2) * 5);
        }

        p.pop();
        
        // Log info
        if (p.logs && p.logs.player_info) {
            p.logs.player_info.push({
                x: this.x,
                y: this.y,
                vx: this.vx,
                vy: this.vy,
                health: this.health,
                frame: p.frameCount
            });
        }
    }
}

// ------------------------------------------------------------------
// ENEMY CLASS
// ------------------------------------------------------------------
export class Enemy extends Entity {
    constructor(x, y, type = 'PATROL') {
        super(x, y, 30, 30);
        this.color = COLORS.enemy;
        this.type = type; // PATROL, JUMP
        this.startX = x;
        this.patrolDist = 100;
        this.dir = 1;
        this.speed = 2;
        gameState.enemies.push(this);
    }

    update(p) {
        if (this.type === 'PATROL') {
            this.x += this.speed * this.dir;
            if (Math.abs(this.x - this.startX) > this.patrolDist) {
                this.dir *= -1;
            }
        } else if (this.type === 'JUMP') {
            // Jump periodically
            if (this.onGround && p.frameCount % 120 === 0) {
                this.vy = -8;
                this.onGround = false;
            }
            applyPhysics(this);
            // Handle ground collision for gravity
            this.onGround = false;
            for (let plat of gameState.platforms) {
                resolvePlatformCollision(this, plat);
            }
        }
    }
    
    die() {
        const idx = gameState.enemies.indexOf(this);
        if (idx > -1) gameState.enemies.splice(idx, 1);
    }

    render(p) {
        const sx = this.x - gameState.camera.x;
        const sy = this.y - gameState.camera.y;
        
        // Culling
        if (sx < -50 || sx > CANVAS_WIDTH + 50) return;

        p.push();
        p.translate(sx + this.width/2, sy + this.height/2);
        
        p.fill(this.color);
        p.stroke('#fff');
        p.strokeWeight(1);
        
        // Draw Spiky Enemy
        p.beginShape();
        const spikes = 8;
        for (let i = 0; i < Math.PI * 2; i += (Math.PI * 2) / spikes) {
            let r = this.width / 2;
            let rx = Math.cos(i) * r;
            let ry = Math.sin(i) * r;
            p.vertex(rx, ry);
            
            // Spike tip
            let r2 = r + 5;
            let rx2 = Math.cos(i + Math.PI/spikes) * r2;
            let ry2 = Math.sin(i + Math.PI/spikes) * r2;
            p.vertex(rx2, ry2);
        }
        p.endShape(p.CLOSE);
        
        // Eyes
        p.fill('#fff');
        p.circle(-5, -2, 8);
        p.circle(5, -2, 8);
        p.fill('#000');
        p.circle(-5, -2, 3);
        p.circle(5, -2, 3);
        
        p.pop();
    }
}

// ------------------------------------------------------------------
// PLATFORM CLASS
// ------------------------------------------------------------------
export class Platform extends Entity {
    constructor(x, y, w, h, type = 'NORMAL') {
        super(x, y, w, h);
        this.type = type; // NORMAL, ICE, BREAKABLE
        
        // Visuals
        if (type === 'NORMAL') this.color = COLORS.ground;
        if (type === 'ICE') this.color = '#a0e9ff';
        if (type === 'BREAKABLE') this.color = '#8d6e63';
        
        gameState.platforms.push(this);
    }
    
    render(p) {
        const sx = this.x - gameState.camera.x;
        const sy = this.y - gameState.camera.y;
        
        if (sx + this.width < 0 || sx > CANVAS_WIDTH) return;

        p.fill(this.color);
        if (this.type === 'NORMAL') {
            // Neon top border
            p.stroke(COLORS.ground_top);
            p.strokeWeight(3);
            p.rect(sx, sy, this.width, this.height);
            p.noStroke();
        } else {
            p.noStroke();
            p.rect(sx, sy, this.width, this.height);
        }
        
        // Texture details
        p.fill(255, 255, 255, 20);
        p.rect(sx, sy, this.width, 5); // Highlight
    }
}

// ------------------------------------------------------------------
// COLLECTIBLE CLASS
// ------------------------------------------------------------------
export class Collectible extends Entity {
    constructor(x, y, type = 'STAR') {
        super(x, y, 20, 20); // width/height mostly for AABB check radius
        this.radius = 10;
        this.type = type; // STAR, POWERUP_DASH
        
        if (type === 'STAR') this.color = COLORS.collectible;
        else this.color = COLORS.powerup;
        
        this.bobOffset = 0;
        this.initialY = y;
        gameState.collectibles.push(this);
    }
    
    update(p) {
        this.bobOffset = Math.sin(p.frameCount * 0.1) * 5;
        this.y = this.initialY + this.bobOffset;
    }

    collect() {
        if (this.type === 'STAR') {
            gameState.score += 100;
            gameState.starsCollected++;
            spawnParticles(this.x, this.y, 'COLLECT', 5);
        } else if (this.type === 'POWERUP_DASH') {
            gameState.score += 500;
            gameState.player.canDash = true;
            // Visual feedback
            spawnParticles(this.x, this.y, 'POWERUP', 10);
        } else if (this.type === 'PORTAL') {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
    }

    render(p) {
        const sx = this.x - gameState.camera.x;
        const sy = this.y - gameState.camera.y;
        
        if (sx < -20 || sx > CANVAS_WIDTH + 20) return;

        this.update(p); // Call update in render loop for bobbing animation

        p.push();
        p.translate(sx, sy);
        p.rotate(p.frameCount * 0.05);
        
        if (this.type === 'STAR') {
            p.fill(this.color);
            p.noStroke();
            // Draw Star
            p.beginShape();
            for (let i = 0; i < 5; i++) {
                let angle = Math.PI * 2 * i / 5 - Math.PI / 2;
                p.vertex(Math.cos(angle) * this.radius, Math.sin(angle) * this.radius);
                angle += Math.PI * 2 / 10;
                p.vertex(Math.cos(angle) * (this.radius/2), Math.sin(angle) * (this.radius/2));
            }
            p.endShape(p.CLOSE);
        } else if (this.type === 'POWERUP_DASH') {
            p.fill(this.color);
            p.stroke(255);
            p.strokeWeight(2);
            p.rectMode(p.CENTER);
            p.rect(0, 0, 15, 15);
            // Thunderbolt icon
            p.fill(0);
            p.noStroke();
            p.textSize(10);
            p.text("⚡", 0, 0);
        } else if (this.type === 'PORTAL') {
            // Portal rendering
            p.noFill();
            for(let i=0; i<3; i++) {
                p.stroke(255 - i*50, 0, 255);
                p.strokeWeight(2);
                const r = this.radius * 3 + Math.sin(p.frameCount * 0.1 + i) * 5;
                p.circle(0, 0, r);
            }
        }
        
        p.pop();
    }
}