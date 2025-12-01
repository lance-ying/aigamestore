// logic.js
// Game rules, Turn management, AI

import { gameState, HEX_SIZE, COLORS, logGameEvent, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_RADIUS } from './globals.js';
import { Hex } from './hex_lib.js';
import { Player, MeleeEnemy, RangedEnemy } from './entities.js';

// ---- LEVEL GENERATION ----

export function generateLevel(levelIdx) {
    gameState.tiles.clear();
    gameState.entities = [];
    gameState.dangerTiles.clear();
    
    const p = window.gameInstance;
    
    // Generate Grid
    for (let q = -GRID_RADIUS; q <= GRID_RADIUS; q++) {
        for (let r = -GRID_RADIUS; r <= GRID_RADIUS; r++) {
            if (Math.abs(q + r) <= GRID_RADIUS) {
                // Determine tile type
                let type = 'FLOOR';
                
                // Add some random walls/obstacles, but keep center clear
                const dist = Hex.distance({q:0, r:0}, {q, r});
                if (dist > 1 && Math.random() < 0.15) {
                    type = 'WALL';
                }
                
                gameState.tiles.set(`${q},${r}`, {
                    q, r, type,
                    pixelPos: Hex.toPixel({q, r})
                });
            }
        }
    }
    
    // Place Player at 0,0
    gameState.player = new Player(0, 0);
    gameState.entities.push(gameState.player);
    gameState.cursor = {q: 0, r: 0};
    
    // Place Exit (far from center)
    let exitPlaced = false;
    let attempts = 0;
    while (!exitPlaced && attempts < 100) {
        const q = Math.floor(Math.random() * (2 * GRID_RADIUS)) - GRID_RADIUS;
        const r = Math.floor(Math.random() * (2 * GRID_RADIUS)) - GRID_RADIUS;
        const hex = {q, r};
        const key = Hex.getKey(hex);
        
        if (gameState.tiles.has(key) && Hex.distance({q:0,r:0}, hex) > 3) {
            gameState.tiles.get(key).type = 'EXIT';
            gameState.exitPos = hex;
            exitPlaced = true;
        }
        attempts++;
    }
    
    // Spawn Enemies based on level
    const enemyCount = 2 + Math.floor(levelIdx * 1.5);
    let spawned = 0;
    attempts = 0;
    
    while (spawned < enemyCount && attempts < 200) {
        const q = Math.floor(Math.random() * (2 * GRID_RADIUS)) - GRID_RADIUS;
        const r = Math.floor(Math.random() * (2 * GRID_RADIUS)) - GRID_RADIUS;
        const hex = {q, r};
        const key = Hex.getKey(hex);
        
        if (gameState.tiles.has(key) && 
            gameState.tiles.get(key).type === 'FLOOR' && 
            Hex.distance({q:0,r:0}, hex) > 2 &&
            !getEntityAt(hex)) {
            
            // 70% Melee, 30% Ranged
            if (Math.random() < 0.7) {
                gameState.entities.push(new MeleeEnemy(q, r));
            } else {
                gameState.entities.push(new RangedEnemy(q, r));
            }
            spawned++;
        }
        attempts++;
    }
    
    updateDangerMap();
    logGameEvent('level_start', { level: levelIdx, enemies: spawned });
}

export function getEntityAt(hex) {
    return gameState.entities.find(e => e.q === hex.q && e.r === hex.r && !e.isDead);
}

// ---- TURN LOGIC ----

export function resolvePlayerAction(action, targetHex) {
    // Action: 'MOVE', 'ATTACK', 'WAIT'
    
    if (gameState.turnState !== "PLAYER_INPUT") return;
    
    if (action === 'WAIT') {
        gameState.turnState = "PLAYER_ACT";
        // Small delay then enemy turn
        addDelayAnimation(200, () => endPlayerTurn());
        return;
    }
    
    if (action === 'MOVE') {
        // Verify valid move
        const dist = Hex.distance(gameState.player, targetHex);
        const tile = gameState.tiles.get(Hex.getKey(targetHex));
        
        if (dist === 1 && tile && tile.type !== 'WALL' && !getEntityAt(targetHex)) {
            // Check for exit
            if (tile.type === 'EXIT') {
                gameState.level++;
                gameState.score += 100;
                gameState.gamePhase = "LEVEL_TRANSITION";
                setTimeout(() => {
                    generateLevel(gameState.level);
                    gameState.gamePhase = "PLAYING";
                    gameState.turnState = "PLAYER_INPUT";
                }, 1000);
                return;
            }
            
            // Execute Move
            gameState.turnState = "PLAYER_ACT";
            gameState.player.q = targetHex.q;
            gameState.player.r = targetHex.r;
            
            addDelayAnimation(200, () => endPlayerTurn());
        }
    }
    
    if (action === 'ATTACK') {
        const targetEntity = getEntityAt(targetHex);
        const dist = Hex.distance(gameState.player, targetHex);
        
        if (targetEntity && dist === 1) {
            gameState.turnState = "PLAYER_ACT";
            
            // Animation: bump
            gameState.player.pixelPos = Hex.toPixel(Hex.lerp(gameState.player, targetHex, 0.5));
            
            addDelayAnimation(150, () => {
                targetEntity.takeDamage(1); // Kill
                if (targetEntity.isDead) {
                    gameState.score += 10;
                    // Remove dead entity from array immediately? Or filter later?
                    // Better to filter now to update paths
                    gameState.entities = gameState.entities.filter(e => !e.isDead);
                }
                endPlayerTurn();
            });
        }
    }
}

function endPlayerTurn() {
    gameState.turnState = "ENEMY_ACT";
    updateEnemyLogic();
}

