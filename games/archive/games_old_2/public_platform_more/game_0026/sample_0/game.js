// game.js
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, CONTROL_HUMAN, WORLD_MATERIAL, WORLD_ENERGY } from './globals.js';
import { Player } from './player.js';
import { createLevel, TOTAL_LEVELS } from './levels.js';
import { renderStartScreen, renderGame, renderGameOver } from './rendering.js';
import { handleKeyPressed, handleKeyReleased } from './input.js';
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
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize game state
    gameState.gamePhase = PHASE_START;
    gameState.controlMode = CONTROL_HUMAN;
    
    p.logs.game_info.push({
      data: { event: "game_initialized", gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    // Single background call to prevent flickering
    p.background(20, 15, 35);
    
    if (gameState.gamePhase === PHASE_START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED) {
      // Initialize level if needed
      if (!gameState.player) {
        initializeLevel(p);
      }
      
      // Update game (only if not paused)
      if (gameState.gamePhase === PHASE_PLAYING) {
        updateGame(p);
      }
      
      // Render game
      renderGame(p);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      renderGameOver(p);
    }
  };

  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };

  p.keyReleased = function() {
    handleKeyReleased(p, p.key, p.keyCode);
  };

  function initializeLevel(p) {
    const levelData = createLevel(gameState.currentLevel);
    
    gameState.platforms = levelData.platforms;
    gameState.enemies = levelData.enemies;
    gameState.spirit = levelData.spirit;
    
    gameState.player = new Player(levelData.playerStart.x, levelData.playerStart.y);
    gameState.entities = [gameState.player, ...gameState.enemies];
    if (gameState.spirit) {
      gameState.entities.push(gameState.spirit);
    }
    
    gameState.levelComplete = false;
    gameState.currentWorld = WORLD_MATERIAL;
    
    // Reset keys
    gameState.keys = {
      left: false,
      right: false,
      jump: false,
      shift: false
    };
    
    p.logs.game_info.push({
      data: { event: "level_initialized", level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    logPlayerInfo(p);
  }

  function updateGame(p) {
    // Handle automated testing
    if (gameState.controlMode !== CONTROL_HUMAN && gameState.player) {
      const action = get_automated_testing_action(gameState);
      
      // Apply actions
      gameState.keys.left = action.left || false;
      gameState.keys.right = action.right || false;
      gameState.keys.jump = action.jump || false;
      
      // Handle world shift
      if (action.shift && !gameState.keys.shift) {
        gameState.currentWorld = gameState.currentWorld === WORLD_MATERIAL ? WORLD_ENERGY : WORLD_MATERIAL;
        p.logs.game_info.push({
          data: { action: "worldShift", currentWorld: gameState.currentWorld },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      gameState.keys.shift = action.shift || false;
    }
    
    // Update player
    if (gameState.player) {
      const result = gameState.player.update(p);
      
      if (result === 'FALL') {
        // Player fell - game over
        gameState.gamePhase = PHASE_GAME_OVER_LOSE;
        p.logs.game_info.push({
          data: { event: "game_over", reason: "fell", gamePhase: gameState.gamePhase },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        return;
      }
      
      // Check enemy collisions
      for (const enemy of gameState.enemies) {
        if (enemy.world === gameState.currentWorld) {
          if (gameState.player.checkEnemyCollision(enemy, p)) {
            gameState.gamePhase = PHASE_GAME_OVER_LOSE;
            p.logs.game_info.push({
              data: { event: "game_over", reason: "enemy_collision", gamePhase: gameState.gamePhase },
              framecount: p.frameCount,
              timestamp: Date.now()
            });
            return;
          }
        }
      }
      
      // Check spirit collision
      if (gameState.spirit && gameState.player.checkSpiritCollision(gameState.spirit, p)) {
        gameState.score += 100;
        gameState.currentLevel++;
        
        p.logs.game_info.push({
          data: { event: "level_complete", level: gameState.currentLevel - 1, score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        
        if (gameState.currentLevel >= TOTAL_LEVELS) {
          // Game won!
          gameState.gamePhase = PHASE_GAME_OVER_WIN;
          p.logs.game_info.push({
            data: { event: "game_won", gamePhase: gameState.gamePhase, finalScore: gameState.score },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        } else {
          // Load next level
          gameState.player = null;
        }
        return;
      }
      
      // Log player info periodically
      if (p.frameCount % 30 === 0) {
        logPlayerInfo(p);
      }
    }
    
    // Update enemies
    for (const enemy of gameState.enemies) {
      enemy.update();
    }
    
    // Update spirit
    if (gameState.spirit) {
      gameState.spirit.update();
    }
  }

  function logPlayerInfo(p) {
    if (gameState.player) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  }
});

// Expose globally
window.gameInstance = gameInstance;

// Control mode switcher
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
  
  gameInstance.logs.game_info.push({
    data: { event: "control_mode_changed", controlMode: mode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};