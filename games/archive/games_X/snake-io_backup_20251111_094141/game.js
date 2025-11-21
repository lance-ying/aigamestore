// game.js - Main game logic

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  TARGET_FPS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  PHASE_LEVEL_COMPLETE,
  CONTROL_HUMAN,
  LEVEL_CONFIGS,
  PELLET_VALUE,
  MASS_VALUE,
  SURVIVAL_BONUS_INTERVAL,
  SURVIVAL_BONUS_POINTS,
  LEVEL_COMPLETE_BONUS,
  BOOST_COST,
} from './globals.js';

import { Snake } from './entities.js';
import { AIController } from './ai.js';
import { 
  checkSnakePelletCollision,
  checkSnakeMassCollision,
  checkSnakeBodyCollision,
  checkSnakeObstacleCollision,
} from './collision.js';
import {
  spawnPlayer,
  spawnAISnakes,
  spawnPellets,
  spawnMassDrops,
  spawnObstacles,
} from './spawner.js';
import { getTestAction } from './testing.js';
import { renderUI, renderArena } from './ui.js';

const p5 = window.p5;
let aiControllers = [];
let enterKeyPressed = false;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    game_info: [],
    inputs: [],
    player_info: []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    logGameInfo('Game initialized', { phase: gameState.gamePhase });
    
    // Add global keyboard event listener for more reliable Enter key handling
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' || event.keyCode === 13) {
        if (gameState.gamePhase === PHASE_LEVEL_COMPLETE) {
          event.preventDefault();
          logGameInfo('Global Enter handler: Level complete screen', { 
            currentLevel: gameState.currentLevel 
          });
          advanceToNextLevel();
        } else if (gameState.gamePhase === PHASE_START) {
          event.preventDefault();
          logGameInfo('Global Enter handler: Start screen');
          initializeLevel(1);
        }
      }
    });
  };

  p.draw = function() {
    if (gameState.gamePhase === PHASE_START) {
      renderUI(p);
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame();
      renderGame();
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      renderGame();
      renderUI(p);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
               gameState.gamePhase === PHASE_GAME_OVER_LOSE ||
               gameState.gamePhase === PHASE_LEVEL_COMPLETE) {
      renderUI(p);
    }
    
    // Reset enter key flag at end of frame
    enterKeyPressed = false;
  };

  p.keyPressed = function() {
    logInput('keyPressed', { key: p.key, keyCode: p.keyCode });

    if (p.keyCode === 13) { // ENTER
      if (enterKeyPressed) return false; // Prevent double-trigger within same frame
      enterKeyPressed = true;
      
      if (gameState.gamePhase === PHASE_START) {
        logGameInfo('Starting game from START screen', { level: 1 });
        initializeLevel(1);
      } else if (gameState.gamePhase === PHASE_LEVEL_COMPLETE) {
        logGameInfo('Player pressed ENTER on level complete screen', { 
          currentLevel: gameState.currentLevel 
        });
        advanceToNextLevel();
      }
      return false;
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
        logGameInfo('Game paused', { phase: gameState.gamePhase });
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
        logGameInfo('Game resumed', { phase: gameState.gamePhase });
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === PHASE_PAUSED ||
          gameState.gamePhase === PHASE_GAME_OVER_WIN ||
          gameState.gamePhase === PHASE_GAME_OVER_LOSE ||
          gameState.gamePhase === PHASE_LEVEL_COMPLETE) {
        resetToMainMenu();
      }
    }
  };

  function handlePlayerInput() {
    if (!gameState.player || !gameState.player.isAlive) return;

    // Continuous turning - check if keys are held down
    if (p.keyIsDown(37) || p.keyIsDown(65)) { // LEFT or A
      gameState.player.turnLeft();
    }
    if (p.keyIsDown(39) || p.keyIsDown(68)) { // RIGHT or D
      gameState.player.turnRight();
    }
    
    // Boost
    if (p.keyIsDown(32) || p.keyIsDown(16)) { // SPACE or SHIFT
      if (gameState.player.activateBoost()) {
        const ejected = gameState.player.ejectMass(BOOST_COST);
        const newMass = spawnMassDrops(p, ejected.map(e => e.pos), gameState.player.color);
        gameState.massDrops.push(...newMass);
      }
    } else {
      gameState.player.deactivateBoost();
    }
  }

  function initializeLevel(levelNumber) {
    logGameInfo('Initializing level', { 
      level: levelNumber, 
      previousPhase: gameState.gamePhase,
      currentScore: gameState.score 
    });
    
    const config = LEVEL_CONFIGS[levelNumber];
    
    if (!config) {
      logGameInfo('ERROR: Invalid level number', { level: levelNumber });
      return;
    }
    
    // Preserve score when advancing levels, reset lives only when starting from main menu
    const preservedScore = (levelNumber === 1 && gameState.gamePhase === PHASE_START) ? 0 : gameState.score;
    const resetLives = (levelNumber === 1 && gameState.gamePhase === PHASE_START);
    
    // Set level state
    gameState.currentLevel = levelNumber;
    gameState.score = preservedScore;
    if (resetLives) {
      gameState.lives = 3;
    }
    gameState.gamePhase = PHASE_PLAYING;
    gameState.targetLength = config.targetLength;
    gameState.framesSurvived = 0;
    gameState.lastSurvivalBonus = 0;
    gameState.testModeTimer = 0;
    
    // Clear all entities
    clearEntities();
    
    // Spawn new entities for this level
    spawnLevelEntities(config);
    
    gameState.playerLength = gameState.player.getLength();
    
    logGameInfo('Level initialized successfully', { 
      phase: gameState.gamePhase, 
      level: levelNumber,
      targetLength: config.targetLength,
      playerLength: gameState.playerLength,
      aiCount: gameState.aiSnakes.length,
      score: gameState.score,
      lives: gameState.lives
    });
    logPlayerInfo();
  }

  function clearEntities() {
    gameState.entities = [];
    gameState.aiSnakes = [];
    gameState.pellets = [];
    gameState.massDrops = [];
    gameState.obstacles = [];
    gameState.player = null;
    aiControllers = [];
  }

  function spawnLevelEntities(config) {
    // Spawn player
    gameState.player = spawnPlayer(p, config, gameState.playerSkinColor);
    gameState.entities = [gameState.player];
    
    // Spawn AI snakes
    gameState.aiSnakes = spawnAISnakes(p, config);
    gameState.entities.push(...gameState.aiSnakes);
    
    // Spawn obstacles
    gameState.obstacles = spawnObstacles(p, config);
    
    // Spawn pellets
    gameState.pellets = spawnPellets(p, config.pelletDensity, [], gameState.obstacles);
    
    // Create AI controllers
    aiControllers = [];
    for (let snake of gameState.aiSnakes) {
      aiControllers.push(new AIController(p, snake, config));
    }
  }

  function advanceToNextLevel() {
    const currentLevel = gameState.currentLevel;
    
    logGameInfo('Attempting to advance to next level', { 
      currentLevel: currentLevel,
      phase: gameState.gamePhase
    });
    
    if (currentLevel >= 3) {
      // All levels complete - show victory
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      logGameInfo('All levels complete - victory!', { 
        finalScore: gameState.score 
      });
    } else {
      // Advance to next level
      const nextLevel = currentLevel + 1;
      logGameInfo('Advancing to next level', { 
        currentLevel: currentLevel, 
        nextLevel: nextLevel,
        score: gameState.score 
      });
      initializeLevel(nextLevel);
    }
  }

  function resetToMainMenu() {
    logGameInfo('Resetting to main menu', { previousPhase: gameState.gamePhase });
    
    gameState.gamePhase = PHASE_START;
    gameState.currentLevel = 1;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.playerLength = 0;
    gameState.framesSurvived = 0;
    gameState.lastSurvivalBonus = 0;
    
    clearEntities();
    
    logGameInfo('Reset complete', { phase: gameState.gamePhase });
  }

  function handlePlayerDeath() {
    gameState.lives--;
    logGameInfo('Player died', { 
      livesRemaining: gameState.lives,
      cause: 'collision'
    });

    if (gameState.lives <= 0) {
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
      logGameInfo('Game over - no lives remaining', { 
        phase: gameState.gamePhase,
        finalScore: gameState.score
      });
    } else {
      // Respawn player
      respawnPlayer();
    }
  }

  function respawnPlayer() {
    const config = LEVEL_CONFIGS[gameState.currentLevel];
    
    // Clear any mass drops from the previous death
    gameState.massDrops = [];
    
    // Respawn player at center
    gameState.player = spawnPlayer(p, config, gameState.playerSkinColor);
    gameState.entities[0] = gameState.player; // Replace first entity which should be player
    
    gameState.playerLength = gameState.player.getLength();
    
    logGameInfo('Player respawned', { 
      lives: gameState.lives,
      playerLength: gameState.playerLength
    });
  }

  function updateGame() {
    if (!gameState.player) return;

    const config = LEVEL_CONFIGS[gameState.currentLevel];

    // Handle test mode input
    if (gameState.controlMode !== CONTROL_HUMAN) {
      const action = getTestAction(p);
      if (action && gameState.player.isAlive) {
        if (action.left) gameState.player.turnLeft();
        if (action.right) gameState.player.turnRight();
        if (action.boost && gameState.player.activateBoost()) {
          const ejected = gameState.player.ejectMass(BOOST_COST);
          const newMass = spawnMassDrops(p, ejected.map(e => e.pos), gameState.player.color);
          gameState.massDrops.push(...newMass);
        }
      }
    } else {
      // Handle human input continuously for smooth turning
      handlePlayerInput();
    }

    // Update player
    if (gameState.player.isAlive) {
      gameState.player.update();
    }

    // Update AI snakes
    const allSnakes = [gameState.player, ...gameState.aiSnakes];
    for (let i = 0; i < aiControllers.length; i++) {
      const controller = aiControllers[i];
      const snake = gameState.aiSnakes[i];
      
      if (snake.isAlive) {
        controller.update(gameState.pellets, gameState.massDrops, allSnakes, gameState.obstacles);
        snake.update();
      }
    }

    // Update obstacles
    for (let obstacle of gameState.obstacles) {
      obstacle.update();
    }

    // Update pellets
    for (let pellet of gameState.pellets) {
      pellet.update();
    }

    // Check collisions for player
    if (gameState.player.isAlive) {
      // Pellets
      const collectedPellets = checkSnakePelletCollision(p, gameState.player, gameState.pellets);
      for (let pellet of collectedPellets) {
        gameState.player.grow(1);
        gameState.score += PELLET_VALUE;
      }

      // Mass
      const collectedMass = checkSnakeMassCollision(p, gameState.player, gameState.massDrops);
      for (let mass of collectedMass) {
        gameState.player.grow(1);
        gameState.score += MASS_VALUE;
      }

      // Body collisions
      if (checkSnakeBodyCollision(p, gameState.player, allSnakes)) {
        gameState.player.isAlive = false;
        handlePlayerDeath();
      }

      // Obstacle collisions
      if (checkSnakeObstacleCollision(p, gameState.player, gameState.obstacles)) {
        gameState.player.isAlive = false;
        handlePlayerDeath();
      }
    }

    // Check collisions for AI snakes
    for (let i = gameState.aiSnakes.length - 1; i >= 0; i--) {
      const snake = gameState.aiSnakes[i];
      if (!snake.isAlive) continue;

      // Pellets
      const collectedPellets = checkSnakePelletCollision(p, snake, gameState.pellets);
      for (let pellet of collectedPellets) {
        snake.grow(1);
      }

      // Mass
      const collectedMass = checkSnakeMassCollision(p, snake, gameState.massDrops);
      for (let mass of collectedMass) {
        snake.grow(1);
      }

      // Body collisions and obstacle collisions
      if (checkSnakeBodyCollision(p, snake, allSnakes) ||
          checkSnakeObstacleCollision(p, snake, gameState.obstacles)) {
        const mass = snake.explode();
        const newMass = spawnMassDrops(p, mass.map(m => m.pos), snake.color);
        gameState.massDrops.push(...newMass);
        gameState.aiSnakes.splice(i, 1);
        aiControllers.splice(i, 1);
      }
    }

    // Maintain pellet density
    gameState.pellets = spawnPellets(p, config.pelletDensity, gameState.pellets, gameState.obstacles);

    // Update player length and check win condition
    if (gameState.player && gameState.player.isAlive) {
      gameState.playerLength = gameState.player.getLength();
      
      // Check if level target is reached - ONLY call handleLevelComplete if still in PLAYING phase
      if (gameState.playerLength >= config.targetLength && gameState.gamePhase === PHASE_PLAYING) {
        handleLevelComplete();
      }

      // Survival bonus
      gameState.framesSurvived++;
      if (gameState.framesSurvived - gameState.lastSurvivalBonus >= SURVIVAL_BONUS_INTERVAL) {
        gameState.score += SURVIVAL_BONUS_POINTS;
        gameState.lastSurvivalBonus = gameState.framesSurvived;
      }

      // Log player info periodically
      if (p.frameCount % 60 === 0) {
        logPlayerInfo();
      }
    }
  }

  function handleLevelComplete() {
    // Award level completion bonus
    gameState.score += LEVEL_COMPLETE_BONUS;
    
    const currentLevel = gameState.currentLevel;
    
    if (currentLevel === 3) {
      // Final level completed - instant win
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      logGameInfo('Final level complete - Game won!', { 
        phase: gameState.gamePhase,
        finalScore: gameState.score
      });
    } else {
      // Level completed - show completion screen
      gameState.gamePhase = PHASE_LEVEL_COMPLETE;
      logGameInfo('Level complete - awaiting player input', { 
        phase: gameState.gamePhase,
        level: currentLevel,
        score: gameState.score,
        nextLevel: currentLevel + 1
      });
    }
  }

  function renderGame() {
    renderArena(p);

    // Render obstacles
    for (let obstacle of gameState.obstacles) {
      obstacle.render();
    }

    // Render pellets
    for (let pellet of gameState.pellets) {
      pellet.render();
    }

    // Render mass drops
    for (let mass of gameState.massDrops) {
      mass.render();
    }

    // Render snakes (AI first, then player on top)
    for (let snake of gameState.aiSnakes) {
      snake.render();
    }
    if (gameState.player) {
      gameState.player.render();
    }

    // Render UI
    renderUI(p);
  }

  function logGameInfo(message, data) {
    p.logs.game_info.push({
      message,
      data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function logInput(inputType, data) {
    p.logs.inputs.push({
      input_type: inputType,
      data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function logPlayerInfo() {
    if (!gameState.player) return;
    
    const head = gameState.player.getHead();
    p.logs.player_info.push({
      screen_x: head.x,
      screen_y: head.y,
      game_x: head.x,
      game_y: head.y,
      length: gameState.playerLength,
      score: gameState.score,
      framecount: p.frameCount
    });
  }
});

// Expose game instance and state
window.gameInstance = gameInstance;
window.getGameState = function() {
  return gameState;
};

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  gameState.testModeTimer = 0;
  
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