/**
 * Game entities including Player, Solids, Spikes, and Collectibles.
 */

import { 
    CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, GRAVITY, FRICTION, 
    JUMP_FORCE, DASH_SPEED, DASH_TIME, DASH_COOLDOWN, 
    MAX_STAMINA, gameState, TERMINAL_VELOCITY 
} from './globals.js';
import { KEYS, isKeyDown, getInputDirection } from './input.js';
import { moveX, moveY, checkAABB } from './physics.js';
import { createParticle } from './particles.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 24;
        
        // Physics
        this.vx = 0;
        this.vy = 0;
        this.remainderX = 0;
        this.remainderY = 0;
        
        // State
        this.facing = 1;
        this.onGround = false;
        this.isClimbing = false;
        this.stamina = MAX_STAMINA;
        this.canDash = true;
        this.isDashing = false;
        this.dashTimer = 0;
        this.dashCooldownTimer = 0;
        this.hairColor = COLORS.player_idle;
        
        // Movement constants
        this.runSpeed = 3;
        this.climbUpSpeed = 1.5;
        this.climbDownSpeed = 2.5;
        this.wallSlideSpeed = 1;
        
        gameState.player = this;
    }
    
    update(p) {
        // Handle Input
        let input = getInputDirection();
        let jumpPressed = (gameState.inputBuffer.jump > 0);
        let dashPressed = (gameState.inputBuffer.dash > 0);
        let grabHeld = isKeyDown(KEYS.SHIFT);
        
        // AI Override
        if (gameState.controlMode !== "HUMAN") {
            const action = get_automated_testing_action(gameState);
            if (action) {
                // Reset inputs
                input = {x: 0, y: 0};
                grabHeld = false;
                
                // Map AI action to controls
                if (action.left) input.x = -1;
                if (action.right) input.x = 1;
                if (action.up) input.y = -1;
                if (action.down) input.y = 1;
                if (action.jump) jumpPressed = true;
                if (action.dash) dashPressed = true;
                if (action.grab) grabHeld = true;
            }
        }

        // --- DASH STATE ---
        if (this.isDashing) {
            this.dashTimer--;
            createParticle(this.x, this.y, 'DASH_TRAIL', {
                color: this.hairColor, 
                w: this.width, 
                h: this.height
            });
            
            // Move dash
            moveX(this, this.vx);
            moveY(this, this.vy);
            
            if (this.dashTimer <= 0) {
                this.isDashing = false;
                this.vx = 0; 
                this.vy = 0;
            }
            return; // Skip rest of physics
        }

        // --- NORMAL STATE ---
        
        // Horizontal Movement
        if (input.x !== 0 && !this.isClimbing) {
            this.vx += input.x * 0.5; // Acceleration
            if (Math.abs(this.vx) > this.runSpeed) {
                this.vx = input.x * this.runSpeed;
            }
            this.facing = input.x;
        } else {
            this.vx *= FRICTION; // Friction
        }
        
        // Stop small drifts
        if (Math.abs(this.vx) < 0.1) this.vx = 0;

        // Apply Horizontal Move
        moveX(this, this.vx);

        // --- CLIMBING / WALL INTERACTION ---
        let touchingWallLeft = false;
        let touchingWallRight = false;
        
        // Check walls (simple 1px check)
        gameState.solids.forEach(solid => {
            if (checkAABB({x: this.x - 1, y: this.y, width: 1, height: this.height}, solid)) touchingWallLeft = true;
            if (checkAABB({x: this.x + this.width, y: this.y, width: 1, height: this.height}, solid)) touchingWallRight = true;
        });

        // Climbing Logic
        this.isClimbing = false;
        if (grabHeld && this.stamina > 0 && (touchingWallLeft || touchingWallRight)) {
            this.isClimbing = true;
            this.canDash = true; // Optional: refill dash on wall? Celeste does NO, unless ground touched. Let's say NO.
            // Actually Celeste refills on ground, not wall.
            
            this.stamina--;
            this.vy = 0;
            
            if (input.y < 0) this.vy = -this.climbUpSpeed;
            if (input.y > 0) this.vy = this.climbDownSpeed;
            
            // Consume stamina faster if moving up
            if (input.y < 0) this.stamina -= 1;
        } else {
            // Gravity
            if (!this.onGround) {
                // Wall slide
                if ((touchingWallLeft || touchingWallRight) && this.vy > 0 && input.x !== 0) {
                     // Pushing against wall while falling
                     this.vy += GRAVITY * 0.2;
                     if (this.vy > this.wallSlideSpeed) this.vy = this.wallSlideSpeed;
                } else {
                    this.vy += GRAVITY;
                }
            }
            
            // Regain stamina on ground
            if (this.onGround) {
                this.stamina = MAX_STAMINA;
                this.canDash = true;
                this.hairColor = COLORS.player_idle;
            }
        }
        
        // --- JUMPING ---
        if (jumpPressed) {
            if (this.onGround) {
                this.vy = JUMP_FORCE;
                this.onGround = false;
                gameState.inputBuffer.jump = 0; // Consume buffer
                createParticle(this.x + this.width/2, this.y + this.height, 'DUST');
            } else if (this.isClimbing || touchingWallLeft || touchingWallRight) {
                // Wall Jump
                this.vy = JUMP_FORCE;
                let wallDir = touchingWallLeft ? -1 : 1;
                
                if (this.isClimbing) {
                    // Climb Jump (Straight up or away)
                    if (input.x === 0) {
                        this.vx = -wallDir * 2; // slight push off
                    } else if (input.x === -wallDir) {
                        this.vx = -wallDir * 3; // jump away
                    } else {
                        // jump towards (climb up)
                        this.vx = wallDir * 1;
                    }
                } else {
                    // Normal Wall Jump (kick off)
                    this.vx = -wallDir * 3;
                }
                
                this.stamina -= 20; // Wall jumping costs stamina
                gameState.inputBuffer.jump = 0;
            }
        }

        // --- DASHING ---
        if (dashPressed && this.canDash && this.dashCooldownTimer <= 0) {
            this.isDashing = true;
            this.canDash = false;
            this.hairColor = COLORS.player_no_dash;
            this.dashTimer = DASH_TIME;
            this.dashCooldownTimer = DASH_COOLDOWN;
            gameState.inputBuffer.dash = 0;
            
            // Determine Direction (8-way)
            let dx = 0;
            let dy = 0;
            if (input.x !== 0) dx = input.x;
            if (input.y !== 0) dy = input.y;
            if (dx === 0 && dy === 0) dx = this.facing; // Default forward
            
            // Normalize for diagonal speed
            if (dx !== 0 && dy !== 0) {
                dx *= 0.707;
                dy *= 0.707;
            }
            
            this.vx = dx * DASH_SPEED;
            this.vy = dy * DASH_SPEED;
        }
        
        if (this.dashCooldownTimer > 0) this.dashCooldownTimer--;

        // Terminal Velocity
        if (this.vy > TERMINAL_VELOCITY) this.vy = TERMINAL_VELOCITY;

        // Apply Vertical Move
        let hitGroundOrCeiling = moveY(this, this.vy);
        if (hitGroundOrCeiling) {
            // onGround is set in moveY if moving down
        } else {
            this.onGround = false;
        }
        
        // Log player info occasionally
        if (p.frameCount % 10 === 0 && p.logs && p.logs.player_info) {
            p.logs.player_info.push({
                x: this.x,
                y: this.y,
                vx: this.vx,
                vy: this.vy,
                stamina: this.stamina,
                state: this.isDashing ? 'DASH' : (this.isClimbing ? 'CLIMB' : 'NORMAL'),
                framecount: p.frameCount
            });
        }
    }
    
    refillDash() {
        this.canDash = true;
        this.hairColor = COLORS.player_idle;
    }
    
    die() {
        // Spawn particles
        for (let i = 0; i < 10; i++) {
            createParticle(this.x + this.width/2, this.y + this.height/2, 'DEATH');
        }
        
        gameState.deathCount++;
        
        // Simple respawn logic: Go to start or checkpoint
        // For this demo: Restart Level
        // In a full game, we'd have a respawn function
        gameState.gamePhase = "GAME_OVER_LOSE";
    }
    
    render(p) {
        p.push();
        
        // After-images / Hair
        // p.fill(this.hairColor); 
        // We simplified hair to just body color for this constraint set without complex trail logic
        
        p.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Draw Player Body
        p.noStroke();
        p.fill(this.hairColor[0], this.hairColor[1], this.hairColor[2]);
        p.rectMode(p.CENTER);
        
        // Squash and stretch
        let w = this.width;
        let h = this.height;
        if (this.isDashing) {
            w = 20; h = 12;
            p.rotate(Math.atan2(this.vy, this.vx));
        } else if (!this.onGround && Math.abs(this.vy) > 2) {
            w = 12; h = 28;
        } else if (this.onGround && Math.abs(this.vx) > 0.1) {
             // walking bob
             h = 24 - Math.sin(p.frameCount * 0.5) * 2;
        }
        
        p.rect(0, 0, w, h);
        
        // Eyes
        p.fill(255);
        let lookX = (this.facing) * 3;
        if (this.isClimbing) lookX = (this.facing) * 5;
        p.circle(lookX - 3, -4, 4);
        p.circle(lookX + 3, -4, 4);
        p.fill(0);
        p.circle(lookX - 3, -4, 2);
        p.circle(lookX + 3, -4, 2);
        
        p.pop();
        
        // Stamina bar if climbing
        if (this.stamina < MAX_STAMINA) {
            p.noStroke();
            p.fill(0);
            p.rect(this.x - 2, this.y - 10, this.width + 4, 4);
            p.fill(0, 255, 0);
            if (this.stamina < 30) p.fill(255, 0, 0); // Blink/Red low stamina
            p.rect(this.x - 2, this.y - 10, (this.width + 4) * (this.stamina / MAX_STAMINA), 4);
        }
    }
}

