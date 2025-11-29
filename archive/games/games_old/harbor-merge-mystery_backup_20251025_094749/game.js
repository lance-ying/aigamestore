// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, LEVEL_CONFIG } from './globals.js';
import { initializeGrid, spawnRandomItem, getAllItems } from './grid.js';
import { initializeOrders, addNewOrder } from './orders.js';
import { handleKeyPressed, handleMousePressed, handleMouseReleased, checkGameOver, initializeLevel } from './input.js';
import { renderStartScreen, renderGamePlay, renderPausedScreen, renderLevelTransition, renderGameOverScreen } from './rendering.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Load high score
    if (typeof localStorage !== 'undefined') {
      const savedHighScore = localStorage.getItem('harborMergeHighScore');
      if (savedHighScore) {
        gameState.highScore = parseInt(savedHighScore);
      }
    }
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        renderGamePlay(p);
        updateGameLogic(p);
        break;
        
      case "PAUSED":
        renderPausedScreen(p);
        break;
        
      case "LEVEL_TRANSITION":
        renderLevelTransition(p);
        updateLevelTransition(p);
        break;
        
      case "GAME_OVER_WIN":
        renderGameOverScreen(p, true);
        break;
        
      case "GAME_OVER_LOSE":
        renderGameOverScreen(p, false);
        break;
    }
    
    // Log player info periodically
    if (gameState.gamePhase === "PLAYING" && p.frameCount % 60 === 0) {
      logPlayerInfo(p);
    }
  };
  
  function updateGameLogic(p) {
    // Update spawn timer
    const config = LEVEL_CONFIG[gameState.currentLevel];
    gameState.spawnTimer++;
    
    if (gameState.spawnTimer >= config.spawnInterval) {
      gameState.spawnTimer = 0;
      spawnRandomItem();
      
      // Maybe add a new order
      if (Math.random() < 0.3 && gameState.orders.length < 5) {
        addNewOrder();
      }
    }
    
    // Check for game over
    checkGameOver(p);
  }
  
  function updateLevelTransition(p) {
    gameState.transitionTimer--;
    
    if (gameState.transitionTimer <= 0) {
      gameState.currentLevel++;
      initializeLevel(p, gameState.currentLevel);
      gameState.gamePhase = "PLAYING";
      
      p.logs.game_info.push({
        data: { phase: "PLAYING", level: gameState.currentLevel + 1 },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  function logPlayerInfo(p) {
    const items = getAllItems();
    if (items.length > 0) {
      const firstItem = items[0];
      p.logs.player_info.push({
        screen_x: firstItem.screenX,
        screen_y: firstItem.screenY,
        game_x: firstItem.gridX,
        game_y: firstItem.gridY,
        framecount: p.frameCount
      });
    }
  }
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
    return false;
  };
  
  p.mousePressed = function() {
    handleMousePressed(p);
  };
  
  p.mouseReleased = function() {
    handleMouseReleased(p);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                            mode === 'TEST_1' ? 'test_1_ModeBtn' : 'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Start automated testing if needed
  if (mode !== 'HUMAN') {
    startAutomatedTesting(mode);
  }
};

function startAutomatedTesting(mode) {
  // Simple automated testing
  const testInterval = setInterval(() => {
    if (gameState.controlMode !== mode) {
      clearInterval(testInterval);
      return;
    }
    
    if (gameState.gamePhase === "START") {
      // Press ENTER to start
      gameInstance.keyPressed = function() {};
      handleKeyPressed(gameInstance, 'Enter', 13);
    } else if (gameState.gamePhase === "PLAYING") {
      // Randomly select and merge items
      if (mode === 'TEST_1') {
        // Basic testing: random movements
        const randomKey = [37, 38, 39, 40][Math.floor(Math.random() * 4)];
        handleKeyPressed(gameInstance, '', randomKey);
        
        if (Math.random() < 0.1) {
          handleKeyPressed(gameInstance, ' ', 32); // SPACE
        }
      } else if (mode === 'TEST_2') {
        // Win testing: try to fulfill orders efficiently
        const items = getAllItems();
        if (items.length > 0 && gameState.orders.length > 0) {
          const order = gameState.orders[0];
          const matchingItem = items.find(item => 
            item.itemType === order.itemType && item.level === order.level
          );
          
          if (matchingItem) {
            gameState.selectedItem = matchingItem;
            handleKeyPressed(gameInstance, 'z', 90); // Z to fulfill
          } else {
            // Try to merge items
            handleKeyPressed(gameInstance, ' ', 32);
          }
        }
      }
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      handleKeyPressed(gameInstance, 'r', 82); // R to restart
      clearInterval(testInterval);
    }
  }, 100);
}