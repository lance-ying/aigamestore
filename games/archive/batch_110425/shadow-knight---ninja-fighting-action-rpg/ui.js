// ui.js - UI rendering functions
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE, PHASE_MISSION_COMPLETE, PHASE_UPGRADE_SCREEN, MISSIONS, TARGET_FPS } from './globals.js';

export function renderUI(p) {
  switch (gameState.gamePhase) {
    case PHASE_START:
      renderStartScreen(p);
      break;
    case PHASE_PLAYING:
      renderGameplayUI(p);
      break;
    case PHASE_PAUSED:
      renderGameplayUI(p);
      renderPausedOverlay(p);
      break;
    case PHASE_MISSION_COMPLETE:
      renderMissionCompleteScreen(p);
      break;
    case PHASE_UPGRADE_SCREEN:
      renderUpgradeScreen(p);
      break;
    case PHASE_GAME_OVER_WIN:
      renderGameOverScreen(p, true);
      break;
    case PHASE_GAME_OVER_LOSE:
      renderGameOverScreen(p, false);
      break;
  }
}

function renderStartScreen(p) {
  p.push();
  
  // Background
  p.fill(20, 20, 40);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title with shadow effect
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(0, 0, 0, 100);
  p.textSize(48);
  p.text("SHADOW KNIGHT", CANVAS_WIDTH / 2 + 3, 70 + 3);
  
  p.fill(150, 100, 200);
  p.text("SHADOW KNIGHT", CANVAS_WIDTH / 2, 70);
  
  // Subtitle
  p.textSize(18);
  p.fill(200, 200, 220);
  p.text("Ninja Fighting Action RPG", CANVAS_WIDTH / 2, 110);
  
  // Instructions
  p.textSize(14);
  p.fill(180, 180, 200);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    "OBJECTIVE:",
    "Complete all missions and defeat the Dark Lord!",
    "",
    "CONTROLS:",
    "Arrow Keys - Move Left/Right",
    "Up Arrow - Jump",
    "Space - Basic Attack",
    "Z - Shadow Strike (Dash Attack)",
    "Shift - Ninja Fury (Area Damage)",
    "",
    "GAMEPLAY:",
    "• Defeat enemies to earn gold",
    "• Upgrade your stats between missions",
    "• Use skills strategically (cooldowns apply)",
    "• Avoid taking damage - heal between missions"
  ];
  
  let yPos = 150;
  for (const line of instructions) {
    if (line.includes("OBJECTIVE:") || line.includes("CONTROLS:") || line.includes("GAMEPLAY:")) {
      p.fill(255, 200, 150);
      p.textSize(15);
    } else if (line.startsWith("•")) {
      p.fill(160, 160, 180);
      p.textSize(13);
    } else {
      p.fill(180, 180, 200);
      p.textSize(14);
    }
    p.text(line, 50, yPos);
    yPos += line === "" ? 10 : 20;
  }
  
  // Start prompt with pulsing effect
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const pulseAlpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(255, 255, 100, pulseAlpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}

function renderGameplayUI(p) {
  p.push();
  
  // Health bar
  const healthBarWidth = 200;
  const healthBarHeight = 20;
  const healthX = 10;
  const healthY = 10;
  
  p.fill(50, 50, 50);
  p.noStroke();
  p.rect(healthX, healthY, healthBarWidth, healthBarHeight, 5);
  
  const healthPercent = gameState.playerStats.health / gameState.playerStats.maxHealth;
  p.fill(healthPercent > 0.5 ? 100 : 200, healthPercent > 0.3 ? 200 : 50, 50);
  p.rect(healthX, healthY, healthBarWidth * healthPercent, healthBarHeight, 5);
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`HP: ${Math.ceil(gameState.playerStats.health)}/${gameState.playerStats.maxHealth}`, 
         healthX + healthBarWidth / 2, healthY + healthBarHeight / 2);
  
  // Gold counter
  p.textAlign(p.LEFT, p.TOP);
  p.fill(255, 220, 0);
  p.textSize(16);
  p.text(`Gold: ${gameState.goldCollected}`, 10, 40);
  
  // Mission info
  p.fill(200, 200, 220);
  p.textSize(14);
  const missionName = MISSIONS[gameState.currentMission]?.name || "Complete";
  p.text(`Mission ${gameState.currentMission + 1}: ${missionName}`, 10, 60);
  
  // Enemies remaining
  const enemiesAlive = gameState.enemies.filter(e => !e.dead).length;
  p.fill(255, 150, 150);
  p.text(`Enemies: ${enemiesAlive}`, 10, 80);
  
  // Skill cooldowns
  renderSkillCooldowns(p);
  
  p.pop();
}

