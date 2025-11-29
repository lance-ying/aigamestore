// physics.js - Physics and collision handling

import { gameState, SNAKE_BALL_RADIUS, CANVAS_HEIGHT } from './globals.js';

export function updatePhysics(p) {
  // Move snake forward
  const head = gameState.snakeBalls[0];
  if (head) {
    head.targetY += gameState.difficulty * 2;
    
    // Update following balls
    for (let i = 1; i < gameState.snakeBalls.length; i++) {
      const prev = gameState.snakeBalls[i - 1];
      const ball = gameState.snakeBalls[i];
      
      const spacing = SNAKE_BALL_RADIUS * 2.2;
      const dx = prev.x - ball.x;
      const dy = prev.y - ball.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        ball.targetX = prev.x - (dx / distance) * spacing;
        ball.targetY = prev.y - (dy / distance) * spacing;
      }
    }
    
    // Update all balls
    gameState.snakeBalls.forEach(ball => ball.update());
    
    // Update distance score
    gameState.distance = Math.floor(head.y / 10);
    gameState.score = gameState.distance;
  }
}

export function checkCollisions(p) {
  const head = gameState.snakeBalls[0];
  if (!head) return;
  
  // Check collectible collisions
  gameState.collectibles.forEach(collectible => {
    if (!collectible.collected && head.checkCollision(collectible)) {
      collectible.collected = true;
      gameState.snakeLength++;
      
      // Add visual feedback
      p.logs.game_info.push({
        data: { event: 'ball_collected', newLength: gameState.snakeLength },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  });
  
  // Check block collisions
  gameState.blocks.forEach(block => {
    if (!block.destroyed && head.checkBlockCollision(block)) {
      // Reduce snake length
      const damage = Math.min(gameState.snakeLength, block.health);
      gameState.snakeLength -= damage;
      block.takeDamage(damage);
      
      p.logs.game_info.push({
        data: { event: 'block_collision', damage: damage, remainingLength: gameState.snakeLength },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      // Check game over
      if (gameState.snakeLength <= 0) {
        gameState.gamePhase = "GAME_OVER_LOSE";
        p.logs.game_info.push({
          data: { gamePhase: "GAME_OVER_LOSE", finalScore: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  });
  
  // Update snake visual representation
  updateSnakeVisual();
}

export function updateSnakeVisual() {
  const targetLength = gameState.snakeLength;
  const currentLength = gameState.snakeBalls.length;
  
  // Add or remove balls to match target length
  if (currentLength < targetLength) {
    const lastBall = gameState.snakeBalls[currentLength - 1];
    const newBall = new (require('./entities.js').SnakeBall)(lastBall.x, lastBall.y, false);
    gameState.snakeBalls.push(newBall);
  } else if (currentLength > targetLength && targetLength > 0) {
    gameState.snakeBalls.pop();
  }
}

export function cleanupEntities() {
  // Remove off-screen and destroyed entities
  gameState.collectibles = gameState.collectibles.filter(c => !c.collected && c.y < CANVAS_HEIGHT + 50);
  gameState.blocks = gameState.blocks.filter(b => !b.destroyed && b.y < CANVAS_HEIGHT + 50);
  
  // Update remaining entities
  gameState.collectibles.forEach(c => c.update());
  gameState.blocks.forEach(b => b.update());
}