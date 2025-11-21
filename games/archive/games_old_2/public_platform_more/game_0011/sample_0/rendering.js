// rendering.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, CATEGORIES, gameState } from './globals.js';
import { calculateScore } from './dice.js';

export function drawStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("KNIFFEL", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 200, 220);
  p.textSize(16);
  p.text("Classic Dice Game", CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.fill(220, 220, 240);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "OBJECTIVE:",
    "Score the highest by filling all 13 categories",
    "with strategic dice combinations.",
    "",
    "HOW TO PLAY:",
    "• Roll up to 3 times per turn",
    "• Use UP/DOWN arrows to select dice to hold",
    "• Use LEFT/RIGHT to choose scoring category",
    "• Press Z to confirm category selection",
    "",
    "COMPETE:",
    "Play against AI opponents and aim for victory!"
  ];
  
  let y = 160;
  instructions.forEach(line => {
    p.text(line, 80, y);
    y += 20;
  });
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100 * pulse, 255 * pulse, 100 * pulse);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function drawPausedIndicator(p) {
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function drawGameOver(p) {
  p.background(20, 30, 50);
  
  // Determine result
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 80);
  
  // Winner info
  p.fill(255, 255, 255);
  p.textSize(24);
  if (gameState.winner) {
    p.text(`${gameState.winner} wins!`, CANVAS_WIDTH / 2, 130);
    p.textSize(20);
    p.text(`Score: ${gameState.winnerScore}`, CANVAS_WIDTH / 2, 160);
  }
  
  // Final scores
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Final Scores:", 150, 200);
  
  let y = 230;
  gameState.players.forEach((player, idx) => {
    const isWinner = player.name === gameState.winner;
    p.fill(isWinner ? [255, 215, 0] : [220, 220, 240]);
    p.text(`${player.name}: ${player.totalScore}`, 150, y);
    y += 25;
  });
  
  // Restart prompt
  p.fill(150, 150, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
}

export function drawDice(p) {
  const diceSize = 50;
  const spacing = 10;
  const startX = 50;
  const startY = 250;
  
  for (let i = 0; i < 5; i++) {
    const x = startX + i * (diceSize + spacing);
    const y = startY;
    
    // Highlight if selected
    if (gameState.selectedDiceIndex === i) {
      p.fill(255, 255, 150);
      p.noStroke();
      p.rect(x - 3, y - 3, diceSize + 6, diceSize + 6, 5);
    }
    
    // Die background
    if (gameState.diceHeld[i]) {
      p.fill(100, 200, 100);
    } else {
      p.fill(240, 240, 240);
    }
    p.stroke(50);
    p.strokeWeight(2);
    p.rect(x, y, diceSize, diceSize, 5);
    
    // Draw pips
    p.fill(20);
    p.noStroke();
    drawPips(p, x + diceSize / 2, y + diceSize / 2, gameState.diceValues[i], diceSize * 0.15);
    
    // "HELD" text
    if (gameState.diceHeld[i]) {
      p.fill(0, 100, 0);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(10);
      p.text("HELD", x + diceSize / 2, y + diceSize + 10);
    }
  }
}

function drawPips(p, cx, cy, value, pipRadius) {
  const offset = pipRadius * 1.8;
  
  const positions = {
    1: [[0, 0]],
    2: [[-offset, -offset], [offset, offset]],
    3: [[-offset, -offset], [0, 0], [offset, offset]],
    4: [[-offset, -offset], [offset, -offset], [-offset, offset], [offset, offset]],
    5: [[-offset, -offset], [offset, -offset], [0, 0], [-offset, offset], [offset, offset]],
    6: [[-offset, -offset], [offset, -offset], [-offset, 0], [offset, 0], [-offset, offset], [offset, offset]]
  };
  
  const pips = positions[value] || [];
  pips.forEach(([dx, dy]) => {
    p.circle(cx + dx, cy + dy, pipRadius * 2);
  });
}

export function drawScorecard(p) {
  const x = 360;
  const y = 50;
  const width = 220;
  const rowHeight = 20;
  
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  // Background
  p.fill(240, 240, 250);
  p.stroke(50);
  p.strokeWeight(2);
  p.rect(x, y, width, rowHeight * (CATEGORIES.length + 3), 5);
  
  // Header
  p.fill(60, 80, 120);
  p.noStroke();
  p.rect(x, y, width, rowHeight, 5, 5, 0, 0);
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text("SCORECARD", x + width / 2, y + rowHeight / 2);
  
  // Categories
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(11);
  
  CATEGORIES.forEach((cat, idx) => {
    const rowY = y + rowHeight * (idx + 1);
    
    // Highlight selected
    if (idx === gameState.selectedCategoryIndex && gameState.mustSelectCategory) {
      p.fill(255, 255, 150);
      p.noStroke();
      p.rect(x, rowY, width, rowHeight);
    }
    
    // Category name
    const used = currentPlayer.hasUsedCategory(cat.id);
    p.fill(used ? [150, 150, 150] : [20, 20, 20]);
    p.text(cat.name, x + 5, rowY + rowHeight / 2);
    
    // Score
    p.textAlign(p.RIGHT, p.CENTER);
    if (used) {
      p.fill(60, 100, 60);
      p.text(currentPlayer.scores[cat.id], x + width - 5, rowY + rowHeight / 2);
    } else if (idx === gameState.selectedCategoryIndex && gameState.mustSelectCategory) {
      const potentialScore = calculateScore(cat.id, gameState.diceValues);
      p.fill(100, 100, 200);
      p.text(`[${potentialScore}]`, x + width - 5, rowY + rowHeight / 2);
    }
    
    p.textAlign(p.LEFT, p.CENTER);
  });
  
  // Total
  const totalY = y + rowHeight * (CATEGORIES.length + 2);
  p.fill(60, 80, 120);
  p.noStroke();
  p.rect(x, totalY, width, rowHeight);
  p.fill(255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  p.text("TOTAL", x + 5, totalY + rowHeight / 2);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(currentPlayer.totalScore, x + width - 5, totalY + rowHeight / 2);
}

export function drawGameInfo(p) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  
  // Current player
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Player: ${currentPlayer.name}`, 10, 10);
  
  // Round info
  p.textSize(14);
  p.text(`Round: ${gameState.currentRound + 1}/${gameState.totalRounds}`, 10, 35);
  
  // Rolls left
  p.textSize(14);
  const rollColor = gameState.rollsLeft > 0 ? [100, 255, 100] : [255, 100, 100];
  p.fill(...rollColor);
  p.text(`Rolls Left: ${gameState.rollsLeft}`, 10, 55);
  
  // Instructions
  p.fill(200, 200, 220);
  p.textSize(12);
  
  if (gameState.mustSelectCategory) {
    p.text("SELECT CATEGORY (←→) & CONFIRM (Z)", 10, 330);
  } else if (gameState.rollsLeft > 0) {
    p.text("SPACE: Roll | ↑↓: Select Die", 10, 330);
  } else {
    p.text("SELECT CATEGORY (←→) & CONFIRM (Z)", 10, 330);
  }
}

export function drawPlayingScreen(p) {
  p.background(30, 50, 70);
  
  drawGameInfo(p);
  drawDice(p);
  drawScorecard(p);
  
  // Turn phase indicator
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  if (currentPlayer.isAI) {
    p.fill(255, 200, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text("AI is playing...", CANVAS_WIDTH / 2, 220);
  }
}