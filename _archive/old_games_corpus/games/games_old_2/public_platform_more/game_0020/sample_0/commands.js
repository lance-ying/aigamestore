import { COMMAND_TYPES, DIRECTIONS, gameState } from './globals.js';

export const availableCommands = [
  { type: COMMAND_TYPES.MOVE_FORWARD, label: 'MOVE FORWARD', color: [100, 150, 255] },
  { type: COMMAND_TYPES.TURN_LEFT, label: 'TURN LEFT', color: [255, 200, 100] },
  { type: COMMAND_TYPES.TURN_RIGHT, label: 'TURN RIGHT', color: [255, 150, 100] },
  { type: COMMAND_TYPES.ATTACK, label: 'ATTACK', color: [255, 100, 100] },
  { type: COMMAND_TYPES.WAIT, label: 'WAIT', color: [150, 150, 150] }
];

export function executeCommand(robot, command, obstacles, enemies) {
  if (!robot.isActive) return false;

  switch (command.type) {
    case COMMAND_TYPES.MOVE_FORWARD:
      return executeMoveForward(robot, obstacles);
    case COMMAND_TYPES.TURN_LEFT:
      robot.direction = (robot.direction + 3) % 4;
      return true;
    case COMMAND_TYPES.TURN_RIGHT:
      robot.direction = (robot.direction + 1) % 4;
      return true;
    case COMMAND_TYPES.ATTACK:
      return executeAttack(robot, enemies);
    case COMMAND_TYPES.WAIT:
      return true;
    default:
      return true;
  }
}

function executeMoveForward(robot, obstacles) {
  let newX = robot.gridX;
  let newY = robot.gridY;

  switch (robot.direction) {
    case DIRECTIONS.UP:
      newY -= 1;
      break;
    case DIRECTIONS.RIGHT:
      newX += 1;
      break;
    case DIRECTIONS.DOWN:
      newY += 1;
      break;
    case DIRECTIONS.LEFT:
      newX -= 1;
      break;
  }

  // Check bounds
  if (newX < 0 || newX >= 10 || newY < 0 || newY >= 6) {
    return false;
  }

  // Check obstacles
  for (let obstacle of obstacles) {
    if (obstacle.gridX === newX && obstacle.gridY === newY) {
      return false;
    }
  }

  robot.gridX = newX;
  robot.gridY = newY;
  return true;
}

function executeAttack(robot, enemies) {
  let targetX = robot.gridX;
  let targetY = robot.gridY;

  switch (robot.direction) {
    case DIRECTIONS.UP:
      targetY -= 1;
      break;
    case DIRECTIONS.RIGHT:
      targetX += 1;
      break;
    case DIRECTIONS.DOWN:
      targetY += 1;
      break;
    case DIRECTIONS.LEFT:
      targetX -= 1;
      break;
  }

  // Find enemy at target location
  for (let enemy of enemies) {
    if (enemy.isActive && enemy.gridX === targetX && enemy.gridY === targetY) {
      enemy.takeDamage(1);
      return true;
    }
  }

  return true;
}

export function checkLevelComplete(robots, enemies, exits) {
  // Check if all robots are inactive (failed)
  const allRobotsInactive = robots.every(r => !r.isActive);
  if (allRobotsInactive) {
    return { complete: true, success: false };
  }

  // Check if all enemies are defeated
  const allEnemiesDefeated = enemies.every(e => !e.isActive);
  
  // Check if any robot reached exit (if exits exist)
  let exitReached = false;
  if (exits.length > 0) {
    for (let robot of robots) {
      if (!robot.isActive) continue;
      for (let exit of exits) {
        if (robot.gridX === exit.gridX && robot.gridY === exit.gridY) {
          exitReached = true;
          exit.reached = true;
        }
      }
    }
  }

  // Win conditions
  if (exits.length > 0) {
    if (exitReached) {
      return { complete: true, success: true };
    }
  } else {
    if (allEnemiesDefeated) {
      return { complete: true, success: true };
    }
  }

  return { complete: false, success: false };
}