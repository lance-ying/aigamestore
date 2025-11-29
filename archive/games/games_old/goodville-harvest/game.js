import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, CONTROL_MODES, GRID_SIZE } from './globals.js';
import { UIManager } from './ui.js';
import { InputManager } from './input.js';
import { GameLogic } from './gameLogic.js';
import { CROP_TYPES } from './globals.js';

const p5 = window.p5;

let gameInstance = new p5(p => {
  let uiManager;
  let inputManager;
  let gameLogic;
  let lastMouseX = -1;
  let lastMouseY = -1;

  p.setup = function() {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.randomSeed(42);
    p.frameRate(60);

    p.logs = {
      game_info: [],
      inputs: [],
      player_info: []
    };

    uiManager = new UIManager(p);
    inputManager = new InputManager(p);
    gameLogic = new GameLogic(p);
    gameLogic.initialize();

    p.logs.game_info.push({
      data: { phase: gameState.gamePhase, action: "initialized" },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  };

  p.draw = function() {
    p.background(34, 139, 34);

    if (gameState.gamePhase === GAME_PHASES.START) {
      uiManager.displayStartScreen();
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING || gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameLogic.update();
      renderGame();
      uiManager.displayHUD();
      uiManager.displayOrders();
      uiManager.displayQuest();
      uiManager.displayPopup();

      if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        uiManager.displayPaused();
      }
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
      renderGame();
      uiManager.displayGameOver(true);
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      renderGame();
      uiManager.displayGameOver(false);
    }

    handleCameraMovement();
  };

  function renderGame() {
    p.push();
    p.translate(-gameState.cameraX, -gameState.cameraY);

    p.fill(50, 150, 50);
    p.noStroke();
    p.rect(0, 0, GRID_SIZE * 30, GRID_SIZE * 30);

    for (const plot of gameState.farmPlots) {
      plot.display(p);
    }

    for (const animal of gameState.animals) {
      animal.display(p);
    }

    for (const workshop of gameState.workshops) {
      workshop.display(p);
    }

    p.pop();
  }

  function handleCameraMovement() {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;

    const speed = 5;
    if (inputManager.isKeyDown(37) || inputManager.isKeyDown(65)) {
      gameState.cameraX = Math.max(0, gameState.cameraX - speed);
    }
    if (inputManager.isKeyDown(39) || inputManager.isKeyDown(68)) {
      gameState.cameraX = Math.min(GRID_SIZE * 30 - CANVAS_WIDTH, gameState.cameraX + speed);
    }
    if (inputManager.isKeyDown(38) || inputManager.isKeyDown(87)) {
      gameState.cameraY = Math.max(0, gameState.cameraY - speed);
    }
    if (inputManager.isKeyDown(40) || inputManager.isKeyDown(83)) {
      gameState.cameraY = Math.min(GRID_SIZE * 30 - CANVAS_HEIGHT, gameState.cameraY + speed);
    }
  }

  p.keyPressed = function() {
    inputManager.handleKeyPressed(p.key, p.keyCode);
    return false;
  };

  p.keyReleased = function() {
    inputManager.handleKeyReleased(p.key, p.keyCode);
    return false;
  };

  p.mousePressed = function() {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING || gameState.controlMode !== CONTROL_MODES.HUMAN) {
      return;
    }

    gameState.actionCount++;

    const worldX = p.mouseX + gameState.cameraX;
    const worldY = p.mouseY + gameState.cameraY;

    if (gameState.showPopup) {
      handlePopupClick(worldX, worldY);
      return;
    }

    for (const order of gameState.orders) {
      const orderX = CANVAS_WIDTH - 180 + gameState.cameraX;
      const orderY = 80 + gameState.cameraY;
      const orderIndex = gameState.orders.indexOf(order);
      const y = orderY + orderIndex * 55;

      if (p.mouseX >= CANVAS_WIDTH - 180 && p.mouseX <= CANVAS_WIDTH - 10 &&
          p.mouseY >= 80 + orderIndex * 55 && p.mouseY <= 130 + orderIndex * 55) {
        if (order.fulfill()) {
          gameState.orders.splice(orderIndex, 1);
        }
        return;
      }
    }

    for (const plot of gameState.farmPlots) {
      if (worldX >= plot.x && worldX <= plot.x + GRID_SIZE &&
          worldY >= plot.y && worldY <= plot.y + GRID_SIZE) {
        if (plot.state === 'empty') {
          gameState.selectedPlot = plot;
          gameState.showPopup = true;
          gameState.popupType = 'plant';
        } else if (plot.state === 'ready') {
          plot.harvest();
        }
        return;
      }
    }

    for (const animal of gameState.animals) {
      const dist = p.dist(worldX, worldY, animal.x, animal.y);
      if (dist < 30) {
        if (animal.state === 'hungry') {
          animal.feed();
        } else if (animal.state === 'ready') {
          animal.collect();
        }
        return;
      }
    }

    for (const workshop of gameState.workshops) {
      const dist = p.dist(worldX, worldY, workshop.x, workshop.y);
      if (dist < 40) {
        if (workshop.state === 'idle') {
          gameState.selectedWorkshop = workshop;
          gameState.showPopup = true;
          gameState.popupType = 'craft';
          gameState.popupData = workshop;
        } else if (workshop.state === 'ready') {
          workshop.collect();
        }
        return;
      }
    }
  };

  function handlePopupClick(worldX, worldY) {
    const popupW = 300;
    const popupH = 250;
    const popupX = (CANVAS_WIDTH - popupW) / 2 + gameState.cameraX;
    const popupY = (CANVAS_HEIGHT - popupH) / 2 + gameState.cameraY;

    if (gameState.popupType === 'plant') {
      let y = popupY + 50;
      const availableCrops = Object.entries(CROP_TYPES).filter(([k, v]) => v.unlockLevel <= gameState.level);

      for (const [key, crop] of availableCrops) {
        if (p.mouseX + gameState.cameraX >= popupX + 20 && 
            p.mouseX + gameState.cameraX <= popupX + popupW - 20 &&
            p.mouseY + gameState.cameraY >= y && 
            p.mouseY + gameState.cameraY <= y + 30) {
          if (gameState.selectedPlot) {
            gameState.selectedPlot.plant(key);
          }
          gameState.showPopup = false;
          gameState.popupType = null;
          gameState.selectedPlot = null;
          return;
        }
        y += 35;
      }
    } else if (gameState.popupType === 'craft') {
      const workshop = gameState.popupData;
      let y = popupY + 50;

      for (let i = 0; i < workshop.typeData.recipes.length; i++) {
        if (p.mouseX + gameState.cameraX >= popupX + 20 && 
            p.mouseX + gameState.cameraX <= popupX + popupW - 20 &&
            p.mouseY + gameState.cameraY >= y && 
            p.mouseY + gameState.cameraY <= y + 40) {
          workshop.startCrafting(i);
          gameState.showPopup = false;
          gameState.popupType = null;
          gameState.popupData = null;
          gameState.selectedWorkshop = null;
          return;
        }
        y += 45;
      }
    }
  }
});

window.gameInstance = gameInstance;

window.getGameState = function() {
  return gameState;
};

window.setControlMode = function(mode) {
  if (CONTROL_MODES[mode]) {
    gameState.controlMode = CONTROL_MODES[mode];

    document.querySelectorAll('.control-button').forEach(btn => {
      btn.classList.remove('active');
    });

    const buttonId = mode.toLowerCase() + 'ModeBtn';
    const button = document.getElementById(buttonId);
    if (button) {
      button.classList.add('active');
    }

    console.log(`Control mode set to: ${mode}`);
  }
};