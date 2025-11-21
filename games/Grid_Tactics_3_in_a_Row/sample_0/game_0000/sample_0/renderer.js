// renderer.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, CELL_EMPTY, CELL_X, CELL_O } from './globals.js';

export function renderGame(p) {
  // Clear background
  p.background(30, 30, 40);
  
  if (gameState.gamePhase === "START") {
    renderStartScreen(p);
  } else if (gameState.gamePhase === "LEVEL_SELECT") {
    renderLevelSelect(p);
  } else if (gameState.gamePhase === "INSTRUCTIONS") {
    renderInstructions(p);
  } else if (gameState.gamePhase === "HIGH_SCORES") {
    renderHighScores(p);
  } else if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
    renderGameBoard(p);
    renderUI(p);
    if (gameState.gamePhase === "PAUSED") {
      renderPauseOverlay(p);
    }
  } else if (gameState.gamePhase === "GAME_OVER_WIN" || 
             gameState.gamePhase === "GAME_OVER_LOSE" || 
             gameState.gamePhase === "GAME_OVER_DRAW") {
    renderGameBoard(p);
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(40);
  p.fill(100, 200, 255);
  p.text("GRID TACTICS", CANVAS_WIDTH / 2, 80);
  
  p.textSize(24);
  p.fill(255, 200, 100);
  p.text("3-in-a-Row", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.textSize(14);
  p.fill(200);
  const desc = "Battle the AI to get three marks in a row!\nProgress through 5 challenging levels.";
  p.text(desc, CANVAS_WIDTH / 2, 170);
  
  // Menu options
  const options = ["Start Game", "Instructions", "High Scores"];
  p.textSize(18);
  for (let i = 0; i < options.length; i++) {
    const isSelected = gameState.menuSelection === i;
    p.fill(...(isSelected ? [255, 220, 100] : [180, 180, 180]));
    if (isSelected) {
      p.text("> " + options[i] + " <", CANVAS_WIDTH / 2, 240 + i * 40);
    } else {
      p.text(options[i], CANVAS_WIDTH / 2, 240 + i * 40);
    }
  }
  
  // Controls
  p.textSize(14);
  p.fill(150);
  p.text("Arrow Keys: Navigate | Space/Enter: Select", CANVAS_WIDTH / 2, 360);
}

function renderLevelSelect(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  p.textSize(32);
  p.fill(100, 200, 255);
  p.text("SELECT LEVEL", CANVAS_WIDTH / 2, 60);
  
  const levels = [
    { name: "Level 1: Novice (3x3)", level: 1 },
    { name: "Level 2: Apprentice (6x6)", level: 2 },
    { name: "Level 3: Journeyman (9x9)", level: 3 },
    { name: "Level 4: Master (11x11)", level: 4 },
    { name: "Level 5: Grandmaster (3x3)", level: 5 }
  ];
  
  p.textSize(16);
  for (let i = 0; i < levels.length; i++) {
    const isUnlocked = i < gameState.unlockedLevels;
    const isSelected = gameState.menuSelection === i;
    
    if (!isUnlocked) {
      p.fill(80, 80, 80);
      p.text("🔒 " + levels[i].name, CANVAS_WIDTH / 2, 120 + i * 45);
    } else {
      p.fill(...(isSelected ? [255, 220, 100] : [200, 200, 200]));
      const prefix = isSelected ? "> " : "";
      const suffix = isSelected ? " <" : "";
      p.text(prefix + levels[i].name + suffix, CANVAS_WIDTH / 2, 120 + i * 45);
    }
  }
  
  p.textSize(14);
  p.fill(150);
  p.text("Arrow Keys: Navigate | Space/Enter: Select | R: Menu", CANVAS_WIDTH / 2, 360);
}

function renderInstructions(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  p.textSize(32);
  p.fill(100, 200, 255);
  p.text("HOW TO PLAY", CANVAS_WIDTH / 2, 50);
  
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.fill(200);
  
  const instructions = [
    "• Get 3 marks (X) in a row to win",
    "• Rows can be horizontal, vertical, or diagonal",
    "• Use Arrow Keys to navigate the grid",
    "• Press Space to place your X",
    "• Block the AI from getting 3 O's in a row",
    "• Complete levels to unlock harder challenges",
    "• Earn bonus points for speed and grid size"
  ];
  
  let y = 100;
  for (const line of instructions) {
    p.text(line, 60, y);
    y += 30;
  }
  
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.fill(150);
  p.text("Press Space or ESC to return", CANVAS_WIDTH / 2, 360);
}

function renderHighScores(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  p.textSize(32);
  p.fill(100, 200, 255);
  p.text("HIGH SCORES", CANVAS_WIDTH / 2, 50);
  
  p.textSize(16);
  p.fill(200);
  
  if (gameState.highScores.length === 0) {
    p.text("No high scores yet!", CANVAS_WIDTH / 2, 150);
  } else {
    let y = 120;
    for (let i = 0; i < gameState.highScores.length; i++) {
      const hs = gameState.highScores[i];
      p.textAlign(p.LEFT, p.CENTER);
      p.text(`${i + 1}.`, 80, y);
      p.text(`Level ${hs.level}`, 140, y);
      p.textAlign(p.RIGHT, p.CENTER);
      p.text(`${hs.score} pts`, CANVAS_WIDTH - 80, y);
      y += 40;
    }
  }
  
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.fill(150);
  p.text("Press Space or ESC to return", CANVAS_WIDTH / 2, 360);
}

function renderGameBoard(p) {
  const cellSize = getCellSize();
  const startX = getStartX();
  const startY = getStartY();
  const size = gameState.currentGridSize;
  
  // Draw grid
  p.stroke(100, 100, 120);
  p.strokeWeight(2);
  p.noFill();
  
  for (let i = 0; i <= size; i++) {
    p.line(startX, startY + i * cellSize, startX + size * cellSize, startY + i * cellSize);
    p.line(startX + i * cellSize, startY, startX + i * cellSize, startY + size * cellSize);
  }
  
  // Highlight selected cell
  if (gameState.gamePhase === "PLAYING" && gameState.currentPlayer === 1) {
    p.fill(255, 255, 0, 80);
    p.noStroke();
    p.rect(
      startX + gameState.selectedCell.col * cellSize,
      startY + gameState.selectedCell.row * cellSize,
      cellSize,
      cellSize
    );
  }
  
  // Draw marks
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const cell = gameState.gameBoard[row][col];
      if (cell !== CELL_EMPTY) {
        const x = startX + col * cellSize + cellSize / 2;
        const y = startY + row * cellSize + cellSize / 2;
        
        // Check if animating
        const anim = gameState.cellAnimations.find(a => a.row === row && a.col === col);
        const scale = anim ? anim.scale : 1;
        
        p.push();
        p.translate(x, y);
        p.scale(scale);
        
        if (cell === CELL_X) {
          drawX(p, 0, 0, cellSize * 0.6);
        } else if (cell === CELL_O) {
          drawO(p, 0, 0, cellSize * 0.6);
        }
        
        p.pop();
      }
    }
  }
  
  // Draw winning line highlight
  if (gameState.lastWinningLine && gameState.winningLineFlash > 0) {
    p.fill(0, 255, 0, gameState.winningLineFlash);
    p.noStroke();
    
    for (const cell of gameState.lastWinningLine) {
      p.rect(
        startX + cell.col * cellSize,
        startY + cell.row * cellSize,
        cellSize,
        cellSize
      );
    }
  }
}

