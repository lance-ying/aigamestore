// game.js - Main game file

import { 
  gameState, 
  GAME_PHASE, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  FRUIT_TIERS,
  CONTAINER,
  LEVELS
} from './globals.js';
import { Fruit } from './fruit.js';
import { ParticleSystem } from './particles.js';
import { LevelManager } from './level.js';
import { PhysicsEngine } from './physics.js';
import { UIRenderer } from './ui.js';
import { InputController } from './controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let particleSystem;
  let levelManager;
  let physicsEngine;
  let uiRenderer;
  let inputController;
  let moveSpeed = 3;

  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.randomSeed(42);
    p.frameRate(60);

    // Initialize systems
    particleSystem = new ParticleSystem(p);
    levelManager = new LevelManager(p);
    physicsEngine = new PhysicsEngine(p, particleSystem);
    uiRenderer = new UIRenderer(p);
    inputController = new InputController(p);

    // Load high score
    const savedHighScore = localStorage.getItem('fruitDropHighScore');
    if (savedHighScore) {
      gameState.highScore = parseInt(savedHighScore);
    }

    // Initialize game state
    gameState.gamePhase = GAME_PHASE.START;
    gameState.dropX = CANVAS_WIDTH / 2;

    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(135, 206, 235);

    // Handle game phases
    switch (gameState.gamePhase) {
      case GAME_PHASE.START:
        uiRenderer.drawStartScreen();
        break;

      case GAME_PHASE.PLAYING:
        drawPlaying();
        updatePlaying();
        break;

      case GAME_PHASE.PAUSED:
        drawPlaying();
        uiRenderer.drawPausedOverlay();
        break;

      case GAME_PHASE.LEVEL_TRANSITION:
        drawPlaying();
        uiRenderer.drawLevelTransition(levelManager);
        updateLevelTransition();
        break;

      case GAME_PHASE.GAME_OVER_WIN:
      case GAME_PHASE.GAME_OVER_LOSE:
        uiRenderer.drawGameOverScreen(gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN);
        break;
    }
  };

  function drawPlaying() {
    // Draw container
    uiRenderer.drawContainer(levelManager.getLoseLineY());

    // Draw fruits
    for (const fruit of gameState.fruits) {
      fruit.draw();
    }

    // Draw particles
    particleSystem.draw();

    // Draw current fruit being positioned
    if (gameState.currentFruit !== null) {
      const tierData = FRUIT_TIERS[gameState.currentFruit];
      uiRenderer.drawDropIndicator(gameState.dropX);
      uiRenderer.drawCurrentFruit(tierData, gameState.dropX);
    }

    // Draw UI
    uiRenderer.drawPlayingUI(levelManager);
  }

  function updatePlaying() {
    // Get input actions
    const actions = inputController.update();

    // Handle fruit positioning
    if (gameState.currentFruit !== null) {
      if (actions.moveLeft) {
        gameState.dropX -= moveSpeed;
      }
      if (actions.moveRight) {
        gameState.dropX += moveSpeed;
      }

      // Clamp position
      const tierData = FRUIT_TIERS[gameState.currentFruit];
      const minX = CONTAINER.x + CONTAINER.wallThickness + tierData.radius;
      const maxX = CONTAINER.x + CONTAINER.width - CONTAINER.wallThickness - tierData.radius;
      gameState.dropX = p.constrain(gameState.dropX, minX, maxX);
    }

    // Update physics
    physicsEngine.update();

    // Update particles
    particleSystem.update();

    // Check lose condition
    if (physicsEngine.checkLoseLine(levelManager.getLoseLineY())) {
      transitionToGameOver(false);
      return;
    }

    // Check level completion
    const levelResult = levelManager.checkLevelComplete();
    if (levelResult === 'WIN') {
      transitionToGameOver(true);
      return;
    } else if (levelResult === 'LEVEL_COMPLETE') {
      startLevelTransition();
      return;
    }
  }

  function updateLevelTransition() {
    const elapsed = Date.now() - gameState.transitionTimer;
    if (elapsed > 3000) {
      // Move to next level
      if (gameState.currentLevel < LEVELS.length - 1) {
        levelManager.startLevel(gameState.currentLevel + 1);
        gameState.gamePhase = GAME_PHASE.PLAYING;
        
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase, level: gameState.currentLevel + 1 },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }

  function startLevelTransition() {
    gameState.gamePhase = GAME_PHASE.LEVEL_TRANSITION;
    gameState.transitionTimer = Date.now();
    
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, level: gameState.currentLevel + 1 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function startGame() {
    gameState.gamePhase = GAME_PHASE.PLAYING;
    gameState.score = 0;
    gameState.fruits = [];
    gameState.entities = [];
    gameState.fusionCount = 0;
    gameState.comboCount = 0;
    gameState.lastFusionTime = 0;

    levelManager.startLevel(0);
    
    gameState.currentFruit = levelManager.getRandomFruitTier();
    gameState.nextFruit = levelManager.getRandomFruitTier();
    gameState.dropX = CANVAS_WIDTH / 2;

    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, level: 1 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function transitionToGameOver(isWin) {
    gameState.gamePhase = isWin ? GAME_PHASE.GAME_OVER_WIN : GAME_PHASE.GAME_OVER_LOSE;
    
    // Update high score
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      localStorage.setItem('fruitDropHighScore', gameState.highScore.toString());
    }

    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, score: gameState.score, isWin },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function dropFruit() {
    if (gameState.currentFruit === null) return;

    const newFruit = new Fruit(
      p,
      gameState.dropX,
      CONTAINER.y + 10,
      gameState.currentFruit
    );
    
    gameState.fruits.push(newFruit);
    gameState.entities.push({ type: 'fruit', fruit: newFruit });

    // Add drop bonus
    gameState.score += 1;

    // Log player info
    p.logs.player_info.push({
      screen_x: gameState.dropX,
      screen_y: CONTAINER.y,
      game_x: gameState.dropX,
      game_y: CONTAINER.y,
      event: 'drop',
      tier: gameState.currentFruit,
      framecount: p.frameCount
    });

    // Set up next fruit
    gameState.currentFruit = gameState.nextFruit;
    gameState.nextFruit = levelManager.getRandomFruitTier();
  }

  p.keyPressed = function() {
    const result = inputController.handleKeyPressed(p.keyCode, p.key);

    // Game phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASE.START) {
        startGame();
      } else if (gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN || 
                 gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE) {
        // Restart not implemented in game over, only R works
      }
    }

    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASE.PLAYING) {
        gameState.gamePhase = GAME_PHASE.PAUSED;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASE.PAUSED) {
        gameState.gamePhase = GAME_PHASE.PLAYING;
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === GAME_PHASE.PLAYING || 
          gameState.gamePhase === GAME_PHASE.PAUSED ||
          gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN ||
          gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE) {
        gameState.gamePhase = GAME_PHASE.START;
        gameState.fruits = [];
        gameState.entities = [];
        p.logs.game_info.push({
          data: { phase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }

    // Drop fruit
    if (gameState.gamePhase === GAME_PHASE.PLAYING) {
      if (p.keyCode === 32 || p.keyCode === 40 || p.keyCode === 83) { // SPACE, DOWN, S
        dropFruit();
      }
    }
  };

  p.keyReleased = function() {
    inputController.handleKeyReleased(p.keyCode);
  };
});

// Expose game instance
window.gameInstance = gameInstance;

// Control mode setter
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