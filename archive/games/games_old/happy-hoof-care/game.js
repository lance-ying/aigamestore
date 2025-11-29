// game.js - Main game file
import { gameState, GAME_PHASES, GAME_STATES, CANVAS_WIDTH, CANVAS_HEIGHT, LEVEL_CONFIG } from './globals.js';
import { createAnimals } from './animal.js';
import { handleKeyPressed, handleKeyReleased } from './input.js';
import { drawStartScreen, drawMenu, drawInstructions, drawHighScores, drawAnimalSelect, 
         drawMiniGameIntro, drawMiniGamePlaying, drawMiniGameComplete, drawLevelComplete, 
         drawGameWin, drawGameOver } from './ui.js';
import { getTestAction, executeTestAction } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Game setup
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
    
    // Initialize game state
    gameState.animals = createAnimals(LEVEL_CONFIG[0]);
    gameState.highScores = [];
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase, state: gameState.currentState },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  // Game draw loop
  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== 'HUMAN') {
      const action = getTestAction(p);
      if (action) {
        executeTestAction(p, action);
      }
    }
    
    // Render based on game phase and state
    if (gameState.gamePhase === GAME_PHASES.START) {
      if (gameState.currentState === GAME_STATES.MENU) {
        drawMenu(p);
      } else if (gameState.currentState === GAME_STATES.INSTRUCTIONS) {
        drawInstructions(p);
      } else if (gameState.currentState === GAME_STATES.HIGH_SCORES) {
        drawHighScores(p);
      } else {
        drawStartScreen(p);
      }
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING || 
               gameState.gamePhase === GAME_PHASES.PAUSED) {
      if (gameState.currentState === GAME_STATES.ANIMAL_SELECT) {
        drawAnimalSelect(p);
      } else if (gameState.currentState === GAME_STATES.MINIGAME_INTRO) {
        drawMiniGameIntro(p);
      } else if (gameState.currentState === GAME_STATES.MINIGAME_PLAYING) {
        // Update minigame
        if (gameState.miniGameData && gameState.gamePhase === GAME_PHASES.PLAYING) {
          gameState.miniGameData.update(p);
          
          // Check if minigame completed
          if (gameState.miniGameData.completed) {
            completeMiniGame(p);
          }
        }
        drawMiniGamePlaying(p);
      } else if (gameState.currentState === GAME_STATES.MINIGAME_COMPLETE) {
        drawMiniGameComplete(p);
      } else if (gameState.currentState === GAME_STATES.LEVEL_COMPLETE) {
        drawLevelComplete(p);
      }
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      drawGameWin(p);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      drawGameOver(p);
    }
  };
  
  // Input handlers
  p.keyPressed = function() {
    if (gameState.controlMode === 'HUMAN') {
      handleKeyPressed(p, p.keyCode, p.key);
    }
    return false;
  };
  
  p.keyReleased = function() {
    if (gameState.controlMode === 'HUMAN') {
      handleKeyReleased(p, p.keyCode, p.key);
    }
    return false;
  };
  
  function completeMiniGame(p) {
    const data = gameState.miniGameData;
    
    // Update score
    let pointsEarned = 0;
    if (data.success) {
      pointsEarned += 50;
      if (data.efficiency >= 80) {
        pointsEarned += 20;
      }
      
      // Add time bonus
      const timeLeft = Math.floor(data.timer / 60);
      pointsEarned += timeLeft * 5;
      
      gameState.score += pointsEarned;
      
      // Increase animal happiness
      const happinessGain = 20;
      const actualGain = gameState.selectedAnimal.increaseHappiness(happinessGain);
      
      // Check for max happiness bonus
      if (gameState.selectedAnimal.happiness >= 100) {
        gameState.score += 100;
      }
      
      // Happiness points
      gameState.score += Math.floor(actualGain / 10) * 10;
      
      gameState.miniGamesCompletedThisLevel++;
    } else {
      // Decrease happiness on failure
      gameState.selectedAnimal.decreaseHappiness(5);
      gameState.failedMiniGamesCount++;
    }
    
    // Check for game over conditions
    if (gameState.animals.some(a => a.happiness <= 0)) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      gameState.currentState = GAME_STATES.GAME_OVER;
      
      // Save high score
      gameState.highScores.push(gameState.score);
      gameState.highScores.sort((a, b) => b - a);
      gameState.highScores = gameState.highScores.slice(0, 10);
      
      p.noLoop();
      
      p.logs.game_info.push({
        data: { 
          action: 'game_over',
          reason: 'animal_unhappy',
          gamePhase: gameState.gamePhase
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      return;
    }
    
    if (gameState.failedMiniGamesCount >= 3) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      gameState.currentState = GAME_STATES.GAME_OVER;
      
      // Save high score
      gameState.highScores.push(gameState.score);
      gameState.highScores.sort((a, b) => b - a);
      gameState.highScores = gameState.highScores.slice(0, 10);
      
      p.noLoop();
      
      p.logs.game_info.push({
        data: { 
          action: 'game_over',
          reason: 'too_many_failures',
          gamePhase: gameState.gamePhase
        },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      return;
    }
    
    gameState.currentState = GAME_STATES.MINIGAME_COMPLETE;
    
    p.logs.game_info.push({
      data: { 
        state: gameState.currentState,
        success: data.success,
        score: gameState.score
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose game instance and state getter
window.gameInstance = gameInstance;
window.getGameState = function() {
  return gameState;
};

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const buttonMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn'
  };
  
  const buttonId = buttonMap[mode];
  if (buttonId) {
    document.getElementById(buttonId).classList.add('active');
  }
};