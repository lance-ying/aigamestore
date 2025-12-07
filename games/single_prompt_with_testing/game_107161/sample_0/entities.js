import { gameState, PALETTE, CANVAS_WIDTH, CANVAS_HEIGHT, INVULNERABILITY_FRAMES } from './globals.js';
import { isKeyDown, KEYS } from './input.js';
import { resolvePlatformCollision, checkAABB } from './physics.js';
import { createExplosion, Particle } from './particles.js';

export class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.vx = 0;
        this.vy = 0;
        this.markedForDeletion = false;
    }

    update() {}
    render(p) {}
}

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 20, 30);
        this.speed = 5;
        this.jumpPower = -10;
        this.shootRecoil = -5;
        this.onGround = false;
        
        this.maxHealth = 4;
        this.health = 4;
        this.maxAmmo = 8;
        this.ammo = 8;
        
        this.invincible = 0;
        this.flashTimer = 0;
        
        this.facing = 1; // 1 Right, -1 Left
        
        this.shootCooldown = 0;
        this.animState = "IDLE"; // IDLE, RUN, JUMP, FALL
    }

    update() {
        // Physics
        this.vy += gameState.gravity;
        
        // Friction
        if (this.onGround) {
            this.vx *= gameState.friction;
        } else {
            this.vx *= gameState.airResistance;
        }
        
        // Input Movement
        if (isKeyDown(KEYS.LEFT)) {
            this.vx -= 1; // Acceleration feel
            if (this.vx < -this.speed) this.vx = -this.speed;
            this.facing = -1;
        }
        if (isKeyDown(KEYS.RIGHT)) {
            this.vx += 1;
            if (this.vx > this.speed) this.vx = this.speed;
            this.facing = 1;
        }
        
        // Jump / Shoot Logic
        if (isKeyDown(KEYS.SPACE)) {
            if (this.onGround && this.vy >= 0) { // Jump
                this.vy = this.jumpPower;
                this.onGround = false;
                // Add little jump particles
                createExplosion(this.x + this.width/2, this.y + this.height, PALETTE.FG, 3);
            } else if (!this.onGround && this.ammo > 0 && this.shootCooldown <= 0) {
                // Shoot
                this.shoot();
            }
        }
        
        // Apply Velocity
        this.x += this.vx;
        this.y += this.vy;
        
        // Wall Constraints (Well walls)
        const wellLeft = (CANVAS_WIDTH - gameState.wellWidth) / 2;
        const wellRight = wellLeft + gameState.wellWidth;
        
        if (this.x < wellLeft) {
            this.x = wellLeft;
            this.vx = 0;
        }
        if (this.x + this.width > wellRight) {
            this.x = wellRight - this.width;
            this.vx = 0;
        }
        
        // Platform Collisions
        this.onGround = false;
        for (let platform of gameState.platforms) {
            // Optimization: only check nearby platforms
            if (Math.abs(platform.y - this.y) < 100) {
                if (checkAABB(this, platform)) {
                    resolvePlatformCollision(this, platform);
                }
            }
        }
        
        // Recharge ammo on ground
        if (this.onGround) {
            if (this.ammo < this.maxAmmo) {
                this.ammo = this.maxAmmo;
            }
            this.combo = 0; // Reset combo on ground (Downwell mechanic)
        }
        
        // Timers
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.invincible > 0) this.invincible--;
        
        // Update Camera to follow player (only down)
        // Keep player at around 1/3 of screen height
        const targetCamY = this.y - CANVAS_HEIGHT / 3;
        if (targetCamY > gameState.cameraY) {
            gameState.cameraY = targetCamY; // Instant follow downwards
        }
        
        // Check win condition
        if (this.y >= gameState.worldDepth) {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
        
        // Check death
        if (this.health <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }

        // Animation State
        if (this.onGround) {
            this.animState = Math.abs(this.vx) > 0.5 ? "RUN" : "IDLE";
        } else {
            this.animState = this.vy > 0 ? "FALL" : "JUMP";
        }
    }

    shoot() {
        this.shootCooldown = 6; // Fire rate
        this.ammo--;
        this.vy = Math.min(this.vy, 0) + this.shootRecoil; // Upward kick, cap downward velocity
        
        // Spawn projectile
        const bx = this.x + this.width / 2;
        const by = this.y + this.height;
        gameState.projectiles.push(new Projectile(bx, by));
        
        // Spawn shell casing
        gameState.particles.push(new Particle(this.x + (this.facing === 1 ? -5 : this.width + 5), this.y + 10, null, "SHELL"));
    }

    takeDamage(amount) {
        if (this.invincible > 0) return;
        this.health -= amount;
        this.invincible = INVULNERABILITY_FRAMES; // Use defined constant for i-frames
        createExplosion(this.x + this.width/2, this.y + this.height/2, PALETTE.FG, 10);
    }
    
    bounce() {
        this.vy = this.jumpPower * 0.8; // Bounce off enemy
        this.ammo = this.maxAmmo; // Reload on stomp
    }

    render(p) {
        p.push();
        p.translate(Math.floor(this.x), Math.floor(this.y));
        
        // Flashing if invincible
        if (this.invincible > 0 && Math.floor(p.frameCount / 4) % 2 === 0) {
            // Don't draw
        } else {
            p.fill(PALETTE.FG);
            p.noStroke();
            
            // Draw simple body based on state
            if (this.animState === "IDLE") {
                p.rect(0, 0, this.width, this.height);
                // Eyes
                p.fill(PALETTE.BG);
                p.rect(this.facing === 1 ? 12 : 4, 8, 4, 8);
            } else if (this.animState === "RUN") {
                // Bobbing
                const bob = Math.sin(p.frameCount * 0.5) * 2;
                p.rect(0, bob, this.width, this.height - bob);
                p.fill(PALETTE.BG);
                p.rect(this.facing === 1 ? 12 : 4, 8 + bob, 4, 8);
            } else if (this.animState === "JUMP" || this.animState === "FALL") {
                // Stretched
                p.rect(2, -2, this.width - 4, this.height + 4);
                p.fill(PALETTE.BG);
                p.rect(this.facing === 1 ? 12 : 4, 6, 4, 8);
            }
            
            // Gunboots
            p.fill(PALETTE.ACCENT);
            p.rect(0, this.height - 6, 8, 6);
            p.rect(this.width - 8, this.height - 6, 8, 6);
        }
        
        p.pop();
    }
}

