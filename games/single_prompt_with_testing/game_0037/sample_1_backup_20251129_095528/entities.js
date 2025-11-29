// entities.js - Game objects
import { gameState, TILE_SIZE, GRAVITY, FRICTION_GROUND, FRICTION_AIR, ACCELERATION, JUMP_FORCE, BOUNCE_FORCE, SPRING_FORCE, SPIN_DASH_SPEED, CANVAS_HEIGHT, TERMINAL_VELOCITY, SKID_DECEL } from './globals.js';
import { checkMapCollision, checkEntityCollision } from './physics.js';
import { isKeyDown } from './input.js';
import { spawnParticles } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.active = true;
    }
    
    update(p) { }
    render(p) { }
}

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20); // Sonic size roughly 20x20 visual, hit box maybe bigger
        this.radius = 15; // Visual radius
        this.width = 24;  // Hitbox width
        this.height = 36; // Hitbox height (standing)
        this.normalHeight = 36;
        this.rollHeight = 24;
        
        // State
        this.state = 'IDLE'; // IDLE, RUN, JUMP, ROLL, SPINDASH, HURT
        this.facing = 1;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.flashTimer = 0;
        
        // Spin dash
        this.spinCharge = 0;
        
        // Physics overrides
        this.maxSpeed = 8;
    }

    update(p) {
        // Handle Input
        this.handleControl(p);
        
        // Apply Physics
        this.applyPhysics();
        
        // Map Collision
        checkMapCollision(this);
        
        // Check bounds (death pit)
        if (this.y > gameState.levelHeight * TILE_SIZE + 100) {
            this.die();
        }
        
        // Animation/State updates
        this.updateAnimationState();
        
        // Invincibility
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }
    }

    handleControl(p) {
        // Automation override
        let action = null;
        if (gameState.controlMode !== 'HUMAN') {
            action = get_automated_testing_action(gameState);
        }

        const left = action ? action.key === 'LEFT' : isKeyDown(37);
        const right = action ? action.key === 'RIGHT' : isKeyDown(39);
        const up = action ? action.key === 'UP' : isKeyDown(38);
        const down = action ? action.key === 'DOWN' : isKeyDown(40);
        const jump = action ? action.key === 'SPACE' : isKeyDown(32);
        
        // Movement
        if (this.state !== 'HURT') {
            // Ground Movement
            if (this.onGround) {
                // Spindash Charge
                if (this.state === 'IDLE' && down && jump && Math.abs(this.vx) < 1) {
                    this.state = 'SPINDASH';
                    this.spinCharge += 0.5;
                    if (this.spinCharge > 3) this.spinCharge = 3;
                    // Play charge sound (visual)
                    spawnParticles(this.x + this.width/2, this.y + this.height, "DUST", 1);
                    return;
                }
                
                // Release Spindash
                if (this.state === 'SPINDASH') {
                    if (!down) {
                        this.state = 'ROLL';
                        this.vx = this.facing * (SPIN_DASH_SPEED + this.spinCharge);
                        this.spinCharge = 0;
                        return;
                    }
                    // Degrade charge
                    this.spinCharge *= 0.95;
                    return;
                }

                // Rolling
                if (down && Math.abs(this.vx) > 1 && this.state !== 'ROLL') {
                    this.state = 'ROLL';
                    this.height = this.rollHeight;
                    this.y += (this.normalHeight - this.rollHeight); // Adjust pos to not float
                    // Play sound
                } else if (!down && this.state === 'ROLL' && Math.abs(this.vx) < 1) {
                    this.state = 'IDLE';
                    this.height = this.normalHeight;
                    this.y -= (this.normalHeight - this.rollHeight);
                }

                // Accel / Decel
                if (left) {
                    if (this.vx > 0) this.vx -= SKID_DECEL; // Skid
                    else if (this.state !== 'ROLL') this.vx -= ACCELERATION;
                    this.facing = -1;
                } else if (right) {
                    if (this.vx < 0) this.vx += SKID_DECEL; // Skid
                    else if (this.state !== 'ROLL') this.vx += ACCELERATION;
                    this.facing = 1;
                } else {
                    // Friction
                    if (this.state === 'ROLL') {
                        this.vx *= 0.98; // Rolling friction is lower
                    } else {
                        this.vx *= FRICTION_GROUND;
                    }
                    if (Math.abs(this.vx) < 0.1) this.vx = 0;
                }
                
                // Jump
                if (jump && this.state !== 'SPINDASH') {
                    if (!this.prevJumpState) { // Just pressed
                        this.vy = JUMP_FORCE;
                        this.onGround = false;
                        this.state = 'JUMP';
                        this.height = this.rollHeight; // Hitbox shrinks
                        spawnParticles(this.x + this.width/2, this.y + this.height, "DUST", 3);
                    }
                }
                
            } else {
                // Air Movement
                if (left) {
                    this.vx -= ACCELERATION * 0.5;
                    this.facing = -1;
                } else if (right) {
                    this.vx += ACCELERATION * 0.5;
                    this.facing = 1;
                }
                this.vx *= FRICTION_AIR;
            }
        }
        
        this.prevJumpState = jump;
    }

    applyPhysics() {
        // Gravity
        this.vy += GRAVITY;
        if (this.vy > TERMINAL_VELOCITY) this.vy = TERMINAL_VELOCITY;
        
        // Speed cap
        if (Math.abs(this.vx) > this.maxSpeed && this.state !== 'ROLL' && this.state !== 'HURT') {
             this.vx = Math.sign(this.vx) * this.maxSpeed;
        }
    }

    updateAnimationState() {
        if (this.state === 'HURT') return;
        
        if (!this.onGround) {
            this.state = 'JUMP';
        } else if (this.state === 'ROLL') {
            // Keep roll
        } else if (this.state === 'SPINDASH') {
            // Keep spindash
        } else if (Math.abs(this.vx) > 0.1) {
            this.state = 'RUN';
        } else {
            this.state = 'IDLE';
        }
        
        // Reset hitbox height if standing up
        if ((this.state === 'IDLE' || this.state === 'RUN') && this.height !== this.normalHeight) {
             this.y -= (this.normalHeight - this.height);
             this.height = this.normalHeight;
        }
    }

    takeDamage(sourceX) {
        if (this.invincible || this.state === 'HURT') return;

        if (gameState.rings > 0) {
            this.scatterRings();
            this.enterHurtState(sourceX);
        } else {
            this.die();
        }
    }
    
    enterHurtState(sourceX) {
        this.state = 'HURT';
        this.vy = -4;
        this.vx = (this.x < sourceX) ? -3 : 3; // Knockback away from source
        this.onGround = false;
        this.invincible = true;
        this.invincibleTimer = 120; // 2 seconds
    }
    
    scatterRings() {
        let count = Math.min(gameState.rings, 20); // Cap scattered rings
        gameState.rings = 0;
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI / count) * i + Math.PI; // Semicircle up
            const speed = 4 + Math.random() * 2;
            const rx = this.x + this.width/2;
            const ry = this.y + this.height/2;
            const rvx = Math.cos(angle) * speed;
            const rvy = Math.sin(angle) * speed;
            
            // Create scattered ring entity
            const ring = new ScatteredRing(rx, ry, rvx, rvy);
            gameState.entities.push(ring);
        }
        spawnParticles(this.x, this.y, "SPARKLE", 5);
    }

    die() {
        gameState.gamePhase = "GAME_OVER_LOSE";
    }

    render(p) {
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Flash if invincible
        if (this.invincible && p.frameCount % 4 < 2) {
             p.fill(255, 255, 255, 100);
        } else {
             p.fill(30, 30, 200); // Sonic Blue
        }
        
        p.noStroke();
        
        // Draw logic based on state
        if (this.state === 'ROLL' || this.state === 'JUMP' || this.state === 'SPINDASH') {
            // Ball form
            p.rotate(p.frameCount * 0.5 * Math.sign(this.vx || this.facing));
            p.circle(0, 0, this.width);
            // Spikes blur
            p.fill(100, 100, 255);
            p.circle(0, 0, this.width * 0.7);
        } else {
            // Standing/Running
            if (this.facing === -1) p.scale(-1, 1);
            
            // Body
            p.circle(0, 2, 24);
            
            // Head spikes
            p.beginShape();
            p.vertex(-5, -5);
            p.vertex(-15, -5);
            p.vertex(-20, 10);
            p.endShape(p.CLOSE);
            p.beginShape();
            p.vertex(-5, 0);
            p.vertex(-15, 5);
            p.vertex(-20, 15);
            p.endShape(p.CLOSE);
            
            // Face
            p.fill(255, 200, 150); // Tan
            p.circle(4, 0, 14);
            
            // Eye
            p.fill(255);
            p.ellipse(4, -4, 8, 12);
            p.fill(0);
            p.circle(6, -4, 3);
            
            // Shoes
            p.fill(200, 0, 0);
            const legOffset = (this.state === 'RUN') ? Math.sin(p.frameCount * 0.5) * 5 : 0;
            p.rect(-6 + legOffset, 12, 10, 6, 2);
            p.rect(0 - legOffset, 12, 10, 6, 2);
        }
        
        p.pop();
    }
}

