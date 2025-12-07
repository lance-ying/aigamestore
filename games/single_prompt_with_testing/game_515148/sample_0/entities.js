/**
 * Game Entities
 * Player, Enemies, Items, Environment objects
 */
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS, GRAVITY, WORLD_HEIGHT } from './globals.js';
import { applyPhysics, resolveWorldCollisions, checkPoleOverlap, checkAABB } from './physics.js';

class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.vx = 0;
        this.vy = 0;
        this.ax = 0;
        this.ay = 0;
        this.isStatic = false;
        this.usesGravity = true;
        this.gravityScale = 1;
        this.onGround = false;
        this.active = true;
    }

    update() {}
    render(p) {}
}

/**
 * The Slugcat - Player Character
 */
export class Slugcat extends Entity {
    constructor(x, y) {
        super(x, y, 20, 30); // Hitbox size
        this.color = COLORS.SLUGCAT_BODY;
        
        // Gameplay Stats
        this.food = 0;
        this.maxFood = 7;
        this.health = 100;
        this.isDead = false;
        
        // Movement Params
        this.speed = 4;
        this.crawlSpeed = 2;
        this.jumpForce = -9;
        this.poleClimbSpeed = 3;
        
        // State Machine
        this.state = "IDLE"; // IDLE, RUN, JUMP, CRAWL, CLIMB, EAT, STUNNED
        this.facing = 1; // 1 Right, -1 Left
        this.holding = null; // Entity held in hand
        this.eatTimer = 0;
        
        // Visuals
        this.tailNodes = [];
        for(let i=0; i<5; i++) this.tailNodes.push({x:x, y:y});
    }

    update() {
        if (this.isDead) return;

        const input = gameState.input;

        // --- State Management & Movement ---
        
        // Handle Pole Climbing
        const pole = checkPoleOverlap(this, gameState.poles);
        
        if (this.state === "CLIMB") {
            this.usesGravity = false;
            this.vx = 0;
            this.x = pole.x + (pole.width/2) - (this.width/2); // Snap to pole center
            
            if (input.up) this.vy = -this.poleClimbSpeed;
            else if (input.down) this.vy = this.poleClimbSpeed;
            else this.vy = 0;

            if (input.jump) {
                this.state = "JUMP";
                this.usesGravity = true;
                this.vy = this.jumpForce;
                this.vx = input.left ? -this.speed : (input.right ? this.speed : 0);
            }
            
            // Drop off pole if bottom reached or no pole
            if (!pole) {
                this.state = "JUMP";
                this.usesGravity = true;
            }
        } else {
            // Normal Movement
            this.usesGravity = true;
            
            // Horizontal
            let currentSpeed = input.down ? this.crawlSpeed : this.speed;
            if (input.left) {
                this.vx = -currentSpeed;
                this.facing = -1;
            } else if (input.right) {
                this.vx = currentSpeed;
                this.facing = 1;
            } else {
                this.vx = 0;
            }

            // Jump
            if (input.jump && this.onGround) {
                this.vy = this.jumpForce;
                this.onGround = false;
                this.state = "JUMP";
            }
            
            // Crouch / Crawl
            if (input.down && this.onGround) {
                this.state = Math.abs(this.vx) > 0 ? "CRAWL" : "CROUCH";
            } else if (this.onGround) {
                this.state = Math.abs(this.vx) > 0 ? "RUN" : "IDLE";
            }

            // Enter Climb State
            if (pole && input.up) {
                this.state = "CLIMB";
            }
        }

        // Apply Physics
        applyPhysics(this);
        resolveWorldCollisions(this, gameState.platforms);

        // --- Interaction ---
        
        // Grab / Throw / Eat
        if (input.throw) {
            if (this.holding) {
                if (this.holding instanceof Batfly || this.holding instanceof FoodFruit) {
                    // Eat
                    this.eatTimer++;
                    if (this.eatTimer > 60) {
                        this.eat(this.holding);
                    }
                } else {
                    // Throw (Spear/Rock)
                    this.throwItem();
                }
            } else {
                // Try to grab
                this.tryGrab();
            }
        } else {
            this.eatTimer = 0;
        }
        
        // Update held item position
        if (this.holding) {
            this.holding.x = this.x + (this.width/2) + (this.facing * 5);
            this.holding.y = this.y - 5;
            this.holding.vx = 0;
            this.holding.vy = 0;
        }

        // Procedural Animation (Tail)
        this.updateTail();
    }

