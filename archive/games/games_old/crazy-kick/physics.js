// physics.js - Physics and collision functions

import { gameState, BALL_RADIUS, OPPONENT_RADIUS } from './globals.js';

export function updatePhysics(p) {
  if (gameState.player) {
    gameState.player.update();
  }
  
  for (const opponent of gameState.opponents) {
    opponent.update(gameState.player);
  }
  
  for (const obstacle of gameState.obstacles) {
    obstacle.update();
  }
  
  checkCollisions(p);
}

export function checkCollisions(p) {
  if (!gameState.player) return;
  
  const ball = gameState.player;
  
  // Ball-Opponent collisions
  for (const opponent of gameState.opponents) {
    const dist = p.dist(ball.x, ball.y, opponent.x, opponent.y);
    if (dist < ball.radius + opponent.radius) {
      handleBallOpponentCollision(ball, opponent, p);
    }
  }
  
  // Ball-Obstacle collisions
  for (const obstacle of gameState.obstacles) {
    if (obstacle.collidesWith(ball)) {
      handleBallObstacleCollision(ball, obstacle);
    }
  }
  
  // Ball-Goal collision
  if (gameState.goal && gameState.goal.collidesWith(ball)) {
    handleGoalScored();
  }
}

function handleBallOpponentCollision(ball, opponent, p) {
  // Only register if not already in collision this frame
  if (!opponent.hasCollided) {
    opponent.markCollision();
    
    // Reduce tackles
    gameState.tacklesRemaining--;
    
    // Apply bounce effect
    const dx = ball.x - opponent.x;
    const dy = ball.y - opponent.y;
    const dist = p.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;
      ball.vx = nx * 3;
      ball.vy = ny * 3;
    }
    
    // Separate the ball from opponent
    const overlap = (ball.radius + opponent.radius) - dist;
    if (dist > 0) {
      ball.x += (dx / dist) * overlap;
      ball.y += (dy / dist) * overlap;
    }
    
    // Log tackle
    if (p.logs) {
      p.logs.player_info.push({
        event: "tackle",
        tackles_remaining: gameState.tacklesRemaining,
        screen_x: ball.x,
        screen_y: ball.y,
        game_x: ball.x,
        game_y: ball.y,
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

function handleBallObstacleCollision(ball, obstacle) {
  // Simple bounce back
  const overlapX = Math.min(
    Math.abs(ball.x - obstacle.x),
    Math.abs(ball.x - (obstacle.x + obstacle.width))
  );
  const overlapY = Math.min(
    Math.abs(ball.y - obstacle.y),
    Math.abs(ball.y - (obstacle.y + obstacle.height))
  );
  
  if (overlapX < overlapY) {
    ball.vx *= -0.6;
    if (ball.x < obstacle.x + obstacle.width / 2) {
      ball.x = obstacle.x - ball.radius;
    } else {
      ball.x = obstacle.x + obstacle.width + ball.radius;
    }
  } else {
    ball.vy *= -0.6;
    if (ball.y < obstacle.y + obstacle.height / 2) {
      ball.y = obstacle.y - ball.radius;
    } else {
      ball.y = obstacle.y + obstacle.height + ball.radius;
    }
  }
}

function handleGoalScored() {
  const timeBonus = Math.floor(gameState.timeRemaining * 10);
  gameState.score += 1000 + 500 + timeBonus;
  
  if (gameState.currentLevel < 5) {
    gameState.gamePhase = "LEVEL_COMPLETE";
  } else {
    gameState.gamePhase = "GAME_OVER_WIN";
    updateHighScore();
  }
}

function updateHighScore() {
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('crazyKickHighScore', gameState.highScore.toString());
    }
  }
}