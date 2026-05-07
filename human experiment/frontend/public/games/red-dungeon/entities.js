import { TILE_SIZE, gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { getGridKey, worldToGrid, gridToWorld, lerp, easeOutCubic } from './utils.js';
import { createParticleExplosion, createCoinSparkle } from './particles.js';

export class Entity {
    constructor(gx, gy) {
        this.gx = gx; // Grid X
        this.gy = gy; // Grid Y
        const pos = gridToWorld(gx, gy);
        this.x = pos.x;
        this.y = pos.y;
        this.dead = false;
    }

    update(p) {}
    render(p) {}
}

export class Player extends Entity {
    constructor(gx, gy) {
        super(gx, gy);
        this.moveState = "IDLE"; // IDLE, MOVING
        this.moveProgress = 0;
        this.startX = this.x;
        this.startY = this.y;
        this.targetX = this.x;
        this.targetY = this.y;
        this.targetGx = gx;
        this.targetGy = gy;
        this.moveSpeed = 0.15; // 15% per frame
        
        // Visuals
        this.facing = 1; // 1 Right, -1 Left
        this.bobOffset = 0;
    }

    update(p) {
        // Handle Movement State
        if (this.moveState === "MOVING") {
            this.moveProgress += this.moveSpeed;
            
            // Check for instant hole death during movement
            if (this.moveProgress > 0.3 && !this.dead) {
                const key = getGridKey(this.targetGx, this.targetGy);
                const tile = gameState.grid.get(key);
                if (tile && tile.type === 'hole') {
                    this.die(p, "Fell into a hole!");
                }
            }

            if (this.moveProgress >= 1) {
                this.moveProgress = 1;
                this.x = this.targetX;
                this.y = this.targetY;
                
                // Action complete
                this.moveState = "IDLE";
                
                // Check what we landed on (Collision with static traps like holes)
                this.checkLand(p);
            } else {
                // Interpolate
                const t = easeOutCubic(this.moveProgress);
                this.x = lerp(this.startX, this.targetX, t);
                this.y = lerp(this.startY, this.targetY, t);
            }
        } 
        
        // Process Input Queue if Idle
        if (this.moveState === "IDLE") {
            // Snap to grid exact
            const gridPos = worldToGrid(this.x, this.y);
            this.gx = gridPos.gx;
            this.gy = gridPos.gy;
            this.x = this.gx * TILE_SIZE;
            this.y = this.gy * TILE_SIZE;

            if (gameState.inputQueue.length > 0) {
                const action = gameState.inputQueue.shift();
                this.tryMove(action.dx, action.dy);
            }
        }
        
        // Check dynamic collisions (Enemies, Projectiles)
        this.checkDynamicCollisions(p);

        // Update visual bob
        this.bobOffset = Math.sin(p.frameCount * 0.2) * 2;
        
        // Check Doom Wall
        if (this.y + TILE_SIZE > gameState.doomY) {
            this.die(p, "Consumed by the Doom Wall!");
        }
        
        // Update Distance and Score
        const currentDist = gameState.initialPlayerGy - this.gy;
        if (currentDist > gameState.maxDist) {
            gameState.maxDist = currentDist;
        }
        // Score = 10 pts per tile + 50 pts per coin
        gameState.score = (gameState.maxDist * 10) + (gameState.coins * 50);
    }

    tryMove(dx, dy) {
        const targetGx = this.gx + dx;
        const targetGy = this.gy + dy;
        const key = getGridKey(targetGx, targetGy);
        const tile = gameState.grid.get(key);

        // Wall Collision
        if (!tile || tile.type === 'wall') {
            // Blocked animation?
            return;
        }
        
        // Initiate Move
        this.moveState = "MOVING";
        this.moveProgress = 0;
        this.startX = this.x;
        this.startY = this.y;
        
        this.targetGx = targetGx;
        this.targetGy = targetGy;
        
        const targetPos = gridToWorld(targetGx, targetGy);
        this.targetX = targetPos.x;
        this.targetY = targetPos.y;
        
        // Update facing
        if (dx !== 0) this.facing = dx;
        
        // Wait action is just a move with 0 distance, which is valid to pass time
    }

    checkLand(p) {
        // We use target coordinates here because gx/gy might not be updated until next frame IDLE state
        // However, this logic is called when moveProgress >= 1, so we are logically at target.
        const key = getGridKey(this.targetGx, this.targetGy);
        const tile = gameState.grid.get(key);
        
        if (tile && tile.type === 'hole') {
            this.die(p, "Fell into a hole!");
        }
    }
    
    checkDynamicCollisions(p) {
        // Player hitbox (slightly smaller than tile)
        const hitbox = {
            x: this.x + 10,
            y: this.y + 10,
            w: 20,
            h: 20
        };

        for (let e of gameState.entities) {
            if (e === this) continue;
            
            // Collectible
            if (e instanceof Coin && !e.collected) {
                const coinBox = { x: e.x + 10, y: e.y + 10, w: 20, h: 20 };
                if (checkRectCollision(hitbox, coinBox)) {
                    e.collect(p);
                }
            }
            
            // Enemies / Traps
            if (e.isDangerous && e.isActive()) {
                const enemyBox = e.getHitbox();
                if (checkRectCollision(hitbox, enemyBox)) {
                    this.die(p, "Hit a trap!");
                }
            }
        }
    }
    
    die(p, reason) {
        if (this.dead) return;
        this.dead = true;
        gameState.gamePhase = "GAME_OVER_LOSE";
        p.logs.player_info.push({
            event: "DEATH",
            reason: reason,
            score: gameState.score,
            framecount: p.frameCount
        });
        createParticleExplosion(p, this.x + TILE_SIZE/2, this.y + TILE_SIZE/2, [200, 200, 200]);
    }

    render(p) {
        p.push();
        p.translate(this.x + TILE_SIZE/2, this.y + TILE_SIZE/2 + this.bobOffset);
        
        // Shadow
        p.fill(0, 100);
        p.noStroke();
        p.ellipse(0, 15, 20, 10);
        
        // Body
        p.scale(this.facing, 1);
        p.fill(200); // Silver armor
        p.stroke(50);
        p.strokeWeight(2);
        p.rect(-10, -15, 20, 25, 3);
        
        // Helmet
        p.fill(220);
        p.rect(-10, -22, 20, 15, 4);
        
        // Visor
        p.fill(0); // Dark visor
        p.rect(-5, -18, 14, 6);
        
        // Plume
        p.fill(255, 50, 50);
        p.noStroke();
        p.triangle(-2, -22, -8, -30, 4, -22);
        
        p.pop();
    }
}

// Check intersection helper
function checkRectCollision(r1, r2) {
    return (r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y);
}

export class Coin extends Entity {
    constructor(gx, gy) {
        super(gx, gy);
        this.collected = false;
        this.rot = 0;
    }
    
    update(p) {
        this.rot += 0.05;
    }
    
    collect(p) {
        if (this.collected) return;
        this.collected = true;
        gameState.coins += 1;
        // Score updated in Player loop based on coin count
        createCoinSparkle(p, this.x + TILE_SIZE/2, this.y + TILE_SIZE/2);
    }
    
    render(p) {
        if (this.collected) return;
        p.push();
        p.translate(this.x + TILE_SIZE/2, this.y + TILE_SIZE/2);
        p.rotate(Math.sin(p.frameCount * 0.05) * 0.2);
        p.fill(255, 215, 0);
        p.stroke(184, 134, 11);
        p.strokeWeight(2);
        p.circle(0, 0, 12);
        p.fill(255, 255, 200);
        p.noStroke();
        p.circle(-3, -3, 3);
        p.pop();
    }
}

export class SpikeTrap extends Entity {
    constructor(gx, gy, offset = 0) {
        super(gx, gy);
        this.isDangerous = true;
        this.offset = offset; // Phase offset
        this.state = 0; // 0: Hidden, 1: Warning, 2: Spiked, 3: Retracting
        this.timer = 0;
        this.cycleLength = 180; // frames
    }
    
    update(p) {
        const t = (p.frameCount + this.offset) % this.cycleLength;
        
        if (t < 60) this.state = 0; // Safe
        else if (t < 90) this.state = 1; // Warning (Rumble)
        else if (t < 150) this.state = 2; // ACTIVE SPIKES
        else this.state = 3; // Retracting
    }
    
    isActive() {
        return this.state === 2;
    }
    
    getHitbox() {
        return { x: this.x + 5, y: this.y + 5, w: 30, h: 30 };
    }
    
    render(p) {
        p.push();
        p.translate(this.x + TILE_SIZE/2, this.y + TILE_SIZE/2);
        
        if (this.state === 0) {
            // Nothing, just holes in floor
            p.fill(30);
            p.circle(-10, -10, 4);
            p.circle(10, 10, 4);
            p.circle(10, -10, 4);
            p.circle(-10, 10, 4);
        } else if (this.state === 1) {
            // Warning
            p.fill(100, 50, 50);
            p.circle(0, 0, 10);
        } else if (this.state === 2) {
            // Spikes UP
            p.fill(200);
            p.stroke(100);
            // Draw 4 spikes
            [-10, 10].forEach(lx => {
                [-10, 10].forEach(ly => {
                    p.beginShape();
                    p.vertex(lx - 5, ly + 5);
                    p.vertex(lx, ly - 15);
                    p.vertex(lx + 5, ly + 5);
                    p.endShape(p.CLOSE);
                });
            });
        } else {
            // Retracting
            p.fill(150);
             p.circle(0, 0, 5);
        }
        
        p.pop();
    }
}

export class Slime extends Entity {
    constructor(gx, gy, range, axis) { // axis: 'x' or 'y'
        super(gx, gy);
        this.isDangerous = true;
        this.range = range;
        this.axis = axis;
        this.originGx = gx;
        this.originGy = gy;
        this.dir = 1;
        this.moveSpeed = 0.05; // Slower than player
        this.lerpVal = 0;
    }
    
    update(p) {
        this.lerpVal += this.moveSpeed * this.dir;
        
        if (Math.abs(this.lerpVal) >= this.range) {
            this.dir *= -1;
        }
        
        if (this.axis === 'x') {
            this.x = (this.originGx + this.lerpVal) * TILE_SIZE;
            this.y = this.originGy * TILE_SIZE;
        } else {
            this.x = this.originGx * TILE_SIZE;
            this.y = (this.originGy + this.lerpVal) * TILE_SIZE;
        }
    }
    
    isActive() { return true; }
    
    getHitbox() {
        return { x: this.x + 8, y: this.y + 12, w: 24, h: 20 };
    }
    
    render(p) {
        p.push();
        p.translate(this.x + TILE_SIZE/2, this.y + TILE_SIZE/2);
        
        // Slime body
        p.fill(50, 200, 50, 200);
        p.stroke(30, 150, 30);
        
        // Wobble
        const h = 20 + Math.sin(p.frameCount * 0.1) * 2;
        const w = 24 - Math.sin(p.frameCount * 0.1) * 2;
        
        p.beginShape();
        p.vertex(-w/2, h/2); // Bottom left
        p.bezierVertex(-w/2, -h/2, w/2, -h/2, w/2, h/2); // Curve top
        p.vertex(-w/2, h/2); // Close
        p.endShape();
        
        // Eyes
        p.fill(255);
        p.noStroke();
        p.circle(-5, -5, 6);
        p.circle(5, -5, 6);
        p.fill(0);
        p.circle(-5, -5, 2);
        p.circle(5, -5, 2);
        
        p.pop();
    }
}