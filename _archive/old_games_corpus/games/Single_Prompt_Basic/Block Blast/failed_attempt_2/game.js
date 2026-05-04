import { 
  gameState, 
  GRID_SIZE, 
  CELL_SIZE, 
  GRID_OFFSET_X, 
  GRID_OFFSET_Y, 
  BLOCK_PREVIEW_X, 
  BLOCK_PREVIEW_Y, 
  PREVIEW_CELL_SIZE,
  generateNewBlocks,
  canPlaceBlock,
  placeBlock,
  clearCompletedLines,
  checkGameOver,
  resetGame
} from './globals.js';

import { game_testing_controller } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize variables
  let lastFrameControlMode = "HUMAN";
  let completedLines = { completedRows: [], completedCols: [] };
  let animationTime = 0;
  let keysPressed = {};
  
  // Initialize the logs
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
    resetGame();
    
    // Log game start
    p.logs.game_info.push({
      "game_status": gameState.gamePhase,
      "data": {},
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  };
  
  p.draw = function() {
    p.background(40);
    
    // Check for control mode changes
    if (lastFrameControlMode !== gameState.controlMode) {
      p.logs.game_info.push({
        "game_status": "CONTROL_MODE_CHANGED",
        "data": { "controlMode": gameState.controlMode },
        "framecount": p.frameCount,
        "timestamp": Date.now()
      });
      lastFrameControlMode = gameState.controlMode;
    }
    
    // Handle automated testing
    if (gameState.gamePhase === "PLAYING" && gameState.controlMode !== "HUMAN") {
      const actionKeyCode = game_testing_controller(gameState);
      if (actionKeyCode) {
        handleAutomatedAction(actionKeyCode);
      }
    }
    
    // Draw game based on game phase
    switch (gameState.gamePhase) {
      case "START":
        drawStartScreen();
        break;
      case "PLAYING":
        drawPlayingScreen();
        handleGameLogic();
        break;
      case "PAUSED":
        drawPlayingScreen();
        drawPauseOverlay();
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        drawPlayingScreen();
        drawGameOverScreen();
        break;
    }
  };
  
  // Draw the start screen
  function drawStartScreen() {
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(36);
    p.text("BLOCK BLAST", p.width/2, 80);
    
    p.textSize(18);
    p.text("Place blocks on the 9x9 grid to fill rows and columns", p.width/2, 130);
    p.text("Clear lines to score points and make room for more blocks", p.width/2, 160);
    p.text("Game ends when you can't place any more blocks", p.width/2, 190);
    
    p.textSize(16);
    p.text("Controls:", p.width/2, 230);
    p.text("Arrow Keys: Move cursor/block", p.width/2, 255);
    p.text("SPACE: Place block", p.width/2, 280);
    p.text("Z: Cycle through blocks", p.width/2, 305);
    p.text("ESC: Pause game", p.width/2, 330);
    
    p.textSize(24);
    p.text("PRESS ENTER TO START", p.width/2, 370);
  }
  
  // Draw the game grid and UI
  function drawPlayingScreen() {
    // Draw grid background
    p.fill(20);
    p.stroke(60);
    p.rect(GRID_OFFSET_X - 5, GRID_OFFSET_Y - 5, GRID_SIZE * CELL_SIZE + 10, GRID_SIZE * CELL_SIZE + 10);
    
    // Draw grid cells
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const x = GRID_OFFSET_X + col * CELL_SIZE;
        const y = GRID_OFFSET_Y + row * CELL_SIZE;
        
        // Draw cell
        p.stroke(60);
        p.fill(30);
        p.rect(x, y, CELL_SIZE, CELL_SIZE);
        
        // Draw block if cell is filled
        if (gameState.grid[row][col] !== 0) {
          p.fill(gameState.grid[row][col].color);
          p.rect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        }
      }
    }
    
    // Highlight completed lines with animation
    if (completedLines.completedRows.length > 0 || completedLines.completedCols.length > 0) {
      animationTime += 0.1;
      const alpha = Math.abs(Math.sin(animationTime * 5)) * 150 + 50;
      
      p.noStroke();
      p.fill(255, 255, 255, alpha);
      
      for (const row of completedLines.completedRows) {
        p.rect(GRID_OFFSET_X, GRID_OFFSET_Y + row * CELL_SIZE, GRID_SIZE * CELL_SIZE, CELL_SIZE);
      }
      
      for (const col of completedLines.completedCols) {
        p.rect(GRID_OFFSET_X + col * CELL_SIZE, GRID_OFFSET_Y, CELL_SIZE, GRID_SIZE * CELL_SIZE);
      }
    }
    
    // Draw cursor
    const cursorX = GRID_OFFSET_X + gameState.cursorX * CELL_SIZE;
    const cursorY = GRID_OFFSET_Y + gameState.cursorY * CELL_SIZE;
    p.stroke(255, 200, 0);
    p.noFill();
    p.rect(cursorX, cursorY, CELL_SIZE, CELL_SIZE);
    
    // Draw selected block preview at cursor position
    if (gameState.availableBlocks.length > 0) {
      const selectedBlock = gameState.availableBlocks[gameState.selectedBlockIndex];
      const shape = selectedBlock.type.shape;
      const canPlace = canPlaceBlock(selectedBlock.type, gameState.cursorX, gameState.cursorY);
      
      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col] === 1) {
            const x = GRID_OFFSET_X + (gameState.cursorX + col) * CELL_SIZE;
            const y = GRID_OFFSET_Y + (gameState.cursorY + row) * CELL_SIZE;
            
            p.fill(...(canPlace ? [...selectedBlock.type.color, 150] : [255, 0, 0, 150]));
            p.noStroke();
            p.rect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
          }
        }
      }
    }
    
    // Draw available blocks preview
    p.fill(255);
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    p.text("Available Blocks:", 20, 70);
    
    for (let i = 0; i < gameState.availableBlocks.length; i++) {
      const block = gameState.availableBlocks[i];
      const shape = block.type.shape;
      const isSelected = i === gameState.selectedBlockIndex;
      
      // Draw selection indicator
      if (isSelected) {
        p.stroke(255, 200, 0);
        p.noFill();
        p.rect(
          BLOCK_PREVIEW_X - 5, 
          BLOCK_PREVIEW_Y + i * 60 - 5, 
          shape[0].length * PREVIEW_CELL_SIZE + 10, 
          shape.length * PREVIEW_CELL_SIZE + 10
        );
      }
      
      // Draw block
      p.fill(block.type.color);
      p.noStroke();
      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[0].length; col++) {
          if (shape[row][col] === 1) {
            p.rect(
              BLOCK_PREVIEW_X + col * PREVIEW_CELL_SIZE, 
              BLOCK_PREVIEW_Y + i * 60 + row * PREVIEW_CELL_SIZE, 
              PREVIEW_CELL_SIZE, 
              PREVIEW_CELL_SIZE
            );
          }
        }
      }
    }
    
    // Draw score
    p.fill(255);
    p.textSize(20);
    p.textAlign(p.LEFT, p.TOP);
    p.text("Score: " + gameState.score, 20, 20);
    
    // Draw high score
    p.textSize(16);
    p.text("High Score: " + gameState.highScore, 20, 45);
    
    // Draw combo
    if (gameState.combo > 0) {
      p.textSize(18);
      p.fill(255, 200, 0);
      p.text("Combo: x" + (gameState.combo + 1), 450, 20);
    }
  }
  
  // Draw pause overlay
  function drawPauseOverlay() {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, p.width, p.height);
    
    p.fill(255);
    p.textSize(16);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", p.width - 20, 20);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text("Press ESC to resume", p.width/2, p.height/2);
  }
  
  // Draw game over screen
  function drawGameOverScreen() {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, p.width, p.height);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(36);
    
    if (gameState.gamePhase === "GAME_OVER_WIN") {
      p.text("YOU WIN!", p.width/2, p.height/2 - 40);
    } else {
      p.text("GAME OVER", p.width/2, p.height/2 - 40);
    }
    
    p.textSize(24);
    p.text("Final Score: " + gameState.score, p.width/2, p.height/2 + 10);
    
    if (gameState.score > gameState.highScore) {
      p.fill(255, 255, 0);
      p.text("NEW HIGH SCORE!", p.width/2, p.height/2 + 50);
    }
    
    p.fill(255);
    p.textSize(20);
    p.text("PRESS R TO RESTART", p.width/2, p.height/2 + 90);
  }
  
  // Handle game logic
  function handleGameLogic() {
    // Check for completed lines
    completedLines = {
      completedRows: [],
      completedCols: []
    };
    
    for (let row = 0; row < GRID_SIZE; row++) {
      let isRowComplete = true;
      for (let col = 0; col < GRID_SIZE; col++) {
        if (gameState.grid[row][col] === 0) {
          isRowComplete = false;
          break;
        }
      }
      if (isRowComplete) {
        completedLines.completedRows.push(row);
      }
    }
    
    for (let col = 0; col < GRID_SIZE; col++) {
      let isColComplete = true;
      for (let row = 0; row < GRID_SIZE; row++) {
        if (gameState.grid[row][col] === 0) {
          isColComplete = false;
          break;
        }
      }
      if (isColComplete) {
        completedLines.completedCols.push(col);
      }
    }
    
    // Clear completed lines after a short delay
    if (p.frameCount % 30 === 0) {
      if (completedLines.completedRows.length > 0 || completedLines.completedCols.length > 0) {
        if (clearCompletedLines()) {
          // Reset animation time
          animationTime = 0;
          
          // Log line clear
          p.logs.game_info.push({
            "game_status": "LINES_CLEARED",
            "data": { 
              "rows": completedLines.completedRows.length,
              "cols": completedLines.completedCols.length,
              "score": gameState.score,
              "combo": gameState.combo
            },
            "framecount": p.frameCount,
            "timestamp": Date.now()
          });
          
          completedLines = {
            completedRows: [],
            completedCols: []
          };
        }
      }
    }
    
    // Check for game over
    if (checkGameOver()) {
      // Set high score
      if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
      }
      
      // Determine win or lose based on score
      const gameOverPhase = gameState.score >= 1000 ? "GAME_OVER_WIN" : "GAME_OVER_LOSE";
      gameState.gamePhase = gameOverPhase;
      
      // Log game over
      p.logs.game_info.push({
        "game_status": gameOverPhase,
        "data": { "finalScore": gameState.score },
        "framecount": p.frameCount,
        "timestamp": Date.now()
      });
    }
  }
  
  // Handle automated action
  function handleAutomatedAction(keyCode) {
    // Simulate key press
    switch (keyCode) {
      case 37: // LEFT
        moveCursor(-1, 0);
        break;
      case 38: // UP
        moveCursor(0, -1);
        break;
      case 39: // RIGHT
        moveCursor(1, 0);
        break;
      case 40: // DOWN
        moveCursor(0, 1);
        break;
      case 32: // SPACE
        placeSelectedBlock();
        break;
      case 90: // Z
        cycleSelectedBlock();
        break;
    }
    
    // Log the automated input
    p.logs.inputs.push({
      "input_type": "keyPressed",
      "data": { "key": "", "keyCode": keyCode },
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  }
  
  // Move cursor
  function moveCursor(dx, dy) {
    const newX = gameState.cursorX + dx;
    const newY = gameState.cursorY + dy;
    
    if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
      gameState.cursorX = newX;
      gameState.cursorY = newY;
      
      // Log player position
      p.logs.player_info.push({
        "screen_x": GRID_OFFSET_X + gameState.cursorX * CELL_SIZE,
        "screen_y": GRID_OFFSET_Y + gameState.cursorY * CELL_SIZE,
        "game_x": gameState.cursorX,
        "game_y": gameState.cursorY,
        "framecount": p.frameCount,
        "timestamp": Date.now()
      });
    }
  }
  
  // Place selected block
  function placeSelectedBlock() {
    if (gameState.availableBlocks.length === 0) {
      return;
    }
    
    const selectedBlock = gameState.availableBlocks[gameState.selectedBlockIndex];
    
    if (canPlaceBlock(selectedBlock.type, gameState.cursorX, gameState.cursorY)) {
      placeBlock(selectedBlock.type, gameState.cursorX, gameState.cursorY);
      
      // Log block placement
      p.logs.game_info.push({
        "game_status": "BLOCK_PLACED",
        "data": { 
          "blockType": selectedBlock.index,
          "x": gameState.cursorX,
          "y": gameState.cursorY
        },
        "framecount": p.frameCount,
        "timestamp": Date.now()
      });
    }
  }
  
  // Cycle selected block
  function cycleSelectedBlock() {
    if (gameState.availableBlocks.length > 0) {
      gameState.selectedBlockIndex = (gameState.selectedBlockIndex + 1) % gameState.availableBlocks.length;
      
      // Log block selection
      p.logs.game_info.push({
        "game_status": "BLOCK_SELECTED",
        "data": { "blockIndex": gameState.selectedBlockIndex },
        "framecount": p.frameCount,
        "timestamp": Date.now()
      });
    }
  }
  
  // Key pressed event
  p.keyPressed = function() {
    // Log key press
    p.logs.inputs.push({
      "input_type": "keyPressed",
      "data": { "key": p.key, "keyCode": p.keyCode },
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
    
    // Set key as pressed
    keysPressed[p.keyCode] = true;
    
    // Handle key press based on game phase
    switch (gameState.gamePhase) {
      case "START":
        if (p.keyCode === 13) { // ENTER
          gameState.gamePhase = "PLAYING";
          
          // Log game phase change
          p.logs.game_info.push({
            "game_status": gameState.gamePhase,
            "data": {},
            "framecount": p.frameCount,
            "timestamp": Date.now()
          });
        }
        break;
      case "PLAYING":
        if (gameState.controlMode === "HUMAN") {
          switch (p.keyCode) {
            case 37: // LEFT
              moveCursor(-1, 0);
              break;
            case 38: // UP
              moveCursor(0, -1);
              break;
            case 39: // RIGHT
              moveCursor(1, 0);
              break;
            case 40: // DOWN
              moveCursor(0, 1);
              break;
            case 32: // SPACE
              placeSelectedBlock();
              break;
            case 90: // Z
              cycleSelectedBlock();
              break;
            case 27: // ESC
              gameState.gamePhase = "PAUSED";
              
              // Log game phase change
              p.logs.game_info.push({
                "game_status": gameState.gamePhase,
                "data": {},
                "framecount": p.frameCount,
                "timestamp": Date.now()
              });
              break;
            case 82: // R
              resetGame();
              gameState.gamePhase = "START";
              
              // Log game phase change
              p.logs.game_info.push({
                "game_status": gameState.gamePhase,
                "data": {},
                "framecount": p.frameCount,
                "timestamp": Date.now()
              });
              break;
          }
        }
        break;
      case "PAUSED":
        if (p.keyCode === 27) { // ESC
          gameState.gamePhase = "PLAYING";
          
          // Log game phase change
          p.logs.game_info.push({
            "game_status": gameState.gamePhase,
            "data": {},
            "framecount": p.frameCount,
            "timestamp": Date.now()
          });
        } else if (p.keyCode === 82) { // R
          resetGame();
          gameState.gamePhase = "START";
          
          // Log game phase change
          p.logs.game_info.push({
            "game_status": gameState.gamePhase,
            "data": {},
            "framecount": p.frameCount,
            "timestamp": Date.now()
          });
        }
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        if (p.keyCode === 82) { // R
          resetGame();
          gameState.gamePhase = "START";
          
          // Log game phase change
          p.logs.game_info.push({
            "game_status": gameState.gamePhase,
            "data": {},
            "framecount": p.frameCount,
            "timestamp": Date.now()
          });
        }
        break;
    }
    
    return false; // Prevent default browser behavior
  };
  
  // Key released event
  p.keyReleased = function() {
    // Log key release
    p.logs.inputs.push({
      "input_type": "keyReleased",
      "data": { "key": p.key, "keyCode": p.keyCode },
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
    
    // Set key as released
    keysPressed[p.keyCode] = false;
    
    return false; // Prevent default browser behavior
  };
});

// Expose the game instance globally
window.gameInstance = gameInstance;