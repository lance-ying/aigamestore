// game.js - Main game file

import { gameState, GAME_PHASES, PLAY_MODES, CANVAS_WIDTH, CANVAS_HEIGHT, resetGameState } from './globals.js';
import { Player } from './entities.js';
import { startCombat, executeEnemyTurn, advanceToNextWave } from './combat.js';
import { handleMenuNavigation, handleExplorationInput } from './input.js';
import { renderStartScreen, renderExploration, renderCombat, renderPaused, renderGameOver } from './rendering.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize the logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  let enemyTurnTimer = 0;
  let enemyTurnDelay = 60;
  let explorationTimer = 0;
  let explorationCombatTrigger = 180; // Frames to trigger combat
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.randomSeed(42);
    p.frameRate(60);
    
    // Initialize player
    gameState.player = new Player();
    gameState.entities = [gameState.player];
    
    // Log initial game state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, mode: "setup" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        simulateKeyPress(action.keyCode);
      }
    }
    
    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.playMode === PLAY_MODES.EXPLORATION) {
        renderExploration(p);
        
        // Trigger combat after exploration
        explorationTimer++;
        if (explorationTimer >= explorationCombatTrigger) {
          explorationTimer = 0;
          startCombat();
        }
      } else if (gameState.playMode === PLAY_MODES.COMBAT) {
        renderCombat(p);
        
        // Handle victory transition
        if (gameState.combatVictory) {
          gameState.victoryTimer++;
          if (gameState.victoryTimer >= 90) {
            advanceToNextWave();
          }
        }
        
        // Handle enemy turn with delay
        if (gameState.combatTurn === "ENEMY" && !gameState.combatVictory) {
          enemyTurnTimer++;
          if (enemyTurnTimer >= enemyTurnDelay) {
            enemyTurnTimer = 0;
            executeEnemyTurn();
          }
        }
      }
      
      // Log player info
      if (p.frameCount % 30 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.playerPosition.x,
          screen_y: gameState.playerPosition.y,
          game_x: gameState.playerPosition.x,
          game_y: gameState.playerPosition.y,
          framecount: p.frameCount
        });
      }
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      // Render last game state
      if (gameState.playMode === PLAY_MODES.EXPLORATION) {
        renderExploration(p);
      } else if (gameState.playMode === PLAY_MODES.COMBAT) {
        renderCombat(p);
      }
      renderPaused(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      renderGameOver(p, true);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOver(p, false);
    }
  };
  
  p.keyPressed = function() {
    const keyCode = p.keyCode;
    
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Global controls
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        gameState.playMode = PLAY_MODES.EXPLORATION;
        
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase, mode: gameState.playMode },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (keyCode === 27) { // ESC
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
    } else if (keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        resetGameState();
        gameState.player = new Player();
        gameState.entities = [gameState.player];
        gameState.gamePhase = GAME_PHASES.START;
        
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase, action: "restart" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Gameplay controls
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (gameState.playMode === PLAY_MODES.EXPLORATION) {
        handleExplorationInput(p, keyCode);
      } else if (gameState.playMode === PLAY_MODES.COMBAT) {
        if (gameState.combatTurn === "PLAYER") {
          handleMenuNavigation(p, keyCode);
        }
      }
    }
  };
  
  function simulateKeyPress(keyCode) {
    p.keyCode = keyCode;
    p.keyPressed();
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn", "test_3_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });
  
  const modeMap = {
    "HUMAN": "humanModeBtn",
    "TEST_1": "test_1_ModeBtn",
    "TEST_2": "test_2_ModeBtn",
    "TEST_3": "test_3_ModeBtn"
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
};