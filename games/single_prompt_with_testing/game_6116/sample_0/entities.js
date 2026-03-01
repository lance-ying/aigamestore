// entities.js
// Game Entities: Player, Platform, Decoration

import { 
    GRAVITY, JUMP_POWER_MAX, JUMP_X_SPEED, WALK_SPEED, FRICTION_GROUND,
    CANVAS_WIDTH, CANVAS_HEIGHT, gameState 
} from './globals.js';
import { KEYS, isKeyDown } from './input.js';
import { ParticleSystem } from './particles.js';

// Base Entity Class
export class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.vx = 0;
        this.vy = 0;
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    render(p, cameraX, cameraY) {
        // Default render
        p.fill(255);
        p.rect(this.x - cameraX, this.y - cameraY, this.width, this.height);
    }
}

// Player Class
export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 24, 32); // Slightly taller than wide
        
        // Physics State
        this.grounded = false;
        this.facing = 1; // 1 Right, -1 Left
        
        // Jump Charge State
        this.charging = false;
        this.chargeTimer = 0;
        this.maxChargeTime = 60; // 1 second at 60fps
        
        // Animation State
        this.state = "IDLE"; // IDLE, WALK, CHARGE, JUMP, FALL, LAND, BUMP
        this.animTimer = 0;
    }

    update(p) {
        // Handle Input only if Human or Test Controller
        let input = {
            left: false,
            right: false,
            jump: false, // is jump key held
            down: false
        };

        // Determine input source
        if (gameState.controlMode === "HUMAN") {
            input.left = isKeyDown(KEYS.LEFT);
            input.right = isKeyDown(KEYS.RIGHT);
            input.jump = isKeyDown(KEYS.SPACE);
            input.down = isKeyDown(KEYS.DOWN);
        } else {
            // Automated Testing Input
            if (window.get_automated_testing_action) {
                const action = window.get_automated_testing_action(gameState);
                if (action) {
                    if (action.keys) {
                        // Support multiple keys if test returns object
                        input.left = action.keys.includes(KEYS.LEFT);
                        input.right = action.keys.includes(KEYS.RIGHT);
                        input.jump = action.keys.includes(KEYS.SPACE);
                    }
                }
            }
        }

        // --- State Machine ---

        if (this.grounded) {
            // Reset vertical velocity
            this.vy = 0;

            if (this.charging) {
                // CHARGING STATE
                this.vx = 0; // Cannot move while charging
                this.state = "CHARGE";
                
                // Continue charging
                if (input.jump) {
                    this.chargeTimer++;
                    if (this.chargeTimer > this.maxChargeTime) {
                        this.chargeTimer = this.maxChargeTime; // Cap charge
                    }
                    
                    // Facing direction during charge
                    if (input.left) this.facing = -1;
                    if (input.right) this.facing = 1;

                    // Effects
                    if (this.chargeTimer % 5 === 0) {
                        ParticleSystem.emit('charge', this.x + this.width/2, this.y + this.height);
                    }
                } else {
                    // RELEASE JUMP
                    this.performJump();
                }
            } else {
                // NOT CHARGING
                if (input.jump) {
                    // Start Charging
                    this.charging = true;
                    this.chargeTimer = 0;
                    this.vx = 0;
                } else {
                    // MOVEMENT
                    if (input.left) {
                        this.vx = -WALK_SPEED;
                        this.facing = -1;
                        this.state = "WALK";
                        
                        // Dust particles
                        if (p.frameCount % 10 === 0) {
                            ParticleSystem.emit('dust', this.x + this.width, this.y + this.height, 1);
                        }
                    } else if (input.right) {
                        this.vx = WALK_SPEED;
                        this.facing = 1;
                        this.state = "WALK";
                        
                        if (p.frameCount % 10 === 0) {
                            ParticleSystem.emit('dust', this.x, this.y + this.height, 1);
                        }
                    } else {
                        this.vx = 0;
                        this.state = "IDLE";
                    }
                }
            }
        } else {
            // AIRBORNE STATE
            this.state = this.vy < 0 ? "JUMP" : "FALL";
            
            // NO AIR CONTROL (Key mechanic)
            // We do not modify vx based on input here.
            // vx persists or bounces off walls (handled in physics.js).
            
            // Just air friction (usually 1.0 means infinite inertia)
            // But we might want very slight drag if intended, but keeping 1.0 for now.
        }

        // Animation Timer
        this.animTimer++;
    }

    performJump() {
        this.charging = false;
        this.grounded = false;
        
        // Calculate power based on charge time (0 to 1)
        const powerRatio = this.chargeTimer / this.maxChargeTime;
        
        // Minimum jump ensures you don't get stuck just hopping 1 pixel
        const actualPower = Math.max(0.2, powerRatio); 
        
        // Vertical Velocity
        this.vy = -JUMP_POWER_MAX * actualPower;
        
        // Horizontal Velocity
        // In Jump King, if you hold no direction, you jump straight up.
        // If you hold a direction, you jump with fixed X speed.
        // We use this.facing? No, we used input during charge to set facing.
        // Let's check current keys? Or assume facing is the intent.
        // Jump King: You must hold the direction key UP UNTIL release.
        
        // Let's check keys at moment of release.
        let jumpDir = 0;
        if (gameState.controlMode === "HUMAN") {
            if (isKeyDown(KEYS.LEFT)) jumpDir = -1;
            else if (isKeyDown(KEYS.RIGHT)) jumpDir = 1;
        } else {
             // For bot, we assume it holds the key if it wants direction
             // This is tricky for the bot function. Simplified: use `this.facing`
             // if keys are not available in this scope easily without passing logic.
             // Actually, strict Jump King logic:
             // If Left is held: Jump Left.
             // If Right is held: Jump Right.
             // If neither: Straight up.
             
             // We need to know if keys are held NOW.
             // We can use isKeyDown since it's global for Human.
             if (isKeyDown(KEYS.LEFT)) jumpDir = -1;
             else if (isKeyDown(KEYS.RIGHT)) jumpDir = 1;
        }
        
        if (jumpDir !== 0) {
            this.vx = JUMP_X_SPEED * jumpDir;
            this.facing = jumpDir;
        } else {
            this.vx = 0;
        }

        gameState.jumps++;
        ParticleSystem.emit('dust', this.x + this.width/2, this.y + this.height, 10);
    }
    
    handleLanding() {
        ParticleSystem.emit('land', this.x + this.width/2, this.y + this.height, 5);
        // Maybe slight stun/squash effect
    }

    render(p, cameraX, cameraY) {
        const sx = this.x - cameraX;
        const sy = this.y - cameraY;
        
        p.push();
        p.translate(sx + this.width/2, sy + this.height/2);
        
        // Squash and stretch
        let scaleX = 1;
        let scaleY = 1;
        
        if (this.state === "CHARGE") {
            const squash = (this.chargeTimer / this.maxChargeTime) * 0.3;
            scaleX = 1 + squash;
            scaleY = 1 - squash;
            
            // Shake when fully charged
            if (this.chargeTimer === this.maxChargeTime) {
                p.translate((Math.random()-0.5)*2, (Math.random()-0.5)*2);
            }
        } else if (this.state === "JUMP") {
            scaleX = 0.8;
            scaleY = 1.2;
        }
        
        p.scale(scaleX * this.facing, scaleY); // Flip based on facing
        
        // Draw Character (Knight)
        p.noStroke();
        
        // Cape
        p.fill(200, 50, 50);
        p.rect(-8, -10, 16, 24);
        
        // Body (Armor)
        p.fill(100, 100, 120);
        p.rect(-10, -14, 20, 26, 2);
        
        // Helmet
        p.fill(130, 130, 150);
        p.rect(-10, -28, 20, 18, 4, 4, 0, 0);
        
        // Visor
        p.fill(0);
        p.rect(-6, -22, 14, 4);
        
        // Boots
        p.fill(60, 60, 70);
        p.rect(-10, 8, 8, 8);
        p.rect(2, 8, 8, 8);
        
        p.pop();
        
        // Debug: Hitbox
        // p.stroke(0, 255, 0);
        // p.noFill();
        // p.rect(sx, sy, this.width, this.height);
    }
}