export class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y, 30, 25);
        this.type = type; // 'LADYBUG', 'CRAB'
        this.startX = x;
        this.patrolRange = 100;
        this.speed = 1.5;
        this.vx = this.speed;
        this.facing = 1;
        this.color = (type === 'LADYBUG') ? [200, 0, 0] : [200, 50, 50];
    }
    
    update(p) {
        // Patrol Logic
        this.x += this.vx;
        
        if (this.x > this.startX + this.patrolRange) {
            this.vx = -this.speed;
            this.facing = -1;
        } else if (this.x < this.startX) {
            this.vx = this.speed;
            this.facing = 1;
        }
        
        // Map Collision
        const tileBelow = checkMapCollision(this); // Assuming this snaps Y
        
        // Player Collision
        const player = gameState.player;
        if (player && checkEntityCollision(this, player)) {
            // Check if player is attacking (rolling/jumping and falling/moving fast)
            const isAttacking = (player.state === 'ROLL' || player.state === 'JUMP' || player.state === 'SPINDASH');
            const isAbove = (player.y + player.height) < (this.y + this.height/2);
            
            if (isAttacking || (isAbove && player.vy > 0)) {
                // Enemy dies
                this.die();
                player.vy = BOUNCE_FORCE; // Bounce off enemy
                gameState.score += 100;
                spawnParticles(this.x + this.width/2, this.y + this.height/2, "EXPLOSION", 5);
            } else {
                // Player hurt
                player.takeDamage(this.x);
            }
        }
    }
    
    die() {
        this.active = false;
        const idx = gameState.entities.indexOf(this);
        if (idx > -1) gameState.entities.splice(idx, 1);
    }
    
    render(p) {
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        if (this.facing === -1) p.scale(-1, 1);
        
        p.fill(this.color);
        if (this.type === 'LADYBUG') {
            p.arc(0, 0, 30, 25, p.PI, 0); // Dome
            p.fill(0);
            p.circle(-5, -5, 4); // Spot
            p.circle(5, -2, 4);
        } else {
            p.rectMode(p.CENTER);
            p.rect(0, 0, 26, 20);
            p.fill(150);
            p.rect(-10, 5, 5, 10); // Legs
            p.rect(10, 5, 5, 10);
        }
        
        // Eye
        p.fill(255);
        p.circle(8, -2, 8);
        p.fill(0);
        p.circle(10, -2, 2);
        
        p.pop();
    }
}

