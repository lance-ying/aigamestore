import { CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT, TOOL_TYPES, ITEM_TYPES, DAY_LENGTH, gameState, getGameState, setControlMode } from './globals.js';
import { generateWorld, drawWorld, setTileAt, tileToItem, itemToTile } from './world.js';
import { Player } from './player.js';
import { Slime, Zombie, FlyingEye, Boss, spawnEnemies } from './entities.js';
import { drawHUD, drawStartScreen, drawPauseScreen, drawGameOverScreen, drawCraftingMenu, craftItem, drawBackground } from './ui.js';
import { game_testing_controller } from './automated_testing_controller.js';

// Expose global functions
window.getGameState = getGameState;
window.setControlMode = setControlMode;

// Create p5 instance
const p5 = window.p5;
let gameInstance = new p5(p => {
  // Initialize variables
  let keyStates = {};
  let showCrafting = false;
  
  // Initialize the logs
  p.logs = {
    "game_info": [],
    "player_info": [],
    "inputs": []
  };
  
  // Setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize game state
    resetGame();
    
    // Log game start
    logGameInfo("START", {});
  };
  
  // Draw function
  p.draw = function() {
    handleGameStateUpdate();
    
    switch (gameState.gamePhase) {
      case "START":
        drawStartScreen(p);
        break;
      case "PLAYING":
        updatePlaying();
        drawPlaying();
        break;
      case "PAUSED":
        drawPlaying();
        drawPauseScreen(p);
        break;
      case "GAME_OVER_WIN":
        drawPlaying();
        drawGameOverScreen(p, true, gameState.score);
        break;
      case "GAME_OVER_LOSE":
        drawPlaying();
        drawGameOverScreen(p, false, gameState.score);
        break;
    }
  };
  
  // Handle game state updates
  function handleGameStateUpdate() {
    // Check for automated testing
    if (gameState.gamePhase === "PLAYING" && gameState.controlMode !== "HUMAN") {
      const testAction = game_testing_controller(gameState);
      if (testAction) {
        keyStates[testAction] = true;
        
        // Log the automated input
        logInput("keyPressed", { key: String.fromCharCode(testAction), keyCode: testAction });
      } else {
        // Clear all key states if no action
        keyStates = {};
      }
    }
    
    // Update player position in logs if player exists
    if (gameState.player) {
      logPlayerInfo();
    }
    
    // Check win/lose conditions
    if (gameState.gamePhase === "PLAYING") {
      if (gameState.bossDefeated) {
        gameState.gamePhase = "GAME_OVER_WIN";
        logGameInfo("GAME_OVER_WIN", { score: gameState.score });
      } else if (gameState.health <= 0) {
        gameState.gamePhase = "GAME_OVER_LOSE";
        logGameInfo("GAME_OVER_LOSE", { score: gameState.score });
      }
    }
  }
  
  // Update game during playing phase
  function updatePlaying() {
    // Update day/night cycle (slower now)
    gameState.dayTime++;
    if (gameState.dayTime >= DAY_LENGTH) {
      gameState.dayTime = 0;
      gameState.isDay = !gameState.isDay;
    }
    
    // Handle player movement
    handlePlayerMovement();
    
    // Update player
    gameState.player.update(p, gameState.world, gameState.entities, gameState.inventory, gameState.selectedTool, gameState.selectedBlock);
    
    // Update camera
    updateCamera();
    
    // Update entities
    updateEntities();
    
    // Spawn enemies
    const bossSpawned = spawnEnemies(p, gameState.world, gameState.entities, gameState.player, gameState.isDay, gameState.bossSpawned);
    if (bossSpawned) {
      gameState.bossSpawned = true;
    }
    
    // REMOVE CRAFTING - simplified game
  }
  
  // Draw game during playing phase
  function drawPlaying() {
    // Draw background
    drawBackground(p, gameState.isDay, gameState.dayTime, DAY_LENGTH);
    
    // Draw world
    drawWorld(p, gameState.world, gameState.camera.x, gameState.camera.y);
    
    // Draw entities
    for (const entity of gameState.entities) {
      entity.draw(p, gameState.camera.x, gameState.camera.y);
    }
    
    // Draw player
    gameState.player.draw(p, gameState.camera.x, gameState.camera.y);
    
    // Draw HUD
    drawHUD(p, gameState.health, gameState.maxHealth, gameState.inventory, gameState.selectedTool, gameState.selectedBlock, gameState.isDay, gameState.score);
    
    // REMOVE crafting menu display - no more crafting!
  }
  
  // Handle player movement
  function handlePlayerMovement() {
    if (keyStates[37]) { // LEFT
      gameState.player.moveLeft();
    }
    
    if (keyStates[39]) { // RIGHT
      gameState.player.moveRight();
    }
    
    if (keyStates[38]) { // UP
      gameState.player.jump();
    }
    
    if (keyStates[40]) { // DOWN
      gameState.player.duck(true);
    } else {
      gameState.player.duck(false);
    }
    
    // Handle block placement with SHIFT (FIX: only place if we have blocks)
    if (keyStates[16] && gameState.selectedBlock && gameState.inventory[gameState.selectedBlock] > 0) {
      gameState.player.placeBlock(gameState.world, gameState.inventory, gameState.selectedBlock);
    }
  }
  
  // Update camera position
  function updateCamera() {
    // Camera follows player
    gameState.camera.x = gameState.player.x - CANVAS_WIDTH / 2;
    gameState.camera.y = gameState.player.y - CANVAS_HEIGHT / 2;
    
    // Clamp camera to world bounds
    gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, WORLD_WIDTH * TILE_SIZE - CANVAS_WIDTH));
    gameState.camera.y = Math.max(0, Math.min(gameState.camera.y, WORLD_HEIGHT * TILE_SIZE - CANVAS_HEIGHT));
  }
  
  // Update entities
  function updateEntities() {
    for (let i = gameState.entities.length - 1; i >= 0; i--) {
      const entity = gameState.entities[i];
      
      entity.update(p, gameState.world, gameState.player);
      
      // Remove dead entities
      if (entity.isDead) {
        // Add score based on entity type
        if (entity.type === 'enemy_slime') {
          gameState.score += 10;
        } else if (entity.type === 'enemy_zombie') {
          gameState.score += 20;
        } else if (entity.type === 'enemy_flying_eye') {
          gameState.score += 30;
        } else if (entity.type === 'enemy_boss') {
          gameState.score += 500;
          gameState.bossDefeated = true;
        }
        
        gameState.entities.splice(i, 1);
      }
    }
  }
  
  // Draw entities
  function drawEntities() {
    for (const entity of gameState.entities) {
      entity.draw(p, gameState.camera.x, gameState.camera.y);
    }
  }
  
  // Handle crafting
  function handleCrafting() {
    // Try to craft better tools/weapons first
    if (!gameState.inventory[ITEM_TYPES.WOOD_PICKAXE] && gameState.inventory[ITEM_TYPES.WOOD] >= 3) {
      craftItem(gameState.inventory, ITEM_TYPES.WOOD_PICKAXE);
    }
    
    if (!gameState.inventory[ITEM_TYPES.WOOD_AXE] && gameState.inventory[ITEM_TYPES.WOOD] >= 3) {
      craftItem(gameState.inventory, ITEM_TYPES.WOOD_AXE);
    }
    
    if (!gameState.inventory[ITEM_TYPES.WOOD_SWORD] && gameState.inventory[ITEM_TYPES.WOOD] >= 5) {
      craftItem(gameState.inventory, ITEM_TYPES.WOOD_SWORD);
    }
    
    if (!gameState.inventory[ITEM_TYPES.STONE_PICKAXE] && 
        gameState.inventory[ITEM_TYPES.WOOD] >= 2 && 
        gameState.inventory[ITEM_TYPES.STONE] >= 3) {
      craftItem(gameState.inventory, ITEM_TYPES.STONE_PICKAXE);
    }
    
    if (!gameState.inventory[ITEM_TYPES.STONE_AXE] && 
        gameState.inventory[ITEM_TYPES.WOOD] >= 2 && 
        gameState.inventory[ITEM_TYPES.STONE] >= 3) {
      craftItem(gameState.inventory, ITEM_TYPES.STONE_AXE);
    }
    
    if (!gameState.inventory[ITEM_TYPES.STONE_SWORD] && 
        gameState.inventory[ITEM_TYPES.WOOD] >= 2 && 
        gameState.inventory[ITEM_TYPES.STONE] >= 5) {
      craftItem(gameState.inventory, ITEM_TYPES.STONE_SWORD);
    }
    
    if (!gameState.inventory[ITEM_TYPES.IRON_PICKAXE] && 
        gameState.inventory[ITEM_TYPES.WOOD] >= 2 && 
        gameState.inventory[ITEM_TYPES.IRON] >= 3) {
      craftItem(gameState.inventory, ITEM_TYPES.IRON_PICKAXE);
    }
    
    if (!gameState.inventory[ITEM_TYPES.IRON_AXE] && 
        gameState.inventory[ITEM_TYPES.WOOD] >= 2 && 
        gameState.inventory[ITEM_TYPES.IRON] >= 3) {
      craftItem(gameState.inventory, ITEM_TYPES.IRON_AXE);
    }
    
    if (!gameState.inventory[ITEM_TYPES.IRON_SWORD] && 
        gameState.inventory[ITEM_TYPES.WOOD] >= 2 && 
        gameState.inventory[ITEM_TYPES.IRON] >= 5) {
      craftItem(gameState.inventory, ITEM_TYPES.IRON_SWORD);
    }
    
    if (!gameState.inventory[ITEM_TYPES.GOLD_SWORD] && 
        gameState.inventory[ITEM_TYPES.WOOD] >= 2 && 
        gameState.inventory[ITEM_TYPES.GOLD] >= 5) {
      craftItem(gameState.inventory, ITEM_TYPES.GOLD_SWORD);
    }
    
    // Craft building blocks if we have enough materials
    if (gameState.inventory[ITEM_TYPES.WOOD] >= 10 && 
        (!gameState.inventory[ITEM_TYPES.WOODEN_PLATFORM] || gameState.inventory[ITEM_TYPES.WOODEN_PLATFORM] < 5)) {
      craftItem(gameState.inventory, ITEM_TYPES.WOODEN_PLATFORM);
    }
    
    if (gameState.inventory[ITEM_TYPES.WOOD] >= 12 && 
        (!gameState.inventory[ITEM_TYPES.WOODEN_WALL] || gameState.inventory[ITEM_TYPES.WOODEN_WALL] < 5)) {
      craftItem(gameState.inventory, ITEM_TYPES.WOODEN_WALL);
    }
    
    if (gameState.inventory[ITEM_TYPES.STONE] >= 12 && 
        (!gameState.inventory[ITEM_TYPES.STONE_WALL] || gameState.inventory[ITEM_TYPES.STONE_WALL] < 5)) {
      craftItem(gameState.inventory, ITEM_TYPES.STONE_WALL);
    }
  }
  
  // Reset game state
  function resetGame() {
    // Generate world
    gameState.world = generateWorld(p);
    
    // Create player
    gameState.player = new Player(WORLD_WIDTH * TILE_SIZE / 2, 0);
    
    // Reset entities
    gameState.entities = [];
    
    // Add some initial enemies
    for (let i = 0; i < 5; i++) {
      const x = p.random(WORLD_WIDTH * TILE_SIZE);
      const y = p.random(20 * TILE_SIZE);
      gameState.entities.push(new Slime(x, y));
    }
    
    // Reset camera
    gameState.camera = { x: 0, y: 0 };
    
    // Start with EMPTY inventory - no free blocks!
    gameState.inventory = {};
    
    // Reset selected items - start with no blocks selected
    gameState.selectedTool = TOOL_TYPES.PICKAXE;
    gameState.selectedBlock = null;
    
    // Reset day/night cycle
    gameState.dayTime = 0;
    gameState.isDay = true;
    
    // Reset score and health
    gameState.score = 0;
    gameState.health = 100;
    gameState.maxHealth = 100;
    
    // Reset boss state
    gameState.bossDefeated = false;
    gameState.bossSpawned = false;
    
    // Reset crafting
    // showCrafting = true; // DELETE THIS LINE
    
    // Reset testing variables
    gameState.lastActionTime = 0;
    gameState.actionHistory = [];
  }
  
  // Key pressed event
  p.keyPressed = function() {
    // Store key state
    keyStates[p.keyCode] = true;
    
    // Log input
    logInput("keyPressed", { key: p.key, keyCode: p.keyCode });
    
    // Handle game phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === "START") {
        gameState.gamePhase = "PLAYING";
        logGameInfo("PLAYING", {});
      }
    } else if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === "PLAYING") {
        gameState.gamePhase = "PAUSED";
        logGameInfo("PAUSED", {});
      } else if (gameState.gamePhase === "PAUSED") {
        gameState.gamePhase = "PLAYING";
        logGameInfo("PLAYING", {});
      }
    } else if (p.keyCode === 82) { // R
      if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
        resetGame();
        gameState.gamePhase = "START";
        logGameInfo("START", {});
      }
    }
    
    // Handle tool switching
    if (p.keyCode === 90 && gameState.gamePhase === "PLAYING") { // Z
      // Simple cycle: PICKAXE -> AXE -> SWORD -> BLOCKS (if available)
      if (!gameState.selectedBlock) {
        // Currently on tools, cycle through them
        if (gameState.selectedTool === TOOL_TYPES.PICKAXE) {
          gameState.selectedTool = TOOL_TYPES.AXE;
        } else if (gameState.selectedTool === TOOL_TYPES.AXE) {
          gameState.selectedTool = TOOL_TYPES.SWORD;
        } else if (gameState.selectedTool === TOOL_TYPES.SWORD) {
          // Try to switch to blocks if we have any
          const availableBlocks = ['wooden_platform', 'wooden_wall', 'stone_wall', 'dirt_block', 'iron_block', 'gold_block'];
          
          for (const block of availableBlocks) {
            if (gameState.inventory[block] > 0) {
              gameState.selectedTool = null;
              gameState.selectedBlock = block;
              break;
            }
          }
          
          // If no blocks available, go back to pickaxe
          if (gameState.selectedBlock === null) {
            gameState.selectedTool = TOOL_TYPES.PICKAXE;
          }
        }
      } else {
        // Currently on blocks, cycle through available ones
        const availableBlocks = ['wooden_platform', 'wooden_wall', 'stone_wall', 'dirt_block', 'iron_block', 'gold_block'];
        const currentIndex = availableBlocks.indexOf(gameState.selectedBlock);
        
        // Find next available block
        let found = false;
        for (let i = 1; i < availableBlocks.length; i++) {
          const nextIndex = (currentIndex + i) % availableBlocks.length;
          const nextBlock = availableBlocks[nextIndex];
          
          if (gameState.inventory[nextBlock] > 0) {
            gameState.selectedBlock = nextBlock;
            found = true;
            break;
          }
        }
        
        // If no other blocks available, go back to tools
        if (!found) {
          gameState.selectedBlock = null;
          gameState.selectedTool = TOOL_TYPES.PICKAXE;
        }
      }
    }
    
    return false; // Prevent default behavior
  };
  
  // Key released event
  p.keyReleased = function() {
    // Clear key state
    keyStates[p.keyCode] = false;
    
    // Log input
    logInput("keyReleased", { key: p.key, keyCode: p.keyCode });
    
    return false; // Prevent default behavior
  };
  
  // Log game information
  function logGameInfo(status, data) {
    p.logs.game_info.push({
      "game_status": status,
      "data": data,
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  }
  
  // Log player information
  function logPlayerInfo() {
    p.logs.player_info.push({
      "screen_x": gameState.player.x - gameState.camera.x,
      "screen_y": gameState.player.y - gameState.camera.y,
      "game_x": gameState.player.x,
      "game_y": gameState.player.y,
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  }
  
  // Log input information
  function logInput(inputType, data) {
    // Only log allowed keys
    const allowedKeys = [13, 27, 82, 37, 38, 39, 40, 32, 16, 90, 88];
    
    if (allowedKeys.includes(data.keyCode)) {
      p.logs.inputs.push({
        "input_type": inputType,
        "data": data,
        "framecount": p.frameCount,
        "timestamp": Date.now()
      });
    }
  }
});

// Expose the game instance globally
window.gameInstance = gameInstance;