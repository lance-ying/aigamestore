// game.js - Main game file

import { gameState, GAME_PHASES, CONTROL_MODES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { loadLevel } from './levels.js';
import { handleInput, handleKeyPressed } from './input.js';
import { renderGame } from './render.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
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
    
    // Initial game state log
    p.logs.game_info.push({
      data: { gamePhase: GAME_PHASES.START },
      framecount: 0,
      timestamp: Date.now()
    });
  };

  // Draw function
  p.draw = function() {
    gameState.frameCount = p.frameCount;
    
    // Handle input
    handleInput(p);
    
    // Update game state
    updateGame(p);
    
    // Render
    renderGame(p);
    
    // Log player info periodically
    if (p.frameCount % 30 === 0 && gameState.player) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  };

  // Key pressed handler
  p.keyPressed = function() {
    handleKeyPressed(p);
  };
});

function updateGame(p) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return;
  }
  
  // Update player
  if (gameState.player) {
    gameState.player.update(gameState.walls);
  }
  
  // Update enemies
  for (let enemy of gameState.enemies) {
    if (!enemy.eliminated) {
      enemy.update(gameState.player, gameState.walls);
    }
  }
  
  // Update barrels
  for (let barrel of gameState.barrels) {
    barrel.update();
  }
  
  // Check win condition
  checkWinCondition(p);
}

function checkWinCondition(p) {
  const allTargetsEliminated = gameState.primaryTargets.every(t => t.eliminated);
  
  if (allTargetsEliminated && gameState.gamePhase === GAME_PHASES.PLAYING) {
    gameState.levelCompleteTime = Date.now();
    
    // Calculate and add bonuses
    const levelBonus = gameState.currentLevel * 100;
    const stealthBonus = gameState.stealthBonusEligible ? 500 : 0;
    
    const elapsedTime = (gameState.levelCompleteTime - gameState.levelStartTime) / 1000;
    const maxTime = gameState.levelMaxTime[gameState.currentLevel - 1];
    const timeBonus = Math.max(0, Math.floor((maxTime - elapsedTime) * 5));
    
    gameState.score += levelBonus + stealthBonus + timeBonus;
    
    gameState.gamePhase = GAME_PHASES.LEVEL_COMPLETE;
    
    p.logs.game_info.push({
      data: { 
        gamePhase: GAME_PHASES.LEVEL_COMPLETE,
        level: gameState.currentLevel,
        score: gameState.score,
        levelBonus,
        stealthBonus,
        timeBonus
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
}

// Expose game instance globally
window.gameInstance = gameInstance;
// Expose level loading for dev mode
window.loadLevel = function(levelNum) {
  const state = window.getGameState ? window.getGameState() : gameState;
  if (state) {
    // Set level using the property this game uses
    state.currentLevel = levelNum;
    state.currentLevel = levelNum; // Also set for compatibility
    // Call the imported loadLevel function (it's in module scope)
    if (typeof loadLevel === 'function') {
      loadLevel(levelNum);
    }
    // Start the game
    if (state.gamePhase !== undefined && typeof GAME_PHASES !== 'undefined') {
      state.gamePhase = GAME_PHASES.PLAYING;
    } else if (state.gamePhase !== undefined) {
      state.gamePhase = "PLAYING";
    }
  }
};
// Expose level loading for dev mode
// Expose level loading for dev mode

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = {
    HUMAN: document.getElementById('humanModeBtn'),
    TEST_1: document.getElementById('test_1_ModeBtn'),
    TEST_2: document.getElementById('test_2_ModeBtn')
  };
  
  for (let key in buttons) {
    if (buttons[key]) {
      if (key === mode) {
        buttons[key].classList.add('active');
      } else {
        buttons[key].classList.remove('active');
      }
    }
  }
};