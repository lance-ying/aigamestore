import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, WEAPON_DATA } from './globals.js';

export function drawUI(p) {
  p.push();
  
  if (gameState.gamePhase === "START") {
    drawStartScreen(p);
  } else if (gameState.gamePhase === "PLAYING") {
    drawGameUI(p);
  } else if (gameState.gamePhase === "PAUSED") {
    drawGameUI(p);
    drawPauseOverlay(p);
  } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
    drawGameOverScreen(p);
  }
  
  p.pop();
}

function drawStartScreen(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("WEAPON RUNNER", CANVAS_WIDTH / 2, 80);
  
  p.textSize(14);
  p.fill(200);
  const instructions = [
    "Navigate platforming stages and defeat the boss!",
    "",
    "CONTROLS:",
    "Arrow Keys - Move and aim",
    "Space - Jump (hold for higher)",
    "Z - Shoot current weapon",
    "Shift - Cycle weapons",
    "Up Arrow - Use booster (when obtained)",
    "",
    "GAMEPLAY:",
    "• Collect yellow triangles to level up weapons (1→3)",
    "• Taking damage spills EXP and de-levels weapons",
    "• Find Life Capsules to increase max HP",
    "• Use Save Stations to heal and refill ammo",
    "• Master movement: jumps, recoil, water physics",
    "• Defeat the multi-phase boss to win!",
    "",
    "PRESS ENTER TO START"
  ];
  
  let yPos = 140;
  for (let line of instructions) {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 18;
  }
}

function drawGameUI(p) {
  const player = gameState.player;
  if (!player) return;
  
  // Health bar
  p.fill(50, 50, 50);
  p.noStroke();
  p.rect(10, 10, 150, 20);
  p.fill(255, 100, 100);
  p.rect(10, 10, 150 * (player.hp / player.maxHP), 20);
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`HP: ${player.hp}/${player.maxHP}`, 15, 13);
  
  // Weapon info
  const weapon = player.weapons[player.currentWeapon];
  const weaponData = WEAPON_DATA[weapon.type];
  
  p.fill(50, 50, 50);
  p.rect(10, 35, 150, 50);
  
  p.fill(...weaponData.color);
  p.text(weaponData.name, 15, 40);
  
  p.fill(255);
  p.text(`Level: ${weapon.level}`, 15, 55);
  
  if (weapon.maxAmmo > 0) {
    p.text(`Ammo: ${weapon.ammo}/${weapon.maxAmmo}`, 15, 70);
  } else {
    p.text("Ammo: ∞", 15, 70);
  }
  
  // EXP bar
  const expThresholds = [0, 10, 30];
  const currentExp = weapon.exp;
  const nextLevel = weapon.level < 3 ? expThresholds[weapon.level] : 30;
  const prevLevel = expThresholds[weapon.level - 1];
  const progress = (currentExp - prevLevel) / (nextLevel - prevLevel);
  
  p.fill(50, 50, 50);
  p.rect(10, 90, 150, 10);
  p.fill(255, 255, 100);
  p.rect(10, 90, 150 * Math.min(1, progress), 10);
  
  // Booster fuel
  if (player.hasBooster) {
    p.fill(50, 50, 50);
    p.rect(10, 105, 150, 10);
    p.fill(100, 255, 100);
    p.rect(10, 105, 150 * (player.boosterFuel / player.maxBoosterFuel), 10);
  }
  
  // Score
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Boss health
  if (gameState.boss && !gameState.boss.defeated) {
    p.fill(50, 50, 50);
    p.rect(CANVAS_WIDTH / 2 - 100, 10, 200, 15);
    p.fill(255, 50, 100);
    p.rect(CANVAS_WIDTH / 2 - 100, 10, 200 * (gameState.boss.hp / gameState.boss.maxHP), 15);
    p.fill(255);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(12);
    p.text("BOSS", CANVAS_WIDTH / 2, 12);
  }
}

function drawPauseOverlay(p) {
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 35);
}

function drawGameOverScreen(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  
  if (gameState.gamePhase === "GAME_OVER_WIN") {
    p.fill(100, 255, 100);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 150);
    p.fill(255);
    p.textSize(20);
    p.text("You defeated the boss!", CANVAS_WIDTH / 2, 200);
  } else {
    p.fill(255, 100, 100);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 150);
    p.fill(255);
    p.textSize(20);
    p.text("You were defeated...", CANVAS_WIDTH / 2, 200);
  }
  
  p.textSize(18);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 250);
  
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}