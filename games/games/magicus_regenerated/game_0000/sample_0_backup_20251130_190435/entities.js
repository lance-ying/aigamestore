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
        // 6 Stages: 2 Easy, 2 Medium, 2 Hard
        let name = "Monster";
        let hp = 100;
        let damage = 10;
        
        if (stage === 1) {
            name = "Slime (Easy)";
            hp = 60;
            damage = 8;
        } else if (stage === 2) {
            name = "Rat (Easy)";
            hp = 80;
            damage = 10;
        } else if (stage === 3) {
            name = "Wolf (Med)";
            hp = 150;
            damage = 15;
        } else if (stage === 4) {
            name = "Goblin (Med)";
            hp = 200;
            damage = 18;
        } else if (stage === 5) {
            name = "Dragon (Hard)";
            hp = 350;
            damage = 25;
        } else if (stage === 6) {
            name = "Demon King (Boss)";
            hp = 500;
            damage = 35;
        }
        
        // TEST_2 Adjustment
        if (gameState.controlMode === 'TEST_2') {
            hp = 10; 
        }
        
        super(name, hp);
        this.damage = damage;
        this.attackTimer = 0;
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