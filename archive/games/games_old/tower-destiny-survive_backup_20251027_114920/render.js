// render.js - Rendering functions
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderGame(p) {
  // Background
  p.background(30, 30, 50);
  
  // Ground
  p.fill(40, 60, 40);
  p.noStroke();
  p.rect(0, 320, CANVAS_WIDTH, 80);
  
  // Ground details
  p.fill(50, 70, 50);
  for (let i = 0; i < 10; i++) {
    p.rect(i * 60, 320, 50, 10);
  }
  
  switch (gameState.gamePhase) {
    case GAME_PHASES.START:
      renderStartScreen(p);
      break;
    case GAME_PHASES.PLAYING:
      renderGameplay(p);
      renderUI(p);
      break;
    case GAME_PHASES.PAUSED:
      renderGameplay(p);
      renderUI(p);
      renderPauseOverlay(p);
      break;
    case GAME_PHASES.LEVEL_COMPLETE:
      renderGameplay(p);
      renderLevelComplete(p);
      break;
    case GAME_PHASES.GAME_OVER_WIN:
      renderGameplay(p);
      renderGameOverWin(p);
      break;
    case GAME_PHASES.GAME_OVER_LOSE:
      renderGameplay(p);
      renderGameOverLose(p);
      break;
  }
}

function renderStartScreen(p) {
  p.push();
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("TOWER DESTINY SURVIVE", CANVAS_WIDTH / 2, 80);
  
  p.textSize(16);
  p.fill(200);
  p.text("Defend your tower against zombie waves!", CANVAS_WIDTH / 2, 130);
  
  // Instructions
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.fill(220);
  
  const instructions = [
    "HOW TO PLAY:",
    "• Move your tower left/right with Arrow Keys",
    "• Press SPACE to shoot zombies",
    "• Collect blue blocks for upgrades",
    "• Survive 3 levels of increasing difficulty",
    "",
    "ZOMBIE TYPES:",
    "• Green: Basic zombies",
    "• Yellow: Fast but weak",
    "• Red: Slow but tanky",
    "",
    "ESC to Pause  |  R to Restart"
  ];
  
  let y = 170;
  instructions.forEach(line => {
    p.text(line, 50, y);
    y += 20;
  });
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  }
  
  p.pop();
}

function renderGameplay(p) {
  // Render all entities
  gameState.bullets.forEach(b => b.render(p));
  gameState.zombies.forEach(z => z.render(p));
  gameState.blocks.forEach(b => b.render(p));
  gameState.particles.forEach(part => part.render(p));
  
  if (gameState.player) {
    gameState.player.render(p);
  }
}

function renderUI(p) {
  p.push();
  
  // Score
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${gameState.score}`, 10, 10);
  
  // Level
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`LEVEL: ${gameState.currentLevel}`, CANVAS_WIDTH - 10, 10);
  
  // Wave
  const levelConfig = gameState.levels[gameState.currentLevel - 1];
  p.textAlign(p.CENTER, p.TOP);
  p.text(`WAVE: ${gameState.currentWave} / ${levelConfig.waves}`, CANVAS_WIDTH / 2, 10);
  
  // Blocks
  p.textAlign(p.LEFT, p.TOP);
  p.fill(80, 180, 255);
  p.text(`BLOCKS: ${gameState.blocksCollected}`, 10, 30);
  
  // Tower health bar
  const barWidth = 200;
  const barHeight = 20;
  const barX = CANVAS_WIDTH / 2 - barWidth / 2;
  const barY = 35;
  
  p.fill(60, 60, 60);
  p.rect(barX, barY, barWidth, barHeight);
  
  const healthPercent = gameState.towerHealth / gameState.towerMaxHealth;
  const healthColor = healthPercent > 0.5 ? [100, 255, 100] : 
                      healthPercent > 0.25 ? [255, 200, 50] : [255, 100, 100];
  p.fill(...healthColor);
  p.rect(barX, barY, barWidth * healthPercent, barHeight);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(`HP: ${Math.ceil(gameState.towerHealth)} / ${gameState.towerMaxHealth}`, 
         CANVAS_WIDTH / 2, barY + barHeight / 2);
  
  p.pop();
}

function renderPauseOverlay(p) {
  p.push();
  
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.textSize(18);
  p.text("Press ESC to Resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text("Press R to Restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  
  // Small indicator in top right
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  
  p.pop();
}

function renderLevelComplete(p) {
  p.push();
  
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 60);
  
  p.fill(255);
  p.textSize(20);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 100);
  p.text(`Blocks: ${gameState.blocksCollected}`, CANVAS_WIDTH / 2, 130);
  
  // Upgrades
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.fill(255, 220, 100);
  p.text("UPGRADES:", 50, 160);
  
  const upgrades = getAvailableUpgrades();
  let y = 190;
  
  upgrades.forEach((upgrade, i) => {
    const canAfford = gameState.blocksCollected >= upgrade.cost;
    p.fill(canAfford ? [200, 255, 200] : [150, 150, 150]);
    p.text(`${i + 1}. ${upgrade.name} - ${upgrade.cost} blocks`, 60, y);
    y += 25;
  });
  
  p.fill(100, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.text("Press 1-5 to buy upgrades", CANVAS_WIDTH / 2, 320);
    p.text("Press ENTER to continue", CANVAS_WIDTH / 2, 350);
  }
  
  p.pop();
}

function renderGameOverWin(p) {
  p.push();
  
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("VICTORY!", CANVAS_WIDTH / 2, 120);
  
  p.fill(255);
  p.textSize(24);
  p.text("You have survived all waves!", CANVAS_WIDTH / 2, 180);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  if (gameState.score > gameState.highScore) {
    p.fill(255, 215, 0);
    p.textSize(20);
    p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 260);
  }
  
  p.fill(200);
  p.textSize(18);
  p.text("Press R to Restart", CANVAS_WIDTH / 2, 320);
  
  p.pop();
}

function renderGameOverLose(p) {
  p.push();
  
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
  
  p.fill(255);
  p.textSize(24);
  p.text("Your tower has fallen...", CANVAS_WIDTH / 2, 180);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.text(`Reached Level: ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 250);
  
  p.fill(200);
  p.textSize(18);
  p.text("Press R to Restart", CANVAS_WIDTH / 2, 320);
  
  p.pop();
}

function getAvailableUpgrades() {
  const upgrades = [
    { id: "health", name: "Upgrade Health (+50 HP)", cost: gameState.upgradeCosts.health },
    { id: "weaponDamage", name: "Upgrade Weapon Damage (+10)", cost: gameState.upgradeCosts.weaponDamage },
    { id: "weaponFireRate", name: "Upgrade Fire Rate", cost: gameState.upgradeCosts.weaponFireRate }
  ];
  
  if (gameState.activeWeaponSlots === 1) {
    upgrades.push({ id: "secondSlot", name: "Unlock 2nd Weapon Slot", cost: gameState.upgradeCosts.secondSlot });
  }
  
  if (!gameState.weapons[1].unlocked) {
    upgrades.push({ id: "unlockMachinegun", name: "Unlock Machine Gun", cost: gameState.upgradeCosts.unlockMachinegun });
  }
  
  return upgrades;
}