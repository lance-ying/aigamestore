// automated_testing_controller.js
import { gameState, BUILDING_TYPES, HERO_TYPES, BUILDING_DEFS, HERO_DEFS } from './globals.js';

let testState = {
  phase: 'init',
  timer: 0,
  buildingQueue: [],
  heroQueue: [],
  lastAction: null,
  actionCooldown: 0,
  wavesSurvived: 0
};

function getTestWinAction(gameState) {
  // Strategy: Build economy -> recruit heroes -> survive waves
  testState.timer++;
  testState.actionCooldown = Math.max(0, testState.actionCooldown - 1);

  if (testState.actionCooldown > 0) {
    return { key: 'SHIFT' }; // Speed up while waiting
  }

  // Phase 1: Build economy (first 3 waves)
  if (gameState.currentWave < 3) {
    const farmCount = gameState.buildings.filter(b => b.type === BUILDING_TYPES.FOOD_GATHERER && b.isAlive).length;
    const lumberCount = gameState.buildings.filter(b => b.type === BUILDING_TYPES.WOOD_CUTTER && b.isAlive).length;
    const mineCount = gameState.buildings.filter(b => b.type === BUILDING_TYPES.COAL_MINE && b.isAlive).length;
    const houseCount = gameState.buildings.filter(b => b.type === BUILDING_TYPES.HOUSE && b.isAlive).length;

    if (farmCount < 3 && canAfford(BUILDING_TYPES.FOOD_GATHERER)) {
      return buildBuilding(BUILDING_TYPES.FOOD_GATHERER);
    } else if (lumberCount < 2 && canAfford(BUILDING_TYPES.WOOD_CUTTER)) {
      return buildBuilding(BUILDING_TYPES.WOOD_CUTTER);
    } else if (mineCount < 2 && canAfford(BUILDING_TYPES.COAL_MINE)) {
      return buildBuilding(BUILDING_TYPES.COAL_MINE);
    } else if (houseCount < 2 && canAfford(BUILDING_TYPES.HOUSE)) {
      return buildBuilding(BUILDING_TYPES.HOUSE);
    }
  }

  // Phase 2: Build barracks and recruit heroes
  const barracks = gameState.buildings.find(b => b.type === BUILDING_TYPES.BARRACKS && b.isAlive);
  if (!barracks && canAfford(BUILDING_TYPES.BARRACKS)) {
    return buildBuilding(BUILDING_TYPES.BARRACKS);
  }

  if (barracks && gameState.heroes.filter(h => h.isAlive).length < 4) {
    if (gameState.heroes.filter(h => h.isAlive && h.type === HERO_TYPES.WARRIOR).length < 2 && 
        canAffordHero(HERO_TYPES.WARRIOR)) {
      return recruitHero(HERO_TYPES.WARRIOR);
    } else if (gameState.heroes.filter(h => h.isAlive && h.type === HERO_TYPES.ARCHER).length < 1 && 
               canAffordHero(HERO_TYPES.ARCHER)) {
      return recruitHero(HERO_TYPES.ARCHER);
    } else if (gameState.heroes.filter(h => h.isAlive && h.type === HERO_TYPES.MAGE).length < 1 && 
               canAffordHero(HERO_TYPES.MAGE)) {
      return recruitHero(HERO_TYPES.MAGE);
    }
  }

  // Phase 3: Upgrade key structures
  if (gameState.currentWave >= 4) {
    const lowLevelHeroes = gameState.heroes.filter(h => h.isAlive && h.level < 3);
    if (lowLevelHeroes.length > 0 && canAffordUpgrade(lowLevelHeroes[0])) {
      return upgradeEntity(lowLevelHeroes[0]);
    }

    const lowLevelBuildings = gameState.buildings.filter(b => 
      b.isAlive && 
      b.level < 2 && 
      (b.type === BUILDING_TYPES.FOOD_GATHERER || b.type === BUILDING_TYPES.WOOD_CUTTER)
    );
    if (lowLevelBuildings.length > 0 && canAffordUpgrade(lowLevelBuildings[0])) {
      return upgradeEntity(lowLevelBuildings[0]);
    }
  }

  // Default: Speed up time
  return { key: 'SHIFT' };
}

