/**
 * logic.js
 * Core game rules: Movement, Attack Resolution, Pushing, Turn Management.
 */

import { gameState, TILE_SIZE, GRID_COLS, GRID_ROWS, MAX_TURNS } from './globals.js';
import { isValidGrid, manhattanDist, shuffleArray } from './utils.js';
import { ParticleSystem } from './particles.js';
import { Vek, Mech } from './entities.js';

// --- Pathfinding ---
export function calculateMoveRange(unit) {
    const moves = [];
    const visited = new Set();
    const queue = [{x: unit.gridX, y: unit.gridY, dist: 0}];
    visited.add(`${unit.gridX},${unit.gridY}`);

    while (queue.length > 0) {
        const current = queue.shift();
        
        if (current.dist >= unit.moveRange) continue;

        const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
        for (const [dx, dy] of dirs) {
            const nx = current.x + dx;
            const ny = current.y + dy;
            
            if (isValidGrid(nx, ny) && !visited.has(`${nx},${ny}`)) {
                // Check if blocked
                const tile = gameState.grid[nx][ny];
                const isBlocked = tile.entity !== null; // Unit or Building or Mountain
                
                if (!isBlocked) {
                    visited.add(`${nx},${ny}`);
                    moves.push({x: nx, y: ny});
                    queue.push({x: nx, y: ny, dist: current.dist + 1});
                }
            }
        }
    }
    return moves;
}

export function calculateAttackTargets(unit) {
    const targets = [];
    const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
    
    // Projectile / Melee logic based on type
    for (const [dx, dy] of dirs) {
        // Melee (Prime)
        if (unit.mechType === 'PRIME' || unit.vekType === 'SCARAB' || unit.vekType === 'FIREFLY') {
            const nx = unit.gridX + dx;
            const ny = unit.gridY + dy;
            if (isValidGrid(nx, ny)) {
                targets.push({x: nx, y: ny, type: 'MELEE'});
            }
        }
        // Ranged (Artillery) - No line of sight needed, lands on specific tile?
        // Let's implement simpler projectile logic: Shoot in line until hit or range limit
        if (unit.mechType === 'TANK' || unit.mechType === 'ARTILLERY' || unit.vekType === 'HORNET') {
            let cx = unit.gridX + dx;
            let cy = unit.gridY + dy;
            while(isValidGrid(cx, cy)) {
                targets.push({x: cx, y: cy, type: 'PROJECTILE'});
                if (gameState.grid[cx][cy].entity !== null && unit.mechType !== 'ARTILLERY') {
                    // Tank shot stops at first obstacle
                    break;
                }
                // Artillery shoots over? Let's say Artillery hits end of line or specific tile.
                // For simplicity, standard line attacks for now.
                cx += dx;
                cy += dy;
            }
        }
    }
    return targets;
}

// --- Action Resolution ---

export function executeAttack(attacker, targetX, targetY) {
    const dx = Math.sign(targetX - attacker.gridX);
    const dy = Math.sign(targetY - attacker.gridY);
    
    // Determine the affected tile based on weapon type
    // Simple logic: If Melee/Tank, hit the first thing in that direction
    // If Artillery, hit the target tile directly (shoots over)
    
    let hitTile = {x: targetX, y: targetY}; // Default
    
    // Logic to find actual impact point for projectiles
    if (attacker.mechType === 'TANK' || attacker.vekType === 'FIREFLY') {
        // Scan from attacker to target, stop at first entity
        let cx = attacker.gridX + dx;
        let cy = attacker.gridY + dy;
        while(isValidGrid(cx, cy)) {
            hitTile = {x: cx, y: cy};
            if (gameState.grid[cx][cy].entity !== null) break;
            if (cx === targetX && cy === targetY) break;
            cx += dx;
            cy += dy;
        }
    }

    // Apply Damage and Push
    const tile = gameState.grid[hitTile.x][hitTile.y];
    ParticleSystem.spawnExplosion(gridToPixel(hitTile.x, hitTile.y).x, gridToPixel(hitTile.x, hitTile.y).y, 15);

    if (tile.entity) {
        const victim = tile.entity;
        
        // Deal Damage
        victim.takeDamage(attacker.damage);
        ParticleSystem.spawnDamageText(victim.pixelX, victim.pixelY, attacker.damage);
        
        // Push (if it's a unit)
        if (victim instanceof Unit || victim.constructor.name === "Unit" || victim.type === "VEK" || victim.type === "MECH") {
            pushUnit(victim, dx, dy);
        }
    } else {
        // Hit empty ground
        ParticleSystem.spawnExplosion(gridToPixel(hitTile.x, hitTile.y).x, gridToPixel(hitTile.x, hitTile.y).y, 5, [200, 200, 200]);
    }
}

