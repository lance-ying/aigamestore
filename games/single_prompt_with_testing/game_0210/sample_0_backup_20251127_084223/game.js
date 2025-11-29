// Main game file
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, getGameState } from './globals.js';
import { Player } from './entities.js';
import { generateLevel, loadLevel } from './levelgen.js';
import { updatePhysics } from './physics.js';
import { setupInput, handlePlayerInput } from './input.js';
import { renderStartScreen, renderUI, renderPausedOverlay, renderGameOver, renderGame } from './ui.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs
  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game state
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    gameState.lastFrameTime = p.millis();
    
    // Setup input handlers
    setupInput(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { gamePhase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    // Update frame count
    gameState.frameCount = p.frameCount;
    
    // Update delta time
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Clear background
    p.background(...gameState.background || [0, 0, 0]);
    
    // Handle game phases
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        updateGame(p);
        renderGame(p);
        renderUI(p);
        break;
        
      case "PAUSED":
        renderGame(p);
        renderUI(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderUI(p);
        renderGameOver(p);
        break;
    }
  };
});

function updateGame(p) {
  // Handle automated testing
  if (gameState.controlMode !== "HUMAN") {
    const action = get_automated_testing_action(gameState);
    if (action && action.keyCode) {
      // Simulate key press
      p.keyCode = action.keyCode;
      if (p.keyPressed) p.keyPressed();
      
      // Simulate key release after a few frames
      setTimeout(() => {
        if (p.keyReleased) p.keyReleased();
      }, 100);
    }
  }
  
  // Handle player input
  handlePlayerInput(p);
  
  // Update player
  if (gameState.player) {
    gameState.player.update(p);
  }
  
  // Update physics
  updatePhysics(p);
  
  // Update level exit
  if (gameState.levelExit) {
    gameState.levelExit.update(p);
  }
}

export function resetGame(p) {
  // Clear entities
  gameState.entities = [];
  gameState.platforms = [];
  gameState.spikes = [];
  gameState.checkpoints = [];
  gameState.crewMembers = [];
  gameState.particles = [];
  gameState.levelExit = null;
  
  // Reset game state
  gameState.collectedCrew = 0;
  gameState.deathCount = 0;
  gameState.score = 0;
  gameState.currentLevel = 1;
  gameState.lastCheckpoint = { x: 50, y: 350, level: 1 };
  
  // Generate all levels
  generateLevel();
  
  // Create player
  gameState.player = new Player(50, 350);
  
  // Load first level
  loadLevel(1);
  
  // Log reset
  if (p && p.logs && p.logs.game_info) {
    p.logs.game_info.push({
      data: { event: "game_reset" },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
}

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode setter
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
  
  const activeBtn = document.getElementById(mode === 'HUMAN' ? 'humanModeBtn' : 
                                           mode === 'TEST_1' ? 'test_1_ModeBtn' : 
                                           'test_2_ModeBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Reset game when changing mode
  if (gameState.gamePhase === "PLAYING" || 
      gameState.gamePhase === "GAME_OVER_WIN" || 
      gameState.gamePhase === "GAME_OVER_LOSE") {
    resetGame(gameInstance);
    gameState.gamePhase = "START";
  }
};