    updateTail() {
        let targetX = this.x + this.width/2;
        let targetY = this.y + this.height - 5;
        
        this.tailNodes[0] = {x: targetX, y: targetY};
        for (let i = 1; i < this.tailNodes.length; i++) {
            let prev = this.tailNodes[i-1];
            let curr = this.tailNodes[i];
            
            let dx = prev.x - curr.x;
            let dy = prev.y - curr.y;
            
            // Simple ease-to
            curr.x += dx * 0.3;
            curr.y += dy * 0.3 + (this.vx * -0.1); // Drag effect
            
            // Gravity on tail
            curr.y += 1;
        }
    }

    tryGrab() {
        // Check overlap with items or food
        const grabRange = {x: this.x, y: this.y, width: this.width, height: this.height};
        
        // Check Items
        for (let item of gameState.items) {
            if (item.active && !item.stuck && checkAABB(grabRange, item)) {
                this.holding = item;
                return;
            }
        }
        
        // Check Food
        for (let food of gameState.collectibles) {
            if (food.active && checkAABB(grabRange, food)) {
                this.holding = food;
                return;
            }
        }
    }

    eat(food) {
        if (this.food < this.maxFood) {
            this.food++;
            food.active = false;
            this.holding = null;
            // Spawn particles
            gameState.particles.push(new ParticleExplosion(this.x, this.y, COLORS.FOOD));
        }
    }

    throwItem() {
        if (!this.holding) return;
        
        this.holding.vx = this.facing * 10 + this.vx;
        this.holding.vy = -2;
        this.holding.thrown = true; // Flag for collision damage
        
        // Release
        this.holding = null;
    }

    die() {
        if(this.isDead) return;
        this.isDead = true;
        gameState.gamePhase = "GAME_OVER_LOSE";
    }

    render(p) {
        if (!this.active) return;
        
        // Draw Tail
        p.noFill();
        p.stroke(this.color);
        p.strokeWeight(4);
        p.beginShape();
        for(let node of this.tailNodes) {
            p.vertex(node.x, node.y);
        }
        p.endShape();
        p.noStroke();

        // Draw Body
        p.fill(this.color);
        
        if (this.state === "CRAWL" || this.state === "CROUCH") {
            p.rect(this.x, this.y + 10, this.width, this.height - 10, 5);
        } else {
            p.rect(this.x, this.y, this.width, this.height, 5);
        }

        // Draw Head
        p.circle(this.x + this.width/2, this.y, 18);

        // Draw Eyes
        p.fill(COLORS.SLUGCAT_EYES);
        const eyeOffset = this.facing * 4;
        p.circle(this.x + this.width/2 + eyeOffset - 3, this.y - 2, 3);
        p.circle(this.x + this.width/2 + eyeOffset + 3, this.y - 2, 3);

        // Draw Eating progress
        if (this.holding && this.eatTimer > 0) {
            p.fill(255, 255, 255, 100);
            p.arc(this.x + this.width/2, this.y - 15, 20, 20, 0, (this.eatTimer/60) * p.TWO_PI);
        }
    }
}

/**
 * Lizard - The Predator
 */
export class Lizard extends Entity {
    constructor(x, y, type = "GREEN") {
        super(x, y, 60, 25);
        this.type = type;
        this.color = type === "GREEN" ? COLORS.LIZARD_GREEN : COLORS.LIZARD_PINK;
        
        this.health = type === "GREEN" ? 3 : 2;
        this.speed = type === "GREEN" ? 1.5 : 2.5;
        this.biteRange = 30;
        this.visionRange = 300;
        
        this.state = "PATROL"; // PATROL, CHASE, BITE, STUNNED
        this.facing = 1;
        this.patrolCenter = x;
        this.patrolRadius = 200;
        this.stunTimer = 0;
        
        // Head Hitbox
        this.head = {x: x, y: y, r: 15};
    }

