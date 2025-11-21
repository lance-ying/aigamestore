// game.js - Main game file

import { gameState, levelData, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initLevel, getCurrentLevel } from './levelManager.js';
import { LetterWheel } from './letterWheel.js';
import { renderStartScreen, renderPlayingScreen, renderGameOverScreen } from './rendering.js';
import { TestController } from './testController.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let letterWheel;
  let testController;
  
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.randomSeed(42);
    p.frameRate(60);
    
    // Initialize letter wheel
    letterWheel = new LetterWheel(p, CANVAS_WIDTH / 2, 360, 80);
    
    // Initialize test controller
    testController = new TestController();
    
    // Load high score
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('wordConnectHighScore');
      if (saved) {
        gameState.highScore = parseInt(saved);
      }
    }
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        renderPlayingScreen(p, letterWheel);
        
        // Update hovered letter
        if (gameState.controlMode === "HUMAN") {
          gameState.hoveredLetterIndex = letterWheel.getLetterIndexAt(p.mouseX, p.mouseY);
        }
        
        // Test controller update
        if (gameState.controlMode !== "HUMAN") {
          testController.update(p, letterWheel);
        }
        break;
        
      case GAME_PHASES.PAUSED:
        renderPlayingScreen(p, letterWheel);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOverScreen(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    const keyCode = p.keyCode;
    
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Global controls
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        gameState.score = 0;
        initLevel(0);
        const level = getCurrentLevel();
        letterWheel.setup(level.letters);
        
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase, level: 0 },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        gameState.gamePhase = GAME_PHASES.START;
        gameState.currentLevelIndex = 0;
        
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase, message: "Restarted to menu" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Gameplay controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === "HUMAN") {
      if ([37, 39, 32, 90].includes(keyCode)) {
        letterWheel.handleKeyboardNavigation(keyCode);
      }
    }
    
    return false;
  };
  
  p.mousePressed = function() {
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === "HUMAN") {
      letterWheel.handleMousePressed(p.mouseX, p.mouseY);
    }
  };
  
  p.mouseDragged = function() {
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === "HUMAN") {
      letterWheel.handleMouseDragged(p.mouseX, p.mouseY);
    }
  };
  
  p.mouseReleased = function() {
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode === "HUMAN") {
      letterWheel.handleMouseReleased();
    }
  };
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button styles
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === "TEST_1") {
    document.getElementById('test_1_ModeBtn').classList.add('active');
    gameInstance._setupTest("TEST_1");
  } else if (mode === "TEST_2") {
    document.getElementById('test_2_ModeBtn').classList.add('active');
    gameInstance._setupTest("TEST_2");
  }
};

// Setup test helper
gameInstance._setupTest = function(mode) {
  const testController = new TestController();
  testController.setupTest(mode);
  gameInstance.testController = testController;
};