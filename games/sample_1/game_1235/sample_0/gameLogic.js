// gameLogic.js - Core game logic

import { gameState, GAME_TIME_LIMIT, BUBBLE_COLORS } from './globals.js';
import { Bubble } from './bubble.js';
import { Opponent } from './opponent.js';
import { updateBubblePhysics, checkBubbleCollision } from './physics.js';

export function startGame(p, bubbleGrid) {
  gameState.gamePhase = 'PLAYING';
  gameState.score = 0;
  gameState.timeRemaining = GAME_TIME_LIMIT;
  gameState.bubblesCleared = 0;
  gameState.combo = 0;
  gameState.currentLevel = 1;
  gameState.matchStarted = true;
  gameState.aimAngle = -Math.PI / 2;
  
  // Initialize grid
  bubbleGrid.initialize(p, gameState.currentLevel);
  
  // Create new bubbles
  gameState.currentBubble = createRandomBubble(p);
  gameState.nextBubble = createRandomBubble(p);
  
  // Initialize opponents
  gameState.opponents = [
    new Opponent('AIex', 0.7),
    new Opponent('Bubbles', 0.85),
    new Opponent('Poppy', 0.95)
  ];
  
  gameState.entities = bubbleGrid.getAllBubbles();
  
  // Log game start
  p.logs.game_info.push({
    data: { phase: 'PLAYING', level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function createRandomBubble(p) {
  const colorIndex = Math.floor(p.random(BUBBLE_COLORS.length));
  return new Bubble(300, gameState.shooterY, colorIndex);
}

export function updateGame(p, bubbleGrid, deltaTime) {
  if (gameState.gamePhase !== 'PLAYING') return;
  
  // Update timer
  gameState.timeRemaining = Math.max(0, gameState.timeRemaining - deltaTime);
  
  if (gameState.timeRemaining <= 0) {
    endGame(p, bubbleGrid);
    return;
  }
  
  // Update opponents
  const totalBubbles = bubbleGrid.getTotalBubbles() + 20; // Initial count
  const playerProgress = (gameState.bubblesCleared / totalBubbles) * 100;
  
  for (const opp of gameState.opponents) {
    opp.update(deltaTime, totalBubbles, playerProgress);
  }
  
  // Update current bubble if moving
  if (gameState.currentBubble && gameState.currentBubble.isMoving) {
    gameState.currentBubble.update();
    
    const collision = updateBubblePhysics(gameState.currentBubble, p);
    
    if (collision === 'TOP') {
      attachBubbleToGrid(p, gameState.currentBubble, bubbleGrid);
    } else {
      const hitBubble = checkBubbleCollision(
        gameState.currentBubble,
        bubbleGrid.getAllBubbles(),
        p
      );
      
      if (hitBubble) {
        attachBubbleToGrid(p, gameState.currentBubble, bubbleGrid);
      }
    }
  }
  
  // Update bubble animations
  const allBubbles = bubbleGrid.getAllBubbles();
  for (const bubble of allBubbles) {
    bubble.update();
  }
  
  // Remove completed animations
  for (let row = 0; row < bubbleGrid.grid.length; row++) {
    if (!bubbleGrid.grid[row]) continue;
    for (let col = 0; col < bubbleGrid.grid[row].length; col++) {
      const bubble = bubbleGrid.grid[row][col];
      if (bubble && bubble.isAnimationComplete()) {
        bubbleGrid.removeBubble(row, col);
      }
    }
  }
  
  // Check win condition
  if (bubbleGrid.isEmpty()) {
    advanceLevel(p, bubbleGrid);
  }
}

export function attachBubbleToGrid(p, bubble, bubbleGrid) {
  const slot = bubbleGrid.getNearestGridSlot(bubble.x, bubble.y);
  bubbleGrid.addBubble(bubble, slot.row, slot.col);
  
  // Check for matches
  const matches = bubbleGrid.findMatches(slot.row, slot.col, bubble.colorIndex);
  
  if (matches.length >= 3) {
    // Pop matching bubbles
    for (const match of matches) {
      match.bubble.startPopAnimation();
      gameState.bubblesCleared++;
    }
    
    // Score calculation
    const basePoints = 10;
    const matchBonus = (matches.length - 3) * 5;
    gameState.combo++;
    const comboBonus = gameState.combo * 2;
    const points = basePoints + matchBonus + comboBonus;
    gameState.score += points * matches.length;
    
    // Check for floating bubbles
    setTimeout(() => {
      const floating = bubbleGrid.findFloatingBubbles();
      if (floating.length > 0) {
        for (const f of floating) {
          f.bubble.startPopAnimation();
          gameState.bubblesCleared++;
          gameState.score += 15;
        }
      }
    }, 100);
  } else {
    gameState.combo = 0;
  }
  
  // Load next bubble
  gameState.currentBubble = gameState.nextBubble;
  gameState.currentBubble.x = 300;
  gameState.currentBubble.y = gameState.shooterY;
  gameState.currentBubble.isMoving = false;
  gameState.nextBubble = createRandomBubble(p);
  
  gameState.entities = bubbleGrid.getAllBubbles();
}

export function advanceLevel(p, bubbleGrid) {
  gameState.currentLevel++;
  gameState.score += 500; // Level completion bonus
  gameState.combo = 0;
  
  bubbleGrid.initialize(p, gameState.currentLevel);
  gameState.currentBubble = createRandomBubble(p);
  gameState.nextBubble = createRandomBubble(p);
  gameState.entities = bubbleGrid.getAllBubbles();
  
  p.logs.game_info.push({
    data: { event: 'level_complete', level: gameState.currentLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function endGame(p, bubbleGrid) {
  // Calculate final rank
  const scores = [
    { name: 'You', score: gameState.score },
    ...gameState.opponents.map(opp => ({ name: opp.name, score: opp.score }))
  ];
  
  scores.sort((a, b) => b.score - a.score);
  
  gameState.playerRank = scores.findIndex(s => s.name === 'You') + 1;
  
  if (gameState.playerRank <= 3) {
    gameState.gamePhase = 'GAME_OVER_WIN';
  } else {
    gameState.gamePhase = 'GAME_OVER_LOSE';
  }
  
  p.logs.game_info.push({
    data: { 
      phase: gameState.gamePhase,
      rank: gameState.playerRank,
      score: gameState.score
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function shootBubble(p) {
  if (!gameState.currentBubble || gameState.currentBubble.isMoving) return;
  
  const speed = 8;
  const vx = Math.cos(gameState.aimAngle) * speed;
  const vy = Math.sin(gameState.aimAngle) * speed;
  
  gameState.currentBubble.setVelocity(vx, vy);
  
  if (gameState.player) {
    gameState.player.recordShot();
  }
}

export function updateAim(direction, deltaTime) {
  const aimSpeed = 2.0 * deltaTime;
  
  if (direction === 'LEFT') {
    gameState.aimAngle = Math.max(-Math.PI * 0.9, gameState.aimAngle - aimSpeed);
  } else if (direction === 'RIGHT') {
    gameState.aimAngle = Math.min(-Math.PI * 0.1, gameState.aimAngle + aimSpeed);
  }
}