    update() {
        if (!this.active) return;

        // Hit by spear? (Checked in Spear update usually, or global check)
        if (this.stunTimer > 0) {
            this.stunTimer--;
            this.vx = 0;
            this.color = '#888888'; // Grey when stunned
            return;
        } else {
            this.color = this.type === "GREEN" ? COLORS.LIZARD_GREEN : COLORS.LIZARD_PINK;
        }

        const player = gameState.player;
        const distToPlayer = Math.abs(player.x - this.x);
        
        // AI Logic
        switch (this.state) {
            case "PATROL":
                // Walk back and forth
                if (this.x > this.patrolCenter + this.patrolRadius) this.facing = -1;
                if (this.x < this.patrolCenter - this.patrolRadius) this.facing = 1;
                this.vx = this.facing * this.speed * 0.5;
                
                // Spot player
                if (distToPlayer < this.visionRange && Math.abs(player.y - this.y) < 100) {
                    this.state = "CHASE";
                }
                break;
                
            case "CHASE":
                // Run towards player
                this.facing = player.x > this.x ? 1 : -1;
                this.vx = this.facing * this.speed;
                
                // Bite check
                const dx = (player.x + player.width/2) - (this.x + (this.facing===1 ? this.width : 0));
                const dy = (player.y + player.height/2) - (this.y + this.height/2);
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < this.biteRange) {
                    this.state = "BITE";
                }
                
                // Lose sight
                if (distToPlayer > this.visionRange * 1.5) {
                    this.state = "PATROL";
                    this.patrolCenter = this.x;
                }
                break;
                
            case "BITE":
                // Instant kill for now
                if (!player.isDead) {
                    player.die();
                }
                // Cooldown
                this.vx = 0;
                break;
        }

        applyPhysics(this);
        resolveWorldCollisions(this, gameState.platforms);
        
        // Update Head Position
        this.head.x = this.facing === 1 ? this.x + this.width : this.x;
        this.head.y = this.y + this.height/2;
    }

    render(p) {
        if (!this.active) return;
        
        p.push();
        p.fill(this.color);
        p.noStroke();
        
        // Body
        p.rect(this.x, this.y, this.width, this.height, 5);
        
        // Head
        p.ellipse(this.head.x, this.head.y, 25, 20);
        
        // Legs (Procedural Animation placeholder)
        const legOffset = Math.sin(gameState.frameCount * 0.2) * 5;
        p.rect(this.x + 10, this.y + this.height, 5, 8 + legOffset);
        p.rect(this.x + this.width - 15, this.y + this.height, 5, 8 - legOffset);
        
        // Eyes
        p.fill(0); // Black eyes
        p.circle(this.head.x + (this.facing * 5), this.head.y - 5, 4);
        
        p.pop();
    }
    
    hit(damage) {
        this.health -= damage;
        this.stunTimer = 60;
        this.vx = -this.facing * 5; // Knockback
        this.vy = -3;
        
        if (this.health <= 0) {
            this.active = false;
            // Drop corpse? For now just disappear
            gameState.particles.push(new ParticleExplosion(this.x, this.y, this.color));
        }
    }
}

/**
 * Batfly - Food Source
 */
export class Batfly extends Entity {
    constructor(x, y) {
        super(x, y, 10, 10);
        this.usesGravity = false; // Flies
        this.origin = {x, y};
        this.noiseOffset = Math.random() * 1000;
    }

    update() {
        if (!this.active) return;
        if (gameState.player && gameState.player.holding === this) return; // Being held

        // Erratic flight
        const t = gameState.frameCount * 0.05 + this.noiseOffset;
        const nx = Math.sin(t) * 2;
        const ny = Math.cos(t * 1.3) * 2;
        
        this.x += nx;
        this.y += ny;
        
        // Stay near origin
        const dx = this.x - this.origin.x;
        const dy = this.y - this.origin.y;
        if (dx*dx + dy*dy > 2500) { // Return to roost
            this.x -= dx * 0.02;
            this.y -= dy * 0.02;
        }
    }

    render(p) {
        if (!this.active) return;
        p.fill(COLORS.BATFLY);
        p.circle(this.x, this.y, 8);
        
        // Wings
        p.fill(COLORS.BATFLY_WING);
        const wingFlap = Math.sin(gameState.frameCount * 0.8) * 10;
        p.ellipse(this.x - 5, this.y - 5, 8, 4 + wingFlap);
        p.ellipse(this.x + 5, this.y - 5, 8, 4 + wingFlap);
    }
}

/**
 * Blue Fruit - Stationary Food
 */
export class FoodFruit extends Entity {
    constructor(x, y) {
        super(x, y, 12, 12);
        this.usesGravity = false; // Hangs from vine usually
    }
    
    update() {
        if(gameState.player && gameState.player.holding === this) return;
        // Bob slightly
        this.y += Math.sin(gameState.frameCount * 0.05) * 0.1;
    }
    
    render(p) {
        if (!this.active) return;
        p.fill(COLORS.FOOD);
        p.circle(this.x + 6, this.y + 6, 12);
        // Stem
        p.stroke(255);
        p.line(this.x + 6, this.y, this.x + 6, this.y - 5);
        p.noStroke();
    }
}

/**
 * Spear - Weapon
 */
