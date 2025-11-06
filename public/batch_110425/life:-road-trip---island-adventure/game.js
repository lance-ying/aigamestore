// game.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, GAME_PHASES, gameState } from './globals.js';
import { Board } from './board.js';
import { Player } from './player.js';
import { Wheel } from './wheel.js';
import { Minigame } from './minigame.js';
import { UI } from './ui.js';
import { setupInput } from './input.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let board;
  let player;
  let wheel;
  let minigame;
  let ui;
  
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize game objects
    board = new Board();
    player = new Player();
    wheel = new Wheel();
    minigame = new Minigame();
    ui = new UI();
    
    gameState.player = player;
    gameState.entities = [player, minigame];
    
    // Setup input handling
    setupInput(p, wheel, minigame);
    
    // Initial log
    p.logs.game_info.push({
      data: { phase: "START", action: "init" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(135, 206, 235);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const actions = get_automated_testing_action(gameState);
      if (actions && actions.length > 0) {
        for (let action of actions) {
          simulateKeyPress(p, action);
        }
      }
    }
    
    // Game state machine
    if (gameState.gamePhase === GAME_PHASES.START) {
      ui.drawStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Update
      wheel.update(p);
      player.update(p, board);
      minigame.update(p);
      
      // Draw
      board.draw(p);
      player.draw(p);
      wheel.draw(p);
      minigame.draw(p);
      ui.drawGameUI(p);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      // Draw game state (frozen)
      board.draw(p);
      player.draw(p);
      wheel.draw(p);
      minigame.draw(p);
      ui.drawGameUI(p);
      ui.drawPauseScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      // Draw final game state
      board.draw(p);
      player.draw(p);
      wheel.draw(p);
      ui.drawGameUI(p);
      ui.drawGameOverScreen(p);
    }
  };
  
  function simulateKeyPress(p, keyCode) {
    // Simulate key press for automated testing
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: String.fromCharCode(keyCode), keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    if (keyCode === 32) { // SPACE
      gameState.spacePressed = true;
      if (!gameState.minigameActive) {
        wheel.spin();
      }
      // Auto-release after 1 frame
      setTimeout(() => { gameState.spacePressed = false; }, 16);
    } else if (keyCode === 90) { // Z
      gameState.zPressed = true;
      setTimeout(() => { gameState.zPressed = false; }, 16);
    }
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
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};