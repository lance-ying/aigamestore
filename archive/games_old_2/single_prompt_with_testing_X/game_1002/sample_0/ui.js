// ui.js
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, BUILDING_DEFS, HERO_DEFS, BUILDING_TYPES, HERO_TYPES } from './globals.js';

export function renderUI(p) {
  // Resource display
  p.push();
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(5, 5, 220, 60);
  
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Food: ${Math.floor(gameState.food)}`, 10, 10);
  p.text(`Wood: ${Math.floor(gameState.wood)}`, 10, 25);
  p.text(`Coal: ${Math.floor(gameState.coal)}`, 10, 40);
  
  p.text(`Pop: ${gameState.population}/${gameState.maxPopulation}`, 120, 10);
  p.text(`Wave: ${gameState.currentWave}/${gameState.maxWaves}`, 120, 25);
  p.text(`Tech: L${gameState.techLevel}`, 120, 40);
  p.pop();

  // Wave timer
  if (!gameState.waveActive && gameState.currentWave < gameState.maxWaves) {
    const timeLeft = Math.ceil((gameState.waveDuration - gameState.waveTimer) / 60);
    p.push();
    p.fill(0, 0, 0, 180);
    p.rect(CANVAS_WIDTH - 150, 5, 145, 25);
    p.fill(255, 200, 100);
    p.textSize(14);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`Next Wave: ${timeLeft}s`, CANVAS_WIDTH - 10, 10);
    p.pop();
  }

  // Active wave indicator
  if (gameState.waveActive) {
    p.push();
    p.fill(200, 0, 0, 180);
    p.rect(CANVAS_WIDTH - 150, 5, 145, 25);
    p.fill(255);
    p.textSize(14);
    p.textAlign(p.RIGHT, p.TOP);
    const beastCount = gameState.beasts.filter(b => b.isAlive).length;
    p.text(`WAVE ${gameState.currentWave} - ${beastCount} left`, CANVAS_WIDTH - 10, 10);
    p.pop();
  }

  // UI Message
  if (gameState.uiMessageTimer > 0) {
    p.push();
    p.fill(0, 0, 0, 200);
    p.rect(CANVAS_WIDTH/2 - 150, CANVAS_HEIGHT - 60, 300, 30);
    p.fill(255, 255, 100);
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(gameState.uiMessage, CANVAS_WIDTH/2, CANVAS_HEIGHT - 45);
    p.pop();
  }

  // Building menu
  if (gameState.buildingMenuOpen) {
    renderBuildingMenu(p);
  }

  // Hero menu
  if (gameState.heroMenuOpen) {
    renderHeroMenu(p);
  }

  // Selected building info
  if (gameState.selectedBuilding && !gameState.buildingMenuOpen) {
    renderBuildingInfo(p, gameState.selectedBuilding);
  }

  // Selected hero info
  if (gameState.selectedHero && !gameState.heroMenuOpen) {
    renderHeroInfo(p, gameState.selectedHero);
  }

  // Instructions at bottom
  if (gameState.currentWave === 0) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(10, CANVAS_HEIGHT - 35, CANVAS_WIDTH - 20, 30);
    p.fill(255, 255, 255);
    p.textSize(11);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("Arrow Keys: Navigate | SPACE: Build/Select | Z: Cancel | SHIFT: Speed Up", CANVAS_WIDTH/2, CANVAS_HEIGHT - 20);
    p.pop();
  }

  // Paused indicator
  if (gameState.gamePhase === "PAUSED") {
    p.push();
    p.fill(255, 255, 255);
    p.textSize(16);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 35);
    p.pop();
  }
}

function renderBuildingMenu(p) {
  const menuX = 230;
  const menuY = 80;
  const menuW = 340;
  const menuH = 300;

  p.push();
  p.fill(0, 0, 0, 220);
  p.stroke(255, 255, 0);
  p.strokeWeight(2);
  p.rect(menuX, menuY, menuW, menuH);

  p.fill(255, 255, 100);
  p.noStroke();
  p.textSize(16);
  p.textAlign(p.CENTER, p.TOP);
  p.text("BUILD MENU", menuX + menuW/2, menuY + 10);

  const buildingTypes = Object.keys(BUILDING_TYPES).filter(type => {
    const def = BUILDING_DEFS[type];
    if (def.unique) {
      return !gameState.buildings.some(b => b.type === type && b.isAlive);
    }
    return true;
  });

  const itemsPerRow = 2;
  const itemW = 150;
  const itemH = 70;
  const startY = menuY + 40;

  buildingTypes.forEach((type, index) => {
    const def = BUILDING_DEFS[type];
    const row = Math.floor(index / itemsPerRow);
    const col = index % itemsPerRow;
    const x = menuX + 20 + col * (itemW + 10);
    const y = startY + row * (itemH + 10);

    const canBuild = gameState.food >= def.cost.food &&
                     gameState.wood >= def.cost.wood &&
                     gameState.coal >= def.cost.coal;

    p.fill(...(canBuild ? [50, 100, 50] : [80, 50, 50]));
    if (gameState.selectedBuildingType === type) {
      p.fill(100, 150, 100);
    }
    p.stroke(255);
    p.strokeWeight(1);
    p.rect(x, y, itemW, itemH);

    p.fill(255);
    p.noStroke();
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.text(def.name, x + 5, y + 5);
    p.textSize(10);
    p.text(`F:${def.cost.food} W:${def.cost.wood} C:${def.cost.coal}`, x + 5, y + 25);
    
    if (def.produces) {
      p.text(`+${def.produces}`, x + 5, y + 40);
    }
    if (def.populationBonus) {
      p.text(`+${def.populationBonus} pop`, x + 5, y + 55);
    }
  });

  p.fill(255, 255, 200);
  p.textSize(11);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Arrow Keys to select | SPACE to confirm | Z to cancel", menuX + menuW/2, menuY + menuH - 20);
  p.pop();
}

function renderHeroMenu(p) {
  const menuX = 230;
  const menuY = 100;
  const menuW = 340;
  const menuH = 250;

  p.push();
  p.fill(0, 0, 0, 220);
  p.stroke(255, 255, 0);
  p.strokeWeight(2);
  p.rect(menuX, menuY, menuW, menuH);

  p.fill(255, 255, 100);
  p.noStroke();
  p.textSize(16);
  p.textAlign(p.CENTER, p.TOP);
  p.text("RECRUIT HERO", menuX + menuW/2, menuY + 10);

  const heroTypes = Object.keys(HERO_TYPES);
  const itemW = 100;
  const itemH = 120;
  const startX = menuX + 20;
  const startY = menuY + 40;

  heroTypes.forEach((type, index) => {
    const def = HERO_DEFS[type];
    const x = startX + index * (itemW + 10);
    const y = startY;

    const canRecruit = gameState.food >= def.cost.food &&
                       gameState.wood >= def.cost.wood &&
                       gameState.coal >= def.cost.coal;

    p.fill(...(canRecruit ? [50, 50, 100] : [80, 50, 50]));
    if (gameState.selectedBuildingType === type) { // Reusing this var for hero selection
      p.fill(100, 100, 150);
    }
    p.stroke(255);
    p.strokeWeight(1);
    p.rect(x, y, itemW, itemH);

    p.fill(255);
    p.noStroke();
    p.textSize(11);
    p.textAlign(p.CENTER, p.TOP);
    p.text(def.name, x + itemW/2, y + 5);
    p.textSize(9);
    p.text(`Cost:`, x + itemW/2, y + 25);
    p.text(`F:${def.cost.food}`, x + itemW/2, y + 40);
    p.text(`W:${def.cost.wood}`, x + itemW/2, y + 55);
    p.text(`C:${def.cost.coal}`, x + itemW/2, y + 70);
    p.text(`HP:${def.health}`, x + itemW/2, y + 85);
    p.text(`DMG:${def.damage}`, x + itemW/2, y + 100);
  });

  p.fill(255, 255, 200);
  p.textSize(11);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Arrow Keys | SPACE to recruit | Z to cancel", menuX + menuW/2, menuY + menuH - 20);
  p.pop();
}

function renderBuildingInfo(p, building) {
  const def = BUILDING_DEFS[building.type];
  const infoX = CANVAS_WIDTH - 160;
  const infoY = CANVAS_HEIGHT - 120;

  p.push();
  p.fill(0, 0, 0, 200);
  p.stroke(255, 255, 0);
  p.strokeWeight(2);
  p.rect(infoX, infoY, 150, 110);

  p.fill(255, 255, 100);
  p.noStroke();
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text(def.name, infoX + 5, infoY + 5);
  p.textSize(10);
  p.text(`Level: ${building.level}`, infoX + 5, infoY + 22);
  p.text(`HP: ${Math.floor(building.health)}/${building.maxHealth}`, infoX + 5, infoY + 37);
  
  if (building.produces) {
    p.text(`Produces: ${building.produces}`, infoX + 5, infoY + 52);
    p.text(`Rate: ${(building.productionRate * building.level).toFixed(1)}/s`, infoX + 5, infoY + 67);
  }

  const upgradeCost = building.getUpgradeCost();
  const canUpgrade = gameState.food >= upgradeCost.food &&
                     gameState.wood >= upgradeCost.wood &&
                     gameState.coal >= upgradeCost.coal;
  
  p.fill(...(canUpgrade ? [100, 255, 100] : [255, 100, 100]));
  p.textSize(9);
  p.text(`Upgrade: F${upgradeCost.food} W${upgradeCost.wood} C${upgradeCost.coal}`, infoX + 5, infoY + 87);
  
  p.fill(255, 255, 200);
  p.textSize(9);
  p.text("SPACE: Upgrade | Z: Deselect", infoX + 5, infoY + 100);
  p.pop();
}

function renderHeroInfo(p, hero) {
  const def = HERO_DEFS[hero.type];
  const infoX = CANVAS_WIDTH - 160;
  const infoY = CANVAS_HEIGHT - 120;

  p.push();
  p.fill(0, 0, 0, 200);
  p.stroke(255, 255, 0);
  p.strokeWeight(2);
  p.rect(infoX, infoY, 150, 110);

  p.fill(255, 255, 100);
  p.noStroke();
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text(def.name, infoX + 5, infoY + 5);
  p.textSize(10);
  p.text(`Level: ${hero.level}`, infoX + 5, infoY + 22);
  p.text(`HP: ${Math.floor(hero.health)}/${hero.maxHealth}`, infoX + 5, infoY + 37);
  p.text(`Damage: ${hero.damage * hero.level}`, infoX + 5, infoY + 52);
  p.text(`Range: ${hero.range}`, infoX + 5, infoY + 67);

  const upgradeCost = hero.getUpgradeCost();
  const canUpgrade = gameState.food >= upgradeCost.food &&
                     gameState.wood >= upgradeCost.wood &&
                     gameState.coal >= upgradeCost.coal;
  
  p.fill(...(canUpgrade ? [100, 255, 100] : [255, 100, 100]));
  p.textSize(9);
  p.text(`Upgrade: F${upgradeCost.food} W${upgradeCost.wood} C${upgradeCost.coal}`, infoX + 5, infoY + 87);
  
  p.fill(255, 255, 200);
  p.textSize(9);
  p.text("SPACE: Upgrade | Z: Deselect", infoX + 5, infoY + 100);
  p.pop();
}

export function showMessage(message, duration = 180) {
  gameState.uiMessage = message;
  gameState.uiMessageTimer = duration;
}