import { gameState, LEVELS, CANVAS_WIDTH, CANVAS_HEIGHT, UPGRADES } from './globals.js';

export function drawUI(p) {
  if (gameState.gamePhase === 'START') {
    drawStartScreen(p);
  } else if (gameState.gamePhase === 'PLAYING') {
    drawPlayingUI(p);
    drawUpgradePanel(p);
  } else if (gameState.gamePhase === 'PAUSED') {
    drawPlayingUI(p);
    drawUpgradePanel(p);
    drawPausedOverlay(p);
  } else if (gameState.gamePhase === 'GAME_OVER_WIN' || gameState.gamePhase === 'GAME_OVER_LOSE') {
    drawGameOverScreen(p);
  }
}

function drawStartScreen(p) {
  p.push();
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.fill(255, 255, 100);
  p.stroke(0, 100, 200);
  p.strokeWeight(4);
  p.text('OCEAN HUNTER', CANVAS_WIDTH / 2, 80);
  
  p.textSize(28);
  p.fill(100, 200, 255);
  p.text('Cannon Fury', CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.textSize(16);
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    'OBJECTIVE:',
    '  Complete all 9 levels (3 easy, 3 medium, 3 hard)',
    '  by reaching the target score before time runs out!',
    '',
    'FISH TYPES:',
    '  Sardine (Blue) - 10 pts   Clownfish (Orange) - 15 pts',
    '  Tuna (Green) - 25 pts     Seahorse (Yellow) - 30 pts',
    '  Manta Ray (Orange) - 50pts  Jellyfish (Purple) - 60 pts',
    '  Swordfish (Blue) - 100 pts  Shark (Grey) - 200 pts',
    '  Giant Squid (Purple) - 500 pts',
    '',
    'CONTROLS:',
    '  Arrow Keys - Aim cannon (hold for continuous rotation)',
    '  SPACE - Fire',
    '  1-4 - Purchase upgrades during gameplay',
    '  ESC - Pause   R - Restart (from game over)'
  ];
  
  let y = 155;
  for (const line of instructions) {
    p.text(line, 40, y);
    y += 16;
  }
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.fill(255, 255, 0);
  const alpha = (p.sin(p.frameCount * 0.1) + 1) * 127 + 128;
  p.fill(255, 255, 0, alpha);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  
  p.pop();
}

function drawPlayingUI(p) {
  p.push();
  p.textSize(18);
  p.fill(255);
  p.noStroke();
  
  // Score (top-left)
  p.textAlign(p.LEFT, p.TOP);
  p.text(`SCORE: ${String(gameState.score).padStart(5, '0')}`, 10, 10);
  p.textSize(14);
  p.text(`TOTAL: ${String(gameState.totalGameScore).padStart(5, '0')}`, 10, 32);
  
  // Level (top-right)
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(18);
  const currentLevel = LEVELS[gameState.level - 1];
  if (currentLevel) {
    p.text(`LEVEL ${currentLevel.number}: ${currentLevel.name}`, CANVAS_WIDTH - 10, 10);
    
    // Target score
    p.textSize(14);
    p.text(`Target: ${currentLevel.targetScore}`, CANVAS_WIDTH - 10, 35);
  }
  
  // Time remaining (top-center)
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(20);
  const timeColor = gameState.timeRemaining < 10 ? [255, 100, 100] : [255, 255, 255];
  p.fill(...timeColor);
  p.text(`TIME: ${Math.ceil(gameState.timeRemaining)}s`, CANVAS_WIDTH / 2, 10);
  
  p.pop();
}

