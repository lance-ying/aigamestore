// game.js - Main game file

import { 
  gameState, 
  getGameState,
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  TARGET_FPS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  MODE_DESIGNER,
  MODE_TARGET_PRACTICE
} from './globals.js';

import { Player } from './entities.js';
import { renderStartScreen, renderPausedOverlay, renderGameOverScreen } from './ui.js';
import { updateDesigner, renderDesigner, handleDesignerInput } from './designer.js';
import { 
  initTargetPractice, 
  updateTargetPractice, 
  renderTargetPractice, 
  handleTargetPracticeInput,
  handleTargetPracticeContinuousInput 
} from './targetPractice.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  function logGameInfo(data) {
    p.logs.game_info.push({
      data: data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function logInput(inputType, data) {
    p.logs.inputs.push({
      input_type: inputType,
      data: data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function logPlayerInfo() {
    if (gameState.player) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount
      });
    }
  }
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    logGameInfo({ phase: PHASE_START, message: "Game initialized" });
  };
  
  p.draw = function() {
    // Single background call at the top
    p.background(20, 25, 35);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        handleGameInput(action.keyCode, p);
      }
    }
    
    // Game phase rendering
    if (gameState.gamePhase === PHASE_START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      // Update and render based on game mode
      if (gameState.gameMode === MODE_DESIGNER) {
        updateDesigner(p);
        renderDesigner(p);
      } else if (gameState.gameMode === MODE_TARGET_PRACTICE) {
        handleTargetPracticeContinuousInput(p);
        updateTargetPractice(p);
        renderTargetPractice(p);
        
        // Log player info periodically
        if (p.frameCount % 10 === 0) {
          logPlayerInfo();
        }
      }
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      // Render the game state
      if (gameState.gameMode === MODE_DESIGNER) {
        renderDesigner(p);
      } else {
        renderTargetPractice(p);
      }
      renderPausedOverlay(p);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      renderGameOverScreen(p);
    }
  };
  
  p.keyPressed = function() {
    logInput("keyPressed", { key: p.key, keyCode: p.keyCode });
    
    // Global phase controls
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === PHASE_START) {
        startGame(p);
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
        logGameInfo({ phase: PHASE_PAUSED, message: "Game paused" });
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
        logGameInfo({ phase: PHASE_PLAYING, message: "Game resumed" });
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
        restartGame(p);
      }
    }
    
    // Gameplay controls
    if (gameState.gamePhase === PHASE_PLAYING) {
      handleGameInput(p.keyCode, p);
    }
  };
  
  function handleGameInput(keyCode, p) {
    // Mode toggle
    if (keyCode === 90) { // Z
      if (gameState.gameMode === MODE_DESIGNER) {
        gameState.gameMode = MODE_TARGET_PRACTICE;
        if (!gameState.player) {
          gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        }
        initTargetPractice(p);
        logGameInfo({ mode: MODE_TARGET_PRACTICE, message: "Switched to target practice" });
      } else {
        gameState.gameMode = MODE_DESIGNER;
        logGameInfo({ mode: MODE_DESIGNER, message: "Switched to designer" });
      }
      return;
    }
    
    // Mode-specific input handling
    if (gameState.gameMode === MODE_DESIGNER) {
      handleDesignerInput(keyCode, p);
    } else if (gameState.gameMode === MODE_TARGET_PRACTICE) {
      handleTargetPracticeInput(keyCode, p);
    }
  }
  
  function startGame(p) {
    gameState.gamePhase = PHASE_PLAYING;
    gameState.gameMode = MODE_DESIGNER;
    gameState.selectedOptionIndex = 0;
    gameState.score = 0;
    gameState.hits = 0;
    gameState.shots = 0;
    gameState.targetsDestroyed = 0;
    gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    gameState.targets = [];
    gameState.bullets = [];
    gameState.entities = [];
    
    logGameInfo({ phase: PHASE_PLAYING, message: "Game started" });
  }
  
  function restartGame(p) {
    gameState.gamePhase = PHASE_START;
    gameState.gameMode = MODE_DESIGNER;
    gameState.player = null;
    gameState.targets = [];
    gameState.bullets = [];
    gameState.entities = [];
    gameState.score = 0;
    gameState.hits = 0;
    gameState.shots = 0;
    gameState.targetsDestroyed = 0;
    
    logGameInfo({ phase: PHASE_START, message: "Game restarted" });
  }
}, document.body);

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ['humanModeBtn', 'test_1_ModeBtn', 'test_2_ModeBtn', 'test_3_ModeBtn', 'test_4_ModeBtn', 'test_5_ModeBtn'];
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
    'TEST_3': 'test_3_ModeBtn',
    'TEST_4': 'test_4_ModeBtn',
    'TEST_5': 'test_5_ModeBtn'
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};