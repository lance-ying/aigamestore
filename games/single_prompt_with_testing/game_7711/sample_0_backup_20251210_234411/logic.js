/**
 * logic.js
 * Game logic, turn management, combat resolution.
 */

import { gameState, CONFIG } from './globals.js';
import { HexMath, lerp } from './utils.js';
import { Pathfinder } from './grid.js';
import { Player, Enemy } from './entities.js';
import { globalParticles } from './particles.js';
import { animationSystem } from './animations.js';

export class GameLogic {
    static async handlePlayerAction(action, data) {
        if (gameState.turnPhase !== 'PLAYER_INPUT') return;
        
        let turnSpent = false;

        // Player Actions
        const pTile = gameState.grid.getTile(gameState.player.q, gameState.player.r);
        
        if (action === 'MOVE') {
            const targetTile = data.tile;
            
            // Check adjacency
            const dist = HexMath.distance(pTile, targetTile);
            
            if (dist === 1) {
                // Interact
                if (targetTile.type === 'WALL') {
                    // Bonk
                    animationSystem.shake(2);
                } else if (targetTile.entity) {
                    // Attack
                    GameLogic.performAttack(gameState.player, targetTile.entity);
                    turnSpent = true;
                } else {
                    // Move
                    gameState.player.moveTo(targetTile);
                    turnSpent = true;
                    // Check for pickup/lava etc later
                }
            } else {
                // Too far
                // UI Sound or Shake?
            }
        } else if (action === 'JUMP') {
            const targetTile = data.tile;
            const dist = HexMath.distance(pTile, targetTile);
            
            if (dist === 2 && !targetTile.entity && targetTile.type !== 'WALL') {
                 // Check if there is something between to jump over? (Optional rule)
                 // Simply jump
                 gameState.player.teleportTo(targetTile);
                 turnSpent = true;
                 animationSystem.shake(5); // Impact
            }
        } else if (action === 'WAIT') {
            turnSpent = true;
            globalParticles.emit(gameState.player.pixelX, gameState.player.pixelY, 'spark', 5);
        }
        
        if (turnSpent) {
            gameState.turnPhase = 'PLAYER_ACT'; // Block input
            setTimeout(() => {
                GameLogic.resolveEnvironment();
                // If game over didn't happen
                if (gameState.gamePhase === 'PLAYING') {
                    GameLogic.startEnemyTurn();
                }
            }, CONFIG.TURN_DELAY);
        }
    }
    
    static resolveEnvironment() {
        const pTile = gameState.grid.getTile(gameState.player.q, gameState.player.r);
        
        // Lava damage
        if (pTile.type === 'LAVA') {
            gameState.player.takeDamage(1);
            gameState.messageLog.push("Burned by lava!");
            animationSystem.shake(5);
        }
        
        // Exit
        if (pTile.type === 'EXIT') {
            GameLogic.nextLevel();
            return; // Stop turn processing
        }
        
        // Check death
        if (gameState.player.isDead) {
            gameState.gamePhase = "GAME_OVER_LOSE";
        }
    }

    static performAttack(attacker, defender) {
        // Simple damage
        const dmg = attacker.damage || 1; // Player defaults to 1 effectively
        defender.takeDamage(dmg);
        
        // Bump animation
        const dx = (defender.pixelX - attacker.pixelX) * 0.3;
        const dy = (defender.pixelY - attacker.pixelY) * 0.3;
        
        animationSystem.addTween(attacker, 'pixelX', attacker.pixelX + dx, 5, 'easeOut');
        animationSystem.addTween(attacker, 'pixelY', attacker.pixelY + dy, 5, 'easeOut');
        
        // Return animation is implicit or handle later? 
        // For simplicity, we just tween back in next frame update or let it slide?
        // Actually, let's just offset temporarily.
        setTimeout(() => {
            const tile = gameState.grid.getTile(attacker.q, attacker.r);
            animationSystem.addTween(attacker, 'pixelX', tile.pixelX, 5, 'easeIn');
            animationSystem.addTween(attacker, 'pixelY', tile.pixelY, 5, 'easeIn');
        }, 100);

        // Sound effect visual
        globalParticles.emit(defender.pixelX, defender.pixelY, 'spark', 10);
        
        // Remove dead
        if (defender.isDead) {
            const idx = gameState.enemies.indexOf(defender);
            if (idx > -1) gameState.enemies.splice(idx, 1);
            const eIdx = gameState.entities.indexOf(defender);
            if (eIdx > -1) gameState.entities.splice(eIdx, 1);
            gameState.score += 10;
        }
    }

