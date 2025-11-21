import { gameState, TOWER_TYPES } from './globals.js';

let testState = {
  phase: "INIT",
  targetTowerIndex: 0,
  placementAttempts: 0,
  framesSinceLastAction: 0,
  towersPlaced: 0,
  upgradeAttempts: 0,
  lastX: 0,
  lastY: 0,
  stuckCounter: 0
};

function getTestBasicAction(gs) {
  testState.framesSinceLastAction++;
  
  if (testState.framesSinceLastAction < 10) {
    return [];
  }
  
  const types = Object.keys(TOWER_TYPES);
  
  if (testState.phase === "INIT") {
    testState.phase = "SELECT_TOWER";
    testState.framesSinceLastAction = 0;
    return [39];
  }
  
  if (testState.phase === "SELECT_TOWER") {
    if (testState.targetTowerIndex < types.length) {
      testState.targetTowerIndex++;
      testState.framesSinceLastAction = 0;
      return [39];
    } else {
      testState.phase = "PLACE_TOWER";
      testState.framesSinceLastAction = 0;
      return [32];
    }
  }
  
  if (testState.phase === "PLACE_TOWER") {
    if (!gs.placementMode) {
      testState.framesSinceLastAction = 0;
      return [32];
    }
    
    testState.placementAttempts++;
    
    if (testState.placementAttempts < 20) {
      const action = testState.placementAttempts % 2 === 0 ? 39 : 40;
      testState.framesSinceLastAction = 0;
      return [action];
    } else {
      testState.framesSinceLastAction = 0;
      testState.placementAttempts = 0;
      testState.towersPlaced++;
      
      if (testState.towersPlaced >= 3) {
        testState.phase = "UPGRADE";
      } else {
        testState.phase = "SELECT_TOWER";
        testState.targetTowerIndex = 0;
      }
      return [32];
    }
  }
  
  if (testState.phase === "UPGRADE") {
    if (gs.towers.length > 0 && gs.money >= 75) {
      testState.upgradeAttempts++;
      testState.framesSinceLastAction = 0;
      
      if (testState.upgradeAttempts < 5) {
        return [32];
      }
    }
    testState.phase = "WAIT";
  }
  
  return [];
}

function getTestWinAction(gs) {
  testState.framesSinceLastAction++;
  
  if (testState.framesSinceLastAction < 8) {
    return [];
  }
  
  if (testState.phase === "INIT") {
    testState.phase = "PLACE_INITIAL";
    testState.towersPlaced = 0;
  }
  
  const strategicPositions = [
    { x: 120, y: 160, type: "MACHINE_GUN" },
    { x: 160, y: 200, type: "MACHINE_GUN" },
    { x: 280, y: 160, type: "CANNON" },
    { x: 280, y: 240, type: "CANNON" },
    { x: 440, y: 240, type: "PLASMA" },
    { x: 440, y: 160, type: "MACHINE_GUN" }
  ];
  
  if (testState.phase === "PLACE_INITIAL" && testState.towersPlaced < strategicPositions.length) {
    const target = strategicPositions[testState.towersPlaced];
    const types = Object.keys(TOWER_TYPES);
    const targetIndex = types.indexOf(target.type);
    
    if (!gs.placementMode) {
      if (gs.selectedTowerIndex !== targetIndex) {
        testState.framesSinceLastAction = 0;
        return [39];
      }
      
      const towerData = TOWER_TYPES[target.type];
      if (gs.money >= towerData.cost) {
        testState.framesSinceLastAction = 0;
        return [32];
      }
    } else {
      const dx = target.x - gs.previewX;
      const dy = target.y - gs.previewY;
      
      if (Math.abs(dx) > 5) {
        testState.framesSinceLastAction = 0;
        return [dx > 0 ? 39 : 37];
      }
      if (Math.abs(dy) > 5) {
        testState.framesSinceLastAction = 0;
        return [dy > 0 ? 40 : 38];
      }
      
      testState.towersPlaced++;
      testState.framesSinceLastAction = 0;
      return [32];
    }
  }
  
  if (testState.phase === "PLACE_INITIAL" && testState.towersPlaced >= strategicPositions.length) {
    testState.phase = "UPGRADE_TOWERS";
  }
  
  if (testState.phase === "UPGRADE_TOWERS") {
    if (gs.money >= 100 && gs.towers.length > 0) {
      const tower = gs.towers[0];
      if (tower && tower.level < 2) {
        testState.framesSinceLastAction = 0;
        gs.selectedTower = tower;
        return [32];
      }
    }
    
    if (gs.towers.length > 0 && gs.towers.every(t => t.level >= 1)) {
      testState.phase = "MAINTAIN";
    }
  }
  
  if (testState.phase === "MAINTAIN") {
    if (gs.money >= 150 && gs.towers.length < 10) {
      testState.phase = "PLACE_EXTRA";
      testState.towersPlaced = 0;
    }
  }
  
  if (testState.phase === "PLACE_EXTRA") {
    if (!gs.placementMode && gs.money >= 75) {
      testState.framesSinceLastAction = 0;
      return [32];
    }
    
    if (gs.placementMode) {
      const moveActions = [39, 40, 37, 38];
      const action = moveActions[testState.towersPlaced % 4];
      testState.framesSinceLastAction = 0;
      
      if (testState.framesSinceLastAction > 30) {
        testState.towersPlaced++;
        return [32];
      }
      
      return [action];
    }
  }
  
  testState.framesSinceLastAction = 0;
  return [];
}

function getRandomAction(gs) {
  const actions = [37, 39, 38, 40, 32];
  const randomIndex = Math.floor(Math.random() * actions.length);
  return [actions[randomIndex]];
}

export function get_automated_testing_action(gs) {
  if (gs.controlMode === "TEST_1") {
    return getTestBasicAction(gs);
  } else if (gs.controlMode === "TEST_2") {
    return getTestWinAction(gs);
  }
  return getRandomAction(gs);
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;