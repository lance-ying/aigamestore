// render.js - Rendering functions
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { LEVEL_CONFIGS } from './levels.js';

const CELL_SIZE = 45;

function getGridOffsets() {
  const gridWidth = gameState.gridCols * CELL_SIZE;
  const gridHeight = gameState.gridRows * CELL_SIZE;
  
  // Center horizontally
  const x = (CANVAS_WIDTH - gridWidth) / 2;
  
  // Center vertically but ensure space for top UI
  // UI takes up approx 80-90px with 3 objectives
  let y = (CANVAS_HEIGHT - gridHeight) / 2;
  y = Math.max(100, y); // Minimum top margin
  
  return { x, y };
}

export function calculateDotPosition(gridX, gridY) {
  const offsets = getGridOffsets();
  return {
    x: offsets.x + gridX * CELL_SIZE + CELL_SIZE / 2,
    y: offsets.y + gridY * CELL_SIZE + CELL_SIZE / 2
  };
}

export function renderStartScreen(p) {
  p.background(20, 25, 35);
  
  p.noStroke();
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("press enter to begin", CANVAS_WIDTH / 2, 80); // Replaced game title
  
  p.textSize(16);
  p.fill(200, 200, 200);
  // Preserving existing game description as it does not contain the game name
  const description = "Connect adjacent dots of the same color!\nForm squares to clear all dots of that color.\nComplete objectives before moves run out.";
  p.text(description, CANVAS_WIDTH / 2, 150);
  
  p.textSize(14);
  p.fill(150, 150, 150);
  // Preserving existing controls instructions as they do not contain the game name
  const instructions = "Arrow Keys: Move cursor\nSpace: Select & connect dots\nShift: Cancel path\nEsc: Pause";
  p.text(instructions, CANVAS_WIDTH / 2, 240);
  
  p.textSize(20);
  p.fill(100, 255, 100);
  // Preserving existing "PRESS ENTER TO START" as it is an instruction, not the title
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 330);
  
  if (gameState.highScore > 0) {
    p.textSize(16);
    p.fill(255, 200, 50);
    p.text("HIGH SCORE: " + gameState.highScore, CANVAS_WIDTH / 2, 370);
  }
}

