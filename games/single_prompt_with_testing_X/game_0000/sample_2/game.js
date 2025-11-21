// game.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, gameState, getGameState } from './globals.js';
import { Claw } from './claw.js';
import { generateLevel } from './levelGenerator.js';
import { Shop } from './shop.js';
import { renderStartScreen, renderGameOver, renderGameUI, renderBackground } from './renderer.js';
import { get_automated_testing_action } from './automated_testing_controller.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let shop;

  p.logs = {
    "game_info": [],
    "inputs": [],
    "player_info": []
  };

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.randomSeed(42);
    p.frameRate(60);
    
    shop = new Shop(p);
    
    logGameInfo("Game initialized", { gamePhase: gameState.gamePhase });
  };

  p.draw = function() {
    // Handle automated testing
    if (gameState.controlMode !== "HUMAN") {
      const action = get_automated_testing_action(gameState);
      if (action) {
        handleAction(action);
      }
    }

    // Render based on game phase
    if (gameState.gamePhase === GAME_PHASES.START) {
      renderStartScreen(p);
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING || gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderGameplay();
    } else if (gameState.gamePhase === GAME_PHASES.SHOP) {
      renderGameplay();
      shop.render();
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGameplay();
      renderGameOver(p);
    }
  };

  function renderGameplay() {
    renderBackground(p);
    
    // Draw base
    p.push();
    p.fill(139, 90, 43);
    p.noStroke();
    p.rect(CANVAS_WIDTH / 2 - 30, 30, 60, 25);
    p.fill(160, 110, 60);
    p.rect(CANVAS_WIDTH / 2 - 25, 35, 50, 15);
    p.pop();
    
    // Update and render items
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      for (let item of gameState.items) {
        item.update();
      }
      
      // Update claw
      if (gameState.claw) {
        gameState.claw.update();
      }
      
      // Update timer
      gameState.timeRemaining -= 1 / 60;
      
      // Check win/lose conditions
      if (gameState.levelMoney >= gameState.goalAmount) {
        // Level complete
        gameState.gamePhase = GAME_PHASES.SHOP;
        gameState.level++;
        gameState.goalAmount = 500 + (gameState.level - 1) * 100;
        
        // Use strength potion if available
        if (gameState.inventory.strength > 0) {
          gameState.strengthActive = true;
          gameState.inventory.strength--;
        }
        
        logGameInfo("Level complete", { level: gameState.level - 1, money: gameState.levelMoney });
      } else if (gameState.timeRemaining <= 0) {
        gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
        logGameInfo("Game over - time ran out", { level: gameState.level, score: gameState.score });
      }
    }
    
    // Render items
    for (let item of gameState.items) {
      if (!item.grabbed) {
        item.render();
      }
    }
    
    // Render claw and grabbed item
    if (gameState.claw) {
      gameState.claw.render();
      
      if (gameState.claw.grabbedItem) {
        gameState.claw.grabbedItem.render();
      }
    }
    
    // Render UI
    renderGameUI(p);
  }

  function handleAction(action) {
    if (!action) return;
    
    const { key, keyCode } = action;
    
    logInput("keyPressed", { key, keyCode });
    
    // Game phase transitions
    if (keyCode === 13) { // ENTER
      if (gameState.gamePhase === GAME_PHASES.START) {
        startGame();
      } else if (gameState.gamePhase === GAME_PHASES.SHOP) {
        // Start next level
        gameState.gamePhase = GAME_PHASES.PLAYING;
        gameState.levelMoney = 0;
        gameState.timeRemaining = 60;
        generateLevel(p, gameState.level);
        gameState.claw = new Claw(p);
        logGameInfo("Level started", { level: gameState.level, goal: gameState.goalAmount });
      }
    } else if (keyCode === 82) { // R
      resetGame();
    } else if (keyCode === 27) { // ESC
      if (gameState.gamePhase === GAME_PHASES.PLAYING) {
        gameState.gamePhase = GAME_PHASES.PAUSED;
        logGameInfo("Game paused", {});
      } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        gameState.gamePhase = GAME_PHASES.PLAYING;
        logGameInfo("Game resumed", {});
      }
    }
    
    // Gameplay actions
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      if (keyCode === 32) { // SPACE
        if (gameState.claw) {
          gameState.claw.drop();
        }
      } else if (keyCode === 90) { // Z
        if (gameState.claw) {
          gameState.claw.useDynamite();
        }
      }
    }
    
    // Shop actions
    if (gameState.gamePhase === GAME_PHASES.SHOP) {
      if (keyCode === 38) { // UP
        gameState.shopSelection = Math.max(0, gameState.shopSelection - 1);
      } else if (keyCode === 40) { // DOWN
        gameState.shopSelection = Math.min(1, gameState.shopSelection + 1);
      } else if (keyCode === 39) { // RIGHT
        shop.buyItem();
      }
    }
  }

  p.keyPressed = function() {
    if (gameState.controlMode === "HUMAN") {
      handleAction({ key: p.key, keyCode: p.keyCode });
    }
  };

  function startGame() {
    gameState.gamePhase = GAME_PHASES.PLAYING;
    gameState.score = 0;
    gameState.level = 1;
    gameState.timeRemaining = 60;
    gameState.goalAmount = 500;
    gameState.levelMoney = 0;
    gameState.totalMoney = 0;
    gameState.inventory = { dynamite: 0, strength: 0 };
    gameState.strengthActive = false;
    gameState.shopSelection = 0;
    
    generateLevel(p, gameState.level);
    gameState.claw = new Claw(p);
    
    logGameInfo("Game started", { level: gameState.level });
  }

  function resetGame() {
    gameState.gamePhase = GAME_PHASES.START;
    gameState.score = 0;
    gameState.level = 1;
    gameState.items = [];
    gameState.claw = null;
    gameState.inventory = { dynamite: 0, strength: 0 };
    gameState.strengthActive = false;
    gameState.levelMoney = 0;
    gameState.totalMoney = 0;
    
    logGameInfo("Game reset", {});
  }

  function logGameInfo(message, data) {
    p.logs.game_info.push({
      message,
      data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function logInput(inputType, data) {
    p.logs.inputs.push({
      input_type: inputType,
      data,
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }

  function logPlayerInfo() {
    if (gameState.claw) {
      p.logs.player_info.push({
        screen_x: gameState.claw.x,
        screen_y: gameState.claw.y,
        game_x: gameState.claw.x,
        game_y: gameState.claw.y,
        framecount: p.frameCount
      });
    }
  }
});

window.gameInstance = gameInstance;

// Control mode switching
window.setControlMode = function(mode) {
  gameState.controlMode = mode;
  
  // Update button states
  const buttons = ["humanModeBtn", "test_1_ModeBtn", "test_2_ModeBtn"];
  buttons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.classList.remove("active");
    }
  });
  
  const activeBtn = document.getElementById(
    mode === "HUMAN" ? "humanModeBtn" : 
    mode === "TEST_1" ? "test_1_ModeBtn" :
    mode === "TEST_2" ? "test_2_ModeBtn" : "humanModeBtn"
  );
  
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
};