// Platform Class
export class Platform extends Entity {
    constructor(x, y, w, h, type = "normal") {
        super(x, y, w, h);
        this.type = type; // normal, ice, bounce, etc.
    }

    render(p, cameraX, cameraY) {
        const sx = this.x - cameraX;
        const sy = this.y - cameraY;
        
        // Check visibility
        if (sx + this.width < 0 || sx > CANVAS_WIDTH || sy + this.height < 0 || sy > CANVAS_HEIGHT) return;

        p.noStroke();
        
        // Main block
        if (this.type === "normal") {
            p.fill(100, 100, 100);
            p.rect(sx, sy, this.width, this.height);
            
            // Texture details
            p.fill(120, 120, 120);
            p.rect(sx, sy, this.width, 4); // Highlight top
            p.fill(80, 80, 80);
            p.rect(sx + this.width - 4, sy, 4, this.height); // Shadow right
            p.rect(sx, sy + this.height - 4, this.width, 4); // Shadow bottom
            
            // Random bricks pattern
            p.fill(90, 90, 90);
            const seed = (this.x * this.y) % 1000;
            // Deterministic pattern using position
            if (this.width > 20 && this.height > 20) {
                 if (seed % 3 === 0) p.rect(sx + 10, sy + 10, 10, 5);
                 if (seed % 2 === 0) p.rect(sx + this.width - 20, sy + this.height/2, 10, 5);
            }
        } else if (this.type === "wall") {
             p.fill(60, 60, 70);
             p.rect(sx, sy, this.width, this.height);
        }
    }
}

// Decoration (Background)
export class Decoration {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // cloud, star, torch
        this.frame = Math.random() * 100;
    }
    
    render(p, cameraX, cameraY) {
        const sx = this.x - cameraX * 0.5; // Parallax
        const sy = this.y - cameraY * 0.5;
        
        // Wrap vertically for infinite bg feel or just render if in view
        
        if (this.type === "star") {
            p.fill(255, 255, 255, 150 + Math.sin(p.frameCount * 0.05 + this.frame) * 100);
            p.noStroke();
            p.circle(sx, sy, 2);
        } else if (this.type === "cloud") {
            p.fill(255, 255, 255, 30);
            p.noStroke();
            p.ellipse(sx, sy, 60, 30);
            p.ellipse(sx+20, sy-10, 40, 30);
        }
    }
}