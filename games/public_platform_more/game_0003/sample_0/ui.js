// ui.js - UI rendering functions

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  ROUND_WIN_REQUIREMENT,
  WEAPON_UPGRADE_COST,
  ARMOR_UPGRADE_COST,
  MAGIC_UPGRADE_COST
} from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title with glow effect
  p.textAlign(p.CENTER, p.CENTER);
  
  // Glow
  for (let i = 3; i > 0; i--) {
    p.fill(255, 200, 0, 30);
    p.textSize(48 + i * 2);
    p.text('SHADOW FIGHT', CANVAS_WIDTH / 2, 60);
  }
  
  p.fill(255, 220, 50);
  p.textSize(48);
  p.text('SHADOW FIGHT', CANVAS_WIDTH / 2, 60);
  
  p.fill(200, 180, 100);
  p.textSize(20);
  p.text('SPECIAL EDITION', CANVAS_WIDTH / 2, 95);
  
  // Instructions
  p.textSize(14);
  p.fill(200, 200, 200);
  p.textAlign(p.LEFT);
  
  const instructions = [
    'OBJECTIVE:',
    '• Defeat enemies across 7 provinces',
    '• Win 2 out of 3 rounds per fight',
    '• Earn coins to upgrade your warrior',
    '• Master combos to defeat tougher foes',
    '',
    'CONTROLS:',
    '← → : Move backward/forward',
    '↑ : Jump',
    '↓ : Crouch',
    'Z : Punch',
    'SPACE : Kick',
    'SHIFT : Special ability (when unlocked)',
    '',
    'COMBO MOVES:',
    '→ + Z : Forward Punch',
    '→ + SPACE : Forward Kick',
    '↑ + Z : Jump Punch',
    '↓ + SPACE : Crouch Kick'
  ];
  
  let yPos = 130;
  for (const line of instructions) {
    if (line.startsWith('•') || line.startsWith('←') || line.startsWith('→') || line.startsWith('↑') || line.startsWith('↓') || line.startsWith('Z') || line.startsWith('SPACE') || line.startsWith('SHIFT')) {
      p.fill(180, 180, 200);
      p.text(line, 120, yPos);
    } else {
      p.fill(220, 220, 255);
      p.text(line, 100, yPos);
    }
    yPos += 16;
  }
  
  // Start prompt with animation
  p.textAlign(p.CENTER);
  p.textSize(20);
  const alpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(255, 255, 100, alpha);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

export function drawGameUI(p) {
  // Top bar background
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Province info
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.fill(255, 220, 100);
  p.text(`Province ${gameState.currentProvince}/7`, 10, 10);
  
  // Round info
  p.textSize(14);
  p.fill(200, 200, 200);
  p.text(`Round ${gameState.currentRound}/3`, 10, 30);
  
  // Player rounds won
  p.fill(100, 200, 255);
  for (let i = 0; i < gameState.playerRoundsWon; i++) {
    p.ellipse(150 + i * 20, 20, 12, 12);
  }
  
  // Enemy rounds won
  p.fill(255, 100, 100);
  for (let i = 0; i < gameState.enemyRoundsWon; i++) {
    p.ellipse(450 + i * 20, 20, 12, 12);
  }
  
  // Coins and gems
  p.textAlign(p.RIGHT, p.TOP);
  p.fill(255, 215, 0);
  p.text(`Coins: ${gameState.coins}`, CANVAS_WIDTH - 10, 10);
  p.fill(100, 200, 255);
  p.text(`Gems: ${gameState.gems}`, CANVAS_WIDTH - 10, 30);
  
  // Combo counter
  if (gameState.comboCounter > 1) {
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(24);
    p.fill(255, 100, 50);
    p.text(`${gameState.comboCounter} HIT COMBO!`, CANVAS_WIDTH / 2, 60);
  }
  
  // Paused indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.fill(255, 255, 255);
    p.text('PAUSED', CANVAS_WIDTH - 10, 60);
  }
}

