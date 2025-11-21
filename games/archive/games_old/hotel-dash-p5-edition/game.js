import { gameState, GAME_PHASES, CONTROL_MODES, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { LevelManager } from './levelManager.js';
import { GameLogic } from './gameLogic.js';
import { Renderer } from './renderer.js';
import { SelectionCursor } from './selectionCursor.js';
import { TestController } from './testController.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let levelManager;
  let gameLogic;
  let renderer;
  let cursor;
  let testController;
  let lastFrameTime;
  
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
    
    // Initialize managers
    levelManager = new LevelManager(p);
    gameLogic = new GameLogic(p, levelManager);
    renderer = new Renderer(p);
    cursor = new SelectionCursor(p);
    testController = new TestController(p);
    
    lastFrameTime = Date.now();
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    const currentTime = Date.now();
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;
    
    // Handle test controller
    if (gameState.controlMode !== CONTROL_MODES.HUMAN && 
        gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = testController.update(deltaTime);
      if (action) {
        handleTestAction(action);
      }
    }
    
    // Update game state
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      levelManager.update(deltaTime);
      cursor.update(deltaTime);
    }
    
    // Render
    renderer.draw();
    
    // Draw cursor in playing state
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      cursor.draw();
    }
  };
  
  p.keyPressed = function() {
    // Log input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Only handle human inputs
    if (gameState.controlMode !== CONTROL_MODES.HUMAN) return;
    
    if (gameState.gamePhase === GAME_PHASES.START) {
      if (p.keyCode === 13) { // ENTER
        startGame();
      }
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      handlePlayingInput(p.keyCode);
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      if (p.keyCode === 27) { // ESC
        resumeGame();
      }
    } else if (gameState.gamePhase === GAME_PHASES.LEVEL_COMPLETE) {
      if (p.keyCode === 13) { // ENTER
        nextLevel();
      }
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN ||
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      if (p.keyCode === 82) { // R
        restartGame();
      }
    }
  };
  
  function handlePlayingInput(keyCode) {
    if (keyCode === 27) { // ESC
      pauseGame();
    } else if (keyCode === 38) { // UP
      cursor.moveUp();
    } else if (keyCode === 40) { // DOWN
      cursor.moveDown();
    } else if (keyCode === 37) { // LEFT
      cursor.moveLeft();
    } else if (keyCode === 39) { // RIGHT
      cursor.moveRight();
    } else if (keyCode === 32) { // SPACE
      gameLogic.handleSelection();
    } else if (keyCode === 16) { // SHIFT
      gameLogic.handleCancel();
    }
  }
  
  function handleTestAction(action) {
    switch(action) {
      case 'UP':
        cursor.moveUp();
        break;
      case 'DOWN':
        cursor.moveDown();
        break;
      case 'LEFT':
        cursor.moveLeft();
        break;
      case 'RIGHT':
        cursor.moveRight();
        break;
      case 'SELECT':
        gameLogic.handleSelection();
        break;
      case 'CANCEL':
        gameLogic.handleCancel();
        break;
    }
  }
  
  function startGame() {
    levelManager.loadLevel(1);
    gameState.gamePhase = GAME_PHASES.PLAYING;
    
    p.logs.game_info.push({
      data: { phase: "PLAYING", level: 1 },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function pauseGame() {
    gameState.gamePhase = GAME_PHASES.PAUSED;
    
    p.logs.game_info.push({
      data: { phase: "PAUSED" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function resumeGame() {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    
    p.logs.game_info.push({
      data: { phase: "PLAYING" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function nextLevel() {
    const nextLevelNum = gameState.currentLevel + 1;
    if (levelManager.loadLevel(nextLevelNum)) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      
      p.logs.game_info.push({
        data: { phase: "PLAYING", level: nextLevelNum },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  function restartGame() {
    gameState.gamePhase = GAME_PHASES.START;
    gameState.score = 0;
    gameState.currentLevel = 1;
    gameState.dissatisfiedCount = 0;
    gameState.satisfiedCount = 0;
    
    p.logs.game_info.push({
      data: { phase: "START" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === CONTROL_MODES.HUMAN) {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === CONTROL_MODES.TEST_1) {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === CONTROL_MODES.TEST_2) {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
  
  console.log('Control mode set to:', mode);
};