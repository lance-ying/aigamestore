// rendering.js - Rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, 
         PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, PHASE_LEVEL_COMPLETE, PHASE_UPGRADE_MENU } from './globals.js';
import { Workstation } from './entities.js';

export let workstations = [];

export function initWorkstations() {
  workstations = [
    new Workstation("Dough", 20, 20, 80, 40, [160, 120, 80]),
    new Workstation("Sauce", 110, 20, 80, 40, [200, 50, 50]),
    new Workstation("Cheese", 200, 20, 80, 40, [255, 250, 200]),
    new Workstation("Pepperoni", 290, 20, 80, 40, [180, 30, 30]),
    new Workstation("Mushroom", 380, 20, 80, 40, [180, 180, 180]),
    new Workstation("Olive", 470, 20, 80, 40, [60, 60, 60]),
    new Workstation("Onion", 20, 70, 80, 40, [255, 230, 200]),
    new Workstation("Pepper", 110, 70, 80, 40, [100, 200, 100]),
    new Workstation("Oven", 450, 150, 130, 100, [80, 80, 80]),
    new Workstation("Slice", 450, 260, 130, 60, [150, 150, 150])
  ];
}

export function renderGame(p) {
  p.background(240, 230, 220);
  
  switch(gameState.gamePhase) {
    case PHASE_START:
      renderStartScreen(p);
      break;
    case PHASE_PLAYING:
      renderPlayingScreen(p);
      break;
    case PHASE_PAUSED:
      renderPlayingScreen(p);
      renderPauseOverlay(p);
      break;
    case PHASE_UPGRADE_MENU:
      renderPlayingScreen(p);
      renderUpgradeMenu(p);
      break;
    case PHASE_LEVEL_COMPLETE:
      renderLevelComplete(p);
      break;
    case PHASE_GAME_OVER_WIN:
      renderGameOverWin(p);
      break;
    case PHASE_GAME_OVER_LOSE:
      renderGameOverLose(p);
      break;
  }
}

function renderStartScreen(p) {
  p.fill(100, 50, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text("Pizza Tycoon Express", CANVAS_WIDTH/2, 100);
  
  p.textSize(16);
  p.fill(50);
  p.text("Build your pizza empire!", CANVAS_WIDTH/2, 150);
  
  p.textSize(14);
  p.fill(80);
  const instructions = [
    "Prepare dough, add toppings, bake, and serve",
    "Keep customers happy and meet money targets",
    "Complete 5 levels to become a Pizza Tycoon!",
    "",
    "CONTROLS:",
    "ENTER: Start Game",
    "ESC: Pause/Unpause",
    "R: Restart",
    "SPACE: Select/Confirm",
    "SHIFT: Turbo Mode",
    "Z: Upgrade Menu"
  ];
  
  let y = 190;
  for (let line of instructions) {
    p.text(line, CANVAS_WIDTH/2, y);
    y += 18;
  }
  
  p.textSize(20);
  p.fill(200, 100, 50);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, 370);
}

function renderPlayingScreen(p) {
  // Background
  p.fill(240, 230, 220);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Counter area
  p.fill(180, 160, 140);
  p.rect(0, 320, 400, 80);
  
  // Drive-thru area
  if (gameState.level >= 2) {
    p.fill(200, 200, 200);
    p.rect(500, 80, 100, 150);
  }
  
  // Workstations
  for (let ws of workstations) {
    ws.render(p);
  }
  
  // Pizzas
  for (let pizza of gameState.pizzasInPrep) {
    if (!pizza.inOven) {
      pizza.render(p);
    }
  }
  
  // Oven pizzas
  const ovenX = 515;
  const ovenY = 180;
  for (let pizza of gameState.pizzasInPrep) {
    if (pizza.inOven) {
      const slotX = ovenX + (pizza.ovenSlot % 2) * 35;
      const slotY = ovenY + Math.floor(pizza.ovenSlot / 2) * 35;
      pizza.x = slotX;
      pizza.y = slotY;
      pizza.render(p);
      
      // Baking progress
      if (pizza.state !== "BAKED") {
        p.fill(255, 150, 0, 150);
        p.noStroke();
        p.rect(slotX - 12, slotY - 15, 24 * (pizza.bakeProgress / 120), 3);
      }
    }
  }
  
  // Customers
  for (let customer of gameState.customerQueueCounter) {
    customer.render(p);
  }
  for (let customer of gameState.customerQueueDriveThru) {
    customer.render(p);
  }
  
  // Player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Action progress bar
  if (gameState.actionDuration > 0) {
    const barWidth = 80;
    const barHeight = 8;
    const x = CANVAS_WIDTH / 2 - barWidth / 2;
    const y = 140;
    p.fill(200);
    p.rect(x, y, barWidth, barHeight);
    p.fill(100, 200, 100);
    p.rect(x, y, barWidth * (gameState.actionProgress / gameState.actionDuration), barHeight);
  }
  
  // Selected pizza indicator
  if (gameState.selectedPizza) {
    p.noFill();
    p.stroke(255, 200, 0);
    p.strokeWeight(3);
    p.ellipse(gameState.selectedPizza.x, gameState.selectedPizza.y, gameState.selectedPizza.size + 10);
  }
  
  // UI
  renderUI(p);
}

