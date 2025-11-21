// renderer.js - Rendering functions

import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GAME_PHASES, 
  gameState, 
  GRID_START_X, 
  GRID_START_Y, 
  CELL_SIZE, 
  CELL_PADDING, 
  COLORS,
  CELL_TYPES
} from './globals.js';

export class Renderer {
  constructor(p) {
    this.p = p;
    this.flashTimer = 0;
    this.hintFlashTimer = 0;
    this.hintFlashCell = null;
  }

  render() {
    this.p.background(...COLORS.BACKGROUND);
    
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        this.renderStartScreen();
        break;
      case GAME_PHASES.PLAYING:
        this.renderGame();
        break;
      case GAME_PHASES.PAUSED:
        this.renderGame();
        this.renderPausedOverlay();
        break;
      case GAME_PHASES.GAME_OVER_WIN:
        this.renderGame();
        this.renderWinScreen();
        break;
      case GAME_PHASES.GAME_OVER_LOSE:
        this.renderGame();
        this.renderLoseScreen();
        break;
    }
    
    // Update flash timers
    if (this.flashTimer > 0) {
      this.flashTimer--;
    }
    if (this.hintFlashTimer > 0) {
      this.hintFlashTimer--;
      if (this.hintFlashTimer === 0) {
        this.hintFlashCell = null;
      }
    }
  }

  renderStartScreen() {
    // Title
    this.p.fill(...COLORS.TEXT_LIGHT);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(48);
    this.p.text("NumGrid Solver", CANVAS_WIDTH / 2, 80);
    
    // Instructions
    this.p.textSize(16);
    this.p.fill(...COLORS.UI_TEXT);
    
    const instructions = [
      "Solve mathematical grid puzzles!",
      "Fill missing numbers to make all equations correct.",
      "",
      "CONTROLS:",
      "Arrow Keys - Navigate cells",
      "0-9 - Enter numbers",
      "Space - Confirm number",
      "Z - Clear cell",
      "Shift - Use hint (3 available)",
      "",
      "Complete with 2 or fewer mistakes to win!",
      "",
      "PRESS ENTER TO START"
    ];
    
    let yPos = 140;
    for (const line of instructions) {
      this.p.text(line, CANVAS_WIDTH / 2, yPos);
      yPos += line === "" ? 10 : 22;
    }
  }

  renderGame() {
    // Render UI
    this.renderUI();
    
    // Render grid
    this.renderGrid();
  }

  renderUI() {
    this.p.textAlign(this.p.LEFT, this.p.TOP);
    this.p.textSize(16);
    this.p.fill(...COLORS.UI_TEXT);
    
    // Score
    this.p.text(`SCORE: ${gameState.score}`, 10, 10);
    
    // Level
    this.p.textAlign(this.p.RIGHT, this.p.TOP);
    this.p.text(`LEVEL: ${gameState.currentLevel}/${gameState.totalLevels}`, CANVAS_WIDTH - 10, 10);
    
    // Timer
    this.p.textAlign(this.p.CENTER, this.p.TOP);
    const minutes = Math.floor(gameState.elapsedTime / 60);
    const seconds = Math.floor(gameState.elapsedTime % 60);
    this.p.text(`TIME: ${minutes}:${seconds.toString().padStart(2, '0')}`, CANVAS_WIDTH / 2, 10);
    
    // Hints
    this.p.textAlign(this.p.RIGHT, this.p.TOP);
    this.p.text(`HINTS: ${gameState.hintsRemaining}`, CANVAS_WIDTH - 10, 35);
    
    // Mistakes
    this.p.textAlign(this.p.LEFT, this.p.TOP);
    this.p.text(`MISTAKES: ${gameState.mistakes}/${gameState.maxMistakes}`, 10, 35);
  }

  renderGrid() {
    const grid = gameState.grid;
    if (!grid || grid.length === 0) return;
    
    const rows = grid.length;
    const cols = grid[0].length;
    
    // Center the grid
    const gridWidth = cols * (CELL_SIZE + CELL_PADDING) - CELL_PADDING;
    const gridHeight = rows * (CELL_SIZE + CELL_PADDING) - CELL_PADDING;
    const startX = (CANVAS_WIDTH - gridWidth) / 2;
    const startY = GRID_START_Y;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        const x = startX + c * (CELL_SIZE + CELL_PADDING);
        const y = startY + r * (CELL_SIZE + CELL_PADDING);
        
        this.renderCell(cell, x, y, r, c);
      }
    }
  }

  renderCell(cell, x, y, row, col) {
    this.p.push();
    
    // Determine cell color
    let fillColor = COLORS.CELL_EMPTY;
    
    if (cell.type === CELL_TYPES.FIXED) {
      fillColor = COLORS.CELL_FIXED;
    } else if (cell.type === CELL_TYPES.OPERATOR) {
      fillColor = COLORS.CELL_OPERATOR;
    } else if (cell.type === CELL_TYPES.RESULT) {
      fillColor = COLORS.CELL_RESULT;
    }
    
    // Flash error
    if (cell.hasError && this.flashTimer > 0) {
      fillColor = COLORS.CELL_ERROR;
    }
    
    // Flash hint
    if (this.hintFlashCell && this.hintFlashCell.row === row && this.hintFlashCell.col === col && this.hintFlashTimer > 0) {
      fillColor = COLORS.CELL_HINT;
    }
    
    // Fill cell
    this.p.fill(...fillColor);
    this.p.stroke(100);
    this.p.strokeWeight(1);
    this.p.rect(x, y, CELL_SIZE, CELL_SIZE);
    
    // Selected cell highlight
    if (gameState.selectedCell.row === row && gameState.selectedCell.col === col && cell.type === CELL_TYPES.EMPTY) {
      this.p.noFill();
      this.p.stroke(...COLORS.CELL_SELECTED);
      this.p.strokeWeight(3);
      this.p.rect(x, y, CELL_SIZE, CELL_SIZE);
    }
    
    // Draw cell content
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(24);
    
    let textColor = COLORS.TEXT_DARK;
    if (cell.type === CELL_TYPES.OPERATOR) {
      textColor = COLORS.TEXT_LIGHT;
    }
    this.p.fill(...textColor);
    this.p.noStroke();
    
    let displayValue = null;
    if (cell.type === CELL_TYPES.EMPTY) {
      displayValue = cell.userInput !== null ? cell.userInput : (gameState.stagedNumber !== null && gameState.selectedCell.row === row && gameState.selectedCell.col === col ? gameState.stagedNumber : "?");
    } else {
      displayValue = cell.value;
    }
    
    if (displayValue !== null) {
      this.p.text(displayValue, x + CELL_SIZE / 2, y + CELL_SIZE / 2);
    }
    
    this.p.pop();
  }

  renderPausedOverlay() {
    this.p.fill(0, 0, 0, 180);
    this.p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    this.p.fill(...COLORS.TEXT_LIGHT);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(32);
    this.p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
    
    this.p.textSize(18);
    this.p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    this.p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  }

  renderWinScreen() {
    this.p.fill(0, 0, 0, 200);
    this.p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    this.p.fill(...COLORS.TEXT_LIGHT);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(48);
    this.p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    this.p.textSize(24);
    this.p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    this.p.text(`Mistakes: ${gameState.mistakes}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    
    this.p.textSize(18);
    if (gameState.currentLevel < gameState.totalLevels) {
      this.p.text("Press ENTER for next level", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    } else {
      this.p.text("All levels complete!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
      this.p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
    }
  }

  renderLoseScreen() {
    this.p.fill(0, 0, 0, 200);
    this.p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    this.p.fill(...COLORS.TEXT_LIGHT);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(48);
    this.p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    
    this.p.textSize(24);
    this.p.text(`Too many mistakes!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    
    this.p.textSize(18);
    this.p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
  }

  flashErrors() {
    this.flashTimer = 30; // Flash for 30 frames
  }

  flashHint(row, col) {
    this.hintFlashTimer = 60;
    this.hintFlashCell = { row, col };
  }
}