function renderSkillCooldowns(p) {
  p.push();
  
  const skillX = CANVAS_WIDTH - 120;
  const skillY = CANVAS_HEIGHT - 60;
  
  // Shadow Strike
  const shadowCooldown = gameState.skills.shadowStrike.cooldown;
  const shadowMax = gameState.skills.shadowStrike.maxCooldown;
  const shadowReady = shadowCooldown <= 0;
  
  p.fill(shadowReady ? 100 : 50, shadowReady ? 100 : 50, shadowReady ? 200 : 100);
  p.stroke(shadowReady ? 150 : 80, shadowReady ? 150 : 80, shadowReady ? 255 : 150);
  p.strokeWeight(2);
  p.rect(skillX, skillY, 50, 50, 5);
  
  p.fill(255);
  p.noStroke();
  p.textSize(10);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("Z", skillX + 25, skillY + 15);
  p.textSize(8);
  p.text("Shadow", skillX + 25, skillY + 30);
  p.text("Strike", skillX + 25, skillY + 40);
  
  if (!shadowReady) {
    const cooldownSec = Math.ceil(shadowCooldown / TARGET_FPS);
    p.textSize(12);
    p.fill(255, 100, 100);
    p.text(cooldownSec, skillX + 25, skillY + 25);
  }
  
  // Ninja Fury
  const furyCooldown = gameState.skills.ninjaFury.cooldown;
  const furyMax = gameState.skills.ninjaFury.maxCooldown;
  const furyReady = furyCooldown <= 0;
  
  p.fill(furyReady ? 200 : 100, furyReady ? 100 : 50, furyReady ? 200 : 100);
  p.stroke(furyReady ? 255 : 150, furyReady ? 150 : 80, furyReady ? 255 : 150);
  p.strokeWeight(2);
  p.rect(skillX + 60, skillY, 50, 50, 5);
  
  p.fill(255);
  p.noStroke();
  p.textSize(10);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("Shift", skillX + 85, skillY + 15);
  p.textSize(8);
  p.text("Ninja", skillX + 85, skillY + 30);
  p.text("Fury", skillX + 85, skillY + 40);
  
  if (!furyReady) {
    const cooldownSec = Math.ceil(furyCooldown / TARGET_FPS);
    p.textSize(12);
    p.fill(255, 100, 100);
    p.text(cooldownSec, skillX + 85, skillY + 25);
  }
  
  p.pop();
}

function renderPausedOverlay(p) {
  p.push();
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

function renderMissionCompleteScreen(p) {
  p.push();
  
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(100, 255, 100);
  p.textSize(40);
  p.text("MISSION COMPLETE!", CANVAS_WIDTH / 2, 100);
  
  p.fill(255, 220, 0);
  p.textSize(24);
  p.text(`Gold Earned: ${gameState.goldCollected}`, CANVAS_WIDTH / 2, 160);
  
  p.fill(200, 200, 220);
  p.textSize(18);
  const nextMission = gameState.currentMission + 1;
  if (nextMission < MISSIONS.length) {
    p.text(`Next: ${MISSIONS[nextMission].name}`, CANVAS_WIDTH / 2, 200);
    p.textSize(16);
    p.text("Proceeding to upgrades...", CANVAS_WIDTH / 2, 240);
  }
  
  p.pop();
}

function renderUpgradeScreen(p) {
  p.push();
  
  p.fill(20, 20, 40);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(150, 200, 255);
  p.textSize(32);
  p.text("UPGRADE STATION", CANVAS_WIDTH / 2, 40);
  
  p.fill(255, 220, 0);
  p.textSize(20);
  p.text(`Gold: ${gameState.goldCollected}`, CANVAS_WIDTH / 2, 80);
  
  // Upgrade options
  const upgradeY = 130;
  const upgradeCost = 50;
  
  // Attack upgrade
  p.fill(200, 100, 100);
  p.rect(100, upgradeY, 180, 80, 10);
  
  p.fill(255);
  p.textSize(18);
  p.text("Attack Damage", 190, upgradeY + 20);
  p.textSize(14);
  p.text(`Level: ${gameState.playerStats.attackLevel}`, 190, upgradeY + 40);
  p.text(`Cost: ${upgradeCost} Gold`, 190, upgradeY + 60);
  
  // Health upgrade
  p.fill(100, 200, 100);
  p.rect(320, upgradeY, 180, 80, 10);
  
  p.fill(255);
  p.textSize(18);
  p.text("Max Health", 410, upgradeY + 20);
  p.textSize(14);
  p.text(`Level: ${gameState.playerStats.healthLevel}`, 410, upgradeY + 40);
  p.text(`Cost: ${upgradeCost} Gold`, 410, upgradeY + 60);
  
  // Instructions
  p.fill(200, 200, 220);
  p.textSize(16);
  p.text("Press LEFT/RIGHT arrow to select", CANVAS_WIDTH / 2, 250);
  p.text("Press SPACE to purchase upgrade", CANVAS_WIDTH / 2, 275);
  p.text("Press ENTER to continue to next mission", CANVAS_WIDTH / 2, 310);
  
  // Current stats
  p.fill(180, 180, 200);
  p.textSize(14);
  p.text(`Current Attack: ${gameState.playerStats.attackDamage.toFixed(1)}`, CANVAS_WIDTH / 2, 345);
  p.text(`Current Max HP: ${gameState.playerStats.maxHealth.toFixed(0)}`, CANVAS_WIDTH / 2, 365);
  
  p.pop();
}

function renderGameOverScreen(p, isWin) {
  p.push();
  
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (isWin) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 120);
    
    p.fill(200, 200, 220);
    p.textSize(24);
    p.text("You have defeated the Dark Lord!", CANVAS_WIDTH / 2, 170);
    p.text("The Shadow Knight prevails!", CANVAS_WIDTH / 2, 200);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("DEFEATED", CANVAS_WIDTH / 2, 120);
    
    p.fill(200, 200, 220);
    p.textSize(20);
    p.text("Your health reached zero", CANVAS_WIDTH / 2, 170);
    p.text("Train harder and try again!", CANVAS_WIDTH / 2, 200);
  }
  
  p.fill(255, 220, 0);
  p.textSize(28);
  p.text(`Total Gold: ${gameState.goldCollected}`, CANVAS_WIDTH / 2, 250);
  
  const pulseAlpha = 150 + Math.sin(p.frameCount * 0.1) * 100;
  p.fill(255, 255, 100, pulseAlpha);
  p.textSize(22);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
  
  p.pop();
}