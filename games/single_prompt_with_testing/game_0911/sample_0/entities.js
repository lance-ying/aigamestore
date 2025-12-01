import { gameState, GRAVITY, TERMINAL_VELOCITY, TILE_SIZE, TOOL, CANVAS_WIDTH, CANVAS_HEIGHT, TILE } from './globals.js';
import { resolveMapCollision, getTileAt, setTileAt, checkAABB } from './physics.js';
import { spawnParticle } from './particles.js';

class Entity {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        this.vx = 0;
        this.vy = 0;
        this.onGround = false;
        this.facing = 1; // 1 Right, -1 Left
        this.health = 100;
        this.maxHealth = 100;
        this.dead = false;
    }

    update() {
        // Apply Gravity
        this.vy += GRAVITY;
        if (this.vy > TERMINAL_VELOCITY) this.vy = TERMINAL_VELOCITY;
        
        // Physics resolution
        resolveMapCollision(this);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    die() {
        this.dead = true;
    }
    
    renderAt(p, screenX, screenY) {
        // Base render (override in children)
        p.fill(255);
        p.rect(screenX, screenY, this.width, this.height);
    }
}

export class Player extends Entity {
    constructor(x, y) {
        super(x, y, 20, 38);
        this.speed = 4;
        this.jumpPower = -10;
        this.currentTool = TOOL.PICKAXE;
        this.reach = 60; // Pixels interaction range
        this.invincibilityTimer = 0;
        
        // Animation
        this.walkCycle = 0;
    }

    update(p) {
        // Input Handling is done in input.js setting vx
        
        // Jump handled in input.js
        
        // Friction
        if (this.onGround) {
            this.vx *= 0.8;
        } else {
            this.vx *= 0.95; // Air resistance
        }
        
        if (Math.abs(this.vx) < 0.1) this.vx = 0;

        // Facing direction
        if (this.vx > 0.1) this.facing = 1;
        if (this.vx < -0.1) this.facing = -1;
        
        // Invincibility
        if (this.invincibilityTimer > 0) this.invincibilityTimer--;

        super.update();
        
        // Check collision with enemies
        if (this.invincibilityTimer === 0) {
            gameState.enemies.forEach(enemy => {
                if (checkAABB(this, enemy)) {
                    this.takeDamage(10);
                    // Knockback
                    this.vx = (this.x < enemy.x ? -1 : 1) * 8;
                    this.vy = -5;
                    this.invincibilityTimer = 60; // 1 second
                    spawnParticle(this.x + this.width/2, this.y + this.height/2, [255, 0, 0], 10);
                }
            });
        }
        
        // Check collision with items
        for (let i = gameState.items.length - 1; i >= 0; i--) {
            const item = gameState.items[i];
            if (checkAABB(this, item)) {
                if (item.type === "GOLD_ORE") {
                    gameState.goldCollected++;
                    // Win Condition check
                    if (gameState.goldCollected >= gameState.goldToWin) {
                        gameState.gamePhase = "GAME_OVER_WIN";
                    }
                } else if (item.type === "HEART") {
                    this.health = Math.min(this.maxHealth, this.health + 20);
                }
                gameState.items.splice(i, 1);
            }
        }
        
        // Walk cycle
        if (Math.abs(this.vx) > 0.5 && this.onGround) {
            this.walkCycle += 0.2;
        } else {
            this.walkCycle = 0;
        }
        
        // Log info
        if (p.frameCount % 60 === 0) {
            p.logs.player_info.push({
                x: this.x,
                y: this.y,
                health: this.health,
                gold: gameState.goldCollected,
                timestamp: Date.now()
            });
        }
    }