export function pushUnit(unit, dx, dy) {
    const nx = unit.gridX + dx;
    const ny = unit.gridY + dy;
    
    if (!isValidGrid(nx, ny)) {
        // Pushed off edge? Bump damage?
        // ITB logic: Just bump damage if edge is treated as wall, or death if water
        // Let's treat edge as wall
        unit.takeDamage(1);
        ParticleSystem.spawnBumpEffect(unit.pixelX, unit.pixelY);
        return;
    }

    const targetTile = gameState.grid[nx][ny];
    
    if (targetTile.entity) {
        // Blocked! Bump damage to both
        unit.takeDamage(1);
        targetTile.entity.takeDamage(1);
        ParticleSystem.spawnBumpEffect(unit.pixelX, unit.pixelY);
        ParticleSystem.spawnBumpEffect(targetTile.entity.pixelX, targetTile.entity.pixelY);
    } else {
        // Move unit
        gameState.grid[unit.gridX][unit.gridY].entity = null;
        unit.gridX = nx;
        unit.gridY = ny;
        targetTile.entity = unit;
        // Animation is handled by unit update loop interpolating pixel pos
    }
}

// --- Enemy AI ---

export function updateEnemyIntents() {
    gameState.entities.forEach(ent => {
        if (ent.type === 'VEK' && !ent.isDead) {
            // Simple AI: Find nearest building or mech
            let targets = [...gameState.buildings, ...gameState.entities.filter(e => e.type === 'MECH')];
            // Filter out dead
            targets = targets.filter(t => !t.isDead);
            
            if (targets.length === 0) return;

            // Find closest
            let closest = targets.reduce((prev, curr) => {
                const dPrev = manhattanDist(ent.gridX, ent.gridY, prev.gridX, prev.gridY);
                const dCurr = manhattanDist(ent.gridX, ent.gridY, curr.gridX, curr.gridY);
                return dCurr < dPrev ? curr : prev;
            });

            // Decide move (if in move phase) - actually move is separate.
            // Here we just set intent based on current position (assumes move happened)
            
            // Determine attack direction towards closest
            let dx = 0, dy = 0;
            const diffX = closest.gridX - ent.gridX;
            const diffY = closest.gridY - ent.gridY;
            
            if (Math.abs(diffX) >= Math.abs(diffY)) {
                dx = Math.sign(diffX);
            } else {
                dy = Math.sign(diffY);
            }
            
            // Set intent
            // Target is the tile immediately in that direction (for melee/projectile origin)
            ent.intent = {
                target: {x: ent.gridX + dx, y: ent.gridY + dy},
                dx: dx,
                dy: dy,
                type: 'ATTACK'
            };
        }
    });
}

export function spawnEnemies(p) {
    const count = 1 + Math.floor(gameState.currentTurn / 2); // 1, 1, 2, 2, 3
    for(let i=0; i<count; i++) {
        // Find empty edge tile? Or random empty tile not near mechs?
        // ITB spawns from ground. Let's spawn on random empty tiles.
        let attempts = 0;
        while(attempts < 50) {
            let x = Math.floor(p.random(GRID_COLS));
            let y = Math.floor(p.random(GRID_ROWS));
            
            if (gameState.grid[x][y].entity === null && gameState.grid[x][y].type !== 'BUILDING') {
                const type = p.random(['SCARAB', 'HORNET', 'FIREFLY']);
                const vek = new Vek(x, y, type);
                gameState.entities.push(vek);
                gameState.grid[x][y].entity = vek;
                ParticleSystem.spawnExplosion(gridToPixel(x,y).x, gridToPixel(x,y).y, 10, [200, 0, 200]);
                break;
            }
            attempts++;
        }
    }
}

export function moveEnemies(p) {
    // Basic AI Move
    gameState.entities.forEach(ent => {
        if (ent.type === 'VEK' && !ent.isDead) {
            // Find target
            let targets = [...gameState.buildings, ...gameState.entities.filter(e => e.type === 'MECH')];
            if (targets.length === 0) return;
            
            // Find closest
            let closest = targets.reduce((prev, curr) => {
                const dPrev = manhattanDist(ent.gridX, ent.gridY, prev.gridX, prev.gridY);
                const dCurr = manhattanDist(ent.gridX, ent.gridY, curr.gridX, curr.gridY);
                return dCurr < dPrev ? curr : prev;
            });
            
            // Ideal position: Adjacent to target (Manhattan dist 1)
            // But within move range
            // Naive approach: Move towards target along one axis until range depleted
            
            let moves = ent.moveRange;
            let cx = ent.gridX;
            let cy = ent.gridY;
            
            // Try to get in line
            // ... (Simple AI: Just move randomly towards target)
            // ITB AI is smart, this is a simplified version
            
            // Simplified: Just calculate attack intent after existing move.
            // Actually implementing pathfinding for AI is heavy. 
            // Let's settle for: Unit stays still if in range, moves closer if not.
            
            const dist = manhattanDist(cx, cy, closest.gridX, closest.gridY);
            if (dist > 1) {
                // Move closer
                // Clean entity from old tile
                gameState.grid[cx][cy].entity = null;
                
                // Try X
                if (closest.gridX !== cx) {
                    const dir = Math.sign(closest.gridX - cx);
                    if (isValidGrid(cx + dir, cy) && gameState.grid[cx+dir][cy].entity === null) {
                        cx += dir;
                        moves--;
                    }
                }
                // Try Y
                if (moves > 0 && closest.gridY !== cy) {
                    const dir = Math.sign(closest.gridY - cy);
                    if (isValidGrid(cx, cy + dir) && gameState.grid[cx][cy+dir].entity === null) {
                        cy += dir;
                        moves--;
                    }
                }
                
                // Set new pos
                ent.gridX = cx;
                ent.gridY = cy;
                gameState.grid[cx][cy].entity = ent;
            }
        }
    });
}