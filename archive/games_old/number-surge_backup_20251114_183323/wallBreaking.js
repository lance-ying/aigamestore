// wallBreaking.js - Wall breaking phase logic

import { gameState, GAME_PHASES } from './globals.js';
import { Wall } from './entities.js';

export function initWallBreakingPhase(p) {
  gameState.walls = [];
  gameState.currentWallIndex = 0;
  
  const levelData = gameState.levelData;
  const wallValues = levelData.walls;
  
  const startX = 300;
  const spacing = 120;
  
  for (let i = 0; i < wallValues.length; i++) {
    const wall = new Wall(p, startX, 200, wallValues[i], i);
    gameState.walls.push(wall);
  }
  
  // Add bonus points for remaining number
  const bonus = Math.floor(gameState.player.value * 0.1);
  gameState.score += bonus;
  
  p.logs.game_info.push({
    data: { 
      phase: "LEVEL_END_WALLS", 
      playerValue: gameState.player.value,
      bonus: bonus,
      wallCount: wallValues.length 
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

export function updateWallBreaking(p) {
  if (gameState.currentWallIndex >= gameState.walls.length) {
    // All walls processed
    if (gameState.currentWallIndex === gameState.walls.length) {
      levelComplete(p);
    }
    return;
  }
  
  const currentWall = gameState.walls[gameState.currentWallIndex];
  
  // Auto-progress wall breaking
  if (gameState.framesSincePhaseChange % 60 === 30) {
    if (gameState.player.value >= currentWall.value) {
      // Break the wall
      currentWall.break();
      gameState.score += 500;
      gameState.currentWallIndex++;
      
      p.logs.game_info.push({
        data: { 
          wallBroken: currentWall.index,
          wallValue: currentWall.value,
          playerValue: gameState.player.value 
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else {
      // Failed to break wall
      gameOver(p, false);
    }
  }
  
  // Update walls
  for (let wall of gameState.walls) {
    wall.update();
  }
}

export function drawWallBreaking(p) {
  p.background(50, 50, 80);
  
  // Draw title
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("WALL BREAKING!", 300, 50);
  
  // Draw player info
  p.textSize(20);
  p.fill(100, 255, 100);
  p.text(`Your Number: ${gameState.player.value}`, 300, 100);
  
  // Position walls
  const visibleWalls = gameState.walls.slice(0, Math.min(5, gameState.walls.length));
  const spacing = 110;
  const startX = 300 - ((visibleWalls.length - 1) * spacing / 2);
  
  for (let i = 0; i < visibleWalls.length; i++) {
    const wall = visibleWalls[i];
    wall.x = startX + i * spacing;
    
    // Highlight current wall
    if (wall.index === gameState.currentWallIndex && !wall.broken) {
      wall.shake();
      
      // Draw indicator
      p.fill(255, 200, 0);
      p.noStroke();
      p.triangle(
        wall.x, wall.y - wall.height / 2 - 30,
        wall.x - 10, wall.y - wall.height / 2 - 15,
        wall.x + 10, wall.y - wall.height / 2 - 15
      );
    } else {
      wall.shakeX = 0;
      wall.shakeY = 0;
    }
    
    wall.draw();
  }
  
  // Draw UI
  drawUI(p);
}

function levelComplete(p) {
  gameState.score += 1000; // Level completion bonus
  
  if (gameState.currentLevel >= 5) {
    // Game complete
    gameState.gamePhase = GAME_PHASES.GAME_WIN;
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
    }
  } else {
    gameState.gamePhase = GAME_PHASES.WIN_LEVEL;
  }
  
  gameState.framesSincePhaseChange = 0;
  
  p.logs.game_info.push({
    data: { 
      phase: gameState.gamePhase,
      level: gameState.currentLevel,
      score: gameState.score 
    },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function gameOver(p, isWin) {
  gameState.gamePhase = GAME_PHASES.GAME_OVER;
  gameState.framesSincePhaseChange = 0;
  
  p.logs.game_info.push({
    data: { phase: "GAME_OVER", win: isWin, finalScore: gameState.score },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function drawUI(p) {
  // Score
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, 590, 10);
  
  // Level
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Level: ${gameState.currentLevel}`, 10, 10);
}