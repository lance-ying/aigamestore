import { gameState, resetGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { createLevel } from './level.js';
import { getPlayerInputs } from './input.js';
import { updateGame, renderGame } from './game_logic.js';
import { drawStartScreen, drawPauseOverlay, drawGameOverScreen, drawHUD } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Log initial game state
    p.logs.game_info.push({
      event: "game_initialized",
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    gameState.frameCount = p.frameCount;
    
    // Handle game phases
    if (gameState.gamePhase === "START") {
      drawStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING") {
      // Get inputs
      let automatedAction = null;
      if (gameState.controlMode !== "HUMAN") {
        automatedAction = get_automated_testing_action(gameState);
      }
      
      const inputs = getPlayerInputs(p, gameState.controlMode, automatedAction);
      
      // Update players
      const blockingPlatforms = updateGame(p);
      
      if (gameState.player1) {
        gameState.player1.update(inputs.player1, blockingPlatforms, gameState.spikes);
      }
      if (gameState.player2) {
        gameState.player2.update(inputs.player2, blockingPlatforms, gameState.spikes);
      }
      
      // Log player positions every 30 frames
      if (p.frameCount % 30 === 0) {
        if (gameState.player1) {
          p.logs.player_info.push({
            player: 1,
            screen_x: gameState.player1.x,
            screen_y: gameState.player1.y,
            game_x: gameState.player1.x,
            game_y: gameState.player1.y,
            is_alive: gameState.player1.isAlive,
            framecount: p.frameCount
          });
        }
        if (gameState.player2) {
          p.logs.player_info.push({
            player: 2,
            screen_x: gameState.player2.x,
            screen_y: gameState.player2.y,
            game_x: gameState.player2.x,
            game_y: gameState.player2.y,
            is_alive: gameState.player2.isAlive,
            framecount: p.frameCount
          });
        }
      }
      
      // Render
      renderGame(p);
      drawHUD(p);
      
    } else if (gameState.gamePhase === "PAUSED") {
      renderGame(p);
      drawHUD(p);
      drawPauseOverlay(p);
      
    } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
      renderGame(p);
      drawHUD(p);
      drawGameOverScreen(p, gameState.gamePhase === "GAME_OVER_WIN");
    }
  };
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // ENTER - Start game
    if (p.keyCode === 13 && gameState.gamePhase === "START") {
      resetGameState();
      createLevel(p);
      gameState.gamePhase = "PLAYING";
      
      p.logs.game_info.push({
        event: "game_started",
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // ESC - Pause/Unpause
    if (p.keyCode === 27) {
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
        p.logs.game_info.push({
          event: "game_paused",
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        p.logs.game_info.push({
          event: "game_resumed",
          data: { gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // R - Restart
    if (p.keyCode === 82) {
      resetGameState();
      gameState.gamePhase = "START";
      
      p.logs.game_info.push({
        event: "game_restarted",
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // SPACE - Switch active player
    if (p.keyCode === 32 && gameState.gamePhase === "PLAYING") {
      gameState.activePlayer = gameState.activePlayer === 1 ? 2 : 1;
    }
  };
});

// Expose game instance and control mode setter
window.gameInstance = gameInstance;

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
  
  gameInstance.logs.game_info.push({
    event: "control_mode_changed",
    data: { controlMode: mode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};

export default gameInstance;