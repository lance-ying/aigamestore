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
        super(x, y, 14, 24); // Smaller avatar (was 20x30)
        this.speed = 5;
        this.jumpPower = -11; // Increased jump height (was -7.5)
        this.onGround = false;
        
        this.maxHealth = 4;
        this.health = 4;
        this.maxAmmo = 8;
        this.ammo = 8;
        
        this.gunType = "NORMAL"; // NORMAL, SHOTGUN, LASER, BURST
        
        this.invincible = 0;
        this.flashTimer = 0;
        
        this.facing = 1; // 1 Right, -1 Left
        
        this.shootCooldown = 0;
        this.animState = "IDLE"; // IDLE, RUN, JUMP, FALL
        
        this.didJump = false; // Track if the current key press caused a jump
        
        // Burst fire properties
        this.isFiring = false;
        this.burstTimer = 0;
        this.shotsLeftInBurst = 0;
        this.burstRate = 0;
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
        const spacePressed = isKeyDown(KEYS.SPACE);
        
        // Reset jump flag if key is released
        if (!spacePressed) {
            this.didJump = false;
        }

        if (spacePressed) {
            if (this.onGround && this.vy >= 0) { // Jump
                this.vy = this.jumpPower;
                this.onGround = false;
                // Add little jump particles
                createExplosion(this.x + this.width/2, this.y + this.height, PALETTE.FG, 3);
                
                // Mark that we jumped with this key press to prevent immediate shooting
                this.didJump = true;
            } else if (!this.onGround && this.ammo > 0 && this.shootCooldown <= 0 && !this.isFiring) {
                // Shoot
                // Only shoot if we didn't just jump with this key hold
                if (!this.didJump) {
                    this.shoot();
                }
            }
        }
        
        // Handle Burst Firing
        if (this.isFiring) {
            if (this.burstTimer <= 0) {
                this.spawnBullet();
                this.shotsLeftInBurst--;
                this.burstTimer = this.burstRate;
                
                if (this.shotsLeftInBurst <= 0) {
                    this.isFiring = false;
                }
            }
            this.burstTimer--;
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
            this.isFiring = false; // Stop firing if we land
        }
        
        // Timers
        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.invincible > 0) this.invincible--;
        
        // Update Camera to follow player (Strictly)
        // Keep player centered vertically
        const targetCamY = this.y - CANVAS_HEIGHT / 2;
        // Clamp camera so it doesn't show above start or too far below end
        gameState.cameraY = Math.max(0, Math.min(targetCamY, gameState.worldDepth - CANVAS_HEIGHT + 100));
        
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
        this.ammo--;
        
        this.isFiring = true;
        this.burstTimer = 0; // Fire first shot immediately
        
        if (this.gunType === "NORMAL") {
            this.shotsLeftInBurst = 3;
            this.burstRate = 4;
            this.shootCooldown = 20;
        } else if (this.gunType === "BURST") {
            this.shotsLeftInBurst = 5;
            this.burstRate = 3;
            this.shootCooldown = 25;
        } else if (this.gunType === "SHOTGUN") {
            // Shotgun is instant but powerful
            this.shotsLeftInBurst = 1;
            this.burstRate = 0;
            this.shootCooldown = 30;
        } else if (this.gunType === "LASER") {
            // Laser is instant
            this.shotsLeftInBurst = 1;
            this.burstRate = 0;
            this.shootCooldown = 25;
        } else {
            // Fallback
            this.shotsLeftInBurst = 1;
            this.burstRate = 0;
            this.shootCooldown = 10;
        }
    }
    
    spawnBullet() {
        // Physics: Boost up (Recoil)
        // Recoil is applied per shot in the burst
        let recoil = -2.5; 
        if (this.gunType === "SHOTGUN") recoil = -6;
        if (this.gunType === "LASER") recoil = -4;
        
        // If falling fast, recoil helps slow down/reverse
        // If moving up, it adds speed
        this.vy = Math.min(this.vy + recoil, recoil);
        
        // Spawn projectile based on gunType
        const bx = this.x + this.width / 2;
        const by = this.y + this.height;
        
        if (this.gunType === "SHOTGUN") {
            for(let i=-1; i<=1; i++) {
                gameState.projectiles.push(new Projectile(bx, by, i * 2, 12));
            }
        } else if (this.gunType === "LASER") {
            gameState.projectiles.push(new Laser(bx - 3, by));
        } else if (this.gunType === "BURST") {
            // Slight spread for burst
            gameState.projectiles.push(new Projectile(bx, by, (Math.random()-0.5)*1.5, 14));
        } else {
            // NORMAL - slight jitter for stream feel
            gameState.projectiles.push(new Projectile(bx, by, (Math.random()-0.5)*0.5, 12));
        }
        
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
        this.isFiring = false; // Cancel burst on stomp
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
                p.rect(this.facing === 1 ? 10 : 2, 6, 4, 6);
            } else if (this.animState === "RUN") {
                // Bobbing
                const bob = Math.sin(p.frameCount * 0.5) * 2;
                p.rect(0, bob, this.width, this.height - bob);
                p.fill(PALETTE.BG);
                p.rect(this.facing === 1 ? 10 : 2, 6 + bob, 4, 6);
            } else if (this.animState === "JUMP" || this.animState === "FALL") {
                // Stretched
                p.rect(1, -2, this.width - 2, this.height + 4);
                p.fill(PALETTE.BG);
                p.rect(this.facing === 1 ? 10 : 2, 4, 4, 6);
            }
            
            // Gunboots
            p.fill(PALETTE.ACCENT);
            p.rect(0, this.height - 4, 6, 4);
            p.rect(this.width - 6, this.height - 4, 6, 4);
        }
        
        p.pop();
    }
}

