// input.js - Input handling
import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_LEVEL_COMPLETE, 
         PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, PHASE_UPGRADE_MENU, CONTROL_HUMAN } from './globals.js';
import { startDoughPrep, applyIngredient, placeInOven, removeFromOven, slicePizza, 
         serveCustomer, purchaseUpgrade, activateTurbo } from './gameLogic.js';
import { workstations } from './rendering.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  if (gameState.controlMode !== CONTROL_HUMAN) return;
  
  // ENTER - Start game
  if (keyCode === 13) {
    if (gameState.gamePhase === PHASE_START) {
      startGame(p);
    } else if (gameState.gamePhase === PHASE_LEVEL_COMPLETE) {
      nextLevel(p);
    }
  }
  
  // ESC - Pause/Unpause
  if (keyCode === 27) {
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_PAUSED;
      p.logs.game_info.push({
        data: { phase: PHASE_PAUSED },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    } else if (gameState.gamePhase === PHASE_PAUSED) {
      gameState.gamePhase = PHASE_PLAYING;
      p.logs.game_info.push({
        data: { phase: PHASE_PLAYING },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // R - Restart
  if (keyCode === 82) {
    restartGame(p);
  }
  
  // Z - Upgrade menu
  if (keyCode === 90 && gameState.gamePhase === PHASE_PLAYING) {
    gameState.gamePhase = PHASE_UPGRADE_MENU;
  } else if (keyCode === 90 && gameState.gamePhase === PHASE_UPGRADE_MENU) {
    gameState.gamePhase = PHASE_PLAYING;
  }
  
  // SHIFT - Turbo
  if (keyCode === 16 && gameState.gamePhase === PHASE_PLAYING) {
    activateTurbo();
  }
  
  // SPACE - Quick actions
  if (keyCode === 32 && gameState.gamePhase === PHASE_PLAYING) {
    handleSpaceAction();
  }
  
  // Upgrade menu shortcuts
  if (gameState.gamePhase === PHASE_UPGRADE_MENU) {
    if (key === '1') purchaseUpgrade("playerSpeed");
    if (key === '2') purchaseUpgrade("ovenCapacity");
    if (key === '3') purchaseUpgrade("customerPatience");
  }
}

export function handleMousePressed(p, mouseX, mouseY) {
  if (gameState.controlMode !== CONTROL_HUMAN) return;
  if (gameState.gamePhase !== PHASE_PLAYING) return;
  
  // Check workstations
  for (let ws of workstations) {
    if (ws.contains(mouseX, mouseY)) {
      handleWorkstationClick(ws);
      return;
    }
  }
  
  // Check pizzas
  for (let pizza of gameState.pizzasInPrep) {
    const dist = p.dist(mouseX, mouseY, pizza.x, pizza.y);
    if (dist < pizza.size / 2) {
      handlePizzaClick(pizza);
      return;
    }
  }
  
  // Check customers
  for (let customer of [...gameState.customerQueueCounter, ...gameState.customerQueueDriveThru]) {
    const dist = p.dist(mouseX, mouseY, customer.x, customer.y);
    if (dist < 30) {
      if (gameState.selectedPizza) {
        serveCustomer(gameState.selectedPizza, customer);
      }
      return;
    }
  }
}

function handleWorkstationClick(ws) {
  const name = ws.name.toLowerCase();
  
  if (name === "dough") {
    startDoughPrep();
  } else if (name === "sauce") {
    applyIngredient("sauce");
  } else if (name === "cheese") {
    applyIngredient("cheese");
  } else if (name === "pepperoni") {
    applyIngredient("pepperoni");
  } else if (name === "mushroom") {
    applyIngredient("mushroom");
  } else if (name === "olive") {
    applyIngredient("olive");
  } else if (name === "onion") {
    applyIngredient("onion");
  } else if (name === "pepper") {
    applyIngredient("pepper");
  } else if (name === "oven") {
    if (gameState.selectedPizza) {
      if (gameState.selectedPizza.inOven) {
        removeFromOven(gameState.selectedPizza);
      } else {
        placeInOven(gameState.selectedPizza);
      }
    }
  } else if (name === "slice") {
    if (gameState.selectedPizza) {
      slicePizza(gameState.selectedPizza);
    }
  }
}

function handlePizzaClick(pizza) {
  gameState.selectedPizza = pizza;
}

function handleSpaceAction() {
  // Quick serve to first waiting customer
  if (gameState.selectedPizza && gameState.selectedPizza.state === "SLICED") {
    const customer = gameState.customerQueueCounter[0] || gameState.customerQueueDriveThru[0];
    if (customer) {
      serveCustomer(gameState.selectedPizza, customer);
    }
  }
}

function startGame(p) {
  const { initLevel } = require('./gameLogic.js');
  initLevel(1);
  gameState.gamePhase = PHASE_PLAYING;
  gameState.score = 0;
  gameState.money = 100;
  
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, level: 1 },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function nextLevel(p) {
  const { initLevel } = require('./gameLogic.js');
  initLevel(gameState.level + 1);
  gameState.gamePhase = PHASE_PLAYING;
  
  p.logs.game_info.push({
    data: { phase: PHASE_PLAYING, level: gameState.level },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function restartGame(p) {
  const { initLevel } = require('./gameLogic.js');
  gameState.gamePhase = PHASE_START;
  gameState.score = 0;
  gameState.money = 100;
  gameState.level = 1;
  initLevel(1);
  
  p.logs.game_info.push({
    data: { phase: PHASE_START },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}