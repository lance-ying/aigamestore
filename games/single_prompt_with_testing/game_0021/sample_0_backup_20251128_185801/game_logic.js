// game_logic.js
import { gameState, DIRECTIONS, TILE_TYPES } from './globals.js';
import { getTileAt, getEntityAt, isPositionFree } from './grid.js';
import { LEVELS } from './levels.js';

export function tryMove(direction) {
  if (gameState.movesRemaining <= 0) return false;
  
  const newX = gameState.player.gridX + direction.x;
  const newY = gameState.player.gridY + direction.y;
  
  gameState.player.setDirection(direction);
  
  // Check if move is valid
  if (getTileAt(gameState.grid, newX, newY) === TILE_TYPES.WALL) {
    return false;
  }
  
  // Check for entities
  const entity = getEntityAt(gameState.entities, newX, newY);
  if (entity) {
    if (entity.type === TILE_TYPES.GOAL) {
      // Reached demon girl!
      gameState.player.setGridPosition(newX, newY);
      gameState.movesRemaining--;
      checkLevelComplete();
      return true;
    } else if (entity.type === TILE_TYPES.SPIKE) {
      // Can walk on spikes but take damage
      gameState.player.setGridPosition(newX, newY);
      gameState.movesRemaining--;
      gameState.player.health--;
      if (gameState.player.health <= 0) {
        gameOver(false);
      }
      return true;
    } else {
      // Blocked by block or skeleton
      return false;
    }
  }
  
  // Valid move
  gameState.player.setGridPosition(newX, newY);
  gameState.movesRemaining--;
  
  if (gameState.movesRemaining <= 0) {
    gameOver(false);
  }
  
  return true;
}

export function tryPush() {
  if (gameState.movesRemaining <= 0) return false;
  
  const dir = gameState.player.direction;
  const pushX = gameState.player.gridX + dir.x;
  const pushY = gameState.player.gridY + dir.y;
  
  // Check if there's something to push
  const entity = getEntityAt(gameState.entities, pushX, pushY);
  if (!entity || entity.type === TILE_TYPES.GOAL) {
    return false;
  }
  
  // Check if we can push to the next position
  const targetX = pushX + dir.x;
  const targetY = pushY + dir.y;
  
  // Spikes can have things pushed onto them
  if (getTileAt(gameState.grid, targetX, targetY) === TILE_TYPES.SPIKE) {
    entity.setGridPosition(targetX, targetY);
    gameState.movesRemaining--;
    return true;
  }
  
  if (!isPositionFree(gameState, targetX, targetY, entity)) {
    return false;
  }
  
  // Push the entity
  entity.setGridPosition(targetX, targetY);
  gameState.movesRemaining--;
  
  if (gameState.movesRemaining <= 0) {
    gameOver(false);
  }
  
  return true;
}

export function checkLevelComplete() {
  // Check if player reached the demon girl
  const demonGirl = gameState.entities.find(e => e.type === TILE_TYPES.GOAL);
  if (demonGirl && gameState.player.gridX === demonGirl.gridX && gameState.player.gridY === demonGirl.gridY) {
    gameState.levelComplete = true;
    gameState.demonsCollected++;
    
    // Bonus points for moves remaining
    gameState.score += gameState.movesRemaining * 10;
    gameState.score += 100; // Level completion bonus
    
    setTimeout(() => {
      nextLevel();
    }, 1000);
  }
}

export function nextLevel() {
  gameState.currentLevel++;
  
  if (gameState.currentLevel >= LEVELS.length) {
    // Won the game!
    gameOver(true);
  } else {
    gameState.levelComplete = false;
    // Level will be loaded in the next frame
  }
}

export function gameOver(won) {
  if (won) {
    gameState.gamePhase = "GAME_OVER_WIN";
  } else {
    gameState.gamePhase = "GAME_OVER_LOSE";
  }
}