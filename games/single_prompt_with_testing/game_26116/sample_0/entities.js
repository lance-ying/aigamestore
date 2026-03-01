/**
 * Game Entities
 * 
 * Contains the Player, Enemies, Items, and Projectiles classes.
 * Implements extensive logic for movement, state management, and interaction.
 */

import { gameState, TILE_SIZE, GRAVITY, FRICTION, AIR_RESISTANCE, TERMINAL_VELOCITY, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT, ROWS, COLS } from './globals.js';
import { checkMapCollision, checkAABB, getTileAt, raycastMap } from './physics.js';
import { KEYS, isKeyDown, wasKeyPressed } from './input.js';

// ==========================================
// Base Entity
// ==========================================
class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.vx = 0;
        this.vy = 0;
        this.active = true;
        this.facing = 1; // 1 Right, -1 Left
        this.color = [255, 255, 255];
    }

    update() {
        // Base update
    }

    render(p) {
        p.fill(this.color);
        p.rect(this.x, this.y, this.width, this.height);
    }
    
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }
}

// ==========================================
// Player Entity
// ==========================================
export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 14, 14); // Slightly smaller than tile
        this.speed = 3.5;
        this.jumpForce = -7.5;
        this.color = COLORS.PLAYER;
        
        // State
        this.onGround = false;
        this.inWater = false;
        this.isClimbing = false;
        this.invincible = 0; // Frames
        this.health = 3;
        this.maxHealth = 3;
        this.checkpoint = { x, y, roomX: 0, roomY: 0 };
        
        // Animation
        this.squashX = 1;
        this.squashY = 1;
    }

    update(p) {
        if (!gameState.world) return;
        const room = gameState.world.getCurrentRoom();
        
        // 1. Input Handling
        this.handleInput(p);
        
        // 2. Physics & Environment Check
        this.checkEnvironment(room);
        
        // 3. Movement Application (X)
        this.x += this.vx;
        this.handleCollisionsX(room);
        
        // 4. Movement Application (Y)
        this.y += this.vy;
        this.handleCollisionsY(room);
        
        // 5. Screen Transitions
        this.checkRoomTransition();
        
        // 6. Animation Smoothing
        this.squashX = p.lerp(this.squashX, 1, 0.2);
        this.squashY = p.lerp(this.squashY, 1, 0.2);
        
        // 7. Invincibility
        if (this.invincible > 0) this.invincible--;
    }
    
    handleInput(p) {
        // Horizontal Movement
        if (isKeyDown(KEYS.LEFT)) {
            this.vx -= 0.5;
            if (this.vx < -this.speed) this.vx = -this.speed;
            this.facing = -1;
        } else if (isKeyDown(KEYS.RIGHT)) {
            this.vx += 0.5;
            if (this.vx > this.speed) this.vx = this.speed;
            this.facing = 1;
        } else {
            this.vx *= this.onGround ? FRICTION : AIR_RESISTANCE;
        }
        
        if (Math.abs(this.vx) < 0.1) this.vx = 0;

        // Jumping
        if (wasKeyPressed(KEYS.SPACE)) {
            if (this.onGround || this.inWater) {
                this.jump();
                // Create dust particles
                gameState.particles.emit(this.x + this.width/2, this.y + this.height, 'DUST', 3);
            }
        }
        
        // Item Usage
        if (wasKeyPressed(KEYS.Z)) {
            this.useItem(p);
        }
    }
    
    checkEnvironment(room) {
        const center = this.getCenter();
        const tile = getTileAt(center.x, center.y, room);
        
        // Water
        if (tile && tile.type === 'WATER') {
            if (!this.inWater) {
                // Just entered water
                this.vy *= 0.5;
                gameState.particles.emit(this.x + this.width/2, this.y, 'WATER', 5);
            }
            this.inWater = true;
        } else {
            this.inWater = false;
        }
        
        // Ladder
        if (tile && tile.type === 'LADDER') {
            this.isClimbing = true;
        } else {
            this.isClimbing = false;
        }
        
        // Gravity
        if (this.inWater) {
            this.vy = p5.lerp(this.vy, 1, 0.1); // Buoyancy/Drag
            if (isKeyDown(KEYS.UP)) this.vy -= 0.5;
            if (isKeyDown(KEYS.DOWN)) this.vy += 0.5;
        } else if (this.isClimbing) {
            this.vy = 0;
            if (isKeyDown(KEYS.UP)) this.vy = -2;
            if (isKeyDown(KEYS.DOWN)) this.vy = 2;
        } else {
            this.vy += GRAVITY;
            if (this.vy > TERMINAL_VELOCITY) this.vy = TERMINAL_VELOCITY;
        }
        
        // Spikes
        if (tile && tile.type === 'SPIKE') {
            this.takeDamage(1);
        }
    }
    
    handleCollisionsX(room) {
        if (checkMapCollision(this, room)) {
            if (this.vx > 0) { // Moving right
                this.x = Math.floor((this.x + this.width) / TILE_SIZE) * TILE_SIZE - this.width - 0.1;
            } else if (this.vx < 0) { // Moving left
                this.x = Math.floor(this.x / TILE_SIZE) * TILE_SIZE + TILE_SIZE + 0.1;
            }
            this.vx = 0;
        }
    }
    
    handleCollisionsY(room) {
        // Special Platform Check (Bubbles)
        let onPlatform = false;
        gameState.entities.forEach(ent => {
            if (ent instanceof Bubble && ent.active) {
                // Check if landing on bubble
                if (this.vy >= 0 && 
                    this.y + this.height <= ent.y + ent.height/2 && // Was above
                    this.y + this.height + this.vy >= ent.y && // Will fall into
                    this.x + this.width > ent.x && this.x < ent.x + ent.width) {
                        this.y = ent.y - this.height;
                        this.vy = 0;
                        this.onGround = true;
                        onPlatform = true;
                        
                        // Bubble pop effect logic can go here (bounce)
                        ent.wobble();
                }
            }
        });

        if (onPlatform) return;

        if (checkMapCollision(this, room)) {
            if (this.vy > 0) { // Falling
                this.y = Math.floor((this.y + this.height) / TILE_SIZE) * TILE_SIZE - this.height - 0.01;
                this.onGround = true;
                
                // Landing squish
                if (this.vy > 5) {
                    this.squashX = 1.3;
                    this.squashY = 0.7;
                    gameState.shakeAmount = 2;
                }
            } else if (this.vy < 0) { // Jumping into ceiling
                this.y = Math.floor(this.y / TILE_SIZE) * TILE_SIZE + TILE_SIZE + 0.01;
            }
            this.vy = 0;
        } else {
            this.onGround = false;
        }
    }
    
    jump() {
        this.vy = this.jumpForce;
        this.onGround = false;
        this.squashX = 0.7;
        this.squashY = 1.3;
    }
    
    checkRoomTransition() {
        if (this.x < -this.width/2) {
            gameState.world.changeRoom(-1, 0);
            this.x = CANVAS_WIDTH - this.width - 5;
        } else if (this.x > CANVAS_WIDTH - this.width/2) {
            gameState.world.changeRoom(1, 0);
            this.x = 5;
        } else if (this.y < -this.height/2) {
            gameState.world.changeRoom(0, -1);
            this.y = CANVAS_HEIGHT - this.height - 5;
        } else if (this.y > CANVAS_HEIGHT - this.height/2) {
            gameState.world.changeRoom(0, 1);
            this.y = 5;
        }
    }
    
    useItem(p) {
        const item = gameState.collectedItems[gameState.equippedItemIndex];
        if (!item) return;
        
        const cx = this.x + this.width/2;
        const cy = this.y + this.height/2;
        
        if (item === "BUBBLE_WAND") {
            // Spawn bubble in front
            const bx = this.facing === 1 ? this.x + 30 : this.x - 30;
            gameState.entities.push(new Bubble(bx, this.y));
            gameState.particles.emit(bx, this.y, 'GLOW', 5);
        } else if (item === "DISC") {
            // Throw disc
            gameState.entities.push(new Disc(cx, cy, this.facing));
        }
    }
    
    takeDamage(amount) {
        if (this.invincible > 0) return;
        
        this.health -= amount;
        this.invincible = 60;
        gameState.shakeAmount = 5;
        gameState.particles.emit(this.x, this.y, 'EXPLOSION', 10);
        
        if (this.health <= 0) {
            gameState.deaths++;
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }
    
    render(p) {
        if (this.invincible > 0 && Math.floor(p.frameCount / 4) % 2 === 0) return; // Flicker
        
        const w = this.width * this.squashX;
        const h = this.height * this.squashY;
        const x = this.x + (this.width - w) / 2;
        const y = this.y + (this.height - h); // Anchor bottom
        
        // Body
        p.stroke(COLORS.PLAYER_OUTLINE);
        p.fill(COLORS.PLAYER);
        p.strokeWeight(1);
        p.rect(x, y, w, h, 4);
        
        // Eyes
        p.fill(0);
        p.noStroke();
        const eyeOffset = this.facing * 3;
        
        // Blink logic
        if (p.frameCount % 120 < 10) {
            p.rect(x + w/2 + eyeOffset - 2, y + h/3, 4, 1);
        } else {
            p.rect(x + w/2 + eyeOffset - 2, y + h/3 - 1, 2, 4);
            p.rect(x + w/2 + eyeOffset + 2, y + h/3 - 1, 2, 4);
        }
    }
}

