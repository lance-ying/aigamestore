// entities.js - Game objects (Player, Enemies, Items, Blocks)
import { gameState, TILE_SIZE, ENTITY_TYPES, ENEMY_TYPES, GRAVITY, CANVAS_HEIGHT, CANVAS_WIDTH } from './globals.js';
import { applyPhysics, resolveMapCollision, checkAABB } from './physics.js';
import { KEYS } from './input.js';
import { createExplosion, createSparkle } from './particles.js';

// Base Entity Class
class Entity {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.vx = 0;
        this.vy = 0;
        this.active = true;
        this.onGround = false;
        this.facing = 1; // 1 = Right, -1 = Left
    }

    update(p) {
        applyPhysics(this);
        resolveMapCollision(this);
    }

    render(p, cameraX, cameraY) {
        // Placeholder
        p.fill(255);
        p.rect(this.x - cameraX, this.y - cameraY, this.width, this.height);
    }
}

// ------------------------------------------------------------------
// Player Class (Lep)
// ------------------------------------------------------------------
export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 24, 38, ENTITY_TYPES.PLAYER);
        this.speed = 4;
        this.jumpForce = -11;
        this.isDucking = false;
        this.health = 3;
        this.invulnerableTimer = 0;
        this.attackCooldown = 0;
    }

    update(p) {
        // Input Handling
        this.handleMovement(p);
        this.handleActions(p);

        // Physics
        super.update(p);

        // Invulnerability Tick
        if (this.invulnerableTimer > 0) this.invulnerableTimer--;
        if (this.attackCooldown > 0) this.attackCooldown--;

        // Check Entity Collisions (Enemies, Collectibles)
        this.checkEntityInteractions();

        // Check Win Condition (End of level)
        if (this.x > gameState.levelWidth - 100) {
            gameState.gamePhase = "GAME_OVER_WIN";
        }
    }

    handleMovement(p) {
        const keys = gameState.keys;
        const runMult = keys[KEYS.SHIFT] ? 1.5 : 1.0;
        const currentSpeed = this.speed * runMult;

        if (keys[KEYS.LEFT]) {
            this.vx = -currentSpeed;
            this.facing = -1;
        } else if (keys[KEYS.RIGHT]) {
            this.vx = currentSpeed;
            this.facing = 1;
        } else {
            this.vx = 0;
        }

        if ((keys[KEYS.SPACE] || keys[KEYS.UP]) && this.onGround) {
            this.vy = this.jumpForce;
            this.onGround = false;
        }

        this.isDucking = keys[KEYS.DOWN];
    }

    handleActions(p) {
        if (gameState.keys[KEYS.Z] && this.attackCooldown === 0) {
            this.throwProjectile();
            this.attackCooldown = 20; // Frames
        }
    }

    throwProjectile() {
        const px = this.facing === 1 ? this.x + this.width : this.x - 10;
        const py = this.y + 10;
        const proj = new Projectile(px, py, this.facing * 8, -2);
        gameState.entities.push(proj);
    }

    checkEntityInteractions() {
        // Iterate backwards through entities
        for (let i = gameState.entities.length - 1; i >= 0; i--) {
            const e = gameState.entities[i];
            if (!e.active) continue;

            if (checkAABB(this, e)) {
                if (e.type === ENTITY_TYPES.COLLECTIBLE) {
                    e.collect(this);
                } else if (e.type === ENTITY_TYPES.ENEMY) {
                    this.handleEnemyCollision(e);
                }
            }
        }
    }

    handleEnemyCollision(enemy) {
        // Goomba stomp logic: if player is falling and above enemy
        const collisionDepth = (this.y + this.height) - enemy.y;
        
        if (this.vy > 0 && collisionDepth < 15 && this.y < enemy.y) {
            // Stomp success
            enemy.die();
            this.vy = -6; // Bounce
            gameState.score += 50;
            createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, [255, 255, 255]);
        } else {
            // Take damage
            if (this.invulnerableTimer === 0) {
                this.takeDamage();
            }
        }
    }

    takeDamage() {
        this.health--;
        this.invulnerableTimer = 90; // 1.5 seconds at 60fps
        createExplosion(this.x + this.width/2, this.y + this.height/2, [255, 0, 0], 5);
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.active = false;
        gameState.gamePhase = "GAME_OVER_LOSE";
    }

    render(p, cameraX, cameraY) {
        const drawX = this.x - cameraX;
        const drawY = this.y - cameraY;

        // Flicker if invulnerable
        if (this.invulnerableTimer > 0 && Math.floor(gameState.frameCount / 4) % 2 === 0) {
            return; 
        }

        p.push();
        p.translate(drawX + this.width/2, drawY + this.height/2);
        p.scale(this.facing, 1);
        
        // --- Draw Lep ---
        p.noStroke();
        
        // Body (Green Suit)
        p.fill(0, 180, 60);
        p.rect(-10, -10, 20, 25, 4);
        
        // Head
        p.fill(255, 200, 180); // Skin
        p.circle(0, -18, 22);
        
        // Hat
        p.fill(0, 150, 50);
        p.rect(-12, -32, 24, 16); // Top
        p.rect(-16, -16, 32, 4);  // Brim
        p.fill(255, 215, 0);
        p.rect(-12, -20, 24, 4);  // Band gold buckle
        p.fill(0);
        p.rect(-4, -20, 8, 4); // Buckle inner
        
        // Beard (Orange)
        p.fill(230, 100, 20);
        p.arc(0, -15, 24, 24, 0, p.PI);
        
        // Face
        p.fill(0);
        p.circle(4, -20, 2); // Eye
        p.stroke(0);
        p.noFill();
        p.arc(2, -14, 6, 4, 0, p.PI); // Smile

        // Legs (animate)
        p.noStroke();
        p.fill(0, 100, 30); // Pants
        const walkCycle = (this.vx !== 0) ? Math.sin(gameState.frameCount * 0.3) * 6 : 0;
        p.rect(-8 + walkCycle, 12, 6, 8); // Back leg
        p.rect(2 - walkCycle, 12, 6, 8); // Front leg
        
        p.pop();
    }
}

