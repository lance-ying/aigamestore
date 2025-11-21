import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  KEYS, 
  gameState, 
  getGameState 
} from './globals.js';
import { Player } from './entities.js';
import { Level } from './level.js';
import { 
  drawBackground, 
  drawEntities, 
  drawUI, 
  drawStartScreen, 
  drawWinScreen, 
  drawLoseScreen 
} from './rendering.js';
import { 
  processInput, 
  processKeyReleased, 
  resetGame, 
  winGame, 
  loseGame 
} from './input.js';
import { checkCollision, checkCheckpoint } from './physics.js';
import { game_testing_controller } from './automated_testing_controller.js';

const p5 = window.p5;

// Create p5 instance
let gameInstance = new p5(p => {
  // Setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42); // Ensure reproducibility
    
    // Initialize logs (write-only)
    p.logs = {
      "game_info": [],
      "player_info": [],
      "inputs": []
    };
    
    // Initialize game state
    gameState.player = new Player(100, 200);
    gameState.level = new Level(gameState.levelLength);
    gameState.level.generate(p);
    gameState.entities = gameState.level.getAllEntities();
    gameState.checkpoints = gameState.level.checkpoints;
    gameState.gamePhase = "START";
    gameState.controlMode = "HUMAN";
    
    // Log initial game state
    p.logs.game_info.push({
      game_status: gameState.gamePhase,
      data: {},
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Expose the game state globally
    window.getGameState = getGameState;
  };
  
  // Draw function
  p.draw = function() {
    // Process automated testing input if in a test mode
    if (gameState.gamePhase === "PLAYING" && gameState.controlMode.startsWith("TEST_")) {
      const testAction = game_testing_controller(gameState);
      if (testAction === KEYS.SPACE && gameState.player.isGrounded) {
        gameState.player.jump(p, gameState);
      }
    }
    
    // Handle different game phases
    switch (gameState.gamePhase) {
      case "START":
        drawStartScreen(p);
        break;
        
      case "PLAYING":
        // Update game state
        updateGame();
        
        // Draw game elements
        drawBackground(p, gameState);
        drawEntities(p, gameState);
        gameState.player.draw(p);
        drawUI(p, gameState);
        break;
        
      case "PAUSED":
        // Draw paused game state
        drawBackground(p, gameState);
        drawEntities(p, gameState);
        gameState.player.draw(p);
        drawUI(p, gameState);
        break;
        
      case "GAME_OVER_WIN":
        drawWinScreen(p, gameState);
        break;
        
      case "GAME_OVER_LOSE":
        drawLoseScreen(p, gameState);
        break;
    }
  };
  
  // Update game state
  function updateGame() {
    // Update player
    gameState.player.update(p, gameState);
    
    // Update scroll speed (gradually increase difficulty)
    gameState.scrollSpeed += SCROLL_SPEED_INCREMENT;
    
    // Update distance
    gameState.distance += gameState.scrollSpeed;
    
    // Update entities
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
      const entity = gameState.entities[i];
      
      // Update entity position
      entity.update(gameState.scrollSpeed);
      
      // Check collisions with player
      if (checkCollision(p, gameState.player, entity)) {
        if (entity.type === 'finish') {
          // Player reached the finish line
          winGame(p);
          return;
        } else {
          // Player hit an obstacle
          loseGame(p);
          return;
        }
      }
      
      // Check if player reached a checkpoint
      if (entity.type === 'checkpoint' && !entity.reached) {
        if (checkCheckpoint(p, gameState.player, entity)) {
          entity.reached = true;
          gameState.currentCheckpoint = entity.id + 1;
          
          // Log checkpoint reached
          p.logs.game_info.push({
            game_status: "CHECKPOINT_REACHED",
            data: { checkpoint: entity.id, distance: Math.floor(gameState.distance) },
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
      }
      
      // Remove entities that are far off-screen
      if (entity.isOffScreen && entity.isOffScreen()) {
        gameState.entities.splice(i, 1);
      }
    }
    
    // Check if player fell off the bottom of the screen
    if (gameState.player.y > CANVAS_HEIGHT + 100) {
      loseGame(p);
    }
  }
  
  // Key pressed event
  p.keyPressed = function() {
    // Only process input in HUMAN mode or handle global keys
    if (gameState.controlMode === "HUMAN" || 
        p.keyCode === KEYS.ENTER || 
        p.keyCode === KEYS.ESC || 
        p.keyCode === KEYS.R) {
      processInput(p, p.keyCode, gameState.player);
    }
    
    // Prevent default browser behavior for game keys
    if ([KEYS.SPACE, KEYS.UP, KEYS.DOWN, KEYS.LEFT, KEYS.RIGHT].includes(p.keyCode)) {
      return false;
    }
  };
  
  // Key released event
  p.keyReleased = function() {
    // Only process input in HUMAN mode
    if (gameState.controlMode === "HUMAN") {
      processKeyReleased(p, p.keyCode);
    }
  };
});

// Set control mode function (exposed globally)
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Log control mode change
  gameInstance.logs.game_info.push({
    game_status: "CONTROL_MODE_CHANGED",
    data: { mode: mode },
    framecount: gameInstance.frameCount,
    timestamp: Date.now()
  });
  
  // Update UI buttons
  document.querySelectorAll('.control-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeBtn = mode === "HUMAN" 
    ? document.getElementById('humanModeBtn') 
    : document.getElementById(`${mode.toLowerCase()}_ModeBtn`);
  
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
};

// Expose the game instance globally
window.gameInstance = gameInstance;