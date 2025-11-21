import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { GameLogic } from './gameLogic.js';
import { UI } from './ui.js';
import { TestController } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let gameLogic;
  let ui;
  let testController;
  
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game systems
    gameLogic = new GameLogic(p);
    ui = new UI(p);
    testController = new TestController(gameLogic);
    
    gameLogic.init();
    
    // Log initial state
    p.logs.game_info.push({
      data: { event: "game_initialized", phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Clear background
    p.background(20, 30, 50);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const action = testController.getAction();
      testController.executeAction(action);
    }
    
    // Update game logic
    gameLogic.update();
    
    // Render based on game phase
    if (gameState.gamePhase === PHASE_START) {
      ui.drawStartScreen();
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      ui.drawGamePlaying();
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      ui.drawPausedScreen();
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
      ui.drawGameOver(true);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      ui.drawGameOver(false);
    }
    
    // Log player info
    if (gameState.player && p.frameCount % 30 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.screenX,
        screen_y: gameState.player.screenY,
        game_x: gameState.player.gameX,
        game_y: gameState.player.gameY,
        framecount: p.frameCount
      });
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      gameLogic.handleKeyPressed(p.keyCode);
    }
    return false;
  };
  
  p.keyReleased = function() {
    if (gameState.controlMode === "HUMAN") {
      gameLogic.handleKeyReleased(p.keyCode);
    }
    return false;
  };
});

// Expose game instance and state globally
window.gameInstance = gameInstance;
window.getGameState = function() {
  return gameState;
};

// Control mode switcher
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === "HUMAN") {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === "TEST_1") {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === "TEST_2") {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};