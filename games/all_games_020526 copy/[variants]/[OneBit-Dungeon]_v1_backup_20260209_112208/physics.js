import { gameState, TILE_SIZE, GRID_W, GRID_H } from './globals.js';
import { distManhattan, findPath } from './utils.js';
import { Player, Enemy, Item, Particle } from './entities.js';

export function movePlayer(dx, dy) {
    if (gameState.gamePhase !== 'PLAYING') return;

    const newX = gameState.player.gridX + dx;
    const newY = gameState.player.gridY + dy;

    // Check bounds
    if (newX < 0 || newX >= GRID_W || newY < 0 || newY >= GRID_H) return;

    // Check Wall
    if (gameState.map[newY][newX].type === 'WALL') return;

    // Check Entities
    let blocked = false;
    let attackTarget = null;
    let itemCollected = null;

    for (let ent of gameState.entities) {
        if (!ent.dead && ent.gridX === newX && ent.gridY === newY) {
            if (ent instanceof Enemy) {
                blocked = true;
                attackTarget = ent;
            } else if (ent instanceof Item) {
                itemCollected = ent;
            }
        }
    }

    if (attackTarget) {
        // Combat
        attackTarget.takeDamage(gameState.player.atk);
        createParticles(newX, newY, '#FF0000', 5);
        if (attackTarget.dead) {
            gameState.player.gainXp(attackTarget.xpValue);
            gameState.score += attackTarget.xpValue;
            
            // Random chance to regain health after killing enemy (25% chance)
            if (Math.random() < 0.25) {
                const healAmount = Math.floor(Math.random() * 3) + 2; // 2-4 HP
                gameState.player.heal(healAmount);
                createParticles(gameState.player.gridX, gameState.player.gridY, '#00FF00', 3);
            }
            
            // Chance to drop loot
            if (Math.random() < 0.3) {
                gameState.entities.push(new Item(attackTarget.gridX, attackTarget.gridY, Math.random() < 0.5 ? 'GOLD' : 'POTION'));
            }
        }
    } else {
        // Move
        gameState.player.gridX = newX;
        gameState.player.gridY = newY;
        
        // Collect Item
        if (itemCollected) {
            if (itemCollected.type === 'GOLD') {
                gameState.player.gold += 10;
                gameState.score += 10;
            } else if (itemCollected.type === 'POTION') {
                gameState.player.potions++;
            }
            itemCollected.dead = true;
            createParticles(newX, newY, '#FFFF00', 5);
        }
        
        // Random chance to find health while exploring (15% chance)
        if (!itemCollected && Math.random() < 0.15) {
            const healAmount = Math.floor(Math.random() * 2) + 1; // 1-2 HP
            gameState.player.heal(healAmount);
            createParticles(newX, newY, '#00FF88', 3);
        }
        
        // Check Stairs
        if (gameState.map[newY][newX].type === 'STAIRS') {
           // Handled by Space key usually, but let's allow "interact" logic
        }
    }

    // Advance Turn
    gameState.turn++;
    updateEnemies();
    updateVisibility();
}

export function waitTurn() {
    // Check if on stairs
    const pX = gameState.player.gridX;
    const pY = gameState.player.gridY;
    
    if (gameState.map[pY][pX].type === 'STAIRS') {
        nextLevel();
    } else {
        // Base heal + random bonus (20% chance for extra)
        let healAmount = 1;
        if (Math.random() < 0.2) {
            healAmount += Math.floor(Math.random() * 2) + 1; // +1-2 extra HP
        }
        gameState.player.heal(healAmount);
        
        if (healAmount > 1) {
            createParticles(gameState.player.gridX, gameState.player.gridY, '#00FF00', 3);
        }
        
        gameState.turn++;
        updateEnemies();
    }
}

export function usePotion() {
    if (gameState.player.potions > 0) {
        gameState.player.potions--;
        gameState.player.heal(30);
        gameState.turn++;
        updateEnemies();
    }
}

function updateEnemies() {
    gameState.entities.forEach(ent => {
        if (ent instanceof Enemy && !ent.dead) {
            // Check distance to player
            const dist = distManhattan(ent.gridX, ent.gridY, gameState.player.gridX, gameState.player.gridY);
            
            if (dist <= 8) { // Aggro range
                if (dist === 1) {
                    // Attack Player
                    gameState.player.takeDamage(ent.atk);
                    createParticles(gameState.player.gridX, gameState.player.gridY, '#FFFFFF', 3);
                } else {
                    // Move towards player
                    const path = findPath(ent.gridX, ent.gridY, gameState.player.gridX, gameState.player.gridY, gameState.map);
                    if (path && path.length > 0) {
                        const nextStep = path[0];
                        
                        // Check if blocked by another enemy
                        let blocked = false;
                        for (let other of gameState.entities) {
                            if (other !== ent && !other.dead && other.blocksMovement && other.gridX === nextStep.x && other.gridY === nextStep.y) {
                                blocked = true;
                                break;
                            }
                        }
                        
                        if (!blocked) {
                            ent.gridX = nextStep.x;
                            ent.gridY = nextStep.y;
                        }
                    }
                }
            }
        }
    });
    
    // Cleanup dead entities
    gameState.entities = gameState.entities.filter(e => !e.dead);
}

function updateVisibility() {
    // Reset visibility
    for(let y=0; y<GRID_H; y++) {
        for(let x=0; x<GRID_W; x++) {
            gameState.map[y][x].visible = false;
        }
    }
    
    // Simple raycasting or distance check for FOV
    const VIEW_RADIUS = 7;
    const px = gameState.player.gridX;
    const py = gameState.player.gridY;
    
    for (let y = py - VIEW_RADIUS; y <= py + VIEW_RADIUS; y++) {
        for (let x = px - VIEW_RADIUS; x <= px + VIEW_RADIUS; x++) {
            if (x >= 0 && x < GRID_W && y >= 0 && y < GRID_H) {
                if (distManhattan(px, py, x, y) <= VIEW_RADIUS) {
                    // Simple line of sight check could go here, but distance is okay for OneBit style
                    gameState.map[y][x].visible = true;
                    gameState.map[y][x].seen = true;
                }
            }
        }
    }
}

function nextLevel() {
    gameState.level++;
    gameState.score += 100;
    // Keep player stats but reset position in generateDungeon logic
    // We need to signal the game loop to regenerate
    // For now, let's just do it directly via a callback or event system.
    // Simplest: expose a helper in logic.
    window.dispatchEvent(new CustomEvent('GENERATE_LEVEL'));
}

function createParticles(gridX, gridY, color, count) {
    const px = gridX * TILE_SIZE + TILE_SIZE/2;
    const py = gridY * TILE_SIZE + TILE_SIZE/2;
    for(let i=0; i<count; i++) {
        gameState.particles.push(new Particle(px, py, color));
    }
}