function updateEnemyLogic() {
    // Process each enemy
    const enemies = gameState.entities.filter(e => e !== gameState.player && !e.isDead);
    
    // 1. Move enemies
    enemies.forEach(enemy => {
        // AI Logic
        // Calculate distance to player
        const dist = Hex.distance(enemy, gameState.player);
        
        // If Melee enemy adjacent, ATTACK (handled in danger check phase, but visually we can bump)
        // If Ranged enemy in line, ATTACK
        
        // Movement:
        // If not attacking, move closer
        let intendedMove = null;
        
        if (enemy.type === 'ENEMY_MELEE') {
            if (dist > 1) {
                // Pathfinding towards player
                // Simple greedy for now: find neighbor closest to player
                const neighbors = Hex.neighbors(enemy);
                let best = null;
                let minDist = dist;
                
                // Shuffle neighbors for variety
                neighbors.sort(() => Math.random() - 0.5);
                
                for (let n of neighbors) {
                    const key = Hex.getKey(n);
                    if (gameState.tiles.has(key) && 
                        gameState.tiles.get(key).type !== 'WALL' &&
                        !getEntityAt(n) && // Avoid stacking
                        !(n.q === gameState.player.q && n.r === gameState.player.r)) { // Don't step on player
                        
                        const d = Hex.distance(n, gameState.player);
                        if (d < minDist) {
                            minDist = d;
                            best = n;
                        }
                    }
                }
                if (best) intendedMove = best;
            }
        } else if (enemy.type === 'ENEMY_RANGED') {
            // Try to maintain range 3-4
            if (dist < 3) {
                // Flee
                const neighbors = Hex.neighbors(enemy);
                let best = null;
                let maxDist = dist;
                for (let n of neighbors) {
                    const key = Hex.getKey(n);
                    if (gameState.tiles.has(key) && gameState.tiles.get(key).type !== 'WALL' && !getEntityAt(n)) {
                        const d = Hex.distance(n, gameState.player);
                        if (d > maxDist) {
                            maxDist = d;
                            best = n;
                        }
                    }
                }
                if (best) intendedMove = best;
            } else if (dist > 5) {
                // Approach like melee
                // (Simplified logic same as melee code above)
                // ...
            }
        }
        
        if (intendedMove) {
            enemy.q = intendedMove.q;
            enemy.r = intendedMove.r;
        }
    });
    
    // Resolve Attacks (Did player stand in fire?)
    // Re-calculate danger based on NEW positions
    updateDangerMap();
    
    const playerKey = Hex.getKey(gameState.player);
    if (gameState.dangerTiles.has(playerKey)) {
        gameState.player.takeDamage(1);
    }
    
    addDelayAnimation(300, () => {
        if (!gameState.player.isDead) {
            gameState.turnState = "PLAYER_INPUT";
            gameState.turnCount++;
        }
    });
}

export function updateDangerMap() {
    gameState.dangerTiles.clear();
    const enemies = gameState.entities.filter(e => e !== gameState.player && !e.isDead);
    
    enemies.forEach(enemy => {
        const threats = enemy.getThreatenedTiles();
        threats.forEach(t => gameState.dangerTiles.add(t));
    });
}

function addDelayAnimation(duration, onFinish) {
    let timer = 0;
    gameState.animations.push({
        update: (dt) => {
            timer += dt * 1000;
        },
        isFinished: () => timer >= duration,
        render: () => {}, // No visual
        onComplete: onFinish
    });
}

export function isValidMove(targetHex) {
    const dist = Hex.distance(gameState.player, targetHex);
    const tile = gameState.tiles.get(Hex.getKey(targetHex));
    return dist === 1 && tile && tile.type !== 'WALL' && !getEntityAt(targetHex);
}

export function isValidAttack(targetHex) {
    const dist = Hex.distance(gameState.player, targetHex);
    const entity = getEntityAt(targetHex);
    return dist === 1 && entity && !entity.isDead;
}

// A* Pathfinding for Test AI
export function findPath(start, goal) {
    const frontier = [{hex: start, priority: 0}];
    const came_from = new Map();
    const cost_so_far = new Map();
    
    came_from.set(Hex.getKey(start), null);
    cost_so_far.set(Hex.getKey(start), 0);
    
    while(frontier.length > 0) {
        frontier.sort((a,b) => a.priority - b.priority);
        const current = frontier.shift().hex;
        
        if (current.q === goal.q && current.r === goal.r) {
            // Reconstruct path
            const path = [];
            let currKey = Hex.getKey(goal);
            while (currKey !== Hex.getKey(start)) {
                const hex = parseKey(currKey);
                path.push(hex);
                currKey = came_from.get(currKey);
                if(!currKey) break; // Safety
            }
            return path.reverse();
        }
        
        const neighbors = Hex.neighbors(current);
        for(let next of neighbors) {
            const nextKey = Hex.getKey(next);
            const tile = gameState.tiles.get(nextKey);
            
            // Allow passing through entities for path calculation, but add huge cost?
            // Actually, for pure movement path, avoid walls. 
            // Avoid entities if they block.
            const entity = getEntityAt(next);
            const isBlocked = tile && (tile.type === 'WALL' || (entity && entity !== gameState.player));
            
            if (tile && !isBlocked) {
                const new_cost = cost_so_far.get(Hex.getKey(current)) + 1; // weight 1
                if (!cost_so_far.has(nextKey) || new_cost < cost_so_far.get(nextKey)) {
                    cost_so_far.set(nextKey, new_cost);
                    const priority = new_cost + Hex.distance(next, goal);
                    frontier.push({hex: next, priority});
                    came_from.set(nextKey, Hex.getKey(current));
                }
            }
        }
    }
    return [];
}

function parseKey(key) {
    const parts = key.split(',');
    return new Hex(parseInt(parts[0]), parseInt(parts[1]));
}