import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, SCREEN_MODES, HERO_CLASSES } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 15, 30);
  
  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(200, 150, 255, 100);
  p.textSize(48);
  p.text("SANCTUARY QUEST", CANVAS_WIDTH / 2 + 2, 60 + 2);
  p.fill(255, 220, 150);
  p.textSize(48);
  p.text("SANCTUARY QUEST", CANVAS_WIDTH / 2, 60);
  p.pop();
  
  // Subtitle
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(180, 160, 200);
  p.textSize(16);
  p.text("Dungeon Exploration & Base Management RPG", CANVAS_WIDTH / 2, 100);
  p.pop();
  
  // Description
  const desc = [
    "Build your Sanctuary and manage resources.",
    "Recruit heroes and form a party of up to 4 warriors.",
    "Explore dangerous dungeons filled with monsters and treasures.",
    "Progress through 3 zones to unlock the Arena and win!"
  ];
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(200, 200, 220);
  p.textSize(12);
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], CANVAS_WIDTH / 2, 140 + i * 20);
  }
  p.pop();
  
  // Controls
  const controls = [
    "Arrow Keys: Navigate menus and dungeons",
    "Space: Select/Confirm actions",
    "Z: Use hero abilities in combat",
    "Shift: Speed up animations",
    "ESC: Pause | R: Restart"
  ];
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(150, 150, 170);
  p.textSize(11);
  for (let i = 0; i < controls.length; i++) {
    p.text(controls[i], CANVAS_WIDTH / 2, 240 + i * 18);
  }
  p.pop();
  
  // Start prompt with pulse
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  const pulseAlpha = 150 + Math.sin(p.frameCount * 0.1) * 105;
  p.fill(255, 220, 100, pulseAlpha);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  p.pop();
}

export function drawBaseScreen(p) {
  p.background(40, 35, 50);
  
  // Header
  p.push();
  p.fill(60, 50, 70);
  p.rect(0, 0, CANVAS_WIDTH, 50);
  p.fill(255, 220, 150);
  p.textSize(24);
  p.textAlign(p.LEFT, p.TOP);
  p.text("SANCTUARY", 20, 12);
  p.pop();
  
  // Resources display
  p.push();
  p.textSize(14);
  p.fill(200, 200, 220);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Food: ${Math.floor(gameState.resources.food)}`, CANVAS_WIDTH - 20, 15);
  p.text(`Materials: ${Math.floor(gameState.resources.materials)}`, CANVAS_WIDTH - 20, 32);
  p.pop();
  
  // Menu options
  const menuY = 80;
  const menuOptions = [
    "Manage Workers",
    "Recruit Hero",
    "View Heroes",
    "Enter Dungeon"
  ];
  
  p.push();
  p.textSize(16);
  for (let i = 0; i < menuOptions.length; i++) {
    const isSelected = gameState.menuSelection === i;
    p.fill(isSelected ? 255 : 100, isSelected ? 220 : 100, isSelected ? 150 : 120);
    if (isSelected) {
      p.rect(40, menuY + i * 40 - 5, 200, 30, 5);
      p.fill(40, 35, 50);
    }
    p.textAlign(p.LEFT, p.CENTER);
    p.text(menuOptions[i], 60, menuY + i * 40 + 10);
  }
  p.pop();
  
  // Worker allocation display
  p.push();
  p.fill(80, 70, 100);
  p.rect(280, 80, 300, 120, 5);
  p.fill(200, 200, 220);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Worker Allocation:", 300, 95);
  p.text(`Population: ${gameState.population}`, 300, 120);
  p.text(`Food Workers: ${gameState.workers.food}`, 300, 140);
  p.text(`Material Workers: ${gameState.workers.materials}`, 300, 160);
  p.text(`Idle: ${gameState.population - gameState.workers.food - gameState.workers.materials}`, 300, 180);
  p.pop();
  
  // Party composition
  p.push();
  p.fill(80, 70, 100);
  p.rect(280, 210, 300, 120, 5);
  p.fill(200, 200, 220);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Current Party:", 300, 225);
  
  if (gameState.party.length === 0) {
    p.fill(150, 150, 170);
    p.text("No heroes in party", 300, 250);
  } else {
    for (let i = 0; i < gameState.party.length; i++) {
      const hero = gameState.party[i];
      p.fill(200, 200, 220);
      p.text(`${hero.class} Lv${hero.level} (${hero.health}/${hero.maxHealth} HP)`, 300, 250 + i * 20);
    }
  }
  p.pop();
  
  // Progress info
  p.push();
  p.fill(60, 50, 70);
  p.rect(0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 40);
  p.fill(200, 200, 220);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Zone: ${gameState.currentZone} | Score: ${gameState.score} | Gold: ${gameState.gold}`, 20, CANVAS_HEIGHT - 20);
  p.pop();
}

