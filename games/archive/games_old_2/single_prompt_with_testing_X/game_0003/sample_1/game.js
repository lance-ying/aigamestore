// game.js - Main game file
import { 
  gameState, getGameState,
  CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS,
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
  PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE
} from './globals.js';
import { Player } from './player.js';
import { LevelGenerator } from './level_generator.js';
import { 
  drawStartScreen, drawPausedIndicator, 
  drawGameOverScreen, drawHUD, drawBackground 
} from './ui.js';
import { handleKeyPressed, handleAutomatedInput } from './input_handler.js';
import { updateGame } from './game_logic.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let levelGenerator;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Initialize game state
    gameState.player = new Player(p, 150, CANVAS_HEIGHT / 2);
    gameState.entities = [gameState.player];
    gameState.baseSpeed = 2;
    gameState.currentSpeed = 2;
    
    // Initialize level generator
    levelGenerator = new LevelGenerator(p);
    levelGenerator.generateLevel(gameState.level);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Background
    drawBackground(p, gameState.backgroundOffset);
    
    // Handle different game phases
    if (gameState.gamePhase === PHASE_START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      // Handle automated testing
      if (gameState.controlMode !== "HUMAN") {
        const action = get_automated_testing_action(gameState);
        handleAutomatedInput(p, action);
      }
      
      // Update game
      updateGame(p);
      
      // Render game
      renderGame(p);
      
      // Draw HUD
      drawHUD(p);
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      // Render game (frozen)
      renderGame(p);
      drawHUD(p);
      drawPausedIndicator(p);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
      renderGame(p);
      drawGameOverScreen(p, true);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      renderGame(p);
      drawGameOverScreen(p, false);
    }
  };
  
  function renderGame(p) {
    // Draw obstacles
    for (let obstacle of gameState.obstacles) {
      obstacle.draw(gameState.cameraOffsetX);
    }
    
    // Draw diamonds
    for (let diamond of gameState.diamonds) {
      diamond.draw(gameState.cameraOffsetX);
    }
    
    // Draw finish line
    levelGenerator.drawFinishLine(gameState.cameraOffsetX);
    
    // Draw player (fixed on screen)
    gameState.player.draw(gameState.jellyFeverActive);
  }
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
    return false; // Prevent default
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Reset game when changing modes if in game over state
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
      gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
    gameState.gamePhase = PHASE_START;
    gameState.score = 0;
    gameState.level = 1;
    gameState.distance = 0;
    gameState.combo = 0;
    gameState.jellyFeverActive = false;
    gameState.currentSpeed = gameState.baseSpeed;
    gameState.cameraOffsetX = 0;
    gameState.backgroundOffset = 0;
    gameState.obstaclesPassed = 0;
  }
};