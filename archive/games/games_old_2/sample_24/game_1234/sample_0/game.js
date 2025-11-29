// game.js - Main game file

import { 
  gameState, 
  GAME_PHASES, 
  LEVELS, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  PLAYER_STATES
} from './globals.js';
import { Player } from './player.js';
import { Spawner } from './spawner.js';
import { handleKeyPressed, AutomatedController } from './input.js';
import {
  renderBackground,
  renderPath,
  renderUI,
  renderStartScreen,
  renderPauseOverlay,
  renderGameOverScreen,
  renderLevelComplete
} from './rendering.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let spawner;
  let automatedController;
  let lastPlayerLogFrame = 0;

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.randomSeed(42);
    p.frameRate(60);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, action: 'game_start' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    spawner = new Spawner();
    automatedController = new AutomatedController();
  };

  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== 'HUMAN') {
      const action = automatedController.getAction(p);
      if (action) {
        handleKeyPressed(p, p.key, action.keyCode);
      }
    }

    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
      return;
    }

    if (gameState.gamePhase === GAME_PHASES.GAME_OVER) {
      renderGameOverScreen(p, false);
      return;
    }

    if (gameState.gamePhase === GAME_PHASES.GAME_WON) {
      renderGameOverScreen(p, true);
      return;
    }

    // Playing or paused - render game
    renderBackground(p);
    renderPath(p);

    // Update and render entities if playing
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame(p);
    }

    // Render entities
    if (gameState.player) {
      // Render obstacles
      gameState.obstacles.forEach(obstacle => {
        obstacle.render(p);
      });

      // Render coins
      gameState.coins.forEach(coin => {
        coin.render(p);
      });

      // Render player
      gameState.player.render(p);
    }

    // Render UI
    renderUI(p);

    // Render overlays
    if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderPauseOverlay(p);
    }

    if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
      renderLevelComplete(p);
    }

    // Log player info periodically
    if (gameState.player && p.frameCount - lastPlayerLogFrame > 30) {
      logPlayerInfo(p);
      lastPlayerLogFrame = p.frameCount;
    }
  };

  function updateGame(p) {
    // Initialize player if needed
    if (!gameState.player) {
      gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 150);
      gameState.entities = [gameState.player];
      gameState.currentSpeed = gameState.baseSpeed * LEVELS[gameState.currentLevel - 1].speedMultiplier;
    }

    // Handle level complete transition
    if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
      gameState.levelCompleteTimer++;
      if (gameState.levelCompleteTimer > 120) {
        transitionToNextLevel(p);
      }
      return;
    }

    // Update player
    gameState.player.update();

    // Update camera
    gameState.cameraZ += gameState.currentSpeed;
    gameState.distanceTraveled += gameState.currentSpeed;
    gameState.distanceTraveledInLevel += gameState.currentSpeed;

    // Update score based on distance
    if (p.frameCount % 10 === 0) {
      gameState.score += 1;
    }

    // Spawn obstacles and coins
    spawner.update(p);

    // Update obstacles
    gameState.obstacles = gameState.obstacles.filter(obstacle => {
      obstacle.update(gameState.currentSpeed);
      
      // Check collision
      if (obstacle.active && obstacle.checkCollision(gameState.player)) {
        handlePlayerDeath(p);
        return true;
      }
      
      return obstacle.active;
    });

    // Update coins
    gameState.coins = gameState.coins.filter(coin => {
      coin.update(gameState.currentSpeed);
      
      // Check collection
      if (coin.active && coin.checkCollection(gameState.player)) {
        gameState.score += 10;
        gameState.coinCount++;
        coin.active = false;
      }
      
      return coin.active;
    });

    // Check level completion
    const currentLevel = LEVELS[gameState.currentLevel - 1];
    if (gameState.distanceTraveledInLevel >= currentLevel.distance) {
      completeLevel(p);
    }
  }

  function completeLevel(p) {
    gameState.score += 500; // Level completion bonus
    gameState.gamePhase = GAME_PHASES.LEVEL_COMPLETE;
    gameState.levelCompleteTimer = 0;

    p.logs.game_info.push({
      data: { 
        phase: gameState.gamePhase, 
        level: gameState.currentLevel,
        score: gameState.score 
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function transitionToNextLevel(p) {
    gameState.currentLevel++;
    
    if (gameState.currentLevel > LEVELS.length) {
      // Game won!
      gameState.gamePhase = GAME_PHASES.GAME_WON;
      p.logs.game_info.push({
        data: { phase: gameState.gamePhase, score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      return;
    }

    // Setup next level
    gameState.distanceTraveledInLevel = 0;
    gameState.currentSpeed = gameState.baseSpeed * LEVELS[gameState.currentLevel - 1].speedMultiplier;
    gameState.gamePhase = GAME_PHASES.PLAYING;
    
    // Clear obstacles and coins
    gameState.obstacles = [];
    gameState.coins = [];

    p.logs.game_info.push({
      data: { 
        phase: gameState.gamePhase, 
        level: gameState.currentLevel,
        speed: gameState.currentSpeed
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function handlePlayerDeath(p) {
    gameState.player.state = PLAYER_STATES.DEAD;
    gameState.gamePhase = GAME_PHASES.GAME_OVER;

    p.logs.game_info.push({
      data: { 
        phase: gameState.gamePhase,
        score: gameState.score,
        level: gameState.currentLevel,
        distance: gameState.distanceTraveled
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function logPlayerInfo(p) {
    if (gameState.player && p.logs && p.logs.player_info) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.cameraZ,
        framecount: p.frameCount
      });
    }
  }

  p.keyPressed = function() {
    if (gameState.controlMode === 'HUMAN') {
      handleKeyPressed(p, p.key, p.keyCode);
    }
  };
});

// Expose the game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

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
  
  const activeBtn = document.getElementById(`${mode === 'HUMAN' ? 'humanModeBtn' : mode.toLowerCase() + '_ModeBtn'}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};