export class Projectile extends Entity {
    constructor(x, y) {
        super(x - 3, y, 6, 12); // Narrow vertical bullet
        this.vy = 12;
        this.life = 20;
    }

    update() {
        this.y += this.vy;
        this.life--;
        
        if (this.life <= 0) {
            this.markedForDeletion = true;
            // Fizzle
            gameState.particles.push(new Particle(this.x, this.y, PALETTE.FG));
        }

        // Collision with platforms
        for (let p of gameState.platforms) {
            if (checkAABB(this, p)) {
                this.markedForDeletion = true;
                createExplosion(this.x, this.y, PALETTE.FG, 3);
                break;
            }
        }
        
        // Collision with enemies handled in Enemy update or main loop
    }

    render(p) {
        p.fill(PALETTE.FG);
        p.noStroke();
        p.rect(this.x, this.y, this.width, this.height);
        
        // Trail
        p.fill(255, 255, 255, 100);
        p.rect(this.x + 1, this.y - 10, 4, 10);
    }
}

export class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y, 30, 30);
        this.type = type; // "WALKER", "BAT", "JELLY"
        this.health = 3;
        
        if (type === "BAT") {
            this.width = 30;
            this.height = 20;
            this.flyOffset = Math.random() * 100;
        } else if (type === "JELLY") {
            this.width = 25;
            this.height = 25;
        }
        
        this.dir = Math.random() > 0.5 ? 1 : -1;
    }
    
    update() {
        // Only update if near screen
        const screenY = this.y - gameState.cameraY;
        if (screenY < -100 || screenY > CANVAS_HEIGHT + 100) return;

        if (this.type === "WALKER") {
            this.x += this.dir * 1;
            
            // Turn around at walls or edges (simplified)
            const wellLeft = (CANVAS_WIDTH - gameState.wellWidth) / 2;
            const wellRight = wellLeft + gameState.wellWidth;
            
            if (this.x <= wellLeft || this.x + this.width >= wellRight) {
                this.dir *= -1;
            }
            
            // Gravity (if walks off platform)
            // Simplified: Walkers stick to platforms, we won't implement complex physics for them to save complexity
        } else if (this.type === "BAT") {
            // Hover logic
            this.x += Math.sin((gameState.frameCount + this.flyOffset) * 0.05) * 1;
            this.y += Math.cos((gameState.frameCount + this.flyOffset) * 0.05) * 0.5;
        } else if (this.type === "JELLY") {
            // Move up slowly
            this.y -= 0.5;
        }
        
        // Interaction with Player
        const p = gameState.player;
        if (p && !p.invincible && checkAABB(this, p)) {
            // Check stomp (Player bottom vs Enemy top)
            // If player is falling and their feet are above enemy center
            if (p.vy > 0 && (p.y + p.height) < (this.y + this.height * 0.8)) {
                // Stomp!
                this.takeDamage(10); // Instant kill usually
                p.bounce();
                createExplosion(this.x + this.width/2, this.y, PALETTE.FG, 8);
            } else {
                // Hurt player
                p.takeDamage(1);
            }
        }
        
        // Interaction with Projectiles
        for (let proj of gameState.projectiles) {
            if (!proj.markedForDeletion && checkAABB(this, proj)) {
                this.takeDamage(1);
                proj.markedForDeletion = true;
                createExplosion(proj.x, proj.y, PALETTE.ACCENT, 4);
            }
        }
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.markedForDeletion = true;
            createExplosion(this.x + this.width/2, this.y + this.height/2, PALETTE.ACCENT, 15);
            // Drop Gem sometimes
            if (Math.random() > 0.3) {
                gameState.gems.push(new Gem(this.x + this.width/2 - 10, this.y + this.height/2 - 10));
            }
            gameState.score += 100;
        } else {
            // Flash white
        }
    }

    render(p) {
        const screenY = this.y - gameState.cameraY;
        if (screenY < -50 || screenY > CANVAS_HEIGHT + 50) return;

        p.fill(PALETTE.ACCENT);
        p.noStroke();
        
        if (this.type === "WALKER") {
            // Turtle-like
            p.rect(this.x, this.y + 10, this.width, 20); // Body
            p.rect(this.x + (this.dir===1?20:0), this.y, 10, 10); // Head
        } else if (this.type === "BAT") {
            p.triangle(this.x, this.y, this.x + this.width, this.y, this.x + this.width/2, this.y + this.height);
            // Wings
            if (Math.floor(p.frameCount / 5) % 2 === 0) {
                p.rect(this.x - 5, this.y - 5, 10, 5);
                p.rect(this.x + this.width - 5, this.y - 5, 10, 5);
            }
        } else if (this.type === "JELLY") {
            p.arc(this.x + this.width/2, this.y + 10, this.width, 20, p.PI, 0);
            // Tentacles
            p.rect(this.x + 5, this.y + 10, 4, 15);
            p.rect(this.x + 15, this.y + 10, 4, 15);
        } else {
            p.square(this.x, this.y, this.width);
        }
        
        // Eyes
        p.fill(PALETTE.FG);
        if (this.type !== "BAT") {
            p.rect(this.x + 8, this.y + 12, 4, 4);
            p.rect(this.x + 18, this.y + 12, 4, 4);
        } else {
            p.rect(this.x + 13, this.y + 5, 4, 4);
        }
    }
}

