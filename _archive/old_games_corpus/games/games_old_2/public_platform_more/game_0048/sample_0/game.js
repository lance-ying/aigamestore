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
  PHASE_GAME_OVER_LOSE,
  MODE_SALLY,
  MODE_FATHER,
  MODE_TRANSITION,
  KEY_ENTER,
  KEY_ESC,
  KEY_SPACE,
  KEY_LEFT,
  KEY_UP,
  KEY_RIGHT,
  KEY_DOWN,
  KEY_R,
  KEY_Z,
  CONTROL_HUMAN
} from './globals.js';

import { Sally } from './entities.js';
import { createLevel, getTotalLevels } from './levels.js';
import { 
  renderStartScreen, 
  renderPlayingScreen, 
  renderTransitionScreen,
  renderGameOverScreen 
} from './rendering.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Game objects
  let sally = null;
  let currentLevel = null;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log game start
    logGameInfo("Game initialized", { phase: gameState.gamePhase });
    
    // Initialize game
    initializeGame();
  };
  
  function initializeGame() {
    gameState.gamePhase = PHASE_START;
    gameState.currentLevel = 0;
    gameState.playMode = MODE_SALLY;
    gameState.score = 0;
    gameState.sallyRecording = [];
    gameState.currentRecordingFrame = 0;
    gameState.levelComplete = false;
    gameState.transitionTimer = 0;
    gameState.timeScale = 1.0;
    gameState.selectedObjectIndex = 0;
    gameState.sallyPosHistory = [];
    gameState.lastActionFrame = 0;
    
    sally = null;
    currentLevel = null;
    gameState.player = null;
    gameState.entities = [];
    gameState.interactableObjects = [];
  }
  
  function startLevel() {
    gameState.playMode = MODE_SALLY;
    gameState.sallyRecording = [];
    gameState.currentRecordingFrame = 0;
    gameState.levelComplete = false;
    gameState.timeScale = 1.0;
    gameState.selectedObjectIndex = 0;
    gameState.sallyPosHistory = [];
    gameState.lastActionFrame = 0;
    
    // Create level
    currentLevel = createLevel(p, gameState.currentLevel);
    
    // Create Sally
    sally = new Sally(p, currentLevel.startX, currentLevel.startY);
    gameState.player = sally;
    gameState.entities = [sally, ...currentLevel.platforms, ...currentLevel.hazards];
    gameState.interactableObjects = currentLevel.interactableObjects;
    
    logGameInfo("Level started", { 
      level: gameState.currentLevel, 
      mode: gameState.playMode 
    });
  }
  
  function startFatherPhase() {
    gameState.playMode = MODE_FATHER;
    gameState.currentRecordingFrame = 0;
    gameState.timeScale = 1.0;
    gameState.selectedObjectIndex = 0;
    gameState.lastActionFrame = 0;
    
    // Reset level objects
    currentLevel = createLevel(p, gameState.currentLevel);
    
    // Create Sally at start for replay
    sally = new Sally(p, currentLevel.startX, currentLevel.startY);
    gameState.player = sally;
    gameState.entities = [sally, ...currentLevel.platforms, ...currentLevel.hazards];
    gameState.interactableObjects = currentLevel.interactableObjects;
    
    logGameInfo("Father phase started", { 
      level: gameState.currentLevel,
      recordingLength: gameState.sallyRecording.length
    });
  }
  
  p.draw = function() {
    p.background(30, 20, 40);
    
    // Handle game phases
    if (gameState.gamePhase === PHASE_START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === PHASE_PLAYING) {
      updateGame();
      renderPlayingScreen(p, sally, currentLevel.platforms, currentLevel.hazards, 
                         currentLevel.goal, currentLevel.interactableObjects);
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      renderPlayingScreen(p, sally, currentLevel.platforms, currentLevel.hazards, 
                         currentLevel.goal, currentLevel.interactableObjects);
    } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
               gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
      renderGameOverScreen(p);
    }
    
    // Handle automated testing
    if (gameState.controlMode !== CONTROL_HUMAN && gameState.gamePhase === PHASE_PLAYING) {
      handleAutomatedTesting();
    }
  };
  
  function updateGame() {
    if (gameState.playMode === MODE_TRANSITION) {
      gameState.transitionTimer++;
      if (gameState.transitionTimer > 120) {
        startFatherPhase();
      } else {
        renderTransitionScreen(p);
      }
      return;
    }
    
    if (gameState.playMode === MODE_SALLY) {
      updateSallyPhase();
    } else if (gameState.playMode === MODE_FATHER) {
      updateFatherPhase();
    }
  }
  
  function updateSallyPhase() {
    if (!sally || !sally.alive) {
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
      logGameInfo("Sally died", { level: gameState.currentLevel });
      return;
    }
    
    if (sally.reachedGoal) {
      // Transition to father phase
      gameState.playMode = MODE_TRANSITION;
      gameState.transitionTimer = 0;
      logGameInfo("Sally reached goal", { level: gameState.currentLevel });
      return;
    }
    
    // Update Sally
    sally.update(currentLevel.platforms, currentLevel.hazards, currentLevel.goal);
    
    // Record Sally's state
    gameState.sallyRecording.push({
      x: sally.x,
      y: sally.y,
      vx: sally.vx,
      vy: sally.vy,
      onGround: sally.onGround
    });
    
    // Log player position periodically
    if (p.frameCount % 30 === 0) {
      logPlayerInfo(sally.x, sally.y, sally.x, sally.y);
    }
    
    // Update goal
    currentLevel.goal.update();
  }
  
  function updateFatherPhase() {
    // Replay Sally's movement
    if (gameState.currentRecordingFrame < gameState.sallyRecording.length) {
      const recording = gameState.sallyRecording[gameState.currentRecordingFrame];
      sally.x = recording.x;
      sally.y = recording.y;
      sally.vx = recording.vx;
      sally.vy = recording.vy;
      sally.onGround = recording.onGround;
      
      gameState.currentRecordingFrame += gameState.timeScale;
      
      // Check if Sally would fail with current environment
      sally.update(currentLevel.platforms, currentLevel.hazards, currentLevel.goal);
      
      if (!sally.alive) {
        gameState.gamePhase = PHASE_GAME_OVER_LOSE;
        logGameInfo("Father failed to protect Sally", { level: gameState.currentLevel });
        return;
      }
      
      if (sally.reachedGoal) {
        // Level complete!
        gameState.currentLevel++;
        if (gameState.currentLevel >= getTotalLevels()) {
          gameState.gamePhase = PHASE_GAME_OVER_WIN;
          logGameInfo("All levels completed!", { score: gameState.score });
        } else {
          gameState.gamePhase = PHASE_GAME_OVER_WIN;
          logGameInfo("Level completed", { level: gameState.currentLevel - 1 });
        }
        return;
      }
    } else {
      // Replay finished but goal not reached
      gameState.gamePhase = PHASE_GAME_OVER_LOSE;
      logGameInfo("Replay ended without reaching goal", { level: gameState.currentLevel });
      return;
    }
    
    // Update platforms
    for (let platform of currentLevel.platforms) {
      platform.update();
    }
    
    // Update goal
    currentLevel.goal.update();
    
    // Log player position periodically
    if (p.frameCount % 30 === 0) {
      logPlayerInfo(sally.x, sally.y, sally.x, sally.y);
    }
  }
  
  function handleAutomatedTesting() {
    const action = get_automated_testing_action(gameState);
    if (action) {
      processAction(action);
    }
  }
  
  function processAction(action) {
    if (action.keyPressed) {
      for (let key of action.keyPressed) {
        handleKeyAction(key, true);
      }
    }
  }
  
  function handleKeyAction(keyCode, isPressed) {
    if (gameState.gamePhase !== PHASE_PLAYING) return;
    
    if (gameState.playMode === MODE_SALLY) {
      if (keyCode === KEY_SPACE && isPressed) {
        sally.jump();
        logInput("keyPressed", { key: "SPACE", keyCode: KEY_SPACE });
      }
    } else if (gameState.playMode === MODE_FATHER) {
      if (isPressed) {
        const allObjects = [...currentLevel.platforms.filter(p => p.movable), 
                           ...currentLevel.interactableObjects];
        
        if (keyCode === KEY_LEFT) {
          gameState.selectedObjectIndex = 
            (gameState.selectedObjectIndex - 1 + allObjects.length) % allObjects.length;
          logInput("keyPressed", { key: "LEFT", keyCode: KEY_LEFT });
        } else if (keyCode === KEY_RIGHT) {
          gameState.selectedObjectIndex = 
            (gameState.selectedObjectIndex + 1) % allObjects.length;
          logInput("keyPressed", { key: "RIGHT", keyCode: KEY_RIGHT });
        } else if (keyCode === KEY_SPACE) {
          if (gameState.selectedObjectIndex < allObjects.length) {
            const obj = allObjects[gameState.selectedObjectIndex];
            if (obj.activate) {
              obj.activate();
              gameState.lastActionFrame = p.frameCount;
              logInput("keyPressed", { key: "SPACE", keyCode: KEY_SPACE, action: "activate" });
            }
          }
        } else if (keyCode === KEY_Z) {
          gameState.timeScale = 2.0;
          logInput("keyPressed", { key: "Z", keyCode: KEY_Z, action: "fast_forward" });
        }
      } else {
        if (keyCode === KEY_Z) {
          gameState.timeScale = 1.0;
          logInput("keyReleased", { key: "Z", keyCode: KEY_Z });
        }
      }
    }
  }
  
  p.keyPressed = function() {
    logInput("keyPressed", { key: p.key, keyCode: p.keyCode });
    
    // Phase transitions
    if (p.keyCode === KEY_ENTER && gameState.gamePhase === PHASE_START) {
      gameState.gamePhase = PHASE_PLAYING;
      startLevel();
      logGameInfo("Game started", { phase: PHASE_PLAYING });
      return;
    }
    
    if (p.keyCode === KEY_ESC) {
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
        logGameInfo("Game paused", { phase: PHASE_PAUSED });
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
        logGameInfo("Game resumed", { phase: PHASE_PLAYING });
      }
      return;
    }
    
    if (p.keyCode === KEY_R) {
      if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
          gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
        initializeGame();
        logGameInfo("Game restarted", { phase: PHASE_START });
      }
      return;
    }
    
    // Gameplay controls
    if (gameState.controlMode === CONTROL_HUMAN) {
      handleKeyAction(p.keyCode, true);
    }
  };
  
  p.keyReleased = function() {
    logInput("keyReleased", { key: p.key, keyCode: p.keyCode });
    
    if (gameState.controlMode === CONTROL_HUMAN) {
      handleKeyAction(p.keyCode, false);
    }
  };
  
  // Logging functions
  function logGameInfo(message, data) {
    p.logs.game_info.push({
      message: message,
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
  
  function logPlayerInfo(screenX, screenY, gameX, gameY) {
    p.logs.player_info.push({
      screen_x: screenX,
      screen_y: screenY,
      game_x: gameX,
      game_y: gameY,
      framecount: p.frameCount
    });
  }
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
  
  const activeBtn = mode === CONTROL_HUMAN ? 'humanModeBtn' : 
                    mode === 'TEST_1' ? 'test_1_ModeBtn' : 'test_2_ModeBtn';
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
};