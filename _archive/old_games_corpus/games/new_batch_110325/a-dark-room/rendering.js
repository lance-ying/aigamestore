// rendering.js - Rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { getAvailableActions } from './actions.js';

export function renderStartScreen(p) {
  p.background(20, 15, 25);
  
  // Title
  p.fill(200, 180, 220);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text('A DARK ROOM', CANVAS_WIDTH / 2, 80);
  
  // Description
  p.textSize(14);
  p.fill(150, 140, 160);
  const desc = [
    'The room is cold. The fire is dead.',
    'You must survive by gathering resources,',
    'building a village, and exploring the unknown.',
    '',
    'Manage wood, food, and supplies wisely.',
    'Attract wanderers. Unlock new abilities.',
    'Venture into dangerous expeditions.',
    'Discover the truth of the ancient city.'
  ];
  
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], CANVAS_WIDTH / 2, 150 + i * 20);
  }
  
  // Instructions
  p.textSize(12);
  p.fill(120, 110, 130);
  p.text('ARROW KEYS: Navigate  |  SPACE/Z: Select  |  SHIFT: Back', CANVAS_WIDTH / 2, 320);
  
  // Start prompt
  p.textSize(18);
  p.fill(220, 200, 230);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 360);
}

export function renderGame(p) {
  p.background(15, 10, 20);
  
  if (gameState.inExpedition) {
    renderExpedition(p);
  } else {
    renderVillage(p);
  }
  
  // Pause indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.text('PAUSED', CANVAS_WIDTH - 10, 10);
  }
}

function renderVillage(p) {
  // Fire visualization
  const fireX = 100;
  const fireY = 150;
  const fireBrightness = (gameState.fireTemp / gameState.maxFireTemp);
  
  // Fire glow
  p.noStroke();
  for (let i = 5; i > 0; i--) {
    const alpha = fireBrightness * 80 * (i / 5);
    p.fill(255, 150 - i * 20, 0, alpha);
    p.ellipse(fireX, fireY, 60 + i * 15, 60 + i * 15);
  }
  
  // Fire core
  p.fill(...(gameState.fireTemp > 0 ? [255, 200, 100] : [60, 50, 50]));
  p.ellipse(fireX, fireY, 40, 40);
  
  // Fire text
  p.fill(200, 180, 160);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(12);
  p.text(`Fire: ${Math.floor(gameState.fireTemp)}`, fireX, fireY + 40);
  
  // Resources panel
  renderResourcePanel(p);
  
  // Village info
  renderVillageInfo(p);
  
  // Actions menu
  renderActionsMenu(p);
}

function renderResourcePanel(p) {
  const panelX = 20;
  const panelY = 20;
  
  p.fill(40, 35, 45);
  p.stroke(80, 70, 90);
  p.strokeWeight(2);
  p.rect(panelX, panelY, 180, 100, 5);
  
  p.noStroke();
  p.fill(200, 180, 160);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  
  p.text(`Wood: ${gameState.wood}`, panelX + 10, panelY + 10);
  p.text(`Food: ${gameState.food}`, panelX + 10, panelY + 30);
  p.text(`Fur: ${gameState.fur}`, panelX + 10, panelY + 50);
  
  if (gameState.workshops > 0) {
    p.textSize(10);
    p.fill(100, 180, 100);
    p.text(`+${gameState.workshops}/s`, panelX + 130, panelY + 10);
  }
}

function renderVillageInfo(p) {
  const infoX = 220;
  const infoY = 20;
  
  p.fill(40, 35, 45);
  p.stroke(80, 70, 90);
  p.strokeWeight(2);
  p.rect(infoX, infoY, 160, 100, 5);
  
  p.noStroke();
  p.fill(200, 180, 160);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  
  p.text(`Population: ${gameState.population}/${gameState.maxPopulation}`, infoX + 10, infoY + 10);
  p.text(`Huts: ${gameState.huts}`, infoX + 10, infoY + 30);
  p.text(`Workshops: ${gameState.workshops}`, infoX + 10, infoY + 50);
  
  // Narrative hints
  p.textSize(10);
  p.fill(150, 140, 160);
  if (gameState.narrativeStage === 0) {
    p.text('Light the fire...', infoX + 10, infoY + 75);
  } else if (gameState.narrativeStage === 1 && gameState.wood >= 100) {
    p.text('Build shelter...', infoX + 10, infoY + 75);
  }
}

