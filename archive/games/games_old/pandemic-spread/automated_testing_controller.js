import { KEYS, gameState, PHASES, EVOLUTION_CATEGORIES } from './globals.js';

// Basic sticky keys test to ensure the game runs without errors
function getStickyKeysAction(gameState) {
  // Only take actions during the PLAYING phase
  if (gameState.gamePhase !== PHASES.PLAYING) {
    return null;
  }
  
  // Change action every 60 frames (about 1 second)
  const actionCycle = Math.floor(gameState.framesSinceLastDnaGain / 60) % 6;
  
  switch (actionCycle) {
    case 0: return KEYS.UP;
    case 1: return KEYS.DOWN;
    case 2: return KEYS.LEFT;
    case 3: return KEYS.RIGHT;
    case 4: return KEYS.SPACE;
    case 5: return KEYS.Z;
    default: return null;
  }
}

// Test to demonstrate winning the game with optimal strategy
function getTestWinAction(gameState) {
  // Only take actions during the PLAYING phase
  if (gameState.gamePhase !== PHASES.PLAYING) {
    return null;
  }
  
  // Get the current selected category and upgrade
  const currentCategory = gameState.evolutionMenu.categories[gameState.evolutionMenu.selectedCategory];
  const currentUpgradeIndex = gameState.evolutionMenu.selectedUpgrade;
  const currentUpgrade = gameState.evolutions[currentCategory][currentUpgradeIndex];
  
  // Prioritize transmission upgrades first
  const transmissionPriorities = ['air1', 'water1', 'air2', 'water2', 'animal1', 'insect1'];
  const resistancePriorities = ['cold1', 'heat1', 'humid1', 'drug1', 'cold2', 'heat2', 'drug2'];
  const symptomPriorities = ['cough', 'sneeze', 'nausea', 'rash', 'insomnia', 'pneumonia'];
  
  // Check if we can purchase the current upgrade
  const canPurchase = currentUpgrade && !currentUpgrade.purchased && 
                      gameState.dnaPoints >= currentUpgrade.cost &&
                      (!currentUpgrade.prerequisites || currentUpgrade.prerequisites.every(prereq => {
                        // Find which category the prerequisite is in
                        for (const cat of Object.keys(gameState.evolutions)) {
                          const found = gameState.evolutions[cat].find(e => e.id === prereq);
                          if (found && found.purchased) return true;
                        }
                        return false;
                      }));
  
  // If we can purchase the current upgrade and it's in our priority list, do it
  if (canPurchase) {
    // Check if this upgrade is in our priority list based on current category
    let shouldPurchase = false;
    
    if (currentCategory === EVOLUTION_CATEGORIES.TRANSMISSION) {
      shouldPurchase = transmissionPriorities.includes(currentUpgrade.id);
    } else if (currentCategory === EVOLUTION_CATEGORIES.RESISTANCES) {
      shouldPurchase = resistancePriorities.includes(currentUpgrade.id);
    } else if (currentCategory === EVOLUTION_CATEGORIES.SYMPTOMS) {
      shouldPurchase = symptomPriorities.includes(currentUpgrade.id);
    }
    
    if (shouldPurchase) {
      return KEYS.SPACE;
    }
  }
  
  // Navigate to find the next priority upgrade
  // First, try to find a transmission upgrade if we don't have all of them
  const allTransmissionPurchased = transmissionPriorities.every(id => {
    const upgrade = gameState.evolutions[EVOLUTION_CATEGORIES.TRANSMISSION].find(e => e.id === id);
    return upgrade && upgrade.purchased;
  });
  
  // Then focus on resistances
  const allResistancesPurchased = resistancePriorities.every(id => {
    const upgrade = gameState.evolutions[EVOLUTION_CATEGORIES.RESISTANCES].find(e => e.id === id);
    return upgrade && upgrade.purchased;
  });
  
  // Finally, get symptoms
  const allSymptomsPurchased = symptomPriorities.every(id => {
    const upgrade = gameState.evolutions[EVOLUTION_CATEGORIES.SYMPTOMS].find(e => e.id === id);
    return upgrade && upgrade.purchased;
  });
  
  // Determine which category to focus on
  let targetCategory = EVOLUTION_CATEGORIES.TRANSMISSION;
  let targetPriorities = transmissionPriorities;
  
  if (allTransmissionPurchased && !allResistancesPurchased) {
    targetCategory = EVOLUTION_CATEGORIES.RESISTANCES;
    targetPriorities = resistancePriorities;
  } else if (allTransmissionPurchased && allResistancesPurchased && !allSymptomsPurchased) {
    targetCategory = EVOLUTION_CATEGORIES.SYMPTOMS;
    targetPriorities = symptomPriorities;
  }
  
  // Navigate to the target category if needed
  const categoryIndex = gameState.evolutionMenu.categories.indexOf(targetCategory);
  if (gameState.evolutionMenu.selectedCategory !== categoryIndex) {
    if (gameState.evolutionMenu.selectedCategory < categoryIndex) {
      return KEYS.RIGHT;
    } else {
      return KEYS.LEFT;
    }
  }
  
  // Find the next unpurchased upgrade in our priority list
  for (const priorityId of targetPriorities) {
    const upgradeIndex = gameState.evolutions[targetCategory].findIndex(e => e.id === priorityId && !e.purchased);
    if (upgradeIndex !== -1) {
      // Navigate to this upgrade
      if (gameState.evolutionMenu.selectedUpgrade < upgradeIndex) {
        return KEYS.DOWN;
      } else if (gameState.evolutionMenu.selectedUpgrade > upgradeIndex) {
        return KEYS.UP;
      }
      // If we're already on it, the next iteration will try to purchase it
      break;
    }
  }
  
  // If we can't find any more priorities, toggle info view occasionally to check progress
  if (Math.random() < 0.01) {
    return KEYS.Z;
  }
  
  // No specific action needed right now
  return null;
}

