import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { initLevel, checkLevelObjectives } from './levels.js';
import { renderUI, renderStartScreen, renderGameOverScreen, renderLevelComplete } from './ui.js';
import { InputManager, TestController } from './input.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let inputManager;

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    inputManager = new InputManager();
    inputManager.testController = new TestController();

    // Initialize logs (write-only)
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };

    // Log initial state
    p.logs.game_info.push({
      data: { phase: 'START' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(30, 40, 60);

    if (gameState.gamePhase === 'START') {
      renderStartScreen(p);
    } else if (gameState.gamePhase === 'PLAYING') {
      updateGame();
      renderGame();
      renderUI(p);
    } else if (gameState.gamePhase === 'PAUSED') {
      renderGame();
      renderUI(p);
    } else if (gameState.gamePhase === 'LEVEL_COMPLETE') {
      renderGame();
      renderLevelComplete(p);
    } else if (gameState.gamePhase === 'GAME_OVER_WIN') {
      renderGameOverScreen(p, true);
    } else if (gameState.gamePhase === 'GAME_OVER_LOSE') {
      renderGameOverScreen(p, false);
    }
  };

  function updateGame() {
    gameState.framesSinceStart++;

    const keys = inputManager.getKeys();

    // Update player
    if (gameState.player) {
      gameState.player.update(keys, gameState.platforms);

      // Log player info every 60 frames
      if (gameState.framesSinceStart % 60 === 0) {
        p.logs.player_info.push({
          screen_x: gameState.player.x,
          screen_y: gameState.player.y,
          game_x: gameState.player.x,
          game_y: gameState.player.y,
          framecount: p.frameCount
        });
      }

      // Check player death
      if (gameState.player.hp <= 0) {
        gameState.gamePhase = 'GAME_OVER_LOSE';
        p.logs.game_info.push({
          data: { phase: 'GAME_OVER_LOSE', score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        return;
      }

      // Check player attack hit
      if (gameState.player.isAttacking) {
        const hitbox = gameState.player.getAttackHitbox();
        if (hitbox) {
          for (let enemy of gameState.enemies) {
            if (!enemy.isDead && p.collideRectRect(
              hitbox.x, hitbox.y, hitbox.width, hitbox.height,
              enemy.x, enemy.y, enemy.width, enemy.height
            )) {
              enemy.takeDamage(gameState.player.getCurrentAttackDamage());
            }
          }
        }
      }
    }

    // Update enemies
    for (let enemy of gameState.enemies) {
      enemy.update(gameState.platforms, gameState.player);
    }

    // Update items
    for (let item of gameState.items) {
      if (!item.collected) {
        item.checkCollection(gameState.player);
      }
    }

    // Update particles
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
      gameState.particles[i].update();
      if (gameState.particles[i].isDead()) {
        gameState.particles.splice(i, 1);
      }
    }

    // Check level objectives
    checkLevelObjectives();

    if (gameState.levelObjectivesMet) {
      if (gameState.currentLevel < 5) {
        gameState.gamePhase = 'LEVEL_COMPLETE';
        p.logs.game_info.push({
          data: { phase: 'LEVEL_COMPLETE', level: gameState.currentLevel },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
        
        // Auto-advance after 3 seconds
        setTimeout(() => {
          if (gameState.gamePhase === 'LEVEL_COMPLETE') {
            advanceLevel();
          }
        }, 3000);
      } else {
        // Won the game
        gameState.gamePhase = 'GAME_OVER_WIN';
        p.logs.game_info.push({
          data: { phase: 'GAME_OVER_WIN', score: gameState.score },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      gameState.levelObjectivesMet = false;
    }
  }

  function renderGame() {
    // Render platforms
    for (let platform of gameState.platforms) {
      platform.render();
    }

    // Render items
    for (let item of gameState.items) {
      item.render();
    }

    // Render enemies
    for (let enemy of gameState.enemies) {
      enemy.render();
    }

    // Render particles
    for (let particle of gameState.particles) {
      particle.render();
    }

    // Render player
    if (gameState.player) {
      gameState.player.render();
    }
  }

  function advanceLevel() {
    gameState.currentLevel++;
    initLevel(p, gameState.currentLevel);
    
    // Reset player
    gameState.player = new Player(p, 50, 300);
    gameState.entities = [gameState.player, ...gameState.enemies];
    
    gameState.gamePhase = 'PLAYING';
    p.logs.game_info.push({
      data: { phase: 'PLAYING', level: gameState.currentLevel },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function startGame() {
    gameState.score = 0;
    gameState.currentLevel = 1;
    gameState.framesSinceStart = 0;
    
    initLevel(p, 1);
    gameState.player = new Player(p, 50, 300);
    gameState.entities = [gameState.player, ...gameState.enemies];
    
    gameState.gamePhase = 'PLAYING';
    p.logs.game_info.push({
      data: { phase: 'PLAYING', level: 1 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function restartGame() {
    gameState.gamePhase = 'START';
    gameState.player = null;
    gameState.entities = [];
    p.logs.game_info.push({
      data: { phase: 'START' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  p.keyPressed = function() {
    inputManager.setKey(p.keyCode, true);

    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

    // Game phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === 'START') {
        startGame();
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === 'PLAYING') {
        gameState.gamePhase = 'PAUSED';
        p.logs.game_info.push({
          data: { phase: 'PAUSED' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === 'PAUSED') {
        gameState.gamePhase = 'PLAYING';
        p.logs.game_info.push({
          data: { phase: 'PLAYING' },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === 'GAME_OVER_WIN' || 
          gameState.gamePhase === 'GAME_OVER_LOSE') {
        restartGame();
      }
    }

    return false;
  };

  p.keyReleased = function() {
    inputManager.setKey(p.keyCode, false);

    p.logs.inputs.push({
      input_type: 'keyReleased',
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });

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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                            mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                                            'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};