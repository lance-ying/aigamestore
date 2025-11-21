// game_logic.js - Core game logic

import { gameState, ITEM_TEMPLATES, COMBO_DEFINITIONS, PHASE_PLAYING, PHASE_GAME_OVER_WIN } from './globals.js';
import { Item, Catalog, Letter } from './entities.js';

export function initializeGame() {
  // Initialize catalogs
  gameState.catalogs = [];
  for (let i = 0; i < 4; i++) {
    const catalogItems = ITEM_TEMPLATES.filter(t => t.catalog === i);
    gameState.catalogs.push(new Catalog(i, catalogItems));
  }
  
  // Reset game state
  gameState.coins = 50;
  gameState.stamps = 0;
  gameState.inventory = [];
  gameState.burningItems = [];
  gameState.combosDiscovered = [];
  gameState.catalogOpen = false;
  gameState.selectedItemIndex = 0;
  gameState.grabbedItem = null;
  gameState.currentCatalogIndex = 0;
  gameState.storyProgress = 0;
  gameState.letterQueue = [];
  gameState.currentLetter = null;
  gameState.frameCounter = 0;
  
  // Add welcome letter
  addLetter("Welcome to Little Inferno! Start burning items to discover combos and earn coins. Use Z to open the catalog!", "The Company");
}

export function updateGame() {
  gameState.frameCounter++;
  
  // Update burning items
  gameState.burningItems.forEach(item => {
    item.update();
  });
  
  // Check for finished burning items
  const finishedItems = gameState.burningItems.filter(item => item.isFinishedBurning());
  finishedItems.forEach(item => {
    // Award coins
    const coinsEarned = Math.floor(item.cost * 0.8);
    gameState.coins += coinsEarned;
    gameState.score += coinsEarned;
  });
  
  // Remove finished items
  gameState.burningItems = gameState.burningItems.filter(item => !item.isFinishedBurning());
  
  // Check for combos when multiple items are burning
  if (gameState.burningItems.length >= 2) {
    checkCombos();
  }
  
  // Check catalog unlock conditions
  checkCatalogUnlocks();
  
  // Check win condition
  checkWinCondition();
  
  // Update current letter read time
  if (gameState.currentLetter && !gameState.currentLetter.dismissed) {
    gameState.currentLetter.readTime++;
  }
}

export function checkCombos() {
  const burningIds = gameState.burningItems.map(item => item.id).sort();
  
  COMBO_DEFINITIONS.forEach(combo => {
    // Check if combo already discovered
    if (gameState.combosDiscovered.includes(combo.id)) return;
    
    // Check if current burning items match combo
    const comboIds = [...combo.items].sort();
    
    // For two-item combos
    if (comboIds.length === 2) {
      let found = true;
      comboIds.forEach(requiredId => {
        if (!burningIds.includes(requiredId)) {
          found = false;
        }
      });
      
      if (found) {
        discoverCombo(combo);
      }
    }
  });
}

export function discoverCombo(combo) {
  if (gameState.combosDiscovered.includes(combo.id)) return;
  
  gameState.combosDiscovered.push(combo.id);
  gameState.stamps++;
  gameState.coins += combo.reward;
  gameState.score += combo.reward * 2; // Bonus points for combos
  
  // Add congratulation letter
  addLetter(`Combo discovered: "${combo.hint}"! Earned ${combo.reward} coins and 1 stamp!`, "The Company");
}

export function checkCatalogUnlocks() {
  // Unlock catalogs based on combos discovered
  const combosPerCatalog = 4;
  
  for (let i = 1; i < gameState.catalogs.length; i++) {
    if (!gameState.catalogs[i].unlocked) {
      const requiredCombos = i * combosPerCatalog;
      if (gameState.combosDiscovered.length >= requiredCombos) {
        gameState.catalogs[i].unlock();
        addLetter(`New catalog unlocked! Check out Catalog ${i + 1} for new items!`, "The Company");
      }
    }
  }
}

export function checkWinCondition() {
  // Win when all combos are discovered
  if (gameState.combosDiscovered.length >= COMBO_DEFINITIONS.length) {
    if (gameState.gamePhase === PHASE_PLAYING) {
      gameState.gamePhase = PHASE_GAME_OVER_WIN;
    }
  }
}

export function purchaseItem(template) {
  if (gameState.coins >= template.cost) {
    gameState.coins -= template.cost;
    
    // Create item in inventory area
    const item = new Item(template, 450, 350);
    gameState.inventory.push(item);
    
    return true;
  }
  return false;
}

export function addLetter(message, sender) {
  gameState.letterQueue.push(new Letter(message, sender));
}

export function showNextLetter() {
  if (gameState.letterQueue.length > 0 && !gameState.currentLetter) {
    gameState.currentLetter = gameState.letterQueue.shift();
  }
}

export function dismissCurrentLetter() {
  if (gameState.currentLetter) {
    gameState.currentLetter.dismissed = true;
    gameState.currentLetter = null;
  }
}