export class Solid {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = 'SOLID';
        gameState.solids.push(this);
    }
    
    render(p) {
        p.fill(COLORS.wall);
        p.stroke(20);
        p.rect(this.x, this.y, this.width, this.height);
        
        // Snow on top
        p.noStroke();
        p.fill(COLORS.snow);
        p.rect(this.x, this.y, this.width, 4);
    }
}

export class Spike {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.type = type; // UP, DOWN, LEFT, RIGHT
        gameState.hazards.push(this);
    }
    
    render(p) {
        p.fill(COLORS.spike);
        p.noStroke();
        p.beginShape();
        if (this.type === 'UP') {
            p.vertex(this.x, this.y + this.height);
            p.vertex(this.x + this.width / 2, this.y);
            p.vertex(this.x + this.width, this.y + this.height);
        } else if (this.type === 'DOWN') {
            p.vertex(this.x, this.y);
            p.vertex(this.x + this.width / 2, this.y + this.height);
            p.vertex(this.x + this.width, this.y);
        } else if (this.type === 'LEFT') {
            p.vertex(this.x + this.width, this.y);
            p.vertex(this.x, this.y + this.height / 2);
            p.vertex(this.x + this.width, this.y + this.height);
        } else if (this.type === 'RIGHT') {
            p.vertex(this.x, this.y);
            p.vertex(this.x + this.width, this.y + this.height / 2);
            p.vertex(this.x, this.y + this.height);
        }
        p.endShape(p.CLOSE);
    }
}

