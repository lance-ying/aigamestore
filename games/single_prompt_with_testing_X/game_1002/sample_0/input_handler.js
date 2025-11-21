// input_handler.js
import { gameState, BUILDING_TYPES, HERO_TYPES, BUILDING_DEFS, HERO_DEFS } from './globals.js';
import { Building } from './building.js';
import { Hero } from './hero.js';
import { showMessage } from './ui.js';

export function handleInput(p) {
  if (gameState.controlMode === "HUMAN") {
    return null;
  } else {
    // Automated testing
    const action = window.get_automated_testing_action(gameState);
    if (action) {
      processAction(p, action);
    }
    return action;
  }
}

export function processAction(p, action) {
  if (!action) return;

  if (action.key === 'SPACE') {
    handleSpace(p);
  } else if (action.key === 'Z') {
    handleZ(p);
  } else if (action.key === 'SHIFT') {
    gameState.timeScale = 2;
  } else if (action.key === 'ArrowUp' || action.key === 'ArrowDown' || 
             action.key === 'ArrowLeft' || action.key === 'ArrowRight') {
    handleArrowKey(p, action.key);
  }
}

function handleSpace(p) {
  if (gameState.buildingMenuOpen) {
    confirmBuildingSelection(p);
  } else if (gameState.heroMenuOpen) {
    confirmHeroSelection(p);
  } else if (gameState.selectedBuilding) {
    // Upgrade building
    if (gameState.selectedBuilding.upgrade()) {
      showMessage(`${BUILDING_DEFS[gameState.selectedBuilding.type].name} upgraded!`);
    } else {
      showMessage("Not enough resources!");
    }
  } else if (gameState.selectedHero) {
    // Upgrade hero
    if (gameState.selectedHero.upgrade()) {
      showMessage(`${HERO_DEFS[gameState.selectedHero.type].name} upgraded!`);
    } else {
      showMessage("Not enough resources!");
    }
  } else {
    // Open building menu
    gameState.buildingMenuOpen = true;
    gameState.selectedBuildingType = BUILDING_TYPES.FOOD_GATHERER;
  }
}

function handleZ(p) {
  if (gameState.buildingMenuOpen) {
    gameState.buildingMenuOpen = false;
    gameState.selectedBuildingType = null;
  } else if (gameState.heroMenuOpen) {
    gameState.heroMenuOpen = false;
    gameState.selectedBuildingType = null;
  } else if (gameState.selectedBuilding) {
    gameState.selectedBuilding = null;
  } else if (gameState.selectedHero) {
    gameState.selectedHero = null;
  } else {
    // Open hero menu
    const barracks = gameState.buildings.find(b => b.type === BUILDING_TYPES.BARRACKS && b.isAlive);
    if (barracks) {
      gameState.heroMenuOpen = true;
      gameState.selectedBuildingType = HERO_TYPES.WARRIOR;
    } else {
      showMessage("Build a Barracks first!");
    }
  }
}

function handleArrowKey(p, key) {
  if (gameState.buildingMenuOpen) {
    navigateBuildingMenu(key);
  } else if (gameState.heroMenuOpen) {
    navigateHeroMenu(key);
  } else {
    selectEntity(p, key);
  }
}

function navigateBuildingMenu(key) {
  const buildingTypes = Object.keys(BUILDING_TYPES).filter(type => {
    const def = BUILDING_DEFS[type];
    if (def.unique) {
      return !gameState.buildings.some(b => b.type === type && b.isAlive);
    }
    return true;
  });

  const currentIndex = buildingTypes.indexOf(gameState.selectedBuildingType);
  let newIndex = currentIndex;

  if (key === 'ArrowRight') {
    newIndex = (currentIndex + 1) % buildingTypes.length;
  } else if (key === 'ArrowLeft') {
    newIndex = (currentIndex - 1 + buildingTypes.length) % buildingTypes.length;
  } else if (key === 'ArrowDown') {
    newIndex = Math.min(currentIndex + 2, buildingTypes.length - 1);
  } else if (key === 'ArrowUp') {
    newIndex = Math.max(currentIndex - 2, 0);
  }

  gameState.selectedBuildingType = buildingTypes[newIndex];
}

