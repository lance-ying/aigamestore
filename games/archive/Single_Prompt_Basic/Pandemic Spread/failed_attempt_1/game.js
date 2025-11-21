import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, KEY_CODES, getGameState } from './globals.js';
import { Player } from './player.js';
import { createCountries } from './country.js';
import { game_testing_controller } from './automated_testing_controller.js';

const p5 = window.p5;
let gameInstance = new p5(p => {
  // Initialize variables
  let startCountry;
  let hoveredCountry = null;
  let lastKeyPressTime = 0;
  let keyRepeatDelay = 200; // ms
  
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
    p.background(20, 20, 30);
    
    switch (gameState.gamePhase) {
      case "START":
        drawStartScreen();
        break;
      case "PLAYING":
        updateGame();
        if (gameState.currentView === "MAP") {
          drawWorldMap();
        } else {
          drawUpgradeMenu();
        }
        drawGameUI();
        break;
      case "PAUSED":
        if (gameState.currentView === "MAP") {
          drawWorldMap();
        } else {
          drawUpgradeMenu();
        }
        drawGameUI();
        drawPauseOverlay();
        break;
      case "GAME_OVER_WIN":
        drawGameOverScreen(true);
        break;
      case "GAME_OVER_LOSE":
        drawGameOverScreen(false);
        break;
    }
    
    // Handle automated testing
    if (gameState.gamePhase === "PLAYING" && gameState.controlMode !== "HUMAN") {
      handleAutomatedTesting();
    }
  };
  
  function resetGame() {
    // Reset game state
    gameState.dnaPoints = 0;
    gameState.infectionRate = 0;
    gameState.cureProgress = 0;
    gameState.currentView = "MAP";
    gameState.selectedUpgradeCategory = 0;
    gameState.selectedUpgrade = 0;
    gameState.gameSpeed = 1;
    gameState.timePassed = 0;
    gameState.totalInfected = 0;
    
    // Create player
    gameState.player = new Player();
    
    // Create countries
    gameState.countries = createCountries();
    
    // Calculate total population
    gameState.totalPopulation = 0;
    for (const country of gameState.countries) {
      gameState.totalPopulation += country.population;
    }
    
    // Select random starting country
    startCountry = gameState.countries[Math.floor(p.random(gameState.countries.length))];
    startCountry.infected = 1;
    startCountry.isInfected = true;
    gameState.totalInfected = 1;
    gameState.player.infectedCountries = 1;
    
    // Reset upgrade categories
    for (const category of gameState.upgradeCategories) {
      for (const upgrade of category.upgrades) {
        upgrade.level = 0;
        upgrade.cost = Math.floor(upgrade.cost / 1.5); // Reset cost to original
      }
    }
  }
  
  function updateGame() {
    // Update time passed
    gameState.timePassed += 0.01 * gameState.gameSpeed;
    
    // Update player
    gameState.player.update(p);
    
    // Update countries
    for (const country of gameState.countries) {
      country.update(p);
    }
    
    // Check for hovered country
    hoveredCountry = null;
    if (gameState.currentView === "MAP") {
      for (const country of gameState.countries) {
        const d = p.dist(p.mouseX, p.mouseY, country.x, country.y);
        if (d < country.radius) {
          hoveredCountry = country;
          country.highlighted = true;
        } else {
          country.highlighted = false;
        }
      }
    }
  }
  
  function drawStartScreen() {
    p.background(20, 20, 30);
    
    // Title
    p.fill(200, 0, 0);
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("PATHOGEN PANDEMIC", CANVAS_WIDTH / 2, 80);
    
    // Description
    p.fill(200);
    p.textSize(16);
    p.text("Evolve your pathogen and infect the world", CANVAS_WIDTH / 2, 130);
    p.text("before humanity develops a cure!", CANVAS_WIDTH / 2, 155);
    
    // Instructions
    p.textSize(14);
    p.text("Use DNA points to purchase upgrades and spread your infection", CANVAS_WIDTH / 2, 195);
    p.text("Infect all countries before the cure is complete", CANVAS_WIDTH / 2, 220);
    
    // Controls
    p.fill(150);
    p.textSize(12);
    p.text("Arrow Keys: Navigate upgrades", CANVAS_WIDTH / 2, 255);
    p.text("SPACE: Purchase upgrade", CANVAS_WIDTH / 2, 275);
    p.text("Z: Toggle between map and upgrades", CANVAS_WIDTH / 2, 295);
    p.text("SHIFT: Accelerate game time", CANVAS_WIDTH / 2, 315);
    
    // Start prompt
    p.fill(255);
    p.textSize(18);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  }
  
  function drawWorldMap() {
    // Draw world map background
    p.fill(40, 50, 60);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw countries
    for (const country of gameState.countries) {
      country.draw(p);
    }
    
    // Draw country info if hovered
    if (hoveredCountry) {
      p.fill(50, 50, 60, 200);
      p.rect(CANVAS_WIDTH - 200, 50, 190, 100);
      hoveredCountry.displayInfo(p, CANVAS_WIDTH - 190, 70);
    }
  }
  
  function drawUpgradeMenu() {
    // Draw upgrade menu background
    p.fill(30, 35, 45);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw category tabs
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);
    
    for (let i = 0; i < gameState.upgradeCategories.length; i++) {
      const category = gameState.upgradeCategories[i];
      const x = 100 + i * 200;
      
      // Draw tab
      if (i === gameState.selectedUpgradeCategory) {
        p.fill(150, 50, 50);
      } else {
        p.fill(80, 80, 100);
      }
      p.rect(x - 80, 20, 160, 30);
      
      // Draw tab text
      p.fill(255);
      p.text(category.name, x, 35);
    }
    
    // Draw upgrades for selected category
    const selectedCategory = gameState.upgradeCategories[gameState.selectedUpgradeCategory];
    p.textAlign(p.LEFT, p.CENTER);
    
    for (let i = 0; i < selectedCategory.upgrades.length; i++) {
      const upgrade = selectedCategory.upgrades[i];
      const y = 80 + i * 70;
      
      // Draw upgrade box
      if (i === gameState.selectedUpgrade) {
        p.fill(100, 50, 50);
        p.stroke(200, 200, 0);
        p.strokeWeight(2);
      } else {
        p.fill(60, 60, 80);
        p.noStroke();
      }
      p.rect(50, y, CANVAS_WIDTH - 100, 60);
      
      // Draw upgrade info
      p.noStroke();
      p.fill(255);
      p.textSize(16);
      p.text(upgrade.name, 70, y + 20);
      
      // Draw level indicators
      for (let j = 0; j < upgrade.maxLevel; j++) {
        if (j < upgrade.level) {
          p.fill(200, 50, 50);
        } else {
          p.fill(100);
        }
        p.rect(300 + j * 30, y + 15, 20, 20);
      }
      
      // Draw cost
      if (upgrade.level < upgrade.maxLevel) {
        p.fill(gameState.dnaPoints >= upgrade.cost ? 150 : 100);
        p.text(`Cost: ${Math.floor(upgrade.cost)} DNA`, 70, y + 45);
      } else {
        p.fill(200, 200, 0);
        p.text("MAXED OUT", 70, y + 45);
      }
      
      // Draw description
      p.fill(200);
      p.textSize(12);
      p.text(upgrade.description, 200, y + 45);
    }
  }
  
  function drawGameUI() {
    // Draw top bar
    p.fill(40, 40, 50, 200);
    p.rect(0, 0, CANVAS_WIDTH, 30);
    
    // Draw DNA points
    p.fill(0, 200, 200);
    p.textSize(16);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(`DNA: ${Math.floor(gameState.dnaPoints)}`, 10, 15);
    
    // Draw infection progress
    p.fill(200, 50, 50);
    p.text(`Infected: ${Math.floor(gameState.infectionRate * 100)}%`, 120, 15);
    
    // Draw cure progress
    p.fill(50, 200, 50);
    p.text(`Cure: ${Math.floor(gameState.cureProgress)}%`, 250, 15);
    
    // Draw time passed
    p.fill(200);
    p.text(`Time: ${Math.floor(gameState.timePassed)} days`, 370, 15);
    
    // Draw speed indicator
    p.fill(gameState.gameSpeed > 1 ? 255 : 150);
    p.text(`Speed: ${gameState.gameSpeed}x`, 500, 15);
    
    // Draw view toggle hint
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(150);
    p.textSize(12);
    p.text(`Press Z to ${gameState.currentView === "MAP" ? "view upgrades" : "return to map"}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 15);
    
    // Draw progress bars
    // Infection progress bar
    p.fill(50);
    p.rect(10, 40, 580, 10);
    p.fill(200, 0, 0);
    p.rect(10, 40, 580 * gameState.infectionRate, 10);
    
    // Cure progress bar
    p.fill(50);
    p.rect(10, 55, 580, 10);
    p.fill(0, 200, 0);
    p.rect(10, 55, 580 * (gameState.cureProgress / 100), 10);
  }
  
  function drawPauseOverlay() {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textSize(24);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 20, 20);
    
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
  
  function drawGameOverScreen(isWin) {
    p.background(isWin ? 20 : 40, isWin ? 40 : 20, 30);
    
    // Title
    p.fill(isWin ? 0 : 200, isWin ? 200 : 0, 0);
    p.textSize(40);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(isWin ? "PANDEMIC SUCCESSFUL!" : "PANDEMIC FAILED", CANVAS_WIDTH / 2, 80);
    
    // Results
    p.fill(200);
    p.textSize(18);
    p.text(`Time elapsed: ${Math.floor(gameState.timePassed)} days`, CANVAS_WIDTH / 2, 140);
    p.text(`Total infected: ${Math.floor(gameState.infectionRate * 100)}% of world population`, CANVAS_WIDTH / 2, 170);
    p.text(`Cure progress: ${Math.floor(gameState.cureProgress)}%`, CANVAS_WIDTH / 2, 200);
    
    // Reason for win/loss
    p.textSize(20);
    if (isWin) {
      p.fill(0, 255, 0);
      p.text("Your pathogen infected the entire world!", CANVAS_WIDTH / 2, 240);
    } else {
      p.fill(255, 0, 0);
      if (gameState.cureProgress >= 100) {
        p.text("Humanity developed a cure before full infection.", CANVAS_WIDTH / 2, 240);
      } else {
        p.text("All infected countries closed their borders!", CANVAS_WIDTH / 2, 240);
      }
    }
    
    // Restart prompt
    p.fill(255);
    p.textSize(18);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
  }
  
  function handleAutomatedTesting() {
    const actionKeyCode = game_testing_controller(getGameState());
    if (actionKeyCode !== null) {
      simulateKeyPress(actionKeyCode);
    }
  }
  
  function simulateKeyPress(keyCode) {
    // Only simulate key press if enough time has passed since last key press
    const currentTime = Date.now();
    if (currentTime - lastKeyPressTime > 100) {
      handleKeyAction(keyCode);
      lastKeyPressTime = currentTime;
    }
  }
  
  function handleKeyAction(keyCode) {
    switch (keyCode) {
      case KEY_CODES.UP:
        if (gameState.currentView === "UPGRADES") {
          if (gameState.selectedUpgrade > 0) {
            gameState.selectedUpgrade--;
          }
        }
        break;
      case KEY_CODES.DOWN:
        if (gameState.currentView === "UPGRADES") {
          const selectedCategory = gameState.upgradeCategories[gameState.selectedUpgradeCategory];
          if (gameState.selectedUpgrade < selectedCategory.upgrades.length - 1) {
            gameState.selectedUpgrade++;
          }
        }
        break;
      case KEY_CODES.LEFT:
        if (gameState.currentView === "UPGRADES") {
          if (gameState.selectedUpgradeCategory > 0) {
            gameState.selectedUpgradeCategory--;
            gameState.selectedUpgrade = 0;
          }
        }
        break;
      case KEY_CODES.RIGHT:
        if (gameState.currentView === "UPGRADES") {
          if (gameState.selectedUpgradeCategory < gameState.upgradeCategories.length - 1) {
            gameState.selectedUpgradeCategory++;
            gameState.selectedUpgrade = 0;
          }
        }
        break;
      case KEY_CODES.SPACE:
        if (gameState.currentView === "UPGRADES") {
          const purchased = gameState.player.purchaseUpgrade(
            gameState.selectedUpgradeCategory,
            gameState.selectedUpgrade
          );
          
          if (purchased) {
            // Log purchase
            p.logs.player_info.push({
              screen_x: 0,
              screen_y: 0,
              game_x: gameState.dnaPoints,
              game_y: gameState.selectedUpgradeCategory * 10 + gameState.selectedUpgrade,
              framecount: p.frameCount,
              timestamp: Date.now()
            });
          }
        }
        break;
      case KEY_CODES.Z:
        gameState.currentView = gameState.currentView === "MAP" ? "UPGRADES" : "MAP";
        break;
      case KEY_CODES.SHIFT:
        gameState.gameSpeed = gameState.gameSpeed === 1 ? 2 : 1;
        break;
    }
  }
  
  p.keyPressed = function() {
    // Log key press
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Handle key press based on game phase
    switch (gameState.gamePhase) {
      case "START":
        if (p.keyCode === KEY_CODES.ENTER) {
          gameState.gamePhase = "PLAYING";
          p.logs.game_info.push({
            game_status: gameState.gamePhase,
            data: {},
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
        break;
      case "PLAYING":
        if (p.keyCode === KEY_CODES.ESC) {
          gameState.gamePhase = "PAUSED";
          p.logs.game_info.push({
            game_status: gameState.gamePhase,
            data: {},
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        } else if (gameState.controlMode === "HUMAN") {
          handleKeyAction(p.keyCode);
        }
        break;
      case "PAUSED":
        if (p.keyCode === KEY_CODES.ESC) {
          gameState.gamePhase = "PLAYING";
          p.logs.game_info.push({
            game_status: gameState.gamePhase,
            data: {},
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        if (p.keyCode === KEY_CODES.R) {
          resetGame();
          gameState.gamePhase = "START";
          p.logs.game_info.push({
            game_status: gameState.gamePhase,
            data: {},
            framecount: p.frameCount,
            timestamp: Date.now()
          });
        }
        break;
    }
    
    return false; // Prevent default behavior
  };
  
  p.keyReleased = function() {
    // Log key release
    p.logs.inputs.push({
      input_type: "keyReleased",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    return false; // Prevent default behavior
  };
});

// Expose the game instance globally
window.gameInstance = gameInstance;

// Set control mode function
window.setControlMode = function(mode) {
  if (gameState.controlMode !== mode) {
    gameState.controlMode = mode;
    
    // Update button states
    document.querySelectorAll('.control-button').forEach(btn => {
      btn.classList.remove('active');
    });
    
    const activeButton = document.getElementById(mode === "HUMAN" ? "humanModeBtn" : `test_${mode.split('_')[1]}_ModeBtn`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
    
    // Log control mode change
    if (gameInstance && gameInstance.logs) {
      gameInstance.logs.game_info.push({
        game_status: gameState.gamePhase,
        data: { controlMode: mode },
        framecount: gameInstance.frameCount,
        timestamp: Date.now()
      });
    }
  }
};