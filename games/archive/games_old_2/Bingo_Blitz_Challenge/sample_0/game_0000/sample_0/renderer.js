// renderer.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, LEVEL_CONFIG } from './globals.js';
import { getSquareKey } from './bingoCard.js';
import { getNumberPrefix } from './numberCaller.js';

export function renderGame(p) {
  p.background(20, 25, 35);
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderPlaying(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderPlaying(p);
    renderPauseOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOver(p);
  }
}

function renderStartScreen(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(40);
  p.fill(255, 200, 50);
  p.text('BINGO BLITZ', CANVAS_WIDTH / 2, 60);
  p.text('CHALLENGE', CANVAS_WIDTH / 2, 100);
  
  // Description
  p.textSize(14);
  p.fill(200, 220, 255);
  p.text('Mark numbers as they\'re called to achieve BINGO!', CANVAS_WIDTH / 2, 150);
  p.text('5 in a row: horizontal, vertical, diagonal, or 4 corners', CANVAS_WIDTH / 2, 170);
  p.text('Complete each level by reaching the target score in 3 minutes', CANVAS_WIDTH / 2, 190);
  
  // Controls
  p.textSize(12);
  p.fill(180, 200, 220);
  p.textAlign(p.LEFT, p.CENTER);
  const controlsX = 150;
  let y = 230;
  p.text('Arrow Keys: Navigate card squares', controlsX, y);
  y += 20;
  p.text('SPACE: Mark selected square / Instant Mark Booster', controlsX, y);
  y += 20;
  p.text('SHIFT: Score Multiplier Booster (2x for 5 sec)', controlsX, y);
  y += 20;
  p.text('Z: Free Mark Booster (mark any square)', controlsX, y);
  y += 20;
  p.text('ESC: Pause/Unpause', controlsX, y);
  y += 20;
  p.text('R: Restart to start screen', controlsX, y);
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.fill(100, 255, 100);
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100 * pulse, 255 * pulse, 100 * pulse);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 360);
}

function renderPlaying(p) {
  // UI elements
  renderScore(p);
  renderTime(p);
  renderLevel(p);
  renderCalledNumber(p);
  renderBingoCard(p);
  renderBoosterMeter(p);
  renderBoosters(p);
  
  // Visual effects
  if (gameState.boosters.scoreMultiplier.active) {
    renderScoreMultiplierEffect(p);
  }
}

function renderScore(p) {
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.fill(255, 220, 100);
  p.text(`SCORE: ${gameState.score}`, 10, 10);
}

function renderTime(p) {
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  const minutes = Math.floor(gameState.timeRemaining / 60);
  const seconds = Math.floor(gameState.timeRemaining % 60);
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  p.fill(gameState.timeRemaining < 30 ? p.color(255, 100, 100) : p.color(150, 200, 255));
  p.text(`TIME: ${timeStr}`, CANVAS_WIDTH - 10, 10);
}

function renderLevel(p) {
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.fill(200, 150, 255);
  const config = LEVEL_CONFIG[gameState.level - 1];
  p.text(`LEVEL ${gameState.level} | Target: ${config.targetScore}`, CANVAS_WIDTH / 2, 35);
}

function renderCalledNumber(p) {
  if (!gameState.currentCalledNumber) return;
  
  p.textAlign(p.CENTER, p.CENTER);
  
  const prefix = getNumberPrefix(gameState.currentCalledNumber);
  const displayText = `${prefix}-${gameState.currentCalledNumber}`;
  
  // Background circle
  const pulse = p.sin(p.frameCount * 0.15) * 5 + 50;
  
  if (gameState.luckyNumber === gameState.currentCalledNumber) {
    p.fill(255, 220, 50, 150);
    p.noStroke();
    p.ellipse(CANVAS_WIDTH / 2, 75, pulse + 5, pulse + 5);
  } else if (gameState.penaltyNumber === gameState.currentCalledNumber) {
    p.fill(255, 50, 50, 150);
    p.noStroke();
    p.ellipse(CANVAS_WIDTH / 2, 75, pulse + 5, pulse + 5);
  }
  
  // Number
  p.textSize(32);
  if (gameState.luckyNumber === gameState.currentCalledNumber) {
    p.fill(255, 220, 0);
  } else if (gameState.penaltyNumber === gameState.currentCalledNumber) {
    p.fill(255, 50, 50);
  } else {
    p.fill(255, 255, 255);
  }
  p.text(displayText, CANVAS_WIDTH / 2, 75);
}

