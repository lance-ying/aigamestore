/**
 * Game entities: Player, Bot, Projectiles, Pickups.
 */
import { gameState, GRAVITY, FRICTION, MAX_SPEED, JUMP_FORCE, WALL_JUMP_FORCE, ACCELERATION, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT, LEVEL_WIDTH, GRAPPLE_STRENGTH } from './globals.js';
import { checkCollisions, checkHazardCollisions, findGrapplePoint, raycast } from './physics.js';
import { KEYS, isKeyDown } from './input.js';
import { spawnParticles } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

class Entity {
    constructor(x, y, width, height, color) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.onWall = 0;
        this.eliminated = false;
        
        this.facing = 1;
    }
    
    render(p) {
        // Base render (override in children)
        p.fill(this.color);
        p.rect(this.x, this.y, this.width, this.height);
    }
}

export class Runner extends Entity {
    constructor(x, y, isBot = false, id = 0) {
        super(x, y, 20, 35, isBot ? COLORS['bot' + id] : COLORS.player);
        this.isBot = isBot;
        this.id = id;
        
        // Gameplay Stats
        this.speedBuff = 0;
        this.inventory = null; // 'rocket', 'bomb'
        this.boostMeter = 100;
        
        // Grapple State
        this.grappleTarget = null; // {x, y}
        this.grappleLength = 0;
        this.isGrappling = false;
        
        // Physics overrides
        this.canDoubleJump = false;
        
        // Trail
        this.history = [];
    }
    
    update(p) {
        if (this.eliminated) return;
        
        this.handleInput(p);
        this.applyPhysics();
        this.checkStatus();
        
        // Trail effect
        if (p.frameCount % 3 === 0 && Math.abs(this.vx) > 8) {
            this.history.push({x: this.x, y: this.y, alpha: 200});
            if (this.history.length > 5) this.history.shift();
        }
    }
    
    handleInput(p) {
        let left = false, right = false, jump = false, grapple = false, item = false;
        let up = false, down = false;

        // 1. Get Input Source
        if (!this.isBot) {
            // Human Controls
            if (gameState.controlMode === "HUMAN") {
                left = isKeyDown(KEYS.LEFT);
                right = isKeyDown(KEYS.RIGHT);
                jump = isKeyDown(KEYS.Z) || isKeyDown(38); // Z or Up for jump (Up also used for aim, tricky. Let's strictly use Z for jump)
                // Wait, Up/Down for aim. Z for Jump.
                up = isKeyDown(KEYS.UP);
                down = isKeyDown(KEYS.DOWN);
                jump = isKeyDown(KEYS.Z);
                grapple = isKeyDown(KEYS.SHIFT);
                item = isKeyDown(KEYS.SPACE);
            } else {
                // Testing Controls
                const action = get_automated_testing_action(gameState);
                if (action) {
                    if (action.keyCode === KEYS.RIGHT) right = true;
                    if (action.keyCode === KEYS.LEFT) left = true;
                    if (action.keyCode === KEYS.Z) jump = true;
                    if (action.keyCode === KEYS.SHIFT) grapple = true;
                }
            }
        } else {
            // Bot AI
            const inputs = this.computeAI(p);
            left = inputs.left;
            right = inputs.right;
            jump = inputs.jump;
            grapple = inputs.grapple;
            item = inputs.item;
            up = inputs.up;
        }

        // 2. Apply Actions
        
        // Movement
        const effectiveSpeed = MAX_SPEED + this.speedBuff;
        if (right) {
            if (this.vx < effectiveSpeed) this.vx += ACCELERATION;
            this.facing = 1;
        } else if (left) {
            if (this.vx > -effectiveSpeed) this.vx -= ACCELERATION;
            this.facing = -1;
        } else {
            this.vx *= FRICTION; // Ground friction
        }
        
        // Air resistance
        if (!this.onGround) {
            this.vx *= 0.98; // Less friction in air
        }

        // Jump
        if (jump) {
            if (this.onGround) {
                this.vy = JUMP_FORCE;
                this.onGround = false;
                spawnParticles(this.x + this.width/2, this.y + this.height, 'dust', 5);
            } else if (this.onWall !== 0) {
                // Wall Jump
                this.vy = WALL_JUMP_FORCE.y;
                this.vx = this.onWall * -1 * WALL_JUMP_FORCE.x; // Jump away from wall
                this.onWall = 0;
                spawnParticles(this.x + (this.onWall === 1 ? this.width : 0), this.y + this.height/2, 'spark', 5);
            }
        }

        // Grapple Logic
        if (grapple) {
            if (!this.isGrappling) {
                // Try to fire grapple
                // Look direction
                let dirX = this.facing;
                let dirY = -0.5; // Default 45 deg up
                if (up) dirY = -1;
                
                const target = findGrapplePoint(this, dirX, dirY);
                if (target) {
                    this.isGrappling = true;
                    this.grappleTarget = target;
                    // Calculate length
                    this.grappleLength = Math.sqrt(Math.pow(target.x - this.x, 2) + Math.pow(target.y - this.y, 2));
                }
            }
        } else {
            this.isGrappling = false;
            this.grappleTarget = null;
        }
        
        // Use Item
        if (item && this.inventory) {
            this.useItem();
        }
    }
    
