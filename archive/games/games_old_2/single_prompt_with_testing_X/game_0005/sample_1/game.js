// game.js - Main game file

import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, TARGET_FPS,
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED, 
  PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  SCROLL_SPEED, TRACK_LENGTH, NUM_LANES, LANE_WIDTH,
  gameState, setControlMode
} from './globals.js';
import { Player } from './player.js';
import { TrackGenerator } from './track_generator.js';
import { Customer } from './customer.js';
import { renderStartScreen, renderGameUI, renderGameOverScreen, renderServingPhase } from './ui.js';
import get_automated_testing_action from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let trackGenerator;
  let inputs = {};
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(TARGET_FPS);
    p.randomSeed(42);
    
    // Initialize logs (write-only)
    p.logs = {
      "game_info": [],
      "inputs": [],
      "player_info": []
    };
    
    // Initialize game state
    gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
    gameState.entities = [gameState.player];
    
    // Log initial state
    logGameInfo(p, "Game initialized", { phase: gameState.gamePhase });
  };
  
  p.draw = function() {
    // Single background call
    p.background(255, 248, 240);
    
    // Handle input based on control mode
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      const action = get_automated_testing_action(gameState);
      applyAutomatedAction(action);
    }
    
    // Update and render based on game phase
    switch (gameState.gamePhase) {
      case PHASE_START:
        renderStartScreen(p, gameState);
        break;
        
      case PHASE_PLAYING:
        updateGame(p);
        renderGame(p);
        renderGameUI(p, gameState);
        break;
        
      case PHASE_PAUSED:
        renderGame(p);
        renderGameUI(p, gameState);
        break;
        
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        renderGame(p);
        renderGameOverScreen(p, gameState);
        break;
    }
  };
  
  function updateGame(p) {
    if (gameState.servingPhase) {
      updateServingPhase(p);
      return;
    }
    
    // Update scroll
    gameState.scrollOffset += SCROLL_SPEED;
    
    // Check if track complete
    if (gameState.scrollOffset >= TRACK_LENGTH && !gameState.trackComplete) {
      gameState.trackComplete = true;
      startServingPhase();
      return;
    }
    
    // Update player
    gameState.player.update(p, inputs);
    
    // Log player position occasionally
    if (p.frameCount % 30 === 0) {
      logPlayerInfo(p);
    }
    
    // Update and check collectibles
    for (let i = gameState.collectibles.length - 1; i >= 0; i--) {
      const collectible = gameState.collectibles[i];
      collectible.update(p, SCROLL_SPEED);
      
      // Check collection
      if (!collectible.collected && checkCollision(p, gameState.player, collectible)) {
        handleCollection(p, collectible);
        collectible.collected = true;
      }
      
      // Remove if off screen
      if (collectible.isOffScreen(gameState.scrollOffset)) {
        gameState.collectibles.splice(i, 1);
      }
    }
    
    // Update and check obstacles
    for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
      const obstacle = gameState.obstacles[i];
      obstacle.update(p, SCROLL_SPEED);
      
      // Check collision
      if (!obstacle.hit && gameState.player.invulnerable === 0) {
        if (checkCollision(p, gameState.player, obstacle)) {
          handleObstacleHit(p, obstacle);
          obstacle.hit = true;
        }
      }
      
      // Remove if off screen
      if (obstacle.isOffScreen(gameState.scrollOffset)) {
        gameState.obstacles.splice(i, 1);
      }
    }
    
    // Check game over (lose)
    if (gameState.player.getStackHeight() === 0 && gameState.scrollOffset > 500) {
      endGame(false);
    }
  }
  
  function checkCollision(p, player, entity) {
    const playerBounds = player.getBounds();
    const entityBounds = entity.getBounds(gameState.scrollOffset);
    
    return p.collideRectRect(
      playerBounds.x, playerBounds.y, playerBounds.width, playerBounds.height,
      entityBounds.x, entityBounds.y, entityBounds.width, entityBounds.height
    );
  }
  
  function handleCollection(p, collectible) {
    const added = collectible.type === 'CUP' ? 
      (gameState.player.addCup(), true) : 
      gameState.player.addToCup(collectible.type);
    
    if (added) {
      if (collectible.type === 'CUP') {
        gameState.cupsCollected++;
      } else if (collectible.type === 'COFFEE' || collectible.type === 'MILK') {
        gameState.coffeeAdded++;
      } else if (collectible.type === 'SLEEVE') {
        gameState.sleevesAdded++;
      } else if (collectible.type === 'LID') {
        gameState.lidsAdded++;
      }
      
      // Check for combo
      const now = Date.now();
      if (now - gameState.lastCollectionTime < 1000) {
        gameState.comboMultiplier = Math.min(3, gameState.comboMultiplier + 0.5);
      } else {
        gameState.comboMultiplier = 1;
      }
      gameState.lastCollectionTime = now;
    }
  }
  
  function handleObstacleHit(p, obstacle) {
    gameState.player.removeFromStack(obstacle.damage);
    gameState.comboMultiplier = 1;
    logGameInfo(p, "Obstacle hit", { damage: obstacle.damage, stackRemaining: gameState.player.getStackHeight() });
  }
  
  function startServingPhase() {
    gameState.servingPhase = true;
    gameState.servingProgress = 0;
    gameState.completedDrinks = gameState.player.getCompletedDrinks();
    
    // Create customers
    const numCustomers = Math.min(8, gameState.player.getStackHeight());
    gameState.customers = [];
    for (let i = 0; i < numCustomers; i++) {
      const x = (CANVAS_WIDTH / (numCustomers + 1)) * (i + 1);
      const y = CANVAS_HEIGHT / 2;
      gameState.customers.push(new Customer(x, y, i));
    }
    
    logGameInfo(p, "Serving phase started", { customers: numCustomers });
  }
  
  function updateServingPhase(p) {
    gameState.servingProgress++;
    
    // Update customers
    for (const customer of gameState.customers) {
      customer.update();
    }
    
    // Serve drinks gradually
    const serveInterval = 40;
    const customerIndex = Math.floor(gameState.servingProgress / serveInterval);
    
    if (customerIndex < gameState.customers.length) {
      if (gameState.servingProgress % serveInterval === 0 && customerIndex < gameState.player.getStackHeight()) {
        const customer = gameState.customers[customerIndex];
        customer.serve();
        
        // Award coins based on drink completion
        const cup = gameState.player.stack[customerIndex];
        let coinValue = 5; // Base value
        if (cup.hasCoffee) coinValue += 5;
        if (cup.hasSleeve) coinValue += 5;
        if (cup.hasLid) coinValue += 5;
        if (cup.complete) coinValue += 10; // Bonus for complete
        
        gameState.coins += coinValue;
        gameState.totalCoins += coinValue;
      }
    } else if (gameState.servingProgress > gameState.customers.length * serveInterval + 60) {
      // Serving complete
      endGame(true);
    }
  }
  
  function endGame(win) {
    gameState.gamePhase = win ? PHASE_GAME_OVER_WIN : PHASE_GAME_OVER_LOSE;
    logGameInfo(p, win ? "Game won" : "Game lost", { 
      coins: gameState.coins,
      completed: gameState.completedDrinks
    });
  }
  
  function renderGame(p) {
    // Draw track lanes
    p.push();
    for (let i = 0; i <= NUM_LANES; i++) {
      const x = i * LANE_WIDTH;
      p.stroke(200, 190, 180);
      p.strokeWeight(2);
      
      // Dashed lines
      for (let y = 0; y < CANVAS_HEIGHT; y += 20) {
        const worldY = y + gameState.scrollOffset;
        if (worldY % 40 < 20) {
          p.line(x, y, x, Math.min(y + 20, CANVAS_HEIGHT));
        }
      }
    }
    p.pop();
    
    // Render collectibles
    for (const collectible of gameState.collectibles) {
      if (!collectible.collected) {
        collectible.render(p, gameState.scrollOffset);
      }
    }
    
    // Render obstacles
    for (const obstacle of gameState.obstacles) {
      if (!obstacle.hit) {
        obstacle.render(p, gameState.scrollOffset);
      }
    }
    
    // Render player
    gameState.player.render(p, gameState.scrollOffset);
    
    // Render serving phase
    if (gameState.servingPhase) {
      renderServingPhase(p, gameState);
      
      // Render customers
      for (const customer of gameState.customers) {
        customer.render(p);
      }
    }
  }
  
  function applyAutomatedAction(action) {
    inputs = {
      left: action.left || false,
      right: action.right || false,
      boost: action.boost || false,
      dodgeLeft: action.dodgeLeft || false,
      dodgeRight: action.dodgeRight || false
    };
  }
  
  // Keyboard handling
  p.keyPressed = function() {
    logInput(p, "keyPressed", { key: p.key, keyCode: p.keyCode });
    
    // Phase transitions
    if (p.keyCode === 13) { // ENTER
      if (gameState.gamePhase === PHASE_START) {
        startGame(p);
      }
      return;
    }
    
    if (p.keyCode === 27) { // ESC
      if (gameState.gamePhase === PHASE_PLAYING) {
        gameState.gamePhase = PHASE_PAUSED;
        logGameInfo(p, "Game paused", {});
      } else if (gameState.gamePhase === PHASE_PAUSED) {
        gameState.gamePhase = PHASE_PLAYING;
        logGameInfo(p, "Game resumed", {});
      }
      return;
    }
    
    if (p.keyCode === 82) { // R
      if (gameState.gamePhase === PHASE_GAME_OVER_WIN || 
          gameState.gamePhase === PHASE_GAME_OVER_LOSE) {
        resetGame(p);
      }
      return;
    }
    
    // Gameplay inputs (only in HUMAN mode during PLAYING)
    if (gameState.controlMode === "HUMAN" && gameState.gamePhase === PHASE_PLAYING) {
      if (p.keyCode === 37) inputs.left = true;
      if (p.keyCode === 39) inputs.right = true;
      if (p.keyCode === 38) inputs.boost = true;
      if (p.keyCode === 90) inputs.dodgeLeft = true;
      if (p.keyCode === 16) inputs.dodgeRight = true;
    }
  };
  
  p.keyReleased = function() {
    logInput(p, "keyReleased", { key: p.key, keyCode: p.keyCode });
    
    if (gameState.controlMode === "HUMAN") {
      if (p.keyCode === 37) inputs.left = false;
      if (p.keyCode === 39) inputs.right = false;
      if (p.keyCode === 38) inputs.boost = false;
      if (p.keyCode === 90) inputs.dodgeLeft = false;
      if (p.keyCode === 16) inputs.dodgeRight = false;
    }
  };
  
  function startGame(p) {
    gameState.gamePhase = PHASE_PLAYING;
    gameState.scrollOffset = 0;
    gameState.coins = 0;
    gameState.cupsCollected = 0;
    gameState.coffeeAdded = 0;
    gameState.sleevesAdded = 0;
    gameState.lidsAdded = 0;
    gameState.completedDrinks = 0;
    gameState.servingPhase = false;
    gameState.trackComplete = false;
    gameState.comboMultiplier = 1;
    
    // Reset player
    gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
    gameState.entities = [gameState.player];
    
    // Generate track
    trackGenerator = new TrackGenerator(p, gameState.level);
    const track = trackGenerator.generate();
    gameState.collectibles = track.collectibles;
    gameState.obstacles = track.obstacles;
    
    inputs = {};
    
    logGameInfo(p, "Game started", { level: gameState.level });
    logPlayerInfo(p);
  }
  
  function resetGame(p) {
    gameState.gamePhase = PHASE_START;
    gameState.scrollOffset = 0;
    gameState.servingPhase = false;
    gameState.trackComplete = false;
    inputs = {};
    
    logGameInfo(p, "Game reset", {});
  }
  
  // Logging functions
  function logGameInfo(p, message, data) {
    p.logs.game_info.push({
      message: message,
      data: data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function logInput(p, inputType, data) {
    p.logs.inputs.push({
      input_type: inputType,
      data: data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function logPlayerInfo(p) {
    if (gameState.player) {
      p.logs.player_info.push({
        screen_x: gameState.player.x,
        screen_y: gameState.player.y,
        game_x: gameState.player.x,
        game_y: gameState.scrollOffset,
        framecount: p.frameCount
      });
    }
  }
});

// Expose game instance and state globally
window.gameInstance = gameInstance;
window.getGameState = function() {
  return gameState;
};

export { gameInstance, gameState };