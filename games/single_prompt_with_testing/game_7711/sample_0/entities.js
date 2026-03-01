/**
 * entities.js
 * Player and Enemy classes.
 */

import { CONFIG, gameState } from './globals.js';
import { HexMath, drawHealthBar } from './utils.js';
import { animationSystem } from './animations.js';
import { globalParticles } from './particles.js';

class Entity {
    constructor(q, r, type) {
        this.q = q;
        this.r = r;
        this.type = type; // 'PLAYER', 'ENEMY_MELEE', 'ENEMY_RANGED', 'ENEMY_BOMBER'
        
        const pos = HexMath.hexToPixel(q, r);
        this.pixelX = pos.x;
        this.pixelY = pos.y;
        
        this.hp = 1;
        this.maxHp = 1;
        this.isDead = false;
        
        // Link to grid
        if (gameState.grid) {
            const tile = gameState.grid.getTile(q, r);
            if (tile) tile.entity = this;
        }
    }

    moveTo(tile) {
        // Remove from old tile
        const oldTile = gameState.grid.getTile(this.q, this.r);
        if (oldTile) oldTile.entity = null;

        // Update coords
        this.q = tile.q;
        this.r = tile.r;
        
        // Link to new tile
        tile.entity = this;

        // Animate visual position
        animationSystem.addTween(this, 'pixelX', tile.pixelX, 10, 'easeOut');
        animationSystem.addTween(this, 'pixelY', tile.pixelY, 10, 'easeOut');
        
        // Footprint particles
        globalParticles.emit(tile.pixelX, tile.pixelY, 'dust', 3);
    }
    
    teleportTo(tile) {
        const oldTile = gameState.grid.getTile(this.q, this.r);
        if (oldTile) oldTile.entity = null;
        
        this.q = tile.q;
        this.r = tile.r;
        tile.entity = this;
        this.pixelX = tile.pixelX;
        this.pixelY = tile.pixelY;
        
        globalParticles.emit(tile.pixelX, tile.pixelY, 'magic', 10);
    }

    takeDamage(amount) {
        this.hp -= amount;
        
        // Shake animation
        const shakeAmt = 5;
        this.pixelX += (Math.random() - 0.5) * shakeAmt;
        this.pixelY += (Math.random() - 0.5) * shakeAmt;
        
        globalParticles.emit(this.pixelX, this.pixelY, 'blood', 8);

        if (this.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        const tile = gameState.grid.getTile(this.q, this.r);
        if (tile) tile.entity = null;
    }

    render(p) {
        // Base implementation
        p.push();
        p.translate(this.pixelX, this.pixelY);
        p.fill(255);
        p.circle(0, 0, 20);
        p.pop();
    }
}

export class Player extends Entity {
    constructor(q, r) {
        super(q, r, 'PLAYER');
        this.maxHp = CONFIG.PLAYER_MAX_HP;
        this.hp = CONFIG.PLAYER_START_HP;
        this.energy = 3; // For special moves
        this.jumpRange = 2;
    }

    render(p) {
        p.push();
        p.translate(this.pixelX, this.pixelY);
        
        // Glow
        p.noStroke();
        p.fill(0, 200, 255, 50 + Math.sin(p.frameCount * 0.1) * 20);
        p.circle(0, 0, 35);

        // Body
        p.fill(0, 200, 255);
        p.stroke(255);
        p.strokeWeight(2);
        
        // Draw Spartan Helmet shape roughly
        p.beginShape();
        p.vertex(0, -15);
        p.vertex(10, -5);
        p.vertex(10, 10);
        p.vertex(0, 15);
        p.vertex(-10, 10);
        p.vertex(-10, -5);
        p.endShape(p.CLOSE);
        
        // Plume
        p.stroke(255, 50, 50);
        p.line(0, -15, -15, -5);
        
        p.pop();
        
        drawHealthBar(p, this);
    }
}

export class Enemy extends Entity {
    constructor(q, r, type) {
        super(q, r, type);
        this.alerted = false;
        
        switch(type) {
            case 'ENEMY_MELEE':
                this.hp = 2;
                this.maxHp = 2;
                this.damage = 1;
                this.color = [255, 50, 50];
                break;
            case 'ENEMY_RANGED':
                this.hp = 1;
                this.maxHp = 1;
                this.damage = 1;
                this.range = 4;
                this.color = [150, 50, 255];
                break;
            case 'ENEMY_BOMBER':
                this.hp = 3;
                this.maxHp = 3;
                this.damage = 2;
                this.color = [255, 150, 0];
                break;
        }
    }

    render(p) {
        p.push();
        p.translate(this.pixelX, this.pixelY);
        
        p.fill(this.color);
        p.stroke(255);
        p.strokeWeight(1);
        
        if (this.type === 'ENEMY_MELEE') {
            p.rectMode(p.CENTER);
            p.rect(0, 0, 24, 24, 4);
            // Sword icon
            p.stroke(0);
            p.line(-8, 8, 8, -8);
        } else if (this.type === 'ENEMY_RANGED') {
            p.triangle(0, -15, 12, 10, -12, 10);
            // Bow icon
            p.noFill();
            p.stroke(0);
            p.arc(0, 5, 10, 10, Math.PI, 0);
        } else if (this.type === 'ENEMY_BOMBER') {
            p.circle(0, 0, 26);
            // Bomb fuse
            p.stroke(255);
            p.line(0, -13, 5, -20);
            p.noStroke();
            p.fill(255, 200, 0);
            p.circle(5, -20, 4);
        }
        
        p.pop();
        
        drawHealthBar(p, this);
    }
}