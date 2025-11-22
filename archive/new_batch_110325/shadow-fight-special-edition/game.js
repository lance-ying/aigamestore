// game.js - Main game file with p5.js instance

import { 
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TARGET_FPS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE
} from './globals.js';
import { initializeGame, startNewRound, checkRoundEnd } from './game_logic.js';
import { handleKeyPressed, handleKeyReleased, handleContinuousInput, handleAutomatedInput } from './input_handler.js';
import { checkCombat, resetComboIfExpired } from './combat_system.js';
import { drawStartScreen, drawGameUI, drawUpgradeMenu, drawGameOverScreen, drawBackground } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs (write-only)
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize game
    initializeGame(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Single background call to prevent flickering
    p.background(20);
    
    // Handle different game phases
    switch (gameState.gamePhase) {
      case PHASE_START:
        drawStartScreen(p);
        break;
        
      case PHASE_PLAYING:
      case PHASE_PAUSED:
        // Draw game world
        drawBackground(p, gameState.currentProvince);
        
        // Handle input based on control mode
        if (gameState.controlMode === "HUMAN") {
          handleContinuousInput(p);
        } else {
          const action = get_automated_testing_action(gameState);
          handleAutomatedInput(p, action);
        }
        
        // Update game only if not paused
        if (gameState.gamePhase === PHASE_PLAYING) {
          // Update entities
          if (gameState.player) {
            gameState.player.update(p);
            
            // Log player info periodically
            if (p.frameCount % 10 === 0) {
              p.logs.player_info.push({
                screen_x: gameState.player.x,
                screen_y: gameState.player.y,
                game_x: gameState.player.x,
                game_y: gameState.player.y,
                framecount: p.frameCount
              });
            }
          }
          
          if (gameState.enemy && gameState.roundInProgress) {
            gameState.enemy.update(p);
            gameState.enemyAI.update(p, gameState.player);
          }
          
          // Check combat
          if (gameState.player && gameState.enemy && gameState.roundInProgress) {
            checkCombat(p, gameState.player, gameState.enemy);
            resetComboIfExpired(p);
          }
          
          // Check round end
          checkRoundEnd(p);
          
          // Handle round timer (delay between rounds)
          if (!gameState.roundInProgress && gameState.roundTimer > 0) {
            gameState.roundTimer--;
            if (gameState.roundTimer === 0 && 
                gameState.playerRoundsWon < 2 && 
                gameState.enemyRoundsWon < 2 &&
                !gameState.showUpgradeMenu) {
              startNewRound(p);
            }
          }
        }
        
        // Draw entities
        if (gameState.enemy) {
          gameState.enemy.draw(p);
        }
        if (gameState.player) {
          gameState.player.draw(p);
        }
        
        // Draw UI
        drawGameUI(p);
        
        // Draw upgrade menu if active
        if (gameState.showUpgradeMenu) {
          drawUpgradeMenu(p);
        }
        break;
        
      case PHASE_GAME_OVER_WIN:
        drawGameOverScreen(p, true);
        break;
        
      case PHASE_GAME_OVER_LOSE:
        drawGameOverScreen(p, false);
        break;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
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
    'TEST_4': 'test_4_ModeBtn',
    'TEST_5': 'test_5_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;