// ==========================================
// Items & Projectiles
// ==========================================

export class Bubble extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20);
        this.life = 300; // 5 seconds
        this.bobOffset = Math.random() * Math.PI * 2;
    }
    
    wobble() {
        this.life -= 10;
    }
    
    update() {
        this.life--;
        if (this.life <= 0) this.active = false;
        
        // Bob up
        this.y += Math.sin(gameState.frameCount * 0.05 + this.bobOffset) * 0.2;
        this.y -= 0.2; // Float up slowly
        
        // Pop if hits ceiling
        const room = gameState.world.getCurrentRoom();
        if (checkMapCollision(this, room)) this.active = false;
    }
    
    render(p) {
        p.push();
        p.translate(this.x + this.width/2, this.y + this.height/2);
        p.noFill();
        p.stroke(COLORS.ITEM_BUBBLE);
        p.strokeWeight(2);
        p.circle(0, 0, this.width);
        
        // Shine
        p.noStroke();
        p.fill(255, 255, 255, 150);
        p.circle(-4, -4, 4);
        p.pop();
    }
}

export class Disc extends Entity {
    constructor(x, y, dir) {
        super(x, y, 12, 12);
        this.vx = dir * 6;
        this.vy = 0;
        this.state = 0; // 0: Out, 1: Returning
        this.timer = 0;
    }
    