export function drawUpgradeMenu(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 220, 100);
  p.textSize(32);
  p.text('UPGRADE SHOP', CANVAS_WIDTH / 2, 80);
  
  p.textSize(16);
  p.fill(200, 200, 200);
  p.text(`Coins: ${gameState.coins}`, CANVAS_WIDTH / 2, 120);
  
  // Upgrade options
  const upgrades = [
    { name: 'Weapon', level: gameState.weapons, cost: WEAPON_UPGRADE_COST, desc: 'Increase attack damage' },
    { name: 'Armor', level: gameState.armor, cost: ARMOR_UPGRADE_COST, desc: 'Increase defense' },
    { name: 'Magic', level: gameState.magic, cost: MAGIC_UPGRADE_COST, desc: 'Unlock special abilities' }
  ];
  
  let yPos = 170;
  upgrades.forEach((upgrade, index) => {
    const canAfford = gameState.coins >= upgrade.cost;
    p.fill(...(canAfford ? [100, 200, 100] : [150, 150, 150]));
    p.textSize(18);
    p.text(`${upgrade.name} Lv.${upgrade.level}`, CANVAS_WIDTH / 2, yPos);
    
    p.textSize(12);
    p.fill(200, 200, 200);
    p.text(upgrade.desc, CANVAS_WIDTH / 2, yPos + 20);
    p.text(`Cost: ${upgrade.cost} coins`, CANVAS_WIDTH / 2, yPos + 35);
    
    yPos += 70;
  });
  
  p.textSize(14);
  p.fill(255, 255, 100);
  p.text('Press ENTER to continue', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

export function drawGameOverScreen(p, isWin) {
  p.background(isWin ? [20, 40, 20] : [40, 20, 20]);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (isWin) {
    // Victory
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text('VICTORY!', CANVAS_WIDTH / 2, 100);
    
    p.fill(200, 255, 200);
    p.textSize(24);
    p.text(`Province ${gameState.currentProvince} Conquered!`, CANVAS_WIDTH / 2, 150);
    
    if (gameState.currentProvince >= 7) {
      p.textSize(32);
      p.fill(255, 220, 100);
      p.text('TITAN DEFEATED!', CANVAS_WIDTH / 2, 200);
      p.textSize(20);
      p.text('You have completed the game!', CANVAS_WIDTH / 2, 240);
    }
  } else {
    // Defeat
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text('DEFEAT', CANVAS_WIDTH / 2, 120);
    
    p.fill(255, 200, 200);
    p.textSize(20);
    p.text('Your journey ends here...', CANVAS_WIDTH / 2, 170);
  }
  
  // Stats
  p.textSize(16);
  p.fill(255, 255, 255);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
  p.text(`Enemies Defeated: ${gameState.enemiesDefeated}`, CANVAS_WIDTH / 2, 255);
  p.text(`Coins Earned: ${gameState.coins}`, CANVAS_WIDTH / 2, 280);
  
  // Restart prompt
  p.textSize(18);
  const alpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(255, 255, 100, alpha);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function drawBackground(p, province) {
  // Sky gradient
  const skyColors = [
    [30, 30, 60],   // Province 1 - Night
    [60, 80, 120],  // Province 2 - Dusk
    [120, 150, 200], // Province 3 - Day
    [200, 150, 100], // Province 4 - Sunset
    [100, 50, 80],  // Province 5 - Twilight
    [20, 40, 40],   // Province 6 - Storm
    [10, 10, 10]    // Province 7 - Darkness
  ];
  
  const colors = skyColors[Math.min(province - 1, 6)];
  
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = i / CANVAS_HEIGHT;
    const c = p.lerpColor(
      p.color(...colors),
      p.color(colors[0] * 0.5, colors[1] * 0.5, colors[2] * 0.5),
      inter
    );
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  p.noStroke();
  
  // Ground
  p.fill(40, 30, 20);
  p.rect(0, 320, CANVAS_WIDTH, 80);
  
  // Ground details
  p.fill(60, 50, 40);
  for (let i = 0; i < 10; i++) {
    const x = i * 70 + (p.frameCount * 0.1) % 70;
    p.rect(x, 330, 50, 5);
  }
  
  // Mountains/buildings in background
  p.fill(colors[0] * 0.3, colors[1] * 0.3, colors[2] * 0.3);
  p.triangle(100, 320, 200, 200, 300, 320);
  p.triangle(300, 320, 400, 180, 500, 320);
}