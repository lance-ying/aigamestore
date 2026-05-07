/**
 * bullets.js
 * Handles Bullet definitions, pooling, and Pattern Generators.
 */

import { ObjectPool, PI, TWO_PI, Easing } from './utils.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';
import { Physics } from './physics.js';

/**
 * Base Bullet Class
 */
export class Bullet {
    constructor() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.radius = 4;
        this.color = COLORS.ENEMY_BULLET;
        this.damage = 1;
        this.isPlayer = false;
        this.grazed = false; // Scoring mechanic
    }

    spawn(x, y, vx, vy, isPlayer = false, props = {}) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.isPlayer = isPlayer;
        this.active = true;
        this.grazed = false;
        
        // Apply properties
        this.radius = props.radius || (isPlayer ? 5 : 4);
        this.color = props.color || (isPlayer ? COLORS.PLAYER_BULLET : COLORS.ENEMY_BULLET);
        this.damage = props.damage || 1;
        this.type = props.type || 'basic'; // 'basic', 'aimed', 'laser'
    }

    update() {
        if (!this.active) return;

        this.x += this.vx;
        this.y += this.vy;

        // Bounds check
        const margin = 20;
        if (this.x < -margin || this.x > CANVAS_WIDTH + margin ||
            this.y < -margin || this.y > CANVAS_HEIGHT + margin) {
            this.active = false;
        }
    }

    render(p) {
        if (!this.active) return;
        
        p.push();
        p.noStroke();
        p.fill(this.color);
        
        // Simple glow effect
        if (!this.isPlayer && this.type !== 'basic') {
            p.drawingContext.shadowBlur = 5;
            p.drawingContext.shadowColor = this.color;
        }

        if (this.type === 'oval') {
            p.translate(this.x, this.y);
            p.rotate(Math.atan2(this.vy, this.vx));
            p.ellipse(0, 0, this.radius * 3, this.radius * 1.5);
        } else {
            p.circle(this.x, this.y, this.radius * 2);
            // Inner core
            p.fill(255);
            p.circle(this.x, this.y, this.radius);
        }
        
        p.pop();
    }
}

// Global Bullet Managers
export const BulletSystem = {
    pool: new ObjectPool(() => new Bullet(), (b) => { b.active = false; }),
    
    spawn: (x, y, vx, vy, isPlayer, props) => {
        const b = BulletSystem.pool.acquire();
        b.spawn(x, y, vx, vy, isPlayer, props);
        if (isPlayer) gameState.playerBullets.push(b);
        else gameState.enemyBullets.push(b);
        return b;
    },

    updateAndRender: (p) => {
        // Player Bullets
        for (let i = gameState.playerBullets.length - 1; i >= 0; i--) {
            const b = gameState.playerBullets[i];
            b.update();
            b.render(p);
            if (!b.active) {
                BulletSystem.pool.release(b);
                gameState.playerBullets.splice(i, 1);
            }
        }

        // Enemy Bullets
        for (let i = gameState.enemyBullets.length - 1; i >= 0; i--) {
            const b = gameState.enemyBullets[i];
            b.update();
            b.render(p);
            if (!b.active) {
                BulletSystem.pool.release(b);
                gameState.enemyBullets.splice(i, 1);
            }
        }
    },
    
    clearEnemyBullets: () => {
        // Turn bullets into score items or particles (the "Discharge" effect)
        for (let b of gameState.enemyBullets) {
            b.active = false;
            BulletSystem.pool.release(b);
            // TODO: Spawn particle/score
        }
        gameState.enemyBullets = [];
    }
};

/**
 * Pattern Generator
 * Helper functions to create complex bullet patterns
 */
export const Patterns = {
    // Fire a ring of bullets
    ring: (x, y, count, speed, isPlayer = false, props = {}) => {
        const step = TWO_PI / count;
        for (let i = 0; i < count; i++) {
            const angle = i * step;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            BulletSystem.spawn(x, y, vx, vy, isPlayer, props);
        }
    },

    // Fire aimed at player
    aimed: (x, y, speed, spreadAngle = 0, count = 1, props = {}) => {
        if (!gameState.player) return;
        const targetX = gameState.player.x;
        const targetY = gameState.player.y;
        
        const baseAngle = Math.atan2(targetY - y, targetX - x);
        
        if (count === 1) {
            BulletSystem.spawn(x, y, Math.cos(baseAngle) * speed, Math.sin(baseAngle) * speed, false, props);
        } else {
            // Fan shape
            const startAngle = baseAngle - spreadAngle / 2;
            const step = spreadAngle / (count - 1);
            
            for (let i = 0; i < count; i++) {
                const angle = startAngle + i * step;
                BulletSystem.spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, false, props);
            }
        }
    },
    
    // Spiral pattern
    spiral: (x, y, frame, arms = 3, speed = 3, rotationSpeed = 0.1, props = {}) => {
        for (let i = 0; i < arms; i++) {
            const angle = (frame * rotationSpeed) + (i * (TWO_PI / arms));
            BulletSystem.spawn(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, false, props);
        }
    }
};