// Test to demonstrate losing the game with poor strategy
function getTestLoseAction(gameState) {
  // Only take actions during the PLAYING phase
  if (gameState.gamePhase !== PHASES.PLAYING) {
    return null;
  }
  
  // Get the current selected category and upgrade
  const currentCategory = gameState.evolutionMenu.categories[gameState.evolutionMenu.selectedCategory];
  const currentUpgradeIndex = gameState.evolutionMenu.selectedUpgrade;
  const currentUpgrade = gameState.evolutions[currentCategory][currentUpgradeIndex];
  
  // Deliberately make poor choices - focus on symptoms first which increases visibility
  // without good transmission, leading to faster cure development
  const symptomPriorities = ['cough', 'sneeze', 'nausea', 'rash', 'insomnia', 'pneumonia'];
  
  // Check if we can purchase the current upgrade
  const canPurchase = currentUpgrade && !currentUpgrade.purchased && 
                      gameState.dnaPoints >= currentUpgrade.cost &&
                      (!currentUpgrade.prerequisites || currentUpgrade.prerequisites.every(prereq => {
                        // Find which category the prerequisite is in
                        for (const cat of Object.keys(gameState.evolutions)) {
                          const found = gameState.evolutions[cat].find(e => e.id === prereq);
                          if (found && found.purchased) return true;
                        }
                        return false;
                      }));
  
  // If we can purchase the current upgrade and it's a symptom, do it
  if (canPurchase && currentCategory === EVOLUTION_CATEGORIES.SYMPTOMS) {
    return KEYS.SPACE;
  }
  
  // Navigate to the symptoms category
  const symptomsIndex = gameState.evolutionMenu.categories.indexOf(EVOLUTION_CATEGORIES.SYMPTOMS);
  if (gameState.evolutionMenu.selectedCategory !== symptomsIndex) {
    if (gameState.evolutionMenu.selectedCategory < symptomsIndex) {
      return KEYS.RIGHT;
    } else {
      return KEYS.LEFT;
    }
  }
  
  // Find the next unpurchased symptom
  for (const priorityId of symptomPriorities) {
    const upgradeIndex = gameState.evolutions[EVOLUTION_CATEGORIES.SYMPTOMS].findIndex(e => e.id === priorityId && !e.purchased);
    if (upgradeIndex !== -1) {
      // Navigate to this upgrade
      if (gameState.evolutionMenu.selectedUpgrade < upgradeIndex) {
        return KEYS.DOWN;
      } else if (gameState.evolutionMenu.selectedUpgrade > upgradeIndex) {
        return KEYS.UP;
      }
      break;
    }
  }
  
  // If we've purchased all symptoms or can't afford any more, buy minimal transmission
  if (gameState.dnaPoints >= 5 && 
      !gameState.evolutions[EVOLUTION_CATEGORIES.TRANSMISSION][0].purchased) {
    // Navigate to Transmission > Air 1
    if (gameState.evolutionMenu.selectedCategory !== 0) {
      return KEYS.LEFT;
    }
    if (gameState.evolutionMenu.selectedUpgrade !== 0) {
      return KEYS.UP;
    }
    return KEYS.SPACE;
  }
  
  // Toggle info view occasionally to check progress
  if (Math.random() < 0.02) {
    return KEYS.Z;
  }
  
  return null;
}

