/**
 * Game Entities: Player, Enemies, Items, Tiles
 */

import { gameState, TILE_SIZE, COLORS } from './globals.js';
import { createParticleEffect } from './particles.js';

// Base Entity Class
export class Entity {
    constructor(gridX, gridY) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.pixelX = gridX * TILE_SIZE;
        this.pixelY = gridY * TILE_SIZE;
        this.targetPixelX = this.pixelX;
        this.targetPixelY = this.pixelY;
        this.isMoving = false;
        this.moveSpeed = 0.2; // Lerp speed
        this.scaleX = 1;
        this.scaleY = 1;
        this.type = "ENTITY";
    }

    updatePosition() {
        // Smooth movement interpolation
        this.pixelX = this.lerp(this.pixelX, this.targetPixelX, this.moveSpeed);
        this.pixelY = this.lerp(this.pixelY, this.targetPixelY, this.moveSpeed);
        
        // Bounce effect reset
        this.scaleX = this.lerp(this.scaleX, 1, 0.1);
        this.scaleY = this.lerp(this.scaleY, 1, 0.1);
    }
    
    lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }

    moveTo(gx, gy) {
        this.gridX = gx;
        this.gridY = gy;
        this.targetPixelX = gx * TILE_SIZE;
        this.targetPixelY = gy * TILE_SIZE;
        // Squash and stretch effect
        this.scaleX = 1.2;
        this.scaleY = 0.8;
    }
    
    bump(dirX, dirY) {
        // Visual bump without moving grid pos
        this.pixelX += dirX * 10;
        this.pixelY += dirY * 10;
        this.scaleX = 0.9;
        this.scaleY = 1.1;
    }

    render(p) {
        // Override in children
    }
}

// Tiles
export class Tile extends Entity {
    constructor(x, y, walkable) {
        super(x, y);
        this.walkable = walkable;
    }
}

export class Wall extends Tile {
    constructor(x, y) {
        super(x, y, false);
        this.type = "WALL";
    }
    
    render(p) {
        p.fill(COLORS.WALL);
        p.stroke(0);
        p.strokeWeight(1);
        p.rect(this.gridX * TILE_SIZE, this.gridY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        
        // Detail
        p.fill(COLORS.WALL[0] + 20, COLORS.WALL[1] + 20, COLORS.WALL[2] + 20);
        p.rect(this.gridX * TILE_SIZE + 5, this.gridY * TILE_SIZE + 5, TILE_SIZE - 10, TILE_SIZE - 10);
    }
}

export class Floor extends Tile {
    constructor(x, y) {
        super(x, y, true);
        this.type = "FLOOR";
        this.isChecker = (x + y) % 2 === 0;
    }
    
    render(p) {
        if (this.isChecker) {
            p.fill(COLORS.GRID_DARK);
        } else {
            p.fill(COLORS.GRID_LIGHT);
        }
        p.noStroke();
        p.rect(this.gridX * TILE_SIZE, this.gridY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
}

export class Exit extends Tile {
    constructor(x, y) {
        super(x, y, true);
        this.type = "EXIT";
    }
    
    render(p) {
        p.fill(COLORS.GRID_DARK);
        p.rect(this.gridX * TILE_SIZE, this.gridY * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        
        // Draw Stairs
        p.fill(COLORS.EXIT);
        for(let i=0; i<3; i++) {
            p.rect(
                this.gridX * TILE_SIZE + 10 + (i*5), 
                this.gridY * TILE_SIZE + 10 + (i*5), 
                20 - (i*5), 
                5
            );
        }
    }
}

// Characters
export class Player extends Entity {
    constructor(x, y) {
        super(x, y);
        this.type = "PLAYER";
        this.moveSpeed = 0.3;
    }

    render(p) {
        p.push();
        p.translate(this.pixelX + TILE_SIZE/2, this.pixelY + TILE_SIZE/2);
        p.scale(this.scaleX, this.scaleY);
        
        // Body
        p.fill(COLORS.PLAYER);
        p.rectMode(p.CENTER);
        p.rect(0, 0, 24, 24, 4);
        
        // Helmet/Visor
        p.fill(0);
        p.rect(0, -4, 18, 6);
        
        // Eyes (glow)
        p.fill(255);
        p.circle(-4, -4, 2);
        p.circle(4, -4, 2);
        
        p.pop();
    }
}

export class Enemy extends Entity {
    constructor(x, y, type) {
        super(x, y);
        this.enemyType = type; // SLIME, BAT, SKELETON
        this.health = 1;
        this.damage = 1;
        this.type = "ENEMY";
        this.stunned = false;
        
        if (type === 'SKELETON') this.health = 2;
        if (type === 'BAT') this.moveSpeed = 0.4;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        this.scaleX = 1.4;
        this.scaleY = 0.6;
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        createParticleEffect(this.pixelX + TILE_SIZE/2, this.pixelY + TILE_SIZE/2, COLORS.GOLD, 10);
        
        const idx = gameState.entities.indexOf(this);
        if (idx > -1) gameState.entities.splice(idx, 1);
        
        // Drop gold
        const gold = new Item(this.gridX, this.gridY, 'GOLD');
        gameState.entities.push(gold);
        
        gameState.score += 50 * gameState.multiplier;
    }
    
    render(p) {
        p.push();
        p.translate(this.pixelX + TILE_SIZE/2, this.pixelY + TILE_SIZE/2);
        p.scale(this.scaleX, this.scaleY);
        p.rectMode(p.CENTER);

        // Stun indicator
        if (this.stunned) {
            p.noFill();
            p.stroke(255, 255, 0);
            p.strokeWeight(2);
            p.circle(0, -15, 10);
            p.noStroke();
        }

        if (this.enemyType === 'SLIME') {
            p.fill(COLORS.ENEMY_SLIME);
            p.circle(0, 4, 24);
            p.fill(0);
            p.circle(-4, 0, 4);
            p.circle(4, 0, 4);
        } else if (this.enemyType === 'BAT') {
            p.fill(COLORS.ENEMY_BAT);
            p.triangle(0, 10, -12, -10, 12, -10);
            p.fill(255);
            p.circle(-4, -4, 4);
            p.circle(4, -4, 4);
        } else if (this.enemyType === 'SKELETON') {
            p.fill(COLORS.ENEMY_SKELETON);
            p.rect(0, 0, 20, 26, 2);
            p.fill(0);
            p.circle(-5, -5, 6);
            p.circle(5, -5, 6);
            p.rect(0, 8, 10, 4); // Mouth
        }
        
        p.pop();
    }
}

export class Item extends Entity {
    constructor(x, y, itemType) {
        super(x, y);
        this.itemType = itemType; // GOLD, POTION
        this.type = "ITEM";
        this.bobOffset = 0;
    }
    
    render(p) {
        this.bobOffset = p.sin(p.frameCount * 0.1) * 3;
        
        p.push();
        p.translate(this.pixelX + TILE_SIZE/2, this.pixelY + TILE_SIZE/2 + this.bobOffset);
        p.rectMode(p.CENTER);
        
        if (this.itemType === 'GOLD') {
            p.fill(COLORS.GOLD);
            p.circle(0, 0, 14);
            p.fill(255, 255, 0);
            p.circle(0, 0, 8);
        } else if (this.itemType === 'POTION') {
            p.fill(COLORS.POTION);
            p.beginShape();
            p.vertex(-6, 8);
            p.vertex(6, 8);
            p.vertex(4, -4);
            p.vertex(-4, -4);
            p.endShape(p.CLOSE);
            p.rect(0, -6, 4, 4);
        }
        
        p.pop();
    }
}