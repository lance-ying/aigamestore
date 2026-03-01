/**
 * entities.js
 * Classes for Player, Enemies, Collectibles, and Environment Objects.
 */

import { 
    gameState, CANVAS_WIDTH, CANVAS_HEIGHT, 
    GRAVITY, RUN_SPEED, JUMP_FORCE, TILE_SIZE, 
    COLORS, FRICTION, MAX_FALL_SPEED, WALL_SLIDE_SPEED,
    WALL_JUMP_FORCE_X, WALL_JUMP_FORCE_Y
} from './globals.js';
import { resolveWorldCollisions, checkEntityCollisions } from './physics.js';

/* ===========================
   BASE ENTITY
   =========================== */
class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.active = true;
        this.solid = true;
    }

    render(p) {
        // Placeholder
        p.rect(this.x, this.y, this.width, this.height);
    }
}

/* ===========================
   PLAYER
   =========================== */
export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 30, 40);
        this.spawnX = x;
        this.spawnY = y;
        this.reset();
    }

    reset() {
        this.x = this.spawnX;
        this.y = this.spawnY;
        this.vx = 0;
        this.vy = 0;
        this.active = true;
        this.state = "RUNNING"; // RUNNING, JUMPING, FALLING, WALL_SLIDING, DEAD, VICTORY
        this.facing = 1;
        this.jumpTimer = 0;
        this.canDoubleJump = false; // Maybe powerup later
        this.spinAvailable = true;
        this.invincibleTimer = 0;
        this.health = 1;
    }

    update(p, inputKeys) {
        if (!this.active || this.state === "DEAD") {
            // Dead logic (fall off screen)
            this.vy += GRAVITY;
            this.y += this.vy;
            return;
        }

        if (this.state === "VICTORY") {
            // Victory dance or walk off
            this.vx = 2;
            this.x += this.vx;
            this.vy += GRAVITY;
            resolveWorldCollisions(this);
            return;
        }

        /* --- INPUT PROCESSING --- */
        const jumpPressed = inputKeys.space || inputKeys.up;
        const spinPressed = inputKeys.z;
        
        // Auto-run logic: Always try to move right unless wall sliding
        // In "Runner" style, horizontal control is limited. 
        // We set target velocity.
        let targetVx = RUN_SPEED;
        
        // Wall Slide Logic Override
        if (this.state === "WALL_SLIDING") {
            targetVx = 0; // Stick to wall
            // Slide down slowly
            if (this.vy < WALL_SLIDE_SPEED) {
                this.vy = WALL_SLIDE_SPEED;
            }
            
            // Wall Jump
            if (jumpPressed && this.jumpTimer === 0) {
                this.vy = WALL_JUMP_FORCE_Y;
                this.vx = -WALL_JUMP_FORCE_X; // Kick away from wall (left)
                this.state = "JUMPING";
                this.jumpTimer = 15; // Cooldown
                gameState.particlesSystem.spawn(this.x, this.y + this.height/2, 'DUST', 3);
            }
        } else {
            // Normal Movement
            // If we are kicked off a wall, we might have negative velocity.
            // Lerp back to run speed
            if (this.vx < RUN_SPEED) {
                this.vx += 0.2; // Acceleration back to run speed
            } else {
                this.vx = RUN_SPEED;
            }

            // Jump
            // Must be on ground to jump
            if ((this.state === "RUNNING") && jumpPressed && this.jumpTimer === 0) {
                this.vy = JUMP_FORCE;
                this.state = "JUMPING";
                this.jumpTimer = 10; // Input buffer to prevent spam
                this.spinAvailable = true;
                gameState.particlesSystem.spawn(this.x + this.width/2, this.y + this.height, 'DUST', 2);
            }

            // Variable Jump Height (holding space)
            if (this.state === "JUMPING" && !jumpPressed && this.vy < -3) {
                this.vy *= 0.5; // Cut jump short
            }

            // Mid-air Spin (Z key)
            if ((this.state === "JUMPING" || this.state === "FALLING") && spinPressed && this.spinAvailable) {
                this.vy = -3; // Small boost/stall
                this.spinAvailable = false;
                gameState.particlesSystem.spawn(this.x + this.width/2, this.y + this.height/2, 'SPARKLE', 5);
                // Could add audio cue logic here if allowed
            }
        }

        // Apply Gravity
        this.vy += GRAVITY;
        if (this.vy > MAX_FALL_SPEED) this.vy = MAX_FALL_SPEED;

        /* --- PHYSICS & COLLISION --- */
        const collisionResult = resolveWorldCollisions(this);

        // State Updates based on Physics
        if (collisionResult.onGround) {
            this.state = "RUNNING";
            this.spinAvailable = true;
        } else if (this.vy > 0) {
            this.state = "FALLING";
        }

        // Wall detection for sliding
        if (collisionResult.hitRight && !collisionResult.onGround && this.vy > 0) {
            // If hitting a wall while falling, wall slide
            this.state = "WALL_SLIDING";
        }

        // Vaulting Logic (Auto-climb 1-block high walls)
        // If we hit right, check if the wall is short enough to vault
        if (collisionResult.hitRight && collisionResult.onGround && collisionResult.wallObject) {
            // Check the tile above the wall object
            const wallTopY = collisionResult.wallObject.y;
            // A simplified check: if we are on ground and hit a wall, do a mini hop
            // In a real runner, we'd check grid cells. 
            // For now, let's just make the player auto-jump if they hit a wall on the ground
            // This is "Smart Running"
            this.vy = JUMP_FORCE * 0.8; 
            this.state = "JUMPING";
        }

        // Input cooldown decrement
        if (this.jumpTimer > 0) this.jumpTimer--;
        if (this.invincibleTimer > 0) this.invincibleTimer--;

        // Check boundaries
        if (this.y > CANVAS_HEIGHT + 100) {
            this.die();
        }

        // Check Entity Collisions
        this.handleEntityInteractions();
    }

    handleEntityInteractions() {
        const hits = checkEntityCollisions(this, gameState.entities);
        hits.forEach(ent => {
            if (ent instanceof Collectible) {
                ent.collect();
            } else if (ent instanceof Enemy) {
                // Check stomp (player bottom is above enemy center)
                const isStomp = (this.y + this.height < ent.y + ent.height/2) && (this.vy > 0);
                if (isStomp) {
                    ent.die();
                    this.vy = -6; // Bounce
                    this.spinAvailable = true;
                    gameState.score += 200;
                    gameState.particlesSystem.spawn(ent.x, ent.y, 'TEXT', 1, {text: "200"});
                } else if (this.invincibleTimer === 0 && ent.active) {
                    this.takeDamage();
                }
            } else if (ent instanceof GoalPost) {
                this.win();
            }
        });
    }

    takeDamage() {
        this.health--;
        if (this.health <= 0) {
            this.die();
        } else {
            this.invincibleTimer = 60;
            this.vx = -5; // Knockback
            this.vy = -5;
        }
    }

    die() {
        if (this.state !== "DEAD") {
            this.state = "DEAD";
            this.vy = -10; // Death hop
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }

    win() {
        if (this.state !== "VICTORY") {
            this.state = "VICTORY";
            gameState.gamePhase = "GAME_OVER_WIN";
            gameState.score += 1000;
        }
    }

    render(p) {
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Spin animation
        if (!this.spinAvailable && (this.state === "JUMPING" || this.state === "FALLING")) {
            p.rotate(p.frameCount * 0.5);
        } else {
            // Slight tilt based on velocity
            p.rotate(this.vx * 0.05);
        }

        // Draw Player (Mario-like shape)
        p.noStroke();
        // Body (Overalls)
        p.fill(COLORS.MARIO_OVERALLS);
        p.rect(-10, 0, 20, 18, 2);
        // Head/Shirt
        p.fill(COLORS.MARIO_SHIRT);
        p.rect(-12, -18, 24, 18, 4);
        // Hat
        p.fill(COLORS.MARIO_SHIRT);
        p.rect(-14, -22, 28, 6, 2);
        p.rect(-14, -22, 18, 10); // Brim
        // Face
        p.fill(255, 200, 180);
        p.circle(2, -12, 10); 
        // Mustache
        p.fill(0);
        p.rect(2, -8, 8, 3);

        p.pop();
    }
}

