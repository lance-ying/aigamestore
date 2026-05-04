import { 
  gameState, GRID_SIZE, BLOCK_SHAPES, BLOCK_COLORS, MIN_SCORE_TO_WIN
} from './globals.js';
import { 
  generateBlocks, canPlaceBlock, placeBlock, checkForCompletedLines, 
  clearCompletedLines, calculateScore, canPlaceAnyBlock, resetGameState, generateRandomBlock
} from './utils.js';
import { 
  handleKeyPressed, processGameControls, KEY_SPACE
} from './input.js';
import { 
  drawGrid, drawCurrentBlock, drawBlockPreviews, drawGameInfo,
  drawStartScreen, drawPauseScreen, drawGameOverScreen
} from './rendering.js';
import { game_testing_controller } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize variables
  p.logs = {
    "game_info": [],
    "player_info": [],
    "inputs": []
  };
  
  p.setup = function() {
    p.createCanvas(600, 400);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game state
    resetGameState();
    
    // Log initial game state
    p.logs.game_info.push({
      "game_status": gameState.gamePhase,
      "data": {},
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  };
  
  p.draw = function() {
    p.background(20);
    
    // Handle different game phases
    switch (gameState.gamePhase) {
      case "START":
        drawStartScreen(p);
        break;
        
      case "PLAYING":
        // Process automated testing inputs if not in human mode
        if (gameState.controlMode !== "HUMAN") {
          const testAction = game_testing_controller(gameState);
          if (testAction !== null) {
            processGameControls(p, testAction);
            
            // Handle block placement from automated testing
            if (testAction === KEY_SPACE) {
              handleBlockPlacement();
            }
          }
        }
        
        // Game rendering
        drawGrid(p);
        drawCurrentBlock(p);
        drawBlockPreviews(p);
        drawGameInfo(p);
        break;
        
      case "PAUSED":
        // Still draw the game but with a pause overlay
        drawGrid(p);
        drawBlockPreviews(p);
        drawGameInfo(p);
        drawPauseScreen(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        // Draw the game state in the background
        drawGrid(p);
        drawBlockPreviews(p);
        drawGameInfo(p);
        
        // Draw game over screen
        drawGameOverScreen(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    // Handle key press for game control
    handleKeyPressed(p, p.keyCode);
    
    // Process game controls only in HUMAN mode and PLAYING phase
    if (gameState.controlMode === "HUMAN" && gameState.gamePhase === "PLAYING") {
      processGameControls(p, p.keyCode);
      
      // Handle block placement
      if (p.keyCode === KEY_SPACE) {
        handleBlockPlacement();
      }
    }
  };
  
  // Handle block placement and game logic
  function handleBlockPlacement() {
    const { grid, availableBlocks, selectedBlockIndex, currentBlock } = gameState;
    const block = availableBlocks[selectedBlockIndex];
    
    if (canPlaceBlock(grid, block, currentBlock.x, currentBlock.y)) {
      // Capture the cells that will be placed (for animation)
      const placedCells = [];
      const shape = block.shape;
      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col] === 1) {
            placedCells.push({ x: currentBlock.x + col, y: currentBlock.y + row, colorIndex: block.colorIndex });
          }
        }
      }

      // Place the block on the grid (logical state)
      placeBlock(grid, block, currentBlock.x, currentBlock.y);

      // Add a short "pop" animation for the placed cells
      gameState.animations.push({ type: 'place', cells: placedCells, frame: 0, duration: 10 }); // Reduced duration for a snappier animation
      
      // Check for completed lines
      const { completedRows, completedCols } = checkForCompletedLines(grid);
      const totalLinesCleared = completedRows.length + completedCols.length;
      
      // Update combo count
      if (totalLinesCleared > 0) {
        if (gameState.player.lastClearedLines > 0) {
          gameState.player.comboCount++;
        } else {
          gameState.player.comboCount = 1;
        }
        gameState.player.lastClearedLines = totalLinesCleared;
      } else {
        gameState.player.comboCount = 0;
        gameState.player.lastClearedLines = 0;
      }
      
      // Clear completed lines (logical state) and update score
      if (totalLinesCleared > 0) {
        // Capture cells that will be cleared for animation before zeroing them
        const clearedCells = [];
        for (const row of completedRows) {
          for (let col = 0; col < grid[row].length; col++) {
            clearedCells.push({ x: col, y: row, colorIndex: grid[row][col] - 1 });
          }
        }
        for (const col of completedCols) {
          for (let row = 0; row < grid.length; row++) {
            clearedCells.push({ x: col, y: row, colorIndex: grid[row][col] - 1 });
          }
        }

        clearCompletedLines(grid, completedRows, completedCols);
        // Add a "clear" animation so cells visually shrink/fade
        gameState.animations.push({ type: 'clear', cells: clearedCells, frame: 0, duration: 18 });

        const scoreGained = calculateScore(totalLinesCleared, gameState.player.comboCount);
        gameState.player.score += scoreGained;
        
        // Update high score if needed
        if (gameState.player.score > gameState.player.highScore) {
          gameState.player.highScore = gameState.player.score;
        }
      }
      
      // Replace the used block with a new one
      availableBlocks[selectedBlockIndex] = generateRandomBlock();
      
      // Reset current block position
      currentBlock.x = Math.floor(GRID_SIZE / 2);
      currentBlock.y = Math.floor(GRID_SIZE / 2);
      
      // Check for win condition
      if (gameState.player.score >= MIN_SCORE_TO_WIN) {
        gameState.gamePhase = "GAME_OVER_WIN";
        p.logs.game_info.push({
          "game_status": gameState.gamePhase,
          "data": { score: gameState.player.score },
          "framecount": p.frameCount,
          "timestamp": Date.now()
        });
        return;
      }
      
      // Check if any of the available blocks can be placed
      if (!canPlaceAnyBlock()) {
        gameState.gamePhase = "GAME_OVER_LOSE";
        p.logs.game_info.push({
          "game_status": gameState.gamePhase,
          "data": { score: gameState.player.score },
          "framecount": p.frameCount,
          "timestamp": Date.now()
        });
      }
    }
  }
});

// Add setControlMode function
function setControlMode(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => btn.classList.remove('active'));
  const targetButton = document.getElementById(`${mode.toLowerCase()}ModeBtn`) || 
                      document.getElementById(`${mode}_ModeBtn`);
  if (targetButton) {
    targetButton.classList.add('active');
  }
  
  // Reset game when switching modes
  if (gameState.gamePhase === "PLAYING") {
    gameState.gamePhase = "START";
    resetGameState();
  }
}

// Expose functions globally
window.setControlMode = setControlMode;
window.gameInstance = gameInstance;