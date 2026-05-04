// rendering.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, 
         PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, PHASE_LEVEL_COMPLETE,
         GEM_RED, GEM_GREEN, GEM_YELLOW, GEM_PURPLE, GEM_CYAN, GEM_ORANGE,
         GEM_BLUE_STAR, GEM_RED_CIRCLE, GEM_OBSTACLE, GEM_EMPTY } from './globals.js';

export function renderGame(p) {
  // Background
  p.background(20, 20, 30);
  
  if (gameState.gamePhase === PHASE_START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === PHASE_PLAYING) {
    renderPlayingScreen(p);
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    renderPlayingScreen(p);
    renderPausedOverlay(p);
  } else if (gameState.gamePhase === PHASE_LEVEL_COMPLETE) {
    renderLevelCompleteScreen(p);
  } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("GEM DUEL TACTICS", CANVAS_WIDTH / 2, 60);
  
  p.textSize(16);
  p.fill(200, 200, 220);
  p.text("A Turn-Based Match-3 Battle", CANVAS_WIDTH / 2, 100);
  
  p.textSize(14);
  p.fill(180, 180, 200);
  const instructions = [
    "Match 3 or more gems to score points!",
    "Arrow Keys: Move cursor",
    "Space: Select and swap gems",
    "Shift: Use your Booster when charged",
    "",
    "Match Blue Stars to charge your Booster",
    "Outscore the AI within the turn limit to win!",
    "Complete all 4 levels to become a Gem Master!"
  ];
  
  for (let i = 0; i < instructions.length; i++) {
    p.text(instructions[i], CANVAS_WIDTH / 2, 140 + i * 20);
  }
  
  p.textSize(20);
  p.fill(100, 255, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
}

function renderPlayingScreen(p) {
  // Calculate board offset to center it
  const boardPixelWidth = gameState.boardWidth * gameState.gridCellSize;
  const boardPixelHeight = gameState.boardHeight * gameState.gridCellSize;
  const offsetX = (CANVAS_WIDTH - boardPixelWidth) / 2;
  const offsetY = 80;
  
  // Draw UI
  renderUI(p);
  
  // Draw board
  p.push();
  p.translate(offsetX, offsetY);
  
  // Draw grid
  p.stroke(60, 60, 80);
  p.strokeWeight(1);
  for (let y = 0; y <= gameState.boardHeight; y++) {
    p.line(0, y * gameState.gridCellSize, boardPixelWidth, y * gameState.gridCellSize);
  }
  for (let x = 0; x <= gameState.boardWidth; x++) {
    p.line(x * gameState.gridCellSize, 0, x * gameState.gridCellSize, boardPixelHeight);
  }
  
  // Draw gems
  for (let y = 0; y < gameState.boardHeight; y++) {
    for (let x = 0; x < gameState.boardWidth; x++) {
      const gem = gameState.board[y][x];
      if (gem !== GEM_EMPTY) {
        // Check if animating
        const clearing = gameState.clearAnimations.find(a => a.x === x && a.y === y);
        if (clearing && clearing.progress < 1) {
          const scale = 1 - clearing.progress;
          const alpha = 255 * (1 - clearing.progress);
          drawGem(p, x * gameState.gridCellSize + gameState.gridCellSize / 2,
                  y * gameState.gridCellSize + gameState.gridCellSize / 2,
                  gem, scale, alpha);
        } else {
          drawGem(p, x * gameState.gridCellSize + gameState.gridCellSize / 2,
                  y * gameState.gridCellSize + gameState.gridCellSize / 2,
                  gem, 1, 255);
        }
      }
    }
  }
  
  // Draw falling gems
  gameState.fallAnimations.forEach(anim => {
    if (anim.progress < 1) {
      const currentY = p.lerp(anim.fromY, anim.toY, anim.progress);
      drawGem(p, anim.x * gameState.gridCellSize + gameState.gridCellSize / 2,
              currentY * gameState.gridCellSize + gameState.gridCellSize / 2,
              anim.gem, 1, 255);
    }
  });
  
  // Draw cursor
  p.stroke(255, 255, 100);
  p.strokeWeight(3);
  p.noFill();
  p.rect(gameState.cursorX * gameState.gridCellSize, 
         gameState.cursorY * gameState.gridCellSize,
         gameState.gridCellSize, gameState.gridCellSize);
  
  // Draw selected gem highlight
  if (gameState.selectedGem) {
    p.stroke(100, 150, 255);
    p.strokeWeight(4);
    p.noFill();
    p.rect(gameState.selectedGem.x * gameState.gridCellSize,
           gameState.selectedGem.y * gameState.gridCellSize,
           gameState.gridCellSize, gameState.gridCellSize);
  }
  
  p.pop();
  
  // Draw booster selection UI if active
  if (gameState.boosterActive && gameState.boosterState) {
    renderBoosterUI(p, offsetX, offsetY);
  }
  
  // Turn indicator
  if (gameState.playerTurn) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER);
    p.textSize(14);
    p.text("YOUR TURN", CANVAS_WIDTH / 2, 370);
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER);
    p.textSize(14);
    p.text("AI TURN", CANVAS_WIDTH / 2, 370);
  }
}

