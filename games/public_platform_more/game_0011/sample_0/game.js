// game.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, FPS, getGameState } from './globals.js';
import { 
  drawStartScreen, 
  drawPausedIndicator, 
  drawGameOver, 
  drawPlayingScreen 
} from './rendering.js';
import { 
  initGame, 
  handleRoll, 
  handleDiceSelection, 
  handleCategorySelection, 
  confirmCategorySelection,
  updateAI
} from './game_logic.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

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
    p.frameRate(FPS);
    p.randomSeed(42);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action) {
        handleTestAction(action);
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        drawStartScreen(p);
        break;
        
      case GAME_PHASES.PLAYING:
        drawPlayingScreen(p);
        updateAI(p);
        
        // Log player info periodically
        if (p.frameCount % 30 === 0 && gameState.players.length > 0) {
          const player = gameState.players[0];
          p.logs.player_info.push({
            screen_x: 0,
            screen_y: 0,
            game_x: 0,
            game_y: 0,
            framecount: p.frameCount
          });
        }
        break;
        
      case GAME_PHASES.PAUSED:
        drawPlayingScreen(p);
        drawPausedIndicator(p);
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        drawGameOver(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Game phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        initGame(p);
      }
      return;
    }
    
    if (p.keyCode === 82) { // R
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
    
    if (p.keyCode === 27) { // ESC
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
      return;
    }
    
    // Gameplay controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      handleGameplayInput(p.keyCode);
    }
  };
  
  function handleGameplayInput(keyCode) {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.isAI) return; // Don't allow manual control of AI
    
    switch (keyCode) {
      case 32: // SPACE
        if (gameState.mustSelectCategory || gameState.rollsLeft === 0) {
          // Do nothing, must select category
        } else if (gameState.selectedDiceIndex >= 0 && gameState.rollsLeft > 0) {
          // Toggle hold on selected die
          handleDiceSelection('toggle');
        } else {
          // Roll dice
          handleRoll(p);
        }
        break;
        
      case 38: // UP
        handleDiceSelection('up');
        break;
        
      case 40: // DOWN
        handleDiceSelection('down');
        break;
        
      case 37: // LEFT
        handleCategorySelection('left');
        break;
        
      case 39: // RIGHT
        handleCategorySelection('right');
        break;
        
      case 90: // Z
        confirmCategorySelection(p);
        break;
    }
  }
  
  function handleTestAction(action) {
    if (!action) return;
    
    // Log test action as input
    p.logs.inputs.push({
      input_type: 'automated_test',
      data: { key: action.key, keyCode: action.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    handleGameplayInput(action.keyCode);
  }
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
  
  const activeBtn = document.getElementById(
    mode === 'HUMAN' ? 'humanModeBtn' : 
    mode === 'TEST_1' ? 'test_1_ModeBtn' : 
    'test_2_ModeBtn'
  );
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};