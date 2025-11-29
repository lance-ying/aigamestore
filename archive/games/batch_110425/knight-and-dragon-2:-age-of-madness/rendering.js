// rendering.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 10, 40);
  
  // Animated background
  for (let i = 0; i < 30; i++) {
    const x = (i * 50 + p.frameCount * 0.5) % (CANVAS_WIDTH + 50);
    const y = (i * 30) % CANVAS_HEIGHT;
    p.fill(50, 30, 70, 100);
    p.noStroke();
    p.ellipse(x, y, 20, 20);
  }
  
  // Title
  p.fill(255, 200, 50);
  p.textSize(32);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("KNIGHT AND DRAGON 2", CANVAS_WIDTH / 2, 60);
  p.textSize(18);
  p.fill(200, 150, 50);
  p.text("Age of Madness", CANVAS_WIDTH / 2, 90);
  
  // Description
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  const desc = [
    "Lead your party of 4 heroes through 8 epic missions!",
    "Heroes auto-attack enemies in range.",
    "Collect loot to auto-equip and boost stats.",
    "Defeat enemies to gain XP and level up.",
    "",
    "Complete all missions to win!"
  ];
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], CANVAS_WIDTH / 2, 130 + i * 20);
  }
  
  // Controls
  p.fill(150, 200, 255);
  p.textSize(13);
  p.textAlign(p.LEFT, p.TOP);
  const controls = [
    "Arrow Keys: Move party",
    "Space: Dash (cooldown)",
    "Z: Special ability (when charged)",
    "1-4: Hero skills (cooldowns)",
    "ESC: Pause",
    "R: Restart"
  ];
  for (let i = 0; i < controls.length; i++) {
    p.text(controls[i], 60, 260 + i * 18);
  }
  
  // Press ENTER
  p.fill(255, 255, 100);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 100, flash * 255);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function drawGame(p) {
  // Background
  p.background(40, 50, 30);
  
  // Grid
  p.push();
  p.translate(-gameState.camera.x + CANVAS_WIDTH / 2, -gameState.camera.y + CANVAS_HEIGHT / 2);
  p.stroke(60, 70, 50);
  p.strokeWeight(1);
  const gridSize = 50;
  for (let x = gameState.worldBounds.minX; x <= gameState.worldBounds.maxX; x += gridSize) {
    p.line(x, gameState.worldBounds.minY, x, gameState.worldBounds.maxY);
  }
  for (let y = gameState.worldBounds.minY; y <= gameState.worldBounds.maxY; y += gridSize) {
    p.line(gameState.worldBounds.minX, y, gameState.worldBounds.maxX, y);
  }
  p.pop();
  
  // Render particles (back layer)
  for (const particle of gameState.particles) {
    if (!particle.text) particle.draw(p);
  }
  
  // Render loot
  for (const loot of gameState.loot) {
    loot.draw(p);
  }
  
  // Render projectiles
  for (const proj of gameState.projectiles) {
    proj.draw(p);
  }
  
  // Render enemies
  for (const enemy of gameState.enemies) {
    enemy.draw();
  }
  
  // Render party
  for (const hero of gameState.party) {
    hero.draw();
  }
  
  // Render particles (text/front layer)
  for (const particle of gameState.particles) {
    if (particle.text !== undefined) particle.draw(p);
  }
  
  // UI
  drawUI(p);
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textSize(12);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

function drawUI(p) {
  // Mission and Score
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(5, 5, 200, 80, 5);
  
  p.fill(255, 200, 50);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Mission ${gameState.mission}/${gameState.totalMissions}`, 15, 15);
  
  p.fill(255);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, 15, 38);
  
  const enemiesLeft = gameState.enemiesPerMission + (gameState.mission - 1) * 2 - gameState.enemiesThisMission;
  p.text(`Enemies: ${enemiesLeft}`, 15, 58);
  
  // Party status
  p.fill(0, 0, 0, 150);
  p.rect(CANVAS_WIDTH - 205, 5, 200, 100, 5);
  
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  for (let i = 0; i < gameState.party.length; i++) {
    const hero = gameState.party[i];
    const y = 15 + i * 22;
    
    // Hero name
    p.fill(...hero.classData.color);
    p.text(`${hero.classData.name} L${hero.level}`, CANVAS_WIDTH - 195, y);
    
    // HP bar
    const barX = CANVAS_WIDTH - 110;
    p.fill(100, 50, 50);
    p.rect(barX, y + 1, 100, 12, 2);
    p.fill(100, 255, 100);
    const hpPercent = hero.hp / hero.maxHp;
    p.rect(barX, y + 1, 100 * hpPercent, 12, 2);
    
    // HP text
    p.fill(255);
    p.textSize(9);
    p.textAlign(p.CENTER, p.TOP);
    p.text(`${Math.ceil(hero.hp)}/${hero.maxHp}`, barX + 50, y + 2);
  }
  
  // Skill cooldowns
  const skillY = CANVAS_HEIGHT - 45;
  p.fill(0, 0, 0, 150);
  p.rect(5, skillY, 240, 38, 5);
  
  p.textSize(10);
  p.textAlign(p.CENTER, p.TOP);
  for (let i = 0; i < 4; i++) {
    const hero = gameState.party[i];
    const x = 20 + i * 60;
    
    // Skill box
    const ready = hero.skillCooldown === 0;
    p.fill(...(ready ? [100, 255, 100] : [100, 100, 100]));
    p.rect(x, skillY + 8, 45, 25, 3);
    
    p.fill(0);
    p.text(`${i + 1}`, x + 22, skillY + 13);
    
    if (!ready) {
      const cooldownPercent = hero.skillCooldown / hero.maxSkillCooldown;
      p.fill(50, 50, 50, 200);
      p.rect(x, skillY + 8, 45, 25 * cooldownPercent, 3);
    }
  }
  
  // Dash cooldown
  p.fill(0, 0, 0, 150);
  p.rect(CANVAS_WIDTH - 170, CANVAS_HEIGHT - 45, 80, 38, 5);
  p.fill(...(gameState.dashCooldown === 0 ? [150, 200, 255] : [100, 100, 100]));
  p.rect(CANVAS_WIDTH - 160, CANVAS_HEIGHT - 32, 60, 20, 3);
  p.fill(0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text("DASH", CANVAS_WIDTH - 130, CANVAS_HEIGHT - 22);
  
  // Special charge
  p.fill(0, 0, 0, 150);
  p.rect(CANVAS_WIDTH - 85, CANVAS_HEIGHT - 45, 80, 38, 5);
  const chargePercent = gameState.specialCharge / gameState.maxSpecialCharge;
  p.fill(255, 255, 100);
  p.rect(CANVAS_WIDTH - 75, CANVAS_HEIGHT - 35, 60, 8, 2);
  p.fill(255, 200, 50);
  p.rect(CANVAS_WIDTH - 75, CANVAS_HEIGHT - 35, 60 * chargePercent, 8, 2);
  p.fill(255);
  p.textSize(9);
  p.text("SPECIAL (Z)", CANVAS_WIDTH - 45, CANVAS_HEIGHT - 18);
}

export function drawGameOver(p) {
  p.background(20, 10, 30);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(isWin ? "VICTORY!" : "DEFEATED", CANVAS_WIDTH / 2, 100);
  
  // Stats
  p.fill(255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.text(`Missions Completed: ${isWin ? gameState.totalMissions : gameState.mission - 1}`, CANVAS_WIDTH / 2, 210);
  p.text(`Enemies Defeated: ${gameState.enemiesDefeated}`, CANVAS_WIDTH / 2, 240);
  
  // Party final levels
  p.textSize(16);
  p.fill(200, 200, 255);
  p.text("Final Party Levels:", CANVAS_WIDTH / 2, 280);
  for (let i = 0; i < gameState.party.length; i++) {
    const hero = gameState.party[i];
    p.fill(...hero.classData.color);
    p.text(`${hero.classData.name}: Level ${hero.level}`, CANVAS_WIDTH / 2, 305 + i * 20);
  }
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(18);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 100, flash * 255);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 380);
}