// game.js - Main game file

import { 
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_STAGE_TRANSITION,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE
} from './globals.js';

import { Player, Enemy } from './entities.js';
import { initializeGrid, findAllMatches, applyGravity, hasValidMoves, swapCells } from './grid.js';
import { calculateMatchDamage, chargeMeter, enemyTurn, checkGameOver } from './combat.js';
import { drawStartScreen, drawGame, drawGameOver, drawStageTransition } from './rendering.js';
import { handleKeyPressed, processAutomatedInput } from './input.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Game setup
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Main draw loop
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action) {
        processAutomatedInput(p, action);
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case PHASE_START:
        drawStartScreen(p);
        break;
      case PHASE_PLAYING:
      case PHASE_PAUSED:
        drawGame(p);
        updateGame(p);
        break;
      case PHASE_STAGE_TRANSITION:
        drawStageTransition(p);
        updateTransition(p);
        break;
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        drawGameOver(p);
        break;
    }
  };
  
  // Update transition phase
  function updateTransition(p) {
    gameState.transitionTimer++;
    
    // After 120 frames (2 seconds), advance to next stage
    if (gameState.transitionTimer > 120) {
      gameState.stage++;
      gameState.currentEnemy = new Enemy(gameState.stage);
      gameState.enemyHP = gameState.currentEnemy.hp;
      gameState.enemyMaxHP = gameState.currentEnemy.maxHP;
      gameState.isPlayerTurn = true;
      gameState.gamePhase = PHASE_PLAYING;
      gameState.transitionTimer = 0;
      
      p.logs.game_info.push({
        data: { gamePhase: PHASE_PLAYING, stage: gameState.stage },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // Update game logic
  function updateGame(p) {
    if (gameState.gamePhase !== PHASE_PLAYING) return;
    
    // Handle invalid swap animation
    if (gameState.invalidSwap) {
      gameState.invalidSwapTimer++;
      
      if (gameState.invalidSwapTimer > 20) {
        // Swap back to original position
        if (gameState.invalidSwapCells) {
          swapCells(gameState.grid,
                   gameState.invalidSwapCells.x1, gameState.invalidSwapCells.y1,
                   gameState.invalidSwapCells.x2, gameState.invalidSwapCells.y2);
        }
        gameState.invalidSwap = false;
        gameState.invalidSwapTimer = 0;
        gameState.invalidSwapCells = null;
      }
      return;
    }
    
    // Handle animations
    if (gameState.animating) {
      gameState.animationTimer++;
      
      if (gameState.animationTimer > 30) {
        gameState.animating = false;
        gameState.animationTimer = 0;
        gameState.damageDealt = 0;
        
        // Check if enemy defeated
        if (checkGameOver()) {
          if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
              gameState.gamePhase === PHASE_GAME_OVER_LOSE ||
              gameState.gamePhase === PHASE_STAGE_TRANSITION) {
            p.logs.game_info.push({
              data: { gamePhase: gameState.gamePhase, finalScore: gameState.score },
              framecount: p.frameCount,
              timestamp: Date.now()
            });
            return;
          }
        }
      }
      return;
    }
    
    // Process matches if not player turn
    if (!gameState.isPlayerTurn) {
      const matches = findAllMatches(gameState.grid);
      
      if (matches.length > 0) {
        // Calculate damage
        const result = calculateMatchDamage(matches);
        gameState.currentEnemy.takeDamage(result.damage);
        gameState.score += result.score;
        
        // Charge meters
        const colorCounts = {};
        matches.forEach(m => {
          colorCounts[m.color] = (colorCounts[m.color] || 0) + 1;
        });
        
        for (const color in colorCounts) {
          chargeMeter(parseInt(color), colorCounts[color]);
        }
        
        // Clear matched cells
        matches.forEach(cell => {
          gameState.grid[cell.y][cell.x] = -1;
        });
        
        // Start animation
        gameState.matchedCells = matches;
        gameState.damageDealt = result.damage;
        gameState.animating = true;
        gameState.animationTimer = 0;
        
        // Apply gravity after animation
        setTimeout(() => {
          applyGravity(gameState.grid, p);
        }, 500);
        
        // Log player info
        if (gameState.player) {
          p.logs.player_info.push({
            screen_x: 100,
            screen_y: 50,
            game_x: 100,
            game_y: 50,
            framecount: p.frameCount
          });
        }
        
      } else {
        // No more matches - check valid moves
        if (!hasValidMoves(gameState.grid)) {
          // Reshuffle grid
          gameState.grid = initializeGrid(p);
        }
        
        // Enemy turn
        if (!checkGameOver()) {
          const damage = enemyTurn(gameState.currentEnemy, gameState.player);
          
          if (checkGameOver()) {
            p.logs.game_info.push({
              data: { gamePhase: gameState.gamePhase },
              framecount: p.frameCount,
              timestamp: Date.now()
            });
            return;
          }
        }
        
        gameState.isPlayerTurn = true;
      }
    }
  }
  
  // Key press handler
  p.keyPressed = function() {
    const keyCode = p.keyCode;
    
    // Phase transition keys
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === PHASE_START) {
        startGame(p);
        p.logs.game_info.push({
          data: { gamePhase: PHASE_PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === PHASE_STAGE_TRANSITION) {
        // Allow skipping transition
        gameState.stage++;
        gameState.currentEnemy = new Enemy(gameState.stage);
        gameState.enemyHP = gameState.currentEnemy.hp;
        gameState.enemyMaxHP = gameState.currentEnemy.maxHP;
        gameState.isPlayerTurn = true;
        gameState.gamePhase = PHASE_PLAYING;
        gameState.transitionTimer = 0;
      }
      return false;
    }
    
    if (keyCode === 27) { // ESC
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
        p.logs.game_info.push({
          data: { gamePhase: PHASE_PAUSED },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
        p.logs.game_info.push({
          data: { gamePhase: PHASE_PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return false;
    }
    
    if (keyCode === 82) { // R
      if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
          gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
        resetGame(p);
        p.logs.game_info.push({
          data: { gamePhase: PHASE_START },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
      return false;
    }
    
    // Gameplay keys
    handleKeyPressed(p, keyCode);
    return false;
  };
  
  function startGame(p) {
    // Initialize player
    gameState.player = new Player();
    gameState.playerHP = gameState.player.hp;
    gameState.playerMaxHP = gameState.player.maxHP;
    
    // Initialize grid
    gameState.grid = initializeGrid(p);
    
    // Initialize enemy
    gameState.currentEnemy = new Enemy(gameState.stage);
    gameState.enemyHP = gameState.currentEnemy.hp;
    gameState.enemyMaxHP = gameState.currentEnemy.maxHP;
    
    // Reset state
    gameState.score = 0;
    gameState.gold = 0;
    gameState.stage = 1;
    gameState.level = 1;
    gameState.experience = 0;
    gameState.experienceToLevel = 100; // Reset experience requirement
    gameState.totalEnemiesDefeated = 0;
    gameState.turnCount = 0;
    gameState.cursor = { x: 0, y: 0 };
    gameState.selectedCell = null;
    gameState.isPlayerTurn = true;
    gameState.animating = false;
    gameState.elementalMeters = [0, 0, 0, 0, 0];
    gameState.entities = [gameState.player, gameState.currentEnemy];
    gameState.invalidSwap = false;
    gameState.invalidSwapTimer = 0;
    gameState.invalidSwapCells = null;
    gameState.transitionTimer = 0;
    
    gameState.gamePhase = PHASE_PLAYING;
  }
  
  function resetGame(p) {
    gameState.gamePhase = PHASE_START;
    gameState.player = null;
    gameState.currentEnemy = null;
    gameState.entities = [];
  }
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
  
  const activeBtn = document.getElementById(
    mode === 'HUMAN' ? 'humanModeBtn' : 
    mode === 'TEST_1' ? 'test_1_ModeBtn' : 
    'test_2_ModeBtn'
  );
  
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};