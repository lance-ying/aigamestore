// game.js - Main game file

import { gameState, getGameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { initializeGame } from './game_logic.js';
import { handleKeyPressed, processAutomatedInput } from './input_handler.js';
import { 
  renderStartScreen, 
  renderPlayingScreen, 
  renderPausedIndicator,
  renderGameOverScreen 
} from './rendering.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize the logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize player
    gameState.player = new Player(30, 30);
    gameState.entities = [gameState.player];
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    gameState.player.logState(p);
  };
  
  p.draw = function() {
    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      renderPlayingScreen(p);
      
      // Process automated testing input
      if (gameState.controlMode !== "HUMAN") {
        if (p.frameCount % 10 === 0) { // Slow down automated input
          const action = get_automated_testing_action(gameState);
          if (action) {
            processAutomatedInput(p, action);
          }
        }
      }
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderPlayingScreen(p);
      renderPausedIndicator(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOverScreen(p);
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
      
      // Special handling for game phase transitions
      if (p.keyCode === 13 && gameState.gamePhase === GAME_PHASES.START) {
        initializeGame();
      }
    }
    
    // Allow ESC and R in all modes
    if (p.keyCode === 27 || p.keyCode === 82) {
      handleKeyPressed(p, p.key, p.keyCode);
      
      if (p.keyCode === 82 && (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
                                gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE)) {
        // Reset on restart
        gameState.entities = [gameState.player];
      }
    }
    
    // Prevent default behavior
    return false;
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
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // If switching to automated mode while in START phase, auto-start
  if (mode !== 'HUMAN' && gameState.gamePhase === GAME_PHASES.START) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    initializeGame();
    gameInstance.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: gameInstance.frameCount,
      timestamp: Date.now()
    });
  }
};

export default gameInstance;