// game.js - Main game file

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, SUBSTATE_WORDLE, SUBSTATE_CROSSWORD, SUBSTATE_LEVEL_TRANSITION } from './globals.js';
import { initWordle, updateWordle, handleWordleInput, checkWordleWinLose, drawWordle } from './wordle.js';
import { initCrossword, updateCrossword, handleCrosswordInput, checkCrosswordSolution, drawCrossword } from './crossword.js';
import { drawStartScreen, drawPausedOverlay, drawGameOverScreen, drawLevelTransition } from './screens.js';
import { getTestAction } from './testing.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let lastPhase = null;
  let completedWordle = false;
  
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
  
  p.draw = function() {
    p.background(30, 30, 50);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const action = getTestAction(p, gameState.controlMode);
      if (action && p.frameCount % 5 === 0) {
        handleInput(action.keyCode, action.key || p.key);
      }
    }
    
    // Log phase changes
    if (gameState.gamePhase !== lastPhase) {
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, playingSubstate: gameState.playingSubstate },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      lastPhase = gameState.gamePhase;
    }
    
    // Render based on game phase
    if (gameState.gamePhase === PHASE_START) {
      drawStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      if (gameState.playingSubstate === SUBSTATE_WORDLE) {
        updateWordle(p);
        drawWordle(p);
        
        const result = checkWordleWinLose();
        if (result === "win") {
          completedWordle = true;
          // Transition to crossword
          gameState.playingSubstate = SUBSTATE_LEVEL_TRANSITION;
          gameState.levelTransition.message = "Wordle Complete!";
          gameState.levelTransition.nextMessage = "Mini Crossword";
          gameState.levelTransition.startTime = Date.now();
        } else if (result === "lose") {
          gameState.gamePhase = PHASE_GAME_OVER_LOSE;
        }
      } else if (gameState.playingSubstate === SUBSTATE_CROSSWORD) {
        const timeoutResult = updateCrossword(p);
        drawCrossword(p);
        
        if (timeoutResult === "timeout") {
          gameState.gamePhase = PHASE_GAME_OVER_LOSE;
        }
      } else if (gameState.playingSubstate === SUBSTATE_LEVEL_TRANSITION) {
        drawLevelTransition(p);
        
        const elapsed = (Date.now() - gameState.levelTransition.startTime) / 1000;
        if (elapsed > 4) {
          if (completedWordle) {
            // Start crossword
            completedWordle = false;
            initCrossword(p, gameState.currentLevel);
            gameState.playingSubstate = SUBSTATE_CROSSWORD;
          } else {
            // Level complete, move to next level or win
            if (gameState.currentLevel >= 3) {
              gameState.gamePhase = PHASE_GAME_OVER_WIN;
            } else {
              gameState.currentLevel++;
              initWordle(p, gameState.currentLevel);
              gameState.playingSubstate = SUBSTATE_WORDLE;
            }
          }
        }
      }
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      // Draw the paused game state underneath
      if (gameState.playingSubstate === SUBSTATE_WORDLE) {
        drawWordle(p);
      } else if (gameState.playingSubstate === SUBSTATE_CROSSWORD) {
        drawCrossword(p);
      }
      drawPausedOverlay(p);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
      drawGameOverScreen(p, true);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      drawGameOverScreen(p, false);
    }
  };
  
  p.keyPressed = function() {
    handleInput(p.keyCode, p.key);
    return false;
  };
  
  function handleInput(keyCode, key) {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: key, keyCode: keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Global controls
    if (keyCode === 82) { // R - restart
      resetGame();
      return;
    }
    
    if (keyCode === 27) { // ESC - pause/unpause
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
      }
      return;
    }
    
    // Phase-specific controls
    if (gameState.gamePhase === PHASE_START) {
      if (keyCode === 13) { // ENTER - start game
        startGame();
      }
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      if (gameState.playingSubstate === SUBSTATE_WORDLE) {
        handleWordleInput(p, key, keyCode);
      } else if (gameState.playingSubstate === SUBSTATE_CROSSWORD) {
        const result = handleCrosswordInput(p, key, keyCode);
        if (result === "win") {
          // Crossword complete, transition
          gameState.playingSubstate = SUBSTATE_LEVEL_TRANSITION;
          gameState.levelTransition.message = `Level ${gameState.currentLevel} Complete!`;
          gameState.levelTransition.nextMessage = gameState.currentLevel < 3 ? `Level ${gameState.currentLevel + 1}` : "Game Complete!";
          gameState.levelTransition.startTime = Date.now();
        } else if (result === "incorrect") {
          // Could show feedback, but for now just let them try again
        }
      }
    }
  }
  
  function startGame() {
    gameState.gamePhase = PHASE_PLAYING;
    gameState.playingSubstate = SUBSTATE_WORDLE;
    gameState.currentLevel = 1;
    gameState.score = 0;
    completedWordle = false;
    initWordle(p, 1);
  }
  
  function resetGame() {
    gameState.gamePhase = PHASE_START;
    gameState.playingSubstate = null;
    gameState.score = 0;
    gameState.currentLevel = 1;
    completedWordle = false;
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Expose setControlMode function
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button styles
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
};