    update() {
        this.timer++;
        
        // State 0: Moving away
        if (this.state === 0) {
            this.x += this.vx;
            
            // Slow down and return
            if (this.timer > 40) {
                this.vx *= 0.9;
                if (Math.abs(this.vx) < 0.5) {
                    this.state = 1;
                }
            }
            
            // Bounce off walls
            const room = gameState.world.getCurrentRoom();
            if (checkMapCollision(this, room)) {
                this.state = 1;
                this.vx = 0;
            }
            
            // Trigger Switches
            // (Simplified check against tile types is hard since switches are entities usually, 
            // but we can check tile coords for simplicity or iterate entities)
            this.checkSwitchCollision();
        }
        
        // State 1: Return to player
        if (this.state === 1) {
            const player = gameState.player;
            const dx = (player.x + player.width/2) - (this.x + this.width/2);
            const dy = (player.y + player.height/2) - (this.y + this.height/2);
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            this.x += (dx / dist) * 8;
            this.y += (dy / dist) * 8;
            
            if (dist < 20) {
                this.active = false; // Catch
            }
        }
        
        // Particles
        if (gameState.frameCount % 4 === 0) {
            gameState.particles.emit(this.x + 6, this.y + 6, 'GLOW');
        }
    }
    
    checkSwitchCollision() {
        // Iterate world tiles to find switches? Or entities?
        // Let's assume switches are tiles that change state
        const cx = this.x + this.width/2;
        const cy = this.y + this.height/2;
        const tileX = Math.floor(cx / TILE_SIZE);
        const tileY = Math.floor(cy / TILE_SIZE);
        const room = gameState.world.getCurrentRoom();
        
        const tile = room.getTile(tileX, tileY);
        if (tile && tile.type === 'SWITCH_OFF') {
            room.setTile(tileX, tileY, 'SWITCH_ON');
            gameState.world.triggerSwitch(tileX, tileY, room);
            this.state = 1; // Return on hit
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x + 6, this.y + 6);
        p.rotate(gameState.frameCount * 0.5);
        p.noFill();
        p.stroke(COLORS.ITEM_DISC);
        p.strokeWeight(2);
        p.circle(0, 0, 12);
        p.line(-6, 0, 6, 0);
        p.line(0, -6, 0, 6);
        p.pop();
    }
}

