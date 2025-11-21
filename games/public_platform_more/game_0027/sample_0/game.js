// game.js - Main game file
import { gameState, getGameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { initializePlants } from './plant_manager.js';
import { initializeCustomers } from './customer_manager.js';
import { drawUI } from './ui_manager.js';
import { handleKeyPressed, updateNavigationCooldown } from './input_handler.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  // Game variables
  let startTime;
  
  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(60);
    p.randomSeed(42);
    
    // Initialize logs
    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };
    
    // Log game start
    p.logs.game_info.push({
      data: "Game initialized",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    
    // Initialize game state (required by template)
    gameState.player = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }; // Dummy player for logs
    gameState.entities = [];
    
    startTime = Date.now();
  };
  
  p.draw = function() {
    p.background(20, 25, 30);
    
    // Update navigation cooldown
    updateNavigationCooldown();
    
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN" && gameState.gamePhase === "PLAYING") {
      const action = get_automated_testing_action(gameState);
      if (action) {
        simulateKeyPress(p, action.keyCode);
      }
    }
    
    // Render based on game phase
    switch (gameState.gamePhase) {
      case "START":
        drawStartScreen(p);
        break;
      case "PLAYING":
        drawUI(p);
        break;
      case "PAUSED":
        drawUI(p);
        drawPausedOverlay(p);
        break;
      case "GAME_OVER_WIN":
      case "GAME_OVER_LOSE":
        drawGameOverScreen(p);
        break;
    }
    
    // Log player info periodically
    if (p.frameCount % 60 === 0 && gameState.gamePhase === "PLAYING") {
      p.logs.player_info.push({
        screen_x: gameState.cursorX,
        screen_y: gameState.cursorY,
        game_x: gameState.cursorX,
        game_y: gameState.cursorY,
        framecount: p.frameCount
      });
    }
  };
  
  p.keyPressed = function() {
    handleKeyPressed(p);
    
    // Game phase transitions
    if (p.keyCode === 13 && gameState.gamePhase === "START") { // ENTER
      startGame(p);
    } else if (p.keyCode === 27 && gameState.gamePhase === "PLAYING") { // ESC
      pauseGame(p);
    } else if (p.keyCode === 27 && gameState.gamePhase === "PAUSED") { // ESC
      unpauseGame(p);
    } else if (p.keyCode === 82) { // R
      restartGame(p);
    }
  };
  
  function startGame(p) {
    gameState.gamePhase = "PLAYING";
    gameState.currentDay = 1;
    gameState.reputation = 100;
    gameState.score = 0;
    gameState.currentView = "ENCYCLOPEDIA";
    gameState.selectedPlantId = null;
    gameState.encyclopediaPage = 0;
    gameState.customersServedToday = 0;
    
    initializePlants(p);
    initializeCustomers(p);
    
    p.logs.game_info.push({
      data: "Game started",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function pauseGame(p) {
    gameState.gamePhase = "PAUSED";
    p.logs.game_info.push({
      data: "Game paused",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function unpauseGame(p) {
    gameState.gamePhase = "PLAYING";
    p.logs.game_info.push({
      data: "Game unpaused",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function restartGame(p) {
    gameState.gamePhase = "START";
    gameState.currentDay = 1;
    gameState.reputation = 100;
    gameState.score = 0;
    gameState.currentView = "ENCYCLOPEDIA";
    gameState.selectedPlantId = null;
    gameState.customersServedToday = 0;
    gameState.currentCustomer = null;
    gameState.customerQueue = [];
    
    p.logs.game_info.push({
      data: "Game restarted",
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  function simulateKeyPress(p, keyCode) {
    p.keyCode = keyCode;
    p.key = String.fromCharCode(keyCode);
    handleKeyPressed(p);
  }
  
  function drawStartScreen(p) {
    p.background(15, 20, 25);
    
    // Title
    p.fill(220, 180, 140);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("BOTANICAL MYSTERIES", CANVAS_WIDTH / 2, 80);
    
    // Subtitle
    p.fill(180, 160, 140);
    p.textSize(14);
    p.text("An Occult Plant Shop", CANVAS_WIDTH / 2, 115);
    
    // Description
    p.fill(200, 190, 180);
    p.textSize(12);
    p.textAlign(p.CENTER, p.TOP);
    const desc = [
      "Run a mysterious plant shop and fulfill customer orders.",
      "Study your encyclopedia to identify plants from cryptic clues.",
      "Match the right plant to each customer's needs.",
      "Maintain your reputation to stay in business!"
    ];
    let y = 150;
    for (let line of desc) {
      p.text(line, CANVAS_WIDTH / 2, y);
      y += 18;
    }
    
    // Controls
    p.fill(160, 200, 160);
    p.textSize(11);
    y += 20;
    const controls = [
      "← → : Navigate pages and inventory",
      "SHIFT : Switch between Encyclopedia, Inventory, and Customer",
      "SPACE : Select plant / Give to customer",
      "Z : Cancel selection",
      "ESC : Pause game",
      "R : Restart to menu"
    ];
    for (let line of controls) {
      p.text(line, CANVAS_WIDTH / 2, y);
      y += 16;
    }
    
    // Start prompt
    p.fill(255, 220, 150);
    p.textSize(16);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  }
  
  function drawPausedOverlay(p) {
    // Semi-transparent overlay
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Paused indicator
    p.fill(255, 220, 150);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
  
  function drawGameOverScreen(p) {
    p.background(15, 20, 25);
    
    const won = gameState.gamePhase === "GAME_OVER_WIN";
    
    // Title
    p.fill(won ? [150, 255, 150] : [255, 150, 150]);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(36);
    p.text(won ? "SUCCESS!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
    
    // Message
    p.fill(200, 190, 180);
    p.textSize(14);
    if (won) {
      p.text("You've mastered the art of botanical identification!", CANVAS_WIDTH / 2, 150);
      p.text("Your shop thrives with satisfied customers.", CANVAS_WIDTH / 2, 170);
    } else {
      p.text("Your reputation has fallen too low.", CANVAS_WIDTH / 2, 150);
      p.text("The shop must close its doors...", CANVAS_WIDTH / 2, 170);
    }
    
    // Final stats
    p.fill(220, 200, 180);
    p.textSize(16);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
    p.text(`Days Completed: ${gameState.currentDay - 1}/${gameState.maxDays}`, CANVAS_WIDTH / 2, 245);
    p.text(`Final Reputation: ${Math.floor(gameState.reputation)}%`, CANVAS_WIDTH / 2, 270);
    
    // Restart prompt
    p.fill(255, 220, 150);
    p.textSize(16);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  }
});

// Expose game instance globally
window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn", "test_3_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });
  
  const activeBtn = mode === "HUMAN" ? "humanModeBtn" : 
                    mode === "TEST_1" ? "test_1_ModeBtn" :
                    mode === "TEST_2" ? "test_2_ModeBtn" :
                    "test_3_ModeBtn";
  const btn = document.getElementById(activeBtn);
  if (btn) {
    btn.classList.add("active");
  }
  
  console.log(`Control mode set to: ${mode}`);
};