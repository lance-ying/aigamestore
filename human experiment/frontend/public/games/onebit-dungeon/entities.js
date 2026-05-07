import { TILE_SIZE, COLORS, gameState } from './globals.js';
import { randomInt, distManhattan, findPath } from './utils.js';

export class Entity {
    constructor(x, y, name) {
        this.gridX = x;
        this.gridY = y;
        this.visualX = x * TILE_SIZE;
        this.visualY = y * TILE_SIZE;
        this.name = name;
        this.dead = false;
        this.color = COLORS.PLAYER;
        this.blocksMovement = true;
    }

    updateVisuals() {
        const targetX = this.gridX * TILE_SIZE;
        const targetY = this.gridY * TILE_SIZE;
        // Simple lerp
        this.visualX += (targetX - this.visualX) * 0.3;
        this.visualY += (targetY - this.visualY) * 0.3;
        
        // Snap if close
        if (Math.abs(targetX - this.visualX) < 1) this.visualX = targetX;
        if (Math.abs(targetY - this.visualY) < 1) this.visualY = targetY;
    }

    render(p, camX, camY) {
        // To be implemented by subclasses
    }
}

export class Player extends Entity {
    constructor(x, y, classData) {
        super(x, y, "Player");
        this.hp = classData.hp;
        this.maxHp = classData.hp;
        this.atk = classData.atk;
        this.def = classData.def;
        this.potions = 1;
        this.gold = 0;
        this.xp = 0;
        this.level = 1;
        this.nextLevelXp = 100;
        this.className = classData.name;
    }

    takeDamage(amount) {
        const actualDmg = Math.max(1, amount - this.def);
        this.hp -= actualDmg;
        gameState.floatingTexts.push(new FloatingText(this.gridX, this.gridY, `-${actualDmg}`, '#FF0000'));
        
        // Screen shake
        gameState.shake = 5;

        if (this.hp <= 0) {
            this.hp = 0;
            this.dead = true;
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        gameState.floatingTexts.push(new FloatingText(this.gridX, this.gridY, `+${amount}`, '#00FF00'));
    }
    
    gainXp(amount) {
        this.xp += amount;
        if (this.xp >= this.nextLevelXp) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.level++;
        this.xp -= this.nextLevelXp;
        this.nextLevelXp = Math.floor(this.nextLevelXp * 1.5);
        this.maxHp += 10;
        this.hp = this.maxHp;
        this.atk += 2;
        this.def += 1;
        gameState.floatingTexts.push(new FloatingText(this.gridX, this.gridY, "LEVEL UP!", '#FFFF00'));
    }

    render(p, camX, camY) {
        p.push();
        p.translate(this.visualX - camX, this.visualY - camY);
        p.fill(COLORS.PLAYER);
        p.noStroke();
        // Draw character shape
        p.rect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8, 2);
        
        // Eyes
        p.fill(0);
        p.rect(8, 8, 4, 4);
        p.rect(14, 8, 4, 4);
        p.pop();
    }
}

export class Enemy extends Entity {
    constructor(x, y, type, level) {
        super(x, y, type);
        this.type = type;
        
        // Stats scaling with level
        const scale = 1 + (level * 0.2);
        
        if (type === 'Slime') {
            this.hp = Math.floor(20 * scale);
            this.atk = Math.floor(5 * scale);
            this.color = COLORS.ENEMY_SLIME;
            this.xpValue = 10;
        } else if (type === 'Goblin') {
            this.hp = Math.floor(30 * scale);
            this.atk = Math.floor(8 * scale);
            this.color = COLORS.ENEMY_GOBLIN;
            this.xpValue = 20;
        } else if (type === 'Skeleton') {
            this.hp = Math.floor(25 * scale);
            this.atk = Math.floor(12 * scale);
            this.color = COLORS.ENEMY_SKELETON;
            this.xpValue = 15;
        }
        
        this.maxHp = this.hp;
    }

    takeDamage(amount) {
        this.hp -= amount;
        gameState.floatingTexts.push(new FloatingText(this.gridX, this.gridY, `-${amount}`, '#FFFFFF'));
        if (this.hp <= 0) {
            this.dead = true;
            this.blocksMovement = false;
        }
    }

    render(p, camX, camY) {
        p.push();
        p.translate(this.visualX - camX, this.visualY - camY);
        p.fill(this.color);
        p.noStroke();
        
        if (this.type === 'Slime') {
            p.rect(4, 8, TILE_SIZE-8, TILE_SIZE-12, 4);
        } else if (this.type === 'Goblin') {
            p.triangle(TILE_SIZE/2, 2, 4, TILE_SIZE-4, TILE_SIZE-4, TILE_SIZE-4);
        } else {
            p.rect(6, 4, TILE_SIZE-12, TILE_SIZE-8);
        }
        
        // HP Bar
        const hpPct = this.hp / this.maxHp;
        p.fill(100, 0, 0);
        p.rect(2, -4, TILE_SIZE-4, 3);
        p.fill(0, 255, 0);
        p.rect(2, -4, (TILE_SIZE-4) * hpPct, 3);
        
        p.pop();
    }
}

export class Item extends Entity {
    constructor(x, y, type) {
        super(x, y, type);
        this.type = type; // 'POTION', 'GOLD'
        this.blocksMovement = false;
        this.bobOffset = 0;
    }
    
    render(p, camX, camY) {
        this.bobOffset = Math.sin(gameState.frameCount * 0.1) * 3;
        
        p.push();
        p.translate(this.visualX - camX, this.visualY - camY + this.bobOffset);
        
        if (this.type === 'POTION') {
            p.fill(COLORS.POTION);
            p.circle(TILE_SIZE/2, TILE_SIZE/2, 10);
            p.rect(10, 4, 4, 6);
        } else if (this.type === 'GOLD') {
            p.fill(COLORS.GOLD);
            p.circle(TILE_SIZE/2, TILE_SIZE/2, 8);
        }
        
        p.pop();
    }
}

export class FloatingText {
    constructor(gridX, gridY, text, color) {
        this.x = gridX * TILE_SIZE + TILE_SIZE/2;
        this.y = gridY * TILE_SIZE;
        this.text = text;
        this.color = color;
        this.lifetime = 60;
        this.vy = -1;
    }
    
    update() {
        this.y += this.vy;
        this.lifetime--;
    }
    
    render(p, camX, camY) {
        p.fill(this.color);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(12);
        p.text(this.text, this.x - camX, this.y - camY);
    }
}

export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 30;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    
    render(p, camX, camY) {
        p.fill(this.color);
        p.noStroke();
        p.square(this.x - camX, this.y - camY, 3);
    }
}