export function renderPlayingScreen(p) {
  p.background(20, 25, 35);
  
  // Draw UI
  renderUI(p);
  
  const offsets = getGridOffsets();
  const startX = offsets.x;
  const startY = offsets.y;
  const gridWidth = gameState.gridCols * CELL_SIZE;
  const gridHeight = gameState.gridRows * CELL_SIZE;
  
  // Draw grid lines
  p.stroke(60, 60, 80);
  p.strokeWeight(1);
  for (let row = 0; row <= gameState.gridRows; row++) {
    const y = startY + row * CELL_SIZE;
    p.line(startX, y, startX + gridWidth, y);
  }
  for (let col = 0; col <= gameState.gridCols; col++) {
    const x = startX + col * CELL_SIZE;
    p.line(x, startY, x, startY + gridHeight);
  }
  
  // Update and draw dots
  for (let row = 0; row < gameState.gridRows; row++) {
    for (let col = 0; col < gameState.gridCols; col++) {
      const dot = gameState.grid[row][col];
      if (dot) {
        const pos = calculateDotPosition(col, row);
        dot.setTarget(pos.x, pos.y, dot.isClearing ? 0 : 35);
        dot.update();
        
        if (dot.alpha > 0) {
          renderDot(p, dot);
        }
      }
    }
  }
  
  // Draw cursor
  renderCursor(p);
  
  // Draw path
  renderPath(p);
  
  // Draw paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.noStroke();
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

function renderUI(p) {
  p.noStroke();
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text("SCORE: " + gameState.score, 10, 10);
  
  p.textAlign(p.RIGHT, p.TOP);
  p.text("MOVES: " + gameState.currentMoves, CANVAS_WIDTH - 10, 10);
  
  p.textAlign(p.CENTER, p.TOP);
  p.text("LEVEL: " + gameState.currentLevel, CANVAS_WIDTH / 2, 10);
  
  // Objectives
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  let yOffset = 40;
  for (let key in gameState.levelObjectives) {
    const obj = gameState.levelObjectives[key];
    const progress = obj.current + "/" + obj.target;
    const text = obj.description + ": " + progress;
    const color = obj.current >= obj.target ? [100, 255, 100] : [200, 200, 200];
    p.fill(...color);
    p.text(text, 10, yOffset);
    yOffset += 16;
  }
}

function renderDot(p, dot) {
  if (dot.size <= 0) return;
  
  p.noStroke();
  p.fill(...dot.color, dot.alpha);
  p.circle(dot.x, dot.y, dot.size);
  
  // Draw anchor icon
  if (dot.type === 'anchor') {
    p.fill(255, 255, 255, dot.alpha);
    const anchorSize = dot.size * 0.4;
    p.push();
    p.translate(dot.x, dot.y);
    // Simple anchor shape
    p.rect(-anchorSize / 4, -anchorSize / 2, anchorSize / 2, anchorSize * 0.8);
    p.circle(-anchorSize / 2, anchorSize / 4, anchorSize / 2);
    p.circle(anchorSize / 2, anchorSize / 4, anchorSize / 2);
    p.pop();
  }
  
  // Highlight if selected
  if (dot === gameState.currentSelectedDot) {
    p.stroke(255, 255, 100);
    p.strokeWeight(4);
    p.noFill();
    p.circle(dot.x, dot.y, dot.size + 8);
  }
  
  // Highlight if in path
  if (gameState.currentPath.includes(dot) && dot !== gameState.currentSelectedDot) {
    p.stroke(255, 255, 255, 150);
    p.strokeWeight(2);
    p.noFill();
    p.circle(dot.x, dot.y, dot.size + 4);
  }
}

function renderCursor(p) {
  const pos = calculateDotPosition(gameState.cursorX, gameState.cursorY);
  p.stroke(180, 180, 180);
  p.strokeWeight(2);
  p.noFill();
  p.rect(pos.x - CELL_SIZE / 2, pos.y - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
}

function renderPath(p) {
  if (gameState.currentPath.length > 1) {
    p.stroke(255, 255, 255, 200);
    p.strokeWeight(5);
    p.noFill();
    p.beginShape();
    for (let dot of gameState.currentPath) {
      const pos = calculateDotPosition(dot.gridX, dot.gridY);
      p.vertex(pos.x, pos.y);
    }
    p.endShape();
  }
}

export function renderGameOverScreen(p) {
  p.background(20, 25, 35);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  p.noStroke();
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "LEVEL COMPLETE!" : "GAME OVER!", CANVAS_WIDTH / 2, 80);
  
  p.textSize(24);
  p.fill(200, 200, 200);
  p.text("Final Score: " + gameState.totalScore, CANVAS_WIDTH / 2, 150);
  
  // Show objectives
  p.textSize(16);
  let yOffset = 200;
  for (let key in gameState.levelObjectives) {
    const obj = gameState.levelObjectives[key];
    const progress = obj.current + "/" + obj.target;
    const text = obj.description + ": " + progress;
    const color = obj.current >= obj.target ? [100, 255, 100] : [255, 100, 100];
    p.fill(...color);
    p.text(text, CANVAS_WIDTH / 2, yOffset);
    yOffset += 24;
  }
  
  // Stars for win
  if (isWin) {
    const movesLeft = gameState.currentMoves;
    const stars = movesLeft >= 11 ? 3 : movesLeft >= 6 ? 2 : 1;
    p.textSize(20);
    p.fill(255, 200, 50);
    p.text("★".repeat(stars) + "☆".repeat(3 - stars), CANVAS_WIDTH / 2, yOffset + 20);
  }
  
  p.textSize(20);
  p.fill(100, 255, 100);
  
  let actionText = "PRESS R TO RESTART";
  if (isWin) {
    if (gameState.currentLevel < LEVEL_CONFIGS.length) {
      actionText = "PRESS R FOR NEXT LEVEL";
    } else {
      actionText = "PRESS R TO RETURN TO MENU";
    }
  } else {
    actionText = "PRESS R TO RETRY LEVEL";
  }
  
  p.text(actionText, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
  
  if (isWin && gameState.currentLevel < LEVEL_CONFIGS.length) {
    // p.textSize(16);
    // p.fill(200, 200, 200);
    // p.text("(Next level available)", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }
}