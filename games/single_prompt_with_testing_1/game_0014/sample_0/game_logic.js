// game_logic.js - Core game logic

import { gameState, PHASE, ENTITY_TYPE, DIRECTION } from './globals.js';
import { isWalkable, getEntityAt, loadLevel } from './grid.js';

export function movePlayer(direction, p) {
  if (!gameState.player || gameState.gamePhase !== PHASE.PLAYING) {
    return false;
  }

  const newX = gameState.player.gridX + direction.x;
  const newY = gameState.player.gridY + direction.y;

  // Check if move is valid
  if (!isWalkable(gameState.grid, newX, newY)) {
    return false;
  }

  // Check for blocking entities (walls handled above)
  const blockingEntity = getEntityAt(gameState.entities, newX, newY, true);
  if (blockingEntity && 
      (blockingEntity.type === ENTITY_TYPE.WALL || 
       blockingEntity.type === ENTITY_TYPE.GUARD ||
       blockingEntity.type === ENTITY_TYPE.TURRET)) {
    return false;
  }

  // Move player
  gameState.player.gridX = newX;
  gameState.player.gridY = newY;
  gameState.lastPlayerMove = direction;
  
  // Record move history
  gameState.moveHistory.push({ x: newX, y: newY, turn: gameState.turnCount });

  // Log player position
  logPlayerPosition(p);

  // Check if reached exit
  const exitEntity = getEntityAt(gameState.entities, newX, newY);
  if (exitEntity && exitEntity.type === ENTITY_TYPE.EXIT) {
    gameState.exitReached = true;
    winGame(p);
    return true;
  }

  // Process turn
  processTurn(p);
  
  return true;
}

export function waitTurn(p) {
  if (gameState.gamePhase !== PHASE.PLAYING) return;
  
  gameState.lastPlayerMove = DIRECTION.NONE;
  processTurn(p);
}

export function activateInvisibility(p) {
  if (gameState.gamePhase !== PHASE.PLAYING) return;
  
  if (gameState.invisibilityCharges > 0 && !gameState.isInvisible) {
    gameState.invisibilityCharges--;
    gameState.isInvisible = true;
    gameState.invisibilityTurnsLeft = 1;
    
    p.logs.game_info.push({
      data: { event: "invisibility_activated", charges_left: gameState.invisibilityCharges },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function hackNearbyTerminal(p) {
  if (gameState.gamePhase !== PHASE.PLAYING) return;
  
  const player = gameState.player;
  const adjacent = [
    { x: player.gridX - 1, y: player.gridY },
    { x: player.gridX + 1, y: player.gridY },
    { x: player.gridX, y: player.gridY - 1 },
    { x: player.gridX, y: player.gridY + 1 }
  ];

  let hacked = false;
  for (const pos of adjacent) {
    const entity = getEntityAt(gameState.entities, pos.x, pos.y);
    if (entity && entity.type === ENTITY_TYPE.TERMINAL) {
      entity.hack();
      hacked = true;
      
      // Toggle nearby turrets
      gameState.entities.forEach(e => {
        if (e.type === ENTITY_TYPE.TURRET) {
          const dist = Math.abs(e.gridX - entity.gridX) + Math.abs(e.gridY - entity.gridY);
          if (dist <= 3) {
            e.toggle();
          }
        }
      });
      
      p.logs.game_info.push({
        data: { event: "terminal_hacked", terminal_pos: pos },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      break;
    }
  }

  if (hacked) {
    processTurn(p);
  }
}

function processTurn(p) {
  gameState.turnCount++;
  
  // Decrease invisibility
  if (gameState.isInvisible) {
    gameState.invisibilityTurnsLeft--;
    if (gameState.invisibilityTurnsLeft <= 0) {
      gameState.isInvisible = false;
    }
  }

  // Move enemies
  moveEnemies(p);

  // Check detection
  checkDetection(p);
}

function moveEnemies(p) {
  gameState.entities.forEach(entity => {
    if (entity.type === ENTITY_TYPE.GUARD || entity.type === ENTITY_TYPE.DRONE) {
      entity.move(gameState.grid);
    }
  });
}

function checkDetection(p) {
  if (gameState.isInvisible) {
    return; // Cannot be detected while invisible
  }

  const player = gameState.player;
  
  for (const entity of gameState.entities) {
    if (entity.type === ENTITY_TYPE.GUARD || 
        entity.type === ENTITY_TYPE.TURRET || 
        entity.type === ENTITY_TYPE.DRONE) {
      if (entity.canSeePlayer(player, gameState.grid)) {
        gameState.detectedBy = entity;
        loseGame(p);
        return;
      }
    }
  }
}

function winGame(p) {
  gameState.gamePhase = PHASE.GAME_OVER_WIN;
  gameState.score += 1000 + (100 - gameState.turnCount) * 10;
  
  p.logs.game_info.push({
    data: { 
      event: "game_won", 
      phase: gameState.gamePhase,
      turns: gameState.turnCount,
      score: gameState.score
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function loseGame(p) {
  gameState.gamePhase = PHASE.GAME_OVER_LOSE;
  
  p.logs.game_info.push({
    data: { 
      event: "game_lost", 
      phase: gameState.gamePhase,
      detected_by: gameState.detectedBy ? gameState.detectedBy.type : "unknown"
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function logPlayerPosition(p) {
  if (!gameState.player) return;
  
  p.logs.player_info.push({
    screen_x: gameState.player.getScreenX(),
    screen_y: gameState.player.getScreenY(),
    game_x: gameState.player.gridX,
    game_y: gameState.player.gridY,
    framecount: p.frameCount
  });
}

export function initializeGameState(p) {
  const levelData = loadLevel(gameState.level, p);
  gameState.grid = levelData.grid;
  gameState.entities = levelData.entities;
  gameState.player = levelData.player;
  gameState.score = 0;
  gameState.turnCount = 0;
  gameState.invisibilityCharges = 3;
  gameState.isInvisible = false;
  gameState.invisibilityTurnsLeft = 0;
  gameState.detectedBy = null;
  gameState.exitReached = false;
  gameState.lastPlayerMove = null;
  gameState.moveHistory = [];
}