import { gameState, COLORS } from './globals.js';
import { createDamageParticle, createBlockParticle } from './particles.js';

/**
 * Classes for Player and Enemies.
 */

export class Entity {
    constructor(x, y, maxHp) {
        this.x = x;
        this.y = y;
        this.maxHp = maxHp;
        this.currentHp = maxHp;
        this.block = 0;
        this.powers = {
            vulnerable: 0,
            weak: 0,
            strength: 0
        };
        this.isDead = false;
        // Animation
        this.shakeX = 0;
        this.shakeTime = 0;
        this.flashTime = 0;
    }

    takeDamage(amount) {
        // Apply Vulnerable (50% more damage taken)
        if (this.powers.vulnerable > 0) {
            amount = Math.floor(amount * 1.5);
        }

        // Block mitigation
        let blocked = 0;
        if (this.block > 0) {
            if (this.block >= amount) {
                blocked = amount;
                this.block -= amount;
                amount = 0;
            } else {
                blocked = this.block;
                amount -= this.block;
                this.block = 0;
            }
        }

        // Apply remaining damage
        this.currentHp -= amount;
        
        // Visuals
        this.shakeTime = 10;
        this.flashTime = 5;
        createDamageParticle(this.x, this.y, amount + blocked, blocked > 0);

        if (this.currentHp <= 0) {
            this.currentHp = 0;
            this.isDead = true;
        }
    }

    addBlock(amount) {
        // Apply Weak (25% less block gained - simplified interpretation for consistency)
        if (this.powers.weak > 0) {
            amount = Math.floor(amount * 0.75);
        }
        this.block += amount;
        createBlockParticle(this.x, this.y, amount);
    }

    heal(amount) {
        this.currentHp = Math.min(this.currentHp + amount, this.maxHp);
    }

    updateAnimations() {
        if (this.shakeTime > 0) {
            this.shakeX = (Math.random() - 0.5) * 10;
            this.shakeTime--;
        } else {
            this.shakeX = 0;
        }
        if (this.flashTime > 0) this.flashTime--;
    }

    render(p) {
        this.updateAnimations();
        
        p.push();
        p.translate(this.x + this.shakeX, this.y);

        // Flash white on hit
        if (this.flashTime > 0) {
            p.fill(255);
            p.stroke(255);
        } else {
            this.drawShape(p);
        }

        // HP Bar
        const barW = 80;
        const barH = 10;
        const hpPct = this.currentHp / this.maxHp;
        p.noStroke();
        p.fill(COLORS.HP_BAR_BG);
        p.rect(-barW/2, 60, barW, barH);
        p.fill(COLORS.HP_BAR_FILL);
        p.rect(-barW/2, 60, barW * hpPct, barH);
        
        // HP Text
        p.fill(255);
        p.textSize(12);
        p.textAlign(p.CENTER);
        p.text(`${this.currentHp}/${this.maxHp}`, 0, 70);

        // Block Icon
        if (this.block > 0) {
            p.fill(COLORS.BLOCK_ICON);
            p.circle(-barW/2 - 15, 65, 20);
            p.fill(255);
            p.text(this.block, -barW/2 - 15, 70);
        }

        // Powers
        this.drawPowers(p);

        p.pop();
    }
    
    drawPowers(p) {
        let yOff = -60;
        p.textSize(10);
        p.textAlign(p.CENTER);
        
        if (this.powers.vulnerable > 0) {
            p.fill(255, 100, 100);
            p.text(`VULN ${this.powers.vulnerable}`, 0, yOff);
            yOff -= 12;
        }
        if (this.powers.weak > 0) {
            p.fill(200, 200, 100);
            p.text(`WEAK ${this.powers.weak}`, 0, yOff);
            yOff -= 12;
        }
        if (this.powers.strength > 0) {
            p.fill(255, 100, 0);
            p.text(`STR ${this.powers.strength}`, 0, yOff);
            yOff -= 12;
        }
    }

    drawShape(p) {
        // Override
    }
}

export class Player extends Entity {
    constructor() {
        super(100, 250, 80); // x, y, hp
        this.energy = 3;
        this.maxEnergy = 3;
    }

    drawShape(p) {
        p.fill(COLORS.PLAYER);
        p.stroke(200);
        p.strokeWeight(2);
        // Draw a shield-like shape
        p.beginShape();
        p.vertex(-20, -30);
        p.vertex(20, -30);
        p.vertex(20, 10);
        p.vertex(0, 40);
        p.vertex(-20, 10);
        p.endShape(p.CLOSE);
        
        // Eyes
        p.fill(255);
        p.circle(-8, -10, 8);
        p.circle(8, -10, 8);
        p.fill(0);
        p.circle(-8, -10, 3);
        p.circle(8, -10, 3);
    }
}