export class Collectible extends Entity {
    constructor(x, y, type) {
        super(x, y, 16, 16);
        this.itemType = type; // "BUBBLE_WAND", "DISC"
        this.baseY = y;
    }
    
    update() {
        this.y = this.baseY + Math.sin(gameState.frameCount * 0.1) * 3;
        
        // Check Player Collision
        const p = gameState.player;
        if (checkAABB(this, p)) {
            if (!gameState.collectedItems.includes(this.itemType)) {
                gameState.collectedItems.push(this.itemType);
                // Auto equip
                gameState.equippedItemIndex = gameState.collectedItems.length - 1;
                // Popup or log
                gameState.score += 500;
            }
            this.active = false;
            gameState.particles.emit(this.x, this.y, 'GLOW', 10);
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x + 8, this.y + 8);
        if (this.itemType === "BUBBLE_WAND") {
            p.fill(COLORS.ITEM_BUBBLE);
            p.circle(0, -4, 8);
            p.rect(-1, 0, 2, 8);
        } else {
            p.fill(COLORS.ITEM_DISC);
            p.circle(0, 0, 12);
        }
        p.pop();
    }
}

// ==========================================
// Enemies
// ==========================================

export class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y, 20, 20);
        this.type = type;
        this.color = [255, 100, 100];
    }
    
    update() {
        // Base damage check
        if (checkAABB(this, gameState.player)) {
            gameState.player.takeDamage(1);
        }
    }
}

export class Ghost extends Enemy {
    constructor(x, y) {
        super(x, y, "GHOST");
        this.color = COLORS.GHOST;
        this.speed = 1.0;
        this.width = 18;
        this.height = 24;
    }
    
    update() {
        super.update();
        
        const p = gameState.player;
        const dx = (p.x + p.width/2) - (this.x + this.width/2);
        const dy = (p.y + p.height/2) - (this.y + this.height/2);
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Weeping Angel Logic:
        // Move only if player is NOT looking at ghost
        // Player looks right (1) or left (-1)
        // If player is to the left (dx < 0) and facing right (1), they are NOT looking.
        // If player is to the right (dx > 0) and facing left (-1), they are NOT looking.
        
        let isObserved = false;
        
        // Check facing direction vs relative position
        if (dx < 0 && p.facing === -1) isObserved = true; // Player left, facing left (looking at ghost)
        if (dx > 0 && p.facing === 1) isObserved = true;  // Player right, facing right (looking at ghost)
        
        // Line of sight check (raycast)
        if (isObserved) {
            // Check if wall blocks view
            const room = gameState.world.getCurrentRoom();
            const blocked = raycastMap(p.x+p.width/2, p.y+p.height/2, this.x+this.width/2, this.y+this.height/2, room);
            if (blocked) isObserved = false;
        }

        if (!isObserved && dist < 300) {
            // Move towards player
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
            
            // Phase through walls? Or collide?
            // Ghosts usually fly through walls in this concept
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Hover
        const hover = Math.sin(gameState.frameCount * 0.1) * 2;
        p.translate(0, hover);
        
        p.fill(this.color[0], this.color[1], this.color[2], 180);
        p.noStroke();
        
        // Ghost shape
        p.beginShape();
        p.vertex(0, this.height);
        p.vertex(0, this.height/3);
        p.bezierVertex(0, 0, this.width, 0, this.width, this.height/3);
        p.vertex(this.width, this.height);
        // Ragged bottom
        p.vertex(this.width * 0.75, this.height - 5);
        p.vertex(this.width * 0.5, this.height);
        p.vertex(this.width * 0.25, this.height - 5);
        p.endShape(p.CLOSE);
        
        // Eyes
        p.fill(255);
        p.ellipse(5, 8, 4, 6);
        p.ellipse(13, 8, 4, 6);
        
        p.pop();
    }
}

// Pseudo p5 for lerp in node env if needed, but handled by global instance usually
const p5 = { lerp: (a,b,t) => a + (b-a)*t };