    applyPhysics() {
        // Grapple Physics override
        if (this.isGrappling && this.grappleTarget) {
            // Simple pendulum-like force
            // Pull towards target
            const dx = this.grappleTarget.x - this.x;
            const dy = this.grappleTarget.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // Normalize
            const dirX = dx / dist;
            const dirY = dy / dist;
            
            // Apply tension force
            // We want to accelerate towards the point
            this.vx += dirX * GRAPPLE_STRENGTH;
            this.vy += dirY * GRAPPLE_STRENGTH;
            
            // Dampen swing velocity slightly to prevent infinite energy
            this.vx *= 0.99;
            this.vy *= 0.99;
            
            // Visual line
            // (Handled in render)
        }
        
        // Gravity
        this.vy += GRAVITY;
        
        // Terminal Velocity
        if (this.vy > 20) this.vy = 20;

        // Collision Check (updates x, y, vx, vy, onGround, onWall)
        checkCollisions(this);
        
        // Hazard Check
        if (checkHazardCollisions(this)) {
            // In a real game, damage or stun. Here: drastic slow down or death?
            // SpeedRunners usually stuns/knockbacks.
            // Let's do knockback.
            this.vy = -10;
            this.vx = -this.facing * 10;
            spawnParticles(this.x, this.y, 'explosion', 10);
            this.speedBuff = -5; // Temp slow
        }
        
        // Update buffering
        if (this.speedBuff < 0) this.speedBuff += 0.05;
        if (this.speedBuff > 0) this.speedBuff -= 0.05;
    }
    
    checkStatus() {
        // Check if off screen relative to camera
        const screenX = this.x - gameState.cameraX;
        const screenY = this.y - gameState.cameraY;
        
        // Determine Elimination
        // Left edge, or fallen into pit
        if (screenX < -50 || screenY > CANVAS_HEIGHT + 100 || screenY < -500) {
            this.die();
        }
    }
    
    die() {
        if (this.eliminated) return;
        this.eliminated = true;
        gameState.aliveCount--;
        spawnParticles(this.x, this.y, 'explosion', 30);
        
        // If player died
        if (!this.isBot) {
            // Player lost
            if (gameState.aliveCount > 0) {
                // Logic handled in Game.js (wait for winner)
            }
        }
    }
    
