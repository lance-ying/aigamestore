// Main game file
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, PLAY_PHASES } from './globals.js';
import { Player } from './player.js';
import { initializeLocations } from './locations.js';
import { handleKeyPressed } from './input.js';
import { drawStartScreen, drawInvestigationPhase, drawTrialPhase, drawPausedScreen, drawGameOverScreen } from './rendering.js';
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
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game state
    gameState.locations = initializeLocations();
    gameState.player = new Player(300, 200);
    gameState.entities = [gameState.player];
    
    // Log initial game info
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.framesSinceAction++;
      
      if (gameState.framesSinceAction > 5) {
        const action = get_automated_testing_action(gameState);
        if (action && action.keyCode) {
          handleKeyPressed(p, String.fromCharCode(action.keyCode), action.keyCode);
        }
      }
    }
    
    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.playPhase === PLAY_PHASES.INVESTIGATION) {
        drawInvestigationPhase(p);
        
        // Update player
        if (gameState.player) {
          gameState.player.update();
          
          // Log player position periodically
          if (p.frameCount % 60 === 0) {
            p.logs.player_info.push({
              screen_x: gameState.player.x,
              screen_y: gameState.player.y,
              game_x: gameState.player.x,
              game_y: gameState.player.y,
              framecount: p.frameCount
            });
          }
        }
        
        // Fade transition
        if (gameState.transitionAlpha > 0) {
          p.fill(0, 0, 0, gameState.transitionAlpha);
          p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
          gameState.transitionAlpha -= 15;
        }
      } else if (gameState.playPhase === PLAY_PHASES.TRIAL) {
        drawTrialPhase(p);
        
        // Update statement timer
        gameState.statementTimer++;
      }
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      // Redraw last frame
      if (gameState.playPhase === PLAY_PHASES.INVESTIGATION) {
        drawInvestigationPhase(p);
      } else {
        drawTrialPhase(p);
      }
      drawPausedScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      drawGameOverScreen(p);
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false; // Prevent default
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  gameState.framesSinceAction = 0;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const activeBtn = document.getElementById(
    mode === 'HUMAN' ? 'humanModeBtn' : 
    mode === 'TEST_1' ? 'test_1_ModeBtn' :
    mode === 'TEST_2' ? 'test_2_ModeBtn' :
    'test_3_ModeBtn'
  );
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};