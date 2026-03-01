/**
 * Game Entities Classes
 */

import { gameState, COLORS, CANVAS_HEIGHT, CANVAS_WIDTH } from './globals.js';
import { lerp, randomRange } from './utils.js';

/* ================= PLAYER ================= */
export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 15;
        this.vx = 0;
        this.vy = 0;
        
        this.onGround = false;
        this.canDoubleJump = true;
        this.rotation = 0;
        
        // Stats
        this.speed = 0.5; // Acceleration
        this.maxSpeed = 8;
        this.jumpForce = 10;
        this.energy = 100;
        
        // Visuals
        this.trail = []; // Stores previous positions
    }

    update(p) {
        // Physics update handled in physics.js largely, but input handling here
        
        // Input Forces
        if (gameState.inputs.left) {
            this.vx -= this.speed;
            this.rotation -= 0.2;
        }
        if (gameState.inputs.right) {
            this.vx += this.speed;
            this.rotation += 0.2;
        }

        // Brake
        if (gameState.inputs.brake) {
            this.vx *= 0.9;
        }

        // Jump
        if (gameState.inputs.jump) {
            // We need a way to trigger jump only once per press
            // This is handled by a simple check logic in game loop or here
            // Implementing simplified frame-based check
             if (this.onGround) {
                this.vy = -this.jumpForce;
                this.onGround = false;
                this.createJumpParticles(p);
                // Consume input slightly to prevent flutter (handled by key release usually, but for auto...)
            } else if (this.canDoubleJump && !this.onGround && this.vy > -5) {
                // Double jump
                this.vy = -this.jumpForce * 0.8;
                this.canDoubleJump = false;
                this.createJumpParticles(p);
            }
             // Clear jump input to prevent machine gun jumping if held
             gameState.inputs.jump = false; 
        }

        // Boost
        if (gameState.inputs.boost && this.energy > 0) {
            const dir = this.vx > 0 ? 1 : -1;
            this.vx += dir * 0.5;
            this.energy -= 1;
            this.createBoostParticles(p);
        } else if (this.energy < 100) {
            this.energy += 0.2;
        }

        // Rotation based on movement
        this.rotation += this.vx * 0.1;

        // Update trail
        if (p.frameCount % 3 === 0) {
            this.trail.push({x: this.x, y: this.y, alpha: 1.0});
            if (this.trail.length > 10) this.trail.shift();
        }
        
        // Update trail alpha
        this.trail.forEach(t => t.alpha -= 0.1);
        
        // Log info
        if (p.logs && p.logs.player_info) {
            p.logs.player_info.push({
                x: this.x, y: this.y, vx: this.vx, vy: this.vy,
                frame: p.frameCount
            });
        }
    }

    render(p) {
        // Draw Trail
        p.noStroke();
        for (let t of this.trail) {
            p.fill(COLORS.PLAYER[0], COLORS.PLAYER[1], COLORS.PLAYER[2], t.alpha * 100);
            p.circle(t.x, t.y, this.radius * 2 * 0.8);
        }

        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.rotation);

        // Draw Ball Body
        p.fill(COLORS.PLAYER);
        p.stroke(255);
        p.strokeWeight(2);
        p.circle(0, 0, this.radius * 2);

        // Internal details to show rotation
        p.stroke(COLORS.BACKGROUND);
        p.line(0, -this.radius, 0, this.radius);
        p.line(-this.radius, 0, this.radius, 0);
        
        // Glow effect
        p.drawingContext.shadowBlur = 15;
        p.drawingContext.shadowColor = `rgba(${COLORS.PLAYER[0]},${COLORS.PLAYER[1]},${COLORS.PLAYER[2]}, 0.5)`;
        
        p.pop();
        p.drawingContext.shadowBlur = 0; // Reset
    }

    die() {
        gameState.gamePhase = "GAME_OVER_LOSE";
        // Create death explosion
        for (let i = 0; i < 20; i++) {
            gameState.particles.push(new Particle(this.x, this.y, COLORS.PLAYER));
        }
    }
    
    createJumpParticles(p) {
        for(let i=0; i<5; i++) {
            gameState.particles.push(new Particle(this.x, this.y + this.radius, [255, 255, 255]));
        }
    }
    
    createBoostParticles(p) {
        gameState.particles.push(new Particle(this.x - Math.sign(this.vx)*10, this.y, [255, 100, 0]));
    }
}

/* ================= PLATFORM ================= */
export class Platform {
    constructor(x, y, width, height, type = 'NORMAL') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // NORMAL, BOUNCY, MOVING, VANISHING
        this.active = true;
        
        // Moving platform props
        this.vx = 0;
        this.vy = 0;
        this.originX = x;
        this.range = 100;
        this.moveSpeed = 2;
        
