// game_logic.js - Core game logic

import { 
  gameState, 
  PHASE_PLAYING,
  PHASE_LEVEL_COMPLETE,
  PHASE_GAME_OVER_WIN, 
  PHASE_GAME_OVER_LOSE,
  NUM_SEGMENTS,
  LEVEL_DURATION,
  LANE_SWITCH_COOLDOWN,
  TUNNEL_RADIUS,
  LEVELS
} from './globals.js';
import { Obstacle } from './obstacle.js';
import { createParticleBurst, createTrailParticles } from './particle.js';

export function updateGame(p, deltaTime) {
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Update game time
  gameState.gameTime += deltaTime;
  
  // Update lane switch cooldown
  if (gameState.laneSwitchCooldown > 0) {
    gameState.laneSwitchCooldown -= deltaTime;
  }
  
  // Update invulnerability
  if (gameState.invulnerableTime > 0) {
    gameState.invulnerableTime -= deltaTime;
  }
  
  // Update screen shake
  if (gameState.screenShake > 0) {
    gameState.screenShake -= deltaTime * 5;
    if (gameState.screenShake < 0) gameState.screenShake = 0;
  }
  
  // Update hit flash
  if (gameState.hitFlashAlpha > 0) {
    gameState.hitFlashAlpha -= deltaTime * 400;
    if (gameState.hitFlashAlpha < 0) gameState.hitFlashAlpha = 0;
  }
  
  // Update particles
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    gameState.particles[i].update(deltaTime);
    if (gameState.particles[i].isDead()) {
      gameState.particles.splice(i, 1);
    }
  }
  
  // Check level completion
  if (gameState.gameTime >= LEVEL_DURATION) {
    // Level complete!
    if (gameState.currentLevel >= 9) {
      // All levels complete - WIN!
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      gameState.screenShake = 0;
      p.logs.game_info.push({
        data: { phase: PHASE_GAME_OVER_WIN, score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else {
      // Move to next level
      gameState.gamePhase = PHASE_LEVEL_COMPLETE;
      gameState.screenShake = 0;
      p.logs.game_info.push({
        data: { phase: PHASE_LEVEL_COMPLETE, level: gameState.currentLevel },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Update speed based on time and level config
  const config = gameState.levelConfig;
  gameState.speed = Math.min(
    gameState.speed + (config.speedIncreaseRate * deltaTime),
    config.maxSpeed
  );
  
  // Update scroll offset
  gameState.scrollOffset += gameState.speed;
  
  // Handle flip animation - faster now for quick movement
  if (gameState.isFlipping) {
    gameState.flipProgress += 0.35; // Increased from 0.15 to make it faster
    if (gameState.flipProgress >= 1) {
      gameState.isFlipping = false;
      gameState.flipProgress = 0;
      gameState.playerSegment = gameState.flipTargetSegment;
    }
  }
  
  // Handle lane movement animation
  if (gameState.isMovingLane) {
    gameState.laneMoveProgress += 0.25;
    if (gameState.laneMoveProgress >= 1) {
      gameState.isMovingLane = false;
      gameState.laneMoveProgress = 0;
      gameState.playerSegment = gameState.laneMoveTargetSegment;
    }
  }
  
  // Use current player segment for collision detection
  const currentPlayerSegment = gameState.isFlipping 
    ? gameState.flipStartSegment
    : gameState.isMovingLane
    ? gameState.laneMoveStartSegment
    : gameState.playerSegment;
  
  // Update obstacles
  for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
    const obstacle = gameState.obstacles[i];
    obstacle.update(gameState.speed);
    
    // Check collision - only if not invulnerable
    if (gameState.invulnerableTime <= 0 && obstacle.checkCollision(currentPlayerSegment, 0, 0)) {
      // Hit obstacle - lose a life
      gameState.lives--;
      gameState.invulnerableTime = 1.0;
      gameState.screenShake = 1.0;
      gameState.hitFlashAlpha = 200;
      
      // Create hit particle effect
      const angle = (currentPlayerSegment * Math.PI * 2) / NUM_SEGMENTS;
      const hitX = TUNNEL_RADIUS * Math.cos(angle);
      const hitY = TUNNEL_RADIUS * Math.sin(angle);
      const hitParticles = createParticleBurst(hitX, hitY, [255, 100, 100], 25);
      gameState.particles.push(...hitParticles);
      
      // Check if game over
      if (gameState.lives <= 0) {
        gameState.gamePhase = PHASE_GAME_OVER_LOSE;
        gameState.screenShake = 0;
        p.logs.game_info.push({
          data: { phase: PHASE_GAME_OVER_LOSE, score: gameState.score, reason: 'collision' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        return;
      }
      
      // Remove the obstacle that was hit
      gameState.obstacles.splice(i, 1);
      continue;
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
    const playerPos = gameState.player.getScreenPosition(0, p);
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
    const config = gameState.levelConfig;
    
    // Determine spacing based on level config
    const spacing = config.minSpacing + (config.maxSpacing - config.minSpacing) * (1 - gameState.speed / config.maxSpeed);
    const newZ = spawnThreshold + spacing + p.random(20, 50);
    
    // Choose number of obstacles based on level config
    const numObstacles = Math.floor(p.random(config.minObstaclesPerWave, config.maxObstaclesPerWave + 1));
    const availableSegments = [];
    for (let i = 0; i < NUM_SEGMENTS; i++) {
      availableSegments.push(i);
    }
    
    // Shuffle and pick segments
    for (let i = 0; i < numObstacles; i++) {
      if (availableSegments.length === 0) break;
      const idx = Math.floor(p.random(availableSegments.length));
      const segment = availableSegments.splice(idx, 1)[0];
      
      const obstacle = new Obstacle(segment, newZ, gameState.nextObstacleId++, config.obstacleColor);
      gameState.obstacles.push(obstacle);
      gameState.entities.push(obstacle);
    }
  }
}

export function rotateLeft() {
  // Move left (counter-clockwise) - increment segment number
  if (gameState.laneSwitchCooldown <= 0 && !gameState.isFlipping && !gameState.isMovingLane) {
    gameState.isMovingLane = true;
    gameState.laneMoveProgress = 0;
    gameState.laneMoveStartSegment = gameState.playerSegment;
    gameState.laneMoveTargetSegment = (gameState.playerSegment + 1) % NUM_SEGMENTS;
    gameState.laneSwitchCooldown = LANE_SWITCH_COOLDOWN;
    
    // Create particle trail effect
    const angle = (gameState.laneMoveTargetSegment * Math.PI * 2) / NUM_SEGMENTS;
    const x = TUNNEL_RADIUS * Math.cos(angle);
    const y = TUNNEL_RADIUS * Math.sin(angle);
    const trailParticles = createTrailParticles(x, y, [100, 200, 255], 10);
    gameState.particles.push(...trailParticles);
  }
}

export function rotateRight() {
  // Move right (clockwise) - decrement segment number
  if (gameState.laneSwitchCooldown <= 0 && !gameState.isFlipping && !gameState.isMovingLane) {
    gameState.isMovingLane = true;
    gameState.laneMoveProgress = 0;
    gameState.laneMoveStartSegment = gameState.playerSegment;
    gameState.laneMoveTargetSegment = (gameState.playerSegment - 1 + NUM_SEGMENTS) % NUM_SEGMENTS;
    gameState.laneSwitchCooldown = LANE_SWITCH_COOLDOWN;
    
    // Create particle trail effect
    const angle = (gameState.laneMoveTargetSegment * Math.PI * 2) / NUM_SEGMENTS;
    const x = TUNNEL_RADIUS * Math.cos(angle);
    const y = TUNNEL_RADIUS * Math.sin(angle);
    const trailParticles = createTrailParticles(x, y, [100, 200, 255], 10);
    gameState.particles.push(...trailParticles);
  }
}

export function flip() {
  if (gameState.isFlipping || gameState.isMovingLane || gameState.laneSwitchCooldown > 0) return;
  
  gameState.isFlipping = true;
  gameState.flipProgress = 0;
  gameState.flipStartSegment = gameState.playerSegment;
  gameState.flipTargetSegment = (gameState.playerSegment + NUM_SEGMENTS / 2) % NUM_SEGMENTS;
  gameState.laneSwitchCooldown = LANE_SWITCH_COOLDOWN * 1.5; // Reduced cooldown since flip is faster
  
  // Create particle burst at start position
  const startAngle = (gameState.flipStartSegment * Math.PI * 2) / NUM_SEGMENTS;
  const x = TUNNEL_RADIUS * Math.cos(startAngle);
  const y = TUNNEL_RADIUS * Math.sin(startAngle);
  const flipParticles = createParticleBurst(x, y, [255, 200, 100], 20);
  gameState.particles.push(...flipParticles);
}