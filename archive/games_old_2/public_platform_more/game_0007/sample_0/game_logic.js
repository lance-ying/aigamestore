// game_logic.js - Core game logic

import { gameState, GAME_PHASES } from './globals.js';
import { getRecipeResult, getCategorizedElements, ELEMENT_RECIPES } from './elements.js';

export function initializeGame() {
  // Initialize discovered elements with starting four
  gameState.discoveredElements = new Set(["Air", "Earth", "Fire", "Water"]);
  gameState.unlockedCategories = new Set(["Basic"]);
  
  gameState.selectedCategory = 0;
  gameState.selectedElementIndex = 0;
  gameState.firstSelectedElement = null;
  
  gameState.animations = [];
  gameState.totalCombinations = 0;
  gameState.successfulCombinations = 0;
  gameState.score = 0;
  
  gameState.entities = [];
  gameState.player = null; // Not used in this game but required by structure
}

export function handleElementSelection(p) {
  const categorized = getCategorizedElements(gameState.discoveredElements);
  const categories = Object.keys(categorized).sort();
  
  if (categories.length === 0) return;
  
  const currentCategory = categories[gameState.selectedCategory];
  const elements = categorized[currentCategory];
  
  if (!elements || elements.length === 0) return;
  
  const selectedElement = elements[gameState.selectedElementIndex];
  
  if (!gameState.firstSelectedElement) {
    // First selection
    gameState.firstSelectedElement = selectedElement;
  } else {
    // Second selection - attempt combination
    attemptCombination(p, gameState.firstSelectedElement, selectedElement);
    gameState.firstSelectedElement = null;
  }
}

export function attemptCombination(p, elem1, elem2) {
  gameState.totalCombinations++;
  
  const result = getRecipeResult(elem1, elem2);
  
  if (result && !gameState.discoveredElements.has(result)) {
    // Successful new discovery!
    gameState.discoveredElements.add(result);
    gameState.successfulCombinations++;
    gameState.score += 100;
    
    const resultData = ELEMENT_RECIPES[result];
    if (resultData && !gameState.unlockedCategories.has(resultData.category)) {
      gameState.unlockedCategories.add(resultData.category);
      gameState.score += 500; // Bonus for new category
    }
    
    // Create discovery animation
    gameState.animations.push({
      type: 'discovery',
      element: result,
      x: p.width / 2,
      y: p.height / 2,
      time: 0,
      duration: 60
    });
    
    // Log discovery
    if (p.logs) {
      p.logs.game_info.push({
        data: `Discovered: ${result} (${elem1} + ${elem2})`,
        framecount: p.frameCount,
        timestamp: Date.now()
      });
    }
    
    // Check win condition
    if (gameState.discoveredElements.size >= gameState.totalElementsInGame) {
      gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
      
      if (p.logs) {
        p.logs.game_info.push({
          data: "GAME_OVER_WIN - All elements discovered!",
          framecount: p.frameCount,
          timestamp: Date.now()
        });
      }
    }
  } else if (result && gameState.discoveredElements.has(result)) {
    // Already discovered
    gameState.animations.push({
      type: 'failed',
      x: p.width / 2,
      y: p.height / 2 + 100,
      time: 0,
      duration: 40
    });
  } else {
    // No combination exists
    gameState.animations.push({
      type: 'failed',
      x: p.width / 2,
      y: p.height / 2 + 100,
      time: 0,
      duration: 40
    });
  }
}

export function navigateUp() {
  if (gameState.firstSelectedElement) return; // Don't navigate while selecting
  
  if (gameState.selectedElementIndex > 0) {
    gameState.selectedElementIndex--;
  } else {
    // Move to previous category
    if (gameState.selectedCategory > 0) {
      gameState.selectedCategory--;
      const categorized = getCategorizedElements(gameState.discoveredElements);
      const categories = Object.keys(categorized).sort();
      const newCategory = categories[gameState.selectedCategory];
      gameState.selectedElementIndex = categorized[newCategory].length - 1;
    }
  }
}

export function navigateDown() {
  if (gameState.firstSelectedElement) return;
  
  const categorized = getCategorizedElements(gameState.discoveredElements);
  const categories = Object.keys(categorized).sort();
  const currentCategory = categories[gameState.selectedCategory];
  const elements = categorized[currentCategory];
  
  if (gameState.selectedElementIndex < elements.length - 1) {
    gameState.selectedElementIndex++;
  } else {
    // Move to next category
    if (gameState.selectedCategory < categories.length - 1) {
      gameState.selectedCategory++;
      gameState.selectedElementIndex = 0;
    }
  }
}

export function navigateLeft() {
  if (gameState.firstSelectedElement) {
    // Cancel selection
    gameState.firstSelectedElement = null;
    return;
  }
  
  if (gameState.selectedCategory > 0) {
    gameState.selectedCategory--;
    gameState.selectedElementIndex = 0;
  }
}

export function navigateRight() {
  if (gameState.firstSelectedElement) return;
  
  const categorized = getCategorizedElements(gameState.discoveredElements);
  const categories = Object.keys(categorized).sort();
  
  if (gameState.selectedCategory < categories.length - 1) {
    gameState.selectedCategory++;
    gameState.selectedElementIndex = 0;
  }
}