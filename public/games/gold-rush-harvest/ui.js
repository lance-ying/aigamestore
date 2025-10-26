// ui.js - UI rendering

import { gameState, GAME_PHASES, CROP_DATA, ANIMAL_DATA, BUILDING_DATA, XP_PER_LEVEL, LEVEL_CONFIG } from './globals.js';

export function renderUI(p, gameState) {
  // Top bar
  p.push();
  p.fill(40, 40, 60);
  p.rect(0, 0, 600, 60);
  
  // Level
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(`LVL ${gameState.playerLevel}`, 10, 15);
  
  // XP bar
  const xpCurrent = gameState.playerXP - XP_PER_LEVEL[gameState.playerLevel - 1];
  const xpNeeded = XP_PER_LEVEL[gameState.playerLevel] - XP_PER_LEVEL[gameState.playerLevel - 1];
  const xpPercent = xpCurrent / xpNeeded;
  
  p.fill(60, 60, 80);
  p.rect(10, 25, 100, 10);
  p.fill(0, 200, 0);
  p.rect(10, 25, 100 * xpPercent, 10);
  
  p.fill(255);
  p.textSize(10);
  p.text(`XP: ${Math.floor(xpCurrent)}/${xpNeeded}`, 12, 30);
  
  // Gold
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text(`💰 ${gameState.playerGold}G`, 300, 30);
  
  // Score
  p.fill(255);
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(14);
  const scoreStr = String(gameState.score).padStart(6, '0');
  p.text(`SCORE: ${scoreStr}`, 590, 20);
  
  // Level name
  const levelConfig = LEVEL_CONFIG[gameState.currentLevel];
  if (levelConfig) {
    p.textSize(12);
    p.text(levelConfig.name, 590, 40);
  }
  
  p.pop();
  
  // Objectives panel (right side)
  renderObjectives(p, gameState);
  
  // Menu rendering
  if (gameState.showingMenu) {
    renderMenu(p, gameState);
  }
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.push();
    p.fill(255, 255, 0);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text('PAUSED', 590, 70);
    p.pop();
  }
}

export function renderObjectives(p, gameState) {
  p.push();
  p.fill(40, 40, 60, 230);
  p.rect(450, 70, 140, 200);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text('Objectives:', 460, 80);
  
  let yOffset = 100;
  for (const objective of gameState.levelObjectives) {
    const completed = objective.completed;
    p.fill(completed ? [0, 255, 0] : [255, 255, 255]);
    p.textSize(10);
    
    let objText = '';
    if (objective.type === 'harvest' || objective.type === 'collect') {
      const current = gameState.resources[objective.resource] || 0;
      objText = `${objective.resource}: ${current}/${objective.amount}`;
    } else if (objective.type === 'produce') {
      objText = `Make ${objective.amount} ${objective.resource}`;
    } else if (objective.type === 'build') {
      objText = `Build ${objective.building}`;
    } else if (objective.type === 'score') {
      objText = `Score: ${gameState.score}/${objective.amount}`;
    }
    
    if (completed) {
      objText = '✓ ' + objText;
    } else {
      objText = '○ ' + objText;
    }
    
    p.text(objText, 460, yOffset);
    yOffset += 18;
  }
  
  p.pop();
}

export function renderMenu(p, gameState) {
  const menuType = gameState.showingMenu;
  
  p.push();
  p.fill(60, 60, 80, 250);
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(150, 100, 300, 250);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  
  if (menuType === 'seed') {
    p.text('Plant Seeds', 300, 110);
    
    let yOffset = 140;
    let index = 0;
    for (const [cropName, cropData] of Object.entries(CROP_DATA)) {
      const canAfford = gameState.playerGold >= cropData.seedCost;
      p.fill(canAfford ? [255, 255, 255] : [150, 150, 150]);
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(12);
      
      const text = `${index + 1}. ${cropName} (${cropData.seedCost}G)`;
      p.text(text, 170, yOffset);
      
      yOffset += 25;
      index++;
    }
    
    p.fill(255);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(10);
    p.text('Use number keys 1-4 or press Z to cancel', 300, 340);
  } else if (menuType === 'building') {
    p.text('Build Structures', 300, 110);
    
    let yOffset = 140;
    let index = 0;
    for (const [buildingName, buildingData] of Object.entries(BUILDING_DATA)) {
      const canAfford = gameState.playerGold >= buildingData.cost;
      p.fill(canAfford ? [255, 255, 255] : [150, 150, 150]);
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(12);
      
      const text = `${index + 1}. ${buildingName} (${buildingData.cost}G)`;
      p.text(text, 170, yOffset);
      
      yOffset += 25;
      index++;
    }
    
    p.fill(255);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(10);
    p.text('Use number keys 1-5 or press Z to cancel', 300, 340);
  } else if (menuType === 'animal') {
    p.text('Buy Animals', 300, 110);
    
    let yOffset = 140;
    let index = 0;
    for (const [animalName, animalData] of Object.entries(ANIMAL_DATA)) {
      const canAfford = gameState.playerGold >= animalData.cost;
      p.fill(canAfford ? [255, 255, 255] : [150, 150, 150]);
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(12);
      
      const text = `${index + 1}. ${animalName} (${animalData.cost}G)`;
      p.text(text, 170, yOffset);
      
      yOffset += 25;
      index++;
    }
    
    p.fill(255);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(10);
    p.text('Use number keys 1-3 or press Z to cancel', 300, 340);
  } else if (menuType === 'expedition') {
    p.text('Choose Expedition', 300, 110);
    
    const expeditions = ['forest', 'mining', 'panning', 'mountain'];
    let yOffset = 140;
    
    for (let i = 0; i < expeditions.length; i++) {
      const unlocked = gameState.currentLevel > i;
      p.fill(unlocked ? [255, 255, 255] : [100, 100, 100]);
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(12);
      
      const text = `${i + 1}. ${expeditions[i].toUpperCase()}`;
      p.text(text, 170, yOffset);
      
      yOffset += 30;
    }
    
    p.fill(255);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(10);
    p.text('Use number keys 1-4 or press Z to cancel', 300, 340);
  }
  
  p.pop();
}