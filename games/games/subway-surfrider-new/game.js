// game.js - Main game file
import { gameState, getGameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, LANE_POSITIONS, LEVELS } from './globals.js';
import { Player } from './player.js';
import { renderBackground } from './background.js';
import { renderUI, renderStartScreen, renderGameOverScreen, renderWinScreen } from './ui.js';
import { handleInput } from './input.js';
import { spawnEntities } from './spawner.js';
import { checkCollisions } from './collision.js';
import { getTestAction, executeTestAction } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let player;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs (write-only)
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Initialize player
    player = new Player(p);
    gameState.player = player;
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START", action: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER) {
      renderBackground(p, gameState.distanceRun);
      renderAllEntities(p);
      renderGameOverScreen(p);
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASES.WIN) {
      renderBackground(p, gameState.distanceRun);
      renderAllEntities(p);
      renderWinScreen(p);
      return;
    }
    
    if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderBackground(p, gameState.distanceRun);
      renderAllEntities(p);
      renderUI(p, player);
      return;
    }
    
    // PLAYING phase
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.framesSinceStart++;
      
      // Handle automated testing
      if (gameState.controlMode !== "HUMAN") {
        const testAction = getTestAction(p);
        if (testAction) {
          executeTestAction(p, player, testAction);
        }
      }
      
      // Update game speed
      const level = LEVELS[gameState.currentLevel];
      gameState.gameSpeed = Math.min(
        level.initialSpeed + gameState.framesSinceStart * level.speedIncrement / 60,
        level.initialSpeed + 5
      );
      
      // Update distance
      gameState.distanceRun += gameState.gameSpeed / 10;
      
      // Update score based on distance
      if (p.frameCount % 10 === 0) {
        const multiplier = gameState.currentLevel + 1;
        gameState.score += Math.floor(1 * multiplier);
      }
      
      // Check level completion
      if (gameState.distanceRun >= level.distanceGoal) {
        completeLevel(p);
        return;
      }
      
      // Update player
      player.update();
      
      // Spawn entities
      if (p.frameCount % 3 === 0) {
        spawnEntities(p);
      }
      
      // Update entities
      updateEntities(p);
      
      // Check collisions
      const collisionResult = checkCollisions(p, player);
      if (collisionResult.collision) {
        gameOver(p);
        return;
      }
      
      // Log player info periodically
      if (p.frameCount % 30 === 0) {
        p.logs.player_info.push({
          screen_x: player.x,
          screen_y: player.y,
          game_x: player.x,
          game_y: player.y,
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      
      // Render
      renderBackground(p, gameState.distanceRun);
      renderAllEntities(p);
      renderUI(p, player);
    }
  };
  
  function updateEntities(p) {
    // Update and clean up inactive entities
    gameState.obstacles = gameState.obstacles.filter(obstacle => {
      if (obstacle.active) {
        obstacle.update(gameState.gameSpeed);
        return true;
      }
      return false;
    });
    
    gameState.coins = gameState.coins.filter(coin => {
      if (coin.active) {
        coin.update(gameState.gameSpeed);
        return true;
      }
      return false;
    });
    
    gameState.powerups = gameState.powerups.filter(powerup => {
      if (powerup.active) {
        powerup.update(gameState.gameSpeed);
        return true;
      }
      return false;
    });
  }
  
  function renderAllEntities(p) {
    // Sort entities by z-value (highest z first = furthest away first) for proper depth ordering
    const sortedObstacles = [...gameState.obstacles].sort((a, b) => b.z - a.z);
    const sortedCoins = [...gameState.coins].sort((a, b) => b.z - a.z);
    const sortedPowerups = [...gameState.powerups].sort((a, b) => b.z - a.z);
    
    // Render obstacles
    for (const obstacle of sortedObstacles) {
      if (obstacle.active) {
        obstacle.render();
      }
    }
    
    // Render coins
    for (const coin of sortedCoins) {
      if (coin.active && !coin.collected) {
        coin.render();
      }
    }
    
    // Render powerups
    for (const powerup of sortedPowerups) {
      if (powerup.active && !powerup.collected) {
        powerup.render();
      }
    }
    
    // Render player on top
    player.render();
  }
  
  function completeLevel(p) {
    // Award level completion bonus
    const multiplier = gameState.currentLevel + 1;
    gameState.score += Math.floor(500 * multiplier);
    
    // Check if all levels completed
    if (gameState.currentLevel >= LEVELS.length - 1) {
      // WIN!
      gameState.gamePhase = GAME_PHASES.WIN;
      
      p.logs.game_info.push({
        data: { phase: "WIN", score: gameState.score, distance: gameState.distanceRun },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else {
      // Next level
      gameState.currentLevel++;
      gameState.framesSinceStart = 0;
      
      p.logs.game_info.push({
        data: { 
          phase: "LEVEL_COMPLETE", 
          level: gameState.currentLevel,
          score: gameState.score 
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  function gameOver(p) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER;
    
    p.logs.game_info.push({
      data: { 
        phase: "GAME_OVER", 
        score: gameState.score,
        distance: gameState.distanceRun,
        level: gameState.currentLevel + 1
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  p.keyPressed = function() {
    // Log all key presses
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    handleInput(p, player, p.keyCode);
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
  
  console.log('Control mode set to:', mode);
};