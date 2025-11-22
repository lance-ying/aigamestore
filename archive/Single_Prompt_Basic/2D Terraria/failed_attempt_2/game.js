import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, CONTROL_MODES, TILE_SIZE, DAY_LENGTH, gameState, getGameState } from './globals.js';
import { Player, Enemy } from './entities.js';
import { generateWorld, renderWorld, spawnEnemies, updateDayNightCycle } from './world.js';
import { drawUI } from './ui.js';
import { game_testing_controller } from './automated_testing_controller.js';

// Expose getGameState globally
window.getGameState = getGameState;

// Function to set control mode
function setControlMode(mode) {
  if (Object.values(CONTROL_MODES).includes(mode)) {
    gameState.controlMode = mode;
    
    // Update button states
    document.querySelectorAll('.control-button').forEach(button => {
      button.classList.remove('active');
    });
    
    const activeButton = document.getElementById(`${mode.toLowerCase()}ModeBtn`) || 
                          document.getElementById(`test_${mode.split('_')[1]}_ModeBtn`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }
}

// Expose setControlMode globally
window.setControlMode = setControlMode;

// Initialize p5.js in instance mode
const p5 = window.p5;
let gameInstance = new p5(p => {
  // Initialize variables
  let keyStates = {};
  
  // Initialize the logs. Important: do not reset the logs at any point in the code!
  p.logs = {
    "game_info": [],
    "player_info": [],
    "inputs": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game state
    resetGame();
    
    // Log initial game state
    p.logs.game_info.push({
      game_status: gameState.gamePhase,
      data: {},
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };
  
  p.draw = function() {
    p.background(50);
    
    // Handle game state
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        handleStartScreen();
        break;
      case GAME_PHASES.PLAYING:
        handlePlaying();
        break;
      case GAME_PHASES.PAUSED:
        handlePaused();
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        handleGameOver();
        break;
    }
    
    // Draw UI
    drawUI(p);
  };
  
  function resetGame() {
    // Generate world
    gameState.world = generateWorld(p);
    
    // Create player at spawn position
    const spawnX = Math.floor(gameState.world.length / 2) * TILE_SIZE;
    let spawnY = 0;
    while (spawnY < gameState.world[0].length && 
           gameState.world[Math.floor(spawnX / TILE_SIZE)][spawnY] === 0) {
      spawnY++;
    }
    spawnY = (spawnY - 2) * TILE_SIZE;
    
    gameState.player = new Player(spawnX, spawnY);
    gameState.entities = [gameState.player];
    
    // Reset other game state
    gameState.inventory = [];
    gameState.selectedItemIndex = 0;
    gameState.camera = { x: 0, y: 0 };
    gameState.time = 0;
    gameState.score = 0;
    gameState.dayCount = 1;
    gameState.nearCraftingTable = false;
    gameState.lastPosition = { x: spawnX, y: spawnY };
    gameState.stuckCounter = 0;
    
    // Log player info
    p.logs.player_info.push({
      screen_x: gameState.player.x - gameState.camera.x,
      screen_y: gameState.player.y - gameState.camera.y,
      game_x: gameState.player.x,
      game_y: gameState.player.y,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function handleStartScreen() {
    // Check for enter key to start game
    if (keyStates[13]) { // ENTER
      gameState.gamePhase = GAME_PHASES.PLAYING;
      
      // Log game state change
      p.logs.game_info.push({
        game_status: gameState.gamePhase,
        data: {},
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  function handlePlaying() {
    // Update day/night cycle
    updateDayNightCycle();
    
    // Spawn enemies
    spawnEnemies(p);
    
    // Update player and entities
    updateEntities();
    
    // Update camera
    updateCamera();
    
    // Draw world
    renderWorld(p);
    
    // Draw entities
    drawEntities();
    
    // Check for pause
    if (keyStates[27]) { // ESC
      gameState.gamePhase = GAME_PHASES.PAUSED;
      
      // Log game state change
      p.logs.game_info.push({
        game_status: gameState.gamePhase,
        data: {},
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      // Clear key state to prevent immediate unpause
      keyStates[27] = false;
    }
  }
  
  function handlePaused() {
    // Draw world and entities in paused state
    renderWorld(p);
    drawEntities();
    
    // Check for unpause
    if (keyStates[27]) { // ESC
      gameState.gamePhase = GAME_PHASES.PLAYING;
      
      // Log game state change
      p.logs.game_info.push({
        game_status: gameState.gamePhase,
        data: {},
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      // Clear key state to prevent immediate repause
      keyStates[27] = false;
    }
  }
  
  function handleGameOver() {
    // Check for restart
    if (keyStates[82]) { // R
      gameState.gamePhase = GAME_PHASES.START;
      resetGame();
      
      // Log game state change
      p.logs.game_info.push({
        game_status: gameState.gamePhase,
        data: {},
        framecount: p.frameCount,
        timestamp: Date.now()
      });
      
      // Clear key state
      keyStates[82] = false;
    }
  }
  
  function updateEntities() {
    // Handle player input
    handlePlayerInput();
    
    // Update all entities
    for (let i = 0; i < gameState.entities.length; i++) {
      gameState.entities[i].update(p);
    }
    
    // Log player position
    if (p.frameCount % 10 === 0) {
      p.logs.player_info.push({
        screen_x: gameState.player.x - gameState.camera.x,
        screen_y: gameState.player.y - gameState.camera.y,
        game_x: gameState.player.x,
        game_y: gameState.player.y,
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  function handlePlayerInput() {
    // If in test mode, get automated input
    let controlKey = null;
    
    if (gameState.controlMode !== CONTROL_MODES.HUMAN) {
      controlKey = game_testing_controller(gameState);
      
      // Apply the automated control if provided
      if (controlKey !== null) {
        // Override the keyStates for this frame
        keyStates = {};
        keyStates[controlKey] = true;
      }
    }
    
    // Movement
    if (keyStates[37]) { // LEFT
      gameState.player.move(-1);
    }
    if (keyStates[39]) { // RIGHT
      gameState.player.move(1);
    }
    if (keyStates[38]) { // UP
      gameState.player.jump();
    }
    
    // Actions
    if (keyStates[90]) { // Z
      gameState.player.mine(p);
      gameState.player.attack();
    }
    if (keyStates[32]) { // SPACE
      gameState.player.placeBlock(p);
    }
    if (keyStates[16]) { // SHIFT
      // Cycle through inventory
      if (gameState.inventory.length > 0) {
        gameState.selectedItemIndex = (gameState.selectedItemIndex + 1) % gameState.inventory.length;
      }
      
      // Clear key state to prevent continuous cycling
      keyStates[16] = false;
    }
  }
  
  function updateCamera() {
    // Center camera on player
    gameState.camera.x = Math.max(0, Math.min(
      gameState.player.x - p.width / 2,
      gameState.world.length * TILE_SIZE - p.width
    ));
    
    gameState.camera.y = Math.max(0, Math.min(
      gameState.player.y - p.height / 2,
      gameState.world[0].length * TILE_SIZE - p.height
    ));
  }
  
  function drawEntities() {
    for (const entity of gameState.entities) {
      entity.render(p);
    }
  }
  
  // Input handling
  p.keyPressed = function() {
    keyStates[p.keyCode] = true;
    
    // Log allowed key inputs
    if ([13, 16, 27, 32, 37, 38, 39, 40, 82, 90].includes(p.keyCode)) {
      p.logs.inputs.push({
        input_type: "keyPressed",
        data: { key: p.key, keyCode: p.keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    return false; // Prevent default
  };
  
  p.keyReleased = function() {
    keyStates[p.keyCode] = false;
    
    // Log allowed key inputs
    if ([13, 16, 27, 32, 37, 38, 39, 40, 82, 90].includes(p.keyCode)) {
      p.logs.inputs.push({
        input_type: "keyReleased",
        data: { key: p.key, keyCode: p.keyCode },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    return false; // Prevent default
  };
});

// Expose the game instance globally
window.gameInstance = gameInstance;