// controls.js - Input handling and automated testing

import { gameState, CANVAS_WIDTH, LANE_WIDTH, NUM_LANES } from './globals.js';

export function handlePlayerInput(p) {
  const head = gameState.snakeBalls[0];
  if (!head) return;
  
  if (gameState.controlMode === "HUMAN") {
    handleHumanInput(p, head);
  } else if (gameState.controlMode === "TEST_1") {
    handleTest1(p, head);
  } else if (gameState.controlMode === "TEST_2") {
    handleTest2(p, head);
  }
}

function handleHumanInput(p, head) {
  const moveSpeed = 4;
  
  if (p.keyIsDown(37) || p.keyIsDown(65)) { // LEFT or A
    gameState.snakeX -= moveSpeed;
  }
  if (p.keyIsDown(39) || p.keyIsDown(68)) { // RIGHT or D
    gameState.snakeX += moveSpeed;
  }
  
  // Clamp to canvas bounds
  const margin = 30;
  gameState.snakeX = p.constrain(gameState.snakeX, margin, CANVAS_WIDTH - margin);
  head.targetX = gameState.snakeX;
}

function handleTest1(p, head) {
  // Alternate left and right movement
  const cycleTime = 120;
  const phase = Math.floor(p.frameCount / cycleTime) % 2;
  
  const moveSpeed = 3;
  if (phase === 0) {
    gameState.snakeX -= moveSpeed;
  } else {
    gameState.snakeX += moveSpeed;
  }
  
  const margin = 30;
  gameState.snakeX = p.constrain(gameState.snakeX, margin, CANVAS_WIDTH - margin);
  head.targetX = gameState.snakeX;
}

function handleTest2(p, head) {
  // Advanced AI: collect balls and avoid high blocks
  const moveSpeed = 5;
  
  // Find nearest collectible
  let nearestBall = null;
  let minDistance = Infinity;
  
  gameState.collectibles.forEach(ball => {
    if (!ball.collected && ball.y > head.y - 200 && ball.y < head.y + 200) {
      const distance = Math.abs(ball.x - head.x) + Math.abs(ball.y - head.y);
      if (distance < minDistance) {
        minDistance = distance;
        nearestBall = ball;
      }
    }
  });
  
  // Find threatening blocks
  let dangerBlock = null;
  let minBlockDistance = Infinity;
  
  gameState.blocks.forEach(block => {
    if (!block.destroyed && block.y > head.y - 100 && block.y < head.y + 100) {
      if (block.health > gameState.snakeLength * 0.5) {
        const distance = Math.abs(block.x - head.x) + Math.abs(block.y - head.y);
        if (distance < minBlockDistance) {
          minBlockDistance = distance;
          dangerBlock = block;
        }
      }
    }
  });
  
  // Decision making
  if (dangerBlock && minBlockDistance < 80) {
    // Avoid dangerous block
    if (dangerBlock.x > head.x) {
      gameState.snakeX -= moveSpeed;
    } else {
      gameState.snakeX += moveSpeed;
    }
  } else if (nearestBall && minDistance < 300) {
    // Move toward ball
    if (nearestBall.x > head.x + 5) {
      gameState.snakeX += moveSpeed;
    } else if (nearestBall.x < head.x - 5) {
      gameState.snakeX -= moveSpeed;
    }
  } else {
    // Default: slight random movement
    if (p.frameCount % 60 < 30) {
      gameState.snakeX += moveSpeed * 0.5;
    } else {
      gameState.snakeX -= moveSpeed * 0.5;
    }
  }
  
  const margin = 30;
  gameState.snakeX = p.constrain(gameState.snakeX, margin, CANVAS_WIDTH - margin);
  head.targetX = gameState.snakeX;
}