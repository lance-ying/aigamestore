/**
 * entities.js
 * Contains classes for Player, Enemies, Traps, and Collectibles.
 */

import { gameState, TILE_SIZE, COLORS, DOOM_WALL_ACCELERATION } from './globals.js';
import { isWalkable, gridToWorld, worldToGrid, lerp, checkCircleCircle, checkRectCircle } from './physics.js';
import { createExplosion } from './particles.js';

// Base Entity Class
class Entity {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.dead = false;
        this.zOrder = 0;
    }

    update() {}
    render(p) {}
}

// ------------------------------------------------------------------
// Player Class
// ------------------------------------------------------------------
export class Player extends Entity {
    constructor(startCol, startRow) {
        const pos = gridToWorld(startCol, startRow);
        super(pos.x + TILE_SIZE/2, pos.y + TILE_SIZE/2);
        
        this.col = startCol;
        this.row = startRow;
        
        // Movement Animation State
        this.targetX = this.x;
        this.targetY = this.y;
        this.isMoving = false;
        this.moveProgress = 0; // 0 to 1
        this.moveSpeed = 0.15; // Animation speed
        this.facing = 1; // 1 Right, -1 Left
        
        this.radius = 12; // Hitbox radius
        this.zOrder = 100;
        
        this.bobOffset = 0;
    }

    update(p) {
        // Animation Logic
        if (this.isMoving) {
            this.moveProgress += 1.0 / (60 * this.moveSpeed); // 60 FPS * speed seconds
            
            if (this.moveProgress >= 1) {
                // Movement Complete
                this.x = this.targetX;
                this.y = this.targetY;
                this.isMoving = false;
                this.moveProgress = 0;
                
                // Trigger arrival events
                this.onTileArrival();
                
                // Process next input immediately if queued
                this.processInputQueue();
            } else {
                // Interpolate
                const startPos = gridToWorld(this.col, this.row);
                // Adjust for center
                const sx = startPos.x + TILE_SIZE/2;
                const sy = startPos.y + TILE_SIZE/2;
                
                // We need to know where we were coming FROM to interpolate correctly
                // Actually, this.x/y should track visual position.
                // Let's store prevCol/prevRow for cleaner interpolation? 
                // Alternatively, just lerp from current visual x/y to target, but that's asymptotic.
                // Linear:
                // We need prevX/Y stored at start of move.
                this.x = lerp(this.moveStartX, this.targetX, this.moveProgress);
                this.y = lerp(this.moveStartY, this.targetY, this.moveProgress);
                
                // Visual bob
                this.bobOffset = Math.sin(this.moveProgress * Math.PI) * 5;
            }
        } else {
            this.bobOffset = 0;
            this.processInputQueue();
        }
        
        // Interaction with collectibles
        this.checkCollisions();
        
        // Check Doom Wall
        if (this.x - this.radius < gameState.doomWallX + 50) { // +50 roughly visually matches wall edge
            this.die("CRUSHED");
        }
    }
    
    processInputQueue() {
        if (gameState.inputQueue.length > 0 && !this.isMoving) {
            const action = gameState.inputQueue.shift();
            this.move(action.dx, action.dy);
        }
    }

    move(dx, dy) {
        // 0,0 means wait
        if (dx === 0 && dy === 0) {
            // Just wait a turn
            // We can add a small "wait" animation or delay if we want turn-based timing
            // For real-time feel, maybe just do nothing, but enemies move?
            // "Redungeon" is quasi-turn-based. Enemies move when you move usually.
            // Let's make enemies move independently (real-time hybrid) but player is locked to grid speed.
            return; 
        }

        const nextCol = this.col + dx;
        const nextRow = this.row + dy;

        if (isWalkable(nextCol, nextRow)) {
            // Initiate Move
            this.isMoving = true;
            this.moveProgress = 0;
            
            // Store start pos for interpolation
            this.moveStartX = this.x;
            this.moveStartY = this.y;
            
            // Update logical grid position immediately (to prevent double occupancy if multiplayer, or for logic lookahead)
            // But visuals lag behind.
            this.col = nextCol;
            this.row = nextRow;
            
            const targetPos = gridToWorld(nextCol, nextRow);
            this.targetX = targetPos.x + TILE_SIZE/2;
            this.targetY = targetPos.y + TILE_SIZE/2;
            
            if (dx !== 0) this.facing = Math.sign(dx);
            
            // Create dust particles
            createExplosion(this.moveStartX, this.moveStartY + 15, 3, 'DUST');
            
            // Score tracking
            if (this.col > gameState.distanceTraveled) {
                gameState.distanceTraveled = this.col;
                gameState.score += 1;
            }
        } else {
            // Hit wall effect (screenshake or sound visual)
            // Maybe slight nudge animation
        }
    }
    