function drawUpgradePanel(p) {
  p.push();
  
  const panelX = 10;
  const panelY = CANVAS_HEIGHT - 85;
  const panelWidth = CANVAS_WIDTH - 20;
  const panelHeight = 75;
  
  // Panel background
  p.fill(0, 0, 0, 180);
  p.stroke(100, 200, 255);
  p.strokeWeight(2);
  p.rect(panelX, panelY, panelWidth, panelHeight, 5);
  
  // Title
  p.noStroke();
  p.fill(255, 255, 100);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text('UPGRADES:', panelX + 10, panelY + 8);
  
  // Draw each upgrade
  const upgradeTypes = ['DAMAGE', 'FIRE_RATE', 'ROTATION_SPEED', 'WEAPON_TYPE'];
  const upgradeKeys = ['damage', 'fireRate', 'rotationSpeed', 'weaponType'];
  const keyNumbers = ['1', '2', '3', '4'];
  
  p.textSize(10);
  for (let i = 0; i < upgradeTypes.length; i++) {
    const x = panelX + 15 + i * 143;
    const y = panelY + 28;
    
    const upgradeType = upgradeTypes[i];
    const upgradeKey = upgradeKeys[i];
    const currentLevel = gameState.upgrades[upgradeKey];
    const upgradeData = UPGRADES[upgradeType];
    const maxLevel = upgradeData.levels.length - 1;
    
    // Upgrade name and level
    p.fill(100, 200, 255);
    p.text(`[${keyNumbers[i]}] ${upgradeData.name}`, x, y);
    p.fill(255);
    p.text(`Lv ${currentLevel}/${maxLevel}`, x, y + 13);
    
    // Current value
    const currentValue = upgradeData.levels[currentLevel];
    let valueText = '';
    if (upgradeType === 'DAMAGE') {
      valueText = `${currentValue}x`;
    } else if (upgradeType === 'FIRE_RATE') {
      valueText = `${Math.round(100 / currentValue)}%`;
    } else if (upgradeType === 'ROTATION_SPEED') {
      valueText = `${currentValue}x`;
    } else if (upgradeType === 'WEAPON_TYPE') {
      valueText = currentValue;
    }
    p.fill(150, 255, 150);
    p.text(valueText, x + 65, y + 13);
    
    // Next upgrade cost or MAX
    if (currentLevel < maxLevel) {
      const nextCost = upgradeData.costs[currentLevel + 1];
      const canAfford = gameState.totalGameScore >= nextCost;
      p.fill(canAfford ? [255, 255, 100] : [150, 150, 150]);
      p.text(`Next: ${nextCost}`, x, y + 26);
    } else {
      p.fill(255, 100, 255);
      p.text('MAX', x, y + 26);
    }
  }
  
  p.pop();
}

function drawPausedOverlay(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.fill(255, 255, 0);
  p.stroke(0);
  p.strokeWeight(4);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(20);
  p.noStroke();
  p.fill(255);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  
  p.pop();
}

function drawGameOverScreen(p) {
  p.push();
  
  const isWin = gameState.gamePhase === 'GAME_OVER_WIN';
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
  p.stroke(0);
  p.strokeWeight(4);
  p.text(isWin ? 'YOU WIN!' : 'GAME OVER', CANVAS_WIDTH / 2, 80);
  
  // Final score
  p.textSize(24);
  p.fill(255);
  p.noStroke();
  p.text(`Final Score: ${gameState.totalGameScore}`, CANVAS_WIDTH / 2, 150);
  
  // Level reached
  if (!isWin) {
    p.textSize(18);
    p.text(`Level Reached: ${gameState.level}`, CANVAS_WIDTH / 2, 180);
  }
  
  // High scores
  p.textSize(20);
  p.text('HIGH SCORES', CANVAS_WIDTH / 2, 220);
  
  p.textSize(16);
  for (let i = 0; i < Math.min(5, gameState.highScores.length); i++) {
    p.text(`${i + 1}. ${gameState.highScores[i]}`, CANVAS_WIDTH / 2, 250 + i * 25);
  }
  
  // Restart prompt
  p.textSize(24);
  const alpha = (p.sin(p.frameCount * 0.1) + 1) * 127 + 128;
  p.fill(255, 255, 0, alpha);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  
  p.pop();
}