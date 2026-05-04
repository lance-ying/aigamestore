// game.js
import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  TARGET_FPS,
  PHASE_PLAYING,
  MODE_HUMAN
} from './globals.js';
import { PuzzleManager } from './puzzle_manager.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input_handler.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let puzzleManager;
  let renderer;
  let inputHandler;
  
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
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize game systems
    puzzleManager = new PuzzleManager();
    renderer = new Renderer(p, puzzleManager);
    inputHandler = new InputHandler(p, puzzleManager);
    
    // Initialize player info
    gameState.player.screenX = CANVAS_WIDTH / 2;
    gameState.player.screenY = CANVAS_HEIGHT / 2;
  };
  
  p.draw = function() {
    // Update frame counter for action tracking
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.framesSinceLastAction++;
    }
    
    // Handle automated testing
    if (gameState.controlMode !== MODE_HUMAN && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action !== null) {
        inputHandler.handleKeyPressed(action, String.fromCharCode(action));
      }
    }
    
    // Update systems
    inputHandler.update();
    
    // Render
    renderer.render();
    inputHandler.renderMessages();
    
    // Log player info periodically
    if (p.frameCount % 60 === 0 && gameState.gamePhase === PHASE_PLAYING) {
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
    if (gameState.controlMode === MODE_HUMAN) {
      inputHandler.handleKeyPressed(p.keyCode, p.key);
    }
    return false;
  };
}, document.body);

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
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
};

export default gameInstance;