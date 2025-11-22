import { gameState, TOWER_TYPES, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawUI(p) {
  // Top bar
  p.push();
  p.fill(30, 30, 40);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 40);
  
  // Lives
  p.fill(255, 100, 100);
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`❤ ${gameState.lives}`, 10, 20);
  
  // Gold
  p.fill(255, 215, 0);
  p.text(`💰 ${gameState.gold}`, 80, 20);
  
  // Wave
  p.fill(150, 200, 255);
  p.text(`Wave ${gameState.currentWave + 1}/${gameState.totalWaves}`, 180, 20);
  
  // Score
  p.fill(200, 200, 200);
  p.text(`Score: ${gameState.score}`, 320, 20);
  
  // Wave timer
  if (!gameState.waveInProgress && gameState.currentWave < gameState.totalWaves) {
    const seconds = Math.ceil(gameState.waveTimer / 60);
    p.fill(255, 200, 100);
    p.text(`Next wave in: ${seconds}s`, 450, 20);
  }
  
  p.pop();
  
  // Bottom bar - tower selection
  drawTowerSelection(p);
  
  // Selected tower info
  if (gameState.selectedTower) {
    drawTowerInfo(p);
  }
  
  // Hero ability cooldown
  if (gameState.hero) {
    drawHeroAbility(p);
  }
}

export function drawTowerSelection(p) {
  p.push();
  p.fill(30, 30, 40);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - 60, CANVAS_WIDTH, 60);
  
  const startX = 20;
  const spacing = 80;
  
  for (let i = 1; i <= 4; i++) {
    const config = TOWER_TYPES[i];
    const x = startX + (i - 1) * spacing;
    const y = CANVAS_HEIGHT - 30;
    
    // Background
    const isSelected = gameState.selectedTowerType === i;
    const canAfford = gameState.gold >= config.cost;
    
    p.fill(isSelected ? 80 : 50, isSelected ? 80 : 50, isSelected ? 100 : 60);
    p.stroke(isSelected ? 150 : 100, isSelected ? 150 : 100, isSelected ? 200 : 150);
    p.strokeWeight(2);
    p.rect(x - 25, y - 20, 50, 40, 5);
    
    // Tower icon
    p.fill(...config.color);
    p.noStroke();
    if (i === 1) { // Archer
      p.triangle(x, y - 8, x - 8, y + 8, x + 8, y + 8);
    } else if (i === 2) { // Mage
      p.circle(x, y, 12);
    } else if (i === 3) { // Barracks
      p.rect(x - 8, y - 8, 16, 16);
    } else if (i === 4) { // Druid
      p.circle(x, y, 14);
    }
    
    // Cost
    p.fill(canAfford ? 255 : 150, canAfford ? 215 : 100, 0);
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`$${config.cost}`, x, y + 18);
    
    // Key hint
    p.fill(200);
    p.textSize(8);
    p.text(i, x, y - 18);
  }
  
  // Instructions
  p.fill(200);
  p.textSize(10);
  p.textAlign(p.LEFT, p.CENTER);
  p.text('1-4: Select | Space: Place | Shift: Upgrade | Z: Hero Ability', 340, CANVAS_HEIGHT - 30);
  
  p.pop();
}

export function drawTowerInfo(p) {
  const tower = gameState.selectedTower;
  
  p.push();
  p.fill(40, 40, 50, 230);
  p.stroke(150);
  p.strokeWeight(2);
  p.rect(CANVAS_WIDTH - 160, 50, 150, 120, 5);
  
  p.fill(255);
  p.noStroke();
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`${tower.config.name} Tower`, CANVAS_WIDTH - 150, 60);
  p.text(`Tier: ${tower.tier}`, CANVAS_WIDTH - 150, 80);
  p.text(`Damage: ${tower.damage}`, CANVAS_WIDTH - 150, 95);
  p.text(`Range: ${tower.range}`, CANVAS_WIDTH - 150, 110);
  p.text(`Kills: ${tower.kills}`, CANVAS_WIDTH - 150, 125);
  
  if (tower.tier < 3) {
    const upgradeCost = [0, 80, 120, 180][tower.tier + 1];
    const canUpgrade = gameState.gold >= upgradeCost;
    p.fill(canUpgrade ? 100 : 150, canUpgrade ? 255 : 100, 100);
    p.text(`Upgrade: $${upgradeCost}`, CANVAS_WIDTH - 150, 145);
  } else {
    p.fill(255, 215, 0);
    p.text('MAX TIER', CANVAS_WIDTH - 150, 145);
  }
  
  p.pop();
}

export function drawHeroAbility(p) {
  const hero = gameState.hero;
  
  p.push();
  p.fill(40, 40, 50, 200);
  p.stroke(100, 150, 255);
  p.strokeWeight(2);
  p.rect(10, 50, 120, 40, 5);
  
  p.fill(255);
  p.noStroke();
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  p.text('Hero Ability (Z)', 20, 58);
  
  if (hero.abilityReady) {
    p.fill(100, 255, 100);
    p.text('READY', 20, 75);
  } else {
    const seconds = Math.ceil(hero.abilityCooldown / 60);
    p.fill(255, 100, 100);
    p.text(`Cooldown: ${seconds}s`, 20, 75);
  }
  
  p.pop();
}

export function drawStartScreen(p) {
  p.background(20, 30, 40);
  
  // Title
  p.push();
  p.fill(255, 215, 0);
  p.textSize(36);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('KINGDOM DEFENSE', CANVAS_WIDTH / 2, 60);
  
  // Subtitle
  p.fill(150, 200, 255);
  p.textSize(16);
  p.text('Tower Defense Strategy', CANVAS_WIDTH / 2, 95);
  
  // Instructions
  p.fill(200);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    'OBJECTIVE:',
    '• Defend against 10 waves of enemies',
    '• Don\'t let them reach the exit!',
    '• Survive with lives remaining to win',
    '',
    'HOW TO PLAY:',
    '• Use gold to build and upgrade towers',
    '• 4 tower types with unique abilities',
    '• Control your hero with arrow keys',
    '• Use hero ability (Z) for area damage',
    '',
    'TOWER TYPES:',
    '• Archer (1): Long range, fast attacks',
    '• Mage (2): Area damage, slows enemies',
    '• Barracks (3): Blocks ground units',
    '• Druid (4): Poison damage over time'
  ];
  
  let yPos = 130;
  for (let line of instructions) {
    p.text(line, 80, yPos);
    yPos += 16;
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textSize(18);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}

export function drawPausedScreen(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.RIGHT, p.TOP);
  p.text('PAUSED', CANVAS_WIDTH - 10, 10);
  
  p.pop();
}

export function drawGameOverScreen(p, won) {
  p.push();
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  p.fill(won ? 100 : 255, won ? 255 : 100, 100);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(won ? 'VICTORY!' : 'DEFEAT', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  
  // Stats
  p.fill(255);
  p.textSize(18);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  p.text(`Gold: ${gameState.gold}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text(`Waves Completed: ${gameState.currentWave}/${gameState.totalWaves}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  
  if (won) {
    p.fill(255, 215, 0);
    const starsEarned = gameState.lives >= 15 ? 3 : gameState.lives >= 10 ? 2 : 1;
    p.text(`⭐ Stars Earned: ${starsEarned} ⭐`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  }
  
  // Restart prompt
  p.fill(200);
  p.textSize(16);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}