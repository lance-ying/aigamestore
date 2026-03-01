// physics.js - Collision detection and execution logic
import { 
    gameState, GRID_SIZE, DIRECTIONS, COMMANDS, CANVAS_WIDTH, CANVAS_HEIGHT,
    COLORS
} from './globals.js';
import { Particle, Projectile } from './entities.js';

// Check if a grid coordinate is solid wall
export function isWall(x, y) {
    if (y < 0 || y >= gameState.rows || x < 0 || x >= gameState.cols) {
        return true; // Out of bounds is wall
    }
    return gameState.grid[y][x] === 1; // 1 is wall
}

// Check if valid tile for movement (not wall, not enemy)
export function isValidMoveTarget(x, y) {
    if (isWall(x, y)) return false;
    
    // Check enemies
    for (let e of gameState.enemies) {
        if (!e.isDead && e.gridX === x && e.gridY === y) {
            return false; // Blocked by enemy
        }
    }
    return true;
}

// Execute a single step of the robot's program
export function executeStep(p) {
    const robot = gameState.player;
    if (!robot) return;

    // Check if finished
    if (gameState.executionStep >= gameState.programQueue.length) {
        validateEndState();
        return;
    }

    const commandStr = gameState.programQueue[gameState.executionStep];
    gameState.executionStep++;
    
    let actionTaken = "";

    switch (commandStr) {
        case COMMANDS.MOVE:
            const dir = DIRECTIONS[robot.direction];
            const nextX = robot.gridX + dir.x;
            const nextY = robot.gridY + dir.y;
            
            if (isValidMoveTarget(nextX, nextY)) {
                robot.moveForward();
                actionTaken = "MOVED";
            } else {
                // Shake effect on collision
                gameState.shake = 5;
                actionTaken = "BLOCKED";
                // Spawn sparks
                for(let i=0; i<5; i++) {
                    const sparkX = robot.x + dir.x * 15;
                    const sparkY = robot.y + dir.y * 15;
                    gameState.particles.push(new Particle(sparkX/GRID_SIZE - 0.5, sparkY/GRID_SIZE - 0.5, COLORS.GOAL));
                }
            }
            break;
            
        case COMMANDS.TURN_LEFT:
            robot.turnLeft();
            actionTaken = "TURNED LEFT";
            break;
            
        case COMMANDS.TURN_RIGHT:
            robot.turnRight();
            actionTaken = "TURNED RIGHT";
            break;
            
        case COMMANDS.WAIT:
            actionTaken = "WAITING";
            break;
            
        case COMMANDS.ATTACK:
            // Visual feedback
            const atkDir = DIRECTIONS[robot.direction];
            const targetX = robot.gridX + atkDir.x;
            const targetY = robot.gridY + atkDir.y;
            
            // Check for enemy
            let hit = false;
            for (let e of gameState.enemies) {
                if (!e.isDead && e.gridX === targetX && e.gridY === targetY) {
                    e.die(p);
                    hit = true;
                }
            }
            
            // Create projectile visual
            // In a real physics engine we might spawn an object, here we just visualize
            // We can add a temporary visual object to gameState if needed, but particle is enough
            gameState.particles.push(new Particle(
                (robot.x + atkDir.x * 20 - GRID_SIZE/2)/GRID_SIZE, 
                (robot.y + atkDir.y * 20 - GRID_SIZE/2)/GRID_SIZE, 
                COLORS.PLAYER
            ));
            
            actionTaken = hit ? "TARGET DESTROYED" : "MISSED";
            gameState.shake = 3;
            break;
    }
    
    // Log execution
    p.logs.game_info.push({
        event: "EXECUTION_STEP",
        step: gameState.executionStep,
        command: commandStr,
        result: actionTaken,
        framecount: gameState.frameCount,
        timestamp: Date.now()
    });
}

function validateEndState() {
    const robot = gameState.player;
    const tileType = gameState.grid[robot.gridY][robot.gridX];
    
    // 3 is EXIT
    if (tileType === 3) {
        // Check if all enemies defeated (optional objective, but usually good)
        // For this game, reaching exit is primary. 
        // Let's enforce killing blocking enemies implicitly by movement rules.
        levelComplete();
    } else {
        levelFailed("SEQUENCE COMPLETE: DESTINATION NOT REACHED");
    }
}

function levelComplete() {
    gameState.gamePhase = "GAME_OVER_WIN"; // Temporary state before next level
    setTimeout(() => {
        // Check if next level exists
        if (gameState.currentLevelIdx + 1 < 4) { // Hardcoded level count check
            gameState.subPhase = "PROGRAMMING";
            gameState.gamePhase = "PLAYING";
            gameState.currentLevelIdx++;
            // Signal main loop to reload (handled in game.js logic)
            window.dispatchEvent(new CustomEvent("LEVEL_COMPLETE"));
        } else {
            gameState.gamePhase = "GAME_OVER_WIN"; // Final win
        }
    }, 1000);
}

function levelFailed(reason) {
    gameState.subPhase = "PROGRAMMING"; // Just stop execution
    // Reset robot position is handled by R or manually. 
    // But usually in these games, you watch it fail, then press R or it resets.
    // Let's auto-reset for better UX after a delay.
    gameState.player.status = "ERROR";
}