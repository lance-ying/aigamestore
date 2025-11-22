// game.js - Main game file

import { gameState, GAME_PHASE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { GameMap } from './map.js';
import { renderGame } from './renderer.js';
import { handleKeyPressed } from './input.js';
import { BasicTestController, WinTestController } from './testing.js';

const p5 = window.p5;

let testController = null;

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
    // Removed fixed random seed to allow proper random event placement
    
    // Load high score
    try {
      const savedHighScore = localStorage.getItem('adventureStarHighScore');
      if (savedHighScore) {
        gameState.highScore = parseInt(savedHighScore);
      }
    } catch (e) {
      console.log('Could not load high score');
    }
    
    // Log initial state
    p.logs.game_info.push({
      data: 'Game Initialized',
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== 'HUMAN' && testController) {
      const action = testController.update(p);
      if (action) {
        simulateKeyPress(p, action.keyCode);
      }
    }

    // Update game state
    updateGame(p);
    
    // Render
    renderGame(p);
  };

  p.keyPressed = function() {
    if (gameState.controlMode === 'HUMAN') {
      handleKeyPressed(p);
    }
    return false; // Prevent default browser behavior
  };

  function updateGame(p) {
    if (gameState.gamePhase === GAME_PHASE.PLAYING) {
      // Update player
      if (gameState.player) {
        gameState.player.update(p);
        
        // Check for game over
        if (gameState.player.hp <= 0) {
          updateHighScore();
          gameState.gamePhase = GAME_PHASE.GAME_OVER_LOSE;
          p.logs.game_info.push({
            data: 'Game Over - Lose',
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
      
      // Update event message timer
      if (gameState.eventMessageTimer > 0) {
        gameState.eventMessageTimer--;
      }
    } else if (gameState.gamePhase === GAME_PHASE.LEVEL_TRANSITION) {
      gameState.levelTransitionTimer--;
      
      if (gameState.levelTransitionTimer <= 0) {
        // Start next level
        startLevel(p, gameState.currentLevel);
      }
    }
  }

  function startLevel(p, level) {
    gameState.currentMap = new GameMap(level);
    gameState.player.gridX = gameState.currentMap.startX;
    gameState.player.gridY = gameState.currentMap.startY;
    gameState.needsInteraction = false;
    gameState.eventMessage = "";
    gameState.eventMessageTimer = 0;
    
    gameState.gamePhase = GAME_PHASE.PLAYING;
    
    p.logs.game_info.push({
      data: `Level ${level} Started`,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    p.logs.player_info.push({
      screen_x: gameState.player.getScreenX(),
      screen_y: gameState.player.getScreenY(),
      game_x: gameState.player.gridX,
      game_y: gameState.player.gridY,
      framecount: p.frameCount
    });
  }

  function updateHighScore() {
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      try {
        localStorage.setItem('adventureStarHighScore', gameState.highScore.toString());
      } catch (e) {
        console.log('Could not save high score');
      }
    }
  }

  function simulateKeyPress(p, keyCode) {
    p.keyCode = keyCode;
    
    // Set key character
    if (keyCode === 37) p.key = 'ArrowLeft';
    else if (keyCode === 38) p.key = 'ArrowUp';
    else if (keyCode === 39) p.key = 'ArrowRight';
    else if (keyCode === 40) p.key = 'ArrowDown';
    else if (keyCode === 32) p.key = ' ';
    else if (keyCode === 13) p.key = 'Enter';
    else if (keyCode === 27) p.key = 'Escape';
    else if (keyCode === 82) p.key = 'r';
    else p.key = String.fromCharCode(keyCode);
    
    handleKeyPressed(p);
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return {
    phase: gameState.gamePhase,
    gamePhase: gameState.gamePhase,
    score: gameState.score,
    currentLevel: gameState.currentLevel,
    hp: gameState.player ? gameState.player.hp : 0
  };
};

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Initialize test controller if needed
  if (mode === 'TEST_1') {
    testController = new BasicTestController();
  } else if (mode === 'TEST_2') {
    testController = new WinTestController();
  } else {
    testController = null;
  }
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : mode.toLowerCase() + '_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log('Control mode set to:', mode);
};