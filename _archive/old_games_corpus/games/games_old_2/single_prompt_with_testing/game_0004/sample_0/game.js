import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { handleKeyPressed, handleKeyReleased, processAutomatedInput } from './input_handler.js';
import { initializeMiniGame, updateGame } from './game_logic.js';
import { render } from './renderer.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game state
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    gameState.menuSelection = 0;
    gameState.currentMiniGame = null;
    gameState.miniGameState = null;
    gameState.score = 0;
    gameState.highScores = {};
    
    p.logs.game_info.push({
      data: { phase: "START", message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Process automated testing input
    processAutomatedInput(p);
    
    // Initialize mini-game when entering PLAYING phase
    if (gameState.gamePhase === "PLAYING" && !gameState.miniGameState && gameState.currentMiniGame !== null) {
      initializeMiniGame(p);
    }
    
    // Update game logic
    updateGame(p);
    
    // Render
    render(p);
  };

  p.keyPressed = function() {
    handleKeyPressed(p, p.keyCode);
    return false;
  };

  p.keyReleased = function() {
    handleKeyReleased(p, p.keyCode);
    return false;
  };
});

window.gameInstance = gameInstance;

// Control mode switcher
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
  
  // Reset test state when changing modes
  if (mode !== 'HUMAN') {
    const controller = window.get_automated_testing_action;
    if (controller && controller.testState) {
      controller.testState = {
        initialized: false,
        currentStep: 0,
        waitFrames: 0,
        gamesVisited: 0,
        actionQueue: []
      };
    }
  }
};