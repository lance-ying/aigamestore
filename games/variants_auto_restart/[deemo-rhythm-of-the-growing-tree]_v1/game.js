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
  PHASE_LOADING_LEVEL,
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
    // Ensure game starts in HUMAN mode as test modes are removed
    gameState.controlMode = "HUMAN"; 

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
      // inputHandler.updateAutomatedTesting(); // Removed: Automated testing is removed
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
    } else if (gameState.gamePhase === PHASE_LOADING_LEVEL) {
      // Update logic (for timer)
      gameLogic.update();
      
      // Render gameplay background/tree
      ui.renderGameplay();
      tree.render();
      player.render();
      
      // Render loading overlay
      ui.renderLoadingScreen();
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
               gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      // Render final game state
      ui.renderGameplay();
      tree.render();
      player.render();
      
      // Render game over screen
      ui.renderGameOverScreen(gameState.gamePhase === PHASE_GAME_OVER_WIN);

      // Auto-restart logic after 1 second
      if (!gameState.autoRestartScheduled) {
        gameState.autoRestartScheduled = true;
        gameState.autoRestartTimeoutId = setTimeout(() => {
          gameLogic.restartGame();
        }, 1000); // 1 second delay
      }
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
    state.currentLevel = levelNum;
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

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Removed: window.setControlMode function and related button updates as test modes are removed.

export default gameInstance;