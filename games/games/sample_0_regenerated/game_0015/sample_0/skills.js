/**
 * Skill system definition.
 * Handles ability logic, cooldowns, and execution.
 */

import { gameState } from './globals.js';
import { Projectile } from './entities.js';
import { createExplosion } from './particles.js';

export class Skill {
    constructor(name, cooldownFrames, manaCost) {
        this.name = name;
        this.maxCooldown = cooldownFrames;
        this.currentCooldown = 0;
        this.manaCost = manaCost;
    }

    canUse(user) {
        return this.currentCooldown <= 0; // && user.mp >= this.manaCost
    }

    update() {
        if (this.currentCooldown > 0) {
            this.currentCooldown--;
        }
    }

    use(user, targetX, targetY) {
        if (this.canUse(user)) {
            this.execute(user, targetX, targetY);
            this.currentCooldown = this.maxCooldown;
            // user.mp -= this.manaCost;
            return true;
        }
        return false;
    }

    execute(user, targetX, targetY) {
        // Override in subclasses
        console.log(`${user.constructor.name} used ${this.name}`);
    }
}

export class DashSkill extends Skill {
    constructor() {
        super("Flash Step", 60, 10);
        this.dashSpeed = 15;
        this.duration = 10;
    }

    execute(user, targetX, targetY) {
        // Calculate direction based on current movement or facing
        let dx = 0;
        let dy = 0;
        
        if (Math.abs(user.vx) > 0.1 || Math.abs(user.vy) > 0.1) {
            const mag = Math.sqrt(user.vx*user.vx + user.vy*user.vy);
            dx = user.vx / mag;
            dy = user.vy / mag;
        } else {
            // Dash in facing direction
            dx = user.facing === 1 ? 1 : -1;
        }

        user.vx = dx * this.dashSpeed;
        user.vy = dy * this.dashSpeed;
        
        // Add visual effect (Ghost trail is handled in Player render or particle system)
        createExplosion(user.x + user.width/2, user.y + user.height/2, 10, [200, 200, 255]);
    }
}

export class SpinAttackSkill extends Skill {
    constructor() {
        super("Cyclone Slash", 120, 20);
        this.range = 80;
        this.damageMult = 1.5;
    }

    execute(user, targetX, targetY) {
        // Visuals
        const centerX = user.x + user.width/2;
        const centerY = user.y + user.height/2;
        
        // Logic: Hit all enemies in range
        gameState.enemies.forEach(enemy => {
            const ex = enemy.x + enemy.width/2;
            const ey = enemy.y + enemy.height/2;
            const dist = Math.sqrt(Math.pow(centerX - ex, 2) + Math.pow(centerY - ey, 2));
            
            if (dist < this.range) {
                const dmg = Math.floor(user.stats.attack * this.damageMult);
                enemy.takeDamage(dmg, true); // true = isCritical (visual styling)
                
                // Knockback
                const angle = Math.atan2(ey - centerY, ex - centerX);
                enemy.vx = Math.cos(angle) * 10;
                enemy.vy = Math.sin(angle) * 10;
            }
        });

        // Add a "Spin" particle effect (a large expanding ring)
        // Implemented ad-hoc in particles for now or specialized effect
        createExplosion(centerX, centerY, 20, [100, 255, 255]);
    }
}

export class FireballSkill extends Skill {
    constructor() {
        super("Shadow Bolt", 90, 15);
        this.speed = 8;
        this.damage = 25;
    }

    execute(user, targetX, targetY) {
        const startX = user.x + user.width/2;
        const startY = user.y + user.height/2;
        
        // Aim at mouse (or target)
        // If targetX/Y are not provided, default to facing
        let tx = targetX;
        let ty = targetY;

        const proj = new Projectile(startX, startY, tx, ty, this.speed, this.damage, "player");
        // Color override
        proj.color = [150, 50, 255];
        gameState.projectiles.push(proj);
    }
}