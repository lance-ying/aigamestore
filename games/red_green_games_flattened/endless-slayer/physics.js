/**
 * Collision handling system.
 */
import { gameState, ENTITY_TYPES, CLASSES } from './globals.js';
import { rectIntersect, dist } from './utils.js';
import { createExplosion } from './particles.js';

export function handleCollisions(p) {
    const player = gameState.player;
    if (!player || player.hp <= 0) return;

    // 1. Player vs Enemies
    gameState.enemies.forEach(enemy => {
        if (enemy.dead) return;
        
        // Check Hitbox Intersection
        const pBounds = player.getBounds();
        const eBounds = enemy.getBounds();
        
        if (rectIntersect(pBounds.x, pBounds.y, pBounds.w, pBounds.h, eBounds.x, eBounds.y, eBounds.w, eBounds.h)) {
            // Collision occurred
            
            // Check for Player Attack (Knight Sword / Knave Dash)
            let enemyHit = false;
            
            // Knave Dash Attack: Body is hitbox
            if (player.classType === CLASSES.KNAVE && player.isAttacking) {
                enemy.takeDamage(25); // Dash damage
                enemyHit = true;
            } 
            
            // Knight: If touching front, sword might hit? 
            // Simplified: Knight sword is handled as a separate check range below usually, 
            // but in Slayin, touching the sword (always extended) hurts enemies.
            // Let's implement: If player facing enemy and attacking, OR simple body collision logic:
            // "Don't get yourself fooled... death lurks behind every corner!"
            // Original Slayin: Touching enemy body hurts YOU. Attacking hurts THEM.
            
            if (!enemyHit) {
                // Player takes damage
                player.takeDamage(enemy.damage || 10);
            }
        }
        
        // Knight Sword Reach Check (Area in front of player)
        if (player.classType === CLASSES.KNIGHT && player.isAttacking) {
            const attackRange = 50;
            // Center of attack box
            const atkX = player.x + (player.facing * 30);
            const atkY = player.y;
            
            // Simple distance check for arc swing
            if (dist(atkX, atkY, enemy.x, enemy.y) < attackRange) {
                 if (player.attackFrame === 8) { // Hit once per swing roughly
                     enemy.takeDamage(30);
                 }
            }
        }
    });

    // 2. Projectiles vs Entities
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const proj = gameState.projectiles[i];
        if (proj.dead) continue;
        
        const projBounds = proj.getBounds();
        
        if (proj.source === 'player') {
            // Check vs Enemies
            for (let enemy of gameState.enemies) {
                if (enemy.dead) continue;
                const eBounds = enemy.getBounds();
                if (rectIntersect(projBounds.x, projBounds.y, projBounds.w, projBounds.h, eBounds.x, eBounds.y, eBounds.w, eBounds.h)) {
                    enemy.takeDamage(proj.damage);
                    proj.dead = true;
                    createExplosion(proj.x, proj.y, 5, 'magic');
                    break;
                }
            }
        } else {
            // Check vs Player
            const pBounds = player.getBounds();
            if (rectIntersect(projBounds.x, projBounds.y, projBounds.w, projBounds.h, pBounds.x, pBounds.y, pBounds.w, pBounds.h)) {
                player.takeDamage(proj.damage);
                proj.dead = true;
                createExplosion(proj.x, proj.y, 5, 'fire');
            }
        }
    }
    
    // 3. Player vs Loot
    for (let i = gameState.loot.length - 1; i >= 0; i--) {
        const loot = gameState.loot[i];
        if (dist(player.x, player.y, loot.x, loot.y) < 30) {
            if (loot.lootType === 'potion') {
                player.hp = Math.min(player.hp + 50, player.maxHp);
                createExplosion(loot.x, loot.y, 10, 'magic');
                // Remove loot
                loot.dead = true;
                const idx = gameState.loot.indexOf(loot);
                gameState.loot.splice(idx, 1);
                const eIdx = gameState.entities.indexOf(loot);
                gameState.entities.splice(eIdx, 1);
            }
        }
    }
}