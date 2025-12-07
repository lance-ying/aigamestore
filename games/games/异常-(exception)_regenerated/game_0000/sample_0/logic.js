/**
 * Core Game Logic: Simulation, Physics, Level Loading
 */
import { gameState, TILE_SIZE, COLORS, COMMANDS, DIR, SIMULATION_SPEED, logGameInfo } from './globals.js';
import { LEVELS, TILES } from './levels.js';
import { Robot, Enemy, Particle } from './entities.js';

export function loadLevel(index) {
    if (index >= LEVELS.length) {
        gameState.gamePhase = "GAME_OVER_WIN";
        return;
    }

    const levelData = LEVELS[index];
    gameState.currentLevelIndex = index;
    gameState.grid = JSON.parse(JSON.stringify(levelData.layout)); // Deep copy
    gameState.enemies = levelData.enemies.map(e => new Enemy(e.x, e.y, e.type));
    gameState.effects = [];
    
    // Reset Units
    gameState.units = levelData.units.map((u, i) => new Robot(i, u.x, u.y, u.dir));
    
    // Reset State
    gameState.isSimulating = false;
    gameState.simulationStep = 0;
    gameState.simulationTickTimer = 0;
    gameState.activeUnitIndex = 0;
    gameState.selectedSlotIndex = 0;
    
    console.log(`Loaded Level ${index + 1}`);
}

export function resetLevel() {
    loadLevel(gameState.currentLevelIndex);
}

export function updateSimulation(p) {
    if (!gameState.isSimulating) return;

    gameState.simulationTickTimer++;

    if (gameState.simulationTickTimer >= SIMULATION_SPEED) {
        gameState.simulationTickTimer = 0;
        executeStep(p);
    }

    // Check Win Condition: All units at goal?
    checkWinCondition(p);
}

function executeStep(p) {
    if (gameState.simulationStep >= 8) {
        // End of commands, simulation ends without win
        stopSimulation();
        return;
    }

    let actionTaken = false;

    // Execute one command for each unit
    gameState.units.forEach(unit => {
        if (unit.isDead) return;

        const cmd = unit.commands[gameState.simulationStep];
        if (cmd !== COMMANDS.EMPTY) {
            actionTaken = true;
            processCommand(unit, cmd, p);
        }
    });

    gameState.simulationStep++;
    
    // If no more commands for anyone, verify state
    if (!actionTaken && gameState.simulationStep < 8) {
        // Continue ticking until max steps or manual stop? 
        // Design choice: continue stepping to allow waits to finish?
        // Actually, if a step was empty, it does nothing.
    }
}

function processCommand(unit, cmd, p) {
    switch (cmd) {
        case COMMANDS.MOVE:
            moveUnit(unit, p);
            break;
        case COMMANDS.TURN_LEFT:
            rotateUnit(unit, -1);
            break;
        case COMMANDS.TURN_RIGHT:
            rotateUnit(unit, 1);
            break;
        case COMMANDS.ATTACK:
            attack(unit, p);
            break;
        case COMMANDS.WAIT:
            // Do nothing
            break;
    }
}

function moveUnit(unit, p) {
    const nextX = unit.gridX + unit.direction.x;
    const nextY = unit.gridY + unit.direction.y;

    // Bounds check
    if (nextY < 0 || nextY >= gameState.grid.length || nextX < 0 || nextX >= gameState.grid[0].length) {
        return; // Hit boundary
    }

    const tile = gameState.grid[nextY][nextX];

    // Wall Collision
    if (tile === TILES.WALL) {
        createEffect(unit.pixelX + unit.direction.x * 20, unit.pixelY + unit.direction.y * 20, [200, 200, 200], 5);
        return; // Blocked
    }

    // Unit Collision (other robots)
    const otherUnit = gameState.units.find(u => u !== unit && u.gridX === nextX && u.gridY === nextY && !u.isDead);
    if (otherUnit) {
        return; // Blocked by unit
    }

    // Move
    unit.gridX = nextX;
    unit.gridY = nextY;

    // Check Hazard
    if (tile === TILES.HAZARD) {
        destroyUnit(unit, p);
    }

    // Check Enemy Collision
    const enemy = gameState.enemies.find(e => e.gridX === nextX && e.gridY === nextY && !e.isDead);
    if (enemy) {
        destroyUnit(unit, p);
    }
}

function rotateUnit(unit, dir) { // dir: -1 left, 1 right
    const dirs = [DIR.UP, DIR.RIGHT, DIR.DOWN, DIR.LEFT];
    let idx = dirs.indexOf(unit.direction);
    idx = (idx + dir + 4) % 4;
    unit.direction = dirs[idx];
}

function attack(unit, p) {
    // Attack tile in front
    const targetX = unit.gridX + unit.direction.x;
    const targetY = unit.gridY + unit.direction.y;
    
    createEffect(unit.pixelX + unit.direction.x * 30, unit.pixelY + unit.direction.y * 30, [255, 50, 50], 10);

    const enemy = gameState.enemies.find(e => e.gridX === targetX && e.gridY === targetY && !e.isDead);
    if (enemy) {
        enemy.isDead = true;
        createEffect(enemy.pixelX, enemy.pixelY, [255, 100, 0], 20);
    }
}

function destroyUnit(unit, p) {
    unit.isDead = true;
    createEffect(unit.pixelX, unit.pixelY, [255, 0, 0], 30);
    
    // Fail immediately
    setTimeout(() => {
        gameState.gamePhase = "GAME_OVER_LOSE";
        logGameInfo(p, { event: "UNIT_DESTROYED", level: gameState.currentLevelIndex });
    }, 500);
}

function createEffect(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        gameState.effects.push(new Particle(x, y, color));
    }
}

function checkWinCondition(p) {
    if (gameState.gamePhase !== "PLAYING") return;

    const livingUnits = gameState.units.filter(u => !u.isDead);
    if (livingUnits.length === 0) return; // All dead, waiting for fail trigger

    const allAtGoal = livingUnits.every(u => {
        const tile = gameState.grid[u.gridY][u.gridX];
        return tile === TILES.GOAL;
    });

    // Also verify all commands executed or idle?
    // Actually, as long as they are all sitting on goals, we win.
    if (allAtGoal) {
        // Small delay
        setTimeout(() => {
            if (gameState.gamePhase === "PLAYING") {
                gameState.currentLevelIndex++;
                if (gameState.currentLevelIndex >= LEVELS.length) {
                    gameState.gamePhase = "GAME_OVER_WIN";
                } else {
                    loadLevel(gameState.currentLevelIndex);
                }
            }
        }, 1000);
    }
}

export function startSimulation() {
    gameState.isSimulating = true;
    gameState.simulationStep = 0;
    gameState.simulationTickTimer = 0;
    
    // Reset unit positions to start for a clean run
    gameState.units.forEach(u => u.reset());
    gameState.enemies.forEach(e => e.isDead = false);
}

export function stopSimulation() {
    gameState.isSimulating = false;
    // Reset units to start positions so player can edit
    gameState.units.forEach(u => u.reset());
    gameState.enemies.forEach(e => e.isDead = false);
}