export class Enemy extends Entity {
    constructor(x, y, type) {
        // Define stats based on type
        let hp = 40;
        switch(type) {
            case 'cultist': hp = 45; break;
            case 'jaw_worm': hp = 40; break;
            case 'louse': hp = 30; break;
            case 'boss': hp = 150; break;
        }
        super(x, y, hp);
        this.type = type;
        this.intent = null;
        this.nextMove = {};
        this.decideNextMove();
    }

    decideNextMove() {
        const roll = Math.random();
        
        if (this.type === 'cultist') {
            // Cultist always attacks or buffs
            if (this.powers.strength === 0) {
                this.nextMove = { type: 'buff', amount: 3, name: "Ritual" }; // Gain str
            } else {
                this.nextMove = { type: 'attack', amount: 6 + this.powers.strength };
            }
        } else if (this.type === 'jaw_worm') {
            if (roll < 0.6) {
                this.nextMove = { type: 'attack', amount: 11 };
            } else if (roll < 0.8) {
                this.nextMove = { type: 'block_attack', amount: 7, block: 5 };
            } else {
                this.nextMove = { type: 'buff_block', amount: 3, block: 6 }; // Str + Block
            }
        } else if (this.type === 'boss') {
             if (roll < 0.7) {
                this.nextMove = { type: 'attack', amount: 15 };
            } else {
                this.nextMove = { type: 'debuff', amount: 2, name: "Gaze" }; // Vulnerable
            }
        } else {
            // Default weak enemy
            if (roll < 0.5) {
                this.nextMove = { type: 'attack', amount: 8 };
            } else {
                this.nextMove = { type: 'debuff', amount: 2, name: "Web" }; // Weak
            }
        }
    }

    executeTurn(player) {
        let dmg = 0;
        
        // Apply Strength
        let rawDmg = (this.nextMove.amount || 0) + this.powers.strength;
        
        // Apply Player Weakness (Player deals less dmg? No, Player takes less dmg? Weak reduces OUTGOING dmg)
        // If enemy has Weak, they deal 25% less.
        if (this.powers.weak > 0) {
            rawDmg = Math.floor(rawDmg * 0.75);
        }

        switch (this.nextMove.type) {
            case 'attack':
                player.takeDamage(rawDmg);
                break;
            case 'block_attack':
                this.addBlock(this.nextMove.block);
                player.takeDamage(rawDmg);
                break;
            case 'buff':
                this.powers.strength += this.nextMove.amount;
                break;
            case 'buff_block':
                 this.powers.strength += this.nextMove.amount;
                 this.addBlock(this.nextMove.block);
                 break;
            case 'debuff':
                if (this.nextMove.name === "Web") {
                    player.powers.weak += this.nextMove.amount;
                } else if (this.nextMove.name === "Gaze") {
                    player.powers.vulnerable += this.nextMove.amount;
                }
                break;
        }

        // Tick down powers at end of turn
        if (this.powers.vulnerable > 0) this.powers.vulnerable--;
        if (this.powers.weak > 0) this.powers.weak--;
        
        this.decideNextMove();
    }

    drawShape(p) {
        p.stroke(200);
        p.strokeWeight(2);
        
        if (this.type === 'boss') {
            p.fill(COLORS.ENEMY);
            // Big Hexagon
            p.beginShape();
            for (let i = 0; i < 6; i++) {
                let angle = p.TWO_PI / 6 * i;
                p.vertex(Math.cos(angle) * 40, Math.sin(angle) * 40);
            }
            p.endShape(p.CLOSE);
        } else if (this.type === 'cultist') {
             p.fill(100, 200, 200);
             // Bird shape roughly
             p.triangle(0, -30, -20, 20, 20, 20);
        } else {
            p.fill(150, 100, 50);
            p.circle(0, 0, 40);
        }

        // Draw Intent
        this.drawIntent(p);
    }

    drawIntent(p) {
        p.push();
        p.translate(0, -50);
        p.noStroke();
        
        if (this.nextMove.type.includes('attack')) {
            p.fill(255, 50, 50);
            p.triangle(-5, 0, 5, 0, 0, 10); // Sword tip
            // Damage number
            let dmg = (this.nextMove.amount || 0) + this.powers.strength;
            if (this.powers.weak > 0) dmg = Math.floor(dmg * 0.75);
            
            p.textSize(16);
            p.textAlign(p.CENTER);
            p.text(dmg, 0, -5);
        } else if (this.nextMove.type.includes('buff')) {
            p.fill(50, 255, 50);
            p.circle(0, 0, 10);
        } else if (this.nextMove.type.includes('debuff')) {
            p.fill(200, 50, 200);
            p.circle(0, 0, 10);
        } else {
             p.fill(100, 100, 255);
             p.rectMode(p.CENTER);
             p.rect(0, 0, 10, 10);
        }
        
        p.pop();
    }
}