export class Strawberry {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 14;
        this.height = 18;
        this.baseY = y;
        this.wobble = Math.random() * Math.PI * 2;
        gameState.collectibles.push(this);
    }
    
    collect() {
        createParticle(this.x + 7, this.y + 9, 'COLLECT');
        gameState.score += 1000;
    }
    
    render(p) {
        this.wobble += 0.05;
        this.y = this.baseY + Math.sin(this.wobble) * 3;
        
        p.fill(COLORS.strawberry);
        p.noStroke();
        p.push();
        p.translate(this.x + 7, this.y + 9);
        p.scale(1 + Math.sin(this.wobble)*0.1, 1 - Math.sin(this.wobble)*0.1);
        
        // Body
        p.beginShape();
        p.vertex(0, 9);
        p.vertex(-7, 0);
        p.vertex(-4, -5);
        p.vertex(4, -5);
        p.vertex(7, 0);
        p.endShape(p.CLOSE);
        
        // Leaves
        p.fill(0, 200, 50);
        p.rect(-5, -8, 10, 3);
        
        p.pop();
    }
}

export class DashCrystal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.active = true;
        this.respawnTimer = 0;
        this.destroyOnTouch = false;
        gameState.triggers.push(this);
    }
    
    onCollide(player) {
        if (!this.active) return;
        if (!player.canDash) {
            player.refillDash();
            this.active = false;
            this.respawnTimer = 180; // 3 seconds
            createParticle(this.x + 8, this.y + 8, 'COLLECT', {color: COLORS.crystal});
        }
    }
    
    update() {
        if (!this.active) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) this.active = true;
        }
    }
    
    render(p) {
        if (!this.active) {
            p.fill(50);
            p.rect(this.x + 6, this.y + 6, 4, 4);
            return;
        }
        
        p.push();
        p.translate(this.x + 8, this.y + 8);
        p.rotate(p.frameCount * 0.05);
        p.fill(COLORS.crystal);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(0, 0, 10, 10);
        p.stroke(255);
        p.noFill();
        p.rect(0, 0, 14, 14);
        p.pop();
    }
}

export class Goal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 40;
        this.destroyOnTouch = false;
        gameState.triggers.push(this);
    }
    
    onCollide(player) {
        gameState.gamePhase = "GAME_OVER_WIN";
    }
    
    render(p) {
        // Flag pole
        p.stroke(255);
        p.strokeWeight(2);
        p.line(this.x, this.y, this.x, this.y + 40);
        
        // Flag
        p.noStroke();
        p.fill(COLORS.gold);
        p.triangle(this.x, this.y, this.x + 20, this.y + 10, this.x, this.y + 20);
    }
}