// ------------------------------------------------------------------
// Enemy Classes
// ------------------------------------------------------------------
export class Enemy extends Entity {
    constructor(x, y, width, height, type) {
        super(x, y, width, height, ENTITY_TYPES.ENEMY);
        this.patrolStart = x;
        this.patrolRange = 100;
        this.speed = 1.5;
        this.vx = -this.speed;
        this.enemyType = type;
    }

    update(p) {
        if (!this.active) return;
        
        // Simple AI: Patrol back and forth
        super.update(p); // Apply physics
        
        // Turn around at walls or pits
        if (this.wallHit) {
            this.vx *= -1;
            this.facing *= -1;
        }

        // Patrol logic based on distance
        /* 
        if (Math.abs(this.x - this.patrolStart) > this.patrolRange) {
           this.vx *= -1;
        }
        */
       
       // Snail trail logic handled in rendering
    }

    die() {
        this.active = false;
        createExplosion(this.x + this.width/2, this.y + this.height/2, [100, 100, 100]);
        gameState.score += 20;
    }

    render(p, cameraX, cameraY) {
        const drawX = this.x - cameraX;
        const drawY = this.y - cameraY;
        
        p.push();
        p.translate(drawX + this.width/2, drawY + this.height/2);
        p.scale(this.vx > 0 ? -1 : 1, 1); // Face direction of movement (inverted for snail usually)

        if (this.enemyType === ENEMY_TYPES.SNAIL) {
            // Draw Snail
            p.noStroke();
            // Shell
            p.fill(160, 82, 45); // Brown
            p.circle(0, -5, 20);
            p.stroke(100, 50, 20);
            p.noFill();
            p.arc(0, -5, 12, 12, 0, p.TWO_PI); // Spiral
            
            // Body
            p.noStroke();
            p.fill(200, 200, 150);
            p.ellipse(0, 8, 30, 10);
            
            // Eyes
            p.fill(255);
            p.circle(-8, -10, 6);
            p.circle(8, -10, 6);
            p.fill(0);
            p.circle(-8, -10, 2);
            p.circle(8, -10, 2);
        } else if (this.enemyType === ENEMY_TYPES.BEE) {
            // Draw Bee
            p.noStroke();
            p.fill(255, 255, 0); // Yellow body
            p.ellipse(0, 0, 25, 20);
            p.fill(0);
            p.rect(-5, -10, 5, 20); // Stripes
            p.rect(5, -9, 5, 18);
            
            // Wings (flutter)
            p.fill(255, 255, 255, 200);
            const wingY = Math.sin(gameState.frameCount * 0.8) * 5;
            p.ellipse(-5, -12 + wingY, 12, 8);
            p.ellipse(5, -12 + wingY, 12, 8);
            
            // Stinger
            p.fill(0);
            p.triangle(-12, 0, -18, -2, -18, 2);
        }
        
        p.pop();
    }
}

