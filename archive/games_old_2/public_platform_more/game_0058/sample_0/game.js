// game.js - Main game file

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, PUZZLES } from './globals.js';
import { Player, Cursor } from './entities.js';
import { SceneManager } from './scenes.js';
import { PuzzleManager } from './puzzles.js';
import { DialogueManager } from './dialogue.js';
import { UIManager } from './ui.js';
import { InputHandler } from './input.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let player;
  let cursor;
  let sceneManager;
  let puzzleManager;
  let dialogueManager;
  let uiManager;
  let inputHandler;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs (write-only)
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Initialize game systems
    player = new Player(p);
    cursor = new Cursor(p);
    sceneManager = new SceneManager(p);
    puzzleManager = new PuzzleManager(p);
    dialogueManager = new DialogueManager(p);
    uiManager = new UIManager(p);
    inputHandler = new InputHandler(p, sceneManager, puzzleManager, dialogueManager);
    
    // Set up initial game state
    gameState.player = player;
    gameState.entities = [player];
    gameState.cursorX = cursor.x;
    gameState.cursorY = cursor.y;
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: "START", action: "game_initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(50, 50, 50);
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === GAME_PHASES.PLAYING) {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        simulateKeyPress(action.keyCode, action.key);
      }
    }
    
    // Game phase rendering
    switch(gameState.gamePhase) {
      case GAME_PHASES.START:
        uiManager.renderStartScreen();
        break;
        
      case GAME_PHASES.PLAYING:
        updateGame();
        renderGame();
        break;
        
      case GAME_PHASES.PAUSED:
        renderGame();
        uiManager.renderPauseScreen();
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
        uiManager.renderGameOverScreen();
        break;
    }
  };
  
  function updateGame() {
    // Update cursor position from keyboard
    inputHandler.updateCursorMovement();
    
    // Update cursor object
    cursor.x = gameState.cursorX;
    cursor.y = gameState.cursorY;
    
    // Check for navigation
    inputHandler.checkNavigation();
    
    // Update scene
    sceneManager.update();
    
    // Update player
    player.update();
    
    // Check win condition
    checkWinCondition();
    
    // Log player info periodically
    if (p.frameCount % 60 === 0) {
      p.logs.player_info.push({
        screen_x: player.screenX,
        screen_y: player.screenY,
        game_x: player.screenX,
        game_y: player.screenY,
        framecount: p.frameCount
      });
    }
  }
  
  function renderGame() {
    // Render scene
    sceneManager.renderBackground();
    
    // Render player (if not in puzzle/dialogue)
    if (!gameState.inPuzzle && !gameState.inDialogue) {
      player.render();
    }
    
    // Render hotspots
    if (!gameState.inPuzzle && !gameState.inDialogue) {
      sceneManager.renderHotspots();
      cursor.render();
    }
    
    // Render puzzle interface
    if (gameState.inPuzzle) {
      puzzleManager.render();
    }
    
    // Render dialogue
    if (gameState.inDialogue) {
      dialogueManager.render();
    }
    
    // Render UI
    uiManager.renderHUD();
    
    // Render scene transition
    sceneManager.renderTransition();
  }
  
  function checkWinCondition() {
    // Win condition: solve all mandatory puzzles
    const mandatoryPuzzles = Object.entries(PUZZLES)
      .filter(([_, puzzle]) => puzzle.mandatory)
      .map(([id, _]) => id);
    
    const allSolved = mandatoryPuzzles.every(id => gameState.solvedPuzzles.has(id));
    
    if (allSolved && gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      p.logs.game_info.push({
        data: { phase: "GAME_OVER_WIN", action: "all_puzzles_solved" },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  function simulateKeyPress(keyCode, key) {
    inputHandler.handleKeyPressed(key || String.fromCharCode(keyCode), keyCode);
  }
  
  p.keyPressed = function() {
    inputHandler.handleKeyPressed(p.key, p.keyCode);
    return false; // Prevent default
  };
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode management
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn", "test_3_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });
  
  const modeMap = {
    "HUMAN": "humanModeBtn",
    "TEST_1": "test_1_ModeBtn",
    "TEST_2": "test_2_ModeBtn",
    "TEST_3": "test_3_ModeBtn"
  };
  
  const activeBtn = document.getElementById(modeMap[mode]);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
};