// game.js - Main game file
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, gameState, resetGameState } from './globals.js';
import { Player } from './player.js';
import { generateLevel } from './level_generator.js';
import { handleCollisions, checkEnemyCollision, checkCoinCollision, checkGoalCollision } from './physics.js';
import { renderBackground, renderUI, renderStartScreen, renderGameOverScreen } from './render.js';
import { getPlayerInputs, logInput, logGameInfo, logPlayerInfo } from './input_handler.js';
import { Particle } from './particles.js';
import './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let goal;
  let levelWidth;
  
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
    
    // Store p5 instance in gameState for access in other modules
    gameState.p = p;
    
    logGameInfo(p, { phase: gameState.gamePhase, message: "Game initialized" });
  };
  
  p.draw = function() {
    // Single background call to prevent flickering
    p.background(135, 206, 235);
    
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updateGame();
      renderGame();
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderGame();
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGame();
      renderGameOverScreen(p, gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN);
    }
  };
  
  function initGame() {
    resetGameState();
    
    // Generate level
    const levelData = generateLevel(p, gameState.currentLevel);
    gameState.platforms = levelData.platforms;
    gameState.enemies = levelData.enemies;
    gameState.coins = levelData.coins;
    gameState.powerups = levelData.powerups;
    goal = levelData.goal;
    levelWidth = levelData.levelWidth;
    
    // Create player
    gameState.player = new Player(p, 100, 200);
    gameState.entities.push(gameState.player);
    
    // Reset camera
    gameState.camera.x = 0;
    
    logGameInfo(p, { phase: GAME_PHASES.PLAYING, message: "Game started" });
    logPlayerInfo(p, gameState.player);
  }
  
  function updateGame() {
    const player = gameState.player;
    if (!player) return;
    
    // Get inputs
    const inputs = getPlayerInputs(p);
    
    // Update player
    player.update(inputs);
    
    // Physics
    handleCollisions(p, player, gameState.platforms);
    
    // Camera follow player
    gameState.camera.x = p.constrain(
      player.x - CANVAS_WIDTH / 3,
      0,
      p.max(0, levelWidth - CANVAS_WIDTH)
    );
    
    // Update enemies
    for (const enemy of gameState.enemies) {
      enemy.update();
      
      // Check collision with player
      if (checkEnemyCollision(p, player, enemy)) {
        if (player.takeDamage(1)) {
          // Create damage particles
          for (let i = 0; i < 5; i++) {
            gameState.particleEffects.push(
              new Particle(p, player.x + player.width / 2, player.y + player.height / 2, "damage")
            );
          }
          
          if (player.health <= 0) {
            gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
            logGameInfo(p, { phase: GAME_PHASES.GAME_OVER_LOSE, message: "Player died" });
          }
        }
      }
    }
    
    // Update coins
    for (const coin of gameState.coins) {
      if (!coin.collected) {
        coin.update();
        
        if (checkCoinCollision(p, player, coin)) {
          coin.collected = true;
          gameState.score += coin.value;
          
          // Create coin particles
          for (let i = 0; i < 8; i++) {
            gameState.particleEffects.push(
              new Particle(p, coin.x, coin.y, "coin")
            );
          }
        }
      }
    }
    
    // Update powerups
    for (const powerup of gameState.powerups) {
      if (!powerup.collected) {
        powerup.update();
        
        if (checkCoinCollision(p, player, powerup)) {
          powerup.collected = true;
          player.heal(1);
          
          // Create health particles
          for (let i = 0; i < 10; i++) {
            gameState.particleEffects.push(
              new Particle(p, powerup.x, powerup.y, "health")
            );
          }
        }
      }
    }
    
    // Update goal
    if (goal) {
      goal.update();
      
      if (checkGoalCollision(p, player, goal)) {
        gameState.score += 100;
        gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        logGameInfo(p, { phase: GAME_PHASES.GAME_OVER_WIN, message: "Level complete" });
      }
    }
    
    // Update particles
    for (let i = gameState.particleEffects.length - 1; i >= 0; i--) {
      const particle = gameState.particleEffects[i];
      particle.update();
      if (particle.isDead()) {
        gameState.particleEffects.splice(i, 1);
      }
    }
    
    // Check if player fell off the map
    if (player.y > CANVAS_HEIGHT + 100) {
      if (player.takeDamage(1)) {
        player.x = 100;
        player.y = 200;
        player.vx = 0;
        player.vy = 0;
        
        if (player.health <= 0) {
          gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
          logGameInfo(p, { phase: GAME_PHASES.GAME_OVER_LOSE, message: "Player fell" });
        }
      }
    }
    
    // Log player info periodically
    if (p.frameCount % 10 === 0) {
      logPlayerInfo(p, player);
    }
  }
  
  function renderGame() {
    renderBackground(p);
    
    // Render platforms
    for (const platform of gameState.platforms) {
      platform.render();
    }
    
    // Render coins
    for (const coin of gameState.coins) {
      if (!coin.collected) {
        coin.render();
      }
    }
    
    // Render powerups
    for (const powerup of gameState.powerups) {
      if (!powerup.collected) {
        powerup.render();
      }
    }
    
    // Render enemies
    for (const enemy of gameState.enemies) {
      enemy.render();
    }
    
    // Render goal
    if (goal) {
      goal.render();
    }
    
    // Render player
    if (gameState.player) {
      gameState.player.render();
    }
    
    // Render particles
    for (const particle of gameState.particleEffects) {
      particle.render();
    }
    
    // Render UI
    renderUI(p);
  }
  
  p.keyPressed = function() {
    logInput(p, "keyPressed", { key: p.key, keyCode: p.keyCode });
    
    // ENTER - Start game
    if (p.keyCode === 13) {
      if (gameState.gamePhase === GAME_PHASES.START) {
        initGame();
        gameState.gamePhase = GAME_PHASES.PLAYING;
      }
    }
    
    // ESC - Pause/Unpause
    if (p.keyCode === 27) {
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        logGameInfo(p, { phase: GAME_PHASES.PAUSED, message: "Game paused" });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        logGameInfo(p, { phase: GAME_PHASES.PLAYING, message: "Game resumed" });
      }
    }
    
    // R - Restart
    if (p.keyCode === 82) {
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE ||
          gameState.gamePhase === GAME_PHASES.PLAYING ||
          gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.START;
        logGameInfo(p, { phase: GAME_PHASES.START, message: "Game restarted" });
      }
    }
    
    return false;
  };
  
  p.keyReleased = function() {
    logInput(p, "keyReleased", { key: p.key, keyCode: p.keyCode });
    return false;
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 
                   'test_4_ModeBtn', 'test_5_ModeBtn'];
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