import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, GAME_PHASES } from './globals.js';
import { generateLevelImages } from './imageGenerator.js';
import { renderGame } from './renderer.js';
import { handleKeyPressed, handleMousePressed } from './input.js';
import { updateGame, resetGame } from './gameLogic.js';
import { runTestController } from './testController.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let leftImage = null;
  let rightImage = null;
  let lastFrameTime = 0;
  
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
    resetGame(p);
    
    // Log initial state
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, action: "setup" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    lastFrameTime = Date.now();
  };
  
  p.draw = function() {
    // Calculate delta time
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastFrameTime) / 1000.0; // Convert to seconds
    lastFrameTime = currentTime;
    
    // Generate images when needed
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (!leftImage || !rightImage) {
        const images = generateLevelImages(p, gameState.currentLevel);
        leftImage = images.left;
        rightImage = images.right;
      }
    } else {
      leftImage = null;
      rightImage = null;
    }
    
    // Update game logic
    updateGame(p, deltaTime);
    
    // Run test controller if not in HUMAN mode
    runTestController(p);
    
    // Render
    renderGame(p, leftImage, rightImage);
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p, p.key, p.keyCode);
  };
  
  p.mousePressed = function() {
    handleMousePressed(p, p.mouseX, p.mouseY);
  };
});

// Expose the game instance globally
window.gameInstance = gameInstance;

// Expose getGameState function
window.getGameState = function() {
  return gameState;
};

// Expose setControlMode function
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  if (mode === 'HUMAN') {
    document.getElementById('humanModeBtn').classList.add('active');
  } else if (mode === 'TEST_1') {
    document.getElementById('test_1_ModeBtn').classList.add('active');
  } else if (mode === 'TEST_2') {
    document.getElementById('test_2_ModeBtn').classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};