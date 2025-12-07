/**
 * entities.js
 * Defines the Player, Enemy, Collectible, and other interactive objects.
 */

import { gameState, TILE_SIZE, COLORS, ANIMATION_SPEED_NORMAL, ANIMATION_SPEED_SPRINT, KEYS, CANVAS_HEIGHT } from './globals.js';
import { isSolid, isPit, getHazardAt, getCollectibleAt, gridToScreen, lerp } from './physics.js';
import { createExplosion, createJumpDust } from './particles.js';
import { isSprinting } from './input.js';

/**
 * Base Entity Class
 */
export class Entity {
    constructor(gridX, gridY) {
        this.gridX = gridX;
        this.gridY = gridY;
        
        // Visual position (pixels)
        const pos = gridToScreen(gridX, gridY);
        this.visualX = pos.x;
        this.visualY = pos.y;
        
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        
        this.markedForDeletion = false;
        this.type = 'ENTITY';
        this.isHazard = false;
    }

    update(p) {
        // Base update logic
    }

    render(p) {
        // Base render logic
    }
}

/**
 * Player Class
 * Handles movement state machine, interactions, and rendering of the knight.
 */
export class Player extends Entity {
    constructor(gridX, gridY) {
        super(gridX, gridY);
        this.type = 'PLAYER';
        
        // Movement State
        this.targetGridX = gridX;
        this.targetGridY = gridY;
        this.isMoving = false;
        this.moveProgress = 0;
        this.facing = 1; // 1 = Right, -1 = Left
        
        // Gameplay State
        this.health = 3;
        this.isDead = false;
        this.hasShield = false;
        
        // Animation
        this.bobOffset = 0;
        
        gameState.player = this;
    }

    update(p) {
        if (this.isDead) return;

        // 1. Handle Input (if not moving)
        if (!this.isMoving) {
            this.processInput(p);
        }

        // 2. Handle Movement Interpolation
        if (this.isMoving) {
            const speed = isSprinting(p) ? ANIMATION_SPEED_SPRINT : ANIMATION_SPEED_NORMAL;
            this.moveProgress += speed;
            
            if (this.moveProgress >= 1) {
                // Movement Complete
                this.gridX = this.targetGridX;
                this.gridY = this.targetGridY;
                this.isMoving = false;
                this.moveProgress = 0;
                
                // Snap visual
                const snap = gridToScreen(this.gridX, this.gridY);
                this.visualX = snap.x;
                this.visualY = snap.y;
                
                this.onMoveEnd(p);
            } else {
                // Interpolate
                const start = gridToScreen(this.gridX, this.gridY);
                const end = gridToScreen(this.targetGridX, this.targetGridY);
                
                // Add a little hop arc (parabola)
                const jumpHeight = -15 * Math.sin(this.moveProgress * Math.PI);
                
                this.visualX = lerp(start.x, end.x, this.moveProgress);
                this.visualY = lerp(start.y, end.y, this.moveProgress) + jumpHeight;
            }
        } else {
            // Idle bobbing
            this.bobOffset = Math.sin(p.frameCount * 0.1) * 2;
        }

        // 3. Check Interactions (Traps, Pickups) - Even while moving (mid-air) we might hit something? 
        // Usually in grid games, checks happen on land.
    }

    processInput(p) {
        if (gameState.inputQueue.length === 0) return;

        const cmd = gameState.inputQueue.shift();
        const key = cmd.key;

        let dx = 0;
        let dy = 0;

        if (key === KEYS.RIGHT) { dx = 1; this.facing = 1; }
        else if (key === KEYS.LEFT) { dx = -1; this.facing = -1; }
        else if (key === KEYS.UP) dy = -1;
        else if (key === KEYS.DOWN) dy = 1;
        else if (key === KEYS.SPACE) {
            // Wait / Hold position
            return;
        }

        // Validate Move
        const nextX = this.gridX + dx;
        const nextY = this.gridY + dy;

        // Check Wall Collision
        if (isSolid(nextX, nextY)) {
            // Bump effect (wobble)
            // TODO: Add visual bump
            return; 
        }

        // Start Move
        this.targetGridX = nextX;
        this.targetGridY = nextY;
        this.isMoving = true;
        this.moveProgress = 0;
        
        // Spawn particles
        createJumpDust(this.visualX + TILE_SIZE/2, this.visualY + TILE_SIZE);
    }

    onMoveEnd(p) {
        // Landed on a tile.
        
        // 1. Check Pits
        if (isPit(this.gridX, this.gridY)) {
            this.die(p, "Fell into the abyss");
            return;
        }

        // 2. Check Collectibles
        const collectible = getCollectibleAt(this.gridX, this.gridY);
        if (collectible) {
            collectible.collect(p);
        }

        // 3. Check Hazards (Static Spikes)
        const hazard = getHazardAt(this.gridX, this.gridY);
        if (hazard) {
            hazard.onStep(this, p);
        }

        // 4. Update Game Log
        p.logs.player_info.push({
            grid_x: this.gridX,
            grid_y: this.gridY,
            score: gameState.score,
            framecount: p.frameCount
        });
    }
    
