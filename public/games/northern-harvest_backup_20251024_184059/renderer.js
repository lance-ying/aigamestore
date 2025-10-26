// renderer.js - Rendering functions

import { gameState, GAME_PHASE, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, CROP_TYPES, ANIMAL_TYPES, BUILDING_TYPES, LEVEL_THRESHOLDS } from './globals.js';

let p;

export function initRenderer(p5Instance) {
  p = p5Instance;
}

export function renderGame() {
  p.background(30, 50, 40);
  
  if (gameState.gamePhase === GAME_PHASE.START) {
    renderStartScreen();
  } else if (gameState.gamePhase === GAME_PHASE.PLAYING) {
    renderPlayingScreen();
  } else if (gameState.gamePhase === GAME_PHASE.PAUSED) {
    renderPlayingScreen();
    renderPausedOverlay();
  } else if (gameState.gamePhase === GAME_PHASE.GAME_OVER_WIN) {
    renderGameOverScreen(true);
  } else if (gameState.gamePhase === GAME_PHASE.GAME_OVER_LOSE) {
    renderGameOverScreen(false);
  }
}

function renderStartScreen() {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title
  p.textSize(48);
  p.text("NORTHERN HARVEST", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.textSize(14);
  p.fill(200);
  const desc = "Build and manage your frontier farm.\nPlant crops, raise animals, complete quests.";
  p.text(desc, CANVAS_WIDTH / 2, 150);
  
  // Instructions
  p.textSize(12);
  p.fill(180);
  const instructions = [
    "Click plots to till and plant crops",
    "Click ready crops/animals to collect",
    "Arrow Keys: Pan camera",
    "Space: Quick harvest all ready items",
    "Z: Plant selected crop",
    "Left-click plots to select for planting"
  ];
  
  let y = 220;
  for (let line of instructions) {
    p.text(line, CANVAS_WIDTH / 2, y);
    y += 20;
  }
  
  // Start prompt
  p.textSize(18);
  p.fill(100, 255, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

function renderPlayingScreen() {
  p.push();
  p.translate(-gameState.camera.x, -gameState.camera.y);
  
  // Render farm background
  renderFarmBackground();
  
  // Render farm plots
  for (let plot of gameState.farmPlots) {
    renderPlot(plot);
  }
  
  // Render buildings
  for (let building of gameState.buildings) {
    renderBuilding(building);
  }
  
  // Render animals
  for (let animal of gameState.animals) {
    renderAnimal(animal);
  }
  
  p.pop();
  
  // Render UI
  renderUI();
  
  // Render seed selection menu if needed
  if (gameState.uiState.showSeedMenu) {
    renderSeedMenu();
  }
}

function renderFarmBackground() {
  // Ground
  p.fill(60, 100, 60);
  p.noStroke();
  p.rect(0, 0, TILE_SIZE * 10, TILE_SIZE * 10);
  
  // Grid lines
  p.stroke(50, 90, 50);
  p.strokeWeight(1);
  for (let x = 0; x <= 10; x++) {
    p.line(x * TILE_SIZE, 0, x * TILE_SIZE, TILE_SIZE * 10);
  }
  for (let y = 0; y <= 10; y++) {
    p.line(0, y * TILE_SIZE, TILE_SIZE * 10, y * TILE_SIZE);
  }
}

function renderPlot(plot) {
  const x = plot.x;
  const y = plot.y;
  
  p.push();
  
  // Base tile
  if (plot.state === "empty") {
    p.fill(60, 100, 60);
    p.stroke(50, 90, 50);
    p.strokeWeight(1);
    p.rect(x, y, TILE_SIZE, TILE_SIZE);
  } else if (plot.state === "tilled") {
    p.fill(80, 60, 40);
    p.stroke(70, 50, 30);
    p.strokeWeight(1);
    p.rect(x, y, TILE_SIZE, TILE_SIZE);
  } else if (plot.state === "planted" || plot.state === "growing" || plot.state === "ready") {
    // Tilled background
    p.fill(80, 60, 40);
    p.noStroke();
    p.rect(x, y, TILE_SIZE, TILE_SIZE);
    
    // Crop
    if (plot.cropType) {
      const crop = CROP_TYPES[plot.cropType];
      const progress = plot.growthStage / crop.stages;
      const size = 8 + progress * 16;
      
      p.fill(...crop.color);
      p.noStroke();
      
      if (plot.state === "ready") {
        // Full grown
        p.ellipse(x + TILE_SIZE / 2, y + TILE_SIZE / 2, size + 4, size + 4);
        // Sparkle
        p.fill(255, 255, 100, 150);
        p.ellipse(x + TILE_SIZE / 2 + 6, y + TILE_SIZE / 2 - 6, 4, 4);
      } else {
        // Growing
        p.ellipse(x + TILE_SIZE / 2, y + TILE_SIZE / 2, size, size);
      }
    }
  }
  
  p.pop();
}

function renderBuilding(building) {
  const x = building.x;
  const y = building.y;
  const buildingData = BUILDING_TYPES[building.type];
  const w = buildingData.width * TILE_SIZE;
  const h = buildingData.height * TILE_SIZE;
  
  p.push();
  
  if (!building.isComplete) {
    // Under construction
    p.fill(100, 100, 100, 150);
    p.stroke(80);
    p.strokeWeight(2);
    p.rect(x, y, w, h);
    
    // Progress bar
    p.fill(50);
    p.noStroke();
    p.rect(x + 5, y + h - 10, w - 10, 5);
    p.fill(100, 200, 100);
    p.rect(x + 5, y + h - 10, (w - 10) * building.constructionProgress, 5);
  } else {
    // Complete building
    p.fill(...buildingData.color);
    p.stroke(buildingData.color[0] - 40, buildingData.color[1] - 40, buildingData.color[2] - 40);
    p.strokeWeight(2);
    p.rect(x, y, w, h);
    
    // Building name
    p.fill(255);
    p.noStroke();
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(buildingData.name, x + w / 2, y + h / 2);
  }
  
  p.pop();
}

function renderAnimal(animal) {
  const animalData = ANIMAL_TYPES[animal.type];
  const x = animal.x + TILE_SIZE / 2;
  const y = animal.y + TILE_SIZE / 2;
  
  p.push();
  
  // Animal body
  const bobOffset = Math.sin(gameState.frameCounter * 0.1 + animal.animOffset) * 2;
  p.fill(...animalData.color);
  p.stroke(animalData.color[0] - 40, animalData.color[1] - 40, animalData.color[2] - 40);
  p.strokeWeight(1);
  p.ellipse(x, y + bobOffset, 20, 16);
  
  // Ready indicator
  if (animal.ready) {
    p.fill(255, 200, 50);
    p.noStroke();
    p.ellipse(x, y - 15, 8, 8);
  }
  
  p.pop();
}

function renderUI() {
  // Top bar background
  p.fill(40, 40, 50, 220);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 40);
  
  // Level and XP
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Level ${gameState.level}`, 10, 20);
  
  // XP Bar
  const xpBarX = 80;
  const xpBarY = 15;
  const xpBarW = 100;
  const xpBarH = 10;
  const nextLevelXP = LEVEL_THRESHOLDS[gameState.level] || gameState.xp;
  const prevLevelXP = gameState.level > 0 ? LEVEL_THRESHOLDS[gameState.level - 1] : 0;
  const xpProgress = (gameState.xp - prevLevelXP) / (nextLevelXP - prevLevelXP);
  
  p.fill(60);
  p.rect(xpBarX, xpBarY, xpBarW, xpBarH);
  p.fill(100, 200, 255);
  p.rect(xpBarX, xpBarY, xpBarW * Math.min(1, xpProgress), xpBarH);
  
  // Resources
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 215, 0);
  p.text(`💰 ${gameState.coins}`, 250, 20);
  p.fill(139, 90, 43);
  p.text(`🪵 ${gameState.wood}`, 330, 20);
  p.fill(150, 150, 150);
  p.text(`🪨 ${gameState.stone}`, 400, 20);
  
  // Score
  p.fill(100, 255, 100);
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(14);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 10, 20);
  
  // Bottom bar - instructions
  p.fill(40, 40, 50, 220);
  p.rect(0, CANVAS_HEIGHT - 60, CANVAS_WIDTH, 60);
  
  p.fill(200);
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Click plot to till → Click seeds → Click tilled plot to plant", 10, CANVAS_HEIGHT - 55);
  p.text("Click ready crops/animals to harvest/collect", 10, CANVAS_HEIGHT - 40);
  p.text("SPACE: Quick harvest | Arrow Keys: Pan | Click building spots", 10, CANVAS_HEIGHT - 25);
  
  // Building buttons
  renderBuildingButtons();
  
  // Active quests
  renderActiveQuests();
}

function renderBuildingButtons() {
  const startX = 10;
  const startY = CANVAS_HEIGHT - 100;
  let x = startX;
  
  p.textSize(10);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Till button
  p.fill(100, 80, 60);
  p.stroke(80, 60, 40);
  p.strokeWeight(2);
  p.rect(x, startY, 60, 30);
  p.fill(255);
  p.noStroke();
  p.text("Till (Click)", x + 30, startY + 15);
  x += 70;
  
  // Wheat seed
  if (gameState.level >= 1) {
    const selected = gameState.selectedCrop === "WHEAT";
    p.fill(...(selected ? [255, 220, 150] : [220, 180, 80]));
    p.stroke(200, 160, 60);
    p.strokeWeight(2);
    p.rect(x, startY, 60, 30);
    p.fill(0);
    p.noStroke();
    p.text("Wheat $10", x + 30, startY + 15);
    x += 70;
  }
  
  // Corn seed
  if (gameState.level >= 6) {
    const selected = gameState.selectedCrop === "CORN";
    p.fill(...(selected ? [255, 220, 150] : [255, 200, 50]));
    p.stroke(235, 180, 30);
    p.strokeWeight(2);
    p.rect(x, startY, 60, 30);
    p.fill(0);
    p.noStroke();
    p.text("Corn $20", x + 30, startY + 15);
    x += 70;
  }
  
  // Buildings
  const buildings = [
    { type: "BARN", level: 1 },
    { type: "MILL", level: 6 },
    { type: "BAKERY", level: 11 },
    { type: "SAWMILL", level: 16 }
  ];
  
  for (let bInfo of buildings) {
    if (gameState.level >= bInfo.level) {
      const buildingData = BUILDING_TYPES[bInfo.type];
      const selected = gameState.selectedBuilding === bInfo.type;
      
      p.fill(...(selected ? [255, 220, 150] : buildingData.color));
      p.stroke(buildingData.color[0] - 40, buildingData.color[1] - 40, buildingData.color[2] - 40);
      p.strokeWeight(2);
      p.rect(x, startY, 70, 30);
      p.fill(255);
      p.noStroke();
      p.text(buildingData.name, x + 35, startY + 10);
      p.textSize(8);
      p.text(`$${buildingData.cost}`, x + 35, startY + 22);
      p.textSize(10);
      x += 80;
    }
  }
  
  // House upgrade
  if (gameState.level >= 21 && gameState.farmHouseLevel === 0) {
    p.fill(200, 150, 100);
    p.stroke(180, 130, 80);
    p.strokeWeight(2);
    p.rect(x, startY, 80, 30);
    p.fill(255);
    p.noStroke();
    p.text("Upgrade House", x + 40, startY + 10);
    p.textSize(8);
    p.text("$500", x + 40, startY + 22);
    p.textSize(10);
  }
}

function renderActiveQuests() {
  const startX = CANVAS_WIDTH - 180;
  const startY = 50;
  
  p.fill(40, 40, 50, 220);
  p.noStroke();
  p.rect(startX, startY, 170, 100);
  
  p.fill(200);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Active Quests:", startX + 5, startY + 5);
  
  p.textSize(10);
  let y = startY + 25;
  for (let quest of gameState.activeQuests.slice(0, 3)) {
    p.text(`• ${quest.title}`, startX + 5, y);
    if (quest.progress !== undefined && quest.target) {
      p.text(`  ${quest.progress}/${quest.target}`, startX + 5, y + 12);
      y += 24;
    } else {
      y += 18;
    }
  }
}

function renderSeedMenu() {
  // Not implemented for this version
}

function renderPausedOverlay() {
  p.fill(255);
  p.textSize(18);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function renderGameOverScreen(won) {
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (won) {
    p.textSize(48);
    p.fill(100, 255, 100);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
    
    p.textSize(18);
    p.fill(255);
    p.text("You built a prosperous farm!", CANVAS_WIDTH / 2, 160);
  } else {
    p.textSize(48);
    p.fill(255, 100, 100);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
    
    p.textSize(18);
    p.fill(255);
    p.text("Your farm went bankrupt!", CANVAS_WIDTH / 2, 160);
  }
  
  // Score
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.textSize(18);
  p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 250);
  
  // Restart prompt
  p.textSize(20);
  p.fill(100, 255, 100);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}