function navigateHeroMenu(key) {
  const heroTypes = Object.keys(HERO_TYPES);
  const currentIndex = heroTypes.indexOf(gameState.selectedBuildingType);
  let newIndex = currentIndex;

  if (key === 'ArrowRight') {
    newIndex = (currentIndex + 1) % heroTypes.length;
  } else if (key === 'ArrowLeft') {
    newIndex = (currentIndex - 1 + heroTypes.length) % heroTypes.length;
  }

  gameState.selectedBuildingType = heroTypes[newIndex];
}

function confirmBuildingSelection(p) {
  const type = gameState.selectedBuildingType;
  const def = BUILDING_DEFS[type];

  if (gameState.food >= def.cost.food &&
      gameState.wood >= def.cost.wood &&
      gameState.coal >= def.cost.coal) {
    
    // Deduct resources
    gameState.food -= def.cost.food;
    gameState.wood -= def.cost.wood;
    gameState.coal -= def.cost.coal;

    // Find a valid position
    let x, y;
    let attempts = 0;
    do {
      x = p.random(50, 550);
      y = p.random(100, 350);
      attempts++;
    } while (attempts < 50 && !isValidBuildingPosition(x, y, def.size));

    // Create building
    const building = new Building(type, x, y);
    gameState.buildings.push(building);
    gameState.entities.push(building);

    if (building.populationBonus > 0) {
      gameState.maxPopulation += building.populationBonus;
    }

    gameState.buildingMenuOpen = false;
    gameState.selectedBuildingType = null;
    showMessage(`${def.name} built!`);
  } else {
    showMessage("Not enough resources!");
  }
}

function confirmHeroSelection(p) {
  const type = gameState.selectedBuildingType;
  const def = HERO_DEFS[type];

  if (gameState.food >= def.cost.food &&
      gameState.wood >= def.cost.wood &&
      gameState.coal >= def.cost.coal) {
    
    // Deduct resources
    gameState.food -= def.cost.food;
    gameState.wood -= def.cost.wood;
    gameState.coal -= def.cost.coal;

    // Find town hall position
    const townHall = gameState.buildings.find(b => b.type === BUILDING_TYPES.TOWN_HALL && b.isAlive);
    const x = townHall ? townHall.x + 60 : 300;
    const y = townHall ? townHall.y : 200;

    // Create hero
    const hero = new Hero(type, x, y);
    gameState.heroes.push(hero);
    gameState.entities.push(hero);

    gameState.heroMenuOpen = false;
    gameState.selectedBuildingType = null;
    showMessage(`${def.name} recruited!`);
  } else {
    showMessage("Not enough resources!");
  }
}

function isValidBuildingPosition(x, y, size) {
  // Check if too close to other buildings
  for (const building of gameState.buildings) {
    if (!building.isAlive) continue;
    const dist = Math.hypot(building.x - x, building.y - y);
    if (dist < (building.size + size) / 2 + 10) {
      return false;
    }
  }
  return true;
}

function selectEntity(p, key) {
  // Cycle through buildings and heroes
  const selectableEntities = [
    ...gameState.buildings.filter(b => b.isAlive),
    ...gameState.heroes.filter(h => h.isAlive)
  ];

  if (selectableEntities.length === 0) return;

  let currentEntity = gameState.selectedBuilding || gameState.selectedHero;
  let currentIndex = selectableEntities.indexOf(currentEntity);
  
  if (currentIndex === -1) {
    currentIndex = 0;
  } else {
    if (key === 'ArrowRight') {
      currentIndex = (currentIndex + 1) % selectableEntities.length;
    } else if (key === 'ArrowLeft') {
      currentIndex = (currentIndex - 1 + selectableEntities.length) % selectableEntities.length;
    } else if (key === 'ArrowDown') {
      currentIndex = (currentIndex + 3) % selectableEntities.length;
    } else if (key === 'ArrowUp') {
      currentIndex = (currentIndex - 3 + selectableEntities.length) % selectableEntities.length;
    }
  }

  const newEntity = selectableEntities[currentIndex];
  
  if (newEntity instanceof Building) {
    gameState.selectedBuilding = newEntity;
    gameState.selectedHero = null;
  } else if (newEntity instanceof Hero) {
    gameState.selectedHero = newEntity;
    gameState.selectedBuilding = null;
  }
}