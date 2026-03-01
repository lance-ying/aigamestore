/**
 * Collision and Movement Logic
 */

import { gameState, GRID_WIDTH, GRID_HEIGHT, TILE_SIZE } from './globals.js';
import { createParticleEffect, createFloatingText } from './particles.js';
import { Player, Enemy, Item } from './entities.js';

export class PhysicsSystem {
    
    /**
     * Attempt to move an entity to a target grid position
     * @returns {boolean} true if moved, false if blocked
     */
    tryMoveEntity(entity, dx, dy) {
        const targetX = entity.gridX + dx;
        const targetY = entity.gridY + dy;
        
        // Bounds check
        if (targetX < 0 || targetX >= GRID_WIDTH || targetY < 0 || targetY >= GRID_HEIGHT) {
            return false;
        }

        // Wall check
        if (gameState.dungeon && !gameState.dungeon.isWalkable(targetX, targetY)) {
            // Bump effect against wall
            entity.bump(dx * 0.5, dy * 0.5);
            return false;
        }

        // Entity Collision check
        const occupant = this.getEntityAt(targetX, targetY);
        
        if (entity.type === 'PLAYER') {
            return this.handlePlayerCollision(entity, targetX, targetY, occupant, dx, dy);
        } else if (entity.type === 'ENEMY') {
            return this.handleEnemyCollision(entity, targetX, targetY, occupant);
        }

        return false;
    }

    getEntityAt(x, y) {
        // Check regular entities
        for (let e of gameState.entities) {
            if (e.gridX === x && e.gridY === y) return e;
        }
        // Check player separately if not in list (though usually added to list)
        if (gameState.player && gameState.player.gridX === x && gameState.player.gridY === y) return gameState.player;
        
        return null;
    }

    handlePlayerCollision(player, x, y, occupant, dx, dy) {
        if (!occupant) {
            // Move freely
            player.moveTo(x, y);
            
            // Check for exit
            if (gameState.exit && gameState.exit.gridX === x && gameState.exit.gridY === y) {
                gameState.triggerNextLevel = true;
                return true;
            }
            return true;
        }
        
        if (occupant.type === 'ENEMY') {
            // Attack!
            player.bump(dx, dy);
            occupant.takeDamage(1);
            occupant.bump(dx * 0.5, dy * 0.5); // Knockback visual
            
            // Stun the enemy so they don't attack back this turn
            occupant.stunned = true;
            
            createParticleEffect(occupant.pixelX + TILE_SIZE/2, occupant.pixelY + TILE_SIZE/2, [255, 255, 255], 5);
            createFloatingText(occupant.pixelX + TILE_SIZE/2, occupant.pixelY, "HIT!", [255, 255, 255]);
            return true; // Action taken (attack), but didn't move into tile
        }
        
        if (occupant.type === 'ITEM') {
            // Collect
            this.collectItem(player, occupant);
            player.moveTo(x, y);
            return true;
        }

        return false;
    }

    handleEnemyCollision(enemy, x, y, occupant) {
        if (!occupant) {
            enemy.moveTo(x, y);
            return true;
        }
        
        if (occupant.type === 'PLAYER') {
            // Enemy attacks player
            
            // Check if player is vulnerable (missed beat)
            if (!gameState.playerMissedBeat) {
                // Player blocked/dodged by keeping rhythm
                createFloatingText(gameState.player.pixelX + TILE_SIZE/2, gameState.player.pixelY, "BLOCK", [100, 100, 255]);
                enemy.bump((x - enemy.gridX), (y - enemy.gridY));
                return true; // Attack consumed, no damage
            }

            this.damagePlayer(1);
            enemy.bump((x - enemy.gridX), (y - enemy.gridY));
            return true;
        }

        // Enemies don't attack other enemies or items
        return false;
    }

    damagePlayer(amount) {
        gameState.player.health -= amount;
        gameState.health = gameState.player.health; // Sync global state for UI
        
        gameState.shakeAmount = 10; // Screen shake
        createFloatingText(gameState.player.pixelX + TILE_SIZE/2, gameState.player.pixelY, `-${amount} HP`, [255, 0, 0]);
        
        // Reset combo
        gameState.combo = 0;
        gameState.multiplier = 1;
        
        if (gameState.player.health <= 0) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }

    collectItem(player, item) {
        if (item.itemType === 'GOLD') {
            gameState.score += 10 * gameState.multiplier;
            createFloatingText(player.pixelX, player.pixelY, `+${10 * gameState.multiplier}`, [255, 215, 0]);
        } else if (item.itemType === 'POTION') {
            gameState.health = Math.min(gameState.health + 1, gameState.maxHealth);
            if (gameState.player) gameState.player.health = gameState.health; // Sync player entity
            
            createFloatingText(player.pixelX, player.pixelY, "+1 HP", [0, 255, 0]);
        }
        
        // Remove item
        const idx = gameState.entities.indexOf(item);
        if (idx > -1) gameState.entities.splice(idx, 1);
    }
}

export const physics = new PhysicsSystem();