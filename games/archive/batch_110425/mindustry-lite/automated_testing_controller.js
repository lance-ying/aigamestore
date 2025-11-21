// automated_testing_controller.js - Automated testing functions

import { gameState, BUILDING_TYPES, GRID_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { canPlaceBuildingAt, canAffordBuilding } from './game_logic.js';

function getTestWinAction(gameState) {
  const action = { keyPressed: [], keysHeld: [] };
  
  // Stage 1: Build resource extraction (first 300 frames)
  if (gameState.waveTimer < 300) {
    return buildResourceExtraction(gameState);
  }
  
  // Stage 2: Build factories (300-600 frames)
  if (gameState.waveTimer < 600) {
    return buildFactories(gameState);
  }
  
  // Stage 3: Build defenses (600-900 frames)
  if (gameState.waveTimer < 900) {
    return buildDefenses(gameState);
  }
  
  // Stage 4: Build unit factories and maintain defenses
  return buildUnitsAndMaintain(gameState);
}

function buildResourceExtraction(gameState) {
  const action = { keyPressed: [], keysHeld: [] };
  
  // Find resource deposits and place drills
  if (gameState.resourceMap) {
    for (const key in gameState.resourceMap) {
      const [x, y] = key.split(',').map(Number);
      
      // Check if we already have a drill here
      const hasDrill = gameState.buildings.some(b => 
        b.gridX === x && b.gridY === y && b.type === BUILDING_TYPES.DRILL
      );
      
      if (!hasDrill && canAffordBuilding(BUILDING_TYPES.DRILL)) {
        // Move camera to position
        const targetCameraX = x * GRID_SIZE - CANVAS_WIDTH / 2;
        const targetCameraY = y * GRID_SIZE - CANVAS_HEIGHT / 2;
        
        if (Math.abs(gameState.camera.x - targetCameraX) > 10) {
          action.keysHeld.push(gameState.camera.x < targetCameraX ? 39 : 37);
        } else if (Math.abs(gameState.camera.y - targetCameraY) > 10) {
          action.keysHeld.push(gameState.camera.y < targetCameraY ? 40 : 38);
        } else {
          // Select drill and place
          while (gameState.selectedBuilding !== BUILDING_TYPES.DRILL) {
            action.keyPressed.push(16); // SHIFT
          }
          action.keyPressed.push(32); // SPACE
          return action;
        }
        return action;
      }
    }
  }
  
  // Place conveyors connecting drills to core
  const drills = gameState.buildings.filter(b => b.type === BUILDING_TYPES.DRILL);
  if (drills.length > 0 && canAffordBuilding(BUILDING_TYPES.CONVEYOR)) {
    const drill = drills[0];
    const coreX = gameState.core.gridX + 1;
    const coreY = gameState.core.gridY + 1;
    
    // Find path from drill to core
    const pathX = drill.gridX < coreX ? drill.gridX + 1 : drill.gridX - 1;
    const pathY = drill.gridY;
    
    if (canPlaceBuildingAt(pathX, pathY, BUILDING_TYPES.CONVEYOR)) {
      const targetCameraX = pathX * GRID_SIZE - CANVAS_WIDTH / 2;
      const targetCameraY = pathY * GRID_SIZE - CANVAS_HEIGHT / 2;
      
      if (Math.abs(gameState.camera.x - targetCameraX) > 10) {
        action.keysHeld.push(gameState.camera.x < targetCameraX ? 39 : 37);
      } else if (Math.abs(gameState.camera.y - targetCameraY) > 10) {
        action.keysHeld.push(gameState.camera.y < targetCameraY ? 40 : 38);
      } else {
        while (gameState.selectedBuilding !== BUILDING_TYPES.CONVEYOR) {
          action.keyPressed.push(16);
        }
        action.keyPressed.push(32);
      }
    }
  }
  
  return action;
}

function buildFactories(gameState) {
  const action = { keyPressed: [], keysHeld: [] };
  
  const factories = gameState.buildings.filter(b => b.type === BUILDING_TYPES.FACTORY);
  
  if (factories.length < 2 && canAffordBuilding(BUILDING_TYPES.FACTORY)) {
    const coreX = gameState.core.gridX;
    const coreY = gameState.core.gridY;
    
    // Place factory near core
    const positions = [
      { x: coreX - 2, y: coreY },
      { x: coreX + 3, y: coreY },
      { x: coreX, y: coreY - 2 },
      { x: coreX, y: coreY + 3 }
    ];
    
    for (const pos of positions) {
      if (canPlaceBuildingAt(pos.x, pos.y, BUILDING_TYPES.FACTORY)) {
        const targetCameraX = pos.x * GRID_SIZE - CANVAS_WIDTH / 2;
        const targetCameraY = pos.y * GRID_SIZE - CANVAS_HEIGHT / 2;
        
        if (Math.abs(gameState.camera.x - targetCameraX) > 10) {
          action.keysHeld.push(gameState.camera.x < targetCameraX ? 39 : 37);
        } else if (Math.abs(gameState.camera.y - targetCameraY) > 10) {
          action.keysHeld.push(gameState.camera.y < targetCameraY ? 40 : 38);
        } else {
          while (gameState.selectedBuilding !== BUILDING_TYPES.FACTORY) {
            action.keyPressed.push(16);
          }
          action.keyPressed.push(32);
        }
        return action;
      }
    }
  }
  
  return action;
}

function buildDefenses(gameState) {
  const action = { keyPressed: [], keysHeld: [] };
  
  const turrets = gameState.buildings.filter(b => b.type === BUILDING_TYPES.TURRET);
  
  if (turrets.length < 6 && canAffordBuilding(BUILDING_TYPES.TURRET)) {
    const coreX = gameState.core.gridX;
    const coreY = gameState.core.gridY;
    
    // Place turrets in a circle around core
    const positions = [
      { x: coreX - 3, y: coreY - 1 },
      { x: coreX + 4, y: coreY - 1 },
      { x: coreX - 1, y: coreY - 3 },
      { x: coreX - 1, y: coreY + 4 },
      { x: coreX - 3, y: coreY + 2 },
      { x: coreX + 4, y: coreY + 2 }
    ];
    
    for (const pos of positions) {
      if (canPlaceBuildingAt(pos.x, pos.y, BUILDING_TYPES.TURRET)) {
        const targetCameraX = pos.x * GRID_SIZE - CANVAS_WIDTH / 2;
        const targetCameraY = pos.y * GRID_SIZE - CANVAS_HEIGHT / 2;
        
        if (Math.abs(gameState.camera.x - targetCameraX) > 10) {
          action.keysHeld.push(gameState.camera.x < targetCameraX ? 39 : 37);
        } else if (Math.abs(gameState.camera.y - targetCameraY) > 10) {
          action.keysHeld.push(gameState.camera.y < targetCameraY ? 40 : 38);
        } else {
          while (gameState.selectedBuilding !== BUILDING_TYPES.TURRET) {
            action.keyPressed.push(16);
          }
          action.keyPressed.push(32);
        }
        return action;
      }
    }
  }
  
  return action;
}

function buildUnitsAndMaintain(gameState) {
  const action = { keyPressed: [], keysHeld: [] };
  
  const unitFactories = gameState.buildings.filter(b => b.type === BUILDING_TYPES.UNIT_FACTORY);
  
  if (unitFactories.length < 1 && canAffordBuilding(BUILDING_TYPES.UNIT_FACTORY)) {
    const coreX = gameState.core.gridX;
    const coreY = gameState.core.gridY;
    
    const pos = { x: coreX - 4, y: coreY };
    
    if (canPlaceBuildingAt(pos.x, pos.y, BUILDING_TYPES.UNIT_FACTORY)) {
      const targetCameraX = pos.x * GRID_SIZE - CANVAS_WIDTH / 2;
      const targetCameraY = pos.y * GRID_SIZE - CANVAS_HEIGHT / 2;
      
      if (Math.abs(gameState.camera.x - targetCameraX) > 10) {
        action.keysHeld.push(gameState.camera.x < targetCameraX ? 39 : 37);
      } else if (Math.abs(gameState.camera.y - targetCameraY) > 10) {
        action.keysHeld.push(gameState.camera.y < targetCameraY ? 40 : 38);
      } else {
        while (gameState.selectedBuilding !== BUILDING_TYPES.UNIT_FACTORY) {
          action.keyPressed.push(16);
        }
        action.keyPressed.push(32);
      }
      return action;
    }
  }
  
  // Continue building more turrets if we have resources
  return buildDefenses(gameState);
}

function getBasicTestAction(gameState) {
  const action = { keyPressed: [], keysHeld: [] };
  
  // Test camera movement
  if (gameState.waveTimer % 120 < 30) {
    action.keysHeld.push(39); // RIGHT
  } else if (gameState.waveTimer % 120 < 60) {
    action.keysHeld.push(40); // DOWN
  } else if (gameState.waveTimer % 120 < 90) {
    action.keysHeld.push(37); // LEFT
  } else {
    action.keysHeld.push(38); // UP
  }
  
  // Test building cycling
  if (gameState.waveTimer % 180 === 0) {
    action.keyPressed.push(16); // SHIFT
  }
  
  // Try to place building occasionally
  if (gameState.waveTimer % 240 === 0 && canAffordBuilding(gameState.selectedBuilding)) {
    action.keyPressed.push(32); // SPACE
  }
  
  return action;
}

function getResourceFlowTestAction(gameState) {
  const action = { keyPressed: [], keysHeld: [] };
  
  // Focus on building drills and conveyors
  if (gameState.waveTimer < 600) {
    return buildResourceExtraction(gameState);
  }
  
  // Then build factories
  if (gameState.waveTimer < 1200) {
    return buildFactories(gameState);
  }
  
  // Monitor resource flow - just maintain camera position
  return action;
}

function getDefenseTestAction(gameState) {
  const action = { keyPressed: [], keysHeld: [] };
  
  // Quickly build defenses
  if (gameState.waveTimer < 400) {
    // Give ourselves resources for testing
    return buildDefenses(gameState);
  }
  
  // Focus camera on core to watch defense
  const coreX = gameState.core.gridX * GRID_SIZE - CANVAS_WIDTH / 2;
  const coreY = gameState.core.gridY * GRID_SIZE - CANVAS_HEIGHT / 2;
  
  if (Math.abs(gameState.camera.x - coreX) > 5) {
    action.keysHeld.push(gameState.camera.x < coreX ? 39 : 37);
  } else if (Math.abs(gameState.camera.y - coreY) > 5) {
    action.keysHeld.push(gameState.camera.y < coreY ? 40 : 38);
  }
  
  return action;
}

function getRandomAction(gameState) {
  const action = { keyPressed: [], keysHeld: [] };
  
  const random = Math.random();
  
  if (random < 0.25) {
    action.keysHeld.push(37); // LEFT
  } else if (random < 0.5) {
    action.keysHeld.push(39); // RIGHT
  } else if (random < 0.75) {
    action.keysHeld.push(38); // UP
  } else {
    action.keysHeld.push(40); // DOWN
  }
  
  if (Math.random() < 0.05) {
    action.keyPressed.push(16); // SHIFT
  }
  
  if (Math.random() < 0.02) {
    action.keyPressed.push(32); // SPACE
  }
  
  return action;
}

export function get_automated_testing_action(gameState) {
  if (!gameState || gameState.gamePhase !== 'PLAYING') {
    return { keyPressed: [], keysHeld: [] };
  }
  
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getResourceFlowTestAction(gameState);
    case "TEST_4":
      return getDefenseTestAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;