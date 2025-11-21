// game_logic.js - Core game logic

import { 
  gameState, 
  PHASE_PLAYING, 
  PHASE_GAME_OVER_WIN, 
  PHASE_GAME_OVER_LOSE,
  NUM_SEGMENTS,
  GAME_DURATION,
  SPEED_INCREASE_RATE,
  MAX_SPEED,
  MIN_OBSTACLE_SPACING,
  MAX_OBSTACLE_SPACING,
  LANE_SWITCH_COOLDOWN,
  TUNNEL_RADIUS
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
    
    // Check collision - only if not invulnerable
    if (gameState.invulnerableTime <= 0 && obstacle.checkCollision(currentPlayerSegment, 0, 0)) {
      // Hit obstacle - lose a life
      gameState.lives--;
      gameState.invulnerableTime = 1.0; // 1 second of invulnerability
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
  // Move to previous segment (clockwise around the circle)
  if (gameState.laneSwitchCooldown <= 0 && !gameState.isFlipping) {
    gameState.playerSegment = (gameState.playerSegment - 1 + NUM_SEGMENTS) % NUM_SEGMENTS;
    gameState.laneSwitchCooldown = LANE_SWITCH_COOLDOWN;
    
    // Create particle trail effect
    const angle = (gameState.playerSegment * Math.PI * 2) / NUM_SEGMENTS;
    const x = TUNNEL_RADIUS * Math.cos(angle);
    const y = TUNNEL_RADIUS * Math.sin(angle);
    const trailParticles = createTrailParticles(x, y, [100, 200, 255], 10);
    gameState.particles.push(...trailParticles);
  }
}

export function rotateRight() {
  // Move to next segment (counter-clockwise around the circle)
  if (gameState.laneSwitchCooldown <= 0 && !gameState.isFlipping) {
    gameState.playerSegment = (gameState.playerSegment + 1) % NUM_SEGMENTS;
    gameState.laneSwitchCooldown = LANE_SWITCH_COOLDOWN;
    
    // Create particle trail effect
    const angle = (gameState.playerSegment * Math.PI * 2) / NUM_SEGMENTS;
    const x = TUNNEL_RADIUS * Math.cos(angle);
    const y = TUNNEL_RADIUS * Math.sin(angle);
    const trailParticles = createTrailParticles(x, y, [100, 200, 255], 10);
    gameState.particles.push(...trailParticles);
  }
}

export function flip() {
  if (gameState.isFlipping || gameState.laneSwitchCooldown > 0) return;
  
  gameState.isFlipping = true;
  gameState.flipProgress = 0;
  gameState.flipStartSegment = gameState.playerSegment;
  gameState.flipTargetSegment = (gameState.playerSegment + NUM_SEGMENTS / 2) % NUM_SEGMENTS;
  gameState.laneSwitchCooldown = LANE_SWITCH_COOLDOWN * 2; // Longer cooldown for flip
  
  // Create particle burst at start position
  const startAngle = (gameState.flipStartSegment * Math.PI * 2) / NUM_SEGMENTS;
  const x = TUNNEL_RADIUS * Math.cos(startAngle);
  const y = TUNNEL_RADIUS * Math.sin(startAngle);
  const flipParticles = createParticleBurst(x, y, [255, 200, 100], 20);
  gameState.particles.push(...flipParticles);
}