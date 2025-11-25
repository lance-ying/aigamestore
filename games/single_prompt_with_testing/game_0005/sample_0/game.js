// game.js - Main game file
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, gameState, getGameState } from './globals.js';
import { Player } from './entities.js';
import { spawnInitialPals } from './spawning.js';
import { handlePlayerMovement, handlePlayerAttack, handleCapture, handleShiftInteraction, renderBuildMenu } from './input.js';
import { checkCollisions } from './collision.js';
import { renderStartScreen, renderGameOverScreen, renderWorld, renderEntities, renderUI } from './rendering.js';
import { updateCamera, updateGameLogic } from './game_logic.js';
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
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Handle different game phases
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      // Handle automated testing input
      if (gameState.controlMode !== "HUMAN") {
        const action = get_automated_testing_action(gameState);
        if (action && action.keyCode) {
          simulateKeyPress(p, action.keyCode);
        }
      }
      
      // Update game state
      handlePlayerMovement(p);
      handleShiftInteraction(p);
      updateGameLogic(p);
      checkCollisions(p);
      updateCamera();
      
      // Render game
      renderWorld(p);
      renderEntities(p);
      renderUI(p);
      renderBuildMenu(p);
      
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      // Render paused state
      renderWorld(p);
      renderEntities(p);
      renderUI(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameOverScreen(p);
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

    // Phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        startGame(p);
      }
    } else if (p.keyCode === 27) { // ESC
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
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        restartGame(p);
      }
    }

    // Gameplay controls (only during PLAYING phase)
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (p.keyCode === 32) { // SPACE
        handlePlayerAttack(p);
      } else if (p.keyCode === 90) { // Z
        handleCapture(p);
      }
    }

    return false; // Prevent default
  };

  function startGame(p) {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    
    // Initialize player
    gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    gameState.entities.push(gameState.player);
    
    // Reset game state
    gameState.entities = [gameState.player];
    gameState.pals = [];
    gameState.capturedPals = [];
    gameState.wildPals = [];
    gameState.poachers = [];
    gameState.workstations = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameState.camera = { x: gameState.player.x, y: gameState.player.y };
    gameState.resources = { food: 100, ore: 0, materials: 0, prosperity: 0 };
    gameState.score = 0;
    gameState.hunger = 100;
    gameState.lastFoodTime = 0;
    gameState.waveNumber = 0;
    gameState.lastWaveTime = Date.now();
    gameState.selectedPal = null;
    gameState.frameCount = 0;
    
    // Spawn initial pals
    spawnInitialPals();
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Game started" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function restartGame(p) {
    gameState.gamePhase = GAME_PHASES.START;
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, message: "Game restarted" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  let activeKeys = new Set();

  function simulateKeyPress(p, keyCode) {
    if (!activeKeys.has(keyCode)) {
      activeKeys.add(keyCode);
      setTimeout(() => activeKeys.delete(keyCode), 100);
    }
  }

  // Override keyIsDown for automated testing
  const originalKeyIsDown = p.keyIsDown.bind(p);
  p.keyIsDown = function(keyCode) {
    if (gameState.controlMode !== "HUMAN") {
      return activeKeys.has(keyCode);
    }
    return originalKeyIsDown(keyCode);
  };
}, document.body);

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode management
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
};