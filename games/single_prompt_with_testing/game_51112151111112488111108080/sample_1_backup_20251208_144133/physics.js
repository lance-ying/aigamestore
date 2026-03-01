import { gameState, GRID_W, GRID_H, MOVE_DEDUCTION, BASE_LEVEL_SCORE } from './globals.js';
import { parseRules, applyTransforms } from './rules.js';
import { Entity } from './entities.js';
import { Particle } from './particles.js';

export function saveHistory() {
    // Deep clone important state
    const snapshot = {
        // We don't need to save full grid, just entity list usually, but entities link to grid
        entities: gameState.entities.map(e => ({
            id: e.id,
            x: e.x,
            y: e.y,
            type: e.type,
            facing: e.facing,
            dead: e.dead
        })),
        // Add score and moves to snapshot for undo
        currentScore: gameState.currentScore,
        movesTaken: gameState.movesTaken
    };
    gameState.history.push(snapshot);
    if (gameState.history.length > 50) gameState.history.shift();
}

export function restoreHistory() {
    if (gameState.history.length === 0) return;
    
    const snapshot = gameState.history.pop();
    
    // Restore score and moves
    gameState.currentScore = snapshot.currentScore;
    gameState.movesTaken = snapshot.movesTaken;

    // Rebuild state
    gameState.entities = [];
    // Reset Grid
    for (let x = 0; x < GRID_W; x++) {
        gameState.grid[x] = [];
        for (let y = 0; y < GRID_H; y++) {
            gameState.grid[x][y] = [];
        }
    }
    
    // Recreate entities
    snapshot.entities.forEach(data => {
        const ent = new Entity(data.x, data.y, data.type);
        ent.id = data.id;
        ent.facing = data.facing;
        ent.dead = data.dead;
        ent.moveLerpX = data.x * 25; // Reset lerp to snap
        ent.moveLerpY = data.y * 25;
        
        if (!ent.dead) {
            gameState.entities.push(ent);
            if (ent.x >= 0 && ent.x < GRID_W && ent.y >= 0 && ent.y < GRID_H) {
                gameState.grid[ent.x][ent.y].push(ent);
            }
        }
    });
    
    // Re-parse rules
    parseRules();
}

export function handleInput(p, keyCode) {
    if (gameState.moveCooldown > 0) return;
    
    let dx = 0;
    let dy = 0;
    
    // Arrow keys
    if (keyCode === p.LEFT_ARROW) dx = -1;
    if (keyCode === p.RIGHT_ARROW) dx = 1;
    if (keyCode === p.UP_ARROW) dy = -1;
    if (keyCode === p.DOWN_ARROW) dy = 1;
    
    if (dx !== 0 || dy !== 0) {
        saveHistory();
        const success = attemptMove(dx, dy);
        if (success) {
            gameState.moveCooldown = 8; // debounce
            
            // Deduct score for successful move
            gameState.movesTaken++;
            gameState.currentScore = Math.max(0, gameState.currentScore - MOVE_DEDUCTION);
            
            // After move:
            parseRules();
            applyTransforms();
            checkWinCondition();
            checkDestruction();
        } else {
            // Undo save if nothing moved? No, maybe logic ran but failed? 
            // Actually simpler to just keep history.
            // But if nothing moved at all, pop history?
            // Let's keep it simple.
        }
    }
}

function attemptMove(dx, dy) {
    // 1. Identify all YOU entities
    const movers = gameState.entities.filter(e => gameState.isYou.has(e.type));
    
    if (movers.length === 0) return false;
    
    // Update facing
    movers.forEach(e => {
        if (dx === 1) e.facing = 1;
        if (dy === 1) e.facing = 2;
        if (dx === -1) e.facing = 3;
        if (dy === -1) e.facing = 0;
    });
    
    // 2. Determine which can move
    // We need to resolve collisions.
    // Basic Algo: For each mover, check chain.
    
    const moves = []; // List of {entity, tx, ty}
    
    // Sort movers based on direction to handle pushing correctly?
    // Not strictly necessary if we resolve recursively.
    
    const processed = new Set();
    let movedAny = false;
    
    for (const mover of movers) {
        if (processed.has(mover.id)) continue;
        
        if (canMove(mover, dx, dy, [])) {
            doMove(mover, dx, dy, processed);
            movedAny = true;
        }
    }
    
    return movedAny;
}

