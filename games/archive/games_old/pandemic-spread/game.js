import { CANVAS_WIDTH, CANVAS_HEIGHT, FPS, PHASES, KEYS, COLORS, GAME_SETTINGS, gameState, getGameState, EVOLUTION_CATEGORIES } from './globals.js';
import { createCountries } from './countries.js';
import { createEvolutions, canPurchaseEvolution, calculateTransmissionFactors, calculateResistanceFactors, calculateVirusVisibility } from './evolutions.js';
import { game_testing_controller } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Initialize variables
  let countries = [];
  let totalPopulation = 0;
  let transmissionFactors = {};
  let resistanceFactors = {};
  let virusVisibility = 0;
  let keyStates = {};
  let lastKeyPressTime = 0;
  let selectedCountryIndex = -1;

  let lastRepeat = {}; // map: keyCode -> frameCount of last repeat
function canRepeat(code, delay = 10) {
  if (!lastRepeat[code] || p.frameCount - lastRepeat[code] > delay) {
    lastRepeat[code] = p.frameCount;
    return true;
  }
  return false;
}

  
  // Initialize the logs
  p.logs = {
    "game_info": [],
    "player_info": [],
    "inputs": []
  };
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(FPS);
    p.randomSeed(42);
    p.textFont('Arial');
    
    // Initialize game state
    initializeGame();
    
    // Log initial game state
    logGameInfo("Game initialized", {});
  };
  
  p.draw = function() {
    p.background(COLORS.BACKGROUND);
    
    // Handle automated testing if not in HUMAN mode
    if (gameState.gamePhase === PHASES.PLAYING && gameState.controlMode !== "HUMAN") {
      const actionKey = game_testing_controller(gameState);
      if (actionKey !== null) {
        handleAutomatedKeyPress(actionKey);
      }
    }
    
    // Update game based on current phase
    switch (gameState.gamePhase) {
      case PHASES.START:
        drawStartScreen();
        break;
      case PHASES.PLAYING:
        updateGame();
        drawGame();
        break;
      case PHASES.PAUSED:
        drawGame();
        drawPauseOverlay();
        break;
      case PHASES.GAME_OVER_WIN:
        drawGame();
        drawGameOverScreen(true);
        break;
      case PHASES.GAME_OVER_LOSE:
        drawGame();
        drawGameOverScreen(false);
        break;
    }
  };
  
  p.keyPressed = function() {
    // Log key press
    logKeyInput("keyPressed", { key: p.key, keyCode: p.keyCode });
    
    // Only process human input if in HUMAN mode and not an automated test
    if (gameState.controlMode === "HUMAN" || 
        [KEYS.ENTER, KEYS.ESC, KEYS.R].includes(p.keyCode)) {
      
        keyStates[p.keyCode] = true;
        // immediate edge-trigger so it moves on first press
        processKeyInputs();
          
      
      // Handle phase-specific key presses
      switch (gameState.gamePhase) {
        case PHASES.START:
          if (p.keyCode === KEYS.ENTER) {
            startGame();
          }
          break;
          
        case PHASES.PLAYING:
          if (p.keyCode === KEYS.ESC) {
            pauseGame();
          } else if (p.keyCode === KEYS.SPACE) {
            purchaseSelectedEvolution();
          } else if (p.keyCode === KEYS.Z) {
            gameState.evolutionMenu.showInfo = !gameState.evolutionMenu.showInfo;
          }
          break;
          
        case PHASES.PAUSED:
          if (p.keyCode === KEYS.ESC) {
            resumeGame();
          }
          break;
          
        case PHASES.GAME_OVER_WIN:
        case PHASES.GAME_OVER_LOSE:
          if (p.keyCode === KEYS.R) {
            resetGame();
          }
          break;
      }
    }
    
    // Prevent default behavior for game control keys
    if ([KEYS.UP, KEYS.DOWN, KEYS.LEFT, KEYS.RIGHT, KEYS.SPACE].includes(p.keyCode)) {
      return false;
    }
  };
  
  p.keyReleased = function() {
    // Log key release
    logKeyInput("keyReleased", { key: p.key, keyCode: p.keyCode });
    
    keyStates[p.keyCode] = false;
    
    return true;
  };
  
  // Function to handle automated key presses from the testing controller
  function handleAutomatedKeyPress(keyCode) {
    // Only process gameplay keys
    if ([KEYS.UP, KEYS.DOWN, KEYS.LEFT, KEYS.RIGHT, KEYS.SPACE, KEYS.Z, KEYS.SHIFT].includes(keyCode)) {
      keyStates[keyCode] = true;
      
      // For immediate actions like SPACE, trigger them directly
      if (keyCode === KEYS.SPACE) {
        purchaseSelectedEvolution();
      } else if (keyCode === KEYS.Z) {
        gameState.evolutionMenu.showInfo = !gameState.evolutionMenu.showInfo;
      }
      
      // Log the automated key press
      logKeyInput("automatedKeyPress", { keyCode: keyCode });
      
      // Release keys after a short delay (except for movement keys which can be held)
      if ([KEYS.SPACE, KEYS.Z, KEYS.SHIFT].includes(keyCode)) {
        setTimeout(() => {
          keyStates[keyCode] = false;
        }, 100);
      }
    }
  }
  
  // Initialize or reset the game
  function initializeGame() {
    // Reset game state
    gameState.gamePhase = PHASES.START;
    gameState.dnaPoints = GAME_SETTINGS.STARTING_DNA;
    gameState.cureProgress = GAME_SETTINGS.CURE_START_PERCENTAGE;
    gameState.framesSinceLastDnaGain = 0;
    
    // Create countries
    countries = createCountries();
    gameState.countries = countries;
    
    // Calculate total population
    totalPopulation = countries.reduce((sum, country) => sum + country.population, 0);
    gameState.totalPopulation = totalPopulation;
    gameState.infectedPopulation = 0;
    
    // Initialize evolutions
    gameState.evolutions = createEvolutions();
    
    // Reset evolution menu
    gameState.evolutionMenu.selectedCategory = 0;
    gameState.evolutionMenu.selectedUpgrade = 0;
    gameState.evolutionMenu.showInfo = false;
    
    // Reset factors
    transmissionFactors = calculateTransmissionFactors(gameState.evolutions);
    resistanceFactors = calculateResistanceFactors(gameState.evolutions);
    virusVisibility = calculateVirusVisibility(gameState.evolutions);
    
    // Reset selection
    selectedCountryIndex = -1;
  }
  
  // Start the game
  function startGame() {
    gameState.gamePhase = PHASES.PLAYING;
    logGameInfo("Game started", {});
    
    // Start with a random country infected
    const startCountryIndex = Math.floor(p.random(countries.length));
    countries[startCountryIndex].infectedPopulation = 1;
    countries[startCountryIndex].infected = true;
    gameState.infectedPopulation = 1;
    
    // Log the starting country
    logGameInfo("Initial infection", { country: countries[startCountryIndex].name });
  }
  
  // Pause the game
  function pauseGame() {
    gameState.gamePhase = PHASES.PAUSED;
    logGameInfo("Game paused", {});
  }
  
  // Resume the game
  function resumeGame() {
    gameState.gamePhase = PHASES.PLAYING;
    logGameInfo("Game resumed", {});
  }
  
  // Reset the game
  function resetGame() {
    initializeGame();
    logGameInfo("Game reset", {});
  }
  
  // Update game state
  function updateGame() {
    // Process key inputs
    processKeyInputs();
    
    // Update infection spread
    updateInfectionSpread();
    
    // Update cure progress
    updateCureProgress();
    
    // Check win/lose conditions
    checkGameEndConditions();
    
    // Generate DNA points over time
    generateDnaPoints();
  }
  
  // Process keyboard inputs for menu navigation
  function processKeyInputs() {
    // Menu navigation
    if (keyStates[KEYS.UP] && canRepeat(KEYS.UP)) {
      gameState.evolutionMenu.selectedUpgrade =
        Math.max(0, gameState.evolutionMenu.selectedUpgrade - 1);
    }
  
    if (keyStates[KEYS.DOWN] && canRepeat(KEYS.DOWN)) {
      const currentCategory =
        gameState.evolutionMenu.categories[gameState.evolutionMenu.selectedCategory];
      const maxItems = gameState.evolutions[currentCategory].length;
      gameState.evolutionMenu.selectedUpgrade =
        Math.min(maxItems - 1, gameState.evolutionMenu.selectedUpgrade + 1);
    }
  
    if (keyStates[KEYS.LEFT] && !keyStates[KEYS.SHIFT] && canRepeat(KEYS.LEFT)) {
      gameState.evolutionMenu.selectedCategory =
        Math.max(0, gameState.evolutionMenu.selectedCategory - 1);
      gameState.evolutionMenu.selectedUpgrade = 0;
    }
  
    if (keyStates[KEYS.RIGHT] && !keyStates[KEYS.SHIFT] && canRepeat(KEYS.RIGHT)) {
      gameState.evolutionMenu.selectedCategory = Math.min(
        gameState.evolutionMenu.categories.length - 1,
        gameState.evolutionMenu.selectedCategory + 1
      );
      gameState.evolutionMenu.selectedUpgrade = 0;
    }
  
    // Country selection with SHIFT key held
    if (keyStates[KEYS.SHIFT]) {
      if (keyStates[KEYS.LEFT] && canRepeat(-1 /* any id you want, e.g. 1001 */)) {
        selectedCountryIndex = (selectedCountryIndex - 1 + countries.length) % countries.length;
      } else if (keyStates[KEYS.RIGHT] && canRepeat(-2 /* e.g. 1002 */)) {
        selectedCountryIndex = (selectedCountryIndex + 1) % countries.length;
      }
    }
  }
  
  
  // Update infection spread across countries
  function updateInfectionSpread() {
    let newlyInfectedCountries = false;
    let totalInfected = 0;
    
    for (const country of countries) {
      // Update infection within the country
      if (country.infected) {
        country.update(transmissionFactors, resistanceFactors);
      }
      
      // Try to spread to neighbors
      if (country.spreadToNeighbors(countries, transmissionFactors)) {
        newlyInfectedCountries = true;
      }
      
      totalInfected += country.infectedPopulation;
    }
    
    // Update global infected count
    gameState.infectedPopulation = totalInfected;
    
    // Log if new countries were infected
    if (newlyInfectedCountries) {
      logGameInfo("New country infected", { 
        infected_countries: countries.filter(c => c.infected).length,
        total_countries: countries.length
      });
    }
  }
  
  // Update cure progress
  function updateCureProgress() {
    // Base cure speed
    let cureSpeed = GAME_SETTINGS.CURE_SPEED_BASE;
    
    // Increase cure speed based on virus visibility and percentage of world infected
    const infectionPercentage = gameState.infectedPopulation / totalPopulation;
    cureSpeed += virusVisibility * 0.01; // More visible = faster cure
    cureSpeed += infectionPercentage * 0.02; // More infected = faster cure
    
    // Reduce cure speed based on drug resistance
    cureSpeed -= resistanceFactors.drug * 0.005;
    
    // Ensure minimum cure speed
    cureSpeed = Math.max(0.001, cureSpeed);
    
    // Update cure progress
    gameState.cureProgress += cureSpeed;
    
    // Cap at 100%
    gameState.cureProgress = Math.min(100, gameState.cureProgress);
  }
  
  // Check win/lose conditions
  function checkGameEndConditions() {
    // Win condition: All countries infected and all population infected
    const allInfected = countries.every(country => country.infectionRate > 0.99);
    
    // Lose condition: Cure reaches 100%
    const cureDeveloped = gameState.cureProgress >= 100;
    
    if (allInfected) {
      gameState.gamePhase = PHASES.GAME_OVER_WIN;
      logGameInfo("Game over - Win", { 
        infected_percentage: (gameState.infectedPopulation / totalPopulation) * 100,
        cure_progress: gameState.cureProgress
      });
    } else if (cureDeveloped) {
      gameState.gamePhase = PHASES.GAME_OVER_LOSE;
      logGameInfo("Game over - Lose", { 
        infected_percentage: (gameState.infectedPopulation / totalPopulation) * 100,
        cure_progress: gameState.cureProgress
      });
    }
  }
  
  // Generate DNA points over time based on infection spread
  function generateDnaPoints() {
    gameState.framesSinceLastDnaGain++;
    
    // Generate DNA based on infection rate and time
    if (gameState.framesSinceLastDnaGain >= FPS) { // Every second
      const infectionPercentage = gameState.infectedPopulation / totalPopulation;
      const dnaGain = Math.floor(infectionPercentage * GAME_SETTINGS.DNA_GAIN_RATE * 10) / 10;
      
      if (dnaGain > 0) {
        gameState.dnaPoints += dnaGain;
        gameState.framesSinceLastDnaGain = 0;
        
        // Log DNA gain
        logGameInfo("DNA points gained", { 
          amount: dnaGain, 
          total: gameState.dnaPoints 
        });
      }
    }
  }
  
  // Purchase the currently selected evolution
  function purchaseSelectedEvolution() {
    const category = gameState.evolutionMenu.categories[gameState.evolutionMenu.selectedCategory];
    const evolution = gameState.evolutions[category][gameState.evolutionMenu.selectedUpgrade];
    
    if (canPurchaseEvolution(evolution, gameState.dnaPoints, gameState.evolutions)) {
      // Deduct DNA points
      gameState.dnaPoints -= evolution.cost;
      
      // Mark as purchased
      evolution.purchased = true;
      
      // Update factors
      transmissionFactors = calculateTransmissionFactors(gameState.evolutions);
      resistanceFactors = calculateResistanceFactors(gameState.evolutions);
      virusVisibility = calculateVirusVisibility(gameState.evolutions);
      
      // Log purchase
      logGameInfo("Evolution purchased", { 
        name: evolution.name, 
        category: category, 
        cost: evolution.cost,
        remaining_dna: gameState.dnaPoints
      });
    }
  }
  
  // Draw the start screen
  function drawStartScreen() {
    p.text("Click a country to view stats", CANVAS_WIDTH / 2, 280);

    p.textAlign(p.CENTER, p.CENTER);
    
    // Title
    p.fill(COLORS.TITLE);
    p.textSize(40);
    p.text("PANDEMIC SPREAD", CANVAS_WIDTH / 2, 80);
    
    // Description
    p.fill(COLORS.TEXT);
    p.textSize(16);
    p.text("Infect the world before a cure is developed", CANVAS_WIDTH / 2, 130);
    
    // Instructions
    p.textSize(14);
    p.text("Use arrow keys to navigate", CANVAS_WIDTH / 2, 180);
    p.text("SPACE to purchase evolutions", CANVAS_WIDTH / 2, 205);
    p.text("Z to toggle information view", CANVAS_WIDTH / 2, 230);
    p.text("ESC to pause the game", CANVAS_WIDTH / 2, 255);
    
    // Start prompt
    p.textSize(20);
    p.fill(COLORS.TITLE);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 320);
  }
  
  // Draw the main game
  function drawGame() {
    // Draw the world map with countries
    drawWorldMap();
    
    // Draw the evolution menu
    drawEvolutionMenu();
    
    // Draw the info panel if toggled
    if (gameState.evolutionMenu.showInfo) {
      drawInfoPanel();
    }
    
    // Draw stats
    drawGameStats();
  }
  
  // Draw the world map with countries
  function drawWorldMap() {
    // Draw connections between countries first
    for (const country of countries) {
      for (const neighborName of country.neighbors) {
        const neighbor = country.findNeighbor(neighborName);
        if (neighbor) {
          p.stroke(100, 100, 120, 80);
          p.strokeWeight(1);
          p.line(country.x, country.y, neighbor.x, neighbor.y);
        }
      }
    }
    
    // Draw countries
    for (let i = 0; i < countries.length; i++) {
      const country = countries[i];
      
      // Calculate color based on infection rate
      const infectionRate = country.infectedPopulation / country.population;
      const r = p.lerp(COLORS.HEALTHY[0], COLORS.INFECTED[0], infectionRate);
      const g = p.lerp(COLORS.HEALTHY[1], COLORS.INFECTED[1], infectionRate);
      const b = p.lerp(COLORS.HEALTHY[2], COLORS.INFECTED[2], infectionRate);
      
      // Draw country circle
      p.noStroke();
      p.fill(r, g, b);
      p.ellipse(country.x, country.y, country.size, country.size);
      
      // Highlight selected country
      if (i === selectedCountryIndex) {
        p.noFill();
        p.stroke(COLORS.COUNTRY_HIGHLIGHT);
        p.strokeWeight(2);
        p.ellipse(country.x, country.y, country.size + 5, country.size + 5);
      }
      
      // Country name
      p.fill(COLORS.TEXT);
      p.noStroke();
      p.textSize(10);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(country.name, country.x, country.y + country.size / 2 + 10);
    }
  }
  
  // Draw the evolution menu
  function drawEvolutionMenu() {
    // Menu background
    p.fill(COLORS.MENU_BG);
    p.noStroke();
    p.rect(CANVAS_WIDTH - 200, 0, 200, CANVAS_HEIGHT);
    
    // Category tabs
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    
    for (let i = 0; i < gameState.evolutionMenu.categories.length; i++) {
      const category = gameState.evolutionMenu.categories[i];
      const x = CANVAS_WIDTH - 200 + (i * 66);
      const y = 20;
      
      // Background
      if (i === gameState.evolutionMenu.selectedCategory) {
        p.fill(COLORS.MENU_SELECTED);
      } else {
        p.fill(COLORS.MENU_BG);
      }
      p.rect(x, y - 15, 66, 30);
      
      // Text
      p.fill(COLORS.TEXT);
      p.text(category.substring(0, 5), x + 33, y);
    }
    
    // List of evolutions for the selected category
    const category = gameState.evolutionMenu.categories[gameState.evolutionMenu.selectedCategory];
    const evolutions = gameState.evolutions[category];
    
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(12);
    
    for (let i = 0; i < evolutions.length; i++) {
      const evolution = evolutions[i];
      const x = CANVAS_WIDTH - 190;
      const y = 60 + (i * 30);
      
      // Highlight selected evolution
      if (i === gameState.evolutionMenu.selectedUpgrade) {
        p.fill(COLORS.MENU_SELECTED);
        p.rect(CANVAS_WIDTH - 200, y - 15, 200, 30);
      }
      
      // Evolution name and cost
      if (evolution.purchased) {
        p.fill(COLORS.DNA_POINTS); // Green for purchased
      } else if (canPurchaseEvolution(evolution, gameState.dnaPoints, gameState.evolutions)) {
        p.fill(COLORS.TEXT); // White for available
      } else {
        p.fill(150, 150, 150); // Gray for unavailable
      }
      
      p.text(evolution.name, x, y);
      
      if (!evolution.purchased) {
        p.text(`${evolution.cost} DNA`, x + 100, y);
      } else {
        p.text("Purchased", x + 100, y);
      }
    }

    p.mousePressed = function () {
      // Only allow clicks during gameplay
      if (gameState.gamePhase !== PHASES.PLAYING) return;
    
      // Ignore clicks inside the right sidebar
      if (p.mouseX > CANVAS_WIDTH - 200) return;
    
      // Find a country under the cursor
      let clickedIndex = -1;
      for (let i = 0; i < countries.length; i++) {
        const c = countries[i];
        const d = p.dist(p.mouseX, p.mouseY, c.x, c.y);
        if (d <= c.size / 2) {
          clickedIndex = i;
          break;
        }
      }
    
      if (clickedIndex !== -1) {
        selectedCountryIndex = clickedIndex;
        // Optional: auto-open info panel when a country is selected
        gameState.evolutionMenu.showInfo = true;
        logGameInfo("Country selected", { country: countries[clickedIndex].name });
      }
    };
    
    
    // Show description for selected evolution
    const selectedEvolution = evolutions[gameState.evolutionMenu.selectedUpgrade];
    if (selectedEvolution) {
      p.fill(COLORS.TEXT);
      p.textSize(11);
      p.textAlign(p.LEFT, p.TOP);
      p.text(selectedEvolution.description, CANVAS_WIDTH - 190, CANVAS_HEIGHT - 80, 180, 60);
    }
  }
  
  // Draw the info panel with detailed statistics
  function drawInfoPanel() {
    // Panel background
    p.fill(...COLORS.INFO_PANEL);
    p.rect(10, 50, 280, 300);
    
    p.fill(COLORS.TEXT);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.text("Global Statistics", 20, 60);
    
    p.textSize(12);
    // World infection stats
    const infectionPercentage = (gameState.infectedPopulation / totalPopulation) * 100;
    p.text(`World Infection: ${infectionPercentage.toFixed(2)}%`, 20, 85);
    p.text(`Cure Progress: ${gameState.cureProgress.toFixed(2)}%`, 20, 105);
    
    // Virus stats
    p.text(`Virus Visibility: ${(virusVisibility * 100).toFixed(2)}%`, 20, 130);
    
    // Transmission factors
    p.text("Transmission Factors:", 20, 155);
    let i = 0;
    for (const factor in transmissionFactors) {
      if (transmissionFactors[factor] > 0) {
        p.text(`- ${factor}: ${transmissionFactors[factor]}`, 30, 175 + (i * 20));
        i++;
      }
    }
    
    // Resistance factors
    p.text("Resistance Factors:", 20, 175 + (i * 20) + 10);
    let j = 0;
    for (const factor in resistanceFactors) {
      if (resistanceFactors[factor] > 0) {
        p.text(`- ${factor}: ${resistanceFactors[factor]}`, 30, 175 + (i * 20) + 30 + (j * 20));
        j++;
      }
    }
    
    // Selected country info
    if (selectedCountryIndex >= 0) {
      const country = countries[selectedCountryIndex];
      p.text(`Country: ${country.name}`, 20, 175 + (i * 20) + 30 + (j * 20) + 20);
      p.text(`Population: ${(country.population / 1000000).toFixed(1)}M`, 20, 175 + (i * 20) + 30 + (j * 20) + 40);
      p.text(`Infected: ${((country.infectedPopulation / country.population) * 100).toFixed(2)}%`, 20, 175 + (i * 20) + 30 + (j * 20) + 60);
      p.text(`Climate: ${country.climate}`, 20, 175 + (i * 20) + 30 + (j * 20) + 80);
    }
  }
  
  // Draw game statistics
  function drawGameStats() {
    // DNA points
    p.fill(COLORS.DNA_POINTS);
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`DNA: ${gameState.dnaPoints.toFixed(1)}`, 10, 10);
    
    // Infection percentage
    p.fill(COLORS.INFECTED);
    const infectionPercentage = (gameState.infectedPopulation / totalPopulation) * 100;
    p.text(`Infected: ${infectionPercentage.toFixed(2)}%`, 10, 30);
    
    // Cure progress
    p.fill(COLORS.CURE_PROGRESS);
    p.text(`Cure: ${gameState.cureProgress.toFixed(2)}%`, CANVAS_WIDTH - 380, 10);
    
    // Cure progress bar
    p.noFill();
    p.stroke(COLORS.CURE_PROGRESS);
    p.rect(CANVAS_WIDTH - 380, 30, 150, 10);
    p.noStroke();
    p.fill(COLORS.CURE_PROGRESS);
    p.rect(CANVAS_WIDTH - 380, 30, 150 * (gameState.cureProgress / 100), 10);
    
    // Controls reminder
    p.fill(COLORS.TEXT);
    p.textSize(10);
    p.text("Z: Toggle Info", 10, CANVAS_HEIGHT - 20);
    p.text("ESC: Pause", 10, CANVAS_HEIGHT - 10);
  }
  
  // Draw pause overlay
  function drawPauseOverlay() {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(COLORS.TEXT);
    p.textSize(24);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.textSize(16);
    p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  }
  
  // Draw game over screen
  function drawGameOverScreen(isWin) {
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(36);
    
    if (isWin) {
      p.fill(COLORS.DNA_POINTS);
      p.text("HUMANITY ERADICATED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      p.textSize(20);
      p.text("Your virus has successfully infected the world!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    } else {
      p.fill(COLORS.CURE_PROGRESS);
      p.text("CURE DEVELOPED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      p.textSize(20);
      p.text("Scientists have developed a cure for your virus.", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
    
    // Stats
    p.textSize(16);
    p.fill(COLORS.TEXT);
    const infectionPercentage = (gameState.infectedPopulation / totalPopulation) * 100;
    p.text(`World Infected: ${infectionPercentage.toFixed(2)}%`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    p.text(`Cure Progress: ${gameState.cureProgress.toFixed(2)}%`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 65);
    
    // Restart prompt
    p.textSize(20);
    p.fill(COLORS.TITLE);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
  }
  
  // Log game information
  function logGameInfo(event, data = {}) {
    p.logs.game_info.push({
      game_status: gameState.gamePhase,
      event: event,
      data: data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Log player information
  function logPlayerInfo() {
    // In this game, the "player" is the virus, so we log global infection stats
    p.logs.player_info.push({
      screen_x: 0, // Not applicable for this game
      screen_y: 0, // Not applicable for this game
      game_x: 0, // Not applicable for this game
      game_y: 0, // Not applicable for this game
      infected_percentage: (gameState.infectedPopulation / totalPopulation) * 100,
      cure_progress: gameState.cureProgress,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Log key inputs
  function logKeyInput(input_type, data = {}) {
    p.logs.inputs.push({
      input_type: input_type,
      data: data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
});

// Expose the game instance globally
window.gameInstance = gameInstance;