// game_logic.js - Core game logic

import { 
  gameState, 
  PHASE_PLAYING, 
  PHASE_GAME_OVER_WIN, 
  PHASE_GAME_OVER_LOSE,
  ROTATION_SPEED,
  NUM_SEGMENTS,
  GAME_DURATION,
  SPEED_INCREASE_RATE,
  MAX_SPEED,
  MIN_OBSTACLE_SPACING,
  MAX_OBSTACLE_SPACING,
  SEGMENT_ANGLE
} from './globals.js';
import { Obstacle } from './obstacle.js';

export function updateGame(p, deltaTime) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Update game time
  gameState.gameTime += deltaTime;
  
  // Check win condition
  if (gameState.gameTime >= GAME_DURATION) {
    gameState.gamePhase = PHASE_GAME_OVER_WIN;
    p.logs.game_info.push({
      data: { phase: PHASE_GAME_OVER_WIN, score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Update speed based on time
  gameState.speed = Math.min(
    gameState.speed + (SPEED_INCREASE_RATE * deltaTime),
    MAX_SPEED
  );
  
  // Update scroll offset
  gameState.scrollOffset += gameState.speed;
  
  // Handle flip animation
  if (gameState.isFlipping) {
    gameState.flipProgress += 0.15;
    if (gameState.flipProgress >= 1) {
      gameState.isFlipping = false;
      gameState.flipProgress = 0;
      gameState.playerSegment = gameState.flipTargetSegment;
    }
  }
  
  // Use current player segment for collision detection
  const currentPlayerSegment = gameState.isFlipping 
    ? gameState.flipStartSegment // During flip, use original segment for collision
    : gameState.playerSegment;
  
  // Update obstacles
  for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
    const obstacle = gameState.obstacles[i];
    obstacle.update(gameState.speed);
    
    // Check collision using current player segment and tunnel rotation
    if (obstacle.checkCollision(currentPlayerSegment, 0, gameState.tunnelRotation)) {
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { phase: PHASE_GAME_OVER_LOSE, score: gameState.score, reason: 'collision' },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
    
    // Remove passed obstacles and add score
    if (obstacle.isPassed() && !obstacle.scored) {
      obstacle.scored = true;
      gameState.score += 10;
    }
    
    // Remove obstacles that are too far behind
    if (obstacle.z < -100) {
      gameState.obstacles.splice(i, 1);
    }
  }
  
  // Spawn new obstacles
  spawnObstacles(p);
  
  // Log player info periodically
  if (p.frameCount % 10 === 0) {
    const playerPos = gameState.player.getScreenPosition(gameState.tunnelRotation, p);
    p.logs.player_info.push({
      screen_x: playerPos.x,
      screen_y: playerPos.y,
      game_x: currentPlayerSegment,
      game_y: gameState.scrollOffset,
      framecount: p.frameCount
    });
  }
}

function spawnObstacles(p) {
  // Check if we need to spawn new obstacles
  const lastObstacle = gameState.obstacles[gameState.obstacles.length - 1];
  const spawnThreshold = lastObstacle ? lastObstacle.z : 0;
  
  if (spawnThreshold < 500) {
    // Determine spacing based on speed
    const spacing = MIN_OBSTACLE_SPACING + (MAX_OBSTACLE_SPACING - MIN_OBSTACLE_SPACING) * (1 - gameState.speed / MAX_SPEED);
    const newZ = spawnThreshold + spacing + p.random(20, 50);
    
    // Choose segments to place obstacles
    const numObstacles = Math.floor(p.random(2, 5)); // 2-4 obstacles per wave
    const availableSegments = [];
    for (let i = 0; i < NUM_SEGMENTS; i++) {
      availableSegments.push(i);
    }
    
    // Shuffle and pick segments
    for (let i = 0; i < numObstacles; i++) {
      if (availableSegments.length === 0) break;
      const idx = Math.floor(p.random(availableSegments.length));
      const segment = availableSegments.splice(idx, 1)[0];
      
      const obstacle = new Obstacle(segment, newZ, gameState.nextObstacleId++);
      gameState.obstacles.push(obstacle);
      gameState.entities.push(obstacle);
    }
  }
}

export function rotateLeft() {
  gameState.tunnelRotation += ROTATION_SPEED;
  
  // Normalize tunnel rotation to prevent overflow
  while (gameState.tunnelRotation >= Math.PI * 2) {
    gameState.tunnelRotation -= Math.PI * 2;
  }
}

export function rotateRight() {
  gameState.tunnelRotation -= ROTATION_SPEED;
  
  // Normalize tunnel rotation to prevent overflow
  while (gameState.tunnelRotation <= -Math.PI * 2) {
    gameState.tunnelRotation += Math.PI * 2;
  }
}

export function flip() {
  if (gameState.isFlipping) return;
  
  gameState.isFlipping = true;
  gameState.flipProgress = 0;
  gameState.flipStartSegment = gameState.playerSegment;
  gameState.flipTargetSegment = (gameState.playerSegment + NUM_SEGMENTS / 2) % NUM_SEGMENTS;
}