export class Ring extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20);
        this.angle = 0;
    }
    
    update(p) {
        this.angle += 0.1;
        
        const player = gameState.player;
        if (player && checkEntityCollision(this, player)) {
            gameState.rings++;
            gameState.score += 10;
            this.active = false;
            spawnParticles(this.x + 10, this.y + 10, "SPARKLE", 3);
            
            const idx = gameState.entities.indexOf(this);
            if (idx > -1) gameState.entities.splice(idx, 1);
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x + 10, this.y + 10);
        
        // Spin effect by changing width
        const w = 15 * Math.abs(Math.cos(this.angle));
        
        p.noFill();
        p.stroke(255, 215, 0); // Gold
        p.strokeWeight(3);
        p.ellipse(0, 0, w, 15);
        
        p.pop();
    }
}

export class ScatteredRing extends Entity {
    constructor(x, y, vx, vy) {
        super(x, y, 16, 16);
        this.vx = vx;
        this.vy = vy;
        this.lifetime = 300; // 5 seconds
        this.canCollectTimer = 30; // Cannot collect immediately
        this.angle = 0;
    }
    
    update(p) {
        this.lifetime--;
        this.canCollectTimer--;
        this.angle += 0.2;
        
        // Physics
        this.x += this.vx;
        this.y += this.vy;
        this.vy += GRAVITY;
        
        // Simple floor bounce
        checkMapCollision(this);
        if (this.onGround) {
            this.vy = -this.vy * 0.7; // Bounce
            this.vx *= 0.9;
        }
        
        if (this.lifetime <= 0) {
            this.die();
            return;
        }
        
        // Collection
        if (this.canCollectTimer < 0 && gameState.player && checkEntityCollision(this, gameState.player)) {
            gameState.rings++;
            spawnParticles(this.x + 8, this.y + 8, "SPARKLE", 2);
            this.die();
        }
    }
    
