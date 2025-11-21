// game.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, resetGameState } from './globals.js';
import { Player } from './player.js';
import { getAvailableDirections } from './scenes.js';
import { renderStartScreen, renderPlayingScreen, renderPausedScreen, renderGameOverScreen } from './renderer.js';
import { handleKeyPressed, processAutomatedAction, logPlayerInfo } from './input.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Initialize game
    resetGameState();
    gameState.player = new Player();
    gameState.availableDirections = getAvailableDirections(gameState.currentScene, gameState);
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, action: "initialize" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    logPlayerInfo(p);
  };
  
  p.draw = function() {
    p.background(40, 50, 60);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action) {
        processAutomatedAction(p, action);
      }
    }
    
    // Update game state
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.player) {
        gameState.player.update(p);
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        renderStartScreen(p);
        break;
      case GAME_PHASES.PLAYING:
        renderPlayingScreen(p);
        break;
      case GAME_PHASES.PAUSED:
        renderPausedScreen(p);
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        renderGameOverScreen(p);
        break;
    }
  };
  
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
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn'];
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
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};