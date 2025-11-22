// game.js - Main game file
import { 
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TARGET_FPS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  KEY_ENTER,
  KEY_ESC,
  KEY_R,
  KEY_SPACE,
  KEY_Z,
  CHAR_ABI,
  CHAR_DD
} from './globals.js';

import { Character } from './entities.js';
import { loadChapter } from './levels.js';
import { handleKeyPressed, processGameplayInput, handleDiscreteAction } from './input.js';
import { renderStartScreen, renderGame, renderGameOver } from './render.js';
import { checkCollision } from './physics.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

// Expose automated testing function globally
window.get_automated_testing_action = get_automated_testing_action;

let gameInstance = new p5(p => {
  // Initialize the logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize characters
    gameState.abi = new Character(100, 200, CHAR_ABI, p);
    gameState.dd = new Character(150, 200, CHAR_DD, p);
    gameState.activeCharacter = CHAR_ABI;
    
    // Set initial player reference
    gameState.player = gameState.abi;
    gameState.entities = [gameState.abi, gameState.dd];
    
    // Initialize camera
    gameState.cameraX = 0;
    gameState.cameraY = 0;
    
    // Chapter progression tracking
    gameState.chapterCompleteTimer = 0;
    gameState.isChapterComplete = false;
    
    p.logs.game_info.push({
      data: { phase: PHASE_START, message: "Game initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Single background call to avoid flickering
    p.background(20, 25, 35);
    
    // Render based on game phase
    if (gameState.gamePhase === PHASE_START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED) {
      updateGame(p);
      renderGame(p);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
      renderGameOver(p);
    }
    
    // Process gameplay input (continuous)
    if (gameState.gamePhase === PHASE_PLAYING) {
      processGameplayInput(p);
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
    
    // Handle discrete actions in PLAYING phase
    if (gameState.gamePhase === PHASE_PLAYING) {
      if (p.keyCode === KEY_SPACE) {
        handleDiscreteAction('SWITCH', p);
      } else if (p.keyCode === KEY_Z) {
        handleDiscreteAction('INTERACT', p);
      }
    }
    
    return false; // Prevent default browser behavior
  };
  
  function updateGame(p) {
    if (gameState.gamePhase !== PHASE_PLAYING) return;
    
    // Update doors based on switch states
    for (const door of gameState.doors) {
      door.update(gameState.switches);
    }
    
    // Check chapter completion
    checkChapterCompletion(p);
    
    // Check win condition
    if (gameState.finalTruthRevealed && gameState.chaptersCompleted >= gameState.totalChapters) {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { phase: PHASE_GAME_OVER_WIN },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  function checkChapterCompletion(p) {
    // Find terminal for current chapter
    const terminal = gameState.terminals.find(t => t.chapterId === gameState.currentChapter);
    
    if (!terminal) return;
    
    // If terminal is activated and we're not already transitioning
    if (terminal.activated && !gameState.isChapterComplete) {
      // Mark chapter as complete
      gameState.isChapterComplete = true;
      gameState.chapterCompleteTimer = p.frameCount;
      
      p.logs.game_info.push({
        data: { action: 'chapter_marked_complete', chapter: gameState.currentChapter },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // If chapter is marked complete, wait a short time then progress
    if (gameState.isChapterComplete && p.frameCount - gameState.chapterCompleteTimer > 90) {
      if (gameState.currentChapter < gameState.totalChapters - 1) {
        // Progress to next chapter
        gameState.currentChapter++;
        gameState.chaptersCompleted++;
        gameState.isChapterComplete = false;
        gameState.chapterCompleteTimer = 0;
        
        loadChapter(gameState.currentChapter, p, gameState);
        
        p.logs.game_info.push({
          data: { action: 'chapter_progressed', chapter: gameState.currentChapter },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      } else {
        // Final chapter completed
        gameState.chaptersCompleted = gameState.totalChapters;
        gameState.isChapterComplete = false;
      }
    }
  }
});

// Expose the game instance globally
window.gameInstance = gameInstance;

// Control mode management
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn'];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove('active');
    }
  });
  
  const modeMap = {
    'HUMAN': 'humanModeBtn',
    'TEST_1': 'test_1_ModeBtn',
    'TEST_2': 'test_2_ModeBtn',
    'TEST_3': 'test_3_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  gameInstance.logs.game_info.push({
    data: { action: 'control_mode_change', mode: mode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
};