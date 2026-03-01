/**
 * Physics and Collision System
 * 
 * Implements a spatial grid for efficient collision detection of many entities
 * and handles physics interactions between mobs, gates, and bases.
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, MOB_RADIUS } from './globals.js';
import { Particle, FloatingText } from './particles.js';

/**
 * Spatial Grid for optimizing collision queries.
 * Divides the canvas into buckets.
 */
export class SpatialGrid {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.cols = Math.ceil(CANVAS_WIDTH / cellSize);
        this.rows = Math.ceil(CANVAS_HEIGHT / cellSize);
        this.buckets = new Map();
    }

    clear() {
        this.buckets.clear();
    }

    /**
     * Get unique key for a cell coordinate
     */
    getKey(c, r) {
        return `${c},${r}`;
    }

    /**
     * Add an entity to the grid buckets it overlaps with
     */
    add(entity) {
        // Determine grid bounds for the entity
        // We assume entity has x, y and optionally radius or width/height
        let minX, minY, maxX, maxY;

        if (entity.radius) {
            minX = entity.x - entity.radius;
            maxX = entity.x + entity.radius;
            minY = entity.y - entity.radius;
            maxY = entity.y + entity.radius;
        } else if (entity.width && entity.height) {
            minX = entity.x;
            maxX = entity.x + entity.width;
            minY = entity.y;
            maxY = entity.y + entity.height;
        } else {
            // Point fallback
            minX = maxX = entity.x;
            minY = maxY = entity.y;
        }

        const startCol = Math.floor(Math.max(0, minX) / this.cellSize);
        const endCol = Math.floor(Math.min(CANVAS_WIDTH - 1, maxX) / this.cellSize);
        const startRow = Math.floor(Math.max(0, minY) / this.cellSize);
        const endRow = Math.floor(Math.min(CANVAS_HEIGHT - 1, maxY) / this.cellSize);

        for (let c = startCol; c <= endCol; c++) {
            for (let r = startRow; r <= endRow; r++) {
                const key = this.getKey(c, r);
                if (!this.buckets.has(key)) {
                    this.buckets.set(key, []);
                }
                this.buckets.get(key).push(entity);
            }
        }
    }

    /**
     * Retrieve potential collision candidates for an entity
     */
    getCandidates(entity) {
        const candidates = new Set();
        
        let minX, minY, maxX, maxY;
        if (entity.radius) {
            minX = entity.x - entity.radius;
            maxX = entity.x + entity.radius;
            minY = entity.y - entity.radius;
            maxY = entity.y + entity.radius;
        } else {
            minX = entity.x;
            maxX = entity.x + entity.width;
            minY = entity.y;
            maxY = entity.y + entity.height;
        }

        const startCol = Math.floor(Math.max(0, minX) / this.cellSize);
        const endCol = Math.floor(Math.min(CANVAS_WIDTH - 1, maxX) / this.cellSize);
        const startRow = Math.floor(Math.max(0, minY) / this.cellSize);
        const endRow = Math.floor(Math.min(CANVAS_HEIGHT - 1, maxY) / this.cellSize);

        for (let c = startCol; c <= endCol; c++) {
            for (let r = startRow; r <= endRow; r++) {
                const key = this.getKey(c, r);
                if (this.buckets.has(key)) {
                    const bucket = this.buckets.get(key);
                    for (let i = 0; i < bucket.length; i++) {
                        if (bucket[i] !== entity) {
                            candidates.add(bucket[i]);
                        }
                    }
                }
            }
        }
        return Array.from(candidates);
    }
}

/**
 * Main physics update function
 * Handles movement integration and collision resolution
 */
