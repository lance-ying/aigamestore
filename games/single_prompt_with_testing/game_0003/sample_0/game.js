// game.js - Main game initialization and loop
import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';
import { Player } from './player.js';
import { updateGame } from './game_logic.js';
import { renderGame } from './rendering.js';
import { renderUI } from './ui.js';
import { createInputState, updateInputs, handleKeyPress } from './input_handler.js';
import './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let inputs;
  
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
    
    // Initialize input state
    inputs = createInputState();
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START, initialized: true },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update inputs
    updateInputs(p, inputs);
    
    // Game state machine
    switch (gameState.gamePhase) {
      case PHASE_START:
        renderUI(p);
        break;
        
      case PHASE_PLAYING:
        updateGame(p, inputs);
        renderGame(p);
        renderUI(p);
        break;
        
      case PHASE_PAUSED:
        renderGame(p);
        renderUI(p);
        break;
        
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        renderUI(p);
        break;
    }
  };
  
  p.keyPressed = function() {
    handleKeyPress(p, inputs);
    
    // Game phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === PHASE_START) {
        startGame(p);
      }
    }
    
    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
        p.logs.game_info.push({
          data: { phase: PHASE_PAUSED },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
        p.logs.game_info.push({
          data: { phase: PHASE_PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
        resetGame(p);
      }
    }
    
    return false; // Prevent default
  };
  
  function startGame(p) {
    // Initialize player
    gameState.player = new Player(0, 0);
    gameState.entities = [gameState.player];
    gameState.enemies = [];
    gameState.projectiles = [];
    gameState.pickups = [];
    gameState.particles = [];
    gameState.score = 0;
    gameState.gold = 0;
    gameState.elapsedTime = 0;
    gameState.enemySpawnTimer = 0;
    gameState.camera = { x: 0, y: 0 };
    gameState.levelUpPending = false;
    gameState.upgradeChoices = [];
    gameState.difficultyMultiplier = 1.0;
    gameState.enemiesKilled = 0;
    
    gameState.gamePhase = PHASE_PLAYING;
    
    p.logs.game_info.push({
      data: { phase: PHASE_PLAYING, event: 'game_start' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function resetGame(p) {
    gameState.gamePhase = PHASE_START;
    
    p.logs.game_info.push({
      data: { phase: PHASE_START, event: 'game_reset' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
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