export class Laser extends Entity {
    constructor(x, y) {
        super(x, y, 6, 0); 
        this.life = 15; // Frames to persist visually
        this.maxHeight = 600; // Max range
        
        // Calculate beam length (Raycast down)
        let bestY = y + this.maxHeight;
        const center = x + 3; 
        
        for (let plat of gameState.platforms) {
            // Check if platform is below us and aligned horizontally
            if (plat.y >= y && plat.x < center + 4 && plat.x + plat.width > center - 4) {
                if (plat.y < bestY) {
                    bestY = plat.y;
                }
            }
        }
        
        this.height = bestY - y;
        this.damageDealt = false;
    }

    update() {
        this.life--;
        if (this.life <= 0) this.markedForDeletion = true;
        
        // Apply damage on first frame (Instant Hit)
        if (!this.damageDealt) {
            this.damageDealt = true;
            
            // Check enemies
            for (let e of gameState.enemies) {
                if (checkAABB(this, e)) {
                    e.takeDamage(4); // High damage
                    createExplosion(e.x + e.width/2, e.y + e.height/2, PALETTE.ACCENT, 6);
                }
            }
        }
    }

    render(p) {
        const screenY = this.y - gameState.cameraY;
        if (screenY < -this.height || screenY > CANVAS_HEIGHT) return;

        p.push();
        const alpha = (this.life / 15) * 255;
        // Outer glow
        p.fill(255, 0, 100, alpha * 0.5);
        p.noStroke();
        p.rect(this.x - 2, this.y, 10, this.height);
        
        // Core
        p.fill(255, 255, 255, alpha);
        p.rect(this.x, this.y, 6, this.height);
        p.pop();
    }
}

export class Projectile extends Entity {
    constructor(x, y, vx = 0, vy = 12, life = 20) {
        super(x - 3, y, 6, 12); // Narrow vertical bullet
        this.vx = vx;
        this.vy = vy;
        this.life = life;
    }