function renderUI(p) {
  // Player score
  p.fill(100, 200, 255);
  p.textAlign(p.LEFT);
  p.textSize(16);
  p.text(`Player: ${gameState.playerScore}`, 10, 20);
  
  // AI score
  p.fill(255, 100, 100);
  p.textAlign(p.RIGHT);
  p.textSize(16);
  p.text(`AI: ${gameState.aiScore}`, CANVAS_WIDTH - 10, 20);
  
  // Turns and level
  p.fill(200, 200, 220);
  p.textAlign(p.CENTER);
  p.textSize(16);
  p.text(`Turns: ${gameState.turnsRemaining}`, CANVAS_WIDTH / 2, 20);
  p.textSize(14);
  p.text(`Level ${gameState.currentLevel}: ${gameState.levelConfig.name}`, CANVAS_WIDTH / 2, 40);
  
  // Booster bars
  renderBoosterBar(p, 10, 50, gameState.playerBoosterCharge, gameState.playerBoosterMax, true);
  renderBoosterBar(p, CANVAS_WIDTH - 110, 50, gameState.aiBoosterCharge, gameState.aiBoosterMax, false);
}

function renderBoosterBar(p, x, y, charge, max, isPlayer) {
  const width = 100;
  const height = 15;
  
  // Background
  p.fill(40, 40, 60);
  p.noStroke();
  p.rect(x, y, width, height);
  
  // Fill
  const fillWidth = (charge / max) * width;
  p.fill(...(isPlayer ? [100, 150, 255] : [255, 100, 100]));
  p.rect(x, y, fillWidth, height);
  
  // Border
  p.stroke(100, 100, 120);
  p.strokeWeight(2);
  p.noFill();
  p.rect(x, y, width, height);
  
  // Text
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text(`${charge}/${max}`, x + width / 2, y + height / 2);
  
  // Ready indicator
  if (charge >= max) {
    p.fill(255, 255, 100);
    p.textSize(10);
    p.textAlign(isPlayer ? p.LEFT : p.RIGHT);
    p.text(isPlayer ? "SHIFT - READY!" : "READY!", isPlayer ? x : x + width, y + height + 12);
  }
}

function renderBoosterUI(p, offsetX, offsetY) {
  const state = gameState.boosterState;
  
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER);
  p.textSize(18);
  
  if (state.type === "GEM_BLAST") {
    p.text("Select target cell for 3x3 blast", CANVAS_WIDTH / 2, 30);
    p.text("Press SPACE to confirm", CANVAS_WIDTH / 2, 50);
  } else if (state.type === "LINE_CLEAR") {
    p.text(state.step === "SELECT_LINE" ? "Move cursor to row/column" : "", CANVAS_WIDTH / 2, 30);
    p.text("Arrow Keys: H or V | SPACE: Clear", CANVAS_WIDTH / 2, 50);
  } else if (state.type === "COLOR_CONVERSION") {
    if (state.step === "SELECT_SOURCE") {
      p.text("Move cursor over source color", CANVAS_WIDTH / 2, 30);
      p.text("Press SPACE to select", CANVAS_WIDTH / 2, 50);
    } else {
      p.text("Move cursor over target color", CANVAS_WIDTH / 2, 30);
      p.text("Press SPACE to convert", CANVAS_WIDTH / 2, 50);
    }
  } else if (state.type === "COLOR_ERADICATION") {
    p.text("Move cursor over color to eradicate", CANVAS_WIDTH / 2, 30);
    p.text("Press SPACE to confirm", CANVAS_WIDTH / 2, 50);
  }
}

