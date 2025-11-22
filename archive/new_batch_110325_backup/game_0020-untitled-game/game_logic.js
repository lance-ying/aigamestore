import { gameState, COMMAND_TYPES } from './globals.js';
import { levels, getLevelCount } from './levels.js';
import { Robot, Enemy, Exit, Obstacle } from './entities.js';
import { executeCommand, checkLevelComplete } from './commands.js';

export function initializeLevel(levelIndex) {
  const level = levels[levelIndex];
  if (!level) return false;
  
  gameState.robots = [];
  gameState.enemies = [];
  gameState.exits = [];
  gameState.obstacles = [];
  gameState.entities = [];
  
  // Create robots
  for (let robotData of level.robots) {
    const robot = new Robot(robotData.x, robotData.y, robotData.dir);
    gameState.robots.push(robot);
    gameState.entities.push(robot);
  }
  
  // Create enemies
  for (let enemyData of level.enemies) {
    const enemy = new Enemy(enemyData.x, enemyData.y, enemyData.type);
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  }
  
  // Create exits
  for (let exitData of level.exits) {
    const exit = new Exit(exitData.x, exitData.y);
    gameState.exits.push(exit);
    gameState.entities.push(exit);
  }
  
  // Create obstacles
  for (let obstacleData of level.obstacles) {
    const obstacle = new Obstacle(obstacleData.x, obstacleData.y);
    gameState.obstacles.push(obstacle);
    gameState.entities.push(obstacle);
  }
  
  // Store level info
  gameState.entities.push({
    objective: level.objective,
    hint: level.hint,
    name: level.name
  });
  
  gameState.currentProgram = [];
  gameState.isExecuting = false;
  gameState.executionStep = 0;
  gameState.currentRobotIndex = 0;
  gameState.levelComplete = false;
  gameState.levelFailed = false;
  
  return true;
}

export function startGame() {
  gameState.score = 0;
  gameState.currentLevel = 0;
  gameState.selectedCommandIndex = 0;
  initializeLevel(0);
  gameState.gamePhase = "PLAYING";
}

export function executeProgram(p) {
  if (gameState.currentProgram.length === 0) return;
  
  gameState.isExecuting = true;
  gameState.executionStep = 0;
  gameState.currentRobotIndex = 0;
  gameState.executionTimer = 0;
}

export function updateExecution(p) {
  if (!gameState.isExecuting) return;
  
  gameState.executionTimer++;
  
  if (gameState.executionTimer < gameState.executionDelay) {
    return;
  }
  
  gameState.executionTimer = 0;
  
  // Check if current robot finished its program
  if (gameState.executionStep >= gameState.currentProgram.length) {
    gameState.currentRobotIndex++;
    gameState.executionStep = 0;
    
    // Check if all robots finished
    if (gameState.currentRobotIndex >= gameState.robots.length) {
      gameState.isExecuting = false;
      
      // Check level completion
      const result = checkLevelComplete(gameState.robots, gameState.enemies, gameState.exits);
      
      if (result.complete) {
        if (result.success) {
          gameState.levelComplete = true;
          gameState.score += 100 * (gameState.currentLevel + 1);
          
          p.logs.game_info.push({
            data: { event: "level_complete", level: gameState.currentLevel },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
          
          // Advance to next level
          gameState.currentLevel++;
          if (gameState.currentLevel >= getLevelCount()) {
            gameState.gamePhase = "GAME_OVER_WIN";
            p.logs.game_info.push({
              data: { event: "game_over", result: "win", score: gameState.score },
              framecount: p.frameCount,
              timestamp: Date.now()
            });
          } else {
            setTimeout(() => {
              initializeLevel(gameState.currentLevel);
              gameState.levelComplete = false;
            }, 1000);
          }
        } else {
          gameState.levelFailed = true;
          gameState.gamePhase = "GAME_OVER_LOSE";
          
          p.logs.game_info.push({
            data: { event: "game_over", result: "lose", score: gameState.score },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
      
      return;
    }
    
    return;
  }
  
  // Execute current command for current robot
  const robot = gameState.robots[gameState.currentRobotIndex];
  if (!robot || !robot.isActive) {
    gameState.currentRobotIndex++;
    gameState.executionStep = 0;
    return;
  }
  
  const command = gameState.currentProgram[gameState.executionStep];
  executeCommand(robot, command, gameState.obstacles, gameState.enemies);
  
  gameState.executionStep++;
  
  // Log player info
  p.logs.player_info.push({
    screen_x: robot.getScreenX(),
    screen_y: robot.getScreenY(),
    game_x: robot.gridX,
    game_y: robot.gridY,
    framecount: p.frameCount
  });
}

export function addCommandToProgram(commandType) {
  if (gameState.isExecuting) return;
  
  gameState.currentProgram.push({ type: commandType });
}

export function removeLastCommand() {
  if (gameState.isExecuting) return;
  if (gameState.currentProgram.length > 0) {
    gameState.currentProgram.pop();
  }
}

export function resetLevel() {
  initializeLevel(gameState.currentLevel);
}