    update() {
        this.x += this.vx;
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

export class EnemyProjectile extends Entity {
    constructor(x, y, vx, vy) {
        super(x - 4, y - 4, 8, 8);
        this.vx = vx;
        this.vy = vy;
        this.life = 120; // 2 seconds
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;

        if (this.life <= 0) {
            this.markedForDeletion = true;
        }

        // Hit Player
        const p = gameState.player;
        if (p && !p.invincible && checkAABB(this, p)) {
            p.takeDamage(1);
            this.markedForDeletion = true;
            createExplosion(this.x, this.y, PALETTE.ACCENT, 5);
        }

        // Hit Platforms
        for (let plat of gameState.platforms) {
            if (checkAABB(this, plat)) {
                this.markedForDeletion = true;
                createExplosion(this.x, this.y, PALETTE.FG, 3);
                break;
            }
        }
    }

    render(p) {
        const screenY = this.y - gameState.cameraY;
        if (screenY < -20 || screenY > CANVAS_HEIGHT + 20) return;

        p.fill(PALETTE.ACCENT);
        p.noStroke();
        p.ellipse(this.x + 4, this.y + 4, 8, 8);
    }
}

export class Powerup extends Entity {
    constructor(x, y, type) {
        super(x, y, 24, 24);
        this.type = type; // "HEALTH", "SHOTGUN", "LASER", "BURST", "MAX_HEALTH"
        this.bobOffset = Math.random() * 10;
    }

    update() {
        const p = gameState.player;
        if (p && checkAABB(p, this)) {
            this.markedForDeletion = true;
            createExplosion(this.x + 12, this.y + 12, PALETTE.SECONDARY, 10);
            
            if (this.type === "HEALTH") {
                p.health = Math.min(p.health + 1, p.maxHealth);
            } else if (this.type === "MAX_HEALTH") {
                p.maxHealth++;
                p.health = p.maxHealth;
            } else {
                p.gunType = this.type;
                p.ammo = p.maxAmmo;
            }
            gameState.score += 200;
        }
    }

    render(p) {
        const screenY = this.y - gameState.cameraY;
        if (screenY < -50 || screenY > CANVAS_HEIGHT + 50) return;

        const bob = Math.sin(p.frameCount * 0.1 + this.bobOffset) * 4;
        p.push();
        p.translate(this.x + 12, this.y + 12 + bob);
        
        p.fill(PALETTE.SECONDARY);
        p.stroke(PALETTE.FG);
        p.strokeWeight(2);
        p.rectMode(p.CENTER);
        p.square(0, 0, 20);
        
        p.fill(PALETTE.FG);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(12);
        
        let label = "?";
        if (this.type === "HEALTH") label = "HP";
        else if (this.type === "MAX_HEALTH") label = "MAX";
        else if (this.type === "SHOTGUN") label = "SG";
        else if (this.type === "LASER") label = "LZ";
        else if (this.type === "BURST") label = "MG";
        
        p.text(label, 0, 0);
        
        p.pop();
    }
}

export class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y, 30, 30);
        this.type = type; // "WALKER", "BAT", "JELLY", "SNAKE", "FROG", "TURRET"
        this.health = 3;
        this.onGround = false;
        
        // Shooting logic
        this.shootTimer = Math.random() * 120; // Stagger start
        
        if (type === "BAT") {
            this.width = 30;
            this.height = 20;
            this.flyOffset = Math.random() * 100;
        } else if (type === "JELLY") {
            this.width = 25;
            this.height = 25;
        } else if (type === "SNAKE") {
            this.width = 30;
            this.height = 15;
            this.y += 15; // Align to bottom
        } else if (type === "FROG") {
            this.width = 24;
            this.height = 24;
            this.jumpTimer = Math.floor(Math.random() * 60);
            this.baseY = y;
        } else if (type === "TURRET") {
            this.width = 24;
            this.height = 24;
            this.y += 6; // Sit on platform
            this.shootTimer = 60 + Math.random() * 60;
        }
        
