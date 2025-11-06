// game.js - Main game file
import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS,
         PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, 
         PHASE_GAME_OVER_LOSE, MODE_PUZZLE, MODE_PARKOUR, MODE_TRANSITION,
         KEY_ENTER, KEY_ESC, KEY_R } from './globals.js';
import { Player } from './player.js';
import { handleKeyPressed, handleKeyReleased, initializeChapter } from './input.js';
import { initializePuzzle, checkPuzzleSolution, updatePuzzleMode, renderPuzzleMode } from './puzzle.js';
import { initializeParkourLevel, updateParkourMode, renderParkourMode } from './parkour.js';
import { renderStartScreen, renderPauseOverlay, renderGameOverScreen, renderTransition } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Store p5 instance in gameState for access in other modules
  gameState.p = p;
  
  // Store puzzle functions in gameState
  gameState.puzzleFunctions = {
    initializePuzzle,
    checkPuzzleSolution
  };
  
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
    gameState.keys = {};
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: PHASE_START, action: 'setup_complete' },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(20);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const actions = get_automated_testing_action(gameState);
      for (let action of actions) {
        gameState.keys[action] = true;
        
        // Simulate key press for one frame
        p.keyCode = action;
        handleKeyPressed(p);
      }
    }
    
    // Game state machine
    switch (gameState.gamePhase) {
      case PHASE_START:
        renderStartScreen(p);
        break;
        
      case PHASE_PLAYING:
        updateGame(p);
        renderGame(p);
        
        if (gameState.gamePhase === PHASE_PAUSED) {
          renderPauseOverlay(p);
        }
        break;
        
      case PHASE_PAUSED:
        renderGame(p);
        renderPauseOverlay(p);
        break;
        
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        renderGameOverScreen(p);
        break;
    }
    
    // Log player info periodically
    if (gameState.player && p.frameCount % 10 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.getScreenX(),
        screen_y: gameState.player.getScreenY(),
        game_x: gameState.player.getGameX(),
        game_y: gameState.player.getGameY(),
        framecount: p.frameCount
      });
    }
    
    // Clear automated testing keys at end of frame
    if (gameState.controlMode !== "HUMAN") {
      gameState.keys = {};
    }
  };
  
  function updateGame(p) {
    if (gameState.gamePhase !== PHASE_PLAYING) return;
    
    if (gameState.currentMode === MODE_TRANSITION) {
      gameState.transitionTimer++;
      if (gameState.transitionTimer >= gameState.transitionDuration) {
        completeTransition();
      }
      return;
    }
    
    if (gameState.currentMode === MODE_PUZZLE) {
      updatePuzzleMode(p);
      
      // Check if puzzle is solved
      if (!gameState.puzzleSolved && checkPuzzleSolution(gameState.currentChapter)) {
        // Start decryption animation
        gameState.decryptionProgress = Math.min(100, gameState.decryptionProgress + 2);
        
        if (gameState.decryptionProgress >= 100 && !gameState.puzzleSolved) {
          gameState.puzzleSolved = true;
          gameState.score += 500;
          
          // Start transition to parkour
          setTimeout(() => {
            if (gameState.gamePhase === PHASE_PLAYING) {
              startTransitionToParkour();
            }
          }, 1000);
        }
      }
    } else if (gameState.currentMode === MODE_PARKOUR) {
      updateParkourMode(p);
      
      // Update player
      if (gameState.player) {
        gameState.player.update(p);
      }
      
      // Check level completion
      if (gameState.levelComplete && !gameState.segmentComplete) {
        gameState.segmentComplete = true;
        gameState.score += 1000;
        
        // Move to next chapter or end game
        setTimeout(() => {
          if (gameState.gamePhase === PHASE_PLAYING) {
            advanceToNextChapter();
          }
        }, 1500);
      }
    }
  }
  
  function renderGame(p) {
    if (gameState.currentMode === MODE_TRANSITION) {
      renderTransition(p);
    } else if (gameState.currentMode === MODE_PUZZLE) {
      renderPuzzleMode(p);
    } else if (gameState.currentMode === MODE_PARKOUR) {
      renderParkourMode(p);
    }
    
    // Score display
    p.push();
    p.fill(255);
    p.noStroke();
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 20, 50);
    p.pop();
  }
  
  function startTransitionToParkour() {
    gameState.currentMode = MODE_TRANSITION;
    gameState.transitionTimer = 0;
  }
  
  function completeTransition() {
    gameState.currentMode = MODE_PARKOUR;
    gameState.transitionTimer = 0;
    
    // Initialize parkour level
    initializeParkourLevel(gameState.currentChapter);
    
    // Create player if not exists
    if (!gameState.player) {
      gameState.player = new Player(50, 200);
      gameState.entities.push(gameState.player);
    } else {
      gameState.player.respawn();
    }
  }
  
  function advanceToNextChapter() {
    gameState.currentChapter++;
    
    if (gameState.currentChapter >= gameState.totalChapters) {
      // Game complete - determine ending
      endGame(true);
    } else {
      // Start next chapter
      initializeChapter(gameState.currentChapter);
      gameState.segmentComplete = false;
    }
  }
  
  function endGame(win) {
    if (win) {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      
      // Determine ending type based on collected fragments
      const fragmentPercent = gameState.collectedFragments / gameState.totalFragments;
      if (fragmentPercent >= 0.9) {
        gameState.endingType = "COMPLETE";
      } else if (fragmentPercent >= 0.7) {
        gameState.endingType = "JUSTICE";
      } else if (fragmentPercent >= 0.5) {
        gameState.endingType = "PARTIAL";
      } else {
        gameState.endingType = "SURFACE";
      }
    } else {
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
    }
    
    p.logs.game_info.push({
      data: { 
        gamePhase: gameState.gamePhase, 
        endingType: gameState.endingType,
        finalScore: gameState.score
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  p.keyPressed = function() {
    handleKeyPressed(p);
  };
  
  p.keyReleased = function() {
    handleKeyReleased(p);
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

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