// entities.js
// Game entities classes

import { Hex } from './hex_lib.js';
import { gameState, COLORS, HEX_SIZE, logGameEvent } from './globals.js';

export class Entity {
    constructor(q, r, type) {
        this.q = q;
        this.r = r; // Logical grid position
        this.type = type;
        this.pixelPos = Hex.toPixel({q, r}); // Visual position (for interpolation)
        this.isDead = false;
        this.hp = 1;
        this.maxHp = 1;
    }

    update(dt) {
        // Visual interpolation
        const target = Hex.toPixel({q: this.q, r: this.r});
        const speed = 15 * dt;
        
        const dx = target.x - this.pixelPos.x;
        const dy = target.y - this.pixelPos.y;
        
        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
            this.pixelPos.x += dx * speed;
            this.pixelPos.y += dy * speed;
        } else {
            this.pixelPos.x = target.x;
            this.pixelPos.y = target.y;
        }
    }

    render(p, offset) {
        // Base render (override in children)
        const x = this.pixelPos.x + offset.x;
        const y = this.pixelPos.y + offset.y;
        
        p.fill(255);
        p.circle(x, y, HEX_SIZE);
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.isDead = true;
            this.die();
        }
    }
    
    die() {
        // Create particles
        // Remove from entity list handled by manager
    }
}

export class Player extends Entity {
    constructor(q, r) {
        super(q, r, 'PLAYER');
        this.hp = 3;
        this.maxHp = 3;
    }
    
    render(p, offset) {
        const x = this.pixelPos.x + offset.x;
        const y = this.pixelPos.y + offset.y;
        
        p.push();
        p.translate(x, y);
        
        // Shadow
        p.fill(0, 0, 0, 100);
        p.ellipse(0, 5, HEX_SIZE * 1.2, HEX_SIZE * 0.8);
        
        // Body
        p.fill(COLORS.PLAYER);
        p.stroke(COLORS.PLAYER_SHADOW);
        p.strokeWeight(2);
        
        // Draw gladiator helmet shape
        p.beginShape();
        p.vertex(0, -HEX_SIZE * 0.8);
        p.vertex(HEX_SIZE * 0.5, -HEX_SIZE * 0.2);
        p.vertex(HEX_SIZE * 0.3, HEX_SIZE * 0.6);
        p.vertex(-HEX_SIZE * 0.3, HEX_SIZE * 0.6);
        p.vertex(-HEX_SIZE * 0.5, -HEX_SIZE * 0.2);
        p.endShape(p.CLOSE);
        
        // Eyes/Visor
        p.fill(0);
        p.rect(-5, -5, 10, 3);
        
        // Health pips
        for(let i=0; i<this.maxHp; i++) {
            if(i < this.hp) p.fill(0, 255, 0);
            else p.fill(100, 0, 0);
            p.noStroke();
            p.circle((i - 1) * 8, -HEX_SIZE, 4);
        }
        
        p.pop();
    }
    
    die() {
        logGameEvent('player_death', { level: gameState.level, score: gameState.score });
        gameState.gamePhase = 'GAME_OVER_LOSE';
    }
}

export class Enemy extends Entity {
    constructor(q, r, type) {
        super(q, r, type);
    }
    
    // Helper to check if enemy intends to attack
    getThreatenedTiles(playerPos) {
        return []; // Override in subclasses
    }
}

export class MeleeEnemy extends Enemy {
    constructor(q, r) {
        super(q, r, 'ENEMY_MELEE');
    }
    
    render(p, offset) {
        const x = this.pixelPos.x + offset.x;
        const y = this.pixelPos.y + offset.y;
        
        p.push();
        p.translate(x, y);
        
        p.fill(COLORS.ENEMY_MELEE);
        p.stroke(255);
        p.strokeWeight(1);
        
        // Spiky shape
        p.beginShape();
        for(let i=0; i<6; i++) {
            const angle = i * Math.PI / 3;
            const r1 = HEX_SIZE * 0.7;
            const r2 = HEX_SIZE * 0.4;
            p.vertex(Math.cos(angle) * r1, Math.sin(angle) * r1);
            p.vertex(Math.cos(angle + Math.PI/6) * r2, Math.sin(angle + Math.PI/6) * r2);
        }
        p.endShape(p.CLOSE);
        
        p.pop();
    }
    
    getThreatenedTiles() {
        // Melee attacks all 6 neighbors
        const tiles = [];
        const neighbors = Hex.neighbors({q: this.q, r: this.r});
        neighbors.forEach(n => tiles.push(Hex.getKey(n)));
        return tiles;
    }
}

export class RangedEnemy extends Enemy {
    constructor(q, r) {
        super(q, r, 'ENEMY_RANGED');
        this.range = 4;
    }
    
    render(p, offset) {
        const x = this.pixelPos.x + offset.x;
        const y = this.pixelPos.y + offset.y;
        
        p.push();
        p.translate(x, y);
        
        p.fill(COLORS.ENEMY_RANGED);
        p.stroke(255);
        p.strokeWeight(1);
        p.circle(0, 0, HEX_SIZE * 1.2);
        
        // Crosshair
        p.stroke(0);
        p.line(-5, 0, 5, 0);
        p.line(0, -5, 0, 5);
        
        p.pop();
    }
    
    getThreatenedTiles() {
        // Ranged attacks in 6 directions up to range
        const tiles = [];
        const directions = [0, 1, 2, 3, 4, 5];
        
        directions.forEach(dir => {
            let current = {q: this.q, r: this.r};
            for(let i=0; i<this.range; i++) {
                current = Hex.neighbor(current, dir);
                // In a real implementation, we should stop at walls
                // But for simplicity of this function, we return logic shape
                if (gameState.tiles.has(Hex.getKey(current))) {
                     // Check if wall
                     const tile = gameState.tiles.get(Hex.getKey(current));
                     if (tile.type === 'WALL') break;
                     tiles.push(Hex.getKey(current));
                }
            }
        });
        return tiles;
    }
}