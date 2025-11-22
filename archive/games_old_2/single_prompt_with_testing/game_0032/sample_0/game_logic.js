// game_logic.js - Core game logic and updates

import { gameState, GAME_PHASES, BUILDING_TYPES, BUILDING_COSTS, CREATURE_TYPES, CRAFTING_RECIPES } from './globals.js';
import { Building, Hunter, Alliance, Creature } from './entities.js';

export function initializeGame() {
  // Reset game state
  gameState.gamePhase = GAME_PHASES.PLAYING;
  gameState.villagers = 10;
  gameState.idleVillagers = 10;
  
  gameState.resources = {
    wood: 0,
    stone: 0,
    food: 50,
    processed_wood: 0,
    processed_metal: 0,
    gold: 100
  };
  
  gameState.buildings = [];
  gameState.workerAssignments = {};
  gameState.hunters = [];
  gameState.activeAlliance = null;
  gameState.creatures = [];
  gameState.defeatedCreatures = [];
  
  gameState.selectedBuilding = null;
  gameState.selectedIndex = 0;
  gameState.menuOpen = false;
  gameState.menuType = null;
  gameState.craftingIndex = 0;
  
  gameState.gameTime = 0;
  gameState.timeScale = 1;
  gameState.lastTradeShipTime = 0;
  gameState.tradeShipAvailable = false;
  gameState.dragonDefeated = false;
  gameState.positionHistory = [];
  
  // Create initial buildings
  createInitialBuildings();
  
  // Initialize creatures
  initializeCreatures();
  
  // Select first building
  if (gameState.buildings.length > 0) {
    gameState.selectedBuilding = gameState.buildings[0];
    gameState.selectedIndex = 0;
  }
}

function createInitialBuildings() {
  // Town Hall (center)
  const townHall = new Building(BUILDING_TYPES.TOWN_HALL, "Town Hall", 250, 150, 100, 80);
  gameState.buildings.push(townHall);
  
  // Resource buildings
  const woodCamp = new Building(BUILDING_TYPES.WOOD_CAMP, "Wood Camp", 50, 100, 80, 60);
  gameState.buildings.push(woodCamp);
  
  const stoneQuarry = new Building(BUILDING_TYPES.STONE_QUARRY, "Quarry", 470, 100, 80, 60);
  gameState.buildings.push(stoneQuarry);
  
  const farm = new Building(BUILDING_TYPES.FARM, "Farm", 50, 250, 80, 60);
  gameState.buildings.push(farm);
}

function initializeCreatures() {
  CREATURE_TYPES.forEach(type => {
    gameState.creatures.push(new Creature(type));
  });
}

export function updateGame(timeScale) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  gameState.gameTime += timeScale;
  
  // Update buildings
  gameState.buildings.forEach(building => {
    building.update(timeScale);
  });
  
  // Update alliance expedition
  if (gameState.activeAlliance && gameState.activeAlliance.onExpedition) {
    const result = gameState.activeAlliance.updateExpedition(timeScale);
    
    if (result) {
      if (result.victory) {
        // Mark creature as defeated
        if (!gameState.defeatedCreatures.includes(result.creature.name)) {
          gameState.defeatedCreatures.push(result.creature.name);
        }
        
        // Check if dragon was defeated
        if (result.creature.name === "Dragon") {
          gameState.dragonDefeated = true;
          gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        }
      } else {
        // Alliance was defeated - check for game over
        const healthyHunters = gameState.hunters.filter(h => h.hp > 0).length;
        if (healthyHunters < 3) {
          // Can't form new alliance - potential game over if dragon not defeated
          // For now, just disband
        }
      }
      
      // Disband alliance after expedition
      gameState.activeAlliance.disband();
      gameState.activeAlliance = null;
    }
  }
  
  // Check food consumption
  if (gameState.gameTime % 300 === 0) { // Every 5 seconds
    const foodNeeded = gameState.villagers * 0.5;
    if (gameState.resources.food >= foodNeeded) {
      gameState.resources.food -= foodNeeded;
    } else {
      // Starvation penalty (lose a villager if no food)
      if (gameState.villagers > 1) {
        gameState.villagers--;
        if (gameState.idleVillagers > 0) {
          gameState.idleVillagers--;
        }
      }
    }
  }
}

export function handleBuildingSelection(direction) {
  if (gameState.buildings.length === 0) return;
  
  if (direction === 'next') {
    gameState.selectedIndex = (gameState.selectedIndex + 1) % gameState.buildings.length;
  } else if (direction === 'prev') {
    gameState.selectedIndex = (gameState.selectedIndex - 1 + gameState.buildings.length) % gameState.buildings.length;
  }
  
  gameState.selectedBuilding = gameState.buildings[gameState.selectedIndex];
}

export function handleWorkerAssignment() {
  if (!gameState.selectedBuilding) return;
  
  // Toggle worker assignment
  if (gameState.selectedBuilding.canAssignWorker()) {
    gameState.selectedBuilding.assignWorker();
  } else if (gameState.selectedBuilding.workers > 0) {
    gameState.selectedBuilding.removeWorker();
  }
}

export function openMenu(type) {
  gameState.menuOpen = true;
  gameState.menuType = type;
  gameState.craftingIndex = 0;
}

export function closeMenu() {
  gameState.menuOpen = false;
  gameState.menuType = null;
}

