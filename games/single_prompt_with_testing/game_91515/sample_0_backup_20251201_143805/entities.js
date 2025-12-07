import { 
    gameState, CANVAS_WIDTH, CANVAS_HEIGHT, 
    GRAVITY, FRICTION, MECH_SPEED, CAT_SPEED, 
    MECH_JUMP_FORCE, CAT_JUMP_FORCE,
    MECH_WIDTH, MECH_HEIGHT, CAT_WIDTH, CAT_HEIGHT
} from './globals.js';
import { checkCollisions, checkEntityCollision } from './physics.js';
import { spawnExplosion, Particle } from './particles.js';

export class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.vx = 0;
        this.vy = 0;
        this.prevX = x;
        this.prevY = y;
        this.onGround = false;
        this.dead = false;
    }
    
    updatePhysics() {
        this.prevX = this.x;
        this.prevY = this.y;
        
        this.vy += GRAVITY;
        
        this.x += this.vx;
        this.y += this.vy;
        
        checkCollisions(this);
    }
    
    renderAt(p, screenX, screenY) {
        // Base render
        p.fill(255);
        p.rect(screenX, screenY, this.width, this.height);
    }
}

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, MECH_WIDTH, MECH_HEIGHT);
        this.mode = 'MECH'; // 'MECH' or 'CAT'
        this.facing = 1; // 1 = right, -1 = left
        this.mechHealth = 100;
        this.catHealth = 3; // 3 hits
        this.invincibleTimer = 0;
        this.cooldown = 0;
        
        // Track the empty mech entity
        this.emptyMech = null;
    }
    
    handleInput(inputs) {
        const speed = this.mode === 'MECH' ? MECH_SPEED : CAT_SPEED;
        const jumpForce = this.mode === 'MECH' ? MECH_JUMP_FORCE : CAT_JUMP_FORCE;
        
        // Horizontal Movement
        if (inputs.left) {
            this.vx = -speed;
            this.facing = -1;
        } else if (inputs.right) {
            this.vx = speed;
            this.facing = 1;
        } else {
            this.vx *= FRICTION;
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
        }
        
        // Jump
        if (inputs.jump && this.onGround) {
            this.vy = jumpForce;
            this.onGround = false;
            // Spawn jump particles
            gameState.particles.push(new Particle(this.x + this.width/2, this.y + this.height, 'JUMP_DUST'));
        }
        
        // Eject / Enter Mech
        if (inputs.action && this.cooldown <= 0) {
            this.toggleMode();
            this.cooldown = 30;
        }
        
        // Fire
        if (inputs.fire && this.cooldown <= 0) {
            if (this.mode === 'MECH') {
                this.fireWeapon();
                this.cooldown = 15;
            } else {
                // Cat Meow (visual effect only)
                gameState.particles.push(new Particle(this.x + (this.facing > 0 ? this.width : 0), this.y, 'SPARK'));
                this.cooldown = 20;
            }
        }
    }
    
    fireWeapon() {
        const px = this.facing === 1 ? this.x + this.width : this.x - 10;
        const py = this.y + 15;
        gameState.projectiles.push(new Projectile(px, py, this.facing));
        gameState.cameraShake = 2;
    }
    
    toggleMode() {
        if (this.mode === 'MECH') {
            // Eject
            this.mode = 'CAT';
            
            // Create empty mech entity at current position
            this.emptyMech = new EmptyMech(this.x, this.y, this.mechHealth);
            gameState.entities.push(this.emptyMech);
            
            // Resize player to cat
            this.width = CAT_WIDTH;
            this.height = CAT_HEIGHT;
            
            // Reposition cat to center of mech
            this.x = this.x + (MECH_WIDTH - CAT_WIDTH) / 2;
            this.y = this.y + (MECH_HEIGHT - CAT_HEIGHT) / 2;
            
            // Pop effect
            spawnExplosion(this.x, this.y, 5);
            
        } else {
            // Try to Enter
            // Check collision with empty mech
            if (this.emptyMech && checkEntityCollision(this, this.emptyMech)) {
                this.mode = 'MECH';
                
                // Restore stats
                this.mechHealth = this.emptyMech.health;
                this.x = this.emptyMech.x;
                this.y = this.emptyMech.y;
                this.width = MECH_WIDTH;
                this.height = MECH_HEIGHT;
                
                // Remove empty mech
                this.emptyMech.dead = true;
                const idx = gameState.entities.indexOf(this.emptyMech);
                if (idx > -1) gameState.entities.splice(idx, 1);
                this.emptyMech = null;
                
                spawnExplosion(this.x, this.y, 5);
            }
        }
    }
    
    update(p) {
        if (this.cooldown > 0) this.cooldown--;
        if (this.invincibleTimer > 0) this.invincibleTimer--;
        
        // Physics logic
        this.updatePhysics();
        
        // Log info for player
        if (p.frameCount % 60 === 0) {
            p.logs.player_info.push({
                x: this.x,
                y: this.y,
                mode: this.mode,
                health: this.mode === 'MECH' ? this.mechHealth : this.catHealth
            });
        }
        
        if (this.y > CANVAS_HEIGHT + 200) {
            // Fell off world
            this.takeDamage(999);
        }
    }
    
    takeDamage(amount) {
        if (this.invincibleTimer > 0) return;
        
        if (this.mode === 'MECH') {
            this.mechHealth -= amount;
            gameState.cameraShake = 5;
            spawnExplosion(this.x + this.width/2, this.y + this.height/2, 5);
            if (this.mechHealth <= 0) {
                // Force eject or die
                // For simplicity, mech explodes and you are forced to cat mode or game over?
                // Game Over if mech dies for now, or just critical damage
                gameState.gamePhase = "GAME_OVER_LOSE";
                spawnExplosion(this.x, this.y, 30);
            } else {
                this.invincibleTimer = 60;
            }
        } else {
            this.catHealth--;
            gameState.cameraShake = 5;
            if (this.catHealth <= 0) {
                gameState.gamePhase = "GAME_OVER_LOSE";
            } else {
                this.invincibleTimer = 60;
            }
        }
    }
    
    renderAt(p, x, y) {
        if (this.invincibleTimer > 0 && Math.floor(gameState.frameCount / 4) % 2 === 0) return;
        
        p.push();
        p.translate(x, y);
        
        // Flip if facing left
        if (this.facing === -1) {
            p.translate(this.width, 0);
            p.scale(-1, 1);
        }
        
        if (this.mode === 'MECH') {
            // Draw Mech
            p.fill(200);
            p.stroke(0);
            p.strokeWeight(2);
            p.rect(0, 0, this.width, this.height, 4);
            
            // Cockpit
            p.fill(0);
            p.rect(4, 4, this.width - 8, 12, 2);
            
            // Arm cannon
            p.fill(150);
            p.rect(10, 20, 20, 10);
            
            // Legs
            p.fill(100);
            const legOffset = Math.sin(gameState.frameCount * 0.2) * 5 * (Math.abs(this.vx) > 0 ? 1 : 0);
            p.rect(4 + legOffset, this.height - 10, 8, 10);
            p.rect(this.width - 12 - legOffset, this.height - 10, 8, 10);
            
        } else {
            // Draw Cat
            p.fill(255, 150, 50); // Orange
            p.noStroke();
            p.rect(0, 4, this.width, this.height - 4);
            
            // Ears
            p.triangle(0, 4, 4, 0, 5, 4);
            p.triangle(this.width, 4, this.width - 4, 0, this.width - 5, 4);
            
            // Tail
            p.stroke(255, 150, 50);
            p.strokeWeight(2);
            const tailWag = Math.sin(gameState.frameCount * 0.5) * 5;
            p.line(0, this.height - 4, -5, this.height - 10 + tailWag);
        }
        
        p.pop();
    }
}

