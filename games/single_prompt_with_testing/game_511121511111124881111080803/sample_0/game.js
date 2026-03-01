// game.js - Main game loop and p5.js instance mode setup

import { 
  gameState, 
  resetGameState, 
  initializeStars,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from './globals.js';

import { Player } from './entities.js';
import { handleKeyPress, handleKeyRelease, processPlayerInput } from './input.js';
import { 
  renderStartScreen, 
  renderHUD, 
  renderPausedOverlay, 
  renderGameOverScreen,
  renderBackground,
  renderScreenFlash,
} from './ui.js';
import { initGame, updateGame } from './game_logic.js';
import { renderParticles } from './particles.js';

// Get p5 from window (loaded via script tag)
const p5 = window.p5;

// Create p5 instance
let gameInstance = new p5(p => {
  // ============================================================================
  // SETUP
  // ============================================================================
  
  p.setup = function() {
    // Create canvas
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.pixelDensity(1);
    
    // Set random seed for reproducibility
    p.randomSeed(42);
    
    // Initialize logs (write-only, never reset)
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Initialize game state
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    gameState.lastFrameTime = p.millis();
    
    // Initialize background stars
    initializeStars(150);
    
    // Log initial state
    p.logs.game_info.push({
      data: { 
        gamePhase: gameState.gamePhase,
        canvasWidth: CANVAS_WIDTH,
        canvasHeight: CANVAS_HEIGHT
      },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    console.log('Bit Blaster XL - Game Initialized');
  };
  
  // ============================================================================
  // DRAW LOOP
  // ============================================================================
  
  p.draw = function() {
    // Update frame count and delta time
    gameState.frameCount = p.frameCount;
    const currentTime = p.millis();
    gameState.deltaTime = (currentTime - gameState.lastFrameTime) / 1000;
    gameState.lastFrameTime = currentTime;
    
    // CRITICAL: Single background call at top of draw
    p.background(10, 10, 20);
    
    // Apply camera shake
    p.push();
    p.translate(gameState.cameraX, gameState.cameraY);
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        renderStartScreen(p);
        break;
        
      case "PLAYING":
        // Update game logic
        processPlayerInput();
        updateGame(p);
        
        // Render game
        renderBackground(p);
        renderGameEntities(p);
        renderParticles(p);
        p.pop(); // End camera shake transform
        renderHUD(p);
        renderScreenFlash(p);
        break;
        
      case "PAUSED":
        // Render game (frozen)
        renderBackground(p);
        renderGameEntities(p);
        renderParticles(p);
        p.pop(); // End camera shake transform
        renderHUD(p);
        renderPausedOverlay(p);
        break;
        
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        // Render game (frozen)
        renderBackground(p);
        renderGameEntities(p);
        renderParticles(p);
        p.pop(); // End camera shake transform
        renderHUD(p);
        renderGameOverScreen(p);
        break;
        
      default:
        p.pop();
        break;
    }
  };
  
  // ============================================================================
  // RENDER GAME ENTITIES
  // ============================================================================
  
  function renderGameEntities(p) {
    // Render in correct order (back to front)
    
    // Powerups
    gameState.powerups.forEach(powerup => powerup.render(p));
    
    // Enemies
    gameState.enemies.forEach(enemy => enemy.render(p));
    
    // Player
    if (gameState.player) {
      gameState.player.render(p);
    }
    
    // Projectiles
    gameState.projectiles.forEach(projectile => projectile.render(p));
  }
  
  // ============================================================================
  // INPUT HANDLERS
  // ============================================================================
  
  p.keyPressed = function() {
    handleKeyPress(p);
  };
  
  p.keyReleased = function() {
    handleKeyRelease(p);
  };
});

// ============================================================================
// EXPOSE GAME INSTANCE GLOBALLY
// ============================================================================

window.gameInstance = gameInstance;

// ============================================================================
// CONTROL MODE SWITCHING (for testing UI)
// ============================================================================

window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update UI buttons
  const buttons = document.querySelectorAll('.control-button');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  const activeBtn = document.getElementById(`${mode === 'HUMAN' ? 'humanModeBtn' : mode + '_ModeBtn'}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  console.log(`Control mode set to: ${mode}`);
};

// Export for other modules
export { gameInstance, initGame };