export function drawHeroesScreen(p) {
  p.background(40, 35, 50);
  
  // Header
  p.push();
  p.fill(60, 50, 70);
  p.rect(0, 0, CANVAS_WIDTH, 50);
  p.fill(255, 220, 150);
  p.textSize(24);
  p.textAlign(p.LEFT, p.TOP);
  p.text("HEROES", 20, 12);
  p.pop();
  
  // Instructions
  p.push();
  p.fill(150, 150, 170);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Space: Add/Remove from party | Arrow Keys: Select | ESC: Back", 20, CANVAS_HEIGHT - 25);
  p.pop();
  
  if (gameState.heroes.length === 0) {
    p.push();
    p.fill(150, 150, 170);
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("No heroes recruited yet. Visit the Sanctuary to recruit heroes.", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.pop();
    return;
  }
  
  // Hero list
  const startY = 70;
  for (let i = 0; i < gameState.heroes.length; i++) {
    const hero = gameState.heroes[i];
    const isSelected = gameState.selectedHeroIndex === i;
    const inParty = gameState.party.includes(hero);
    
    p.push();
    p.fill(isSelected ? 80 : 60, isSelected ? 70 : 60, isSelected ? 100 : 80);
    p.rect(20, startY + i * 70, 560, 60, 5);
    
    // Hero info
    p.fill(inParty ? 150 : 200, inParty ? 255 : 200, inParty ? 150 : 220);
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`${hero.class} - Level ${hero.level}`, 40, startY + i * 70 + 10);
    
    p.fill(180, 180, 200);
    p.textSize(12);
    p.text(`HP: ${hero.health}/${hero.maxHealth} | ATK: ${hero.attack} | DEF: ${hero.defense}`, 40, startY + i * 70 + 35);
    p.text(`Ability: ${hero.ability}`, 350, startY + i * 70 + 35);
    
    if (inParty) {
      p.fill(150, 255, 150);
      p.textSize(12);
      p.text("[IN PARTY]", 500, startY + i * 70 + 10);
    }
    p.pop();
  }
}

