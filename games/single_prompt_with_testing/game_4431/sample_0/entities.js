/**
 * entities.js
 * Defines classes for Grid Tiles, Buildings, and Units (Mechs/Vek).
 */

import { TILE_SIZE, gameState } from './globals.js';
import { gridToPixel, lerp } from './utils.js';

// Base Entity Class
export class Entity {
    constructor(gridX, gridY) {
        this.gridX = gridX;
        this.gridY = gridY;
        // Visual position for smooth interpolation
        const pixelPos = gridToPixel(gridX, gridY);
        this.pixelX = pixelPos.x;
        this.pixelY = pixelPos.y;
        this.isDead = false;
        this.maxHp = 1;
        this.hp = 1;
    }

    updatePixelPosition(speed = 0.2) {
        const target = gridToPixel(this.gridX, this.gridY);
        this.pixelX = lerp(this.pixelX, target.x, speed);
        this.pixelY = lerp(this.pixelY, target.y, speed);
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }

    die() {
        this.isDead = true;
    }
}

// Building Class
export class Building extends Entity {
    constructor(gridX, gridY) {
        super(gridX, gridY);
        this.isPowered = true;
    }

    takeDamage(amount) {
        if (!this.isPowered) return;
        this.isPowered = false;
        gameState.gridPower -= 1;
        // Visual effect is handled by game logic
    }

    render(p) {
        const x = this.pixelX;
        const y = this.pixelY;
        const size = TILE_SIZE * 0.8;

        p.push();
        p.translate(x, y);
        
        // Base
        p.fill(this.isPowered ? 100 : 50);
        p.stroke(0);
        p.rectMode(p.CENTER);
        p.rect(0, 0, size, size, 4);

        // Windows
        p.fill(this.isPowered ? p.color(255, 255, 0) : p.color(50, 50, 50));
        p.noStroke();
        const winSize = size / 4;
        p.rect(-winSize, -winSize, winSize, winSize);
        p.rect(winSize, -winSize, winSize, winSize);
        p.rect(-winSize, winSize, winSize, winSize);
        p.rect(winSize, winSize, winSize, winSize);

        p.pop();
    }
}

// Mountain Class (Obstacle)
export class Mountain extends Entity {
    constructor(gridX, gridY) {
        super(gridX, gridY);
        this.hp = 2; // Mountains can be destroyed
    }

    render(p) {
        const x = this.pixelX;
        const y = this.pixelY;
        const size = TILE_SIZE * 0.8;

        p.push();
        p.translate(x, y);
        p.fill(100, 80, 60); // Brownish
        p.stroke(50, 40, 30);
        p.strokeWeight(2);
        
        // Draw mountain shape
        p.beginShape();
        p.vertex(-size/2, size/2);
        p.vertex(-size/4, -size/4);
        p.vertex(0, -size/2);
        p.vertex(size/4, -size/4);
        p.vertex(size/2, size/2);
        p.endShape(p.CLOSE);
        
        // Cracks if damaged
        if (this.hp < 2) {
            p.stroke(0);
            p.line(0, -size/2, 0, 0);
        }
        
        p.pop();
    }
}

// Unit Class (Base for Mechs and Vek)
export class Unit extends Entity {
    constructor(gridX, gridY, type) {
        super(gridX, gridY);
        this.type = type;
        this.moveRange = 3;
        this.maxHp = 3;
        this.hp = 3;
        this.hasActed = false; // Turn state
        this.pushedThisTurn = false; // Flag to prevent infinite push loops
        
        // For enemies
        this.intent = null; // { target: {x,y}, type: 'ATTACK' }
    }

    renderHealthBar(p) {
        const x = this.pixelX;
        const y = this.pixelY - TILE_SIZE / 2 - 5;
        const w = TILE_SIZE * 0.8;
        const h = 4;
        
        p.noStroke();
        p.fill(100, 0, 0);
        p.rectMode(p.CENTER);
        p.rect(x, y, w, h);
        
        p.fill(0, 255, 0);
        const hpPct = this.hp / this.maxHp;
        p.rectMode(p.CORNER);
        p.rect(x - w/2, y - h/2, w * hpPct, h);
    }
}

// Mech Class
export class Mech extends Unit {
    constructor(gridX, gridY, mechType) {
        super(gridX, gridY, "MECH");
        this.mechType = mechType; // 'PRIME', 'TANK', 'ARTILLERY'
        this.setupStats();
    }