export class EmptyMech extends Entity {
    constructor(x, y, health) {
        super(x, y, MECH_WIDTH, MECH_HEIGHT);
        this.health = health;
    }
    
    update() {
        this.updatePhysics();
    }
    
    renderAt(p, x, y) {
        p.push();
        p.translate(x, y);
        p.fill(100);
        p.stroke(50);
        p.rect(0, 0, this.width, this.height, 4);
        
        // Open Cockpit
        p.fill(20);
        p.rect(4, 2, this.width - 8, 12, 2);
        
        // Blinking light
        if (Math.floor(gameState.frameCount / 30) % 2 === 0) {
            p.fill(255, 0, 0);
            p.circle(this.width / 2, -5, 4);
        }
        
        p.pop();
    }
}

export class Enemy extends Entity {
    constructor(x, y, type = 'WALKER') {
        super(x, y, 30, 30);
        this.type = type;
        this.speed = 1.5;
        this.health = 30;
        this.vx = -this.speed; // Start moving left
        this.patrolDistance = 0;
        this.maxPatrol = 100;
        
        if (type === 'FLYER') {
            this.vx = 0;
            this.vy = 0;
            this.startY = y;
        }
    }
    
    update() {
        if (this.type === 'WALKER') {
            // Simple Patrol
            this.updatePhysics();
            
            // Turn around at walls or edges
            if (this.vx === 0 && Math.abs(this.prevX - this.x) < 0.1) {
                this.vx = -this.vx || this.speed; // Flip or start
            }
            
            // AI: Turn around if about to fall (optional, simple bounce for now)
            
        } else if (this.type === 'FLYER') {
            // Bob and weave
            this.y = this.startY + Math.sin(gameState.frameCount * 0.05) * 30;
            
            // Move towards player slowly if close
            if (gameState.player) {
                const dx = gameState.player.x - this.x;
                if (Math.abs(dx) < 300) {
                    this.x += Math.sign(dx) * 1;
                }
            }
        }
        
        // Collision with player
        if (gameState.player && checkEntityCollision(this, gameState.player)) {
            gameState.player.takeDamage(10);
            // Bounce enemy back
            if (this.type === 'WALKER') {
                this.vx = -this.vx;
            }
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        spawnExplosion(this.x + this.width/2, this.y + this.height/2, 3);
        if (this.health <= 0) {
            this.dead = true;
            gameState.score += 100;
        }
    }
    
    renderAt(p, x, y) {
        p.push();
        p.translate(x, y);
        
        if (this.type === 'WALKER') {
            p.fill(200, 50, 50);
            p.rect(0, 0, this.width, this.height);
            // Eye
            p.fill(255, 255, 0);
            p.rect(this.vx > 0 ? 15 : 5, 5, 10, 5);
        } else {
            p.fill(150, 50, 200);
            p.circle(this.width/2, this.height/2, this.width);
            // Wings
            p.fill(200, 100, 255);
            const flap = Math.sin(gameState.frameCount * 0.5) * 10;
            p.triangle(0, 10, -10, 5 + flap, 0, 20);
            p.triangle(this.width, 10, this.width + 10, 5 + flap, this.width, 20);
        }
        p.pop();
    }
}

export class Projectile extends Entity {
    constructor(x, y, dir) {
        super(x, y, 10, 4);
        this.vx = dir * 10;
        this.damage = 10;
        this.life = 60; // frames
    }
    
