import { gameState, COLORS, RUNE_TYPES } from './globals.js';
import { createFloatingText } from './particles.js';

export class Entity {
    constructor(name, maxHp) {
        this.name = name;
        this.maxHp = maxHp;
        this.hp = maxHp;
        this.shield = 0;
        this.effects = [];
    }

    takeDamage(amount) {
        let actualDamage = amount;
        
        // Shield absorption
        if (this.shield > 0) {
            if (this.shield >= actualDamage) {
                this.shield -= actualDamage;
                actualDamage = 0;
            } else {
                actualDamage -= this.shield;
                this.shield = 0;
            }
        }
        
        this.hp = Math.max(0, this.hp - actualDamage);
        return actualDamage;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    addShield(amount) {
        this.shield += amount;
    }
}

export class Player extends Entity {
    constructor() {
        super("Hero", 100);
        this.mana = 0;
        this.maxMana = 100;
        this.baseDamage = 10;
        this.level = 1;
        this.gold = 0;
    }

    castUltimate() {
        if (this.mana >= this.maxMana && gameState.currentEnemy) {
            this.mana = 0;
            const dmg = 50;
            gameState.currentEnemy.takeDamage(dmg);
            createFloatingText(450, 100, `ULTIMATE! -${dmg}`, COLORS.LIGHT);
            return true;
        }
        return false;
    }

    gainMana(amount) {
        this.mana = Math.min(this.maxMana, this.mana + amount);
    }
}

export class Enemy extends Entity {
    constructor(stage) {
        // Scaling difficulty
        let hp = 80 + (stage * 40);
        
        // TEST_2 Adjustment
        if (gameState.controlMode === 'TEST_2') {
            hp = 10; // Easy kill for testing
        }
        
        super(`Monster Lv.${stage}`, hp);
        this.damage = 5 + (stage * 2);
        this.attackTimer = 0;
        this.attackInterval = 1; // Attacks every turn player resolves
    }

    attack(player) {
        const dmg = this.damage;
        const dealt = player.takeDamage(dmg);
        createFloatingText(150, 250, `-${dealt}`, COLORS.HP);
        return dealt;
    }
}

export function createPlayer() {
    gameState.player = new Player();
}

export function createEnemy(stage) {
    gameState.currentEnemy = new Enemy(stage);
}