function renderBingoCard(p) {
  const cardSize = 250;
  const cellSize = cardSize / 5;
  const cardX = (CANVAS_WIDTH - cardSize) / 2;
  const cardY = 110;
  
  // Header
  const headers = ['B', 'I', 'N', 'G', 'O'];
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  for (let i = 0; i < 5; i++) {
    p.fill(100, 150, 255);
    p.text(headers[i], cardX + i * cellSize + cellSize / 2, cardY - 15);
  }
  
  // Grid
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const x = cardX + col * cellSize;
      const y = cardY + row * cellSize;
      const key = getSquareKey(row, col);
      const isMarked = gameState.markedSquares.has(key);
      const isSelected = row === gameState.selectedRow && col === gameState.selectedCol;
      
      // Cell background
      if (isMarked) {
        p.fill(50, 200, 100);
      } else if (isSelected) {
        p.fill(100, 150, 255, 150);
      } else {
        p.fill(200, 210, 220);
      }
      
      p.stroke(40);
      p.strokeWeight(2);
      p.rect(x, y, cellSize, cellSize);
      
      // Number
      const number = gameState.bingoCard[col][row];
      p.textSize(number === 'FREE' ? 14 : 20);
      p.fill(0);
      p.noStroke();
      p.text(number, x + cellSize / 2, y + cellSize / 2);
      
      // Mark X
      if (isMarked && number !== 'FREE') {
        p.stroke(255);
        p.strokeWeight(3);
        const offset = cellSize * 0.2;
        p.line(x + offset, y + offset, x + cellSize - offset, y + cellSize - offset);
        p.line(x + cellSize - offset, y + offset, x + offset, y + cellSize - offset);
      }
    }
  }
}

function renderBoosterMeter(p) {
  const meterX = 10;
  const meterY = CANVAS_HEIGHT - 50;
  const meterWidth = 150;
  const meterHeight = 20;
  
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(10);
  p.fill(200);
  p.text('BOOSTER METER', meterX, meterY - 15);
  
  // Background
  p.fill(50);
  p.stroke(100);
  p.strokeWeight(2);
  p.rect(meterX, meterY, meterWidth, meterHeight);
  
  // Fill
  const config = LEVEL_CONFIG[gameState.level - 1];
  const fillWidth = (gameState.boosterMeter / config.boosterCharge) * meterWidth;
  p.fill(100, 200, 255);
  p.noStroke();
  p.rect(meterX, meterY, fillWidth, meterHeight);
}

function renderBoosters(p) {
  const boosterX = 10;
  const boosterY = CANVAS_HEIGHT - 25;
  
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(10);
  
  let x = boosterX;
  
  // Instant Mark
  const im = gameState.boosters.instantMark.available;
  p.fill(im ? p.color(100, 255, 100) : p.color(80, 80, 80));
  p.noStroke();
  p.rect(x, boosterY, 45, 18);
  p.fill(0);
  p.text('SPACE', x + 3, boosterY + 9);
  
  x += 50;
  
  // Score Multiplier
  const sm = gameState.boosters.scoreMultiplier.available || gameState.boosters.scoreMultiplier.active;
  p.fill(sm ? p.color(255, 200, 50) : p.color(80, 80, 80));
  p.rect(x, boosterY, 45, 18);
  p.fill(0);
  p.text('SHIFT', x + 3, boosterY + 9);
  
  x += 50;
  
  // Free Mark
  const fm = gameState.boosters.freeMark.available || gameState.boosters.freeMark.active;
  p.fill(fm ? p.color(255, 100, 255) : p.color(80, 80, 80));
  p.rect(x, boosterY, 45, 18);
  p.fill(0);
  p.text('Z', x + 3, boosterY + 9);
  
  // Active indicators
  if (gameState.boosters.scoreMultiplier.active) {
    const timeLeft = Math.max(0, (gameState.boosters.scoreMultiplier.endTime - Date.now()) / 1000);
    p.fill(255, 200, 50);
    p.textSize(9);
    p.text(`2X: ${timeLeft.toFixed(1)}s`, boosterX + 50, boosterY - 8);
  }
  
  if (gameState.boosters.freeMark.active) {
    p.fill(255, 100, 255);
    p.textSize(9);
    p.text('Select square!', boosterX + 100, boosterY - 8);
  }
}

function renderScoreMultiplierEffect(p) {
  p.noFill();
  p.stroke(255, 200, 50, 100);
  p.strokeWeight(3);
  const pulse = p.sin(p.frameCount * 0.2) * 5;
  p.rect(5 + pulse, 5 + pulse, CANVAS_WIDTH - 10 - pulse * 2, CANVAS_HEIGHT - 10 - pulse * 2, 10);
}

function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text('PAUSED', CANVAS_WIDTH - 10, 10);
}

function renderGameOver(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.textSize(48);
  if (isWin) {
    p.fill(100, 255, 100);
    p.text('LEVEL COMPLETE!', CANVAS_WIDTH / 2, 80);
  } else {
    p.fill(255, 100, 100);
    p.text('GAME OVER', CANVAS_WIDTH / 2, 80);
  }
  
  // Stats
  p.textSize(20);
  p.fill(255);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 150);
  p.text(`BINGOs Achieved: ${gameState.bingosAchieved}`, CANVAS_WIDTH / 2, 180);
  p.text(`Level Reached: ${gameState.level}`, CANVAS_WIDTH / 2, 210);
  
  if (!isWin) {
    const config = LEVEL_CONFIG[gameState.level - 1];
    p.textSize(16);
    p.fill(255, 200, 100);
    p.text(`Target Score: ${config.targetScore}`, CANVAS_WIDTH / 2, 240);
  }
  
  // Instructions
  p.textSize(18);
  p.fill(150, 255, 150);
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(150 * pulse, 255 * pulse, 150 * pulse);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 300);
}