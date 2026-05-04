import { gameState, PHASE, GRID_COLS, GRID_ROWS } from './globals.js';
import { loadLevel, getTotalLevels } from './levels.js';

export function updateSimulation(p) {
  if (!gameState.simulation.running) return;

  gameState.simulation.timeElapsed++;

  // Check timeout
  if (gameState.simulation.timeElapsed >= gameState.simulation.maxTime) {
    endSimulation(p, false, "Time limit exceeded");
    return;
  }

  // Update all robots
  let allRobotsFinished = true;
  gameState.robots.forEach(robot => {
    if (robot.alive) {
      const stillExecuting = robot.executeNextCommand(gameState.enemies, GRID_COLS, GRID_ROWS);
      if (stillExecuting) {
        allRobotsFinished = false;
      }
      robot.update(p);
    }
  });

  // Enemies attack robots
  gameState.enemies.forEach(enemy => {
    if (enemy.alive) {
      enemy.attackRobots(gameState.robots);
    }
  });

  // Check if any robot died
  const anyRobotDead = gameState.robots.some(robot => !robot.alive);
  if (anyRobotDead) {
    endSimulation(p, false, "Robot destroyed");
    return;
  }

  // Check win conditions
  const allEnemiesDead = gameState.enemies.every(enemy => !enemy.alive);
  const anyRobotAtExit = gameState.robots.some(robot => 
    robot.alive && robot.gridX === gameState.exit.gridX && robot.gridY === gameState.exit.gridY
  );

  if (allRobotsFinished) {
    if (allEnemiesDead && anyRobotAtExit) {
      advanceLevel(p);
    } else {
      endSimulation(p, false, "Objective not met");
    }
  }
}

function advanceLevel(p) {
  gameState.score += 1000;
  gameState.currentLevel++;
  
  p.logs.game_info.push({
    data: { event: "level_complete", level: gameState.currentLevel - 1, score: gameState.score },
    framecount: p.frameCount,
    timestamp: Date.now()
  });

  if (gameState.currentLevel >= getTotalLevels()) {
    // Game won!
    gameState.gamePhase = PHASE.GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: PHASE.GAME_OVER_WIN, finalScore: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  } else {
    // Load next level
    loadLevel(gameState.currentLevel, gameState);
  }
}

function endSimulation(p, success, reason) {
  gameState.simulation.running = false;
  
  if (!success) {
    gameState.gamePhase = PHASE.GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: PHASE.GAME_OVER_LOSE, reason, score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}