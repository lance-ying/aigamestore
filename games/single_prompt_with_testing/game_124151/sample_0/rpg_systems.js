/**
 * rpg_systems.js
 * Manages Stats, Leveling, Experience, and Damage Calculations.
 */

import { gameState, COLORS } from './globals.js';
import { createFloatingText, createParticleExplosion } from './particles.js';

export const LEVEL_CURVE = [0, 100, 250, 450, 700, 1000, 1400, 2000, 3000, 5000];

export class Stats {
    constructor(config = {}) {
        this.level = config.level || 1;
        this.maxHp = config.maxHp || 100;
        this.hp = this.maxHp;
        this.maxMp = config.maxMp || 50;
        this.mp = this.maxMp;
        
        this.strength = config.strength || 10; // Affects damage
        this.defense = config.defense || 0;    // Reduces incoming damage
        this.speed = config.speed || 3;        // Movement speed
        
        this.xp = 0;
        this.nextLevelXp = LEVEL_CURVE[this.level] || 999999;
    }

    gainXp(amount) {
        this.xp += amount;
        if (this.xp >= this.nextLevelXp) {
            this.levelUp();
        }
        return amount;
    }

    levelUp() {
        this.level++;
        this.xp -= this.nextLevelXp;
        this.nextLevelXp = LEVEL_CURVE[this.level] || (this.level * 1000);
        
        // Stat Increases
        this.maxHp += 20;
        this.maxMp += 10;
        this.hp = this.maxHp;
        this.mp = this.maxMp;
        this.strength += 2;
        this.defense += 1;
        
        // Visual feedback request
        gameState.levelUpTriggered = true; 
    }
}

export const CombatSystem = {
    /**
     * Calculates damage based on attacker stats and defender defense
     */
    calculateDamage(attacker, defender, multiplier = 1.0) {
        // Base damage variation +/- 10%
        const variation = (Math.random() * 0.2) + 0.9;
        
        let rawDamage = attacker.stats.strength * multiplier;
        let mitigation = defender.stats.defense * 0.5;
        
        let finalDamage = Math.max(1, Math.floor((rawDamage - mitigation) * variation));
        
        // Critical hit chance (5%)
        let isCrit = Math.random() < 0.05;
        if (isCrit) {
            finalDamage = Math.floor(finalDamage * 1.5);
        }
        
        return { damage: finalDamage, isCrit: isCrit };
    },

    /**
     * Handles the hit event
     */
    applyHit(attacker, defender, damageInfo, p) {
        defender.stats.hp -= damageInfo.damage;
        defender.flashTime = 10; // Flash white for 10 frames
        
        // Pushback
        const dx = defender.x - attacker.x;
        const dy = defender.y - attacker.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        
        // Add knockback force
        defender.vx += (dx/dist) * 10;
        defender.vy += (dy/dist) * 10;
        
        // Create visual effects
        createFloatingText(
            defender.x, 
            defender.y - 20, 
            damageInfo.damage.toString(), 
            damageInfo.isCrit ? '#ffcc00' : '#ffffff',
            damageInfo.isCrit ? 24 : 16
        );
        
        createParticleExplosion(defender.x, defender.y, damageInfo.isCrit ? 10 : 5, COLORS.ui.hp);

        // Check death
        if (defender.stats.hp <= 0) {
            defender.die();
            if (attacker.type === 'PLAYER') {
                attacker.stats.gainXp(defender.xpValue);
                gameState.score += defender.xpValue;
                gameState.enemiesDefeated++;
            }
        }
    }
};