export class Spear extends Entity {
    constructor(x, y) {
        super(x, y, 40, 4);
        this.color = COLORS.SPEAR;
        this.thrown = false;
        this.stuck = false;
        this.gravityScale = 0.5;
    }

    update() {
        if (!this.active) return;
        if (gameState.player && gameState.player.holding === this) return;
        if (this.stuck) return;

        applyPhysics(this);
        
        // Collision with walls
        for (let plat of gameState.platforms) {
            if (checkAABB(this, plat)) {
                if (this.thrown) {
                    this.stuck = true;
                    this.thrown = false;
                    this.vx = 0;
                    this.vy = 0;
                    // Play 'dink' sound effect visually (spark)
                    gameState.particles.push(new ParticleExplosion(this.x, this.y, '#ffffff'));
                } else {
                    resolveWorldCollisions(this, [plat]);
                }
            }
        }
        
        // Collision with enemies
        if (this.thrown) {
            for (let enemy of gameState.enemies) {
                if (enemy.active && checkAABB(this, enemy)) {
                    enemy.hit(1);
                    this.thrown = false;
                    this.vx = -this.vx * 0.5; // Bounce off
                    this.vy = -2;
                    gameState.particles.push(new ParticleExplosion(this.x, this.y, '#ff0000')); // Blood
                }
            }
        }
    }

    render(p) {
        if (!this.active) return;
        p.fill(this.color);
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Rotate based on velocity if moving
        if (!this.stuck && (Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1)) {
            let angle = Math.atan2(this.vy, this.vx);
            p.rotate(angle);
        }
        
        p.rectMode(p.CENTER);
        p.rect(0, 0, 40, 4);
        p.rectMode(p.CORNER);
        p.pop();
    }
}

/**
 * Platform - Static Geometry
 */
export class Platform extends Entity {
    constructor(x, y, w, h) {
        super(x, y, w, h);
        this.isStatic = true;
    }
    render(p) {
        p.fill(COLORS.PLATFORM);
        p.rect(this.x, this.y, this.width, this.height);
        // Add texture/noise detail
        p.stroke(0, 0, 0, 50);
        p.line(this.x, this.y, this.x+this.width, this.y);
        p.line(this.x, this.y+this.height, this.x+this.width, this.y+this.height);
        p.noStroke();
    }
}

/**
 * Pole - Climbable
 */
export class Pole extends Entity {
    constructor(x, y, h) {
        super(x, y, 6, h);
        this.isStatic = true;
    }
    render(p) {
        p.fill(COLORS.POLE);
        p.rect(this.x, this.y, this.width, this.height);
        // Knobs
        p.fill(COLORS.POLE + '88');
        for(let i=0; i<this.height; i+=20) {
            p.rect(this.x-2, this.y+i, 10, 2);
        }
    }
}

/**
 * Shelter - Win Zone
 */
export class Shelter extends Entity {
    constructor(x, y) {
        super(x, y, 60, 80);
        this.isStatic = true;
        this.isOpen = false;
    }
    
    update() {
        if (gameState.player && gameState.player.food >= 4) {
            this.isOpen = true;
        }
        
        // Win Condition
        if (this.isOpen && gameState.player && checkAABB(gameState.player, this)) {
            // Must be 'still' inside shelter
            if (Math.abs(gameState.player.vx) < 0.1) {
                gameState.gamePhase = "GAME_OVER_WIN";
            }
        }
    }
    
    render(p) {
        p.fill(this.isOpen ? COLORS.SHELTER : '#333333');
        p.rect(this.x, this.y, this.width, this.height);
        
        // Door Symbol
        p.fill(0);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(12);
        p.text(this.isOpen ? "OPEN" : "LOCKED", this.x + this.width/2, this.y + 20);
        
        // Symbol
        p.noFill();
        p.stroke(0);
        p.strokeWeight(3);
        p.rect(this.x + 15, this.y + 40, 30, 30);
        p.noStroke();
    }
}

/**
 * Particle Effect
 */
export class ParticleExplosion {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.particles = [];
        this.active = true;
        
        for(let i=0; i<10; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                life: 1.0
            });
        }
    }
    
    update() {
        let alive = false;
        for(let p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // Gravity
            p.life -= 0.05;
            if (p.life > 0) alive = true;
        }
        this.active = alive;
    }
    
    render(p) {
        p.fill(this.color);
        p.noStroke();
        for(let part of this.particles) {
            if(part.life > 0) {
                p.circle(part.x, part.y, part.life * 5);
            }
        }
    }
}