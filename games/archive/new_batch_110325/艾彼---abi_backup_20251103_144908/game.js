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
    // Chapter is complete when terminal is activated
    const terminal = gameState.terminals.find(t => t.chapterId === gameState.currentChapter);
    
    if (terminal && terminal.activated && gameState.currentChapter < gameState.totalChapters - 1) {
      // Check if player has moved far enough to the right (progression trigger)
      const activeChar = gameState.activeCharacter === CHAR_ABI ? gameState.abi : gameState.dd;
      
      if (activeChar.x > gameState.worldWidth - 200) {
        // Move to next chapter
        gameState.currentChapter++;
        gameState.chaptersCompleted++;
        loadChapter(gameState.currentChapter, p, gameState);
        
        p.logs.game_info.push({
          data: { action: 'chapter_complete', chapter: gameState.currentChapter },
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    // Final chapter completion
    if (gameState.currentChapter === gameState.totalChapters - 1) {
      const finalTerminal = gameState.terminals.find(t => t.chapterId === 4);
      if (finalTerminal && finalTerminal.activated) {
        gameState.chaptersCompleted = gameState.totalChapters;
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