    setupStats() {
        switch(this.mechType) {
            case 'PRIME':
                this.maxHp = 4;
                this.moveRange = 4;
                this.damage = 2;
                this.color = [0, 100, 255]; // Blue
                break;
            case 'TANK':
                this.maxHp = 3;
                this.moveRange = 3;
                this.damage = 1; // Pushes further?
                this.color = [0, 200, 0]; // Green
                break;
            case 'ARTILLERY':
                this.maxHp = 2;
                this.moveRange = 3;
                this.damage = 1;
                this.color = [255, 200, 0]; // Orange
                break;
        }
        this.hp = this.maxHp;
    }

    render(p) {
        const x = this.pixelX;
        const y = this.pixelY;
        const size = TILE_SIZE * 0.7;

        p.push();
        p.translate(x, y);
        
        // Shadow
        p.fill(0, 0, 0, 50);
        p.noStroke();
        p.ellipse(0, size/2, size, size/3);

        // Body
        if (this.hasActed) {
            p.fill(100); // Greyed out
        } else {
            p.fill(this.color);
        }
        p.stroke(255);
        p.strokeWeight(2);
        
        if (this.mechType === 'PRIME') {
            p.rectMode(p.CENTER);
            p.rect(0, 0, size * 0.8, size);
            // Arms
            p.rect(-size/2, 0, size/4, size/2);
            p.rect(size/2, 0, size/4, size/2);
        } else if (this.mechType === 'TANK') {
            p.rectMode(p.CENTER);
            p.rect(0, size/4, size, size/2, 5); // Treads
            p.circle(0, -size/4, size/1.5); // Turret
            p.rect(size/2, -size/4, size/2, size/4); // Barrel
        } else if (this.mechType === 'ARTILLERY') {
            p.rectMode(p.CENTER);
            p.rect(0, 0, size * 0.6, size * 0.6);
            p.circle(0, 0, size); // Wheels?
            p.rect(0, -size/2, size/4, size); // Long barrel
        }

        p.pop();
        this.renderHealthBar(p);
    }
}

// Vek (Enemy) Class
export class Vek extends Unit {
    constructor(gridX, gridY, vekType) {
        super(gridX, gridY, "VEK");
        this.vekType = vekType; // 'SCARAB', 'HORNET', 'FIREFLY'
        this.setupStats();
    }

    setupStats() {
        switch(this.vekType) {
            case 'SCARAB':
                this.maxHp = 2;
                this.moveRange = 3;
                this.damage = 1;
                this.color = [200, 0, 200]; // Purple
                break;
            case 'HORNET':
                this.maxHp = 2;
                this.moveRange = 5;
                this.damage = 1;
                this.color = [200, 200, 0]; // Yellow
                break;
            case 'FIREFLY':
                this.maxHp = 4;
                this.moveRange = 2;
                this.damage = 2;
                this.color = [0, 200, 200]; // Teal
                break;
        }
        this.hp = this.maxHp;
    }

    render(p) {
        const x = this.pixelX;
        const y = this.pixelY;
        const size = TILE_SIZE * 0.7;

        p.push();
        p.translate(x, y);
        
        // Shadow
        p.fill(0, 0, 0, 50);
        p.noStroke();
        p.ellipse(0, size/2, size, size/3);

        // Body
        p.fill(this.color);
        p.stroke(0);
        p.strokeWeight(1);
        
        if (this.vekType === 'SCARAB') {
            p.triangle(0, -size/2, -size/2, size/2, size/2, size/2);
        } else if (this.vekType === 'HORNET') {
            p.ellipse(0, 0, size, size/2); // Body
            p.fill(255, 255, 255, 150); // Wings
            p.ellipse(-size/3, -size/2, size/2, size);
            p.ellipse(size/3, -size/2, size/2, size);
        } else if (this.vekType === 'FIREFLY') {
            p.circle(0, 0, size);
            p.fill(255, 100, 0); // Glow butt
            p.circle(0, size/3, size/2);
        }
        
        // Render Intent Icon
        if (this.intent) {
            // Drawn in UI layer usually, but can attach small icon here
            p.fill(255, 0, 0);
            p.noStroke();
            p.circle(size/2, -size/2, 10);
            p.stroke(255);
            p.line(size/2 - 2, -size/2 - 2, size/2 + 2, -size/2 + 2);
            p.line(size/2 + 2, -size/2 - 2, size/2 - 2, -size/2 + 2);
        }

        p.pop();
        this.renderHealthBar(p);
    }
}

// Tile Object (Pure data structure)
export class Tile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.type = "EMPTY"; // EMPTY, WATER, MOUNTAIN, BUILDING
        this.entity = null; // Reference to Unit or Building on this tile
    }
}