// rendering.js - All rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, PLAYING_SUBSTATES, LEVEL_DEFINITIONS } from './globals.js';
import { getResourceIcon, getResourceColor } from './map.js';
import { getHighScores } from './progression.js';

export function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title with icy effect
  p.fill(200, 230, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("WHITEOUT SURVIVAL", CANVAS_WIDTH / 2, 80);
  
  p.textSize(16);
  p.fill(150, 180, 200);
  p.text("Conquer the frozen wasteland and become the strongest!", CANVAS_WIDTH / 2, 130);
  
  // Instructions
  p.textSize(14);
  p.fill(180, 200, 220);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    "OBJECTIVE:",
    "• Move your hero to resource nodes and press SPACE to gather",
    "• Go to City Center and press Z to upgrade buildings",
    "• Move to red combat zones and press SPACE to fight enemies",
    "• Complete objectives to advance through 5 levels",
    "• Defeat the Grand Rival Chief to win!",
    "",
    "CONTROLS:",
    "• Arrow Keys/WASD: Move your hero",
    "• SPACE: Gather resources/Start combat",
    "• Z: City Menu (at City Center)",
    "• ESC: Pause | R: Restart"
  ];
  
  let yPos = 170;
  for (const line of instructions) {
    p.text(line, 50, yPos);
    yPos += 18;
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const pulse = Math.sin(p.frameCount * 0.1) * 20 + 235;
  p.fill(pulse, pulse, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function renderExploreScreen(p) {
  // Background
  renderBackground(p);
  
  // Calculate screen positions based on camera
  const screenX = (x) => x - gameState.cameraX + CANVAS_WIDTH / 2;
  const screenY = (y) => y - gameState.cameraY + CANVAS_HEIGHT / 2;
  
  // Resource nodes
  for (const node of gameState.mapState.resourceNodes) {
    if (node.available) {
      renderResourceNode(p, node, screenX(node.x), screenY(node.y));
    }
  }
  
  // Combat zones
  for (const zone of gameState.mapState.combatZones) {
    if (!zone.defeated) {
      renderCombatZone(p, zone, screenX(zone.x), screenY(zone.y));
    }
  }
  
  // City center
  renderCityCenter(p, screenX(gameState.mapState.cityCenter.x), screenY(gameState.mapState.cityCenter.y));
  
  // Player character with interaction range
  renderPlayer(p);
  
  // Animations
  updateAndRenderAnimations(p);
  
  // UI
  renderResourceUI(p);
  renderScoreUI(p);
  renderLevelUI(p);
  renderObjectivesPanel(p);
  
  // Help text
  p.fill(200, 220, 240);
  p.textSize(12);
  p.textAlign(p.LEFT, p.BOTTOM);
  p.text("Move with WASD/Arrows | SPACE: Interact | Z: City Menu (at base)", 10, CANVAS_HEIGHT - 5);
}

export function renderPlayer(p) {
  const player = gameState.player;
  if (!player) return;
  
  const screenX = CANVAS_WIDTH / 2;
  const screenY = CANVAS_HEIGHT / 2;
  const interactRadius = 60;
  
  // Interaction range circle
  p.noFill();
  p.stroke(100, 255, 100, 100);
  p.strokeWeight(2);
  p.circle(screenX, screenY, interactRadius * 2);
  
  // Check for nearby objects and highlight them
  let nearbyObjectFound = false;
  
  // Check resource nodes
  for (const node of gameState.mapState.resourceNodes) {
    if (!node.available) continue;
    const dist = Math.sqrt((node.x - player.x) ** 2 + (node.y - player.y) ** 2);
    if (dist < interactRadius) {
      const nx = node.x - gameState.cameraX + CANVAS_WIDTH / 2;
      const ny = node.y - gameState.cameraY + CANVAS_HEIGHT / 2;
      p.noFill();
      p.stroke(255, 255, 100, 150);
      p.strokeWeight(3);
      p.circle(nx, ny, 40);
      nearbyObjectFound = true;
    }
  }
  
  // Check combat zones
  for (const zone of gameState.mapState.combatZones) {
    if (zone.defeated) continue;
    const dist = Math.sqrt((zone.x - player.x) ** 2 + (zone.y - player.y) ** 2);
    if (dist < interactRadius) {
      const zx = zone.x - gameState.cameraX + CANVAS_WIDTH / 2;
      const zy = zone.y - gameState.cameraY + CANVAS_HEIGHT / 2;
      p.noFill();
      p.stroke(255, 255, 100, 150);
      p.strokeWeight(3);
      p.circle(zx, zy, 70);
      nearbyObjectFound = true;
    }
  }
  
  // Check city center
  const cityDist = Math.sqrt((gameState.mapState.cityCenter.x - player.x) ** 2 + 
                              (gameState.mapState.cityCenter.y - player.y) ** 2);
  if (cityDist < interactRadius) {
    const cx = gameState.mapState.cityCenter.x - gameState.cameraX + CANVAS_WIDTH / 2;
    const cy = gameState.mapState.cityCenter.y - gameState.cameraY + CANVAS_HEIGHT / 2;
    p.noFill();
    p.stroke(255, 255, 100, 150);
    p.strokeWeight(3);
    p.rect(cx - 30, cy - 30, 60, 60);
    nearbyObjectFound = true;
  }
  
  // Player body
  p.fill(100, 150, 255);
  p.stroke(80, 120, 200);
  p.strokeWeight(3);
  p.circle(screenX, screenY, 30);
  
  // Player face
  p.fill(255);
  p.noStroke();
  p.circle(screenX - 5, screenY - 3, 5);
  p.circle(screenX + 5, screenY - 3, 5);
  p.fill(80, 120, 200);
  p.arc(screenX, screenY + 5, 12, 8, 0, Math.PI);
  
  // Prompt when near object
  if (nearbyObjectFound) {
    p.fill(255, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text("Press SPACE", screenX, screenY - 30);
  }
}

export function renderObjectivesPanel(p) {
  const levelDef = LEVEL_DEFINITIONS[gameState.currentLevel - 1];
  if (!levelDef) return;
  
  const objectives = levelDef.objectives;
  
  // Panel background
  p.fill(20, 30, 50, 200);
  p.stroke(100, 120, 150);
  p.strokeWeight(2);
  p.rect(10, 50, 220, 150);
  
  // Title
  p.fill(255, 255, 100);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text("OBJECTIVES:", 20, 60);
  
  let yPos = 85;
  p.textSize(11);
  
  // Resource objectives
  if (objectives.ice) {
    const met = gameState.resources.ice >= objectives.ice;
    p.fill(met ? [100, 255, 100] : [255, 255, 255]);
    p.text(`❄ Ice: ${gameState.resources.ice}/${objectives.ice}`, 20, yPos);
    yPos += 18;
  }
  if (objectives.wood) {
    const met = gameState.resources.wood >= objectives.wood;
    p.fill(met ? [100, 255, 100] : [255, 255, 255]);
    p.text(`🌲 Wood: ${gameState.resources.wood}/${objectives.wood}`, 20, yPos);
    yPos += 18;
  }
  if (objectives.food) {
    const met = gameState.resources.food >= objectives.food;
    p.fill(met ? [100, 255, 100] : [255, 255, 255]);
    p.text(`🍖 Food: ${gameState.resources.food}/${objectives.food}`, 20, yPos);
    yPos += 18;
  }
  
  // Building objectives
  if (objectives.cityCenterLevel) {
    const met = gameState.cityBuildings.cityCenter >= objectives.cityCenterLevel;
    p.fill(met ? [100, 255, 100] : [255, 255, 255]);
    p.text(`City Level: ${gameState.cityBuildings.cityCenter}/${objectives.cityCenterLevel}`, 20, yPos);
    yPos += 18;
  }
  
  if (objectives.heroCount) {
    const recruitedCount = gameState.heroes.filter(h => h.isRecruited).length;
    const met = recruitedCount >= objectives.heroCount;
    p.fill(met ? [100, 255, 100] : [255, 255, 255]);
    p.text(`Heroes: ${recruitedCount}/${objectives.heroCount}`, 20, yPos);
    yPos += 18;
  }
  
  if (objectives.buildingUpgrades) {
    const totalUpgrades = Object.values(gameState.cityBuildings).reduce((a, b) => a + b, 0);
    const met = totalUpgrades >= objectives.buildingUpgrades;
    p.fill(met ? [100, 255, 100] : [255, 255, 255]);
    p.text(`Building Upgrades: ${totalUpgrades}/${objectives.buildingUpgrades}`, 20, yPos);
    yPos += 18;
  }
  
  if (objectives.maxHeroLevel) {
    const maxLevel = Math.max(...gameState.heroes.filter(h => h.isRecruited).map(h => h.level));
    const met = maxLevel >= objectives.maxHeroLevel;
    p.fill(met ? [100, 255, 100] : [255, 255, 255]);
    p.text(`Max Hero Level: ${maxLevel}/${objectives.maxHeroLevel}`, 20, yPos);
    yPos += 18;
  }
  
  // Combat objectives
  if (objectives.defeatedCombatZones) {
    const defeatedCount = gameState.mapState.combatZones.filter(z => z.defeated).length;
    const met = defeatedCount >= objectives.defeatedCombatZones.length;
    p.fill(met ? [100, 255, 100] : [255, 255, 255]);
    p.text(`⚔ Battles Won: ${defeatedCount}/${objectives.defeatedCombatZones.length}`, 20, yPos);
    yPos += 18;
  }
}

export function renderBackground(p) {
  // Gradient background
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = y / CANVAS_HEIGHT;
    const c = p.lerpColor(p.color(180, 200, 220), p.color(220, 235, 250), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Snow particles
  p.noStroke();
  p.fill(255, 255, 255, 150);
  for (let i = 0; i < 30; i++) {
    const x = (p.noise(i * 0.1, p.frameCount * 0.01) * CANVAS_WIDTH);
    const y = (p.noise(i * 0.1 + 100, p.frameCount * 0.008) * CANVAS_HEIGHT);
    p.circle(x, y, 3);
  }
}

export function renderResourceNode(p, node, screenX, screenY) {
  const color = getResourceColor(node.type);
  
  p.fill(...color);
  p.noStroke();
  
  // Different shapes for different resources
  if (node.type === "ice") {
    // Crystal shape
    p.push();
    p.translate(screenX, screenY);
    p.beginShape();
    p.vertex(0, -15);
    p.vertex(10, -5);
    p.vertex(8, 10);
    p.vertex(-8, 10);
    p.vertex(-10, -5);
    p.endShape(p.CLOSE);
    p.pop();
  } else if (node.type === "wood") {
    // Tree shape
    p.fill(100, 60, 30);
    p.rect(screenX - 4, screenY - 5, 8, 15);
    p.fill(...color);
    p.circle(screenX, screenY - 10, 20);
  } else {
    // Food blob
    p.circle(screenX, screenY, 15);
  }
  
  // Amount text
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(10);
  p.text(node.amount, screenX, screenY + 20);
}

export function renderCombatZone(p, zone, screenX, screenY) {
  // Pulsing red circle
  const pulse = Math.sin(p.frameCount * 0.1) * 10 + 30;
  p.fill(255, 0, 0, pulse);
  p.noStroke();
  p.circle(screenX, screenY, 50);
  
  p.stroke(255, 0, 0);
  p.strokeWeight(2);
  p.noFill();
  p.circle(screenX, screenY, 50 + pulse / 2);
  
  // Skull icon
  p.fill(255, 0, 0);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("⚔", screenX, screenY);
  
  p.textSize(10);
  p.fill(255);
  p.text(`${zone.enemies.length} enemies`, screenX, screenY + 30);
}

export function renderCityCenter(p, screenX, screenY) {
  const level = gameState.cityBuildings.cityCenter;
  const size = 40 + level * 10;
  
  p.fill(100, 100, 120);
  p.stroke(80, 80, 100);
  p.strokeWeight(2);
  p.rect(screenX - size / 2, screenY - size / 2, size, size);
  
  // Flag
  p.fill(200, 50, 50);
  p.triangle(screenX, screenY - size / 2, screenX, screenY - size / 2 - 20, screenX + 15, screenY - size / 2 - 10);
  
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text("CITY", screenX, screenY);
  
  p.textSize(10);
  p.text(`Lv.${level}`, screenX, screenY + 15);
}

export function renderResourceUI(p) {
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  
  const resources = [
    { icon: "❄", value: gameState.resources.ice, color: [150, 200, 255] },
    { icon: "🌲", value: gameState.resources.wood, color: [139, 90, 43] },
    { icon: "🍖", value: gameState.resources.food, color: [180, 100, 80] }
  ];
  
  let xPos = 250;
  for (const res of resources) {
    p.fill(...res.color);
    p.text(`${res.icon} ${res.value}`, xPos, 10);
    xPos += 80;
  }
}

export function renderScoreUI(p) {
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text(`SCORE: ${String(gameState.score).padStart(6, '0')}`, CANVAS_WIDTH - 10, 10);
}

export function renderLevelUI(p) {
  p.fill(255, 200, 100);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  const levelDef = LEVEL_DEFINITIONS[gameState.currentLevel - 1];
  p.text(`LEVEL ${gameState.currentLevel}: ${levelDef.name}`, CANVAS_WIDTH / 2, 10);
}

export function renderCityMenu(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Menu panel
  p.fill(40, 50, 70);
  p.stroke(100, 120, 150);
  p.strokeWeight(2);
  p.rect(50, 50, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 100);
  
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(24);
  p.text("CITY MANAGEMENT", CANVAS_WIDTH / 2, 70);
  
  // Buildings section
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Buildings:", 70, 110);
  
  const buildings = [
    { name: "City Center", key: "cityCenter", cost: { ice: 100, wood: 50 } },
    { name: "Storage", key: "storage", cost: { ice: 50, wood: 80 } },
    { name: "Barracks", key: "barracks", cost: { wood: 100, food: 50 } },
    { name: "Hero Hall", key: "heroHall", cost: { ice: 80, food: 80 } }
  ];
  
  let yPos = 140;
  for (let i = 0; i < buildings.length; i++) {
    const building = buildings[i];
    const level = gameState.cityBuildings[building.key];
    
    p.fill(i === gameState.menuSelection ? [255, 255, 100] : [200, 200, 200]);
    p.textSize(14);
    p.text(`${building.name} (Lv.${level})`, 80, yPos);
    
    const costStr = Object.entries(building.cost)
      .map(([res, amt]) => `${getResourceIcon(res)}${amt * (level + 1)}`)
      .join(" ");
    p.textSize(12);
    p.text(`Cost: ${costStr}`, 250, yPos);
    
    yPos += 30;
  }
  
  // Heroes section
  yPos += 20;
  p.textSize(16);
  p.fill(255);
  p.text("Heroes:", 70, yPos);
  
  yPos += 30;
  const recruitedHeroes = gameState.heroes.filter(h => h.isRecruited);
  for (const hero of recruitedHeroes) {
    const color = hero.getColor();
    p.fill(...color);
    p.circle(80, yPos + 10, 20);
    
    p.fill(255);
    p.textSize(12);
    p.text(`${hero.name} (${hero.heroClass}) Lv.${hero.level}`, 110, yPos);
    p.text(`HP:${hero.currentHP}/${hero.maxHP} ATK:${Math.floor(hero.atk)} DEF:${Math.floor(hero.def)}`, 110, yPos + 15);
    
    yPos += 40;
  }
  
  // Instructions
  p.fill(200, 220, 240);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(12);
  p.text("Arrow Keys: Navigate | SPACE: Upgrade | Z: Close", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
}

export function renderCombatScreen(p) {
  p.background(40, 30, 30);
  
  if (!gameState.combatData) return;
  
  const { heroes, enemies, selectedHero, selectedEnemy, combatLog, combatOver } = gameState.combatData;
  
  // Title
  p.fill(255, 100, 100);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(20);
  p.text("COMBAT!", CANVAS_WIDTH / 2, 10);
  
  // Heroes
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text("Your Heroes:", 50, 50);
  
  for (let i = 0; i < heroes.length; i++) {
    const hero = heroes[i];
    const yPos = 80 + i * 60;
    
    // Hero circle
    const color = hero.getColor();
    p.fill(i === selectedHero ? [...color, 255] : [...color, 150]);
    p.circle(100, yPos + 10, 30);
    
    // Icon
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(hero.getIcon(), 100, yPos + 10);
    
    // Stats
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.fill(hero.currentHP > 0 ? [255, 255, 255] : [150, 150, 150]);
    p.text(hero.name, 130, yPos);
    p.text(`HP: ${Math.floor(hero.currentHP)}/${Math.floor(hero.maxHP)}`, 130, yPos + 15);
    
    // Health bar
    const barWidth = 100;
    const hpPercent = hero.currentHP / hero.maxHP;
    p.fill(50, 50, 50);
    p.rect(130, yPos + 30, barWidth, 8);
    p.fill(hpPercent > 0.3 ? [100, 255, 100] : [255, 100, 100]);
    p.rect(130, yPos + 30, barWidth * hpPercent, 8);
  }
  
  // Enemies
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("Enemies:", CANVAS_WIDTH - 50, 50);
  
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    const yPos = 80 + i * 60;
    
    if (!enemy.isAlive()) continue;
    
    // Enemy circle
    const color = enemy.getColor();
    p.fill(i === selectedEnemy ? [...color, 255] : [...color, 150]);
    p.circle(CANVAS_WIDTH - 100, yPos + 10, 30);
    
    // Icon
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(enemy.getIcon(), CANVAS_WIDTH - 100, yPos + 10);
    
    // Stats
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(12);
    p.fill(255);
    p.text(enemy.name, CANVAS_WIDTH - 130, yPos);
    p.text(`HP: ${Math.floor(enemy.currentHP)}/${Math.floor(enemy.maxHP)}`, CANVAS_WIDTH - 130, yPos + 15);
    
    // Health bar
    const barWidth = 100;
    const hpPercent = enemy.currentHP / enemy.maxHP;
    p.fill(50, 50, 50);
    p.rect(CANVAS_WIDTH - 230, yPos + 30, barWidth, 8);
    p.fill(hpPercent > 0.3 ? [100, 255, 100] : [255, 100, 100]);
    p.rect(CANVAS_WIDTH - 230, yPos + 30, barWidth * hpPercent, 8);
  }
  
  // Combat log
  p.fill(200, 200, 200);
  p.textAlign(p.LEFT, p.BOTTOM);
  p.textSize(11);
  const logStart = Math.max(0, combatLog.length - 3);
  for (let i = logStart; i < combatLog.length; i++) {
    p.text(combatLog[i], 50, CANVAS_HEIGHT - 60 + (i - logStart) * 15);
  }
  
  // Update animations
  gameState.combatData.animations = gameState.combatData.animations.filter(anim => {
    anim.timer--;
    if (anim.timer > 0) {
      if (anim.type === "damage") {
        p.fill(255, 100, 100);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(20);
        p.text(`-${anim.value}`, anim.x, anim.y - (30 - anim.timer));
      }
      return true;
    }
    return false;
  });
  
  // Instructions or combat over message
  if (combatOver) {
    p.fill(gameState.combatData.playerWon ? [100, 255, 100] : [255, 100, 100]);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(16);
    p.text(gameState.combatData.playerWon ? "VICTORY!" : "DEFEAT!", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    p.fill(255, 255, 100);
    p.textSize(12);
    p.text("SPACE to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
  } else {
    p.fill(200, 220, 240);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(12);
    p.text("Arrow Keys: Select | SPACE: Attack", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
  }
}

export function renderLevelComplete(p) {
  p.background(30, 50, 30);
  
  const levelDef = LEVEL_DEFINITIONS[gameState.currentLevel - 1];
  
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("LEVEL COMPLETE!", CANVAS_WIDTH / 2, 80);
  
  p.fill(200, 255, 200);
  p.textSize(16);
  const lines = levelDef.completeMessage.split('\n');
  let yPos = 140;
  for (const line of lines) {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 25;
  }
  
  p.fill(255, 255, 100);
  p.textSize(20);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 240);
  
  p.fill(255, 255, 100);
  p.textSize(16);
  const pulse = Math.sin(p.frameCount * 0.1) * 20 + 235;
  p.fill(pulse, pulse, 100);
  p.text("PRESS SPACE TO CONTINUE", CANVAS_WIDTH / 2, 320);
}

export function renderPausedIndicator(p) {
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 30);
}

export function renderGameOver(p, won) {
  p.background(won ? [30, 50, 30] : [50, 30, 30]);
  
  p.fill(won ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(won ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  if (won) {
    p.fill(200, 255, 200);
    p.textSize(20);
    p.text("You conquered the ice field!", CANVAS_WIDTH / 2, 160);
    p.text("You are the STRONGEST!", CANVAS_WIDTH / 2, 190);
  } else {
    p.fill(255, 200, 200);
    p.textSize(18);
    p.text("All heroes have fallen...", CANVAS_WIDTH / 2, 170);
  }
  
  p.fill(255, 255, 100);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
  
  // High scores
  const highScores = getHighScores();
  if (highScores.length > 0) {
    p.fill(200, 200, 255);
    p.textSize(16);
    p.text("High Scores:", CANVAS_WIDTH / 2, 270);
    
    p.textSize(14);
    for (let i = 0; i < Math.min(5, highScores.length); i++) {
      p.text(`${i + 1}. ${highScores[i]}`, CANVAS_WIDTH / 2, 295 + i * 18);
    }
  }
  
  p.fill(255, 255, 100);
  p.textSize(14);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

function updateAndRenderAnimations(p) {
  gameState.animations = gameState.animations.filter(anim => {
    anim.timer--;
    if (anim.timer > 0) {
      if (anim.type === "resource_collect") {
        // Float towards UI
        const targetX = 250 + anim.resourceIndex * 80;
        const targetY = 20;
        const progress = 1 - (anim.timer / 30);
        
        const x = p.lerp(anim.startX, targetX, progress);
        const y = p.lerp(anim.startY, targetY, progress);
        
        p.fill(255, 255, 255, 255 * (1 - progress));
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(16);
        p.text(anim.icon, x, y);
      }
      return true;
    }
    return false;
  });
}