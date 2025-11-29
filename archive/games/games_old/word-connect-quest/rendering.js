// rendering.js - Rendering functions for all game phases

import { gameState, levelData, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { getCurrentLevel, getGridDimensions, getGridCell } from './levelManager.js';

export function renderStartScreen(p) {
  p.background(240, 235, 220);
  
  // Title
  p.fill(60, 40, 20);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("WORD CONNECT QUEST", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.textSize(16);
  p.textStyle(p.NORMAL);
  p.fill(80, 60, 40);
  const desc = "Form words by connecting letters\nto fill the crossword grid!";
  p.text(desc, CANVAS_WIDTH / 2, 140);
  
  // Instructions
  p.textSize(14);
  p.fill(100, 80, 60);
  const instructions = [
    "Arrow Keys: Navigate letters",
    "Space: Select letter",
    "Z: Submit word",
    "ESC: Pause game",
    "R: Restart to menu"
  ];
  let yPos = 200;
  for (let inst of instructions) {
    p.text(inst, CANVAS_WIDTH / 2, yPos);
    yPos += 22;
  }
  
  // High score
  if (gameState.highScore > 0) {
    p.textSize(18);
    p.fill(150, 100, 50);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 330);
  }
  
  // Start prompt
  p.textSize(24);
  p.fill(200, 100, 50);
  const flash = p.frameCount % 60 < 30;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  }
}

export function renderPlayingScreen(p, letterWheel) {
  // Background
  p.background(245, 240, 230);
  
  // Draw crossword grid
  renderCrosswordGrid(p);
  
  // Draw letter wheel
  letterWheel.draw();
  
  // Draw current word
  if (gameState.currentWord.length > 0) {
    p.fill(60, 40, 20);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.textStyle(p.BOLD);
    p.text(gameState.currentWord.join(""), CANVAS_WIDTH / 2, 320);
  }
  
  // Draw feedback message
  if (gameState.feedbackTimer > 0) {
    const alpha = Math.min(255, gameState.feedbackTimer * 4);
    if (gameState.feedbackMessage.includes("INVALID") || gameState.feedbackMessage.includes("ALREADY")) {
      p.fill(200, 50, 50, alpha);
    } else {
      p.fill(50, 150, 50, alpha);
    }
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(18);
    p.textStyle(p.BOLD);
    p.text(gameState.feedbackMessage, CANVAS_WIDTH / 2, 290);
    gameState.feedbackTimer--;
  }
  
  // UI elements
  renderUI(p);
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(100, 100, 100, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    p.textSize(16);
    p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  }
}

function renderCrosswordGrid(p) {
  const level = getCurrentLevel();
  const dims = getGridDimensions();
  const cellSize = 35;
  const gridWidth = dims.width * cellSize;
  const gridHeight = dims.height * cellSize;
  const startX = (CANVAS_WIDTH - gridWidth) / 2;
  const startY = 40;
  
  p.stroke(180, 170, 160);
  p.strokeWeight(1);
  
  for (let y = 0; y < dims.height; y++) {
    for (let x = 0; x < dims.width; x++) {
      const cell = getGridCell(x, y);
      if (cell) {
        const cellX = startX + x * cellSize;
        const cellY = startY + y * cellSize;
        
        if (cell.found) {
          // Found word cell
          p.fill(200, 180, 150);
          p.rect(cellX, cellY, cellSize, cellSize);
          p.fill(60, 40, 20);
          p.noStroke();
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(20);
          p.textStyle(p.BOLD);
          p.text(cell.letter, cellX + cellSize / 2, cellY + cellSize / 2);
          p.stroke(180, 170, 160);
        } else {
          // Empty cell
          p.fill(250, 245, 240);
          p.rect(cellX, cellY, cellSize, cellSize);
        }
      }
    }
  }
}

function renderUI(p) {
  // Score
  p.fill(60, 40, 20);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.textStyle(p.BOLD);
  p.text(`SCORE: ${gameState.score}`, 10, 10);
  
  // Level indicator
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`LEVEL: ${gameState.currentLevelIndex + 1}/${levelData.length}`, CANVAS_WIDTH - 10, 10);
  
  // Timer
  const elapsedTime = Math.floor((Date.now() - gameState.levelStartTime) / 1000);
  p.textAlign(p.CENTER, p.TOP);
  p.text(`TIME: ${elapsedTime}s`, CANVAS_WIDTH / 2, 10);
}

export function renderGameOverScreen(p) {
  p.background(240, 235, 220);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(60, 40, 20);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Score
  p.textSize(24);
  p.fill(100, 80, 60);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  
  if (gameState.highScore > 0) {
    p.textSize(20);
    p.fill(150, 100, 50);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 220);
  }
  
  if (isWin) {
    p.textSize(18);
    p.fill(50, 150, 50);
    p.text("All levels completed!", CANVAS_WIDTH / 2, 260);
  }
  
  // Restart prompt
  p.textSize(20);
  p.fill(200, 100, 50);
  const flash = p.frameCount % 60 < 30;
  if (flash) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
  }
}