    update() {
        this.x += this.vx;
        this.life--;
        
        if (this.life <= 0) this.dead = true;
        
        // Hit enemies
        for (let enemy of gameState.enemies) {
            if (checkEntityCollision(this, enemy)) {
                enemy.takeDamage(this.damage);
                this.dead = true;
                return;
            }
        }
        
        // Hit walls
        for (let plat of gameState.platforms) {
            if (checkEntityCollision(this, plat)) {
                this.dead = true;
                spawnExplosion(this.x, this.y, 2);
                return;
            }
        }
    }
    
    renderAt(p, x, y) {
        p.fill(0, 255, 255);
        p.noStroke();
        p.rect(x, y, this.width, this.height);
    }
}

export class Collectible extends Entity {
    constructor(x, y, type) {
        super(x, y, 20, 20);
        this.type = type; // 'HEALTH', 'GOAL'
    }
    
    update() {
        if (gameState.player && checkEntityCollision(this, gameState.player)) {
            if (this.type === 'GOAL') {
                gameState.gamePhase = "GAME_OVER_WIN";
            } else if (this.type === 'HEALTH') {
                if (gameState.player.mode === 'MECH') gameState.player.mechHealth = Math.min(100, gameState.player.mechHealth + 25);
                this.dead = true;
            }
        }
    }
    
    renderAt(p, x, y) {
        const offset = Math.sin(gameState.frameCount * 0.1) * 5;
        p.push();
        p.translate(x, y + offset);
        
        if (this.type === 'GOAL') {
            p.fill(0, 255, 0);
            p.rect(0, 0, 30, 40);
            p.fill(255);
            p.textSize(10);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("SHIP", 15, 20);
        } else {
            p.fill(255, 100, 100);
            p.circle(10, 10, 15);
            p.fill(255);
            p.rect(8, 5, 4, 10);
            p.rect(5, 8, 10, 4);
        }
        
        p.pop();
    }
}