    static startEnemyTurn() {
        gameState.turnPhase = 'ENEMY_ACT';
        
        // Process enemies one by one or all at once?
        // Sequential feels better for tactics
        let delay = 0;
        
        gameState.enemies.forEach(enemy => {
            if (enemy.isDead) return;
            
            setTimeout(() => {
                GameLogic.processEnemyAI(enemy);
            }, delay);
            delay += 150;
        });
        
        setTimeout(() => {
            // End turn
            if (gameState.player.hp <= 0) {
                gameState.gamePhase = "GAME_OVER_LOSE";
            } else {
                gameState.turnPhase = 'PLAYER_INPUT';
                gameState.turnCount++;
            }
        }, delay + 100);
    }
    
    static processEnemyAI(enemy) {
        if (!gameState.player || gameState.player.isDead) return;
        
        const pTile = gameState.grid.getTile(gameState.player.q, gameState.player.r);
        const eTile = gameState.grid.getTile(enemy.q, enemy.r);
        const dist = HexMath.distance(pTile, eTile);
        
        // Activation Range
        if (dist > 8) return; // Too far, idle
        
        if (enemy.type === 'ENEMY_MELEE') {
            if (dist === 1) {
                GameLogic.performAttack(enemy, gameState.player);
            } else {
                // Move towards
                const path = Pathfinder.findPath(eTile, pTile, gameState.grid, false);
                if (path && path.length > 0) {
                    const nextStep = path[0];
                    if (!nextStep.entity) { // Double check not blocked
                        enemy.moveTo(nextStep);
                    }
                }
            }
        } else if (enemy.type === 'ENEMY_RANGED') {
            // Try to maintain range 3-4
            if (dist <= enemy.range && dist > 1) {
                // Fire projectile (Instant hit logic for simplicity)
                GameLogic.performAttack(enemy, gameState.player);
                // Visual beam
                // ...
            } else if (dist === 1) {
                // Flee or Melee? Melee weak
                GameLogic.performAttack(enemy, gameState.player);
            } else {
                // Move closer
                const path = Pathfinder.findPath(eTile, pTile, gameState.grid, false);
                if (path && path.length > 0) enemy.moveTo(path[0]);
            }
        } else if (enemy.type === 'ENEMY_BOMBER') {
            // Suicide charge
            if (dist === 1) {
                // Explode
                enemy.takeDamage(999); // Die
                gameState.player.takeDamage(enemy.damage);
                animationSystem.shake(10);
                globalParticles.emit(enemy.pixelX, enemy.pixelY, 'blood', 20); // Big explosion
            } else {
                const path = Pathfinder.findPath(eTile, pTile, gameState.grid, false);
                if (path && path.length > 0) enemy.moveTo(path[0]);
            }
        }
    }
    
    static nextLevel() {
        gameState.level++;
        gameState.score += 100;
        // Regenerate map in main game loop or trigger here?
        // Let's set a flag or call generation directly if safe
        // We need to import LevelGenerator but circular dependency risk?
        // Pass via global or callback. 
        // For now, let's just trigger a reset via gameInstance
        window.gameInstance.resetLevel(gameState.level);
        gameState.turnPhase = 'PLAYER_INPUT';
    }
}