export function updatePhysics(p) {
    // 1. Clear Grid
    gameState.spatialGrid.clear();

    // 2. Add interactable entities to grid
    // Mobs
    for (const mob of gameState.mobs) {
        gameState.spatialGrid.add(mob);
    }
    // Gates
    for (const gate of gameState.gates) {
        gameState.spatialGrid.add(gate);
    }
    // Base (Static, but added for collision checks with mobs)
    if (gameState.enemyBase) {
        gameState.spatialGrid.add(gameState.enemyBase);
    }
    if (gameState.player) {
        // Player base hitbox
        const playerBaseHitbox = {
            x: 0,
            y: CANVAS_HEIGHT - 50,
            width: CANVAS_WIDTH,
            height: 50,
            type: 'PLAYER_BASE',
            isStatic: true
        };
        gameState.spatialGrid.add(playerBaseHitbox);
    }

    // 3. Process Mob Interactions
    // We iterate backwards because mobs might die/duplicate
    for (let i = gameState.mobs.length - 1; i >= 0; i--) {
        const mob = gameState.mobs[i];
        
        // Move mob
        mob.update(p);

        // Get candidates
        const candidates = gameState.spatialGrid.getCandidates(mob);

        for (const other of candidates) {
            // Mob vs Mob (Opposite teams)
            if (other.type === 'MOB' && other.team !== mob.team) {
                if (checkCircleCollision(mob, other)) {
                    resolveMobCombat(mob, other, p);
                    // If mob died, stop processing this mob
                    if (mob.isDead) break;
                }
            }
            
            // Mob vs Gate (Friendly only)
            else if (other.type === 'GATE' && mob.team === 'FRIENDLY') {
                // Rect (Gate) vs Circle (Mob)
                if (p.collideRectCircle(other.x, other.y, other.width, other.height, mob.x, mob.y, mob.radius * 2)) {
                     resolveMobGate(mob, other, p);
                     if (mob.isDead) break;
                }
            }

            // Mob vs Enemy Base (Friendly only)
            else if (other.type === 'ENEMY_BASE' && mob.team === 'FRIENDLY') {
                if (p.collideRectCircle(other.x, other.y, other.width, other.height, mob.x, mob.y, mob.radius * 2)) {
                    resolveMobBase(mob, other, p);
                    if (mob.isDead) break;
                }
            }

            // Enemy Mob vs Player Base
            else if (other.type === 'PLAYER_BASE' && mob.team === 'ENEMY') {
                if (p.collideRectCircle(other.x, other.y, other.width, other.height, mob.x, mob.y, mob.radius * 2)) {
                    resolveMobPlayerBase(mob, p);
                    if (mob.isDead) break;
                }
            }
        }
    }
}

// --- Collision Resolution Helpers ---

function checkCircleCollision(c1, c2) {
    const dx = c1.x - c2.x;
    const dy = c1.y - c2.y;
    const rSum = c1.radius + c2.radius;
    return (dx * dx + dy * dy) <= (rSum * rSum);
}

function resolveMobCombat(mob1, mob2, p) {
    // Both mobs destroy each other
    mob1.kill();
    mob2.kill();
    
    // Effects
    spawnExplosion(p, (mob1.x + mob2.x)/2, (mob1.y + mob2.y)/2, [200, 200, 200]);
    
    // Score
    gameState.score += 5;
}

function resolveMobGate(mob, gate, p) {
    // Only process if mob hasn't already hit this gate (to prevent double triggering)
    // We can use a cooldown or ID check, but moving the mob past the gate is easier.
    // Here we will consume the mob and spawn new ones past the gate.
    
    mob.kill(); // Remove original
    
    // Spawn new mobs based on gate operation
    let count = 1;
    if (gate.op === 'MULT') {
        count = Math.floor(gate.value);
    } else if (gate.op === 'ADD') {
        count = 1 + gate.value; // Original + Added
    }

    // Cap burst spawn to prevent crash
    count = Math.min(count, 50);

    for (let i = 0; i < count; i++) {
        // Spawn slightly ahead and spread out
        const offsetX = (Math.random() - 0.5) * 20;
        const offsetY = (Math.random() - 0.5) * 20 - 15; // Move up
        
        // Import Mob dynamically or pass constructor?
        // To avoid circular dependency, we use the spawn helper attached to gameState or passed in.
        // For this design, we'll assume a global spawner or factory pattern.
        // We will call the method on the gate itself or player to spawn.
        
        // Solution: Create plain object data for game loop to process spawning?
        // Better: `gameState.player.spawnMob(...)`
        if (gameState.player) {
            gameState.player.spawnMobAt(mob.x + offsetX, mob.y + offsetY - 10);
        }
    }
    
    // Visual pop
    spawnText(p, mob.x, mob.y, gate.op === 'MULT' ? `x${gate.value}` : `+${gate.value}`);
}

function resolveMobBase(mob, base, p) {
    mob.kill();
    base.takeDamage(1);
    spawnExplosion(p, mob.x, mob.y, [255, 100, 100]);
    gameState.score += 10;
    
    // Shake screen
    gameState.shakeTimer = 5;
    gameState.shakeIntensity = 2;
}

function resolveMobPlayerBase(mob, p) {
    mob.kill();
    // Player base damage logic
    if (gameState.player) {
        gameState.player.takeBaseDamage(1);
    }
    spawnExplosion(p, mob.x, mob.y, [255, 50, 50]);
    
    gameState.shakeTimer = 10;
    gameState.shakeIntensity = 5;
}

// --- Effects Helpers ---

function spawnExplosion(p, x, y, color) {
    for (let i = 0; i < 5; i++) {
        gameState.particles.push(new Particle(x, y, color));
    }
}

function spawnText(p, x, y, text) {
    gameState.floatingTexts.push(new FloatingText(x, y, text));
}