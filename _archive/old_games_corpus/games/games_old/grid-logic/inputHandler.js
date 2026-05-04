// inputHandler.js - Handle user input
import { gameState, GRID_SIZE, MAX_ERRORS } from './globals.js';
import { PuzzleGenerator } from './puzzleGenerator.js';

export class InputHandler {
  constructor(p, generator) {
    this.p = p;
    this.generator = generator;
  }

  handleKeyPressed(keyCode, key) {
    const p = this.p;

    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key, keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Phase-specific controls
    if (keyCode === 13) { // ENTER
      this.handleEnterKey();
      return;
    }

    if (keyCode === 27) { // ESC
      this.handleEscKey();
      return;
    }

    if (keyCode === 82) { // R
      this.handleRestartKey();
      return;
    }

    // Playing state controls
    if (gameState.gamePhase === "PLAYING") {
      this.handlePlayingInput(keyCode, key);
    }
  }

  handleEnterKey() {
    if (gameState.gamePhase === "START") {
      // Default to EASY if no difficulty selected
      if (!gameState.difficulty) {
        gameState.difficulty = "EASY";
      }
      this.startGame();
    }
  }

  handleEscKey() {
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "PAUSED";
      gameState.pausedTime = Date.now();
      this.logGameInfo("Game paused");
    } else if (gameState.gamePhase === "PAUSED") {
      const pauseDuration = Math.floor((Date.now() - gameState.pausedTime) / 1000);
      gameState.startTime += pauseDuration * 1000;
      gameState.gamePhase = "PLAYING";
      this.logGameInfo("Game resumed");
    }
  }

  handleRestartKey() {
    if (gameState.gamePhase === "GAME_OVER_WIN" || 
        gameState.gamePhase === "GAME_OVER_LOSE" ||
        gameState.gamePhase === "PAUSED") {
      this.resetToStart();
    }
  }

  handlePlayingInput(keyCode, key) {
    const p = this.p;

    // Arrow keys for navigation
    if (keyCode === 37) { // LEFT
      gameState.selectedCol = Math.max(0, gameState.selectedCol - 1);
      this.updatePlayerPosition();
    } else if (keyCode === 38) { // UP
      gameState.selectedRow = Math.max(0, gameState.selectedRow - 1);
      this.updatePlayerPosition();
    } else if (keyCode === 39) { // RIGHT
      gameState.selectedCol = Math.min(GRID_SIZE - 1, gameState.selectedCol + 1);
      this.updatePlayerPosition();
    } else if (keyCode === 40) { // DOWN
      gameState.selectedRow = Math.min(GRID_SIZE - 1, gameState.selectedRow + 1);
      this.updatePlayerPosition();
    }
    // Number keys 1-9
    else if (keyCode >= 49 && keyCode <= 57) {
      const num = keyCode - 48;
      this.placeNumber(num);
    }
    // Space - toggle pencil mark mode
    else if (keyCode === 32) {
      gameState.pencilMarkMode = !gameState.pencilMarkMode;
    }
    // Shift - clear cell
    else if (keyCode === 16) {
      this.clearCell();
    }
    // Z - undo
    else if (keyCode === 90) {
      this.undo();
    }
  }

  placeNumber(num) {
    const cell = gameState.grid[gameState.selectedRow][gameState.selectedCol];
    
    if (cell.isFixed) return;

    // Save state for undo
    this.saveState();

    if (gameState.pencilMarkMode) {
      cell.togglePencilMark(num);
    } else {
      const oldValue = cell.value;
      cell.setValue(num);
      
      // Check for conflicts
      this.generator.checkConflicts(gameState.grid);
      
      // Check if this placement is incorrect
      if (cell.isConflict) {
        gameState.errors++;
        gameState.score += -50; // INCORRECT_NUMBER penalty
        
        if (gameState.errors >= MAX_ERRORS) {
          this.gameOver(false);
          return;
        }
      } else if (oldValue === 0 && num !== 0) {
        // Valid placement
        gameState.correctPlacements++;
        gameState.score += 10; // CORRECT_NUMBER points
      }

      // Check if puzzle is complete
      if (this.generator.isGridComplete(gameState.grid)) {
        this.gameOver(true);
      }
    }

    this.updatePlayerPosition();
  }

  clearCell() {
    const cell = gameState.grid[gameState.selectedRow][gameState.selectedCol];
    
    if (cell.isFixed) return;

    this.saveState();
    cell.clear();
    this.generator.checkConflicts(gameState.grid);
    this.updatePlayerPosition();
  }

  undo() {
    if (gameState.history.length === 0) return;

    const previousState = gameState.history.pop();
    
    // Restore grid state
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const prevCell = previousState.grid[row][col];
        const currCell = gameState.grid[row][col];
        
        if (!currCell.isFixed) {
          currCell.value = prevCell.value;
          currCell.pencilMarks = new Set(prevCell.pencilMarks);
        }
      }
    }

    gameState.selectedRow = previousState.selectedRow;
    gameState.selectedCol = previousState.selectedCol;
    gameState.pencilMarkMode = previousState.pencilMarkMode;

    this.generator.checkConflicts(gameState.grid);
    this.updatePlayerPosition();
  }

  saveState() {
    const state = {
      grid: [],
      selectedRow: gameState.selectedRow,
      selectedCol: gameState.selectedCol,
      pencilMarkMode: gameState.pencilMarkMode
    };

    for (let row = 0; row < GRID_SIZE; row++) {
      state.grid[row] = [];
      for (let col = 0; col < GRID_SIZE; col++) {
        state.grid[row][col] = gameState.grid[row][col].clone();
      }
    }

    gameState.history.push(state);

    // Limit history to last 20 moves
    if (gameState.history.length > 20) {
      gameState.history.shift();
    }
  }

  startGame() {
    const p = this.p;
    
    // Generate puzzle
    gameState.grid = this.generator.generatePuzzle(gameState.difficulty);
    gameState.fixedCells = [];
    
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (gameState.grid[row][col].isFixed) {
          gameState.fixedCells.push({ row, col });
        }
      }
    }

    // Reset game state
    gameState.gamePhase = "PLAYING";
    gameState.selectedRow = 0;
    gameState.selectedCol = 0;
    gameState.pencilMarkMode = false;
    gameState.errors = 0;
    gameState.correctPlacements = 0;
    gameState.hintsUsed = 0;
    gameState.score = 0;
    gameState.startTime = Date.now();
    gameState.elapsedTime = 0;
    gameState.history = [];

    // Find first non-fixed cell
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (!gameState.grid[row][col].isFixed) {
          gameState.selectedRow = row;
          gameState.selectedCol = col;
          this.updatePlayerPosition();
          this.logGameInfo("Game started");
          return;
        }
      }
    }
  }

  gameOver(won) {
    gameState.gamePhase = won ? "GAME_OVER_WIN" : "GAME_OVER_LOSE";

    if (won) {
      // Calculate final score
      const diffSettings = this.getDifficultySettings();
      const timeBonus = Math.max(0, diffSettings.timeBonus - gameState.elapsedTime);
      const baseScore = 500 + gameState.correctPlacements * 10 + gameState.errors * -50 + gameState.hintsUsed * -100;
      gameState.score = Math.floor((baseScore + timeBonus) * diffSettings.multiplier);
    }

    this.logGameInfo(won ? "Game won" : "Game lost");
  }

  resetToStart() {
    gameState.gamePhase = "START";
    gameState.grid = [];
    gameState.fixedCells = [];
    gameState.selectedRow = 0;
    gameState.selectedCol = 0;
    gameState.pencilMarkMode = false;
    gameState.errors = 0;
    gameState.correctPlacements = 0;
    gameState.score = 0;
    gameState.history = [];
    
    this.logGameInfo("Returned to start screen");
  }

  getDifficultySettings() {
    const settings = {
      EASY: { timeBonus: 500, multiplier: 1.0 },
      MEDIUM: { timeBonus: 750, multiplier: 1.2 },
      HARD: { timeBonus: 1000, multiplier: 1.5 },
      EXPERT: { timeBonus: 1500, multiplier: 2.0 }
    };
    return settings[gameState.difficulty] || settings.EASY;
  }

  updatePlayerPosition() {
    const p = this.p;
    const cell = gameState.grid[gameState.selectedRow][gameState.selectedCol];
    
    gameState.player.row = gameState.selectedRow;
    gameState.player.col = gameState.selectedCol;
    gameState.player.x = 50 + gameState.selectedCol * 35 + 17.5;
    gameState.player.y = 60 + gameState.selectedRow * 35 + 17.5;

    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.selectedCol,
      game_y: gameState.selectedRow,
      framecount: p.frameCount
    });
  }

  logGameInfo(message) {
    const p = this.p;
    p.logs.game_info.push({
      data: { message, gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  // Difficulty selection (for testing or extended features)
  selectDifficulty(difficulty) {
    if (gameState.gamePhase === "START") {
      gameState.difficulty = difficulty;
    }
  }
}