export function handleMenuNavigation(direction) {
  if (!gameState.menuOpen) return;
  
  let maxIndex = 0;
  
  if (gameState.menuType === 'craft') {
    maxIndex = 5; // 6 items (0-5)
  } else if (gameState.menuType === 'expedition') {
    maxIndex = gameState.creatures.length - 1;
  } else if (gameState.menuType === 'build') {
    maxIndex = 3; // 4 buildings (0-3)
  }
  
  if (direction === 'up') {
    gameState.craftingIndex = (gameState.craftingIndex - 1 + maxIndex + 1) % (maxIndex + 1);
  } else if (direction === 'down') {
    gameState.craftingIndex = (gameState.craftingIndex + 1) % (maxIndex + 1);
  }
}

export function handleMenuAction() {
  if (!gameState.menuOpen) return;
  
  if (gameState.menuType === 'craft') {
    handleCrafting();
  } else if (gameState.menuType === 'expedition') {
    handleExpedition();
  } else if (gameState.menuType === 'build') {
    handleBuilding();
  }
}

function handleCrafting() {
  const items = [
    { key: "wooden_sword", cost: { processed_wood: 3 } },
    { key: "iron_sword", cost: { processed_metal: 5 } },
    { key: "wooden_armor", cost: { processed_wood: 5 } },
    { key: "iron_armor", cost: { processed_metal: 8 } },
    { key: "health_potion", cost: { gold: 10, food: 5 } },
    { key: "train_hunter", cost: { gold: 50, food: 20 } }
  ];
  
  const selectedItem = items[gameState.craftingIndex];
  if (!selectedItem) return;
  
  // Check if can afford
  const canAfford = Object.entries(selectedItem.cost).every(([resource, amount]) => {
    return gameState.resources[resource] >= amount;
  });
  
  if (!canAfford) return;
  
  // Deduct resources
  Object.entries(selectedItem.cost).forEach(([resource, amount]) => {
    gameState.resources[resource] -= amount;
  });
  
  // Apply effect
  if (selectedItem.key === 'train_hunter') {
    const hunterNames = ["Aria", "Bran", "Cara", "Drake", "Elena", "Finn", "Gwen", "Hugo"];
    const name = hunterNames[gameState.hunters.length % hunterNames.length] + (Math.floor(gameState.hunters.length / hunterNames.length) + 1);
    const hunter = new Hunter(name);
    gameState.hunters.push(hunter);
  } else if (selectedItem.key === 'health_potion') {
    // Use health potion on first injured hunter
    const injured = gameState.hunters.find(h => h.hp < h.maxHp);
    if (injured) {
      injured.heal(50);
    }
  } else {
    // Equipment - give to first hunter without it
    const itemType = selectedItem.key.includes('sword') ? 'weapon' : 'armor';
    const hunter = gameState.hunters.find(h => !h.equipment[itemType]);
    if (hunter) {
      hunter.equip(itemType, selectedItem.key);
    }
  }
}

function handleExpedition() {
  if (!gameState.activeAlliance) {
    // Try to form alliance from 3 healthy hunters
    const healthyHunters = gameState.hunters.filter(h => h.hp > 0 && !h.inAlliance);
    if (healthyHunters.length >= 3) {
      const allianceMembers = healthyHunters.slice(0, 3);
      gameState.activeAlliance = new Alliance(allianceMembers);
    } else {
      return; // Can't form alliance
    }
  }
  
  // Send alliance on expedition to selected creature
  const selectedCreature = gameState.creatures[gameState.craftingIndex];
  if (!selectedCreature) return;
  
  // Don't send to already defeated creatures
  if (gameState.defeatedCreatures.includes(selectedCreature.name)) return;
  
  if (gameState.activeAlliance && !gameState.activeAlliance.onExpedition) {
    gameState.activeAlliance.startExpedition(selectedCreature);
    closeMenu();
  }
}

function handleBuilding() {
  const buildings = [
    { key: "sawmill", type: BUILDING_TYPES.SAWMILL, name: "Sawmill", x: 150, y: 250, w: 80, h: 60 },
    { key: "forge", type: BUILDING_TYPES.FORGE, name: "Forge", x: 370, y: 250, w: 80, h: 60 },
    { key: "training_ground", type: BUILDING_TYPES.TRAINING_GROUND, name: "Training", x: 150, y: 50, w: 80, h: 60 },
    { key: "alchemy_lab", type: BUILDING_TYPES.ALCHEMY_LAB, name: "Alchemy", x: 370, y: 50, w: 80, h: 60 }
  ];
  
  const selectedBuilding = buildings[gameState.craftingIndex];
  if (!selectedBuilding) return;
  
  // Check if already built
  const alreadyBuilt = gameState.buildings.some(b => b.type === selectedBuilding.type);
  if (alreadyBuilt) return;
  
  // Check if can afford
  const cost = BUILDING_COSTS[selectedBuilding.key];
  const canAfford = Object.entries(cost).every(([resource, amount]) => {
    return gameState.resources[resource] >= amount;
  });
  
  if (!canAfford) return;
  
  // Deduct resources
  Object.entries(cost).forEach(([resource, amount]) => {
    gameState.resources[resource] -= amount;
  });
  
  // Build
  const newBuilding = new Building(
    selectedBuilding.type,
    selectedBuilding.name,
    selectedBuilding.x,
    selectedBuilding.y,
    selectedBuilding.w,
    selectedBuilding.h
  );
  gameState.buildings.push(newBuilding);
}