// automated_testing_controller.js - Automated testing strategies

import { gameState, GAME_PHASES } from './globals.js';

function getTestWinAction(gameState) {
  // Strategy: Optimal path to win
  // 1. Assign workers to gather resources
  // 2. Build processing buildings
  // 3. Train hunters and equip them
  // 4. Form alliance and defeat creatures progressively
  // 5. Defeat dragon
  
  // Speed up time when possible
  if (gameState.gamePhase === GAME_PHASES.PLAYING && !gameState.menuOpen) {
    // Check if we need to do actions
    const needsAction = 
      gameState.buildings.some(b => b.canAssignWorker()) ||
      !gameState.buildings.some(b => b.type === 'sawmill') ||
      !gameState.buildings.some(b => b.type === 'forge') ||
      !gameState.buildings.some(b => b.type === 'training_ground');
    
    if (!needsAction && !gameState.activeAlliance?.onExpedition) {
      // Speed up time
      return { keyCode: 16 }; // SHIFT
    }
  }
  
  // Phase 1: Assign workers to resource buildings
  if (gameState.idleVillagers > 0) {
    const unassignedBuilding = gameState.buildings.find(b => 
      (b.type === 'wood_camp' || b.type === 'stone_quarry' || b.type === 'farm') && 
      b.canAssignWorker()
    );
    
    if (unassignedBuilding) {
      // Navigate to building
      const currentIndex = gameState.buildings.indexOf(gameState.selectedBuilding);
      const targetIndex = gameState.buildings.indexOf(unassignedBuilding);
      
      if (currentIndex !== targetIndex) {
        return { keyCode: 39 }; // RIGHT to navigate
      } else {
        return { keyCode: 32 }; // SPACE to assign worker
      }
    }
  }
  
  // Phase 2: Build processing buildings
  const hasSawmill = gameState.buildings.some(b => b.type === 'sawmill');
  const hasForge = gameState.buildings.some(b => b.type === 'forge');
  const hasTraining = gameState.buildings.some(b => b.type === 'training_ground');
  
  if (!hasSawmill && gameState.resources.wood >= 20 && gameState.resources.stone >= 10 && gameState.resources.gold >= 50) {
    if (!gameState.menuOpen) {
      return { keyCode: 90 }; // Z to open menu
    } else if (gameState.menuType === 'build') {
      if (gameState.craftingIndex !== 0) {
        return { keyCode: 38 }; // UP to navigate to sawmill
      } else {
        return { keyCode: 32 }; // SPACE to build
      }
    }
  }
  
  if (!hasForge && gameState.resources.wood >= 15 && gameState.resources.stone >= 25 && gameState.resources.gold >= 75) {
    if (!gameState.menuOpen) {
      return { keyCode: 90 }; // Z to open menu
    } else if (gameState.menuType === 'build') {
      if (gameState.craftingIndex !== 1) {
        return { keyCode: 40 }; // DOWN to navigate to forge
      } else {
        return { keyCode: 32 }; // SPACE to build
      }
    }
  }
  
  if (!hasTraining && gameState.resources.wood >= 30 && gameState.resources.stone >= 20 && gameState.resources.gold >= 100) {
    if (!gameState.menuOpen) {
      return { keyCode: 90 }; // Z to open menu
    } else if (gameState.menuType === 'build') {
      if (gameState.craftingIndex !== 2) {
        return { keyCode: 40 }; // DOWN
      } else {
        return { keyCode: 32 }; // SPACE to build
      }
    }
  }
  
  // Assign workers to processing buildings
  if (hasSawmill || hasForge) {
    const processingBuilding = gameState.buildings.find(b => 
      (b.type === 'sawmill' || b.type === 'forge') && 
      b.canAssignWorker()
    );
    
    if (processingBuilding && gameState.idleVillagers > 0) {
      const currentIndex = gameState.buildings.indexOf(gameState.selectedBuilding);
      const targetIndex = gameState.buildings.indexOf(processingBuilding);
      
      if (currentIndex !== targetIndex) {
        return { keyCode: 39 }; // RIGHT
      } else {
        return { keyCode: 32 }; // SPACE
      }
    }
  }
  
  // Phase 3: Train hunters
  if (hasTraining && gameState.hunters.length < 6) {
    if (gameState.resources.gold >= 50 && gameState.resources.food >= 20) {
      if (!gameState.menuOpen) {
        return { keyCode: 90 }; // Z to open craft menu
      } else if (gameState.menuType === 'craft') {
        if (gameState.craftingIndex !== 5) {
          return { keyCode: 40 }; // DOWN to train hunter
        } else {
          return { keyCode: 32 }; // SPACE to train
        }
      }
    }
  }
  
  // Phase 4: Craft equipment for hunters
  if (gameState.hunters.length > 0) {
    const needsWeapon = gameState.hunters.find(h => !h.equipment.weapon);
    const needsArmor = gameState.hunters.find(h => !h.equipment.armor);
    
    if (needsWeapon && gameState.resources.processed_wood >= 3) {
      if (!gameState.menuOpen) {
        return { keyCode: 90 }; // Z
      } else if (gameState.menuType === 'craft') {
        if (gameState.craftingIndex !== 0) {
          return { keyCode: 38 }; // UP to wooden sword
        } else {
          return { keyCode: 32 }; // SPACE
        }
      }
    }
    
    if (needsArmor && gameState.resources.processed_wood >= 5) {
      if (!gameState.menuOpen) {
        return { keyCode: 90 }; // Z
      } else if (gameState.menuType === 'craft') {
        if (gameState.craftingIndex !== 2) {
          return { keyCode: 40 }; // DOWN
        } else {
          return { keyCode: 32 }; // SPACE
        }
      }
    }
  }
  
  // Phase 5: Send alliance on expeditions
  if (gameState.hunters.length >= 3 && !gameState.activeAlliance?.onExpedition) {
    const healthyHunters = gameState.hunters.filter(h => h.hp > 0).length;
    
    if (healthyHunters >= 3) {
      // Find next undefeated creature
      const nextCreature = gameState.creatures.find(c => !gameState.defeatedCreatures.includes(c.name));
      
      if (nextCreature) {
        const creatureIndex = gameState.creatures.indexOf(nextCreature);
        
        if (!gameState.menuOpen) {
          return { keyCode: 90 }; // Z to open expedition menu
        } else if (gameState.menuType === 'expedition') {
          if (gameState.craftingIndex !== creatureIndex) {
            return { keyCode: 40 }; // DOWN to navigate
          } else {
            return { keyCode: 32 }; // SPACE to send
          }
        }
      }
    }
  }
  
  // Close menu if open and no action needed
  if (gameState.menuOpen) {
    return { keyCode: 90 }; // Z to close
  }
  
  // Default: speed up time
  return { keyCode: 16 }; // SHIFT
}

function getBasicTestAction(gameState) {
  // Simple test: cycle through buildings and assign workers
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  if (gameState.menuOpen) {
    return { keyCode: 90 }; // Close menu
  }
  
  // Assign workers to buildings
  if (gameState.selectedBuilding && gameState.selectedBuilding.canAssignWorker()) {
    return { keyCode: 32 }; // SPACE
  }
  
  // Navigate to next building
  return { keyCode: 39 }; // RIGHT
}

function getRandomAction(gameState) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) {
    return null;
  }
  
  const actions = [37, 39, 32, 90]; // LEFT, RIGHT, SPACE, Z
  const randomIndex = Math.floor(Math.random() * actions.length);
  return { keyCode: actions[randomIndex] };
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

// Expose globally
window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;