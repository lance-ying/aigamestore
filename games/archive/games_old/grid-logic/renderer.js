// renderer.js - Rendering functions
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, GRID_SIZE, BOX_SIZE, 
  CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, gameState,
  DIFFICULTY_SETTINGS, MAX_ERRORS
} from './globals.js';

export class Renderer {
  constructor(p) {
    this.p = p;
  }

  renderStartScreen() {
    const p = this.p;
    p.background(240, 235, 220);

    // Title
    p.fill(40, 80, 120);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("GRID LOGIC", CANVAS_WIDTH / 2, 60);

    // Subtitle
    p.textSize(20);
    p.fill(60, 60, 60);
    p.text("A Sudoku Challenge", CANVAS_WIDTH / 2, 100);

    // Instructions
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.fill(40, 40, 40);
    const instructions = [
      "OBJECTIVE:",
      "Fill the 9x9 grid so each row, column, and 3x3 box",
      "contains digits 1-9 exactly once.",
      "",
      "CONTROLS:",
      "Arrow Keys - Navigate cells",
      "1-9 - Enter number",
      "Space - Toggle pencil mark mode",
      "Shift - Clear cell",
      "Z - Undo",
      "ESC - Pause",
      "",
      "Choose your difficulty level:"
    ];

    let y = 140;
    for (let line of instructions) {
      p.text(line, 80, y);
      y += 18;
    }

    // Difficulty buttons
    const difficulties = ["EASY", "MEDIUM", "HARD", "EXPERT"];
    const buttonY = 340;
    const buttonWidth = 110;
    const buttonHeight = 35;
    const spacing = 20;
    const totalWidth = difficulties.length * buttonWidth + (difficulties.length - 1) * spacing;
    let startX = (CANVAS_WIDTH - totalWidth) / 2;

    for (let i = 0; i < difficulties.length; i++) {
      const x = startX + i * (buttonWidth + spacing);
      const diff = difficulties[i];
      
      p.fill(100, 150, 200);
      p.stroke(60, 100, 140);
      p.strokeWeight(2);
      p.rect(x, buttonY, buttonWidth, buttonHeight, 5);
      
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.text(DIFFICULTY_SETTINGS[diff].name, x + buttonWidth / 2, buttonY + buttonHeight / 2);
    }

    // Start prompt
    p.fill(200, 80, 80);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(18);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 385);
  }

  renderPlayingScreen() {
    const p = this.p;
    p.background(240, 235, 220);

    // Header info
    this.renderHeader();

    // Grid
    this.renderGrid();

    // Instructions panel
    this.renderInstructionsPanel();
  }

  renderHeader() {
    const p = this.p;
    
    // Difficulty
    p.fill(40, 40, 40);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    const diffName = DIFFICULTY_SETTINGS[gameState.difficulty].name;
    p.text(`Difficulty: ${diffName}`, 10, 10);

    // Time
    const minutes = Math.floor(gameState.elapsedTime / 60);
    const seconds = gameState.elapsedTime % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    p.text(`Time: ${timeStr}`, 10, 30);

    // Score
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);

    // Errors
    p.fill(...(gameState.errors >= MAX_ERRORS - 1 ? [200, 50, 50] : [40, 40, 40]));
    p.text(`Errors: ${gameState.errors}/${MAX_ERRORS}`, CANVAS_WIDTH - 10, 30);
  }

  renderGrid() {
    const p = this.p;
    const grid = gameState.grid;

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cell = grid[row][col];
        const x = GRID_OFFSET_X + col * CELL_SIZE;
        const y = GRID_OFFSET_Y + row * CELL_SIZE;

        // Cell background
        if (row === gameState.selectedRow && col === gameState.selectedCol) {
          p.fill(255, 255, 150); // Selected cell
        } else if (cell.isFixed) {
          p.fill(230, 230, 230); // Fixed cell
        } else if (cell.isConflict) {
          p.fill(255, 180, 180); // Conflict
        } else {
          p.fill(255); // Empty cell
        }

        p.stroke(100);
        p.strokeWeight(1);
        p.rect(x, y, CELL_SIZE, CELL_SIZE);

        // Cell value
        if (cell.value !== 0) {
          p.fill(...(cell.isFixed ? [20, 20, 20] : (cell.isConflict ? [200, 0, 0] : [40, 80, 200])));
          p.noStroke();
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(20);
          p.text(cell.value, x + CELL_SIZE / 2, y + CELL_SIZE / 2);
        } else if (cell.pencilMarks.size > 0) {
          // Pencil marks
          p.fill(150, 150, 150);
          p.textSize(9);
          const marks = Array.from(cell.pencilMarks).sort();
          for (let mark of marks) {
            const markRow = Math.floor((mark - 1) / 3);
            const markCol = (mark - 1) % 3;
            const markX = x + 6 + markCol * 10;
            const markY = y + 8 + markRow * 10;
            p.text(mark, markX, markY);
          }
        }
      }
    }

    // Grid lines
    p.stroke(100);
    for (let i = 0; i <= GRID_SIZE; i++) {
      const weight = (i % BOX_SIZE === 0) ? 3 : 1;
      p.strokeWeight(weight);
      
      // Vertical lines
      const x = GRID_OFFSET_X + i * CELL_SIZE;
      p.line(x, GRID_OFFSET_Y, x, GRID_OFFSET_Y + GRID_SIZE * CELL_SIZE);
      
      // Horizontal lines
      const y = GRID_OFFSET_Y + i * CELL_SIZE;
      p.line(GRID_OFFSET_X, y, GRID_OFFSET_X + GRID_SIZE * CELL_SIZE, y);
    }

    // Selected cell highlight
    const selX = GRID_OFFSET_X + gameState.selectedCol * CELL_SIZE;
    const selY = GRID_OFFSET_Y + gameState.selectedRow * CELL_SIZE;
    p.noFill();
    p.stroke(255, 200, 0);
    p.strokeWeight(3);
    p.rect(selX, selY, CELL_SIZE, CELL_SIZE);
  }

  renderInstructionsPanel() {
    const p = this.p;
    
    p.fill(40, 40, 40);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(11);
    
    const x = GRID_OFFSET_X + GRID_SIZE * CELL_SIZE + 20;
    const instructions = [
      "CONTROLS:",
      "Arrows - Move",
      "1-9 - Number",
      "Space - Pencil",
      "Shift - Clear",
      "Z - Undo",
      "ESC - Pause"
    ];

    let y = GRID_OFFSET_Y + 20;
    for (let line of instructions) {
      p.text(line, x, y);
      y += 16;
    }

    // Pencil mode indicator
    if (gameState.pencilMarkMode) {
      p.fill(100, 150, 200);
      p.textSize(12);
      p.text("PENCIL MODE", x, y + 20);
    }
  }

  renderPausedScreen() {
    const p = this.p;
    this.renderPlayingScreen();

    // Overlay
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Paused text
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

    p.textSize(18);
    p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);

    // Small paused indicator in top right
    p.fill(255, 200, 0);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 50);
  }

  renderGameOverScreen(won) {
    const p = this.p;
    p.background(240, 235, 220);

    // Title
    p.fill(...(won ? [50, 150, 50] : [200, 50, 50]));
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text(won ? "PUZZLE SOLVED!" : "GAME OVER", CANVAS_WIDTH / 2, 80);

    // Stats
    p.fill(40, 40, 40);
    p.textSize(20);
    const minutes = Math.floor(gameState.elapsedTime / 60);
    const seconds = gameState.elapsedTime % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    p.text(`Time: ${timeStr}`, CANVAS_WIDTH / 2, 160);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
    p.text(`Difficulty: ${DIFFICULTY_SETTINGS[gameState.difficulty].name}`, CANVAS_WIDTH / 2, 240);

    if (!won) {
      p.textSize(16);
      p.fill(100, 100, 100);
      p.text(`You made ${gameState.errors} errors`, CANVAS_WIDTH / 2, 280);
    }

    // Restart prompt
    p.fill(100, 150, 200);
    p.textSize(24);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);

    // Confetti for win
    if (won) {
      this.renderConfetti();
    }
  }

  renderConfetti() {
    const p = this.p;
    const count = 50;
    for (let i = 0; i < count; i++) {
      const x = (i * 37 + p.frameCount * 3) % CANVAS_WIDTH;
      const y = ((i * 17 + p.frameCount * 2) % (CANVAS_HEIGHT - 100)) + 100;
      const size = 5 + (i % 5);
      const hue = (i * 40) % 360;
      
      p.push();
      p.colorMode(p.HSB);
      p.fill(hue, 80, 90);
      p.noStroke();
      p.circle(x, y, size);
      p.pop();
    }
  }
}