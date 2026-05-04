// player.js - Player control and snake management
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';
import { SnakeSegment } from './entities.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.velocityX = 0;
    this.speed = 5;
    this.maxSpeed = 8;
  }
  
  update(p) {
    // Apply velocity
    this.x += this.velocityX;
    
    // Friction
    this.velocityX *= 0.85;
    
    // Bounds
    const margin = 20;
    if (this.x < margin) {
      this.x = margin;
      this.velocityX = 0;
    }
    if (this.x > CANVAS_WIDTH - margin) {
      this.x = CANVAS_WIDTH - margin;
      this.velocityX = 0;
    }
  }
  
  moveLeft() {
    this.velocityX = Math.max(this.velocityX - this.speed, -this.maxSpeed);
  }
  
  moveRight() {
    this.velocityX = Math.min(this.velocityX + this.speed, this.maxSpeed);
  }
  
  draw(p) {
    // Player is represented by snake head (first segment)
    // Nothing to draw here as segments handle rendering
  }
}

export function initializeSnake(p) {
  gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
  gameState.snakeSegments = [];
  
  // Create initial segments
  for (let i = 0; i < gameState.snakeLength; i++) {
    const segment = new SnakeSegment(
      gameState.player.x,
      gameState.player.y + i * 10,
      i
    );
    gameState.snakeSegments.push(segment);
  }
}

export function updateSnake(p) {
  if (!gameState.player) return;
  
  gameState.player.update(p);
  
  // Update segments to follow the player
  if (gameState.snakeSegments.length > 0) {
    // Update head
    gameState.snakeSegments[0].update(gameState.player.x, gameState.player.y);
    
    // Update body - each follows the one in front
    for (let i = 1; i < gameState.snakeSegments.length; i++) {
      const prev = gameState.snakeSegments[i - 1];
      gameState.snakeSegments[i].update(prev.x, prev.y);
    }
  }
  
  // Add segments if snake grew
  while (gameState.snakeSegments.length < gameState.snakeLength) {
    const lastSegment = gameState.snakeSegments[gameState.snakeSegments.length - 1];
    const newSegment = new SnakeSegment(
      lastSegment.x,
      lastSegment.y + 10,
      gameState.snakeSegments.length
    );
    gameState.snakeSegments.push(newSegment);
  }
  
  // Update indices
  for (let i = 0; i < gameState.snakeSegments.length; i++) {
    gameState.snakeSegments[i].index = i;
  }
}

export function drawSnake(p) {
  // Draw from tail to head for proper layering
  for (let i = gameState.snakeSegments.length - 1; i >= 0; i--) {
    gameState.snakeSegments[i].draw(p);
  }
  
  // Draw head highlight
  if (gameState.snakeSegments.length > 0) {
    const head = gameState.snakeSegments[0];
    p.push();
    p.noFill();
    p.stroke(255, 255, 100, 200);
    p.strokeWeight(3);
    p.circle(head.x, head.y, head.radius * 2.5);
    p.pop();
  }
}