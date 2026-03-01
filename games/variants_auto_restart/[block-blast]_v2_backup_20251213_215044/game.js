import { 
  gameState, GRID_SIZE, BLOCK_SHAPES, BLOCK_COLORS, MIN_SCORE_TO_WIN, LEVELS
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
// import { game_testing_controller } from './automated_testing_controller.js'; // Removed: Automated testing file

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize variables
  p.logs = {
    "game_info": [],
    "player_info": [],
    "inputs": []
  };
  
  let lastFallTime = 0;
  const FALL_INTERVAL = 800; // Time in ms between gravity steps
  
  p.setup = function() {
    p.createCanvas(600, 400);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game state
    resetGameState(true);
    
    lastFallTime = p.millis();
    
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
        // Gravity Logic
        if (p.millis() - lastFallTime > FALL_INTERVAL) {
          const { grid, availableBlocks, selectedBlockIndex, currentBlock } = gameState;
          const block = availableBlocks[selectedBlockIndex];
          
          // Try to move down
          if (canPlaceBlock(grid, block, currentBlock.x, currentBlock.y + 1)) {
            currentBlock.y++;
          } else {
            // If cannot move down, try to place if valid
            if (canPlaceBlock(grid, block, currentBlock.x, currentBlock.y)) {
              handleBlockPlacement();
            }
          }
          lastFallTime = p.millis();
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
    if (gameState.gamePhase === "PLAYING") {
      processGameControls(p, p.keyCode);
      
      // Handle block placement (Hard Drop)
      if (p.keyCode === KEY_SPACE) {
        const { grid, availableBlocks, selectedBlockIndex, currentBlock } = gameState;
        const block = availableBlocks[selectedBlockIndex];
        
        // Drop to bottom
        while (canPlaceBlock(grid, block, currentBlock.x, currentBlock.y + 1)) {
          currentBlock.y++;
        }
        
        // Place if valid
        if (canPlaceBlock(grid, block, currentBlock.x, currentBlock.y)) {
          handleBlockPlacement();
          lastFallTime = p.millis(); // Reset gravity timer
        }
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
      gameState.animations.push({ type: 'place', cells: placedCells, frame: 0, duration: 10 }); 
      
      // Increment moves used for this level
      gameState.level.blocksPlaced++;

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

        // Update Level Progress
        gameState.level.linesCleared += totalLinesCleared;
      }
      
      // Replace the used block with a new one
      availableBlocks[selectedBlockIndex] = generateRandomBlock();
      
      // Reset current block position to top
      currentBlock.x = Math.floor(GRID_SIZE / 2);
      currentBlock.y = 0;
      
      // --- Level Logic Checks ---
      const currentLevel = LEVELS[gameState.level.currentIndex];
      
      // 1. Check for Level Win
      if (gameState.level.linesCleared >= currentLevel.linesTarget) {
        // Level Complete!
        gameState.level.currentIndex++;
        
        // Check if all levels completed
        if (gameState.level.currentIndex >= LEVELS.length) {
          gameState.gamePhase = "GAME_OVER_WIN";
          p.logs.game_info.push({
            "game_status": gameState.gamePhase,
            "data": { score: gameState.player.score },
            "framecount": p.frameCount,
            "timestamp": Date.now()
          });
          return;
        } else {
          // Move to next level - Reset grid for distinct level feel
          resetGameState(false); // false = don't reset score/level index, just grid/blocks
          // Maybe add a small visual indication or pause here, but immediate transition keeps flow
          return;
        }
      }
      
      // 2. Check for Level Loss (Out of moves)
      if (gameState.level.blocksPlaced >= currentLevel.maxBlocks) {
        gameState.gamePhase = "GAME_OVER_LOSE";
        p.logs.game_info.push({
          "game_status": gameState.gamePhase,
          "data": { score: gameState.player.score, reason: "out_of_moves" },
          "framecount": p.frameCount,
          "timestamp": Date.now()
        });
        return;
      }

      // 3. Check for Spawn Collision (New Block Overlaps immediately)
      // This handles the "placed over the block / over the top line" lose condition
      if (!canPlaceBlock(grid, availableBlocks[selectedBlockIndex], currentBlock.x, currentBlock.y)) {
        gameState.gamePhase = "GAME_OVER_LOSE";
        p.logs.game_info.push({
          "game_status": gameState.gamePhase,
          "data": { score: gameState.player.score, reason: "spawn_collision" },
          "framecount": p.frameCount,
          "timestamp": Date.now()
        });
        return;
      }
      
      // 4. Check for Game Over (Cannot place blocks anywhere)
      if (!canPlaceAnyBlock()) {
        gameState.gamePhase = "GAME_OVER_LOSE";
        p.logs.game_info.push({
          "game_status": gameState.gamePhase,
          "data": { score: gameState.player.score, reason: "no_placement" },
          "framecount": p.frameCount,
          "timestamp": Date.now()
        });
      }
    }
  }
});

// Add setControlMode function
function setControlMode(mode) {
  // Only 'HUMAN' mode is supported now
  if (mode === "HUMAN") {
    gameState.controlMode = mode;
    
    // Update button states: only the 'Human Mode' button exists
    document.querySelectorAll('.control-button').forEach(btn => btn.classList.remove('active'));
    const humanModeBtn = document.getElementById('humanModeBtn');
    if (humanModeBtn) {
      humanModeBtn.classList.add('active');
    }
    
    // Reset game when switching modes (or re-selecting human mode during gameplay)
    if (gameState.gamePhase === "PLAYING") {
      gameState.gamePhase = "START";
      resetGameState(true);
    }
  }
}

// Expose functions globally
window.setControlMode = setControlMode;
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    // Ensure levelNum is within bounds (0 to LEVELS.length - 1)
    if (levelNum >= 1 && levelNum <= LEVELS.length) {
        state.level.currentIndex = levelNum - 1;
        // Reset grid for the new level
        resetGameState(false);
        state.gamePhase = "PLAYING";
    }
  }
};