    onTileArrival() {
        // Check for static hazards on the new tile (like Spikes that might activate)
    }
    
    checkCollisions() {
        // Collectibles
        for (let i = gameState.entities.length - 1; i >= 0; i--) {
            const ent = gameState.entities[i];
            if (ent instanceof Collectible && !ent.collected) {
                if (checkCircleCircle(this, ent)) {
                    ent.collect();
                }
            }
        }
    }

    takeDamage(source) {
        if (!this.dead) {
            this.die(source);
        }
    }
    
    die(cause) {
        this.dead = true;
        createExplosion(this.x, this.y, 20, 'BLOOD');
        gameState.gamePhase = "GAME_OVER_LOSE";
        console.log(`Player died due to: ${cause}`);
    }

    render(p) {
        if (this.dead) return;

        p.push();
        p.translate(this.x, this.y - this.bobOffset);
        
        // Shadow
        p.fill(0, 0, 0, 100);
        p.ellipse(0, 15 + this.bobOffset, 20, 10);
        
        // Body
        p.fill(COLORS.PLAYER);
        p.stroke(COLORS.PLAYER_OUTLINE);
        p.strokeWeight(2);
        p.rectMode(p.CENTER);
        
        // Simple Knight Shape
        p.rect(0, 0, 20, 24, 4);
        
        // Helmet Details
        p.noStroke();
        p.fill(200);
        p.rect(0, -5, 16, 10, 2); // Visor area
        p.fill(0);
        p.rect(0, -5, 12, 4); // Eye slit
        
        // Plume/Feather
        p.fill(255, 50, 50);
        p.triangle(-2, -15, 2, -15, -6 * this.facing, -25);
        
        p.pop();
    }
}

// ------------------------------------------------------------------
// Enemies
// ------------------------------------------------------------------
export class Slime extends Entity {
    constructor(col, row, type = 'HORIZONTAL') {
        const pos = gridToWorld(col, row);
        super(pos.x + TILE_SIZE/2, pos.y + TILE_SIZE/2);
        this.col = col;
        this.row = row;
        this.radius = 12;
        this.zOrder = 50;
        this.moveType = type; // HORIZONTAL or VERTICAL
        this.direction = 1;
        this.moveTimer = 0;
        this.moveInterval = 60; // Frames between moves
    }
    
    update(p) {
        this.moveTimer++;
        if (this.moveTimer >= this.moveInterval) {
            this.moveTimer = 0;
            this.tryMove();
        }
        
        // Check Player Collision
        if (gameState.player && !gameState.player.dead) {
            if (checkCircleCircle(this, gameState.player)) {
                gameState.player.takeDamage("SLIME");
            }
        }
    }
    
