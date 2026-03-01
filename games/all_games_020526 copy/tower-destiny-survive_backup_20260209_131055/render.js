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
      renderTrajectoryIndicator(p);
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
  
  // Replaced game title with "press enter to begin"
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("press enter to begin", CANVAS_WIDTH / 2, 60);
  
  // Removed subtitle/tagline as per instructions
  // p.textSize(16);
  // p.fill(200);
  // p.text("Defend your tower from all sides!", CANVAS_WIDTH / 2, 100);
  
  // Instructions (preserved)
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(13);
  p.fill(220);
  
  const instructions = [
    "HOW TO PLAY:",
    "• Move: Arrow Keys or A/D",
    "• Shoot: SPACE (costs energy!)",
    "• Switch Direction: Q (left) / E (right)",
    "• Aim: UP/DOWN Arrow Keys",
    "• Energy regenerates over time",
    "• Kill zombies quickly for combo bonuses!",
    "• Collect power-ups from defeated zombies:",
    "  - Green: +Health",
    "  - Blue: +Energy",
    "  - Orange: Damage boost",
    "",
    "Zombies attack from BOTH SIDES!",
    "Adjust your aim and fire trajectory!"
  ];
  
  // Adjusted starting Y for instructions due to subtitle removal
  let y = 110; 
  instructions.forEach(line => {
    p.text(line, 40, y);
    y += 18;
  });
  
  // Removed blinking "PRESS ENTER TO START" as it's redundant with the new main title
  // p.fill(100, 255, 100);
  // p.textAlign(p.CENTER, p.CENTER);
  // p.textSize(20);
  // if (Math.floor(p.frameCount / 30) % 2 === 0) {
  //   p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  // }
  
  p.pop();
}

function renderGameplay(p) {
  // Render all entities
  gameState.bullets.forEach(b => b.render(p));
  gameState.zombies.forEach(z => z.render(p));
  gameState.blocks.forEach(b => b.render(p));
  gameState.powerups.forEach(pu => pu.render(p));
  gameState.particles.forEach(part => part.render(p));
  
  if (gameState.player) {
    gameState.player.render(p);
  }
}

function renderTrajectoryIndicator(p) {
  if (!gameState.player) return;
  
  p.push();
  
  // Draw trajectory line from tower
  const direction = gameState.facingRight ? 1 : -1;
  const angleRad = (gameState.firingAngle * Math.PI) / 180;
  const lineLength = 80;
  
  const startX = gameState.player.x;
  const startY = gameState.player.y - gameState.player.height - 10;
  const endX = startX + Math.cos(angleRad) * lineLength * direction;
  const endY = startY + Math.sin(angleRad) * lineLength;
  
  // Draw dashed line
  p.stroke(255, 255, 100, 150);
  p.strokeWeight(2);
  p.drawingContext.setLineDash([5, 5]);
  p.line(startX, startY, endX, endY);
  p.drawingContext.setLineDash([]);
  
  // Draw angle indicator circle at the end
  p.fill(255, 255, 100, 100);
  p.noStroke();
  p.circle(endX, endY, 8);
  
  p.pop();
}

function renderUI(p) {
  p.push();
  
  // Score
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`SCORE: ${gameState.score}`, 10, 10);
  
  // Level & Wave
  const levelConfig = gameState.levels[gameState.currentLevel - 1];
  p.text(`LVL ${gameState.currentLevel} | WAVE ${gameState.currentWave}/${levelConfig.waves}`, 10, 28);
  
  // Blocks
  p.fill(80, 180, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`BLOCKS: ${gameState.blocksCollected}`, CANVAS_WIDTH - 10, 10);
  
  // Combo counter
  if (gameState.comboCount > 0) {
    p.fill(255, 215, 0);
    p.textSize(16);
    p.text(`COMBO x${gameState.comboMultiplier.toFixed(1)} (${gameState.comboCount})`, CANVAS_WIDTH - 10, 28);
  }
  
  // Firing angle indicator
  p.fill(255, 255, 100);
  p.textSize(12);
  p.text(`ANGLE: ${gameState.firingAngle}°`, CANVAS_WIDTH - 10, 48);
  
  // Tower health bar
  const barWidth = 150;
  const barHeight = 16;
  const barX = CANVAS_WIDTH / 2 - barWidth / 2;
  const barY = 10;
  
  p.fill(60, 60, 60);
  p.rect(barX, barY, barWidth, barHeight);
  
  const healthPercent = gameState.towerHealth / gameState.towerMaxHealth;
  const healthColor = healthPercent > 0.5 ? [100, 255, 100] : 
                      healthPercent > 0.25 ? [255, 200, 50] : [255, 100, 100];
  p.fill(...healthColor);
  p.rect(barX, barY, barWidth * healthPercent, barHeight);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text(`HP: ${Math.ceil(gameState.towerHealth)}/${gameState.towerMaxHealth}`, 
         CANVAS_WIDTH / 2, barY + barHeight / 2);
  
  // Energy bar
  const energyBarY = barY + barHeight + 4;
  p.fill(40, 40, 60);
  p.rect(barX, energyBarY, barWidth, 12);
  
  const energyPercent = gameState.energy / gameState.maxEnergy;
  p.fill(100, 200, 255);
  p.rect(barX, energyBarY, barWidth * energyPercent, 12);
  
  p.fill(255);
  p.textSize(9);
  p.text(`ENERGY: ${Math.floor(gameState.energy)}`, CANVAS_WIDTH / 2, energyBarY + 6);
  
  // Power-up indicator
  if (gameState.powerupEffects.damageBoostTimer > 0) {
    p.fill(255, 150, 50);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.text(`⚡ DAMAGE BOOST (${Math.ceil(gameState.powerupEffects.damageBoostTimer / 60)}s)`, 
           10, CANVAS_HEIGHT - 30);
  }
  
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