function renderUI(p) {
  // Score
  p.fill(0);
  p.noStroke();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Multiplier
  if (gameState.multiplierActive) {
    p.fill(255, 200, 0);
    p.textSize(12);
    p.text("2x MULTIPLIER!", CANVAS_WIDTH - 10, 30);
  }
  
  // Money
  p.fill(0, 150, 0);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`$${Math.floor(gameState.money)}`, 10, 10);
  
  // Level
  p.fill(0);
  p.textSize(14);
  p.text(`LEVEL: ${gameState.level}`, 10, 30);
  
  // Timer
  const timeSeconds = Math.floor(gameState.levelTimeRemaining / 60);
  const timeColor = timeSeconds < 30 ? [255, 0, 0] : [0, 0, 0];
  p.fill(...timeColor);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text(`TIME: ${timeSeconds}s`, CANVAS_WIDTH / 2, 10);
  
  // Target
  p.fill(0);
  p.textSize(12);
  p.text(`Target: $${gameState.levelData.moneyTarget}`, CANVAS_WIDTH / 2, 28);
  
  // Unhappy customers
  p.fill(200, 0, 0);
  p.textAlign(p.LEFT, p.BOTTOM);
  p.textSize(12);
  p.text(`Unhappy: ${gameState.unhappyCustomerCount}/${gameState.levelData.maxUnhappyCustomers}`, 10, CANVAS_HEIGHT - 10);
  
  // Turbo cooldown
  if (gameState.turboCooldown > 0) {
    p.fill(150);
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.textSize(12);
    p.text(`Turbo: ${Math.ceil(gameState.turboCooldown / 60)}s`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
  } else if (gameState.turboActive) {
    p.fill(255, 200, 0);
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.textSize(12);
    p.text(`TURBO ACTIVE!`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
  }
}

function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 40);
  
  p.textSize(16);
  p.text("Press ESC to resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 20);
  p.text("Press R to restart", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 45);
}

function renderUpgradeMenu(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(24);
  p.text("UPGRADE SHOP", CANVAS_WIDTH/2, 30);
  
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  const upgrades = [
    { name: "Player Speed", cost: Math.floor(200 * gameState.upgrades.playerSpeed), key: "1" },
    { name: "Oven Capacity", cost: 300, key: "2" },
    { name: "Customer Patience", cost: Math.floor(250 * gameState.upgrades.customerPatienceBoost), key: "3" }
  ];
  
  let y = 80;
  for (let i = 0; i < upgrades.length; i++) {
    const upgrade = upgrades[i];
    const canAfford = gameState.money >= upgrade.cost;
    p.fill(canAfford ? 255 : 150);
    p.text(`[${upgrade.key}] ${upgrade.name} - $${upgrade.cost}`, 50, y);
    y += 30;
  }
  
  p.fill(200);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text("Press Z to close", CANVAS_WIDTH/2, CANVAS_HEIGHT - 20);
}

function renderLevelComplete(p) {
  p.background(50, 100, 50);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("LEVEL COMPLETE!", CANVAS_WIDTH/2, 80);
  
  p.textSize(20);
  p.text(`Level ${gameState.level} - ${gameState.levelData.name}`, CANVAS_WIDTH/2, 130);
  
  p.textSize(16);
  p.text(`Money Earned: $${Math.floor(gameState.money)}`, CANVAS_WIDTH/2, 180);
  p.text(`Pizzas Served: ${gameState.pizzasServedThisLevel}`, CANVAS_WIDTH/2, 210);
  p.text(`Total Score: ${gameState.score}`, CANVAS_WIDTH/2, 240);
  
  p.textSize(18);
  p.fill(255, 255, 100);
  p.text("PRESS ENTER for Next Level", CANVAS_WIDTH/2, 310);
  p.text("PRESS R to Restart", CANVAS_WIDTH/2, 340);
}

function renderGameOverWin(p) {
  p.background(200, 150, 0);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("CONGRATULATIONS!", CANVAS_WIDTH/2, 80);
  
  p.textSize(24);
  p.text("You're a Pizza Tycoon!", CANVAS_WIDTH/2, 130);
  
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 200);
  p.text(`Total Money: $${Math.floor(gameState.money)}`, CANVAS_WIDTH/2, 230);
  
  p.textSize(18);
  p.fill(255, 255, 100);
  p.text("PRESS R to Play Again", CANVAS_WIDTH/2, 320);
}

function renderGameOverLose(p) {
  p.background(100, 50, 50);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("GAME OVER", CANVAS_WIDTH/2, 100);
  
  p.textSize(18);
  p.text("You failed to meet the level objectives", CANVAS_WIDTH/2, 160);
  
  p.textSize(16);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 210);
  p.text(`Money: $${Math.floor(gameState.money)}`, CANVAS_WIDTH/2, 240);
  p.text(`Level Reached: ${gameState.level}`, CANVAS_WIDTH/2, 270);
  
  p.textSize(18);
  p.fill(255, 255, 100);
  p.text("PRESS R to Try Again", CANVAS_WIDTH/2, 340);
}