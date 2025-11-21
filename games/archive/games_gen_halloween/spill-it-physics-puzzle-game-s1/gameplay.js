// gameplay.js - Core gameplay logic

import { 
  gameState, 
  BALL_SKINS,
  BALL_RADIUS,
  DROP_ZONE_Y,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE
} from './globals.js';

import { Ball } from './entities.js';
import { checkLevelComplete, checkLevelFailed } from './level.js';

export function dropBall(p) {
  if (gameState.ballsRemaining <= 0) return;
  
  const skin = BALL_SKINS[gameState.selectedSkinIndex];
  const ball = new Ball(p, gameState.dropX, DROP_ZONE_Y, skin.color);
  
  gameState.balls.push(ball);
  gameState.entities.push(ball);
  gameState.ballsRemaining--;
  
  // Log player action
  p.logs.player_info.push({
    screen_x: gameState.dropX,
    screen_y: DROP_ZONE_Y,
    game_x: gameState.dropX,
    game_y: DROP_ZONE_Y,
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateGameplay(p) {
  // Update all entities
  gameState.entities.forEach(entity => {
    if (entity.update) {
      entity.update();
    }
  });
  
  // Check win/lose conditions
  if (checkLevelComplete()) {
    handleLevelComplete(p);
  } else if (checkLevelFailed()) {
    handleLevelFailed(p);
  }
}

function handleLevelComplete(p) {
  gameState.gamePhase = PHASE_GAME_OVER_WIN;
  gameState.levelsCompleted = Math.max(gameState.levelsCompleted, gameState.currentLevel + 1);
  
  p.logs.game_info.push({
    data: { 
      gamePhase: PHASE_GAME_OVER_WIN,
      level: gameState.currentLevel,
      glassesKnockedOver: gameState.glassesKnockedOver,
      totalGlasses: gameState.totalGlasses
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function handleLevelFailed(p) {
  gameState.gamePhase = PHASE_GAME_OVER_LOSE;
  
  p.logs.game_info.push({
    data: { 
      gamePhase: PHASE_GAME_OVER_LOSE,
      level: gameState.currentLevel,
      glassesKnockedOver: gameState.glassesKnockedOver,
      totalGlasses: gameState.totalGlasses
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function handleTestMode(p) {
  if (gameState.controlMode === "TEST_1") {
    // Drop balls at intervals across the screen
    gameState.testBallDropTimer++;
    if (gameState.testBallDropTimer >= 30 && gameState.ballsRemaining > 0) {
      const positions = [150, 300, 450];
      if (gameState.testBallsDropped < positions.length) {
        gameState.dropX = positions[gameState.testBallsDropped];
        dropBall(p);
        gameState.testBallsDropped++;
        gameState.testBallDropTimer = 0;
      }
    }
  } else if (gameState.controlMode === "TEST_2") {
    // Optimal drops to win
    gameState.testBallDropTimer++;
    if (gameState.testBallDropTimer >= 30 && gameState.ballsRemaining > 0) {
      // Calculate center of glass clusters
      if (gameState.glasses.length > 0) {
        const glassPositions = gameState.glasses.map(g => g.body.position.x);
        const targetX = glassPositions[Math.floor(glassPositions.length / 2)];
        gameState.dropX = targetX;
        dropBall(p);
        gameState.testBallDropTimer = 0;
      }
    }
  }
}