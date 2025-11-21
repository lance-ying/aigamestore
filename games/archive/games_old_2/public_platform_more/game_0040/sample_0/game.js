// game.js - Main game file

import { 
  gameState, 
  getGameState,
  setControlMode,
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE
} from './globals.js';
import { generatePath } from './pathGenerator.js';
import { WaveManager } from './waveManager.js';
import { drawStartScreen, drawGame, drawGameOver } from './renderer.js';
import { handleKeyPressed, updateHoveredTrap } from './inputHandler.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let waveManager;
  let lastAutomatedAction = 0;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: PHASE_START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    initGame();
  };
  
  function initGame() {
    // Generate path
    gameState.path = generatePath(p);
    
    // Initialize wave manager
    waveManager = new WaveManager(p);
    
    // Set cursor to start position
    gameState.cursor.x = 10;
    gameState.cursor.y = 10;
  }
  
  function resetGame() {
    // Reset game state
    gameState.gamePhase = PHASE_START;
    gameState.entities = [];
    gameState.traps = [];
    gameState.enemies = [];
    gameState.gold = 100;
    gameState.xp = 0;
    gameState.level = 1;
    gameState.wave = 0;
    gameState.enemiesEscaped = 0;
    gameState.enemiesKilled = 0;
    gameState.waveInProgress = false;
    gameState.waveTimer = 0;
    gameState.showTrapMenu = false;
    gameState.selectedTrap = null;
    gameState.hoveredTrap = null;
    gameState.skillPoints = 0;
    gameState.skills = {
      damage: 0,
      range: 0,
      goldBonus: 0
    };
    
    // Regenerate path with same seed
    gameState.path = generatePath(p);
    
    // Reset wave manager
    waveManager = new WaveManager(p);
    
    p.logs.game_info.push({
      data: { phase: PHASE_START, action: "reset" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && 
        gameState.gamePhase === PHASE_PLAYING) {
      if (p.frameCount - lastAutomatedAction > 5) { // Execute action every 5 frames
        const action = get_automated_testing_action(gameState);
        if (action && action.keyCode) {
          simulateKeyPress(action.keyCode);
          lastAutomatedAction = p.frameCount;
        }
      }
    }
    
    // Render based on game phase
    if (gameState.gamePhase === PHASE_START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING || 
               gameState.gamePhase === PHASE_PAUSED) {
      updateGame();
      drawGame(p);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
               gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      drawGameOver(p);
    }
  };
  
  function updateGame() {
    if (gameState.gamePhase !== PHASE_PLAYING) return;
    
    // Auto-spend skill points
    if (gameState.skillPoints > 0) {
      // Prioritize damage, then range, then gold bonus
      if (gameState.skills.damage < 5) {
        gameState.skills.damage++;
      } else if (gameState.skills.range < 3) {
        gameState.skills.range++;
      } else {
        gameState.skills.goldBonus++;
      }
      gameState.skillPoints--;
    }
    
    // Update hovered trap
    updateHoveredTrap();
    
    // Wave management
    if (!gameState.waveInProgress && gameState.wave < gameState.maxWaves) {
      gameState.waveTimer++;
      if (gameState.waveTimer >= gameState.waveDelay) {
        waveManager.startWave();
      }
    }
    
    // Update wave spawning
    if (gameState.waveInProgress) {
      waveManager.update();
    }
    
    // Update traps
    for (const trap of gameState.traps) {
      trap.update(gameState.enemies, p);
    }
    
    // Update enemies
    for (const enemy of gameState.enemies) {
      enemy.update();
    }
    
    // Remove dead or escaped enemies
    gameState.enemies = gameState.enemies.filter(e => e.alive && !e.escaped);
    gameState.entities = gameState.entities.filter(e => {
      if (e.alive === false || e.escaped) return false;
      return true;
    });
    
    // Check win condition
    if (gameState.wave >= gameState.maxWaves && !gameState.waveInProgress) {
      const activeEnemies = gameState.enemies.filter(e => e.alive && !e.escaped);
      if (activeEnemies.length === 0) {
        gameState.gamePhase = PHASE_GAME_OVER_WIN;
        p.logs.game_info.push({
          data: { phase: PHASE_GAME_OVER_WIN },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Check lose condition
    if (gameState.enemiesEscaped >= gameState.maxEscaped) {
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
      p.logs.game_info.push({
        data: { phase: PHASE_GAME_OVER_LOSE },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  function simulateKeyPress(keyCode) {
    // Simulate key press for automated testing
    p.keyCode = keyCode;
    handleKeyPressed(p, keyCode);
  }
  
  p.keyPressed = function() {
    // Handle R key for restart
    if (p.keyCode === 82) {
      resetGame();
      return;
    }
    
    handleKeyPressed(p, p.keyCode);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;