function renderActionsMenu(p) {
  const menuX = 20;
  const menuY = 200;
  const menuWidth = 560;
  const menuHeight = 180;
  
  p.fill(40, 35, 45);
  p.stroke(80, 70, 90);
  p.strokeWeight(2);
  p.rect(menuX, menuY, menuWidth, menuHeight, 5);
  
  // Title
  p.noStroke();
  p.fill(200, 180, 160);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text('ACTIONS', menuX + 10, menuY + 10);
  
  // Available actions
  gameState.availableActions = getAvailableActions();
  
  const startY = menuY + 40;
  const actionHeight = 25;
  
  for (let i = 0; i < gameState.availableActions.length; i++) {
    const action = gameState.availableActions[i];
    const y = startY + i * actionHeight;
    
    // Selection highlight
    if (i === gameState.selectedActionIndex) {
      p.fill(80, 70, 90);
      p.rect(menuX + 5, y - 2, menuWidth - 10, actionHeight - 2, 3);
    }
    
    // Action name
    p.fill(...(action.canAfford ? [200, 180, 160] : [100, 90, 100]));
    p.textSize(14);
    p.text(action.name, menuX + 15, y + 3);
    
    // Cost
    if (Object.keys(action.cost).length > 0) {
      const costStr = Object.entries(action.cost)
        .map(([res, amt]) => `${amt} ${res}`)
        .join(', ');
      p.textSize(11);
      p.fill(...(action.canAfford ? [120, 110, 130] : [80, 70, 80]));
      p.text(`(${costStr})`, menuX + 180, y + 5);
    }
    
    // Description
    p.textSize(10);
    p.fill(100, 90, 100);
    p.text(action.description, menuX + 340, y + 6);
  }
  
  if (gameState.availableActions.length === 0) {
    p.fill(150, 140, 160);
    p.textSize(12);
    p.text('No actions available', menuX + 15, startY);
  }
}

function renderExpedition(p) {
  if (gameState.inCombat) {
    renderCombat(p);
  } else {
    renderExpeditionMap(p);
  }
}

function renderExpeditionMap(p) {
  // Header
  p.fill(200, 180, 160);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(20);
  p.text('EXPEDITION', CANVAS_WIDTH / 2, 20);
  
  // Status bar
  const barX = 50;
  const barY = 60;
  const barWidth = 500;
  
  p.fill(40, 35, 45);
  p.stroke(80, 70, 90);
  p.strokeWeight(2);
  p.rect(barX, barY, barWidth, 60, 5);
  
  p.noStroke();
  p.fill(200, 180, 160);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  p.text(`Health: ${gameState.playerHealth}/${gameState.maxHealth}`, barX + 10, barY + 20);
  p.text(`Supplies: ${gameState.supplies}`, barX + 10, barY + 40);
  
  // Health bar
  const healthBarX = barX + 200;
  const healthBarY = barY + 15;
  const healthBarWidth = 280;
  const healthBarHeight = 30;
  
  p.fill(60, 50, 50);
  p.rect(healthBarX, healthBarY, healthBarWidth, healthBarHeight, 3);
  
  const healthPercent = gameState.playerHealth / gameState.maxHealth;
  p.fill(...(healthPercent > 0.5 ? [100, 180, 100] : healthPercent > 0.25 ? [180, 180, 100] : [180, 100, 100]));
  p.rect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight, 3);
  
  // Map
  const mapY = 150;
  const locationSpacing = 100;
  const startX = 50;
  
  for (let i = 0; i < 6; i++) {
    const x = startX + i * locationSpacing;
    const loc = ['village', 'forest', 'ruins', 'mountains', 'desert', 'city'][i];
    const isVisited = gameState.locationsVisited.has(loc);
    const isCurrent = gameState.expeditionLocation === loc;
    
    // Location dot
    p.fill(...(isCurrent ? [220, 200, 100] : isVisited ? [100, 180, 100] : [80, 70, 80]));
    p.ellipse(x, mapY, isCurrent ? 20 : 15, isCurrent ? 20 : 15);
    
    // Connection line
    if (i < 5) {
      p.stroke(...(isVisited ? [100, 180, 100] : [80, 70, 80]));
      p.strokeWeight(2);
      p.line(x + 10, mapY, x + locationSpacing - 10, mapY);
    }
    
    // Label
    p.noStroke();
    p.fill(150, 140, 160);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(9);
    const labels = ['Village', 'Forest', 'Ruins', 'Mountains', 'Desert', 'City'];
    p.text(labels[i], x, mapY + 15);
  }
  
  // Instructions
  p.fill(200, 180, 160);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(12);
  p.text('SPACE: Move Forward  |  SHIFT: Return to Village', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  // Combat log
  renderCombatLog(p, 260);
}