/* ===========================
   ENEMIES
   =========================== */
export class Enemy extends Entity {
    constructor(x, y, type="GOOMBA") {
        super(x, y, 32, 32);
        this.type = type;
        this.vx = -1; // Move left slowly
        this.patrolStart = x - 100;
        this.patrolEnd = x + 100;
    }

    update(p) {
        // Simple Physics
        this.vy += GRAVITY;
        resolveWorldCollisions(this);
        
        // Patrol logic
        this.x += this.vx;
        
        // Turn around at walls or edges (simplified: just simple range or collision)
        // Check wall collision
        const nearby = resolveWorldCollisions(this);
        if (nearby.hitLeft || nearby.hitRight) {
            this.vx *= -1;
        }
    }

    die() {
        this.active = false;
        gameState.particlesSystem.spawn(this.x + this.width/2, this.y + this.height/2, 'DEBRIS', 5);
        
        // Remove from entity list
        const idx = gameState.entities.indexOf(this);
        if (idx > -1) gameState.entities.splice(idx, 1);
    }

    render(p) {
        if (!this.active) return;
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        
        if (this.type === "GOOMBA") {
            p.fill(COLORS.GOOMBA);
            // Mushroom shape body
            p.arc(0, 5, 32, 32, p.PI, 0); // Top
            p.rect(-10, 5, 20, 10); // Stem
            // Feet
            p.fill(0);
            const waddle = Math.sin(p.frameCount * 0.2) * 5;
            p.ellipse(-10 + waddle, 15, 12, 8);
            p.ellipse(10 - waddle, 15, 12, 8);
            // Eyes
            p.fill(255);
            p.circle(-6, -2, 8);
            p.circle(6, -2, 8);
            p.fill(0);
            p.circle(-6, -2, 3);
            p.circle(6, -2, 3);
        }
        p.pop();
    }
}

