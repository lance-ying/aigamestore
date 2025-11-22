// game.js - Main game file
import { 
  gameState, 
  setP5Instance,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TARGET_FPS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE
} from './globals.js';
import { Player } from './player.js';
import { Tree } from './tree.js';
import { SongManager } from './song_manager.js';
import { UI } from './ui.js';
import { GameLogic } from './game_logic.js';
import { InputHandler } from './input_handler.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let player;
  let tree;
  let songManager;
  let ui;
  let gameLogic;
  let inputHandler;

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);

    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };

    // Set p5 instance globally
    setP5Instance(p);

    // Initialize game objects
    player = new Player(p);
    tree = new Tree(p);
    songManager = new SongManager(p);
    ui = new UI(p);
    gameLogic = new GameLogic(p, player, songManager, ui);
    inputHandler = new InputHandler(p, gameLogic);

    // Set initial game state
    gameState.player = player;
    gameState.entities = [player];

    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(20, 20, 40);

    if (gameState.gamePhase === PHASE_START) {
      ui.renderStartScreen();
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      // Update game logic
      inputHandler.updateAutomatedTesting();
      gameLogic.update();
      
      // Render gameplay
      ui.renderGameplay();
      tree.render();
      
      // Render notes
      for (const note of gameState.notes) {
        note.render();
      }
      
      // Render player
      player.render();

      // Log player info periodically
      if (p.frameCount % 10 === 0) {
        inputHandler.logPlayerInfo();
      }
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      ui.renderGameplay();
      tree.render();
      
      for (const note of gameState.notes) {
        note.render();
      }
      
      player.render();
      ui.renderPauseIndicator();
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
               gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      // Render final game state
      ui.renderGameplay();
      tree.render();
      player.render();
      
      // Render game over screen
      ui.renderGameOverScreen(gameState.gamePhase === PHASE_GAME_OVER_WIN);
    }
  };

  p.keyPressed = function() {
    inputHandler.handleKeyPressed();
    return false;
  };

  p.keyReleased = function() {
    inputHandler.handleKeyReleased();
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : (window.gameState || (window.gameInstance && window.gameInstance.gameState));
  if (state) {
    // Set level using the property this game uses
    state.currentLevel = levelNum;
    state.currentLevel = levelNum; // Also set for compatibility
    // Try common reset/start patterns
    if (typeof resetGame === 'function') {
      resetGame();
    }
    if (typeof startGame === 'function') {
      startGame();
    } else if (state.gamePhase !== undefined) {
      state.gamePhase = "PLAYING";
    }
  }
};
// Expose level loading for dev mode
// Expose level loading for dev mode

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Control mode switching
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
};

export default gameInstance;