function drawGem(p, x, y, gemType, scale, alpha) {
  const size = gameState.gridCellSize * 0.7 * scale;
  
  p.push();
  p.translate(x, y);
  
  if (gemType === GEM_RED) {
    p.fill(255, 80, 80, alpha);
    p.noStroke();
    p.circle(0, 0, size);
  } else if (gemType === GEM_GREEN) {
    p.fill(80, 255, 80, alpha);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(0, 0, size * 0.8, size * 0.8);
  } else if (gemType === GEM_YELLOW) {
    p.fill(255, 255, 80, alpha);
    p.noStroke();
    p.triangle(-size * 0.5, size * 0.4, size * 0.5, size * 0.4, 0, -size * 0.5);
  } else if (gemType === GEM_PURPLE) {
    p.fill(200, 80, 255, alpha);
    p.noStroke();
    p.beginShape();
    p.vertex(0, -size * 0.5);
    p.vertex(size * 0.4, 0);
    p.vertex(0, size * 0.5);
    p.vertex(-size * 0.4, 0);
    p.endShape(p.CLOSE);
  } else if (gemType === GEM_CYAN) {
    p.fill(80, 220, 255, alpha);
    p.noStroke();
    drawPentagon(p, 0, 0, size * 0.5);
  } else if (gemType === GEM_ORANGE) {
    p.fill(255, 180, 80, alpha);
    p.noStroke();
    drawHexagon(p, 0, 0, size * 0.4);
  } else if (gemType === GEM_BLUE_STAR) {
    p.fill(100, 150, 255, alpha);
    p.noStroke();
    drawStar(p, 0, 0, size * 0.3, size * 0.6, 5);
    // Glow effect
    p.fill(150, 200, 255, alpha * 0.3);
    p.circle(0, 0, size * 1.2);
  } else if (gemType === GEM_RED_CIRCLE) {
    p.fill(255, 100, 100, alpha);
    p.stroke(255, 50, 50, alpha);
    p.strokeWeight(3);
    p.circle(0, 0, size);
  } else if (gemType === GEM_OBSTACLE) {
    p.fill(80, 80, 90, alpha);
    p.noStroke();
    p.rectMode(p.CENTER);
    p.rect(0, 0, size, size);
    // Cross pattern
    p.stroke(60, 60, 70, alpha);
    p.strokeWeight(2);
    p.line(-size * 0.3, -size * 0.3, size * 0.3, size * 0.3);
    p.line(-size * 0.3, size * 0.3, size * 0.3, -size * 0.3);
  }
  
  p.pop();
}

function drawStar(p, x, y, radius1, radius2, npoints) {
  const angle = p.TWO_PI / npoints;
  const halfAngle = angle / 2;
  p.beginShape();
  for (let a = -p.PI / 2; a < p.TWO_PI - p.PI / 2; a += angle) {
    let sx = x + p.cos(a) * radius2;
    let sy = y + p.sin(a) * radius2;
    p.vertex(sx, sy);
    sx = x + p.cos(a + halfAngle) * radius1;
    sy = y + p.sin(a + halfAngle) * radius1;
    p.vertex(sx, sy);
  }
  p.endShape(p.CLOSE);
}

function drawPentagon(p, x, y, radius) {
  p.beginShape();
  for (let i = 0; i < 5; i++) {
    const angle = p.TWO_PI / 5 * i - p.PI / 2;
    const px = x + p.cos(angle) * radius;
    const py = y + p.sin(angle) * radius;
    p.vertex(px, py);
  }
  p.endShape(p.CLOSE);
}

function drawHexagon(p, x, y, radius) {
  p.beginShape();
  for (let i = 0; i < 6; i++) {
    const angle = p.TWO_PI / 6 * i;
    const px = x + p.cos(angle) * radius;
    const py = y + p.sin(angle) * radius;
    p.vertex(px, py);
  }
  p.endShape(p.CLOSE);
}

function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  
  p.fill(200, 200, 220);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

function renderLevelCompleteScreen(p) {
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(`LEVEL ${gameState.currentLevel} COMPLETE!`, CANVAS_WIDTH / 2, 100);
  
  p.textSize(24);
  p.fill(100, 255, 100);
  p.text(`Player Score: ${gameState.playerScore}`, CANVAS_WIDTH / 2, 180);
  
  p.fill(255, 100, 100);
  p.text(`AI Score: ${gameState.aiScore}`, CANVAS_WIDTH / 2, 220);
  
  p.textSize(20);
  p.fill(200, 200, 220);
  if (gameState.currentLevel < gameState.maxLevel) {
    p.text("PRESS ENTER FOR NEXT LEVEL", CANVAS_WIDTH / 2, 320);
  } else {
    p.text("YOU ARE A GEM MASTER!", CANVAS_WIDTH / 2, 280);
    p.text("PRESS ENTER TO CONTINUE", CANVAS_WIDTH / 2, 320);
  }
}

function renderGameOverScreen(p) {
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  p.textSize(24);
  p.fill(100, 200, 255);
  p.text(`Player Score: ${gameState.playerScore}`, CANVAS_WIDTH / 2, 180);
  
  p.fill(255, 100, 100);
  p.text(`AI Score: ${gameState.aiScore}`, CANVAS_WIDTH / 2, 220);
  
  p.textSize(18);
  p.fill(200, 200, 220);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}