// input.js - Input handling

import { gameState, GAME_PHASES, PLAY_PHASES } from './globals.js';
import { startBrewing, selectIngredientForSlot, canBrewPotion, brewPotion, cancelBrewing, upgradeIngredient, buyIngredients } from './brewing.js';
import { startNegotiation, playNegotiationCard, checkNegotiationEnd, completeNegotiation } from './negotiation.js';
import { advanceDay, payDebt } from './day_management.js';
import { initializeGameState } from './globals.js';

export function handleKeyPressed(p, key, keyCode) {
  // Log input
  p.logs.inputs.push({
    input_type: "keyPressed",
    data: { key, keyCode },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
  
  // Global controls
  if (keyCode === 13) { // ENTER
    if (gameState.gamePhase === GAME_PHASES.START) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      gameState.playPhase = PLAY_PHASES.SHOP_MENU;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase, playPhase: gameState.playPhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 82) { // R
    if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      initializeGameState();
      gameState.gamePhase = GAME_PHASES.START;
      p.logs.game_info.push({
        data: { gamePhase: gameState.gamePhase },
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    return;
  }
  
  if (keyCode === 27) { // ESC
    if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      gameState.gamePhase = GAME_PHASES.PAUSED;
      p.noLoop();
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      gameState.gamePhase = GAME_PHASES.PLAYING;
      p.loop();
    }
    return;
  }
  
  // Gameplay controls
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  if (gameState.playPhase === PLAY_PHASES.SHOP_MENU) {
    handleShopMenuInput(keyCode);
  } else if (gameState.playPhase === PLAY_PHASES.BREWING) {
    handleBrewingInput(keyCode);
  } else if (gameState.playPhase === PLAY_PHASES.NEGOTIATION) {
    handleNegotiationInput(keyCode);
  }
}

function handleShopMenuInput(keyCode) {
  if (keyCode === 38) { // UP
    gameState.menuSelection = (gameState.menuSelection - 1 + 6) % 6;
  } else if (keyCode === 40) { // DOWN
    gameState.menuSelection = (gameState.menuSelection + 1) % 6;
  } else if (keyCode === 32) { // SPACE
    executeMenuAction(gameState.menuSelection);
  }
}

function executeMenuAction(selection) {
  switch (selection) {
    case 0: // Brew potion
      startBrewing();
      break;
    case 1: // Sell to customer
      startNegotiation();
      break;
    case 2: // Buy ingredients
      // Simple: buy 1 unit of first affordable ingredient
      for (const ing of gameState.ingredients) {
        const cost = ing.baseValue || 10;
        if (gameState.gold >= cost) {
          buyIngredients(ing.type, 1);
          break;
        }
      }
      break;
    case 3: // Upgrade ingredient
      // Upgrade first ingredient if affordable
      for (const ing of gameState.ingredients) {
        if (upgradeIngredient(ing.type)) break;
      }
      break;
    case 4: // Pay debt
      payDebt(50);
      break;
    case 5: // End day
      advanceDay();
      break;
  }
}

function handleBrewingInput(keyCode) {
  if (keyCode === 90) { // Z - cancel
    cancelBrewing();
  } else if (keyCode === 37) { // LEFT
    gameState.selectedSlot = (gameState.selectedSlot - 1 + 3) % 3;
  } else if (keyCode === 39) { // RIGHT
    gameState.selectedSlot = (gameState.selectedSlot + 1) % 3;
  } else if (keyCode === 38 || keyCode === 40) { // UP/DOWN - cycle ingredients
    const types = Object.keys(gameState.ingredients);
    const availableTypes = types.filter(t => {
      const ing = gameState.ingredients.find(i => i.type === t);
      return ing && ing.count > 0;
    });
    if (availableTypes.length > 0) {
      const currentIdx = gameState.selectedIngredientType ? availableTypes.indexOf(gameState.selectedIngredientType) : -1;
      const nextIdx = keyCode === 38 ? 
        (currentIdx - 1 + availableTypes.length) % availableTypes.length :
        (currentIdx + 1) % availableTypes.length;
      gameState.selectedIngredientType = availableTypes[nextIdx];
    }
  } else if (keyCode === 32) { // SPACE
    if (canBrewPotion()) {
      brewPotion();
      gameState.playPhase = PLAY_PHASES.SHOP_MENU;
    } else if (gameState.selectedIngredientType) {
      selectIngredientForSlot(gameState.selectedIngredientType);
    } else {
      // Auto-select first available ingredient
      for (const ing of gameState.ingredients) {
        if (ing.count > 0) {
          selectIngredientForSlot(ing.type);
          break;
        }
      }
    }
  }
}

function handleNegotiationInput(keyCode) {
  if (keyCode === 37) { // LEFT
    gameState.selectedCard = Math.max(0, gameState.selectedCard - 1);
  } else if (keyCode === 39) { // RIGHT
    gameState.selectedCard = Math.min(gameState.negotiationCards.length - 1, gameState.selectedCard + 1);
  } else if (keyCode === 32) { // SPACE
    playNegotiationCard();
    const result = checkNegotiationEnd();
    if (result) {
      completeNegotiation(result);
    }
  } else if (keyCode === 90) { // Z - forfeit
    completeNegotiation("CUSTOMER_LEFT");
  }
}