    die(p, reason) {
        if (this.isDead) return;
        this.isDead = true;
        gameState.gamePhase = "GAME_OVER_LOSE";
        console.log(`Player Died: ${reason}`);
        
        createExplosion(this.visualX + TILE_SIZE/2, this.visualY + TILE_SIZE/2, COLORS.PLAYER);
    }
    
    useItem() {
        if (this.hasShield) {
            // Shield effect
            console.log("Shield Activated!");
            this.hasShield = false;
        }
    }

    render(p) {
        if (this.isDead) return;

        p.push();
        p.translate(this.visualX + TILE_SIZE/2, this.visualY + TILE_SIZE/2 + (this.isMoving ? 0 : this.bobOffset));
        
        // Shadow
        p.noStroke();
        p.fill(0, 0, 0, 100);
        p.ellipse(0, TILE_SIZE/2 - 2, 20, 10);
        
        // Body
        p.fill(COLORS.PLAYER);
        p.rectMode(p.CENTER);
        p.rect(0, 0, 24, 24, 4);
        
        // Helmet Details
        p.fill(COLORS.PLAYER_SHADOW);
        p.rect(0, -2, 16, 6); // Visor
        
        // Eyes (if looking certain way)
        p.fill(255);
        if (this.facing === 1) {
            p.rect(2, -2, 4, 2);
            p.rect(6, -2, 4, 2);
        } else {
            p.rect(-2, -2, 4, 2);
            p.rect(-6, -2, 4, 2);
        }
        
        p.pop();
    }
}

/**
 * Coin Collectible
 */
export class Coin extends Entity {
    constructor(gridX, gridY) {
        super(gridX, gridY);
        this.type = 'COLLECTIBLE';
        this.rotation = 0;
    }
    
    update(p) {
        this.rotation += 0.05;
    }
    
    collect(p) {
        this.markedForDeletion = true;
        gameState.score += 10;
        createExplosion(this.visualX + TILE_SIZE/2, this.visualY + TILE_SIZE/2, COLORS.COIN, 5);
    }
    
    render(p) {
        const cx = this.visualX + TILE_SIZE/2;
        const cy = this.visualY + TILE_SIZE/2;
        
        p.push();
        p.translate(cx, cy);
        p.rotate(this.rotation);
        p.fill(COLORS.COIN);
        p.noStroke();
        p.rectMode(p.CENTER);
        p.rect(0, 0, 14, 14);
        p.pop();
    }
}

/**
 * Basic Wall Tile Object (Not an Entity, but a structural object)
 */
export class TileObject {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // WALL, FLOOR
    }
}

/**
 * Enemy: Slime
 * Moves back and forth or sits still.
 */
export class Slime extends Entity {
    constructor(gridX, gridY, pattern = 'VERTICAL') {
        super(gridX, gridY);
        this.type = 'ENEMY';
        this.isHazard = true;
        this.pattern = pattern;
        this.moveTimer = 0;
        this.moveInterval = 60; // Move every 60 frames
        this.dir = 1;
    }
    
    update(p) {
        this.moveTimer++;
        if (this.moveTimer >= this.moveInterval) {
            this.moveTimer = 0;
            this.move();
        }
        
        // Smooth visual slide
        const targetPos = gridToScreen(this.gridX, this.gridY);
        this.visualX = lerp(this.visualX, targetPos.x, 0.2);
        this.visualY = lerp(this.visualY, targetPos.y, 0.2);
        
        // Check collision with player
        if (gameState.player && !gameState.player.isDead) {
            if (checkAABB(this, gameState.player)) { // Simple box check for contact
                // Or check grid coords
                if (Math.round(this.gridX) === gameState.player.gridX && 
                    Math.round(this.gridY) === gameState.player.gridY) {
                    gameState.player.die(p, "Slime engulfed you");
                }
            }
        }
    }
    
    move() {
        let dx = 0, dy = 0;
        if (this.pattern === 'HORIZONTAL') dx = this.dir;
        else dy = this.dir;
        
        if (isSolid(this.gridX + dx, this.gridY + dy) || isPit(this.gridX + dx, this.gridY + dy)) {
            this.dir *= -1; // Reverse
        } else {
            this.gridX += dx;
            this.gridY += dy;
        }
    }
    
    onStep(player, p) {
        player.die(p, "Stepped on a Slime");
    }
    
    render(p) {
        const cx = this.visualX + TILE_SIZE/2;
        const cy = this.visualY + TILE_SIZE/2;
        
        p.fill(COLORS.SLIME);
        p.noStroke();
        // Pulsating effect
        const s = 20 + Math.sin(p.frameCount * 0.2) * 2;
        p.circle(cx, cy + 5, s);
        
        p.fill(0);
        p.circle(cx - 4, cy, 3);
        p.circle(cx + 4, cy, 3);
    }
}