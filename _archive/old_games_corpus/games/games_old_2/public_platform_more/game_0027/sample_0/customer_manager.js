// customer_manager.js - Manages customer generation and orders
import { gameState, CUSTOMER_CLUES, PLANT_DATABASE } from './globals.js';
import { unlockPlant, getPlantById } from './plant_manager.js';

export function initializeCustomers(p) {
  generateCustomerForDay(p);
}

export function generateCustomerForDay(p) {
  gameState.customerQueue = [];
  
  // Generate customers based on current day
  const customersToday = gameState.customersPerDay;
  
  for (let i = 0; i < customersToday; i++) {
    const customer = generateCustomer(p);
    gameState.customerQueue.push(customer);
  }
  
  // Set first customer as current
  if (gameState.customerQueue.length > 0) {
    gameState.currentCustomer = gameState.customerQueue.shift();
  }
}

function generateCustomer(p) {
  // Choose a plant from unlocked plants for early days
  // Later days can request any plant
  let availablePlants;
  
  if (gameState.currentDay <= 2) {
    // Early days: only use unlocked plants
    availablePlants = gameState.unlockedPlants;
  } else {
    // Later days: can request any plant (to unlock new ones)
    availablePlants = PLANT_DATABASE.map(p => p.id);
  }
  
  const requestedPlantId = availablePlants[Math.floor(p.random(availablePlants.length))];
  const clueSet = CUSTOMER_CLUES.find(c => c.plantId === requestedPlantId);
  const clue = clueSet.clues[Math.floor(p.random(clueSet.clues.length))];
  
  return {
    requestedPlantId,
    clue,
    name: generateCustomerName(p),
    patience: 1.0
  };
}

function generateCustomerName(p) {
  const names = [
    "Mysterious Stranger",
    "Old Herbalist",
    "Young Apprentice",
    "Cloaked Figure",
    "Worried Mother",
    "Scholarly Gentleman",
    "Eccentric Collector",
    "Nervous Student",
    "Weathered Traveler",
    "Hooded Mystic"
  ];
  return names[Math.floor(p.random(names.length))];
}

export function submitPlantToCustomer(p, plantId) {
  if (!gameState.currentCustomer) return;
  
  const correct = plantId === gameState.currentCustomer.requestedPlantId;
  
  if (correct) {
    // Correct plant!
    gameState.score += 100;
    gameState.reputation = Math.min(100, gameState.reputation + 5);
    
    // Unlock the plant if not already unlocked
    unlockPlant(plantId);
    
    // Log success
    if (window.gameInstance && window.gameInstance.logs) {
      window.gameInstance.logs.game_info.push({
        data: `Correct plant given: ${getPlantById(plantId).name}`,
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  } else {
    // Wrong plant!
    gameState.reputation = Math.max(0, gameState.reputation - 15);
    
    // Log failure
    if (window.gameInstance && window.gameInstance.logs) {
      window.gameInstance.logs.game_info.push({
        data: `Wrong plant given: ${getPlantById(plantId).name} instead of ${getPlantById(gameState.currentCustomer.requestedPlantId).name}`,
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  // Move to next customer
  gameState.customersServedToday++;
  
  if (gameState.customerQueue.length > 0) {
    gameState.currentCustomer = gameState.customerQueue.shift();
  } else {
    gameState.currentCustomer = null;
    // End of day
    advanceDay(p);
  }
  
  gameState.selectedPlantId = null;
}

function advanceDay(p) {
  gameState.currentDay++;
  gameState.customersServedToday = 0;
  
  // Unlock more plants as days progress
  if (gameState.currentDay === 2) {
    unlockPlant(7);
    unlockPlant(8);
  } else if (gameState.currentDay === 3) {
    unlockPlant(9);
    unlockPlant(10);
  } else if (gameState.currentDay === 4) {
    unlockPlant(11);
    unlockPlant(12);
  }
  
  // Check win/lose conditions
  if (gameState.reputation <= 0) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    if (window.gameInstance && window.gameInstance.logs) {
      window.gameInstance.logs.game_info.push({
        data: "Game Over - Reputation depleted",
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (gameState.currentDay > gameState.maxDays) {
    gameState.gamePhase = "GAME_OVER_WIN";
    if (window.gameInstance && window.gameInstance.logs) {
      window.gameInstance.logs.game_info.push({
        data: "Game Won - All days completed",
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  // Generate customers for new day
  generateCustomerForDay(p);
}

export function drawCustomer(p, x, y, width, height) {
  if (!gameState.currentCustomer) return;
  
  p.push();
  
  // Customer box
  p.fill(40, 35, 45);
  p.stroke(150, 120, 180);
  p.strokeWeight(2);
  p.rect(x, y, width, height, 5);
  p.noStroke();
  
  // Customer figure
  p.fill(80, 70, 90);
  p.circle(x + 40, y + 40, 50);
  p.rect(x + 15, y + 60, 50, 70, 10);
  
  // Customer name
  p.fill(220, 200, 240);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(gameState.currentCustomer.name, x + 80, y + 15);
  
  // Clue text
  p.fill(200, 190, 210);
  p.textSize(11);
  const clueLines = wrapText(p, gameState.currentCustomer.clue, width - 90);
  let yPos = y + 40;
  for (let line of clueLines) {
    p.text(line, x + 80, yPos);
    yPos += 14;
  }
  
  // Show selected plant if any
  if (gameState.selectedPlantId) {
    p.fill(100, 200, 100, 100);
    p.rect(x + 10, y + height - 60, width - 20, 50, 5);
    p.fill(255);
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("Press SPACE to give to customer", x + width / 2, y + height - 35);
  }
  
  p.pop();
}

function wrapText(p, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (let word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    if (p.textWidth(testLine) < maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  return lines;
}