function getBasicTestAction(gameState) {
  // Simple test: build some resource buildings
  testState.timer++;
  testState.actionCooldown = Math.max(0, testState.actionCooldown - 1);

  if (testState.actionCooldown > 0) {
    return { key: 'SHIFT' };
  }

  const farmCount = gameState.buildings.filter(b => b.type === BUILDING_TYPES.FOOD_GATHERER && b.isAlive).length;
  const lumberCount = gameState.buildings.filter(b => b.type === BUILDING_TYPES.WOOD_CUTTER && b.isAlive).length;

  if (farmCount < 2 && canAfford(BUILDING_TYPES.FOOD_GATHERER)) {
    return buildBuilding(BUILDING_TYPES.FOOD_GATHERER);
  } else if (lumberCount < 2 && canAfford(BUILDING_TYPES.WOOD_CUTTER)) {
    return buildBuilding(BUILDING_TYPES.WOOD_CUTTER);
  } else if (canAfford(BUILDING_TYPES.HOUSE)) {
    return buildBuilding(BUILDING_TYPES.HOUSE);
  }

  return { key: 'SHIFT' };
}

function getEdgeCaseAction(gameState) {
  // Test edge case: don't build food production, test resource depletion
  testState.timer++;
  testState.actionCooldown = Math.max(0, testState.actionCooldown - 1);

  if (testState.actionCooldown > 0) {
    return null;
  }

  // Only build non-food structures
  const lumberCount = gameState.buildings.filter(b => b.type === BUILDING_TYPES.WOOD_CUTTER && b.isAlive).length;
  
  if (lumberCount < 1 && canAfford(BUILDING_TYPES.WOOD_CUTTER)) {
    return buildBuilding(BUILDING_TYPES.WOOD_CUTTER);
  }

  return null;
}

// Helper functions
function canAfford(buildingType) {
  const cost = BUILDING_DEFS[buildingType].cost;
  return gameState.food >= cost.food &&
         gameState.wood >= cost.wood &&
         gameState.coal >= cost.coal;
}

function canAffordHero(heroType) {
  const cost = HERO_DEFS[heroType].cost;
  return gameState.food >= cost.food &&
         gameState.wood >= cost.wood &&
         gameState.coal >= cost.coal;
}

function canAffordUpgrade(entity) {
  const cost = entity.getUpgradeCost();
  return gameState.food >= cost.food &&
         gameState.wood >= cost.wood &&
         gameState.coal >= cost.coal;
}

function buildBuilding(buildingType) {
  testState.actionCooldown = 10;
  
  if (!gameState.buildingMenuOpen) {
    return { key: 'SPACE' };
  } else {
    if (gameState.selectedBuildingType !== buildingType) {
      return { key: 'ArrowRight' };
    } else {
      return { key: 'SPACE' };
    }
  }
}

function recruitHero(heroType) {
  testState.actionCooldown = 10;
  
  if (!gameState.heroMenuOpen) {
    return { key: 'Z' };
  } else {
    if (gameState.selectedBuildingType !== heroType) {
      return { key: 'ArrowRight' };
    } else {
      return { key: 'SPACE' };
    }
  }
}

function upgradeEntity(entity) {
  testState.actionCooldown = 10;
  
  if (gameState.selectedBuilding === entity || gameState.selectedHero === entity) {
    return { key: 'SPACE' };
  } else {
    if (gameState.selectedBuilding || gameState.selectedHero) {
      return { key: 'ArrowRight' };
    } else {
      return { key: 'ArrowRight' };
    }
  }
}

function getRandomAction(gameState) {
  const actions = [
    { key: 'SPACE' },
    { key: 'Z' },
    { key: 'ArrowRight' },
    { key: 'ArrowLeft' },
    { key: 'SHIFT' }
  ];
  return actions[Math.floor(Math.random() * actions.length)];
}

export function get_automated_testing_action(gameState) {
  switch (gameState.controlMode) {
    case "TEST_1":
      return getBasicTestAction(gameState);
    case "TEST_2":
      return getTestWinAction(gameState);
    case "TEST_3":
      return getEdgeCaseAction(gameState);
    default:
      return getRandomAction(gameState);
  }
}

window.get_automated_testing_action = get_automated_testing_action;
export default get_automated_testing_action;