    die() {
        this.active = false;
        const idx = gameState.entities.indexOf(this);
        if (idx > -1) gameState.entities.splice(idx, 1);
    }
    
    render(p) {
        if (this.lifetime < 60 && this.lifetime % 4 < 2) return; // Blink
        
        p.push();
        p.translate(this.x + 8, this.y + 8);
        const w = 12 * Math.abs(Math.cos(this.angle));
        p.noFill();
        p.stroke(255, 215, 0);
        p.strokeWeight(2);
        p.ellipse(0, 0, w, 12);
        p.pop();
    }
}

export class Spring extends Entity {
    constructor(x, y, power = SPRING_FORCE) {
        super(x, y, 30, 20); // Flat on ground
        this.power = power;
        this.animTimer = 0;
    }
    
    update(p) {
        if (this.animTimer > 0) this.animTimer--;
        
        const player = gameState.player;
        if (player && checkEntityCollision(this, player)) {
            // Only trigger if falling on it
            if (player.vy > 0 && player.y + player.height < this.y + this.height + 10) {
                player.vy = this.power;
                player.onGround = false;
                player.state = 'JUMP'; // Force jump state
                this.animTimer = 10;
                // Sound would go here
            }
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        p.fill(200, 50, 50);
        p.rect(0, 10, 30, 10); // Base
        
        const ext = (this.animTimer > 0) ? -10 : 0;
        p.fill(255, 200, 0);
        p.rect(2, 5 + ext, 26, 5); // Plate
        
        // Spring coil
        p.stroke(100);
        p.noFill();
        p.line(5, 10, 10, 5 + ext);
        p.line(10, 5 + ext, 15, 10);
        p.line(15, 10, 20, 5 + ext);
        p.line(20, 5 + ext, 25, 10);
        
        p.pop();
    }
}

export class GoalPost extends Entity {
    constructor(x, y) {
        super(x, y, 40, 80);
        this.spin = 0;
        this.triggered = false;
    }
    
    update(p) {
        if (this.triggered) {
            this.spin += 10;
            return;
        }
        
        if (gameState.player && checkEntityCollision(this, gameState.player)) {
            this.triggered = true;
            gameState.gamePhase = "GAME_OVER_WIN";
            spawnParticles(this.x + 20, this.y, "SPARKLE", 20);
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        // Post
        p.fill(100);
        p.rect(15, 0, 10, 80);
        
        // Sign
        p.translate(20, 20);
        if (this.triggered) p.rotate(p.radians(this.spin));
        
        p.fill(this.triggered ? [0, 0, 255] : [255, 0, 0]); // Robotnik (Red) -> Sonic (Blue)
        p.rectMode(p.CENTER);
        p.rect(0, 0, 40, 40);
        p.fill(255);
        if (this.triggered) {
            p.circle(0, 0, 20); // Sonic face simplified
        } else {
            p.rect(0, -5, 20, 5); // Eggman mustache simplified
        }
        
        p.pop();
    }
}