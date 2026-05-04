// ui.js - UI rendering and interaction

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, UNIT_TYPES, UNIT_CONFIGS, GAME_PHASES } from './globals.js';

export function renderUI(p) {
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderGameUI(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderGameUI(p);
    renderPauseOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    renderWinScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderLoseScreen(p);
  }
}

function renderStartScreen(p) {
  p.background(30, 40, 50);
  
  // Title
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("COASTAL CONQUEST", CANVAS_WIDTH / 2, 80);
  
  p.textSize(20);
  p.text("Island Skirmish", CANVAS_WIDTH / 2, 115);
  
  // Description
  p.textSize(14);
  p.fill(200);
  const desc = [
    "Deploy units strategically to destroy the enemy HQ",
    "while protecting your own base.",
    "",
    "Manage resources wisely and choose your units carefully.",
    "Infantry are cheap and versatile.",
    "Artillery has long range but low health.",
    "Tanks are powerful but expensive."
  ];
  
  let yPos = 160;
  desc.forEach(line => {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 20;
  });
  
  // Controls
  p.textSize(14);
  p.fill(255, 255, 150);
  yPos += 10;
  const controls = [
    "Controls:",
    "Z - Deploy Infantry (50 resources)",
    "SHIFT - Deploy Artillery (100 resources)",
    "UP ARROW - Deploy Tank (150 resources)",
    "SPACE - End Turn",
    "ESC - Pause",
    "R - Restart (from Game Over)"
  ];
  
  controls.forEach(line => {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 18;
  });
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

function renderGameUI(p) {
  // Score
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${gameState.score}`, 10, 10);
  
  // Level
  p.text(`LEVEL: ${gameState.currentLevel}`, 10, 30);
  
  // Resources
  p.text(`RESOURCES: ${gameState.playerResources}`, 10, 50);
  
  // HQ Health
  if (gameState.playerHQ) {
    const hqHealthPercent = Math.floor((gameState.playerHQ.health / gameState.playerHQ.maxHealth) * 100);
    p.text(`HQ: ${hqHealthPercent}%`, 10, 70);
  }
  
  // Unit selection panel
  renderUnitPanel(p);
  
  // End turn button
  renderEndTurnButton(p);
  
  // Selected unit indicator
  if (gameState.selectedUnitType) {
    p.fill(255, 255, 100);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(14);
    const config = UNIT_CONFIGS[gameState.selectedUnitType];
    p.text(`Selected: ${config.displayName} (${config.cost} resources)`, CANVAS_WIDTH / 2, 10);
  }
}

function renderUnitPanel(p) {
  const panelY = CANVAS_HEIGHT - 80;
  const panelHeight = 70;
  
  p.fill(40, 50, 60, 220);
  p.noStroke();
  p.rect(0, panelY, CANVAS_WIDTH, panelHeight);
  
  // Unit buttons
  const buttonWidth = 120;
  const buttonHeight = 50;
  const buttonSpacing = 20;
  const startX = 20;
  const buttonY = panelY + 10;
  
  const units = [
    { type: UNIT_TYPES.INFANTRY, key: 'Z' },
    { type: UNIT_TYPES.ARTILLERY, key: 'SHIFT' },
    { type: UNIT_TYPES.TANK, key: 'UP' }
  ];
  
  units.forEach((unitInfo, index) => {
    const x = startX + index * (buttonWidth + buttonSpacing);
    const config = UNIT_CONFIGS[unitInfo.type];
    const isSelected = gameState.selectedUnitType === unitInfo.type;
    const canAfford = gameState.playerResources >= config.cost;
    
    // Button background
    if (isSelected) {
      p.fill(100, 150, 255);
    } else if (canAfford) {
      p.fill(60, 80, 100);
    } else {
      p.fill(40, 40, 40);
    }
    
    p.stroke(isSelected ? 255 : 150);
    p.strokeWeight(isSelected ? 3 : 1);
    p.rect(x, buttonY, buttonWidth, buttonHeight, 5);
    
    // Unit icon
    p.push();
    p.translate(x + 25, buttonY + buttonHeight / 2);
    p.fill(...config.color);
    p.noStroke();
    
    if (unitInfo.type === UNIT_TYPES.INFANTRY) {
      p.circle(0, 0, 20);
    } else if (unitInfo.type === UNIT_TYPES.ARTILLERY) {
      p.triangle(-10, 10, 10, 10, 0, -10);
    } else if (unitInfo.type === UNIT_TYPES.TANK) {
      p.rectMode(p.CENTER);
      p.rect(0, 0, 20, 14);
    }
    p.pop();
    
    // Text
    p.fill(canAfford ? 255 : 150);
    p.noStroke();
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(12);
    p.text(config.displayName, x + 50, buttonY + buttonHeight / 2 - 8);
    p.textSize(10);
    p.text(`${config.cost} res`, x + 50, buttonY + buttonHeight / 2 + 8);
    
    // Key hint
    p.fill(200);
    p.textSize(9);
    p.text(unitInfo.key, x + 5, buttonY + 5);
  });
}

function renderEndTurnButton(p) {
  const buttonWidth = 120;
  const buttonHeight = 40;
  const buttonX = CANVAS_WIDTH - buttonWidth - 20;
  const buttonY = CANVAS_HEIGHT - 60;
  
  p.fill(100, 200, 100);
  p.stroke(150, 255, 150);
  p.strokeWeight(2);
  p.rect(buttonX, buttonY, buttonWidth, buttonHeight, 5);
  
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text("END TURN", buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 - 5);
  p.textSize(10);
  p.text("(SPACE)", buttonX + buttonWidth / 2, buttonY + buttonHeight / 2 + 10);
}

function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(16);
  p.text("Press ESC to Resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  p.text("Press R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

function renderWinScreen(p) {
  p.background(30, 50, 30);
  
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
  
  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  
  p.textSize(18);
  p.text("All islands conquered!", CANVAS_WIDTH / 2, 230);
  
  p.fill(150, 255, 150);
  p.textSize(16);
  p.text("Press R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
}

function renderLoseScreen(p) {
  p.background(50, 30, 30);
  
  p.fill(255, 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("DEFEAT", CANVAS_WIDTH / 2, 100);
  
  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  
  p.textSize(18);
  p.text("Your HQ has been destroyed", CANVAS_WIDTH / 2, 230);
  
  p.fill(255, 150, 150);
  p.textSize(16);
  p.text("Press R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
}

export function handleUIClick(p, mouseX, mouseY) {
  if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
  
  // Check unit panel clicks
  const panelY = CANVAS_HEIGHT - 80;
  if (mouseY >= panelY) {
    const buttonWidth = 120;
    const buttonSpacing = 20;
    const startX = 20;
    
    const units = [UNIT_TYPES.INFANTRY, UNIT_TYPES.ARTILLERY, UNIT_TYPES.TANK];
    
    units.forEach((type, index) => {
      const x = startX + index * (buttonWidth + buttonSpacing);
      const buttonY = panelY + 10;
      const buttonHeight = 50;
      
      if (mouseX >= x && mouseX <= x + buttonWidth && 
          mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
        const config = UNIT_CONFIGS[type];
        if (gameState.playerResources >= config.cost) {
          gameState.selectedUnitType = type;
        }
      }
    });
    
    // Check end turn button
    const buttonWidth = 120;
    const buttonHeight = 40;
    const buttonX = CANVAS_WIDTH - buttonWidth - 20;
    const buttonY = CANVAS_HEIGHT - 60;
    
    if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
        mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
      if (!gameState.combatPhase) {
        const { startCombatPhase } = require('./combat.js');
        startCombatPhase();
      }
    }
  }
}