    useTool(directionVec) {
        // Calculate target center
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        
        // Target point based on direction inputs or facing
        let targetX = centerX + (directionVec.x !== 0 ? directionVec.x : this.facing) * TILE_SIZE;
        let targetY = centerY + directionVec.y * TILE_SIZE;
        
        if (directionVec.x === 0 && directionVec.y === 0) {
             // Default forward
             targetX = centerX + this.facing * TILE_SIZE;
        }
        
        // Combat
        if (this.currentTool === TOOL.SWORD) {
            // Create a hitbox
            const hitbox = {
                x: targetX - 20,
                y: targetY - 20,
                width: 40,
                height: 40
            };
            
            // Visual slash
            spawnParticle(targetX, targetY, [200, 200, 255], 5);
            
            gameState.enemies.forEach(enemy => {
                if (checkAABB(hitbox, enemy)) {
                    enemy.takeDamage(35);
                    // Knockback enemy
                    enemy.vx = (enemy.x > this.x ? 1 : -1) * 5;
                    enemy.vy = -3;
                    spawnParticle(enemy.x + enemy.width/2, enemy.y + enemy.height/2, [100, 255, 100], 8);
                }
            });
        }
        // Mining
        else if (this.currentTool === TOOL.PICKAXE) {
            const tileType = getTileAt(targetX, targetY);
            if (tileType !== TILE.AIR && tileType !== TILE.BEDROCK) {
                // Determine mining speed/success (Instant for gameplay flow)
                const tx = Math.floor(targetX / TILE_SIZE) * TILE_SIZE;
                const ty = Math.floor(targetY / TILE_SIZE) * TILE_SIZE;
                
                // Distance check
                const dist = Math.sqrt(Math.pow(targetX - centerX, 2) + Math.pow(targetY - centerY, 2));
                if (dist <= this.reach) {
                    setTileAt(targetX, targetY, TILE.AIR);
                    spawnParticle(targetX, targetY, [139, 69, 19], 8);
                    
                    // Drops
                    if (tileType === TILE.GOLD) {
                        gameState.items.push(new Item(tx + 8, ty + 8, "GOLD_ORE"));
                        spawnParticle(tx, ty, [255, 215, 0], 10);
                    }
                }
            }
        }
    }

    die() {
        super.die();
        gameState.gamePhase = "GAME_OVER_LOSE";
    }

    render(p) {
        const sx = this.x - gameState.cameraX;
        const sy = this.y - gameState.cameraY;
        
        p.push();
        p.translate(sx + this.width/2, sy + this.height/2);
        p.scale(this.facing, 1);
        
        // Blink if invincible
        if (Math.floor(this.invincibilityTimer / 4) % 2 === 0) {
            // Body
            p.fill(200, 50, 50); // Red Shirt
            p.rect(-this.width/2, -this.height/2 + 5, this.width, this.height - 15);
            
            // Head
            p.fill(255, 200, 180); // Skin
            p.rect(-this.width/2 + 2, -this.height/2 - 5, this.width - 4, 15);
            
            // Legs
            p.fill(50, 50, 200); // Blue Pants
            // Animate legs
            const legOffset = Math.sin(this.walkCycle) * 5;
            p.rect(-this.width/2, this.height/2 - 10, this.width/2 - 1, 10 + legOffset);
            p.rect(1, this.height/2 - 10, this.width/2 - 1, 10 - legOffset);
            
            // Arms
            p.fill(255, 200, 180);
            p.rect(-2, 0, 4, 15);
            
            // Tool
            p.push();
            p.translate(10, 5);
            p.rotate(Math.sin(p.frameCount * 0.1) * 0.5); // Idle sway
            if (this.currentTool === TOOL.PICKAXE) {
                p.fill(150);
                p.rect(0, -10, 4, 20); // Handle
                p.fill(100);
                p.arc(2, -10, 20, 10, p.PI, 0); // Head
            } else {
                p.fill(200);
                p.rect(0, -15, 4, 25); // Blade
                p.fill(139, 69, 19);
                p.rect(-3, 8, 10, 4); // Guard
            }
            p.pop();
        }
        
        p.pop();
        
        // Highlight Target Tile
        const directionVec = { x: 0, y: 0 };
        if (p.keyIsDown(38)) directionVec.y = -1; // UP
        else if (p.keyIsDown(40)) directionVec.y = 1; // DOWN
        
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        let targetX = centerX + (directionVec.x !== 0 || directionVec.y === 0 ? this.facing : 0) * TILE_SIZE;
        let targetY = centerY + directionVec.y * TILE_SIZE;
        
        if (directionVec.y === 0) targetX = centerX + this.facing * TILE_SIZE;

        const tx = Math.floor(targetX / TILE_SIZE) * TILE_SIZE - gameState.cameraX;
        const ty = Math.floor(targetY / TILE_SIZE) * TILE_SIZE - gameState.cameraY;
        
        p.noFill();
        p.stroke(255, 255, 0, 150);
        p.strokeWeight(2);
        p.rect(tx, ty, TILE_SIZE, TILE_SIZE);
        p.noStroke();
    }
}

