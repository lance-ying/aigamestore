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
import { renderUI, renderArena, setDamageFlash } from './ui.js';

const p5 = window.p5;
let aiControllers = [];
let enterKeyPressed = false;

let gameInstance = new p5(p => {
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Add global keyboard event listener for more reliable Enter key handling
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' || event.keyCode === 13) {
        if (gameState.gamePhase === PHASE_LEVEL_COMPLETE) {
          event.preventDefault();
          advanceToNextLevel();
        } else if (gameState.gamePhase === PHASE_START) {
          event.preventDefault();
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
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
               gameState.gamePhase === PHASE_GAME_OVER_LOSE ||
               gameState.gamePhase === PHASE_LEVEL_COMPLETE) {
      renderUI(p);
    }
    
    // Reset enter key flag at end of frame
    enterKeyPressed = false;
  };

  p.keyPressed = function() {
    if (p.keyCode === 13) { // ENTER
      if (enterKeyPressed) return false; // Prevent double-trigger within same frame
      enterKeyPressed = true;
      
      if (gameState.gamePhase === PHASE_START) {
        initializeLevel(1);
      } else if (gameState.gamePhase === PHASE_LEVEL_COMPLETE) {
        advanceToNextLevel();
      }
      return false;
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
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
    const config = LEVEL_CONFIGS[levelNumber];
    
    if (!config) {
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
    
    // Clear all entities
    clearEntities();
    
    // Spawn new entities for this level
    spawnLevelEntities(config);
    
    gameState.playerLength = gameState.player.getLength();
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
    
    if (currentLevel >= 3) {
      // All levels complete - show victory
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
    } else {
      // Advance to next level
      const nextLevel = currentLevel + 1;
      initializeLevel(nextLevel);
    }
  }

  function resetToMainMenu() {
    gameState.gamePhase = PHASE_START;
    gameState.currentLevel = 1;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.playerLength = 0;
    gameState.framesSurvived = 0;
    gameState.lastSurvivalBonus = 0;
    
    clearEntities();
  }

  function handlePlayerDeath() {
    gameState.lives--;

    // Trigger damage flash effect
    setDamageFlash(30); // Strong flash on death

    if (gameState.lives <= 0) {
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    } else {
      // Respawn player while preserving their state
      respawnPlayer();
    }
  }

  function respawnPlayer() {
    const config = LEVEL_CONFIGS[gameState.currentLevel];
    
    // Get current player state before they die
    const currentHead = gameState.player ? gameState.player.getHead() : { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
    const currentDirection = gameState.player ? gameState.player.direction.copy() : null;
    const currentSpeed = gameState.player ? gameState.player.speed : null;
    const wasBoosting = gameState.player ? gameState.player.isBoosting : false;
    
    // Clear any mass drops from the previous death
    gameState.massDrops = [];
    
    // Respawn player at their current location with preserved direction and speed
    const respawnX = currentHead.x;
    const respawnY = currentHead.y;
    gameState.player = new Snake(
      p, 
      respawnX, 
      respawnY, 
      config.playerStartLength, 
      gameState.playerSkinColor, 
      true,
      currentDirection,
      currentSpeed,
      wasBoosting
    );
    
    // Set invincibility frames for respawn protection
    gameState.player.invincibilityFrames = gameState.player.maxInvincibilityFrames;
    
    gameState.entities[0] = gameState.player; // Replace first entity which should be player
    
    gameState.playerLength = gameState.player.getLength();
  }

  function updateGame() {
    if (!gameState.player) return;

    const config = LEVEL_CONFIGS[gameState.currentLevel];

    // Handle human input continuously for smooth turning
    handlePlayerInput();

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

      // Body collisions - now causes damage instead of instant death
      if (checkSnakeBodyCollision(p, gameState.player, allSnakes)) {
        const died = gameState.player.takeDamage(8);
        if (died) {
          handlePlayerDeath();
        } else {
          // Trigger visual feedback for damage
          setDamageFlash(15);
        }
      }

      // Obstacle collisions - now causes damage instead of instant death
      if (checkSnakeObstacleCollision(p, gameState.player, gameState.obstacles)) {
        const died = gameState.player.takeDamage(6);
        if (died) {
          handlePlayerDeath();
        } else {
          // Trigger visual feedback for damage
          setDamageFlash(12);
        }
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
    }
  }

  function handleLevelComplete() {
    // Award level completion bonus
    gameState.score += LEVEL_COMPLETE_BONUS;
    
    const currentLevel = gameState.currentLevel;
    
    if (currentLevel === 3) {
      // Final level completed - instant win
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
    } else {
      // Level completed - show completion screen
      gameState.gamePhase = PHASE_LEVEL_COMPLETE;
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
});

// Control mode switching
window.setControlMode = function(mode) {
  // Since only 'HUMAN' mode remains, ensure it's always set to HUMAN
  gameState.controlMode = 'HUMAN'; 
  
  // Ensure the humanModeBtn is active
  const humanModeBtn = document.getElementById('humanModeBtn');
  if (humanModeBtn) {
    humanModeBtn.classList.add('active');
  }
};