// rendering.js - All rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, BUILDING_TYPES } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 30, 40);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("STERN CONTINENT", CANVAS_WIDTH / 2, 80);
  
  p.textSize(20);
  p.fill(255, 100, 100);
  p.text("Threat of the Dragon", CANVAS_WIDTH / 2, 115);
  
  // Instructions
  p.textSize(14);
  p.fill(200, 200, 200);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "OBJECTIVE: Develop your village and defeat the Dragon!",
    "",
    "GAMEPLAY:",
    "• Use ARROW KEYS to navigate buildings",
    "• Press SPACE to assign/remove workers",
    "• Hold SHIFT to speed up time",
    "• Press Z to open crafting/expedition menu",
    "",
    "STRATEGY:",
    "• Gather wood, stone, and food",
    "• Build Sawmill & Forge to process materials",
    "• Train hunters at Training Ground",
    "• Craft weapons & armor for hunters",
    "• Form 3-hunter Alliances to fight creatures",
    "• Defeat Dragon to win!"
  ];
  
  let yPos = 150;
  instructions.forEach(line => {
    p.text(line, 50, yPos);
    yPos += 18;
  });
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

export function renderGameOverScreen(p, isWin) {
  p.background(20, 20, 30);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (isWin) {
    p.fill(100, 255, 100);
    p.textSize(40);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
    
    p.fill(200, 200, 200);
    p.textSize(18);
    p.text("The Dragon has been defeated!", CANVAS_WIDTH / 2, 150);
    p.text("Stern Continent is safe!", CANVAS_WIDTH / 2, 180);
  } else {
    p.fill(255, 100, 100);
    p.textSize(40);
    p.text("DEFEAT", CANVAS_WIDTH / 2, 100);
    
    p.fill(200, 200, 200);
    p.textSize(18);
    p.text("Your village has fallen...", CANVAS_WIDTH / 2, 150);
  }
  
  // Final stats
  p.fill(200, 200, 200);
  p.textSize(14);
  p.text(`Final Gold: ${Math.floor(gameState.resources.gold)}`, CANVAS_WIDTH / 2, 220);
  p.text(`Hunters Trained: ${gameState.hunters.length}`, CANVAS_WIDTH / 2, 245);
  p.text(`Creatures Defeated: ${gameState.defeatedCreatures.length}`, CANVAS_WIDTH / 2, 270);
  
  // Restart prompt
  p.fill(150, 150, 255);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function renderPlayingScreen(p) {
  p.background(34, 139, 34); // Grass green
  
  // Render buildings
  gameState.buildings.forEach((building, index) => {
    const isSelected = gameState.selectedBuilding === building;
    
    p.push();
    
    // Building rectangle
    if (isSelected) {
      p.strokeWeight(3);
      p.stroke(255, 255, 0);
    } else {
      p.strokeWeight(1);
      p.stroke(0);
    }
    p.fill(...building.color);
    p.rect(building.x, building.y, building.width, building.height);
    
    // Building name
    p.fill(255);
    p.noStroke();
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(building.name, building.x + building.width / 2, building.y + building.height / 2 - 8);
    
    // Worker count
    p.textSize(8);
    p.text(`Workers: ${building.workers}/${building.maxWorkers}`, building.x + building.width / 2, building.y + building.height / 2 + 5);
    
    // Production progress bar
    if (building.workers > 0 && building.productionProgress > 0) {
      const barWidth = building.width - 4;
      const barHeight = 3;
      const barX = building.x + 2;
      const barY = building.y + building.height - 5;
      
      p.fill(50);
      p.rect(barX, barY, barWidth, barHeight);
      p.fill(100, 255, 100);
      p.rect(barX, barY, barWidth * building.productionProgress, barHeight);
    }
    
    p.pop();
  });
  
  // Render UI
  renderUI(p);
  
  // Render pause indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 100);
    p.textSize(14);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
  
  // Render menu if open
  if (gameState.menuOpen) {
    renderMenu(p);
  }
}

function renderUI(p) {
  // Resource panel
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(5, 5, 200, 95);
  
  p.fill(255);
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Villagers: ${gameState.idleVillagers}/${gameState.villagers}`, 10, 10);
  p.text(`Wood: ${Math.floor(gameState.resources.wood)}`, 10, 25);
  p.text(`Stone: ${Math.floor(gameState.resources.stone)}`, 10, 40);
  p.text(`Food: ${Math.floor(gameState.resources.food)}`, 10, 55);
  p.text(`P.Wood: ${Math.floor(gameState.resources.processed_wood)}`, 10, 70);
  p.text(`P.Metal: ${Math.floor(gameState.resources.processed_metal)}`, 10, 85);
  
  // Gold
  p.fill(255, 215, 0);
  p.text(`Gold: ${Math.floor(gameState.resources.gold)}`, 120, 10);
  
  // Time info
  p.fill(200, 200, 255);
  p.textSize(10);
  const timeStr = `Time: ${Math.floor(gameState.gameTime / 60)}:${String(Math.floor(gameState.gameTime % 60)).padStart(2, '0')}`;
  p.text(timeStr, 120, 30);
  
  if (gameState.timeScale > 1) {
    p.fill(100, 255, 100);
    p.text(`Speed: ${gameState.timeScale}x`, 120, 45);
  }
  
  // Hunters panel
  if (gameState.hunters.length > 0) {
    p.fill(0, 0, 0, 180);
    p.rect(5, 105, 200, 60);
    
    p.fill(100, 200, 255);
    p.textSize(11);
    p.text(`Hunters: ${gameState.hunters.length}`, 10, 110);
    
    const healthyHunters = gameState.hunters.filter(h => h.hp > 0).length;
    p.fill(255);
    p.textSize(9);
    p.text(`Active: ${healthyHunters}`, 10, 125);
    
    if (gameState.activeAlliance) {
      p.fill(255, 200, 100);
      p.text(`Alliance Ready`, 10, 140);
      
      if (gameState.activeAlliance.onExpedition) {
        const progress = Math.floor(gameState.activeAlliance.expeditionProgress * 100);
        p.text(`Expedition: ${progress}%`, 10, 153);
      }
    }
  }
  
  // Creatures panel
  if (gameState.creatures.length > 0) {
    p.fill(0, 0, 0, 180);
    p.rect(CANVAS_WIDTH - 155, 5, 150, 80);
    
    p.fill(255, 100, 100);
    p.textSize(11);
    p.textAlign(p.LEFT, p.TOP);
    p.text("Available Creatures:", CANVAS_WIDTH - 150, 10);
    
    p.fill(255);
    p.textSize(9);
    gameState.creatures.slice(0, 5).forEach((creature, i) => {
      const defeated = gameState.defeatedCreatures.includes(creature.name);
      p.fill(defeated ? [100, 100, 100] : [255, 200, 200]);
      p.text(`${creature.name} (HP:${creature.hp})`, CANVAS_WIDTH - 150, 27 + i * 12);
    });
  }
  
  // Instructions
  p.fill(255, 255, 255, 200);
  p.textSize(9);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text("ARROWS:Select | SPACE:Assign | Z:Menu | SHIFT:Speed", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 5);
}

function renderMenu(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Menu box
  const menuWidth = 500;
  const menuHeight = 350;
  const menuX = (CANVAS_WIDTH - menuWidth) / 2;
  const menuY = (CANVAS_HEIGHT - menuHeight) / 2;
  
  p.fill(40, 40, 60);
  p.stroke(255, 255, 0);
  p.strokeWeight(2);
  p.rect(menuX, menuY, menuWidth, menuHeight);
  
  p.fill(255, 215, 0);
  p.noStroke();
  p.textSize(16);
  p.textAlign(p.CENTER, p.TOP);
  
  if (gameState.menuType === 'craft') {
    p.text("CRAFTING MENU", CANVAS_WIDTH / 2, menuY + 10);
    renderCraftingMenu(p, menuX, menuY, menuWidth, menuHeight);
  } else if (gameState.menuType === 'expedition') {
    p.text("EXPEDITION MENU", CANVAS_WIDTH / 2, menuY + 10);
    renderExpeditionMenu(p, menuX, menuY, menuWidth, menuHeight);
  } else if (gameState.menuType === 'build') {
    p.text("BUILD MENU", CANVAS_WIDTH / 2, menuY + 10);
    renderBuildMenu(p, menuX, menuY, menuWidth, menuHeight);
  }
  
  // Close instruction
  p.fill(200, 200, 200);
  p.textSize(11);
  p.text("Press Z to close", CANVAS_WIDTH / 2, menuY + menuHeight - 20);
}

function renderCraftingMenu(p, menuX, menuY, menuWidth, menuHeight) {
  const items = [
    { name: "Wooden Sword", key: "wooden_sword", cost: { processed_wood: 3 } },
    { name: "Iron Sword", key: "iron_sword", cost: { processed_metal: 5 } },
    { name: "Wooden Armor", key: "wooden_armor", cost: { processed_wood: 5 } },
    { name: "Iron Armor", key: "iron_armor", cost: { processed_metal: 8 } },
    { name: "Health Potion", key: "health_potion", cost: { gold: 10, food: 5 } },
    { name: "Train Hunter", key: "train_hunter", cost: { gold: 50, food: 20 } }
  ];
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  
  let yPos = menuY + 40;
  items.forEach((item, index) => {
    const isSelected = index === gameState.craftingIndex;
    
    if (isSelected) {
      p.fill(255, 255, 0);
      p.text(">", menuX + 20, yPos);
    }
    
    p.fill(isSelected ? [255, 255, 100] : [200, 200, 200]);
    p.text(item.name, menuX + 40, yPos);
    
    // Cost
    p.fill(150, 150, 150);
    p.textSize(10);
    const costStr = Object.entries(item.cost).map(([k, v]) => `${k}:${v}`).join(", ");
    p.text(costStr, menuX + 200, yPos + 2);
    
    p.textSize(12);
    yPos += 25;
  });
  
  p.fill(200, 200, 255);
  p.textSize(11);
  p.textAlign(p.CENTER, p.TOP);
  p.text("ARROWS: Navigate | SPACE: Craft", CANVAS_WIDTH / 2, menuY + menuHeight - 45);
}

function renderExpeditionMenu(p, menuX, menuY, menuWidth, menuHeight) {
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  
  // Show available creatures
  if (gameState.creatures.length === 0) {
    p.text("No creatures available!", menuX + 40, menuY + 50);
    return;
  }
  
  let yPos = menuY + 40;
  gameState.creatures.forEach((creature, index) => {
    const isSelected = index === gameState.craftingIndex;
    const defeated = gameState.defeatedCreatures.includes(creature.name);
    
    if (isSelected) {
      p.fill(255, 255, 0);
      p.text(">", menuX + 20, yPos);
    }
    
    p.fill(defeated ? [100, 100, 100] : (isSelected ? [255, 255, 100] : [200, 200, 200]));
    p.text(`${creature.name} - HP: ${creature.hp}, DMG: ${creature.damage}`, menuX + 40, yPos);
    
    if (defeated) {
      p.fill(100, 255, 100);
      p.text("DEFEATED", menuX + 300, yPos);
    }
    
    yPos += 25;
  });
  
  // Alliance status
  if (gameState.activeAlliance) {
    p.fill(100, 255, 100);
    p.textSize(11);
    const allianceInfo = `Alliance Ready (DMG: ${gameState.activeAlliance.getTotalDamage()}, HP: ${Math.floor(gameState.activeAlliance.getTotalHp())})`;
    p.text(allianceInfo, menuX + 40, menuY + menuHeight - 80);
  } else {
    p.fill(255, 100, 100);
    p.textSize(11);
    p.text("No alliance formed! Need 3 healthy hunters.", menuX + 40, menuY + menuHeight - 80);
  }
  
  p.fill(200, 200, 255);
  p.textAlign(p.CENTER, p.TOP);
  p.text("ARROWS: Select Creature | SPACE: Send Alliance", CANVAS_WIDTH / 2, menuY + menuHeight - 50);
}

function renderBuildMenu(p, menuX, menuY, menuWidth, menuHeight) {
  const buildings = [
    { name: "Sawmill", key: "sawmill", cost: { wood: 20, stone: 10, gold: 50 } },
    { name: "Forge", key: "forge", cost: { wood: 15, stone: 25, gold: 75 } },
    { name: "Training Ground", key: "training_ground", cost: { wood: 30, stone: 20, gold: 100 } },
    { name: "Alchemy Lab", key: "alchemy_lab", cost: { wood: 25, stone: 15, gold: 80 } }
  ];
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  
  let yPos = menuY + 40;
  buildings.forEach((building, index) => {
    const isSelected = index === gameState.craftingIndex;
    const alreadyBuilt = gameState.buildings.some(b => b.type === building.key);
    
    if (isSelected) {
      p.fill(255, 255, 0);
      p.text(">", menuX + 20, yPos);
    }
    
    p.fill(alreadyBuilt ? [100, 100, 100] : (isSelected ? [255, 255, 100] : [200, 200, 200]));
    p.text(building.name, menuX + 40, yPos);
    
    if (alreadyBuilt) {
      p.fill(100, 255, 100);
      p.text("BUILT", menuX + 200, yPos);
    } else {
      // Cost
      p.fill(150, 150, 150);
      p.textSize(10);
      const costStr = Object.entries(building.cost).map(([k, v]) => `${k}:${v}`).join(", ");
      p.text(costStr, menuX + 200, yPos + 2);
      p.textSize(12);
    }
    
    yPos += 25;
  });
  
  p.fill(200, 200, 255);
  p.textSize(11);
  p.textAlign(p.CENTER, p.TOP);
  p.text("ARROWS: Navigate | SPACE: Build", CANVAS_WIDTH / 2, menuY + menuHeight - 45);
}