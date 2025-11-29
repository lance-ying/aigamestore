import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, CONTROL_MODES, STATIONS, KEYS, COLORS, SETTINGS, gameState } from './globals.js';
import { Customer } from './customer.js';
import { drawStations, handleStationInteraction } from './stations.js';
import { getGameState } from './globals.js';
import { game_testing_controller } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Setup function
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    p.textFont('Arial');
    
    // Initialize the logs
    p.logs = {
      "game_info": [],
      "player_info": [],
      "inputs": []
    };
    
    // Log initial game state
    p.logs.game_info.push({
      game_status: gameState.gamePhase,
      data: {},
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Setup UI control mode buttons
    setupControlModeButtons();
  };
  
  // Draw function
  p.draw = function() {
    p.background(COLORS.BACKGROUND);
    
    // Update game based on current phase
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        drawStartScreen();
        break;
      case GAME_PHASES.PLAYING:
        updateGame();
        drawGame();
        break;
      case GAME_PHASES.PAUSED:
        drawGame();
        drawPauseOverlay();
        break;
      case GAME_PHASES.GAME_OVER_WIN:
        drawGameOverScreen(true);
        break;
      case GAME_PHASES.GAME_OVER_LOSE:
        drawGameOverScreen(false);
        break;
    }
    
    // Process automated testing inputs if not in HUMAN mode
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode !== CONTROL_MODES.HUMAN) {
      const testAction = game_testing_controller(gameState);
      if (testAction !== null && !gameState.activeKeyPresses.has(testAction)) {
        handleKeyPress(testAction);
        gameState.activeKeyPresses.add(testAction);
      } else if (testAction === null && gameState.activeKeyPresses.size > 0) {
        // Clear active key presses if no action is returned
        gameState.activeKeyPresses.clear();
      }
    }
    
    // Log player position periodically (every 60 frames)
    if (gameState.gamePhase === GAME_PHASES.PLAYING && p.frameCount % 60 === 0) {
      logPlayerInfo();
    }
  };
  
  // Key pressed function
  p.keyPressed = function() {
    // Log key input
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Only process human inputs in HUMAN mode
    if (gameState.controlMode === CONTROL_MODES.HUMAN) {
      handleKeyPress(p.keyCode);
    }
    
    // Prevent default behavior for game keys
    return false;
  };
  
  // Key released function
  p.keyReleased = function() {
    // Log key input
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Only process human inputs in HUMAN mode
    if (gameState.controlMode === CONTROL_MODES.HUMAN) {
      handleKeyRelease(p.keyCode);
    }
    
    // Prevent default behavior for game keys
    return false;
  };
  
  // Handle key press
  function handleKeyPress(keyCode) {
    // Handle global controls regardless of game phase
    if (keyCode === KEYS.R && (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
                               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE)) {
      resetGame();
      changeGamePhase(GAME_PHASES.START);
      return;
    }
    
    // Phase-specific controls
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        if (keyCode === KEYS.ENTER) {
          changeGamePhase(GAME_PHASES.PLAYING);
        }
        break;
        
      case GAME_PHASES.PLAYING:
        if (keyCode === KEYS.ESC) {
          changeGamePhase(GAME_PHASES.PAUSED);
        } else if (keyCode === KEYS.LEFT) {
          // Move to previous station
          if (gameState.player.currentStation > 0) {
            gameState.player.currentStation--;
            gameState.player.selectedOption = 0;
            logPlayerInfo();
          }
        } else if (keyCode === KEYS.RIGHT) {
          // Move to next station
          if (gameState.player.currentStation < 3) {
            gameState.player.currentStation++;
            gameState.player.selectedOption = 0;
            logPlayerInfo();
          }
        } else {
          // Handle station-specific interactions
          if (handleStationInteraction(p, gameState, keyCode)) {
            logPlayerInfo();
          }
        }
        break;
        
      case GAME_PHASES.PAUSED:
        if (keyCode === KEYS.ESC) {
          changeGamePhase(GAME_PHASES.PLAYING);
        }
        break;
    }
  }
  
  // Handle key release
  function handleKeyRelease(keyCode) {
    if (gameState.controlMode !== CONTROL_MODES.HUMAN) return;
    
    // Remove from active key presses
    gameState.activeKeyPresses.delete(keyCode);
  }
  
  // Update game state
  function updateGame() {
    // Spawn customers
    updateCustomers();
    
    // Update customer patience
    for (const customer of gameState.customers.concat(gameState.waitingCustomers)) {
      customer.update();
      
      // Check if customer left due to impatience
      if (customer.left && !customer.satisfied) {
        // Remove customer from appropriate list
        const customerIndex = gameState.waitingCustomers.indexOf(customer);
        if (customerIndex !== -1) {
          gameState.waitingCustomers.splice(customerIndex, 1);
          
          // Reset current order if this was the customer we were serving
          if (customerIndex === 0) {
            gameState.currentOrder = null;
            gameState.currentSundae = null;
            
            // Reset station progress
            for (let i = 0; i < 4; i++) {
              gameState.stationProgress[i] = false;
            }
          }
        } else {
          const queueIndex = gameState.customers.indexOf(customer);
          if (queueIndex !== -1) {
            gameState.customers.splice(queueIndex, 1);
          }
        }
        
        // Check if we've lost the game (too many unhappy customers)
        if (gameState.customers.filter(c => c.left).length + 
            gameState.waitingCustomers.filter(c => c.left).length >= 3) {
          changeGamePhase(GAME_PHASES.GAME_OVER_LOSE);
        }
      }
    }
  }
  
  // Update customer spawning
  function updateCustomers() {
    gameState.customerSpawnTimer++;
    
    // Spawn new customers based on timer and max limit
    if (gameState.customerSpawnTimer >= SETTINGS.CUSTOMER_SPAWN_RATE && 
        gameState.customers.length < SETTINGS.MAX_CUSTOMERS) {
      
      // Create a new customer with increasing complexity based on day phase
      const newCustomer = new Customer(p, gameState.customers.length + gameState.waitingCustomers.length, gameState.dayPhase);
      gameState.customers.push(newCustomer);
      
      // Reset timer
      gameState.customerSpawnTimer = 0;
      
      // Advance day phase periodically
      if ((gameState.customers.length + gameState.waitingCustomers.length) % 5 === 0) {
        gameState.dayPhase = Math.min(2, gameState.dayPhase + 1);
      }
    }
  }
  
  // Draw game elements
  function drawGame() {
    // Draw stations
    drawStations(p, gameState);
    
    // Draw customers in queue
    drawCustomerQueue();
    
    // Draw UI elements
    drawUI();
  }
  
  // Draw customer queue
  function drawCustomerQueue() {
    // Draw customers waiting in line
    for (let i = 0; i < Math.min(gameState.customers.length, 4); i++) {
      const customer = gameState.customers[i];
      const x = CANVAS_WIDTH - 50 - i * 30;
      const y = CANVAS_HEIGHT - 50;
      
      customer.draw(p, x, y);
    }
    
    // Draw additional customers indicator if more than 4
    if (gameState.customers.length > 4) {
      p.fill(COLORS.TEXT);
      p.textSize(12);
      p.textAlign(p.RIGHT);
      p.text(`+${gameState.customers.length - 4} more`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
    }
  }
  
  // Draw UI elements
  function drawUI() {
    // Draw day phase
    p.fill(COLORS.TEXT);
    p.textSize(14);
    p.textAlign(p.LEFT);
    
    const dayPhases = ["Morning", "Noon", "Evening"];
    p.text(`Time: ${dayPhases[gameState.dayPhase]}`, 10, 20);
    
    // Draw score
    p.textAlign(p.RIGHT);
    p.text(`Tips: $${gameState.tips}`, CANVAS_WIDTH - 10, 20);
    
    // Draw progress
    p.textAlign(p.CENTER);
    p.text(`Served: ${gameState.servedCustomers}/${SETTINGS.DAILY_GOAL}`, CANVAS_WIDTH / 2, 20);
  }
  
  // Draw start screen
  function drawStartScreen() {
    p.fill(COLORS.TEXT);
    p.textAlign(p.CENTER);
    
    // Title
    p.textSize(32);
    p.text("Papa's Freezeria", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    
    // Instructions
    p.textSize(16);
    p.text("Serve ice cream sundaes to customers!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    p.text("Complete orders accurately to earn tips.", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    p.text(`Serve ${SETTINGS.DAILY_GOAL} customers to complete the day.`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    
    // Controls
    p.textSize(14);
    p.text("← → : Move between stations", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
    p.text("↑ ↓ : Select options", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
    p.text("SPACE : Confirm selection", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
    p.text("Z : Pour ingredients", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 140);
    
    // Start prompt
    p.textSize(20);
    p.fill(COLORS.HIGHLIGHT);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  }
  
  // Draw pause overlay
  function drawPauseOverlay() {
    // Semi-transparent overlay
    p.fill(0, 0, 0, 100);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Pause text
    p.fill(255);
    p.textSize(16);
    p.textAlign(p.RIGHT);
    p.text("PAUSED", CANVAS_WIDTH - 20, 30);
    
    // Instructions
    p.textAlign(p.CENTER);
    p.textSize(20);
    p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
  
  // Draw game over screen
  function drawGameOverScreen(isWin) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER);
    
    // Title
    p.textSize(32);
    if (isWin) {
      p.text("Day Complete!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    } else {
      p.text("Day Failed!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    }
    
    // Stats
    p.textSize(20);
    p.text(`Customers Served: ${gameState.servedCustomers}/${SETTINGS.DAILY_GOAL}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    p.text(`Tips Earned: $${gameState.tips}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    
    // Message
    p.textSize(16);
    if (isWin) {
      p.text("Great job! You've successfully completed the day.", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    } else {
      p.text("Too many unhappy customers left. Try again!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    }
    
    // Restart prompt
    p.textSize(20);
    p.fill(COLORS.HIGHLIGHT);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  }
  
  // Change game phase
  function changeGamePhase(newPhase) {
    const oldPhase = gameState.gamePhase;
    gameState.gamePhase = newPhase;
    
    // Log game phase change
    p.logs.game_info.push({
      game_status: newPhase,
      data: { previous_phase: oldPhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Reset game state
  function resetGame() {
    // Reset player
    gameState.player = {
      currentStation: STATIONS.ORDER,
      selectedOption: 0
    };
    
    // Reset game data
    gameState.currentOrder = null;
    gameState.currentSundae = null;
    gameState.customers = [];
    gameState.waitingCustomers = [];
    gameState.servedCustomers = 0;
    gameState.dayPhase = 0;
    gameState.tips = 0;
    gameState.customerSpawnTimer = 0;
    gameState.activeKeyPresses = new Set();
    
    // Reset station progress
    for (let i = 0; i < 4; i++) {
      gameState.stationProgress[i] = false;
    }
  }
  
  // Log player information
  function logPlayerInfo() {
    p.logs.player_info.push({
      screen_x: gameState.player.currentStation * STATION_WIDTH + STATION_WIDTH / 2,
      screen_y: CANVAS_HEIGHT / 2,
      game_x: gameState.player.currentStation,
      game_y: gameState.player.selectedOption,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Setup control mode buttons
  function setupControlModeButtons() {
    // Set control mode function
    window.setControlMode = function(mode) {
      gameState.controlMode = mode;
      
      // Update button states
      document.querySelectorAll('.control-button').forEach(btn => {
        btn.classList.remove('active');
      });
      
      const activeButton = document.getElementById(`${mode.toLowerCase()}ModeBtn`) || 
                           document.getElementById(`${mode.toLowerCase()}_ModeBtn`);
      
      if (activeButton) {
        activeButton.classList.add('active');
      }
      
      // Log control mode change
      p.logs.game_info.push({
        game_status: gameState.gamePhase,
        data: { control_mode: mode },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    };
  }
});

// Expose the game instance globally
window.gameInstance = gameInstance;