export class Enemy extends Entity {
    constructor(x, y) {
        super(x, y, 30, 20); // Slime dimensions
        this.color = [0, 200, 50];
        this.jumpTimer = Math.random() * 100;
        this.direction = Math.random() > 0.5 ? 1 : -1;
    }

    update() {
        if (!gameState.player) return;

        // Slime AI: Hop towards player
        this.jumpTimer++;
        
        if (this.onGround) {
            this.vx = 0;
            if (this.jumpTimer > 120) {
                this.jumpTimer = 0;
                // Jump towards player
                const dx = gameState.player.x - this.x;
                this.direction = dx > 0 ? 1 : -1;
                this.vx = this.direction * 2;
                this.vy = -8;
            }
        }
        
        super.update();
        
        // Remove if far below world
        if (this.y > gameState.worldHeight + 100) this.dead = true;
    }
    
    die() {
        super.die();
        // Drop heart sometimes
        if (Math.random() < 0.3) {
            gameState.items.push(new Item(this.x, this.y, "HEART"));
        }
    }

    render(p) {
        const sx = this.x - gameState.cameraX;
        const sy = this.y - gameState.cameraY;
        
        if (sx + this.width < 0 || sx > CANVAS_WIDTH || sy + this.height < 0 || sy > CANVAS_HEIGHT) return;

        p.fill(this.color);
        // Squish effect when landing
        let h = this.height;
        let w = this.width;
        if (this.onGround && Math.abs(this.vy) < 0.5) {
             // Breathe
             h += Math.sin(gameState.frameCount * 0.1) * 2;
             w -= Math.sin(gameState.frameCount * 0.1) * 2;
        }
        
        p.ellipseMode(p.CORNER);
        p.ellipse(sx + (this.width - w)/2, sy + (this.height - h), w, h);
        
        // Eyes
        p.fill(255);
        p.circle(sx + w*0.3, sy + h*0.4, 8);
        p.circle(sx + w*0.7, sy + h*0.4, 8);
        p.fill(0);
        p.circle(sx + w*0.3 + this.direction, sy + h*0.4, 3);
        p.circle(sx + w*0.7 + this.direction, sy + h*0.4, 3);
    }
}

export class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        this.type = type; // "GOLD_ORE", "HEART"
        this.bobOffset = 0;
        this.vy = 0;
    }
    
    update() {
        this.bobOffset += 0.1;
        // Simple gravity
        this.vy += GRAVITY;
        this.y += this.vy;
        
        // Simple collision
        if (isTileSolid(getTileAt(this.x + 8, this.y + 16))) {
             this.y = Math.floor((this.y + 16)/TILE_SIZE)*TILE_SIZE - 16;
             this.vy = 0;
        }
    }
    
    render(p) {
        const sx = this.x - gameState.cameraX;
        const sy = this.y - gameState.cameraY + Math.sin(this.bobOffset) * 3;
        
        if (sx + this.width < 0 || sx > CANVAS_WIDTH || sy + this.height < 0 || sy > CANVAS_HEIGHT) return;

        if (this.type === "GOLD_ORE") {
            p.fill(255, 215, 0);
            p.rect(sx, sy, 12, 12);
            p.stroke(255);
            p.strokeWeight(1);
            p.noFill();
            p.rect(sx, sy, 12, 12);
            p.noStroke();
        } else if (this.type === "HEART") {
            p.fill(255, 50, 50);
            p.beginShape();
            p.vertex(sx + 8, sy + 14);
            p.bezierVertex(sx + 16, sy + 6, sx + 12, sy, sx + 8, sy + 4);
            p.bezierVertex(sx + 4, sy, sx, sy + 6, sx + 8, sy + 14);
            p.endShape();
        }
    }
}

function isTileSolid(type) {
    return type !== TILE.AIR;
}