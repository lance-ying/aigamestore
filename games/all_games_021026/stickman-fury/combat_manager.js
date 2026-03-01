/**
 * combat_manager.js
 * Handles the logic for registering hits, misses, spawning enemies, and managing queues.
 */

import { 
    gameState, CANVAS_WIDTH, ATTACK_RANGE, MISS_PENALTY_FRAMES, 
    SPAWN_RATE_INITIAL, SPAWN_RATE_MIN, DIFFICULTY_RAMP_INTERVAL 
} from './globals.js';
import { Enemy } from './entities.js';
import { createFloatingText, createExplosion } from './particle_system.js';
import { randomRange } from './utils.js';

let spawnTimer = 0;
let currentSpawnRate = SPAWN_RATE_INITIAL;

export function initCombat() {
    spawnTimer = 0;
    currentSpawnRate = SPAWN_RATE_INITIAL;
}

export function updateCombat(p) {
    if (gameState.gamePhase !== 'PLAYING') return;

    // 1. Spawning Logic
    spawnTimer++;
    
    // Ramp up difficulty
    if (gameState.frameCount % DIFFICULTY_RAMP_INTERVAL === 0) {
        gameState.difficultyLevel++;
        currentSpawnRate = Math.max(SPAWN_RATE_MIN, currentSpawnRate - 5);
        createFloatingText(CANVAS_WIDTH/2, 100, "SPEED UP!", [255, 50, 50], 30);
    }
    
    if (spawnTimer > currentSpawnRate) {
        spawnEnemy();
        spawnTimer = 0;
    }

    // 2. Sort/Clean Queues (Remove dead enemies)
    gameState.enemies = gameState.enemies.filter(e => !e.markedForDeletion);
    
    // Re-categorize for queue accuracy
    gameState.leftSideEnemies = gameState.enemies
        .filter(e => e.side === -1)
        .sort((a, b) => b.x - a.x); // Sort by closeness to center (descending x for left side)
        
    gameState.rightSideEnemies = gameState.enemies
        .filter(e => e.side === 1)
        .sort((a, b) => a.x - b.x); // Sort by closeness to center (ascending x for right side)
        
    // 3. Update all enemies
    gameState.enemies.forEach(e => e.update());
}

function spawnEnemy() {
    // Determine side (try to balance or random)
    const side = (Math.random() > 0.5) ? 1 : -1;
    
    // Determine type based on difficulty
    let type = 'BASIC';
    const roll = Math.random() * 100;
    
    // Probabilities shift as difficulty increases
    if (gameState.difficultyLevel > 5 && roll < 5) {
        type = 'BOSS'; // Rare boss at high levels
    } else if (gameState.difficultyLevel > 3 && roll < 15) {
        type = 'ARMORED'; // 3 HP enemy
    } else if (gameState.difficultyLevel > 2 && roll < 30) {
        type = 'TANK'; // 2 HP enemy
    } else if (gameState.difficultyLevel > 1 && roll < 50) {
        type = 'FAST'; // Fast enemy
    }
    
    const enemy = new Enemy(side, type);
    gameState.enemies.push(enemy);
}

/**
 * Player attempts an attack.
 * @param {number} side - -1 for Left, 1 for Right
 */
export function handleAttackInput(side) {
    if (gameState.isMissStunned) return; // Cannot attack while stunned
    if (gameState.gamePhase !== 'PLAYING') return;

    const center = CANVAS_WIDTH / 2;
    let target = null;
    
    // Check the appropriate queue
    // The queues are sorted by closeness to player. Index 0 is the closest.
    if (side === -1) {
        if (gameState.leftSideEnemies.length > 0) {
            target = gameState.leftSideEnemies[0];
        }
    } else {
        if (gameState.rightSideEnemies.length > 0) {
            target = gameState.rightSideEnemies[0];
        }
    }
    
    // Validation
    let validHit = false;
    if (target) {
        const dist = Math.abs(target.x - center);
        if (dist <= ATTACK_RANGE) {
            validHit = true;
        }
    }
    
    // Execute
    gameState.player.attack(side);
    
    if (validHit) {
        // Successful Hit
        gameState.player.vx = side * 5; // Slight lunge visual
        target.takeHit(1);
        
        gameState.shakeIntensity = 5;
        
        // visual feedback
        const dist = Math.abs(target.x - center);
        if (dist < 80) {
             createFloatingText(target.x, target.y - 50, "PERFECT!", [255, 215, 0], 24);
             gameState.perfectHits++;
             gameState.score += 50;
        }
        
    } else {
        // Miss!
        handleMiss();
    }
}

export function handleFury() {
    if (gameState.furyMeter >= 100 && !gameState.isMissStunned) {
        // Unleash Fury
        gameState.furyMeter = 0;
        gameState.shakeIntensity = 20;
        gameState.backgroundEffects = []; // Clear current effects
        
        // Kill all enemies on screen
        gameState.enemies.forEach(e => {
            if (Math.abs(e.x - CANVAS_WIDTH/2) < CANVAS_WIDTH/2) {
                e.takeHit(100);
            }
        });
        
        createFloatingText(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, "FURY BLAST!", [255, 0, 0], 40);
    }
}

function handleMiss() {
    gameState.combo = 0;
    gameState.misses++;
    gameState.isMissStunned = true;
    gameState.missStunTimer = MISS_PENALTY_FRAMES;
    
    createFloatingText(CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 50, "MISS!", [150, 150, 150], 30);
    
    // Visual feedback for miss (gray flash?)
    gameState.shakeIntensity = 2;
}