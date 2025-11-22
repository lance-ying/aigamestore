import { GRID_SIZE, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, gameState, resetGameState, getGameState } from './globals.js';
import { generateBlocks, canPlaceBlock, placeBlock, checkLines, canPlaceAnyBlock } from './blocks.js';
import { drawGrid, drawAvailableBlocks, drawCurrentBlock, drawScore, drawStartScreen, drawPauseScreen, drawGameOverScreen } from './render.js';
import { game_testing_controller } from './automated_testing_controller.js';

// Expose getGameState globally
window.getGameState = getGameState;

// Set up the game instance
const p5 = window.p5;
let gameInstance = new p5(p => {
  // Initialize variables
  let keyStates = {};
  
  // Initialize the logs
  p.logs = {
    "game_info": [],
    "player_info": [],
    "inputs": []
  };
  
  // Setup function
  p.setup = function() {
    p.createCanvas(600, 400);
    p.frameRate(60);
    p.randomSeed(42);
    
    resetGameState();
    
    // Log initial game state
    logGameInfo("START", {}, p.frameCount);
  };
  
  // Draw function
  p.draw = function() {
    p.background(30);
    
    // Handle automated testing
    if (gameState.gamePhase === "PLAYING" && gameState.controlMode !== "HUMAN") {
      const testAction = game_testing_controller(gameState);
      if (testAction !== null) {
        handleTestInput(testAction);
      }
    }
    
    // Update and render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        drawStartScreen(p);
        break;
        
      case "PLAYING":
        updateGame();
        drawGrid(p);
        drawAvailableBlocks(p);
        drawCurrentBlock(p);
        drawScore(p);
        break;
        
      case "PAUSED":
        drawGrid(p);
        drawAvailableBlocks(p);
        drawScore(p);
        drawPauseScreen(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        drawGrid(p);
        drawAvailableBlocks(p);
        drawScore(p);
        drawGameOverScreen(p);
        break;
    }
  };
  
  // Update game state
  function updateGame() {
    // Check if game is over
    if (!canPlaceAnyBlock()) {
      gameState.gamePhase = "GAME_OVER_LOSE";
      logGameInfo("GAME_OVER_LOSE", { score: gameState.score }, p.frameCount);
    }
  }
  
  // Handle key pressed
  p.keyPressed = function() {
    // Log key input
    logInput("keyPressed", { key: p.key, keyCode: p.keyCode }, p.frameCount);
    
    keyStates[p.keyCode] = true;
    
    switch (gameState.gamePhase) {
      case "START":
        if (p.keyCode === 13) { // ENTER
          startGame();
        }
        break;
        
      case "PLAYING":
        if (gameState.controlMode === "HUMAN") {
          handlePlayingControls(p.keyCode);
        }
        
        if (p.keyCode === 27) { // ESC
          gameState.gamePhase = "PAUSED";
          logGameInfo("PAUSED", {}, p.frameCount);
        }
        break;
        
      case "PAUSED":
        if (p.keyCode === 27) { // ESC
          gameState.gamePhase = "PLAYING";
          logGameInfo("PLAYING", {}, p.frameCount);
        } else if (p.keyCode === 82) { // R
          resetGame();
        }
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        if (p.keyCode === 82) { // R
          resetGame();
        }
        break;
    }
    
    // Prevent default behavior for game keys
    if ([32, 37, 38, 39, 40].includes(p.keyCode)) {
      return false;
    }
  };
  
  // Handle key released
  p.keyReleased = function() {
    // Log key input
    logInput("keyReleased", { key: p.key, keyCode: p.keyCode }, p.frameCount);
    
    keyStates[p.keyCode] = false;
  };
  
  // Handle test input
  function handleTestInput(keyCode) {
    if (gameState.gamePhase !== "PLAYING") return;
    
    handlePlayingControls(keyCode);
  }
  
  // Handle controls during gameplay
  function handlePlayingControls(keyCode) {
    switch (keyCode) {
      case 37: // Left arrow
        if (gameState.currentBlockX > 0) {
          gameState.currentBlockX--;
          logPlayerInfo(p.frameCount);
        }
        break;
        
      case 39: // Right arrow
        const block = gameState.availableBlocks[gameState.selectedBlockIndex];
        if (gameState.currentBlockX < GRID_SIZE - block.width) {
          gameState.currentBlockX++;
          logPlayerInfo(p.frameCount);
        }
        break;
        
      case 38: // Up arrow
        if (gameState.currentBlockY > 0) {
          gameState.currentBlockY--;
          logPlayerInfo(p.frameCount);
        }
        break;
        
      case 40: // Down arrow
        const currentBlock = gameState.availableBlocks[gameState.selectedBlockIndex];
        if (gameState.currentBlockY < GRID_SIZE - currentBlock.height) {
          gameState.currentBlockY++;
          logPlayerInfo(p.frameCount);
        }
        break;
        
      case 90: // Z key (cycle blocks)
        gameState.selectedBlockIndex = (gameState.selectedBlockIndex + 1) % gameState.availableBlocks.length;
        // Reset position if the new block would be out of bounds
        const newBlock = gameState.availableBlocks[gameState.selectedBlockIndex];
        if (gameState.currentBlockX + newBlock.width > GRID_SIZE) {
          gameState.currentBlockX = GRID_SIZE - newBlock.width;
        }
        if (gameState.currentBlockY + newBlock.height > GRID_SIZE) {
          gameState.currentBlockY = GRID_SIZE - newBlock.height;
        }
        logPlayerInfo(p.frameCount);
        break;
        
      case 32: // Space (place block)
        const selectedBlock = gameState.availableBlocks[gameState.selectedBlockIndex];
        if (canPlaceBlock(selectedBlock, gameState.currentBlockX, gameState.currentBlockY)) {
          placeBlock(selectedBlock, gameState.currentBlockX, gameState.currentBlockY);
          
          // Check for completed lines
          const linesCleared = checkLines();
          
          // Update score
          if (linesCleared > 0) {
            // Update combo
            gameState.combo++;
            gameState.lastClearedLines = linesCleared;
            
            // Calculate score with combo multiplier
            const scoreIncrease = linesCleared * gameState.combo * 100;
            gameState.score += scoreIncrease;
            
            // Update high score if needed
            if (gameState.score > gameState.highScore) {
              gameState.highScore = gameState.score;
            }
            
            gameState.lastPlacedTime = p.frameCount;
          } else {
            // Reset combo if no lines were cleared
            gameState.combo = 1;
          }
          
          // Replace the used block
          gameState.availableBlocks.splice(gameState.selectedBlockIndex, 1);
          gameState.availableBlocks.push(generateBlocks(p)[0]);
          
          // Adjust selected index if needed
          if (gameState.selectedBlockIndex >= gameState.availableBlocks.length) {
            gameState.selectedBlockIndex = 0;
          }
          
          // Reset position
          gameState.currentBlockX = 0;
          gameState.currentBlockY = 0;
          
          logPlayerInfo(p.frameCount);
        }
        break;
    }
  }
  
  // Start the game
  function startGame() {
    resetGameState();
    
    // Generate initial blocks
    gameState.availableBlocks = generateBlocks(p);
    
    // Set game phase to playing
    gameState.gamePhase = "PLAYING";
    logGameInfo("PLAYING", {}, p.frameCount);
    
    // Log initial player info
    logPlayerInfo(p.frameCount);
  }
  
  // Reset the game
  function resetGame() {
    resetGameState();
    logGameInfo("START", {}, p.frameCount);
  }
  
  // Log game info
  function logGameInfo(status, data, framecount) {
    p.logs.game_info.push({
      "game_status": status,
      "data": data,
      "framecount": framecount,
      "timestamp": Date.now()
    });
  }
  
  // Log player info
  function logPlayerInfo(framecount) {
    p.logs.player_info.push({
      "screen_x": GRID_OFFSET_X + gameState.currentBlockX * CELL_SIZE,
      "screen_y": GRID_OFFSET_Y + gameState.currentBlockY * CELL_SIZE,
      "game_x": gameState.currentBlockX,
      "game_y": gameState.currentBlockY,
      "framecount": framecount,
      "timestamp": Date.now()
    });
  }
  
  // Log input
  function logInput(input_type, data, framecount) {
    p.logs.inputs.push({
      "input_type": input_type,
      "data": data,
      "framecount": framecount,
      "timestamp": Date.now()
    });
  }
});

// Expose the game instance globally
window.gameInstance = gameInstance;

// Function to set control mode
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(button => {
    button.classList.remove('active');
  });
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else {
    document.getElementById(`${mode.toLowerCase()}_ModeBtn`).classList.add('active');
  }
  
  // Log control mode change
  gameInstance.logs.game_info.push({
    "game_status": gameState.gamePhase,
    "data": { "controlMode": mode },
    "framecount": gameInstance.frameCount,
    "timestamp": Date.now()
  });
};