// Test minimal spending strategy
function getTestMinimalSpendingAction(gameState) {
  // Only take actions during the PLAYING phase
  if (gameState.gamePhase !== PHASES.PLAYING) {
    return null;
  }
  
  // Get the current selected category and upgrade
  const currentCategory = gameState.evolutionMenu.categories[gameState.evolutionMenu.selectedCategory];
  const currentUpgradeIndex = gameState.evolutionMenu.selectedUpgrade;
  const currentUpgrade = gameState.evolutions[currentCategory][currentUpgradeIndex];
  
  // Minimal essential upgrades - just enough to win
  const essentialUpgrades = ['air1', 'water1', 'cold1', 'heat1'];
  
  // Check if we can purchase the current upgrade
  const canPurchase = currentUpgrade && !currentUpgrade.purchased && 
                      gameState.dnaPoints >= currentUpgrade.cost &&
                      (!currentUpgrade.prerequisites || currentUpgrade.prerequisites.every(prereq => {
                        // Find which category the prerequisite is in
                        for (const cat of Object.keys(gameState.evolutions)) {
                          const found = gameState.evolutions[cat].find(e => e.id === prereq);
                          if (found && found.purchased) return true;
                        }
                        return false;
                      }));
  
  // If we can purchase the current upgrade and it's essential, do it
  if (canPurchase && essentialUpgrades.includes(currentUpgrade.id)) {
    return KEYS.SPACE;
  }
  
  // Navigate to find essential upgrades
  for (const upgradeId of essentialUpgrades) {
    // Find which category this upgrade is in
    let targetCategory = null;
    let upgradeIndex = -1;
    
    for (const category of Object.keys(gameState.evolutions)) {
      const index = gameState.evolutions[category].findIndex(e => e.id === upgradeId && !e.purchased);
      if (index !== -1) {
        targetCategory = category;
        upgradeIndex = index;
        break;
      }
    }
    
    if (targetCategory && upgradeIndex !== -1) {
      // Navigate to this category
      const categoryIndex = gameState.evolutionMenu.categories.indexOf(targetCategory);
      if (gameState.evolutionMenu.selectedCategory !== categoryIndex) {
        if (gameState.evolutionMenu.selectedCategory < categoryIndex) {
          return KEYS.RIGHT;
        } else {
          return KEYS.LEFT;
        }
      }
      
      // Navigate to this upgrade
      if (gameState.evolutionMenu.selectedUpgrade < upgradeIndex) {
        return KEYS.DOWN;
      } else if (gameState.evolutionMenu.selectedUpgrade > upgradeIndex) {
        return KEYS.UP;
      }
      
      break;
    }
  }
  
  // Check if we've purchased all essential upgrades
  const allEssentialsPurchased = essentialUpgrades.every(id => {
    for (const category of Object.keys(gameState.evolutions)) {
      const upgrade = gameState.evolutions[category].find(e => e.id === id);
      if (upgrade && upgrade.purchased) return true;
    }
    return false;
  });
  
  // If we have all essentials, just toggle info view to check progress
  if (allEssentialsPurchased && Math.random() < 0.05) {
    return KEYS.Z;
  }
  
  return null;
}

// Test information toggle system
function getTestInfoToggleAction(gameState) {
  // Only take actions during the PLAYING phase
  if (gameState.gamePhase !== PHASES.PLAYING) {
    return null;
  }
  
  // Toggle info view frequently to test it works correctly
  if (Math.random() < 0.1) {
    return KEYS.Z;
  }
  
  // Also test country selection with SHIFT+arrow keys
  if (Math.random() < 0.05) {
    return KEYS.SHIFT;
  }
  
  if (gameState.lastKeyPressed === KEYS.SHIFT && Math.random() < 0.5) {
    return Math.random() < 0.5 ? KEYS.LEFT : KEYS.RIGHT;
  }
  
  // Otherwise do basic navigation and purchases
  return getStickyKeysAction(gameState);
}

// Main testing controller function
export function game_testing_controller(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getStickyKeysAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getTestLoseAction(gameState);
    case "TEST_4":
      return getTestMinimalSpendingAction(gameState);
    case "TEST_5":
      return getTestInfoToggleAction(gameState);
    default:
      return getStickyKeysAction(gameState);
  }
}

// Expose the game_testing_controller function globally
window.game_testing_controller = game_testing_controller;
export default game_testing_controller;