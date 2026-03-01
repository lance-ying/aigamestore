/**
 * Game entities: Player, Platform, Decoration.
 */
import { PhysicsBody, resolveCollisions } from './physics.js';
import { gameState, WALK_SPEED, SLOW_WALK_SPEED, JUMP_CHARGE_RATE, MAX_JUMP_POWER, MIN_JUMP_POWER, logGameInfo, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { createParticles } from './particles.js';

// Player States
const STATE_IDLE = 0;
const STATE_WALK = 1;
const STATE_CHARGE = 2;
const STATE_JUMP = 3;
const STATE_FALL = 4;
const STATE_BONK = 5; // Hit a wall

export class Player extends PhysicsBody {
    constructor(x, y) {
        super(x, y, 20, 32); // Width 20, Height 32
        this.color = [200, 50, 50]; // Red cape default
        this.facing = 1; // 1 Right, -1 Left
        this.state = STATE_IDLE;
        this.chargeLevel = 0;
        this.prevY = y;
        this.highestY = y; // Lower is better
    }

    update(p) {
        this.handleInput();
        this.updatePhysics();
        
        // Check collisions with world
        resolveCollisions(this, gameState.platforms);
        
        // Determine State after physics resolution
        this.updateState();
        
        // Check Triggers
        this.checkTriggers();

        // Track Height for Score
        // World coordinates: 0 is top, 4000 is bottom
        // Score is inverted height
        const currentH = Math.max(0, 4000 - (this.y + this.height));
        gameState.currentHeight = Math.floor(currentH);
        if (currentH > gameState.score) {
            gameState.score = Math.floor(currentH);
        }
        
        // Log if falling significantly
        if (this.y - this.prevY > 200) {
            gameState.falls++;
            this.prevY = this.y;
            logGameInfo(p, "game_info", { event: "BIG_FALL", depth: this.y });
        }
        if (this.y < this.prevY) this.prevY = this.y;
    }

    handleInput() {
        const k = gameState.keys;
        
        // If on ground, we have control
        if (this.onGround) {
            // Charging Jump
            if (k.jump) {
                this.state = STATE_CHARGE;
                this.chargeLevel += JUMP_CHARGE_RATE;
                if (this.chargeLevel > MAX_JUMP_POWER) this.chargeLevel = MAX_JUMP_POWER;
                this.vx = 0; // Stop moving while charging
            } else {
                // Was charging? Jump!
                if (this.chargeLevel > 0) {
                    this.performJump();
                } else {
                    // Walking
                    let speed = k.walkSlow ? SLOW_WALK_SPEED : WALK_SPEED;
                    if (k.left) {
                        this.vx = -speed;
                        this.facing = -1;
                        this.state = STATE_WALK;
                    } else if (k.right) {
                        this.vx = speed;
                        this.facing = 1;
                        this.state = STATE_WALK;
                    } else {
                        // Friction handles stopping, but we set idle here logic wise
                        // The physics engine applies friction, so we don't force 0 unless we want snappy movement
                        // Jump King is slightly slippery
                        this.state = STATE_IDLE;
                    }
                }
            }
        } else {
            // In Air - NO CONTROL
            this.state = this.vy > 0 ? STATE_FALL : STATE_JUMP;
            // Charge level useless in air
            this.chargeLevel = 0;
        }
    }

    performJump() {
        // Calculate Jump Power
        let power = Math.max(MIN_JUMP_POWER, this.chargeLevel);
        
        // Vertical Impulse
        this.vy = -power;
        
        // Horizontal Impulse (Fixed based on direction)
        // In Jump King, you jump in the direction you are facing with a specific speed
        // Increased from 5 to 6 to make jumps easier to reach
        const jumpXSpeed = 6.0; 
        
        // Simple logic: Jump in facing direction
        this.vx = this.facing * jumpXSpeed;
        
        this.onGround = false;
        this.state = STATE_JUMP;
        this.chargeLevel = 0;
        
        createParticles(this.x + this.width/2, this.y + this.height, 'DUST', 10);
        gameState.attempts++;
    }

    updateState() {
        if (this.onGround && this.vx === 0 && !gameState.keys.jump) this.state = STATE_IDLE;
        if (this.onGround && Math.abs(this.vx) > 0.1 && !gameState.keys.jump) this.state = STATE_WALK;
        if (gameState.keys.jump && this.onGround) this.state = STATE_CHARGE;
        if (!this.onGround) this.state = this.vy < 0 ? STATE_JUMP : STATE_FALL;
    }
    
    checkTriggers() {
        // Check win condition
        const topOfWorld = 200; // The goal is near y=0-200
        if (this.y < topOfWorld && this.onGround) {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
    }

    render(p) {
        p.push();
        p.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        // Flip based on facing
        p.scale(this.facing, 1);
        
        // Draw Knight
        p.noStroke();
        
        // Cape
        p.fill(180, 20, 20);
        p.beginShape();
        p.vertex(-8, -5);
        p.vertex(-12, 14);
        p.vertex(8, 14);
        p.vertex(8, -5);
        p.endShape(p.CLOSE);

        // Legs
        p.fill(80);
        if (this.state === STATE_WALK) {
            // Simple walk cycle
            let offset = Math.sin(p.frameCount * 0.5) * 5;
            p.rect(-6 + offset, 8, 4, 8);
            p.rect(2 - offset, 8, 4, 8);
        } else if (this.state === STATE_JUMP || this.state === STATE_FALL) {
            p.rect(-6, 6, 4, 8);
            p.rect(2, 4, 4, 10);
        } else {
            p.rect(-6, 8, 4, 8);
            p.rect(2, 8, 4, 8);
        }

        // Body
        p.fill(150); // Armor Grey
        p.rect(-8, -8, 16, 20, 2);
        
        // Head / Helmet
        p.fill(180); // Lighter Grey
        p.rect(-7, -18, 14, 14, 3);
        
        // Helmet Visor
        p.fill(0);
        p.rect(-2, -14, 8, 4);
        
        // Helmet Plume
        p.fill(220, 20, 20);
        p.beginShape();
        p.vertex(0, -18);
        p.vertex(-5, -24);
        p.vertex(2, -22);
        p.endShape();
        
        // Shaking while charging
        if (this.state === STATE_CHARGE) {
            p.translate((Math.random()-0.5)*2, (Math.random()-0.5)*2);
            // Draw charge glow
            p.noFill();
            p.stroke(255, 200, 0, 150 + Math.sin(p.frameCount)*100);
            p.strokeWeight(2);
            p.circle(0, 0, 30 + this.chargeLevel * 2);
        }

        p.pop();
        
        // Debug bounds
        if (gameState.debugMode) {
            p.noFill();
            p.stroke(0, 255, 0);
            p.rect(this.x, this.y, this.width, this.height);
        }
    }
}

export class Platform {
    constructor(x, y, w, h, type = 'STONE') {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.type = type; // STONE, GRASS, SNOW, WOOD
    }

    render(p) {
        // Cull if off screen
        const camY = gameState.camera.y;
        if (this.y > camY + CANVAS_HEIGHT || this.y + this.height < camY) return;

        p.push();
        p.translate(this.x, this.y);
        
        if (this.type === 'STONE') {
            p.fill(80, 80, 90);
            p.stroke(50);
            p.strokeWeight(2);
            p.rect(0, 0, this.width, this.height);
            
            // Texture details
            p.noStroke();
            p.fill(100, 100, 110);
            for(let i=10; i<this.width; i+=40) {
                p.rect(i, 5, 20, 10);
            }
            // Moss
            p.fill(50, 100, 50);
            p.rect(0, 0, this.width, 4);
            
        } else if (this.type === 'WOOD') {
            p.fill(120, 80, 40);
            p.stroke(80, 50, 20);
            p.rect(0, 0, this.width, this.height);
            // Plank lines
            p.stroke(60, 40, 10);
            for(let i=0; i<this.width; i+=20) {
                p.line(i, 0, i, this.height);
            }
        } else if (this.type === 'INVISIBLE') {
             // Wall boundary, debug only
             if (gameState.debugMode) {
                 p.noFill();
                 p.stroke(255, 0, 0);
                 p.rect(0, 0, this.width, this.height);
             }
        } else if (this.type === 'GOAL') {
             p.fill(255, 215, 0); // Gold
             p.rect(0, 0, this.width, this.height);
             p.fill(255);
             p.textAlign(p.CENTER, p.CENTER);
             p.text("GOAL", this.width/2, this.height/2);
        }
        
        p.pop();
    }
}

export class Decoration {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // CLOUD, TORCH, FLAG
    }
    
    render(p) {
        const camY = gameState.camera.y;
        if (this.y > camY + CANVAS_HEIGHT + 100 || this.y < camY - 100) return;

        p.push();
        p.translate(this.x, this.y);
        
        if (this.type === 'CLOUD') {
            p.fill(255, 255, 255, 200);
            p.noStroke();
            p.ellipse(0, 0, 60, 40);
            p.ellipse(30, 0, 50, 30);
            p.ellipse(-30, 0, 50, 30);
        } else if (this.type === 'TORCH') {
            p.fill(100, 50, 0);
            p.rect(-2, 0, 4, 15);
            // Flame
            const fSize = 8 + Math.sin(p.frameCount * 0.2) * 3;
            p.fill(255, 100, 0, 200);
            p.circle(0, -5, fSize);
            p.fill(255, 200, 0, 150);
            p.circle(0, -5, fSize * 0.6);
        }
        
        p.pop();
    }
}