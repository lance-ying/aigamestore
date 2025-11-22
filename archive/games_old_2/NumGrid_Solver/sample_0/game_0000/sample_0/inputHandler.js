// inputHandler.js - Input handling

import { gameState, GAME_PHASES } from './globals.js';
import { GridValidator } from './gridValidator.js';

export class InputHandler {
  constructor(p, gridValidator) {
    this.p = p;
    this.gridValidator = gridValidator;
  }

  handleKeyPressed(key, keyCode) {
    // Log input
    this.p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key, keyCode },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });

    // Phase-specific controls
    if (keyCode === 13) { // ENTER
      this.handleEnter();
    } else if (keyCode === 27) { // ESC
      this.handleEscape();
    } else if (keyCode === 82) { // R
      this.handleRestart();
    }

    // Game controls during PLAYING phase
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (keyCode >= 48 && keyCode <= 57) { // 0-9
        this.handleNumberInput(key);
      } else if (keyCode === 32) { // SPACE
        this.handleConfirm();
      } else if (keyCode === 90) { // Z
        this.handleClear();
      } else if (keyCode === 16) { // SHIFT
        this.handleHint();
      } else if (keyCode === 37 || keyCode === 38 || keyCode === 39 || keyCode === 40) { // ARROW KEYS
        this.handleArrowKeys(keyCode);
      }
    }
  }

  handleEnter() {
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      this.p.logs.game_info.push({
        data: { phase: "PLAYING", level: gameState.currentLevel },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN && gameState.currentLevel < gameState.totalLevels) {
      // Go to next level
      gameState.currentLevel++;
      gameState.gamePhase = GAME_PHASES.PLAYING;
      this.p.logs.game_info.push({
        data: { phase: "PLAYING", level: gameState.currentLevel },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  handleEscape() {
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      this.p.logs.game_info.push({
        data: { phase: "PAUSED" },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      this.p.logs.game_info.push({
        data: { phase: "PLAYING" },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  handleRestart() {
    // Reset to start screen
    gameState.gamePhase = GAME_PHASES.START;
    gameState.currentLevel = 1;
    gameState.score = 0;
    gameState.hintsRemaining = 3;
    gameState.mistakes = 0;
    gameState.stagedNumber = null;
    gameState.selectedCell = { row: -1, col: -1 };
    
    this.p.logs.game_info.push({
      data: { phase: "START", action: "restart" },
      framecount: this.p.frameCount,
      timestamp: Date.now()
    });
  }

  handleNumberInput(key) {
    if (gameState.selectedCell.row >= 0 && gameState.selectedCell.col >= 0) {
      gameState.stagedNumber = parseInt(key);
    }
  }

  handleConfirm() {
    if (gameState.stagedNumber !== null && gameState.selectedCell.row >= 0 && gameState.selectedCell.col >= 0) {
      const cell = gameState.grid[gameState.selectedCell.row][gameState.selectedCell.col];
      if (cell.type === "EMPTY") {
        cell.userInput = gameState.stagedNumber;
        gameState.stagedNumber = null;
      }
    } else if (this.gridValidator.isGridComplete(gameState.grid)) {
      // Submit grid for validation
      this.submitGrid();
    }
  }

  handleClear() {
    if (gameState.selectedCell.row >= 0 && gameState.selectedCell.col >= 0) {
      const cell = gameState.grid[gameState.selectedCell.row][gameState.selectedCell.col];
      if (cell.type === "EMPTY") {
        cell.userInput = null;
        gameState.stagedNumber = null;
      }
    }
  }

  handleHint() {
    if (gameState.hintsRemaining > 0) {
      const hintCell = this.gridValidator.applyHint(gameState.grid);
      if (hintCell) {
        gameState.hintsRemaining--;
        // Flash hint on renderer
        if (window.gameInstance && window.gameInstance.renderer) {
          window.gameInstance.renderer.flashHint(hintCell.row, hintCell.col);
        }
      }
    }
  }

  handleArrowKeys(keyCode) {
    let direction = "";
    if (keyCode === 37) direction = "LEFT";
    else if (keyCode === 38) direction = "UP";
    else if (keyCode === 39) direction = "RIGHT";
    else if (keyCode === 40) direction = "DOWN";

    if (gameState.selectedCell.row === -1 || gameState.selectedCell.col === -1) {
      const firstEmpty = this.gridValidator.getFirstEmptyCell(gameState.grid);
      gameState.selectedCell = firstEmpty;
    } else {
      const nextCell = this.gridValidator.getNextEmptyCell(
        gameState.grid,
        gameState.selectedCell.row,
        gameState.selectedCell.col,
        direction
      );
      gameState.selectedCell = nextCell;
    }
  }

  submitGrid() {
    const mistakes = this.gridValidator.validateGrid(gameState.grid);
    gameState.mistakes = mistakes;
    
    if (mistakes <= gameState.maxMistakes) {
      // Win
      this.calculateScore();
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      this.p.logs.game_info.push({
        data: { phase: "GAME_OVER_WIN", mistakes, score: gameState.score },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
    } else {
      // Lose
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      this.p.logs.game_info.push({
        data: { phase: "GAME_OVER_LOSE", mistakes, score: gameState.score },
        framecount: this.p.frameCount,
        timestamp: Date.now()
      });
      
      // Flash errors
      if (window.gameInstance && window.gameInstance.renderer) {
        window.gameInstance.renderer.flashErrors();
      }
    }
  }

  calculateScore() {
    // Base points
    let levelScore = 1000;
    
    // Time bonus
    const timeTaken = gameState.elapsedTime;
    const timeBonus = Math.max(0, (gameState.maxLevelTime - timeTaken) * 5);
    levelScore += timeBonus;
    
    // Mistake bonus
    if (gameState.mistakes === 0) {
      levelScore += 500;
    } else if (gameState.mistakes === 1) {
      levelScore += 200;
    }
    
    gameState.score += levelScore;
  }
}