    tryMove() {
        let dx = 0, dy = 0;
        if (this.moveType === 'HORIZONTAL') dx = this.direction;
        else dy = this.direction;
        
        const nextCol = this.col + dx;
        const nextRow = this.row + dy;
        
        if (isWalkable(nextCol, nextRow)) {
            this.col = nextCol;
            this.row = nextRow;
            const pos = gridToWorld(this.col, this.row);
            this.x = pos.x + TILE_SIZE/2;
            this.y = pos.y + TILE_SIZE/2;
        } else {
            // Turn around
            this.direction *= -1;
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        // Squish effect based on timer
        const squish = Math.abs(Math.sin(this.moveTimer * 0.1)) * 4;
        
        p.fill(COLORS.SLIME);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(0, 5 - squish/2, 24 + squish, 20 - squish, 5, 5, 2, 2);
        
        // Eyes
        p.fill(255);
        p.circle(-6, 2, 6);
        p.circle(6, 2, 6);
        p.fill(0);
        p.circle(-6, 2, 2);
        p.circle(6, 2, 2);
        
        p.pop();
    }
}

// ------------------------------------------------------------------
// Traps
// ------------------------------------------------------------------
export class SpikeTrap extends Entity {
    constructor(col, row, offset = 0) {
        const pos = gridToWorld(col, row);
        super(pos.x + TILE_SIZE/2, pos.y + TILE_SIZE/2);
        this.state = "SAFE"; // SAFE, WARNING, ACTIVE
        this.timer = offset;
        this.cycleLength = 180; // 3 seconds total cycle
        this.zOrder = 10;
        this.hitbox = { x: pos.x + 5, y: pos.y + 5, width: 30, height: 30 };
    }
    
    update(p) {
        this.timer = (this.timer + 1) % this.cycleLength;
        
        if (this.timer < 60) {
            this.state = "SAFE";
        } else if (this.timer < 100) {
            this.state = "WARNING";
        } else {
            this.state = "ACTIVE";
        }
        
        if (this.state === "ACTIVE" && gameState.player && !gameState.player.dead) {
            // Player is circle, spike is rect area
            if (checkRectCircle(this.hitbox, gameState.player)) {
                gameState.player.takeDamage("SPIKES");
            }
        }
    }
    
    render(p) {
        p.push();
        p.translate(this.x, this.y);
        
        if (this.state === "SAFE") {
            p.fill(50);
            p.noStroke();
            p.circle(0, 0, 5); // Small holes
            p.circle(-10, -10, 3);
            p.circle(10, 10, 3);
            p.circle(-10, 10, 3);
            p.circle(10, -10, 3);
        } else if (this.state === "WARNING") {
            p.fill(150, 50, 50); // Red glow
            p.rectMode(p.CENTER);
            p.rect(0, 0, 30, 30);
        } else {
            // Spikes out
            p.fill(200);
            p.stroke(100);
            p.strokeWeight(1);
            // Draw spikes
            p.beginShape();
            p.vertex(-15, 15);
            p.vertex(-10, -10);
            p.vertex(-5, 15);
            p.vertex(0, -15);
            p.vertex(5, 15);
            p.vertex(10, -10);
            p.vertex(15, 15);
            p.endShape(p.CLOSE);
        }
        
        p.pop();
    }
}

// ------------------------------------------------------------------
// Collectibles
// ------------------------------------------------------------------
export class Collectible extends Entity {
    constructor(col, row) {
        const pos = gridToWorld(col, row);
        super(pos.x + TILE_SIZE/2, pos.y + TILE_SIZE/2);
        this.radius = 8;
        this.collected = false;
        this.zOrder = 20;
        this.bobAngle = Math.random() * Math.PI * 2;
    }
    
    collect() {
        if (this.collected) return;
        this.collected = true;
        gameState.coinsCollected++;
        gameState.score += 10;
        createExplosion(this.x, this.y, 5, 'COIN_SPARKLE');
        
        // Remove self next frame
        // We do this by filtering entities in main loop or marking dead
        this.dead = true; 
    }
    
    update(p) {
        this.bobAngle += 0.1;
    }
    
    render(p) {
        if (this.collected) return;
        
        p.push();
        p.translate(this.x, this.y + Math.sin(this.bobAngle) * 3);
        
        p.fill(COLORS.COIN);
        p.stroke(255, 255, 100);
        p.strokeWeight(2);
        p.circle(0, 0, this.radius * 2);
        
        p.fill(255, 255, 200);
        p.noStroke();
        p.circle(-3, -3, 4); // Shine
        
        p.pop();
    }
}