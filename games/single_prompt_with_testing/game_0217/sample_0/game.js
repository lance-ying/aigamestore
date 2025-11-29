// game.js - Main game loop and p5.js instance

import { gameState, initializeGameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player, Friend, Creature, FoodOrb } from './entities.js';
import { updatePhysics } from './physics.js';
import { setupInput, handleGameplayInput } from './input.js';
import { renderStartScreen, renderPlayingUI, renderPausedOverlay, renderGameOverScreen } from './ui.js';
import { generateWorld, renderBackground } from './world.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize logs (write-only, never reset)
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
    initializeGameState();
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
    // Update frame count and delta time
    gameState.frameCount = p.frameCount;
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // Update world pulse
    gameState.worldPulse += gameState.pulseSpeed;
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      const action = get_automated_testing_action(gameState);
      if (action && action.keyCode) {
        simulateKeyPress(p, action.keyCode);
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        p.background(240, 200, 220);
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        renderGame(p);
        handleGameplayInput(p);
        updateGame(p);
        renderPlayingUI(p);
        break;
        
      case "PAUSED":
        renderGame(p);
        renderPlayingUI(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        renderGame(p);
        renderGameOverScreen(p);
        break;
    }
  };
  
  function renderGame(p) {
    // Render background
    renderBackground(p);
    
    // Render platforms
    gameState.platforms.forEach(platform => platform.render(p));
    
    // Render food orbs
    gameState.foodOrbs.forEach(food => food.render(p));
    
    // Render creatures
    gameState.creatures.forEach(creature => creature.render(p));
    
    // Render player
    if (gameState.player) {
      gameState.player.render(p);
    }
    
    // Render friend
    if (gameState.friend) {
      gameState.friend.render(p);
    }
    
    // Render particles
    gameState.particles.forEach(particle => particle.render(p));
  }
  
  function updateGame(p) {
    // Update physics and entities
    updatePhysics(p);
    
    // Spawn creatures periodically
    gameState.creatureSpawnTimer++;
    if (gameState.creatureSpawnTimer > 180 && gameState.creatures.length < 6) {
      const x = Math.random() < 0.5 ? -20 : CANVAS_WIDTH + 20;
      const y = 100 + Math.random() * 150;
      const type = Math.floor(Math.random() * 3);
      new Creature(x, y, type);
      gameState.creatureSpawnTimer = 0;
    }
  }
  
  function simulateKeyPress(p, keyCode) {
    // Simulate a key press for automated testing
    p.keyCode = keyCode;
    p.key = String.fromCharCode(keyCode);
    
    // Trigger keyPressed event manually
    const keys = {};
    keys[keyCode] = true;
    
    // Handle the input
    if (p.keyPressed) {
      p.keyPressed();
    }
  }
});

// Initialize the game when instance is ready
export function initGame() {
  initializeGameState();
  generateWorld();
  
  // Create player
  new Player(100, CANVAS_HEIGHT - 100);
  
  // Create friend NPC
  new Friend(500, CANVAS_HEIGHT - 90);
  
  // Create food orbs scattered around the world
  const foodPositions = [
    { x: 150, y: 250 },
    { x: 300, y: 200 },
    { x: 450, y: 160 },
    { x: 200, y: 130 },
    { x: 420, y: 90 },
    { x: 100, y: 200 },
    { x: 350, y: 280 },
    { x: 500, y: 240 },
    { x: 250, y: 100 },
    { x: 400, y: 300 },
    { x: 180, y: 320 },
    { x: 320, y: 150 },
    { x: 480, y: 200 },
    { x: 140, y: 180 },
    { x: 380, y: 260 }
  ];
  
  foodPositions.forEach(pos => {
    new FoodOrb(pos.x, pos.y);
  });
  
  // Create initial creatures
  for (let i = 0; i < 3; i++) {
    const x = 100 + Math.random() * 400;
    const y = 80 + Math.random() * 150;
    const type = i % 3;
    new Creature(x, y, type);
  }
}

export function resetGame() {
  initGame();
}

// Control mode setter for UI buttons
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
                    'test_2_ModeBtn';
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add('active');
  }
  
  console.log('Control mode set to:', mode);
};

// Wait for p5 instance to be ready, then initialize
setTimeout(() => {
  if (gameInstance) {
    initGame();
  }
}, 100);

// Expose game instance globally
window.gameInstance = gameInstance;

// Export for other modules
export { gameInstance };