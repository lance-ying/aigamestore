// game.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initializeGame, startGame, updateGame, handleInput } from './game_logic.js';
import { drawGame } from './rendering.js';

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
    
    initializeGame(p);
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Game Initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Handle input
    handleInput(p);
    
    // Update game state
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p);
    }
    
    // Render
    drawGame(p);
  };
  
  p.keyPressed = function() {
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Game phase controls
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        startGame(p);
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase, message: "Game Paused" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase, message: "Game Resumed" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        initializeGame(p);
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase, message: "Game Restarted" },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Gameplay controls (only in HUMAN mode)
    if (gameState.controlMode === "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.keysPressed[p.keyCode] = true;
      
      if (p.keyCode === 32) { // SPACE - Attack
        if (gameState.player && Date.now() - gameState.lastAttackTime > gameState.player.currentSkull.attackSpeed) {
          gameState.player.attack(p);
          gameState.lastAttackTime = Date.now();
        }
      } else if (p.keyCode === 16) { // SHIFT - Dash
        if (gameState.player && Date.now() - gameState.lastDashTime > 1000) {
          gameState.player.dash();
          gameState.lastDashTime = Date.now();
        }
      } else if (p.keyCode === 90) { // Z - Swap skull
        if (gameState.player) {
          gameState.player.swapSkull();
        }
      }
    }
    
    return false;
  };
  
  p.keyReleased = function() {
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    if (gameState.controlMode === "HUMAN") {
      gameState.keysPressed[p.keyCode] = false;
    }
    
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn", "test_3_ModeBtn", "test_4_ModeBtn", "test_5_ModeBtn"];
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
    "TEST_3": "test_3_ModeBtn",
    "TEST_4": "test_4_ModeBtn",
    "TEST_5": "test_5_ModeBtn"
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
  
  gameInstance.logs.game_info.push({
    data: { controlMode: mode, message: "Control mode changed" },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};