function drawX(p, x, y, size) {
  p.stroke(255, 80, 80);
  p.strokeWeight(4);
  const offset = size / 2;
  p.line(x - offset, y - offset, x + offset, y + offset);
  p.line(x - offset, y + offset, x + offset, y - offset);
}

function drawO(p, x, y, size) {
  p.stroke(80, 150, 255);
  p.strokeWeight(4);
  p.noFill();
  p.circle(x, y, size);
}

function renderUI(p) {
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.fill(255);
  
  // Score
  p.text(`Score: ${gameState.score}`, 20, 20);
  
  // Level
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Level ${gameState.currentLevel}`, CANVAS_WIDTH - 20, 20);
  
  // Current player indicator
  p.textAlign(p.CENTER, p.TOP);
  const turnText = gameState.currentPlayer === 1 ? "Your Turn (X)" : "AI Turn (O)";
  p.fill(...(gameState.currentPlayer === 1 ? [255, 80, 80] : [80, 150, 255]));
  p.text(turnText, CANVAS_WIDTH / 2, 20);
}

function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.textSize(16);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

function renderGameOverScreen(p) {
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Result message
  p.textSize(40);
  if (gameState.gamePhase === "GAME_OVER_WIN") {
    p.fill(100, 255, 100);
    p.text("YOU WIN!", CANVAS_WIDTH / 2, 150);
  } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
    p.fill(255, 100, 100);
    p.text("YOU LOSE!", CANVAS_WIDTH / 2, 150);
  } else {
    p.fill(255, 255, 100);
    p.text("DRAW!", CANVAS_WIDTH / 2, 150);
  }
  
  // Score
  p.textSize(24);
  p.fill(255);
  p.text(`Round Score: +${gameState.roundScore}`, CANVAS_WIDTH / 2, 210);
  p.text(`Total Score: ${gameState.score}`, CANVAS_WIDTH / 2, 245);
  
  // Options
  p.textSize(16);
  p.fill(200);
  p.text("Space: " + (gameState.gamePhase === "GAME_OVER_WIN" && gameState.currentLevel < 5 ? "Next Level" : "Play Again"), CANVAS_WIDTH / 2, 295);
  p.text("Shift: Replay Level", CANVAS_WIDTH / 2, 320);
  p.text("R: Return to Menu", CANVAS_WIDTH / 2, 345);
}

function getCellSize() {
  const boardSize = Math.min(CANVAS_WIDTH * 0.8, CANVAS_HEIGHT * 0.7);
  return boardSize / gameState.currentGridSize;
}

function getStartX() {
  const cellSize = getCellSize();
  const boardSize = cellSize * gameState.currentGridSize;
  return (CANVAS_WIDTH - boardSize) / 2;
}

function getStartY() {
  const cellSize = getCellSize();
  const boardSize = cellSize * gameState.currentGridSize;
  return 60 + (CANVAS_HEIGHT - 60 - boardSize) / 2;
}

export function updateAnimations(p) {
  // Update cell placement animations
  for (let i = gameState.cellAnimations.length - 1; i >= 0; i--) {
    const anim = gameState.cellAnimations[i];
    anim.scale += 0.1;
    if (anim.scale >= anim.targetScale) {
      anim.scale = anim.targetScale;
      gameState.cellAnimations.splice(i, 1);
    }
  }
  
  // Update winning line flash
  if (gameState.lastWinningLine) {
    gameState.winningLineFlash = 100 + Math.sin(p.frameCount * 0.2) * 50;
  }
}