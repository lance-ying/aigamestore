// game.js - Main game file

import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initializeLevel, checkLevelComplete, advanceLevel } from './levelManager.js';
import { dealCards, checkWinCondition, checkLoseCondition, updateAutoComplete } from './gameLogic.js';
import { drawStartScreen, drawPlayingScreen, drawGameOverScreen } from './rendering.js';
import { handleKeyPressed } from './input.js';
import { updateTestController } from './testController.js';

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
    p.frameRate(60);
    p.randomSeed(42);
    
    initializeLevel(1);
    dealCards(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, level: gameState.level },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update elapsed time
    if (gameState.gamePhase === "PLAYING" && gameState.startTime) {
      gameState.elapsedTime = (Date.now() - gameState.startTime) / 1000;
    }
    
    // Check time limit
    const config = require('./levelManager.js').LEVEL_CONFIG[gameState.level];
    if (gameState.gamePhase === "PLAYING" && config.timeLimit) {
      if (gameState.elapsedTime >= config.timeLimit) {
        gameState.gamePhase = "GAME_OVER_LOSE";
        logGameInfo();
      }
    }
    
    // Update auto-complete
    if (gameState.autoCompleting && p.frameCount % 10 === 0) {
      const moved = updateAutoComplete();
      if (!moved) {
        gameState.autoCompleting = false;
      }
    }
    
    // Check win/lose conditions
    if (gameState.gamePhase === "PLAYING") {
      if (checkWinCondition()) {
        gameState.gamePhase = "GAME_OVER_WIN";
        gameState.gameWonTime = gameState.elapsedTime;
        
        // Update level progress
        const level = gameState.level;
        gameState.levelProgress[level].wins++;
        gameState.levelProgress[level].totalScore += gameState.score;
        if (level === 3) {
          gameState.levelProgress[level].totalTime += gameState.elapsedTime;
        }
        
        // Add win bonus
        const timeBonus = Math.min(5000, Math.floor(20000 / Math.max(1, gameState.elapsedTime)));
        gameState.score += 1000 + timeBonus;
        
        // Check level completion
        if (checkLevelComplete()) {
          if (advanceLevel()) {
            dealCards(p);
            setTimeout(() => {
              gameState.gamePhase = "PLAYING";
              gameState.score = 0;
              gameState.moves = 0;
              gameState.startTime = Date.now();
              gameState.elapsedTime = 0;
              logGameInfo();
            }, 3000);
          }
        }
        
        logGameInfo();
      }
    }
    
    // Update test controller
    updateTestController(p);
    
    // Render based on game phase
    if (gameState.gamePhase === "START") {
      drawStartScreen(p);
    } else if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
      drawPlayingScreen(p);
    } else if (gameState.gamePhase === "GAME_OVER_WIN") {
      drawGameOverScreen(p, true);
    } else if (gameState.gamePhase === "GAME_OVER_LOSE") {
      drawGameOverScreen(p, false);
    }
    
    // Log player info periodically
    if (p.frameCount % 60 === 0 && gameState.player) {
      p.logs.player_info.push({
        screen_x: gameState.selectedPile ? 100 : 0,
        screen_y: gameState.selectedPile ? 100 : 0,
        game_x: gameState.selectedPile ? gameState.selectedPile.index : 0,
        game_y: gameState.selectedCardIndex || 0,
        framecount: p.frameCount
      });
    }
  };
  
  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleKeyPressed(p, p.key, p.keyCode);
    }
    return false;
  };
  
  function logGameInfo() {
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, level: gameState.level, score: gameState.score },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose globally
window.gameInstance = gameInstance;
window.getGameState = getGameState;

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