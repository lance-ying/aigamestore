// input_handler.js - Handles keyboard input
import { gameState } from './globals.js';
import { navigateEncyclopedia, navigateInventory, toggleView } from './ui_manager.js';
import { submitPlantToCustomer } from './customer_manager.js';

export function handleKeyPressed(p) {
  // Log input
  if (p.logs && p.logs.inputs) {
    p.logs.inputs.push({
      input_type: "keyPressed",
      data: { key: p.key, keyCode: p.keyCode },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
  }
  
  // Game phase transitions (handled in main game.js)
  if (p.keyCode === 13) return; // ENTER
  if (p.keyCode === 27) return; // ESC
  if (p.keyCode === 82) return; // R
  
  // Only handle gameplay inputs in PLAYING state
  if (gameState.gamePhase !== "PLAYING") return;
  
  // Cooldown for navigation
  if (gameState.navigationCooldown > 0) return;
  
  // View switching (SHIFT)
  if (p.keyCode === 16) {
    toggleView(p);
    gameState.navigationCooldown = 10;
    return;
  }
  
  // View-specific controls
  if (gameState.currentView === "ENCYCLOPEDIA") {
    handleEncyclopediaInput(p);
  } else if (gameState.currentView === "INVENTORY") {
    handleInventoryInput(p);
  } else if (gameState.currentView === "CUSTOMER") {
    handleCustomerInput(p);
  }
}

function handleEncyclopediaInput(p) {
  // Arrow keys for page navigation
  if (p.keyCode === 37) { // LEFT
    navigateEncyclopedia(p, -1);
    gameState.navigationCooldown = 10;
  } else if (p.keyCode === 39) { // RIGHT
    navigateEncyclopedia(p, 1);
    gameState.navigationCooldown = 10;
  }
}

function handleInventoryInput(p) {
  // Arrow keys for plant selection
  if (p.keyCode === 37) { // LEFT
    navigateInventory(p, -1);
    gameState.navigationCooldown = 10;
  } else if (p.keyCode === 39) { // RIGHT
    navigateInventory(p, 1);
    gameState.navigationCooldown = 10;
  } else if (p.keyCode === 32) { // SPACE - confirm selection
    if (gameState.selectedPlantId) {
      // Switch to customer view to give plant
      gameState.currentView = "CUSTOMER";
    }
    gameState.navigationCooldown = 10;
  } else if (p.keyCode === 90) { // Z - cancel
    gameState.selectedPlantId = null;
    gameState.navigationCooldown = 10;
  }
}

function handleCustomerInput(p) {
  if (p.keyCode === 32) { // SPACE - give plant to customer
    if (gameState.selectedPlantId && gameState.currentCustomer) {
      submitPlantToCustomer(p, gameState.selectedPlantId);
      gameState.navigationCooldown = 10;
    }
  } else if (p.keyCode === 90) { // Z - cancel
    gameState.selectedPlantId = null;
    gameState.currentView = "INVENTORY";
    gameState.navigationCooldown = 10;
  }
}

export function updateNavigationCooldown() {
  if (gameState.navigationCooldown > 0) {
    gameState.navigationCooldown--;
  }
}