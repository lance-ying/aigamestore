// input_handler.js - Input handling

import { gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED } from './globals.js';
import { PHASE_GAME_OVER_WIN } from './globals.js';
import { initializeGame, playBird, activateHabitat, gainFood, layEggs, drawCardsAction } from './game_logic.js';
import { HABITAT_FOREST, HABITAT_GRASSLAND, HABITAT_WETLAND } from './globals.js';
import { FOOD_SEED, FOOD_BERRY, FOOD_FISH, FOOD_RODENT } from './globals.js';

export function handleKeyPressed(p) {
  const key = p.key;
  const keyCode = p.keyCode;
  
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // ENTER to start
  if (keyCode === 13 && gameState.gamePhase === PHASE_START) {
    gameState.gamePhase = PHASE_PLAYING;
    initializeGame(p);
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // R to restart
  if (keyCode === 82) {
    gameState.gamePhase = PHASE_START;
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // ESC to pause/unpause
  if (keyCode === 27 && (gameState.gamePhase === PHASE_PLAYING || gameState.gamePhase === PHASE_PAUSED)) {
    gameState.gamePhase = gameState.gamePhase === PHASE_PLAYING ? PHASE_PAUSED : PHASE_PLAYING;
    p.logs.game_info.push({
      data: { phase: gameState.gamePhase },
      framecount: p.frameCount,
      timestamp: Date.now()
    });
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase === PHASE_PLAYING) {
    handleGameplayInput(p, keyCode);
  }
}

function handleGameplayInput(p, keyCode) {
  if (gameState.uiMode === "ACTION_SELECT") {
    handleActionSelect(p, keyCode);
  } else if (gameState.uiMode === "HABITAT_SELECT") {
    handleHabitatSelect(p, keyCode);
  } else if (gameState.uiMode === "CARD_SELECT") {
    handleCardSelect(p, keyCode);
  } else if (gameState.uiMode === "FOOD_SELECT") {
    handleFoodSelect(p, keyCode);
  } else if (gameState.uiMode === "EGG_SELECT") {
    handleEggSelect(p, keyCode);
  }
}

function handleActionSelect(p, keyCode) {
  const actions = ["PLAY_BIRD", "GAIN_FOOD", "LAY_EGGS", "DRAW_CARDS"];
  
  // Arrow keys
  if (keyCode === 38) { // UP
    gameState.menuIndex = (gameState.menuIndex - 1 + actions.length) % actions.length;
  } else if (keyCode === 40) { // DOWN
    gameState.menuIndex = (gameState.menuIndex + 1) % actions.length;
  }
  
  // Space to select
  if (keyCode === 32) {
    gameState.selectedAction = actions[gameState.menuIndex];
    
    if (gameState.selectedAction === "PLAY_BIRD") {
      gameState.uiMode = "HABITAT_SELECT";
      gameState.menuIndex = 0;
    } else if (gameState.selectedAction === "GAIN_FOOD") {
      gameState.uiMode = "FOOD_SELECT";
      gameState.menuIndex = 0;
    } else if (gameState.selectedAction === "LAY_EGGS") {
      gameState.uiMode = "EGG_SELECT";
      gameState.menuIndex = 0;
    } else if (gameState.selectedAction === "DRAW_CARDS") {
      drawCardsAction(p);
      gameState.uiMode = "ACTION_SELECT";
      gameState.menuIndex = 0;
    }
  }
}

function handleHabitatSelect(p, keyCode) {
  const habitats = [HABITAT_FOREST, HABITAT_GRASSLAND, HABITAT_WETLAND];
  
  // Arrow keys
  if (keyCode === 37) { // LEFT
    gameState.menuIndex = (gameState.menuIndex - 1 + habitats.length) % habitats.length;
  } else if (keyCode === 39) { // RIGHT
    gameState.menuIndex = (gameState.menuIndex + 1) % habitats.length;
  }
  
  // Space to select
  if (keyCode === 32) {
    gameState.selectedHabitat = habitats[gameState.menuIndex];
    
    if (gameState.selectedAction === "PLAY_BIRD") {
      gameState.uiMode = "CARD_SELECT";
      gameState.menuIndex = 0;
    } else {
      // Activate habitat
      activateHabitat(p, gameState.selectedHabitat);
      gameState.uiMode = "ACTION_SELECT";
      gameState.menuIndex = 0;
      gameState.selectedHabitat = null;
      gameState.selectedAction = null;
    }
  }
  
  // Z to cancel
  if (keyCode === 90) {
    gameState.uiMode = "ACTION_SELECT";
    gameState.menuIndex = 0;
    gameState.selectedAction = null;
  }
}

function handleCardSelect(p, keyCode) {
  if (gameState.hand.length === 0) {
    gameState.uiMode = "ACTION_SELECT";
    gameState.menuIndex = 0;
    return;
  }
  
  // Arrow keys
  if (keyCode === 37) { // LEFT
    gameState.menuIndex = Math.max(0, gameState.menuIndex - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.menuIndex = Math.min(gameState.hand.length - 1, gameState.menuIndex + 1);
  }
  
  // Space to select
  if (keyCode === 32) {
    const card = gameState.hand[gameState.menuIndex];
    
    if (card && gameState.selectedHabitat) {
      if (card.habitat === gameState.selectedHabitat) {
        // Check if can afford
        const canAfford = canAffordCard(card);
        
        if (canAfford) {
          playBird(p, card, gameState.selectedHabitat);
          gameState.uiMode = "ACTION_SELECT";
          gameState.menuIndex = 0;
          gameState.selectedHabitat = null;
          gameState.selectedAction = null;
        }
      }
    }
  }
  
  // Z to cancel
  if (keyCode === 90) {
    gameState.uiMode = "HABITAT_SELECT";
    gameState.menuIndex = 0;
  }
}

function handleFoodSelect(p, keyCode) {
  const foods = [FOOD_SEED, FOOD_BERRY, FOOD_FISH, FOOD_RODENT];
  
  // Arrow keys
  if (keyCode === 37) { // LEFT
    gameState.menuIndex = (gameState.menuIndex - 1 + foods.length) % foods.length;
  } else if (keyCode === 39) { // RIGHT
    gameState.menuIndex = (gameState.menuIndex + 1) % foods.length;
  }
  
  // Space to select
  if (keyCode === 32) {
    const food = foods[gameState.menuIndex];
    gainFood(p, food);
    gameState.uiMode = "ACTION_SELECT";
    gameState.menuIndex = 0;
    gameState.selectedAction = null;
  }
  
  // Z to cancel
  if (keyCode === 90) {
    gameState.uiMode = "ACTION_SELECT";
    gameState.menuIndex = 0;
    gameState.selectedAction = null;
  }
}

function handleEggSelect(p, keyCode) {
  // Collect all birds with space for eggs
  const allBirds = [];
  for (const habitat in gameState.habitats) {
    for (const bird of gameState.habitats[habitat]) {
      if (bird.eggs < bird.maxEggs) {
        allBirds.push(bird);
      }
    }
  }
  
  if (allBirds.length === 0) {
    gameState.uiMode = "ACTION_SELECT";
    gameState.menuIndex = 0;
    gameState.selectedAction = null;
    return;
  }
  
  // Arrow keys
  if (keyCode === 37) { // LEFT
    gameState.menuIndex = Math.max(0, gameState.menuIndex - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.menuIndex = Math.min(allBirds.length - 1, gameState.menuIndex + 1);
  }
  
  // Space to select
  if (keyCode === 32) {
    const bird = allBirds[gameState.menuIndex];
    if (bird) {
      layEggs(p, bird);
      gameState.uiMode = "ACTION_SELECT";
      gameState.menuIndex = 0;
      gameState.selectedAction = null;
    }
  }
  
  // Z to cancel
  if (keyCode === 90) {
    gameState.uiMode = "ACTION_SELECT";
    gameState.menuIndex = 0;
    gameState.selectedAction = null;
  }
}

function canAffordCard(card) {
  const foodNeeded = {};
  for (const food of card.foodCost) {
    foodNeeded[food] = (foodNeeded[food] || 0) + 1;
  }
  
  for (const food in foodNeeded) {
    if (gameState.foodSupply[food] < foodNeeded[food]) {
      return false;
    }
  }
  
  return true;
}

export function processAutomatedAction(p, action) {
  if (!action) return;
  
  // Simulate key press
  if (action.keyCode) {
    p.keyCode = action.keyCode;
    p.key = action.key || String.fromCharCode(action.keyCode);
    handleKeyPressed(p);
  }
}