function renderCombat(p) {
  // Header
  p.fill(200, 180, 160);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(20);
  p.text('COMBAT', CANVAS_WIDTH / 2, 20);
  
  // Player status
  const playerX = 150;
  const statusY = 80;
  
  p.fill(40, 35, 45);
  p.stroke(80, 70, 90);
  p.strokeWeight(2);
  p.rect(playerX - 70, statusY, 140, 80, 5);
  
  p.noStroke();
  p.fill(200, 180, 160);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text('You', playerX, statusY + 10);
  p.textSize(12);
  p.text(`HP: ${gameState.playerHealth}/${gameState.maxHealth}`, playerX, statusY + 35);
  
  // Health bar
  const hpBarWidth = 100;
  const hpBarX = playerX - hpBarWidth / 2;
  const hpBarY = statusY + 55;
  
  p.fill(60, 50, 50);
  p.rect(hpBarX, hpBarY, hpBarWidth, 10, 2);
  
  const hpPercent = gameState.playerHealth / gameState.maxHealth;
  p.fill(...(hpPercent > 0.5 ? [100, 180, 100] : hpPercent > 0.25 ? [180, 180, 100] : [180, 100, 100]));
  p.rect(hpBarX, hpBarY, hpBarWidth * hpPercent, 10, 2);
  
  // Enemy status
  const enemyX = 450;
  
  p.fill(40, 35, 45);
  p.stroke(80, 70, 90);
  p.strokeWeight(2);
  p.rect(enemyX - 70, statusY, 140, 80, 5);
  
  p.noStroke();
  p.fill(200, 180, 160);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text(gameState.enemyName, enemyX, statusY + 10);
  p.textSize(12);
  p.text(`HP: ${gameState.enemyHealth}/${gameState.enemyMaxHealth}`, enemyX, statusY + 35);
  
  // Enemy health bar
  const enemyHpBarX = enemyX - hpBarWidth / 2;
  
  p.fill(60, 50, 50);
  p.rect(enemyHpBarX, hpBarY, hpBarWidth, 10, 2);
  
  const enemyHpPercent = gameState.enemyHealth / gameState.enemyMaxHealth;
  p.fill(180, 100, 100);
  p.rect(enemyHpBarX, hpBarY, hpBarWidth * enemyHpPercent, 10, 2);
  
  // Combat actions
  const actionY = 200;
  const actions = [
    { name: 'Attack', key: 'attack', selected: gameState.selectedActionIndex === 0 },
    { name: 'Flee', key: 'flee', selected: gameState.selectedActionIndex === 1 }
  ];
  
  for (let i = 0; i < actions.length; i++) {
    const x = 200 + i * 200;
    
    p.fill(...(actions[i].selected ? [80, 70, 90] : [40, 35, 45]));
    p.stroke(80, 70, 90);
    p.strokeWeight(2);
    p.rect(x - 80, actionY, 160, 40, 5);
    
    p.noStroke();
    p.fill(200, 180, 160);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(actions[i].name, x, actionY + 20);
  }
  
  // Instructions
  p.fill(150, 140, 160);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(12);
  p.text('ARROW KEYS: Select  |  SPACE: Confirm', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
  
  // Combat log
  renderCombatLog(p, 260);
}

function renderCombatLog(p, yPos) {
  p.fill(40, 35, 45);
  p.stroke(80, 70, 90);
  p.strokeWeight(2);
  p.rect(50, yPos, 500, 120, 5);
  
  p.noStroke();
  p.fill(200, 180, 160);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(11);
  
  const startY = yPos + 10;
  const lineHeight = 14;
  const maxLines = 8;
  const visibleLogs = gameState.combatLog.slice(-maxLines);
  
  for (let i = 0; i < visibleLogs.length; i++) {
    p.text(visibleLogs[i], 60, startY + i * lineHeight);
  }
}

export function renderGameOver(p) {
  p.background(20, 15, 25);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(...(isWin ? [100, 220, 100] : [220, 100, 100]));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(isWin ? 'JOURNEY COMPLETE' : 'GAME OVER', CANVAS_WIDTH / 2, 100);
  
  // Message
  p.textSize(16);
  p.fill(200, 180, 160);
  
  if (isWin) {
    const messages = [
      'You have reached the Ancient City.',
      'The secrets of the past are revealed.',
      'Your journey through the darkness is complete.',
      '',
      `Final Resources:`,
      `Wood: ${gameState.wood}  Food: ${gameState.food}  Fur: ${gameState.fur}`,
      `Population: ${gameState.population}`,
      `Locations Visited: ${gameState.locationsVisited.size}`
    ];
    
    for (let i = 0; i < messages.length; i++) {
      p.text(messages[i], CANVAS_WIDTH / 2, 170 + i * 22);
    }
  } else {
    p.text('You have fallen in the wilderness.', CANVAS_WIDTH / 2, 180);
    p.text('The darkness claims another soul.', CANVAS_WIDTH / 2, 210);
    p.textSize(14);
    p.fill(150, 140, 160);
    p.text(`You survived ${gameState.expeditionProgress} locations`, CANVAS_WIDTH / 2, 250);
  }
  
  // Restart prompt
  p.textSize(18);
  p.fill(220, 200, 230);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 350);
}