    computeAI(p) {
        // Simple heuristic AI
        // 1. Move right constantly
        let inputs = { left: false, right: true, jump: false, grapple: false, item: false, up: false };
        
        // 2. Obstacle Avoidance (Raycast ahead)
        // Look ahead 2 tiles
        const lookAheadX = this.x + (this.facing * 80);
        
        // Check for pit
        let floorFound = false;
        // Simple check: iterate platforms to see if there is one at (lookAheadX, this.y + 50)
        for (let plat of gameState.platforms) {
            // Check normalized map position
            // Simplified for prototype:
            // Just jump periodically if slow?
            // Better: Raycast down
        }
        
        // Randomized jumping for variety and obstacle clearing
        // Jump if wall is hit
        if (this.onWall !== 0) {
            inputs.jump = true;
        }
        
        // Jump if gap (random chance to fail/succeed makes it interesting)
        // Jump over hazards
        
        // Simplest effective bot for runner:
        // Always run right.
        // If x velocity drops (stuck), Jump.
        // If in air and falling, maybe Grapple.
        
        if (Math.abs(this.vx) < 1 && !this.isGrappling) {
            inputs.jump = true;
        }
        
        // Random Grapple
        if (!this.onGround && this.y > 200 && Math.random() < 0.05) {
            inputs.grapple = true;
            inputs.up = true;
        }
        // Release grapple if swinging up
        if (this.isGrappling && this.vy < -5) {
            inputs.grapple = false;
        }
        
        return inputs;
    }
    
    render(p) {
        if (this.eliminated) return;
        
        // Render Trail
        this.history.forEach(pos => {
            p.fill(this.color[0], this.color[1], this.color[2], pos.alpha);
            pos.alpha -= 10;
            p.rect(pos.x - gameState.cameraX, pos.y - gameState.cameraY, this.width, this.height);
        });
        
        // Render Grapple
        if (this.isGrappling && this.grappleTarget) {
            p.stroke(COLORS.grappleLine);
            p.strokeWeight(2);
            p.line(
                this.x + this.width/2 - gameState.cameraX, 
                this.y + this.height/2 - gameState.cameraY,
                this.grappleTarget.x - gameState.cameraX,
                this.grappleTarget.y - gameState.cameraY
            );
            p.noStroke();
        }
        
        // Render Body
        const screenX = this.x - gameState.cameraX;
        const screenY = this.y - gameState.cameraY;
        
        p.fill(this.color);
        if (this.invulnerable > 0 && Math.floor(p.frameCount / 4) % 2 === 0) p.fill(255);
        
        p.rect(screenX, screenY, this.width, this.height);
        
        // Eyes (direction)
        p.fill(255);
        if (this.facing === 1) {
            p.rect(screenX + 12, screenY + 5, 5, 5);
        } else {
            p.rect(screenX + 3, screenY + 5, 5, 5);
        }
        
        // Player Marker
        if (!this.isBot) {
            p.fill(255, 255, 0);
            p.triangle(
                screenX + 10, screenY - 15,
                screenX + 5, screenY - 25,
                screenX + 15, screenY - 25
            );
        }
        
        // Name/ID
        // p.fill(255);
        // p.textSize(10);
        // p.text(this.isBot ? `CPU ${this.id}` : "P1", screenX + 10, screenY - 5);
    }
    
    useItem() {
        // TODO: Implement item logic (Rocket spawn)
        this.inventory = null;
    }
}

export class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.collected = false;
    }
    
    update() {
        if (this.collected) return;
        
        // Check collision with all runners
        gameState.entities.forEach(entity => {
            if (entity instanceof Runner && !entity.eliminated) {
                if (entity.x < this.x + this.width && entity.x + entity.width > this.x &&
                    entity.y < this.y + this.height && entity.y + entity.height > this.y) {
                    
                    this.collected = true;
                    entity.inventory = Math.random() > 0.5 ? 'rocket' : 'bomb';
                    spawnParticles(this.x + 15, this.y + 15, 'spark', 10);
                    
                    // Respawn timer? In SpeedRunners boxes respawn.
                    setTimeout(() => { this.collected = false; }, 5000);
                }
            }
        });
    }
    
    render(p) {
        if (this.collected) return;
        
        const screenX = this.x - gameState.cameraX;
        const screenY = this.y - gameState.cameraY;
        
        // Only render if on screen (loop handling logic needed if not spawning infinite)
        // Assume infinite spawn or manual placement in loop
        
        p.fill(255, 200, 0);
        p.rect(screenX, screenY, this.width, this.height);
        p.fill(0);
        p.textSize(20);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("?", screenX + 15, screenY + 15);
    }
}