function canMove(entity, dx, dy, pushStack) {
    const tx = entity.x + dx;
    const ty = entity.y + dy;
    
    // Check bounds
    if (tx < 0 || tx >= GRID_W || ty < 0 || ty >= GRID_H) return false;
    
    // Check obstacles at target
    const obstacles = gameState.grid[tx][ty];
    
    for (const obs of obstacles) {
        // If Stop, return false (unless Push)
        // Order: PUSH overrides STOP usually? In Baba Is You:
        // If it is PUSH, we try to push it.
        // If it is STOP and NOT PUSH, we block.
        // If it is YOU, it acts like PUSH if we walk into it? No, usually 'YOU' moves independently.
        // Simplification:
        
        if (gameState.isStop.has(obs.type) && !gameState.isPush.has(obs.type)) {
            return false;
        }
        
        if (gameState.isPush.has(obs.type)) {
            // Check if this object can be pushed
            if (pushStack.includes(obs.id)) return false; // Loop detection
            pushStack.push(obs.id);
            if (!canMove(obs, dx, dy, pushStack)) {
                return false;
            }
        }
    }
    
    return true;
}

function doMove(entity, dx, dy, processed) {
    if (processed.has(entity.id)) return;
    processed.add(entity.id);
    
    const tx = entity.x + dx;
    const ty = entity.y + dy;
    
    // Recursively move pushed objects first
    const obstacles = gameState.grid[tx][ty];
    for (const obs of obstacles) {
        if (gameState.isPush.has(obs.type)) {
            doMove(obs, dx, dy, processed);
        }
    }
    
    // Move self
    // Remove from old grid cell
    const cell = gameState.grid[entity.x][entity.y];
    const index = cell.indexOf(entity);
    if (index > -1) cell.splice(index, 1);
    
    // Update pos
    entity.x = tx;
    entity.y = ty;
    
    // Add to new grid cell
    gameState.grid[tx][ty].push(entity);
}

function checkDestruction() {
    // Check Sink, Defeat
    const toKill = new Set();
    
    for (let x = 0; x < GRID_W; x++) {
        for (let y = 0; y < GRID_H; y++) {
            const cell = gameState.grid[x][y];
            if (cell.length < 2) continue;
            
            // Check Defeat
            const defeats = cell.filter(e => gameState.isDefeat.has(e.type));
            const yous = cell.filter(e => gameState.isYou.has(e.type));
            
            if (defeats.length > 0 && yous.length > 0) {
                yous.forEach(y => toKill.add(y));
            }
            
            // Check Sink (destroys both)
            const sinks = cell.filter(e => gameState.isSink.has(e.type));
            const others = cell.filter(e => !gameState.isSink.has(e.type));
            
            if (sinks.length > 0 && others.length > 0) {
                // Determine pairs. Simplification: One sink kills one other.
                // Or: All sinks kill all others? 
                // Simple version: Destroy everything in cell if overlap.
                cell.forEach(e => toKill.add(e));
            }
        }
    }
    
    if (toKill.size > 0) {
        toKill.forEach(e => {
            e.dead = true;
            // Remove from grid
            const cell = gameState.grid[e.x][e.y];
            const idx = cell.indexOf(e);
            if (idx > -1) cell.splice(idx, 1);
            
            // Particle effect
            createExplosion(e.x, e.y);
        });
        
        // Remove dead from entities list
        gameState.entities = gameState.entities.filter(e => !e.dead);
    }
}

function checkWinCondition() {
    // Check if any YOU entity overlaps with a WIN entity
    let won = false;
    
    const yous = gameState.entities.filter(e => gameState.isYou.has(e.type));
    
    for (const you of yous) {
        const cell = gameState.grid[you.x][you.y];
        const wins = cell.filter(e => gameState.isWin.has(e.type));
        if (wins.length > 0) {
            won = true;
            break;
        }
    }
    
    if (won) {
        gameState.gamePhase = "GAME_OVER_WIN";
        createWinParticles();
    }
}

function createExplosion(gx, gy) {
    for(let i=0; i<10; i++) {
        const px = gx * 25 + 12.5;
        const py = gy * 25 + 12.5;
        gameState.particles.push(new Particle(px, py, [255, 100, 100]));
    }
}

function createWinParticles() {
    for(let i=0; i<50; i++) {
        gameState.particles.push(new Particle(300, 200, [255, 255, 0]));
    }
}