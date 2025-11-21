// game_logic.js - Core game logic functions

import { gameState, DIFFICULTY_LEVELS, WIN_SCORE, COMPOSITE_PENALTY, CANVAS_WIDTH, BALL_RADIUS, GAME_DURATION, PHASE_PLAYING, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { NumberBall, PrimeFactorBall } from './entities.js';
import { getCurrentDifficultyLevel, getPrimeFactors, lineIntersectsCircle } from './utils.js';

export function spawnNumberBall(p) {
  const currentDifficulty = getCurrentDifficultyLevel(gameState.score, DIFFICULTY_LEVELS);
  const currentTime = Date.now() / 1000;
  
  if (currentTime - gameState.lastSpawnTime >= currentDifficulty.spawnInterval) {
    gameState.lastSpawnTime = currentTime;
    
    // Generate random number based on difficulty
    const maxNum = currentDifficulty.maxNumber;
    const minNum = 2;
    const number = Math.floor(p.random(minNum, maxNum + 1));
    
    // Random x position
    const x = p.random(BALL_RADIUS * 2, CANVAS_WIDTH - BALL_RADIUS * 2);
    const y = -BALL_RADIUS;
    
    const fallSpeed = 1.5 * currentDifficulty.fallSpeedMultiplier;
    
    const ball = new NumberBall(x, y, number, fallSpeed);
    gameState.entities.push(ball);
  }
}

export function updateEntities() {
  for (let i = gameState.entities.length - 1; i >= 0; i--) {
    const entity = gameState.entities[i];
    
    if (entity.type === 'player') {
      continue; // Player updated separately
    }
    
    entity.update();
    
    // Remove off-screen balls
    if (entity.isOffScreen()) {
      gameState.entities.splice(i, 1);
    }
  }
}

export function tapNumber(p) {
  if (!gameState.player) return;
  
  const playerX = gameState.player.x;
  const playerY = gameState.player.y;
  const playerWidth = gameState.player.width;
  const playerHeight = gameState.player.height;
  
  // Check collision with number balls
  for (let i = gameState.entities.length - 1; i >= 0; i--) {
    const entity = gameState.entities[i];
    
    if ((entity.type === 'numberBall' || entity.type === 'primeFactorBall') && !entity.collected) {
      // Check if ball is near player
      const inRange = p.collideRectCircle(
        playerX - playerWidth / 2,
        playerY - playerHeight / 2,
        playerWidth,
        playerHeight,
        entity.x,
        entity.y,
        entity.radius * 2
      );
      
      if (inRange) {
        if (entity.isPrime) {
          // Collect prime number
          gameState.score += entity.number;
          entity.collected = true;
          gameState.entities.splice(i, 1);
          
          // Log player info
          p.logs.player_info.push({
            screen_x: gameState.player.x,
            screen_y: gameState.player.y,
            game_x: gameState.player.x,
            game_y: gameState.player.y,
            action: 'collected_prime',
            value: entity.number,
            framecount: p.frameCount
          });
          
          return true; // Successfully tapped
        } else {
          // Penalty for tapping composite
          gameState.score = Math.max(0, gameState.score - COMPOSITE_PENALTY);
          entity.collected = true;
          gameState.entities.splice(i, 1);
          
          // Log player info
          p.logs.player_info.push({
            screen_x: gameState.player.x,
            screen_y: gameState.player.y,
            game_x: gameState.player.x,
            game_y: gameState.player.y,
            action: 'tapped_composite_penalty',
            value: -COMPOSITE_PENALTY,
            framecount: p.frameCount
          });
          
          return false; // Penalty applied
        }
      }
    }
  }
  
  return false;
}

export function sliceNumber(p, sliceLine) {
  if (!sliceLine) return false;
  
  const { x1, y1, x2, y2 } = sliceLine;
  
  // Check if slice line intersects any composite number balls
  for (let i = gameState.entities.length - 1; i >= 0; i--) {
    const entity = gameState.entities[i];
    
    if (entity.type === 'numberBall' && !entity.isPrime && !entity.sliced) {
      const intersects = lineIntersectsCircle(x1, y1, x2, y2, entity.x, entity.y, entity.radius);
      
      if (intersects) {
        // Slice the number!
        entity.sliced = true;
        const factors = getPrimeFactors(entity.number);
        
        // Create prime factor balls
        factors.forEach((factor, index) => {
          const angle = (index / factors.length) * Math.PI * 2;
          const offsetX = Math.cos(angle) * 30;
          const offsetY = Math.sin(angle) * 30;
          
          const factorBall = new PrimeFactorBall(
            entity.x + offsetX,
            entity.y + offsetY,
            factor,
            entity.fallSpeed,
            entity.x,
            entity.y
          );
          
          gameState.entities.push(factorBall);
        });
        
        // Remove original ball
        gameState.entities.splice(i, 1);
        
        // Log player info
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          action: 'sliced_composite',
          value: entity.number,
          factors: factors,
          framecount: p.frameCount
        });
        
        return true;
      }
    }
  }
  
  return false;
}

export function updateGameTimer(p) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  const currentTime = Date.now() / 1000;
  const elapsed = currentTime - gameState.gameStartTime;
  gameState.timeRemaining = Math.max(0, GAME_DURATION - elapsed);
  
  // Check win condition
  if (gameState.score >= WIN_SCORE) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_WIN, score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Check lose condition (time up)
  if (gameState.timeRemaining <= 0) {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_LOSE, score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

export function updateDifficultyLevel() {
  const newLevel = getCurrentDifficultyLevel(gameState.score, DIFFICULTY_LEVELS);
  if (newLevel.level !== gameState.currentLevel) {
    gameState.currentLevel = newLevel.level;
  }
}