export function drawDungeonScreen(p) {
  p.background(25, 20, 35);
  
  // Header
  p.push();
  p.fill(50, 40, 60);
  p.rect(0, 0, CANVAS_WIDTH, 40);
  p.fill(255, 220, 150);
  p.textSize(18);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Zone ${gameState.currentZone} Dungeon`, 20, 10);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.fill(200, 200, 220);
  p.text(`Progress: ${gameState.dungeonProgress}%`, CANVAS_WIDTH - 20, 12);
  p.pop();
  
  // Draw dungeon map
  const map = gameState.dungeonMap;
  const cellSize = 40;
  const startX = (CANVAS_WIDTH - map[0].length * cellSize) / 2;
  const startY = 60;
  
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      const cell = map[y][x];
      const cellX = startX + x * cellSize;
      const cellY = startY + y * cellSize;
      const isExplored = cell.explored || (Math.abs(x - gameState.playerX) <= 1 && Math.abs(y - gameState.playerY) <= 1);
      
      p.push();
      
      if (!isExplored) {
        p.fill(40, 35, 50);
      } else {
        switch (cell.type) {
          case "wall":
            p.fill(80, 70, 90);
            break;
          case "enemy":
            p.fill(180, 50, 50);
            break;
          case "treasure":
            p.fill(220, 180, 50);
            break;
          case "trap":
            p.fill(150, 50, 150);
            break;
          case "exit":
            p.fill(50, 180, 50);
            break;
          case "arena":
            p.fill(255, 215, 0);
            break;
          case "start":
            p.fill(50, 120, 180);
            break;
          default:
            p.fill(60, 55, 70);
        }
      }
      
      p.rect(cellX, cellY, cellSize - 2, cellSize - 2, 3);
      
      // Draw player
      if (x === gameState.playerX && y === gameState.playerY) {
        p.fill(100, 200, 255);
        p.ellipse(cellX + cellSize / 2, cellY + cellSize / 2, cellSize * 0.6);
      }
      
      // Draw icons for explored cells
      if (isExplored) {
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(10);
        switch (cell.type) {
          case "enemy":
            p.fill(255, 200, 200);
            p.text("E", cellX + cellSize / 2, cellY + cellSize / 2);
            break;
          case "treasure":
            p.fill(255, 255, 200);
            p.text("T", cellX + cellSize / 2, cellY + cellSize / 2);
            break;
          case "trap":
            p.fill(255, 200, 255);
            p.text("!", cellX + cellSize / 2, cellY + cellSize / 2);
            break;
          case "exit":
            p.fill(200, 255, 200);
            p.text("EXIT", cellX + cellSize / 2, cellY + cellSize / 2);
            break;
          case "arena":
            p.fill(255, 255, 150);
            p.text("ARENA", cellX + cellSize / 2, cellY + cellSize / 2);
            break;
        }
      }
      
      p.pop();
    }
  }
  
  // Party status
  p.push();
  p.fill(50, 40, 60);
  p.rect(0, CANVAS_HEIGHT - 80, CANVAS_WIDTH, 80);
  p.fill(200, 200, 220);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Party:", 20, CANVAS_HEIGHT - 70);
  
  for (let i = 0; i < gameState.party.length; i++) {
    const hero = gameState.party[i];
    const barWidth = 120;
    const barX = 20 + i * 140;
    const barY = CANVAS_HEIGHT - 50;
    
    p.fill(150, 150, 170);
    p.text(`${hero.class} Lv${hero.level}`, barX, barY - 15);
    
    // Health bar
    p.fill(80, 60, 60);
    p.rect(barX, barY, barWidth, 12);
    p.fill(hero.health > hero.maxHealth * 0.5 ? 100 : 180, hero.health > hero.maxHealth * 0.5 ? 180 : 80, 80);
    const healthPercent = hero.health / hero.maxHealth;
    p.rect(barX, barY, barWidth * healthPercent, 12);
    
    p.fill(255, 255, 255);
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`${hero.health}/${hero.maxHealth}`, barX + barWidth / 2, barY + 6);
  }
  p.pop();
}

export function drawCombatScreen(p) {
  p.background(30, 20, 25);
  
  // Header
  p.push();
  p.fill(60, 40, 50);
  p.rect(0, 0, CANVAS_WIDTH, 40);
  p.fill(255, 150, 150);
  p.textSize(20);
  p.textAlign(p.CENTER, p.TOP);
  p.text("COMBAT", CANVAS_WIDTH / 2, 10);
  p.pop();
  
  // Draw enemies
  const enemyY = 80;
  const enemySpacing = CANVAS_WIDTH / (gameState.enemies.length + 1);
  
  for (let i = 0; i < gameState.enemies.length; i++) {
    const enemy = gameState.enemies[i];
    const x = enemySpacing * (i + 1);
    
    if (enemy.health > 0) {
      // Enemy body
      p.push();
      p.fill(180, 60, 60);
      p.ellipse(x, enemyY, 50, 60);
      p.fill(200, 80, 80);
      p.ellipse(x, enemyY - 10, 35);
      
      // Eyes
      p.fill(255, 50, 50);
      p.ellipse(x - 8, enemyY - 15, 8);
      p.ellipse(x + 8, enemyY - 15, 8);
      p.pop();
      
      // Name and health bar
      p.push();
      p.fill(200, 200, 220);
      p.textSize(12);
      p.textAlign(p.CENTER, p.TOP);
      p.text(enemy.name, x, enemyY + 40);
      
      const barWidth = 60;
      p.fill(80, 40, 40);
      p.rect(x - barWidth / 2, enemyY + 55, barWidth, 8);
      p.fill(180, 80, 80);
      const healthPercent = enemy.health / enemy.maxHealth;
      p.rect(x - barWidth / 2, enemyY + 55, barWidth * healthPercent, 8);
      p.pop();
    } else {
      // Dead enemy
      p.push();
      p.fill(100, 60, 60);
      p.textSize(16);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("X", x, enemyY);
      p.pop();
    }
  }
  
  // Draw party
  const partyY = 220;
  const partySpacing = CANVAS_WIDTH / (gameState.party.length + 1);
  
  for (let i = 0; i < gameState.party.length; i++) {
    const hero = gameState.party[i];
    const x = partySpacing * (i + 1);
    const isSelected = gameState.selectedPartyMember === i;
    
    if (hero.health > 0) {
      // Hero body
      p.push();
      const heroColor = isSelected ? [100, 200, 255] : [80, 150, 200];
      p.fill(...heroColor);
      p.ellipse(x, partyY, 40, 50);
      p.fill(heroColor[0] + 20, heroColor[1] + 20, heroColor[2] + 20);
      p.ellipse(x, partyY - 8, 28);
      
      // Class indicator
      p.fill(255, 255, 255);
      p.textSize(10);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(hero.class[0], x, partyY - 8);
      p.pop();
      
      // Selection indicator
      if (isSelected) {
        p.push();
        p.noFill();
        p.stroke(255, 220, 100);
        p.strokeWeight(2);
        p.ellipse(x, partyY, 55, 65);
        p.pop();
      }
      
      // Name and health bar
      p.push();
      p.fill(200, 200, 220);
      p.textSize(10);
      p.textAlign(p.CENTER, p.TOP);
      p.text(hero.class, x, partyY + 30);
      
      const barWidth = 50;
      p.fill(60, 80, 60);
      p.rect(x - barWidth / 2, partyY + 45, barWidth, 8);
      p.fill(100, 180, 100);
      const healthPercent = hero.health / hero.maxHealth;
      p.rect(x - barWidth / 2, partyY + 45, barWidth * healthPercent, 8);
      
      // Ability cooldown
      if (hero.currentCooldown > 0) {
        p.fill(150, 150, 170);
        p.textSize(8);
        p.text(`CD: ${Math.ceil(hero.currentCooldown / 60)}s`, x, partyY + 56);
      } else {
        p.fill(150, 255, 150);
        p.textSize(8);
        p.text("READY", x, partyY + 56);
      }
      p.pop();
    } else {
      // Dead hero
      p.push();
      p.fill(100, 100, 120);
      p.textSize(14);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("KO", x, partyY);
      p.pop();
    }
  }
  
  // Combat log
  p.push();
  p.fill(40, 30, 40);
  p.rect(10, CANVAS_HEIGHT - 90, CANVAS_WIDTH - 20, 80, 5);
  p.fill(200, 200, 220);
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  
  const logStart = Math.max(0, gameState.combatLog.length - 5);
  for (let i = logStart; i < gameState.combatLog.length; i++) {
    p.text(gameState.combatLog[i], 20, CANVAS_HEIGHT - 85 + (i - logStart) * 15);
  }
  p.pop();
  
  // Controls hint
  p.push();
  p.fill(150, 150, 170);
  p.textSize(10);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text("Space: Attack | Z: Use Ability | Arrow Keys: Switch Hero", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 5);
  p.pop();
}

export function drawPauseOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 20, 20);
  p.pop();
}

export function drawGameOverScreen(p, isWin) {
  p.push();
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (isWin) {
    p.fill(150, 255, 150);
    p.textSize(48);
    p.text("VICTORY!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    p.fill(255, 255, 200);
    p.textSize(24);
    p.text("Arena Unlocked!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  } else {
    p.fill(255, 150, 150);
    p.textSize(48);
    p.text("DEFEAT", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
  }
  
  p.fill(200, 200, 220);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text(`Zone Reached: ${gameState.currentZone}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  
  p.fill(255, 220, 100);
  p.textSize(18);
  const pulseAlpha = 150 + Math.sin(p.frameCount * 0.1) * 105;
  p.fill(255, 220, 100, pulseAlpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
  p.pop();
}