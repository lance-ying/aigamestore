/**
 * entities.js
 * Defines the Player and Enemy classes.
 * Handles movement, state transitions, and interaction logic.
 */

import { 
    gameState, CANVAS_WIDTH, GROUND_Y, ATTACK_RANGE, 
    COLOR_PLAYER, COLOR_ENEMY_BASIC, COLOR_ENEMY_FAST, COLOR_ENEMY_TANK, 
    COLOR_ENEMY_ARMORED, COLOR_ENEMY_BOSS,
    GRAVITY
} from './globals.js';
import { drawStickman } from './renderer.js';
import { createExplosion } from './particle_system.js';

/**
 * The Player Character
 */
export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        
        this.facing = 1; // 1 = Right, -1 = Left
        this.state = 'IDLE'; // IDLE, ATTACK_LEFT, ATTACK_RIGHT, HURT
        this.animTimer = 0;
        this.animDuration = 10; // Frames for attack animation
        
        this.health = 100;
        this.maxHealth = 100;
    }

    update() {
        // Animation State Management
        if (this.state !== 'IDLE') {
            this.animTimer--;
            if (this.animTimer <= 0) {
                this.state = 'IDLE';
            }
        }

        // Miss stun recovery
        if (gameState.isMissStunned) {
            gameState.missStunTimer--;
            if (gameState.missStunTimer <= 0) {
                gameState.isMissStunned = false;
            }
        }
        
        // Simple Physics (mostly for jump/hit recoil effects, player stays mostly centered)
        this.x = CANVAS_WIDTH / 2; // Lock x
        this.y = GROUND_Y; // Lock y
    }

    attack(direction) {
        this.facing = direction; // 1 or -1
        // Alternate animations
        this.state = (Math.random() > 0.5) ? 'ATTACK_PUNCH' : 'ATTACK_KICK';
        this.animTimer = 8; // Quick snap
    }
    
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        this.state = 'HURT';
        this.animTimer = 15;
        
        createExplosion(this.x, this.y - 30, "BLOOD", 5);
        
        if (this.health <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }

    render(p) {
        // Color changes if stunned
        let color = COLOR_PLAYER;
        if (gameState.isMissStunned) {
            color = [100, 100, 100]; // Darker/Gray when stunned
            // Shake effect on player
            const shake = (Math.random() - 0.5) * 4;
            drawStickman(p, this.x + shake, this.y, color, 'HURT', this.facing);
        } else {
            drawStickman(p, this.x, this.y, color, this.state, this.facing);
        }
    }
}

/**
 * The Enemy Character
 */
export class Enemy {
    constructor(side, type = 'BASIC') {
        // Spawn off-screen
        this.side = side; // -1 (Left) or 1 (Right)
        this.x = (side === -1) ? -50 : CANVAS_WIDTH + 50;
        this.y = GROUND_Y;
        
        this.type = type;
        this.speed = 2 + Math.random();
        this.hp = 1;
        this.scale = 1.0;
        this.color = COLOR_ENEMY_BASIC;

        // Type Configuration
        switch (type) {
            case 'FAST':
                this.speed = 4 + Math.random();
                this.color = COLOR_ENEMY_FAST;
                break;
            case 'TANK':
                this.speed *= 0.7;
                this.hp = 2;
                this.scale = 1.2;
                this.color = COLOR_ENEMY_TANK;
                break;
            case 'ARMORED':
                this.speed *= 0.8;
                this.hp = 3;
                this.scale = 1.1;
                this.color = COLOR_ENEMY_ARMORED;
                break;
            case 'BOSS':
                this.speed *= 0.5;
                this.hp = 4;
                this.scale = 1.5;
                this.color = COLOR_ENEMY_BOSS;
                break;
            default: // BASIC
                break;
        }
        
        // Difficulty scaling for speed
        this.speed *= (1 + gameState.difficultyLevel * 0.1);
        
        this.state = 'RUN';
        this.markedForDeletion = false;
        
        this.damage = 10;
    }

    update() {
        if (this.markedForDeletion) return;
        
        // Move towards player (center)
        const targetX = CANVAS_WIDTH / 2;
        const distToPlayer = Math.abs(this.x - targetX);
        
        // Stop if hit player
        if (distToPlayer > 20) {
            this.x += this.speed * -this.side; // Move opposite to side
            this.state = 'RUN';
        } else {
            // Reached player, attack!
            this.attackPlayer();
        }
    }
    
    attackPlayer() {
        if (gameState.player && !gameState.isMissStunned) {
            gameState.player.takeDamage(this.damage);
            // Enemy effectively dies after hitting player (suicide attack style common in these games)
            this.markedForDeletion = true;
            createExplosion(this.x, this.y - 20, "SMOKE", 5);
        }
    }
    
    takeHit(damage) {
        this.hp -= damage;
        createExplosion(this.x, this.y - 30, "BLOOD", 8);
        createExplosion(this.x, this.y - 30, "SPARK", 3);
        
        if (this.hp <= 0) {
            this.die();
        } else {
            // Knockback
            this.x += this.side * 40; 
            this.state = 'HURT';
        }
    }
    
    die() {
        this.markedForDeletion = true;
        
        // Ragdoll effect or just explosion
        createExplosion(this.x, this.y - 25, "BLOOD", 15);
        
        // Update Game State
        let scoreVal = 100;
        if (this.type === 'TANK') scoreVal = 200;
        if (this.type === 'ARMORED') scoreVal = 300;
        if (this.type === 'BOSS') scoreVal = 500;

        gameState.score += scoreVal;
        gameState.kills++;
        gameState.furyMeter = Math.min(gameState.furyMeter + 5, 100);
        gameState.timeSinceLastKill = 0;
        gameState.combo++;
        if (gameState.combo > gameState.maxCombo) gameState.maxCombo = gameState.combo;
    }

    render(p) {
        // Facing opposite to side (Face the player)
        const facing = -this.side;
        drawStickman(p, this.x, this.y, this.color, this.state, facing, this.scale);
        
        // Draw HP dots for Multi-Hit Enemies
        if (this.hp > 1) {
             p.push();
             p.fill(255, 0, 0);
             p.noStroke();
             const dotSpacing = 10;
             const startX = this.x - ((this.hp - 1) * dotSpacing) / 2;
             const yOffset = 65 * this.scale; // Adjust height based on scale
             
             for(let i=0; i<this.hp; i++) {
                 p.circle(startX + i * dotSpacing, this.y - yOffset, 5);
             }
             p.pop();
        }
    }
}