        // Vanishing props
        this.vanishTimer = 0;
        this.isVanishing = false;
    }

    update(p) {
        if (!this.active) return;

        if (this.type === 'MOVING') {
            this.x += this.moveSpeed;
            this.vx = this.moveSpeed;
            if (this.x > this.originX + this.range || this.x < this.originX - this.range) {
                this.moveSpeed *= -1;
            }
        } else if (this.type === 'VANISHING') {
            if (this.isVanishing) {
                this.vanishTimer++;
                // Flash effect
                if (this.vanishTimer > 60) {
                    this.active = false; // Poof
                }
            }
        }
    }
    
    triggerVanish() {
        this.isVanishing = true;
    }

    render(p) {
        if (!this.active) return;
        
        // Determine color
        let col = COLORS.PLATFORM_NORMAL;
        if (this.type === 'BOUNCY') col = COLORS.PLATFORM_BOUNCY;
        if (this.type === 'MOVING') col = COLORS.PLATFORM_MOVING;
        if (this.type === 'VANISHING') col = COLORS.PLATFORM_VANISHING;
        
        // Vanishing flicker
        if (this.isVanishing && Math.floor(Date.now() / 50) % 2 === 0) {
            p.fill(255);
        } else {
            p.fill(col);
        }
        
        p.stroke(255, 50);
        p.strokeWeight(1);
        
        // Stylized rect
        p.rect(this.x, this.y, this.width, this.height, 4);
        
        // Interior Pattern
        p.noStroke();
        p.fill(255, 30);
        p.rect(this.x, this.y, this.width, 4); // Highlight top
    }
}

/* ================= SPIKE ================= */
export class Spike {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 30; // Base width
        this.height = 30;
    }

    render(p) {
        p.fill(COLORS.SPIKE);
        p.noStroke();
        p.triangle(
            this.x, this.y + this.height,
            this.x + this.size / 2, this.y,
            this.x + this.size, this.y + this.height
        );
    }

    checkCollision(player) {
        // Approximated by circle-circle for tip, or simple distance
        // Let's do a simple AABB check for efficiency first
        if (player.x > this.x - player.radius && 
            player.x < this.x + this.size + player.radius &&
            player.y > this.y - player.radius &&
            player.y < this.y + this.height + player.radius) {
                
            // Check closeness to center tip
            const tipX = this.x + this.size / 2;
            const tipY = this.y + 10;
            const d = (player.x - tipX)**2 + (player.y - tipY)**2;
            return d < (player.radius + 10)**2;
        }
        return false;
    }
}

/* ================= COLLECTIBLE ================= */
export class Collectible {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 10;
        this.active = true;
        this.floatOffset = 0;
    }

    update(p) {
        this.floatOffset = Math.sin(p.frameCount * 0.1) * 5;
    }

    render(p) {
        if (!this.active) return;
        p.fill(COLORS.COLLECTIBLE);
        p.noStroke();
        p.circle(this.x, this.y + this.floatOffset, this.radius * 2);
        
        // Shine
        p.fill(255, 200);
        p.circle(this.x - 3, this.y - 3 + this.floatOffset, 4);
    }

    checkCollision(player) {
        const d = (player.x - this.x)**2 + (player.y - (this.y + this.floatOffset))**2;
        return d < (player.radius + this.radius)**2;
    }

    collect() {
        this.active = false;
        gameState.score += 100;
        gameState.orbsCollected += 1;
        // Spawn particle
        for(let i=0; i<5; i++) {
            gameState.particles.push(new Particle(this.x, this.y, COLORS.COLLECTIBLE));
        }
    }
}

/* ================= GOAL ================= */
export class Goal {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 80;
    }

    render(p) {
        // Portal effect
        p.noStroke();
        for(let i=0; i<5; i++) {
            p.fill(COLORS.GOAL[0], COLORS.GOAL[1], COLORS.GOAL[2], 50 - i*10);
            const s = Math.sin(p.frameCount * 0.05 + i) * 10;
            p.rect(this.x - s, this.y, this.width + s*2, this.height);
        }
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("EXIT", this.x + this.width/2, this.y - 20);
    }

    checkReached(player) {
        if (player.x > this.x && player.x < this.x + this.width &&
            player.y > this.y && player.y < this.y + this.height) {
            gameState.gamePhase = "GAME_OVER_WIN";
            return true;
        }
        return false;
    }
}

/* ================= PARTICLE ================= */
export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = randomRange(-2, 2);
        this.vy = randomRange(-2, 2);
        this.life = 1.0;
        this.decay = randomRange(0.02, 0.05);
        this.size = randomRange(2, 5);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    render(p) {
        p.noStroke();
        p.fill(this.color[0], this.color[1], this.color[2], this.life * 255);
        p.circle(this.x, this.y, this.size);
    }
}