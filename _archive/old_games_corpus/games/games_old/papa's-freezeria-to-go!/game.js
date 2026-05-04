import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, CONTROL_MODES, KEYS, STATION_TYPES, FLAVORS, MIXINS, TOPPINGS, gameState, getGameState, resetGameState } from './globals.js';
import { Player, Station, Customer, Sundae } from './entities.js';
import { game_testing_controller } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize the logs. Important: do not reset the logs at any point in the code!
  p.logs = {
    "game_info": [],
    "player_info": [],
    "inputs": []
  };

  // Game variables
  let keyStates = {};
  let lastKeyPressed = null;
  let keyDebounce = {
    LEFT: 0,
    RIGHT: 0,
    UP: 0,
    DOWN: 0
  };
  const DEBOUNCE_TIME = 10; // frames to wait before allowing next key press
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    p.textFont('Arial');
    
    resetGameState();
    initializeGame();
    
    // Log initial game state
    logGameInfo("Game initialized", {});
  };
  
  function initializeGame() {
    // Create player
    gameState.player = new Player(CANVAS_WIDTH / 2 - 20, CANVAS_HEIGHT - 100);
    
    // Create stations
    const stationSpacing = CANVAS_WIDTH / 5;
    gameState.stations = [
      new Station(STATION_TYPES.ORDER, stationSpacing * 0.5 - 60, CANVAS_HEIGHT - 250),
      new Station(STATION_TYPES.BUILD, stationSpacing * 1.5 - 60, CANVAS_HEIGHT - 250),
      new Station(STATION_TYPES.BLEND, stationSpacing * 2.5 - 60, CANVAS_HEIGHT - 250),
      new Station(STATION_TYPES.TOP, stationSpacing * 3.5 - 60, CANVAS_HEIGHT - 250),
      new Station(STATION_TYPES.SERVE, stationSpacing * 4.5 - 60, CANVAS_HEIGHT - 250)
    ];
    
    // Initialize current sundae
    gameState.currentSundae = new Sundae();
    
    // Move player to first station
    gameState.player.x = gameState.stations[0].x + gameState.stations[0].width / 2 - gameState.player.width / 2;
  }
  
  p.draw = function() {
    p.background(230, 245, 255);
    
    // Handle game state
    switch(gameState.gamePhase) {
      case GAME_PHASES.START:
        drawStartScreen();
        break;
      case GAME_PHASES.PLAYING:
        updateGame();
        drawGame();
        break;
      case GAME_PHASES.PAUSED:
        drawGame();
        drawPauseScreen();
        break;
      case GAME_PHASES.GAME_OVER_WIN:
        drawGame();
        drawGameOverScreen(true);
        break;
      case GAME_PHASES.GAME_OVER_LOSE:
        drawGame();
        drawGameOverScreen(false);
        break;
    }
    
    // Handle automated testing
    if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.controlMode !== CONTROL_MODES.HUMAN) {
      const action = game_testing_controller(gameState);
      if (action !== null) {
        handleAutomatedAction(action);
      }
    }
  };
  
  function updateGame() {
    // Update day timer
    gameState.dayTimer++;
    
    // Check for win/lose conditions
    if (gameState.servedCustomers >= gameState.requiredOrdersToWin) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      logGameInfo("Game over - Win", { servedCustomers: gameState.servedCustomers, tips: gameState.tips });
      return;
    }
    
    if (gameState.dayTimer >= gameState.dayLength) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      logGameInfo("Game over - Time ran out", { servedCustomers: gameState.servedCustomers, tips: gameState.tips });
      return;
    }
    
    // Handle customer generation
    if (gameState.customers.length === 0 && gameState.waitingCustomers.length === 0) {
      generateNewCustomer();
    } else if (gameState.customers.length < 3 && p.frameCount % 300 === 0) {
      generateNewCustomer();
    }
    
    // Update customers
    for (let i = 0; i < gameState.customers.length; i++) {
      const customer = gameState.customers[i];
      
      if (!customer.served) {
        // Decrease patience over time
        customer.updatePatience(0.05);
        
        // If patience reaches 0, customer leaves unhappy
        if (customer.patience <= 0) {
          gameState.customers.splice(i, 1);
          i--;
          logGameInfo("Customer left unhappy", { customerIndex: i });
        }
      }
    }
    
    // Handle action progress
    if (gameState.actionInProgress) {
      gameState.actionProgress += gameState.actionSpeed;
      
      if (gameState.actionProgress >= 100) {
        completeCurrentAction();
      }
    }
    
    // Handle player input
    handlePlayerInput();
  }
  
  function generateNewCustomer() {
    const customer = new Customer(p);
    gameState.customers.push(customer);
    gameState.waitingCustomers.push(customer);
    logGameInfo("New customer arrived", { customerType: customer.type.name });
  }
  
  function handlePlayerInput() {
    if (gameState.actionInProgress) return;
    
    // Update debounce timers
    for (let key in keyDebounce) {
      if (keyDebounce[key] > 0) {
        keyDebounce[key]--;
      }
    }
    
    // Movement between stations
    if (keyStates[KEYS.LEFT] && keyDebounce.LEFT === 0 && gameState.currentStation > 0) {
      moveToStation(gameState.currentStation - 1);
      keyDebounce.LEFT = DEBOUNCE_TIME;
    } else if (keyStates[KEYS.RIGHT] && keyDebounce.RIGHT === 0 && gameState.currentStation < gameState.stations.length - 1) {
      moveToStation(gameState.currentStation + 1);
      keyDebounce.RIGHT = DEBOUNCE_TIME;
    }
    
    // Station menu navigation
    if (gameState.stationMenuOpen) {
      const station = gameState.stations[gameState.currentStation];
      
      if (keyStates[KEYS.UP] && keyDebounce.UP === 0 && gameState.selectedOption > 0) {
        gameState.selectedOption--;
        keyDebounce.UP = DEBOUNCE_TIME;
      } else if (keyStates[KEYS.DOWN] && keyDebounce.DOWN === 0 && gameState.selectedOption < station.options.length - 1) {
        gameState.selectedOption++;
        keyDebounce.DOWN = DEBOUNCE_TIME;
      }
      
      // Select option
      if (keyStates[KEYS.SPACE]) {
        selectStationOption();
        keyStates[KEYS.SPACE] = false;
      }
      
      // Cancel menu
      if (keyStates[KEYS.Z]) {
        gameState.stationMenuOpen = false;
        keyStates[KEYS.Z] = false;
      }
    } else {
      // Open station menu
      if (keyStates[KEYS.SPACE]) {
        gameState.stationMenuOpen = true;
        gameState.selectedOption = 0;
        keyStates[KEYS.SPACE] = false;
      }
    }
    
    // Speed up actions
    gameState.actionSpeed = keyStates[KEYS.SHIFT] ? 2 : 1;
  }
  
  function moveToStation(stationIndex) {
    gameState.currentStation = stationIndex;
    gameState.player.moveToStation(stationIndex);
    gameState.player.x = gameState.stations[stationIndex].x + gameState.stations[stationIndex].width / 2 - gameState.player.width / 2;
    
    // Close menu when moving
    gameState.stationMenuOpen = false;
    
    logPlayerInfo();
  }
  
  function selectStationOption() {
    const station = gameState.stations[gameState.currentStation];
    const selectedOption = station.options[gameState.selectedOption];
    
    switch(station.type) {
      case STATION_TYPES.ORDER:
        if (selectedOption === "Take Order" && gameState.waitingCustomers.length > 0) {
          gameState.currentCustomer = gameState.waitingCustomers.shift();
          gameState.actionInProgress = true;
          gameState.actionProgress = 0;
          gameState.stationMenuOpen = false;
        }
        break;
        
      case STATION_TYPES.BUILD:
        // Check if flavor is selected
        const flavorNames = FLAVORS.map(f => f.name);
        if (flavorNames.includes(selectedOption) && !gameState.currentSundae.flavor) {
          gameState.currentSundae.flavor = FLAVORS.find(f => f.name === selectedOption);
          gameState.actionInProgress = true;
          gameState.actionProgress = 0;
          gameState.stationMenuOpen = false;
        }
        
        // Check if mix-in is selected
        const mixinNames = MIXINS.map(m => m.name);
        if (mixinNames.includes(selectedOption) && gameState.currentSundae.flavor && !gameState.currentSundae.mixins) {
          gameState.currentSundae.mixins = MIXINS.find(m => m.name === selectedOption);
          gameState.actionInProgress = true;
          gameState.actionProgress = 0;
          gameState.stationMenuOpen = false;
        }
        break;
        
      case STATION_TYPES.BLEND:
        if (gameState.currentSundae.flavor && gameState.currentSundae.mixins) {
          if (selectedOption === "Light Blend") {
            gameState.targetBlendLevel = 0;
          } else if (selectedOption === "Medium Blend") {
            gameState.targetBlendLevel = 1;
          } else if (selectedOption === "Heavy Blend") {
            gameState.targetBlendLevel = 2;
          }
          
          gameState.actionInProgress = true;
          gameState.actionProgress = 0;
          gameState.stationMenuOpen = false;
        }
        break;
        
      case STATION_TYPES.TOP:
        if (gameState.currentSundae.flavor && gameState.currentSundae.mixins && gameState.currentSundae.blendLevel !== undefined) {
          const topping = TOPPINGS.find(t => t.name === selectedOption);
          if (topping && gameState.currentSundae.addTopping(topping)) {
            gameState.actionInProgress = true;
            gameState.actionProgress = 0;
            gameState.stationMenuOpen = false;
          }
        }
        break;
        
      case STATION_TYPES.SERVE:
        if (gameState.currentCustomer && gameState.currentSundae.flavor && 
            gameState.currentSundae.mixins && gameState.currentSundae.toppings.length > 0) {
          gameState.actionInProgress = true;
          gameState.actionProgress = 0;
          gameState.stationMenuOpen = false;
        }
        break;
    }
  }
  
  function completeCurrentAction() {
    const station = gameState.stations[gameState.currentStation];
    
    switch(station.type) {
      case STATION_TYPES.ORDER:
        // Order taken, nothing else needed
        logGameInfo("Order taken", { customerType: gameState.currentCustomer.type.name });
        break;
        
      case STATION_TYPES.BUILD:
        // Ingredient added, nothing else needed
        logGameInfo("Build step completed", { 
          flavor: gameState.currentSundae.flavor?.name,
          mixins: gameState.currentSundae.mixins?.name
        });
        break;
        
      case STATION_TYPES.BLEND:
        // Set blend level
        gameState.currentSundae.blendLevel = gameState.targetBlendLevel;
        logGameInfo("Blend completed", { blendLevel: gameState.currentSundae.blendLevel });
        break;
        
      case STATION_TYPES.TOP:
        // Topping added, nothing else needed
        logGameInfo("Topping added", { 
          toppings: gameState.currentSundae.toppings.map(t => t.name).join(", ")
        });
        break;
        
      case STATION_TYPES.SERVE:
        // Serve customer
        if (gameState.currentCustomer) {
          // Calculate satisfaction
          const satisfaction = gameState.currentCustomer.calculateSatisfaction(gameState.currentSundae);
          gameState.orderAccuracy = satisfaction;
          
          // Calculate tip
          const tip = gameState.currentCustomer.calculateTip();
          gameState.tips += tip;
          
          // Mark customer as served
          gameState.currentCustomer.served = true;
          gameState.servedCustomers++;
          
          // Reset current customer and sundae
          gameState.currentCustomer = null;
          gameState.currentSundae.reset();
          
          logGameInfo("Customer served", { 
            satisfaction: satisfaction,
            tip: tip,
            totalTips: gameState.tips,
            servedCustomers: gameState.servedCustomers
          });
        }
        break;
    }
    
    gameState.actionInProgress = false;
    gameState.actionProgress = 0;
  }
  
  function drawGame() {
    // Draw floor
    p.fill(240, 230, 220);
    p.rect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);
    
    // Draw counter
    p.fill(180, 150, 120);
    p.rect(0, CANVAS_HEIGHT - 120, CANVAS_WIDTH, 20);
    
    // Draw stations
    for (let i = 0; i < gameState.stations.length; i++) {
      gameState.stations[i].draw(p, i === gameState.currentStation);
    }
    
    // Draw station menu if open
    if (gameState.stationMenuOpen) {
      gameState.stations[gameState.currentStation].drawMenu(p, gameState.selectedOption);
    }
    
    // Draw player
    gameState.player.draw(p);
    
    // Draw customers
    for (let customer of gameState.customers) {
      customer.draw(p);
    }
    
    // Draw current customer order
    if (gameState.currentCustomer) {
      gameState.currentCustomer.drawOrder(p, CANVAS_WIDTH / 2 - 80, 10);
    }
    
    // Draw current sundae
    if (gameState.currentSundae.cup) {
      gameState.currentSundae.draw(p, CANVAS_WIDTH / 2 + 80, 20);
    }
    
    // Draw action progress bar
    if (gameState.actionInProgress) {
      p.fill(255);
      p.rect(gameState.player.x - 10, gameState.player.y - 20, gameState.player.width + 20, 10, 5);
      
      p.fill(0, 200, 0);
      p.rect(gameState.player.x - 8, gameState.player.y - 18, (gameState.player.width + 16) * (gameState.actionProgress / 100), 6, 3);
    }
    
    // Draw game info panel
    p.push();
    p.fill(255, 255, 255, 200);
    p.stroke(100, 100, 100);
    p.strokeWeight(1);
    p.rect(CANVAS_WIDTH - 180, 10, 170, 80, 8);
    p.noStroke();
    
    p.fill(0);
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.textStyle(p.BOLD);
    p.text("GAME STATUS", CANVAS_WIDTH - 170, 20);
    
    p.textStyle(p.NORMAL);
    p.textSize(11);
    p.text("Tips: $" + gameState.tips, CANVAS_WIDTH - 170, 35);
    p.text("Served: " + gameState.servedCustomers + "/" + gameState.requiredOrdersToWin, CANVAS_WIDTH - 170, 50);
    
    // Draw time remaining
    const timeRemaining = Math.max(0, Math.floor((gameState.dayLength - gameState.dayTimer) / 60));
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    p.text("Time: " + minutes + ":" + (seconds < 10 ? "0" : "") + seconds, CANVAS_WIDTH - 170, 65);
    p.pop();
  }
  
  function drawStartScreen() {
    p.background(100, 180, 255);
    
    // Draw title
    p.fill(255);
    p.textSize(32);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("Papa's Freezeria To Go!", CANVAS_WIDTH / 2, 80);
    
    // Draw game description
    p.textSize(16);
    p.text("Run your own ice cream shop!", CANVAS_WIDTH / 2, 130);
    p.text("Take orders, build sundaes, and serve customers.", CANVAS_WIDTH / 2, 160);
    p.text("Satisfy " + gameState.requiredOrdersToWin + " customers to win!", CANVAS_WIDTH / 2, 190);
    
    // Draw controls
    p.textSize(14);
    p.text("Controls:", CANVAS_WIDTH / 2, 230);
    p.text("Arrow Keys: Move between stations and navigate menus", CANVAS_WIDTH / 2, 255);
    p.text("Space: Select/Confirm action", CANVAS_WIDTH / 2, 275);
    p.text("Z: Cancel action", CANVAS_WIDTH / 2, 295);
    p.text("Shift: Speed up actions", CANVAS_WIDTH / 2, 315);
    
    // Draw start prompt
    p.textSize(20);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  }
  
  function drawPauseScreen() {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textSize(20);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 20, 20);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
  
  function drawGameOverScreen(isWin) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textSize(32);
    p.textAlign(p.CENTER, p.CENTER);
    
    if (isWin) {
      p.text("YOU WIN!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    } else {
      p.text("TIME'S UP!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    }
    
    p.textSize(20);
    p.text("Customers Served: " + gameState.servedCustomers + "/" + gameState.requiredOrdersToWin, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.text("Total Tips: $" + gameState.tips, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    
    p.textSize(24);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  }
  
  p.keyPressed = function() {
    // Log key press
    logKeyInput("keyPressed", p.key, p.keyCode);
    
    // Update key states
    keyStates[p.keyCode] = true;
    lastKeyPressed = p.keyCode;
    
    // Handle game phase transitions
    switch(gameState.gamePhase) {
      case GAME_PHASES.START:
        if (p.keyCode === KEYS.ENTER) {
          gameState.gamePhase = GAME_PHASES.PLAYING;
          logGameInfo("Game started", {});
        }
        break;
        
      case GAME_PHASES.PLAYING:
        if (p.keyCode === KEYS.ESC) {
          gameState.gamePhase = GAME_PHASES.PAUSED;
          logGameInfo("Game paused", {});
        }
        break;
        
      case GAME_PHASES.PAUSED:
        if (p.keyCode === KEYS.ESC) {
          gameState.gamePhase = GAME_PHASES.PLAYING;
          logGameInfo("Game resumed", {});
        }
        break;
        
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        if (p.keyCode === KEYS.R) {
          resetGameState();
          initializeGame();
          gameState.gamePhase = GAME_PHASES.START;
          logGameInfo("Game restarted", {});
        }
        break;
    }
    
    return false; // Prevent default behavior
  };
  
  p.keyReleased = function() {
    // Log key release
    logKeyInput("keyReleased", p.key, p.keyCode);
    
    // Update key states
    keyStates[p.keyCode] = false;
    
    return false; // Prevent default behavior
  };
  
  function handleAutomatedAction(keyCode) {
    if (keyCode !== null && keyCode !== lastKeyPressed) {
      // Simulate key press
      keyStates[lastKeyPressed] = false;
      keyStates[keyCode] = true;
      lastKeyPressed = keyCode;
      
      // Log automated key press
      logKeyInput("automatedKeyPress", String.fromCharCode(keyCode), keyCode);
    }
  }
  
  function logGameInfo(status, data) {
    p.logs.game_info.push({
      "game_status": gameState.gamePhase,
      "data": { status, ...data },
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  }
  
  function logPlayerInfo() {
    p.logs.player_info.push({
      "screen_x": gameState.player.x,
      "screen_y": gameState.player.y,
      "game_x": gameState.currentStation,
      "game_y": 0,
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  }
  
  function logKeyInput(inputType, key, keyCode) {
    p.logs.inputs.push({
      "input_type": inputType,
      "data": { key, keyCode },
      "framecount": p.frameCount,
      "timestamp": Date.now()
    });
  }
});

// Expose the game instance globally
window.gameInstance = gameInstance;

// Expose the getGameState function globally
window.getGameState = getGameState;

// Function to set control mode
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  document.querySelectorAll('.control-button').forEach(button => {
    button.classList.remove('active');
  });
  
  if (mode === CONTROL_MODES.HUMAN) {
    document.getElementById('humanModeBtn').classList.add('active');
  } else {
    document.getElementById(mode.toLowerCase() + '_ModeBtn').classList.add('active');
  }
  
  // Log control mode change
  gameInstance.logs.game_info.push({
    "game_status": gameState.gamePhase,
    "data": { status: "Control mode changed", mode },
    "framecount": gameInstance.frameCount,
    "timestamp": Date.now()
  });
};