        this.dir = Math.random() > 0.5 ? 1 : -1;
    }
    
    update(p5Ref) { // Passed p5 instance for time if needed, though using frameCount from global usually
        // Only update if near screen
        const screenY = this.y - gameState.cameraY;
        if (screenY < -200 || screenY > CANVAS_HEIGHT + 200) return;

        const wellLeft = (CANVAS_WIDTH - gameState.wellWidth) / 2;
        const wellRight = wellLeft + gameState.wellWidth;
        const isFlying = (this.type === "BAT" || this.type === "JELLY");
        const isStationary = (this.type === "TURRET");

        // Physics for non-flyers and non-stationary
        if (!isFlying && !isStationary) {
            this.vy += gameState.gravity;
            if (this.vy > 10) this.vy = 10; // Terminal velocity
        }

        // Behavior Logic
        if (this.type === "WALKER" || this.type === "SNAKE") {
            if (this.onGround) {
                const speed = (this.type === "SNAKE") ? 2.5 : 1;
                this.vx = this.dir * speed;
            } else {
                this.vx *= 0.95; // Air resistance
            }
        } else if (this.type === "FROG") {
            if (this.onGround) {
                this.vx *= 0.8; // Friction on ground
                this.jumpTimer++;
                if (this.jumpTimer > 90) { // Jump every 1.5s approx
                    this.vy = -9;
                    this.vx = this.dir * 3;
                    this.onGround = false;
                    this.jumpTimer = 0;
                }
            } else {
                this.vx *= 0.98; // Air resistance
            }
        } else if (this.type === "BAT") {
            // Hover logic
            this.x += Math.sin((gameState.frameCount + this.flyOffset) * 0.05) * 1;
            this.y += Math.cos((gameState.frameCount + this.flyOffset) * 0.05) * 0.5;
            
            // Shooting logic for BAT
            this.shootTimer--;
            const p = gameState.player;
            if (this.shootTimer <= 0 && p && !p.invincible) {
                // Check distance
                const dx = p.x + p.width/2 - (this.x + this.width/2);
                const dy = p.y + p.height/2 - (this.y + this.height/2);
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                // Only shoot if relatively close and below
                if (dist < 300) {
                    const angle = Math.atan2(dy, dx);
                    const speed = 4;
                    const pVx = Math.cos(angle) * speed;
                    const pVy = Math.sin(angle) * speed;
                    
                    gameState.enemyProjectiles.push(new EnemyProjectile(this.x + this.width/2, this.y + this.height/2, pVx, pVy));
                    this.shootTimer = 180; // 3 seconds cooldown
                }
            }
        } else if (this.type === "JELLY") {
            // Move up slowly
            this.y -= 0.5;
        } else if (this.type === "TURRET") {
            // Stationary but shoots
            this.shootTimer--;
            const p = gameState.player;
            if (this.shootTimer <= 0 && p && !p.invincible) {
                const dx = p.x + p.width/2 - (this.x + this.width/2);
                const dy = p.y + p.height/2 - (this.y + this.height/2);
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < 400) {
                     const angle = Math.atan2(dy, dx);
                     const speed = 5;
                     const pVx = Math.cos(angle) * speed;
                     const pVy = Math.sin(angle) * speed;
                     gameState.enemyProjectiles.push(new EnemyProjectile(this.x + this.width/2, this.y + this.height/2, pVx, pVy));
                     this.shootTimer = 120; // 2 seconds cooldown
                }
            }
        }
        
        // Apply Velocity
        this.x += this.vx;
        this.y += this.vy;
        
        // Well Constraints
        if (this.x < wellLeft) {
            this.x = wellLeft;
            this.vx *= -1;
            this.dir = 1;
        } else if (this.x + this.width > wellRight) {
            this.x = wellRight - this.width;
            this.vx *= -1;
            this.dir = -1;
        }
        
        // Platform Collisions (Non-flyers)
        this.onGround = false;
        if (!isFlying && !isStationary) {
            // Check collisions
            for (let platform of gameState.platforms) {
                if (Math.abs(platform.y - this.y) < 100) {
                    if (checkAABB(this, platform)) {
                        const prevVx = this.vx;
                        resolvePlatformCollision(this, platform);
                        
                        // If horizontal collision stopped us, flip direction
                        if (Math.abs(prevVx) > 0.1 && Math.abs(this.vx) < 0.1) {
                            this.dir *= -1;
                        }
                    }
                }
            }
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
            // Laser handles its own collision, ignore here
            if (proj instanceof Laser) continue;

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
            
            // Drop Logic
            const rand = Math.random();
            const cx = this.x + this.width/2 - 10;
            const cy = this.y + this.height/2 - 10;
            
            if (rand < 0.15) { // 15% Heart
                gameState.hearts.push(new Heart(cx, cy));
            } else if (rand < 0.5) { // 35% Gem
                gameState.gems.push(new Gem(cx, cy));
            }
            
            gameState.score += 100;
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
        } else if (this.type === "SNAKE") {
            // Low and long
            p.rect(this.x, this.y, this.width, this.height);
            // Stripes
            p.fill(PALETTE.BG);
            p.rect(this.x + 5, this.y, 5, this.height);
            p.rect(this.x + 15, this.y, 5, this.height);
        } else if (this.type === "FROG") {
            // Boxy frog
            p.rect(this.x, this.y + 8, this.width, 16);
            // Legs
            p.rect(this.x - 2, this.y + 16, 4, 8);
            p.rect(this.x + this.width - 2, this.y + 16, 4, 8);
            // Eyes
            p.rect(this.x + 4, this.y, 6, 8);
            p.rect(this.x + 14, this.y, 6, 8);
            
            // Jump indication
            if (!this.onGround) {
                p.fill(PALETTE.FG);
                p.rect(this.x + 10, this.y + 20, 4, 4); // Thruster?
            }
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
        } else if (this.type === "TURRET") {
            // Dome shape
            p.arc(this.x + this.width/2, this.y + this.height, this.width, this.height * 2, p.PI, 0);
            // Gun barrel pointing at player
            const pl = gameState.player;
            if (pl) {
                const dx = pl.x + pl.width/2 - (this.x + this.width/2);
                const dy = pl.y + pl.height/2 - (this.y + this.height/2);
                const angle = Math.atan2(dy, dx);
                p.push();
                p.translate(this.x + this.width/2, this.y + this.height/2);
                p.rotate(angle);
                p.fill(PALETTE.FG);
                p.rect(0, -3, 15, 6);
                p.pop();
            }
        } else {
            p.square(this.x, this.y, this.width);
        }
        
        // Eyes
        p.fill(PALETTE.FG);
        if (this.type !== "BAT" && this.type !== "SNAKE" && this.type !== "TURRET") {
            p.rect(this.x + 8, this.y + 12, 4, 4);
            p.rect(this.x + 18, this.y + 12, 4, 4);
        } else if (this.type === "BAT") {
            p.rect(this.x + 13, this.y + 5, 4, 4);
        } else if (this.type === "SNAKE") {
            p.rect(this.x + (this.dir===1?25:2), this.y + 4, 4, 4);
        } else if (this.type === "TURRET") {
            p.rect(this.x + 10, this.y + 10, 4, 4);
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
        if (p && checkAABB(p, this)) {
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

export class Heart extends Entity {
    constructor(x, y) {
        super(x, y, 16, 16);
        this.bobOffset = Math.random() * Math.PI * 2;
    }
    
    update() {
        const p = gameState.player;
        if (p && checkAABB(p, this)) {
            // Only pickup if not full health
            if (p.health < p.maxHealth) {
                p.health++;
                this.markedForDeletion = true;
                createExplosion(this.x + 8, this.y + 8, "#FF6688", 5);
            }
        }
    }
    
    render(p) {
        const screenY = this.y - gameState.cameraY;
        if (screenY < -50 || screenY > CANVAS_HEIGHT + 50) return;

        const bob = Math.sin(p.frameCount * 0.1 + this.bobOffset) * 3;
        
        p.push();
        p.translate(this.x + 8, this.y + 8 + bob);
        p.fill("#FF4466");
        p.noStroke();
        
        // Heart shape
        p.beginShape();
        p.vertex(0, 4);
        p.bezierVertex(-6, -4, -8, -6, 0, -10);
        p.bezierVertex(8, -6, 6, -4, 0, 4);
        p.endShape(p.CLOSE);
        
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