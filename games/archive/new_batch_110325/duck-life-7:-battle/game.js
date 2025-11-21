// game.js - Main game file
import { gameState, GAME_PHASES, SCREENS, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { initializeWorld, updateWorld, handleWorldInput } from './world.js';
import { updateTraining, handleTrainingInput } from './training.js';
import { updateBattle, handleBattleInput } from './battle.js';
import { handleEquipmentInput } from './equipment.js';
import { renderStartScreen, renderPlayingScreen, renderGameOverScreen, renderPausedIndicator } from './render.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Game instance variables
  let lastUpdateTime = 0;
  
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    initializeWorld();
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(50);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action !== null && p.frameCount % 3 === 0) { // Execute every 3 frames for stability
        handleKeyPress(action);
      }
    }
    
    // Update game based on phase
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGameLogic();
    }
    
    // Render based on phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      renderPlayingScreen(p);
      
      if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        renderPausedIndicator(p);
      }
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOverScreen(p);
    }
    
    // Pause rendering
    if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderPausedIndicator(p);
    }
    
    // Log player info periodically
    if (p.frameCount % 60 === 0 && gameState.gamePhase === GAME_PHASES.PLAYING) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  };
  
  function updateGameLogic() {
    if (gameState.screen === SCREENS.WORLD) {
      updateWorld(p);
    } else if (gameState.screen === SCREENS.TRAINING_GAME) {
      updateTraining(p);
    } else if (gameState.screen === SCREENS.BATTLE) {
      updateBattle(p);
    }
  }
  
  function handleKeyPress(keyCode) {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { keyCode: keyCode, key: String.fromCharCode(keyCode) },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Game phase controls
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        gameState.screen = SCREENS.WORLD;
        
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    if (keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
      }
      
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }
    
    if (keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        resetGame();
        return;
      }
    }
    
    // Playing controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.screen === SCREENS.WORLD) {
        handleWorldInput(keyCode, p);
      } else if (gameState.screen === SCREENS.TRAINING_GAME) {
        handleTrainingInput(keyCode, p);
      } else if (gameState.screen === SCREENS.BATTLE) {
        handleBattleInput(keyCode, p);
      } else if (gameState.screen === SCREENS.EQUIPMENT) {
        handleEquipmentInput(keyCode, p);
      }
    }
  }
  
  function resetGame() {
    // Reset player stats
    gameState.player = {
      x: 300,
      y: 200,
      power: 10,
      health: 100,
      maxHealth: 100,
      defence: 5,
      speed: 8,
      special: 5,
      wins: 0,
      currency: 0
    };
    
    gameState.gamePhase = GAME_PHASES.START;
    gameState.screen = SCREENS.WORLD;
    gameState.defeatedOpponents = [];
    gameState.unlockedEquipment = [];
    gameState.equippedWeapon = null;
    gameState.equippedCostume = null;
    gameState.currentTraining = null;
    gameState.inBattle = false;
    gameState.selectedObject = 0;
    gameState.menuSelection = 0;
    
    initializeWorld();
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, action: "restart" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPress(p.keyCode);
    }
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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' :
                                           mode === 'TEST_2' ? 'test_2_ModeBtn' :
                                           'test_3_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

export default gameInstance;