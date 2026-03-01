// game.js - Main game file
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, KEY_BINDINGS } from './globals.js';
import { initializeLevel, checkLevelComplete, advanceToNextLevel, updateLevelTransition } from './levelManager.js';
import { updateSpawner } from './spawner.js';
import { handleSymbolMatch, checkMissedSymbols } from './input.js';
import { drawGame } from './renderer.js';
import { getTestingAction } from './testing.js';

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
    
    // Initialize player (required by spec, though not used in this game)
    gameState.player = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 50 };
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: GAME_PHASES.START },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    p.logs.player_info.push({
      screen_x: gameState.player.x,
      screen_y: gameState.player.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount
    });
  };

  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== 'HUMAN') {
      const action = getTestingAction(p);
      if (action && action.keyCode) {
        simulateKeyPress(p, action.keyCode);
      }
    }
    
    // Update game state
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      updatePlaying(p);
    } else if (gameState.gamePhase === GAME_PHASES.LEVEL_TRANSITION) {
      updateLevelTransition(p);
    }
    
    // Update feedback effect timer
    if (gameState.feedbackEffect) {
      gameState.feedbackEffect.timer--;
      if (gameState.feedbackEffect.timer <= 0) {
        gameState.feedbackEffect = null;
      }
    }
    
    // Render
    drawGame(p);
  };

  function updatePlaying(p) {
    // Update spawner
    updateSpawner(p);
    
    // Update symbols
    for (const symbol of gameState.entities) {
      if (symbol.active) {
        symbol.update();
      }
    }
    
    // Check for missed symbols
    checkMissedSymbols();
    
    // Check level status
    const status = checkLevelComplete();
    if (status === 'WIN') {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      updateHighScore();
      
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.GAME_OVER_WIN, score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (status === 'LOSE') {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      updateHighScore();
      
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.GAME_OVER_LOSE, score: gameState.score },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (status === 'NEXT_LEVEL') {
      advanceToNextLevel();
      
      p.logs.game_info.push({
        data: { phase: GAME_PHASES.LEVEL_TRANSITION, level: gameState.currentLevel + 1 },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }

  function updateHighScore() {
    if (gameState.score > gameState.highScore) {
      gameState.highScore = gameState.score;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('tentenHighScore', gameState.highScore.toString());
      }
    }
  }

  function simulateKeyPress(p, keyCode) {
    // Log the input
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { keyCode: keyCode, key: String.fromCharCode(keyCode) },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Handle the key
    handleKeyPress(p, keyCode);
  }

  p.keyPressed = function() {
    p.logs.inputs.push({
      input_type: 'keyPressed',
      data: { keyCode: p.keyCode, key: p.key },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    handleKeyPress(p, p.keyCode);
    return false;
  };

  function handleKeyPress(p, keyCode) {
    // ENTER - Start game
    if (keyCode === 13) {
      if (gameState.gamePhase === GAME_PHASES.START) {
        initializeLevel(0);
        gameState.score = 0;
        gameState.gamePhase = GAME_PHASES.PLAYING;
        
        p.logs.game_info.push({
          data: { phase: GAME_PHASES.PLAYING, level: 1 },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // ESC - Pause/Unpause
    if (keyCode === 27) {
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        
        p.logs.game_info.push({
          data: { phase: GAME_PHASES.PAUSED },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        
        p.logs.game_info.push({
          data: { phase: GAME_PHASES.PLAYING },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // R - Restart
    if (keyCode === 82) {
      if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
          gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
        gameState.gamePhase = GAME_PHASES.START;
        gameState.entities = [];
        
        p.logs.game_info.push({
          data: { phase: GAME_PHASES.START },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Symbol matching keys (W, A, S, D)
    if (KEY_BINDINGS[keyCode]) {
      handleSymbolMatch(p, keyCode);
    }
  }
});

// Expose game instance
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

// Expose getGameState function
window.getGameState = function() {
  return gameState;
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
  
  const activeBtn = mode === 'HUMAN' ? 'humanModeBtn' : 
                    mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                    mode === 'TEST_2' ? 'test_2_ModeBtn' : null;
  
  if (activeBtn) {
    const btn = document.getElementById(activeBtn);
    if (btn) {
      btn.classList.add('active');
    }
  }
};