export class Gem extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20);
        this.bobOffset = Math.random() * Math.PI * 2;
    }
    
    update() {
        // Collect
        const p = gameState.player;
        if (p && checkRectCircle(p, this)) {
            this.markedForDeletion = true;
            gameState.score += 50;
            gameState.player.ammo = gameState.player.maxAmmo; // Gems refill ammo
            createExplosion(this.x + 10, this.y + 10, PALETTE.ACCENT, 5);
        }
    }
    
    render(p) {
        const screenY = this.y - gameState.cameraY;
        if (screenY < -50 || screenY > CANVAS_HEIGHT + 50) return;

        const bob = Math.sin(p.frameCount * 0.1 + this.bobOffset) * 3;
        
        p.push();
        p.translate(this.x + 10, this.y + 10 + bob);
        p.fill(PALETTE.ACCENT);
        p.noStroke();
        p.beginShape();
        // Diamond shape
        p.vertex(0, -10);
        p.vertex(8, 0);
        p.vertex(0, 10);
        p.vertex(-8, 0);
        p.endShape(p.CLOSE);
        
        p.fill(255, 100, 100); // Highlight
        p.rect(-3, -3, 3, 3);
        p.pop();
    }
}

// Platform is simple struct but let's make it consistent
export class Platform {
    constructor(x, y, w, h, type = "NORMAL") {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = type; // NORMAL, DESTRUCTIBLE, SIDE
    }
    
    render(p) {
        const screenY = this.y - gameState.cameraY;
        if (screenY < -this.height || screenY > CANVAS_HEIGHT + this.height) return;

        p.fill(PALETTE.FG);
        p.stroke(PALETTE.BG);
        p.strokeWeight(2);
        
        if (this.type === "SIDE") {
            p.fill(PALETTE.SHADOW);
            p.noStroke();
        }
        
        p.rect(this.x, this.y, this.width, this.height);
        
        // Texture
        if (this.type === "NORMAL") {
            p.noStroke();
            p.fill(PALETTE.BG);
            p.rect(this.x + 2, this.y + this.height - 4, this.width - 4, 2);
        }
    }
}

// Helper for gem collision (Rect vs roughly Circle)
function checkRectCircle(rect, circle) {
    // Treat gem as rect for simplicity and speed
    return checkAABB(rect, circle);
}