// ------------------------------------------------------------------
// Collectible Class
// ------------------------------------------------------------------
export class Collectible extends Entity {
    constructor(x, y, subtype) {
        super(x, y, 20, 20, ENTITY_TYPES.COLLECTIBLE);
        this.subtype = subtype; // 'coin', 'clover'
        this.bobOffset = Math.random() * Math.PI * 2;
        this.baseY = y;
    }

    update(p) {
        // Bobbing animation
        this.y = this.baseY + Math.sin(gameState.frameCount * 0.1 + this.bobOffset) * 5;
    }

    collect(player) {
        if (!this.active) return;
        this.active = false;
        
        if (this.subtype === 'coin') {
            gameState.score += 10;
            createSparkle(this.x + 10, this.y + 10);
        } else if (this.subtype === 'clover') {
            player.health = Math.min(player.health + 1, 3);
            gameState.score += 5;
            createSparkle(this.x + 10, this.y + 10);
        }
    }

    render(p, cameraX, cameraY) {
        const drawX = this.x - cameraX;
        const drawY = this.y - cameraY;

        p.push();
        p.translate(drawX + 10, drawY + 10);
        
        if (this.subtype === 'coin') {
            p.fill(255, 215, 0);
            p.stroke(218, 165, 32);
            p.strokeWeight(2);
            p.circle(0, 0, 16);
            p.fill(218, 165, 32);
            p.textSize(10);
            p.textAlign(p.CENTER, p.CENTER);
            p.noStroke();
            p.text("$", 0, 0);
        } else if (this.subtype === 'clover') {
            p.fill(0, 200, 0);
            p.noStroke();
            // Draw 4 circles for leaves
            p.circle(-4, -4, 8);
            p.circle(4, -4, 8);
            p.circle(-4, 4, 8);
            p.circle(4, 4, 8);
        }
        
        p.pop();
    }
}

// ------------------------------------------------------------------
// Projectile Class (Pinecone)
// ------------------------------------------------------------------
export class Projectile extends Entity {
    constructor(x, y, vx, vy) {
        super(x, y, 10, 10, ENTITY_TYPES.PROJECTILE);
        this.vx = vx;
        this.vy = vy;
        this.rotation = 0;
    }

    update(p) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // Gravity
        this.rotation += 0.2;

        // Check collision with map
        if (this.y > CANVAS_HEIGHT || this.x < 0 || this.x > gameState.levelWidth) {
            this.active = false;
        }

        // Check enemies
        for (let e of gameState.entities) {
            if (e.type === ENTITY_TYPES.ENEMY && e.active) {
                if (checkAABB(this, e)) {
                    e.die();
                    this.active = false;
                    createExplosion(this.x, this.y, [150, 75, 0]);
                    break;
                }
            }
        }
    }

    render(p, cameraX, cameraY) {
        p.push();
        p.translate(this.x - cameraX + 5, this.y - cameraY + 5);
        p.rotate(this.rotation);
        p.fill(139, 69, 19); // Brown
        p.ellipse(0, 0, 10, 12);
        // Scales
        p.stroke(100, 50, 10);
        p.line(-3, -2, 3, -2);
        p.line(-4, 2, 4, 2);
        p.pop();
    }
}

// ------------------------------------------------------------------
// Block/Tile Classes (Data only usually, but helper here)
// ------------------------------------------------------------------
export class Tile {
    constructor(type, x, y) {
        this.type = type;
        this.solid = true;
        this.broken = false;
        
        if (type === 'lucky') {
            this.interact = (player) => {
                if (!this.broken) {
                    this.broken = true;
                    // Spawn item above
                    const r = Math.random();
                    const itemType = r > 0.7 ? 'clover' : 'coin';
                    const item = new Collectible(x * TILE_SIZE + 10, (y - 1) * TILE_SIZE, itemType);
                    // Pop up animation
                    item.vy = -5; 
                    gameState.entities.push(item);
                    createExplosion(x * TILE_SIZE + TILE_SIZE/2, y * TILE_SIZE + TILE_SIZE/2, [255, 255, 0], 5);
                }
            };
        } else {
            this.interact = null;
        }
    }
}