/* ===========================
   COLLECTIBLE
   =========================== */
export class Collectible extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20);
        this.baseY = y;
        this.offset = Math.random() * Math.PI * 2;
        this.solid = false;
    }

    update() {
        // Float animation
        this.y = this.baseY + Math.sin(Date.now() * 0.005 + this.offset) * 5;
    }

    collect() {
        if (!this.active) return;
        this.active = false;
        gameState.score += 50;
        gameState.coins += 1;
        gameState.particlesSystem.spawn(this.x + this.width/2, this.y, 'SPARKLE', 4);
        
        const idx = gameState.entities.indexOf(this);
        if (idx > -1) gameState.entities.splice(idx, 1);
    }

    render(p) {
        if (!this.active) return;
        p.push();
        p.translate(this.x + 10, this.y + 10);
        // Spin effect
        p.scale(Math.abs(Math.sin(p.frameCount * 0.1)), 1);
        
        p.fill(COLORS.COIN);
        p.stroke(218, 165, 32);
        p.strokeWeight(2);
        p.ellipse(0, 0, 20, 24);
        p.fill(218, 165, 32);
        p.rect(-2, -8, 4, 16); // Coin detail
        p.pop();
    }
}

/* ===========================
   GOAL
   =========================== */
export class GoalPost extends Entity {
    constructor(x, y) {
        super(x, y, 20, 160); // Tall pole
        this.solid = false;
    }
    
    update() {}

    render(p) {
        p.push();
        p.translate(this.x, this.y);
        // Pole
        p.fill(200);
        p.rect(0, 0, 10, 160);
        p.fill(50, 200, 50);
        p.circle(5, 0, 15); // Top ball
        
        // Flag
        p.fill(255, 0, 0);
        const wave = Math.sin(p.frameCount * 0.1) * 5;
        p.beginShape();
        p.vertex(10, 10);
        p.vertex(50, 30 + wave);
        p.vertex(10, 50);
        p.endShape(p.CLOSE);
        p.pop();
    }
}

/* ===========================
   TILES (STATIC)
   =========================== */
export class Tile {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.type = type; // "GROUND", "BLOCK", "PIPE"
        this.solid = true;
    }

    render(p, cameraX) {
        // Culling
        if (this.x + this.width < cameraX || this.x > cameraX + CANVAS_WIDTH) return;

        p.push();
        p.noStroke();
        
        if (this.type === "GROUND") {
            p.fill(COLORS.GROUND);
            p.rect(this.x, this.y, TILE_SIZE, TILE_SIZE);
            // Grass top
            p.fill(COLORS.GRASS);
            p.rect(this.x, this.y, TILE_SIZE, 8);
        } else if (this.type === "BLOCK") {
            p.fill(COLORS.BLOCK);
            p.stroke(COLORS.BLOCK_BORDER);
            p.strokeWeight(2);
            p.rect(this.x, this.y, TILE_SIZE, TILE_SIZE);
            // Brick pattern
            p.line(this.x, this.y + TILE_SIZE/2, this.x + TILE_SIZE, this.y + TILE_SIZE/2);
            p.line(this.x + TILE_SIZE/2, this.y, this.x + TILE_SIZE/2, this.y + TILE_SIZE/2);
            p.line(this.x + TILE_SIZE/4, this.y + TILE_SIZE/2, this.x + TILE_SIZE/4, this.y + TILE_SIZE);
            p.line(this.x + TILE_SIZE*0.75, this.y + TILE_SIZE/2, this.x + TILE_SIZE*0.75, this.y + TILE_SIZE);
        } else if (this.type === "PIPE") {
            p.fill(COLORS.PIPE);
            p.stroke(COLORS.PIPE_DARK);
            p.strokeWeight(2);
            p.rect(this.x, this.y, TILE_SIZE, TILE_SIZE);
            // Highlight
            p.noStroke();
            p.fill(100, 255, 100, 100);
            p.rect(this.x + 4, this.y, 6, TILE_SIZE);
        }
        
        p.pop();
    }
}