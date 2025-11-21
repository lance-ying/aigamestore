import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, SCREEN_MODES, COMBAT_PHASES, HERO_CLASSES } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 15, 30);
  
  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(200, 150, 255, 100);
  p.textSize(56);
  p.text("SANCTUARY QUEST", CANVAS_WIDTH / 2 + 2, 100 + 2);
  p.fill(255, 220, 150);
  p.textSize(56);
  p.text("SANCTUARY QUEST", CANVAS_WIDTH / 2, 100);
  p.pop();
  
  // Subtitle
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(180, 160, 200);
  p.textSize(18);
  p.text("Dungeon Exploration & Base Management RPG", CANVAS_WIDTH / 2, 150);
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
  p.textSize(14);
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], CANVAS_WIDTH / 2, 200 + i * 25);
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
  p.textSize(13);
  for (let i = 0; i < controls.length; i++) {
    p.text(controls[i], CANVAS_WIDTH / 2, 350 + i * 22);
  }
  p.pop();
  
  // Start prompt with pulse
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  const pulseAlpha = 150 + Math.sin(p.frameCount * 0.1) * 105;
  p.fill(255, 220, 100, pulseAlpha);
  p.textSize(24);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 520);
  p.pop();
}

export function drawBaseScreen(p) {
  p.background(40, 35, 50);
  
  // Header
  p.push();
  p.fill(60, 50, 70);
  p.rect(0, 0, CANVAS_WIDTH, 60);
  p.fill(255, 220, 150);
  p.textSize(28);
  p.textAlign(p.LEFT, p.TOP);
  p.text("SANCTUARY", 30, 15);
  p.pop();
  
  // Resources display with animated bars
  p.push();
  const resourceX = CANVAS_WIDTH - 200;
  const resourceY = 15;
  
  // Food resource with pulse animation
  const foodPulse = gameState.resourceAnimations.food > 0 ? Math.sin(gameState.resourceAnimations.food * 0.3) * 10 : 0;
  p.fill(60, 50, 70);
  p.rect(resourceX, resourceY, 180, 18, 3);
  p.fill(100 + foodPulse, 180 + foodPulse, 100 + foodPulse);
  const foodBarWidth = Math.min(170, (gameState.resources.food / 200) * 170);
  p.rect(resourceX + 5, resourceY + 3, foodBarWidth, 12, 2);
  p.fill(255, 255, 255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Food: ${Math.floor(gameState.resources.food)}`, resourceX + 10, resourceY + 9);
  
  // Food generation rate with glow
  if (gameState.workers.food > 0) {
    const glowAlpha = gameState.resourceAnimations.food > 0 ? 255 : 200;
    p.fill(150, 255, 150, glowAlpha);
    p.textSize(10);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`+${(gameState.workers.food * 0.5).toFixed(1)}/s`, resourceX + 175, resourceY + 9);
  }
  
  // Materials resource with pulse animation
  const matPulse = gameState.resourceAnimations.materials > 0 ? Math.sin(gameState.resourceAnimations.materials * 0.3) * 10 : 0;
  p.fill(60, 50, 70);
  p.rect(resourceX, resourceY + 25, 180, 18, 3);
  p.fill(180 + matPulse, 140 + matPulse, 100 + matPulse);
  const materialsBarWidth = Math.min(170, (gameState.resources.materials / 100) * 170);
  p.rect(resourceX + 5, resourceY + 28, materialsBarWidth, 12, 2);
  p.fill(255, 255, 255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Mat: ${Math.floor(gameState.resources.materials)}`, resourceX + 10, resourceY + 34);
  
  // Materials generation rate with glow
  if (gameState.workers.materials > 0) {
    const glowAlpha = gameState.resourceAnimations.materials > 0 ? 255 : 200;
    p.fill(255, 200, 150, glowAlpha);
    p.textSize(10);
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(`+${(gameState.workers.materials * 0.3).toFixed(1)}/s`, resourceX + 175, resourceY + 34);
  }
  p.pop();
  
  // Menu options with enhanced visuals
  const menuY = 80;
  const menuOptions = [
    { 
      title: "Manage Workers", 
      desc: "Allocate workers to production",
      icon: "⚒",
      canAfford: true
    },
    { 
      title: "Recruit Hero", 
      desc: "Cost: 20 Food, 10 Materials",
      icon: "⚔",
      canAfford: gameState.resources.food >= 20 && gameState.resources.materials >= 10
    },
    { 
      title: "View Heroes", 
      desc: `${gameState.heroes.length} heroes recruited`,
      icon: "👥",
      canAfford: true
    },
    { 
      title: "Enter Dungeon", 
      desc: `Zone ${gameState.currentZone} - ${gameState.party.length}/4 party`,
      icon: "🗡",
      canAfford: gameState.party.length > 0
    }
  ];
  
  const maxVisibleItems = 4;
  const scrollOffset = gameState.menuScrollOffset;
  const visibleOptions = menuOptions.slice(scrollOffset, scrollOffset + maxVisibleItems);
  
  // Draw scrollable menu area
  p.push();
  p.fill(50, 45, 60);
  p.rect(30, menuY - 10, 280, 240, 8);
  p.pop();
  
  // Scroll indicators
  if (scrollOffset > 0) {
    p.push();
    p.fill(200, 200, 220);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text("▲", 170, menuY - 5);
    p.pop();
  }
  
  if (scrollOffset + maxVisibleItems < menuOptions.length) {
    p.push();
    p.fill(200, 200, 220);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text("▼", 170, menuY + 225);
    p.pop();
  }
  
  // Draw menu items
  for (let i = 0; i < visibleOptions.length; i++) {
    const option = visibleOptions[i];
    const actualIndex = scrollOffset + i;
    const isSelected = gameState.menuSelection === actualIndex;
    const yPos = menuY + i * 55;
    
    p.push();
    
    // Selection highlight with glow animation
    if (isSelected) {
      const pulse = Math.sin(p.frameCount * 0.1) * 10 + 10;
      p.fill(100 + pulse, 80 + pulse, 120 + pulse, 200);
      p.rect(40, yPos - 2, 260, 48, 6);
      
      // Glow effect
      p.noFill();
      p.stroke(150 + pulse, 120 + pulse, 180 + pulse, 150);
      p.strokeWeight(2);
      p.rect(40, yPos - 2, 260, 48, 6);
      p.noStroke();
    } else {
      p.fill(65, 60, 75);
      p.rect(40, yPos - 2, 260, 48, 6);
    }
    
    // Icon
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text(option.icon, 65, yPos + 20);
    
    // Title
    if (!option.canAfford) {
      p.fill(150, 100, 100);
    } else if (isSelected) {
      p.fill(255, 240, 180);
    } else {
      p.fill(200, 200, 220);
    }
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    p.text(option.title, 95, yPos + 8);
    
    // Description
    p.fill(isSelected ? 220 : 150, isSelected ? 220 : 150, isSelected ? 180 : 170);
    p.textSize(11);
    p.text(option.desc, 95, yPos + 28);
    
    p.pop();
  }
  
  // Worker allocation display with visual bars
  p.push();
  p.fill(50, 45, 60);
  p.rect(330, 80, 540, 220, 8);
  
  p.fill(255, 220, 150);
  p.textSize(18);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Worker Allocation", 350, 95);
  
  const workerY = 125;
  const idle = gameState.population - gameState.workers.food - gameState.workers.materials;
  
  // Population
  p.fill(200, 200, 220);
  p.textSize(14);
  p.text(`Population: ${gameState.population}`, 350, workerY);
  
  // Food workers with bar
  p.fill(180, 180, 200);
  p.text(`Food Workers:`, 350, workerY + 35);
  p.fill(70, 60, 80);
  p.rect(350, workerY + 56, 500, 14, 2);
  p.fill(100, 180, 100);
  const foodWorkerBar = (gameState.workers.food / gameState.population) * 500;
  p.rect(350, workerY + 56, foodWorkerBar, 14, 2);
  p.fill(255, 255, 255);
  p.textSize(12);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`${gameState.workers.food}`, 600, workerY + 63);
  
  // Material workers with bar
  p.textAlign(p.LEFT, p.TOP);
  p.fill(180, 180, 200);
  p.textSize(14);
  p.text(`Material Workers:`, 350, workerY + 80);
  p.fill(70, 60, 80);
  p.rect(350, workerY + 101, 500, 14, 2);
  p.fill(180, 140, 100);
  const matWorkerBar = (gameState.workers.materials / gameState.population) * 500;
  p.rect(350, workerY + 101, matWorkerBar, 14, 2);
  p.fill(255, 255, 255);
  p.textSize(12);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`${gameState.workers.materials}`, 600, workerY + 108);
  
  // Idle workers with bar
  p.textAlign(p.LEFT, p.TOP);
  p.fill(180, 180, 200);
  p.textSize(14);
  p.text(`Idle Workers:`, 350, workerY + 125);
  p.fill(70, 60, 80);
  p.rect(350, workerY + 146, 500, 14, 2);
  p.fill(150, 150, 170);
  const idleWorkerBar = (idle / gameState.population) * 500;
  p.rect(350, workerY + 146, idleWorkerBar, 14, 2);
  p.fill(255, 255, 255);
  p.textSize(12);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`${idle}`, 600, workerY + 153);
  
  p.pop();
  
  // Party composition with enhanced visuals
  p.push();
  p.fill(50, 45, 60);
  p.rect(330, 310, 540, 165, 8);
  
  p.fill(255, 220, 150);
  p.textSize(18);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Current Party", 350, 325);
  
  if (gameState.party.length === 0) {
    p.fill(150, 150, 170);
    p.textSize(14);
    p.text("No heroes in party", 350, 360);
    p.textSize(12);
    p.fill(120, 120, 140);
    p.text("Recruit heroes and add them to your party", 350, 385);
  } else {
    for (let i = 0; i < gameState.party.length; i++) {
      const hero = gameState.party[i];
      const heroY = 360 + i * 35;
      
      // Health bar
      p.fill(80, 60, 60);
      p.rect(350, heroY, 150, 16, 2);
      const healthPercent = hero.health / hero.maxHealth;
      p.fill(hero.health > hero.maxHealth * 0.5 ? 100 : 180, 
             hero.health > hero.maxHealth * 0.5 ? 180 : 80, 80);
      p.rect(350, heroY, 150 * healthPercent, 16, 2);
      
      // Hero info
      p.fill(200, 200, 220);
      p.textSize(13);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(`${hero.class} Lv${hero.level}`, 515, heroY + 8);
      
      p.fill(255, 255, 255);
      p.textSize(11);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(`${hero.health}/${hero.maxHealth}`, 425, heroY + 8);
    }
  }
  p.pop();
  
  // Draw particles
  drawParticles(p);
  
  // Action feedback overlay
  if (gameState.actionFeedback.timer > 0) {
    p.push();
    const alpha = Math.min(255, gameState.actionFeedback.timer * 4);
    
    let bgColor, textColor;
    if (gameState.actionFeedback.type === "success") {
      bgColor = [100, 200, 100, alpha * 0.8];
      textColor = [255, 255, 255, alpha];
    } else if (gameState.actionFeedback.type === "error") {
      bgColor = [200, 100, 100, alpha * 0.8];
      textColor = [255, 255, 255, alpha];
    } else {
      bgColor = [100, 150, 200, alpha * 0.8];
      textColor = [255, 255, 255, alpha];
    }
    
    p.fill(...bgColor);
    p.rect(250, 490, 400, 45, 5);
    p.fill(...textColor);
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(gameState.actionFeedback.message, 450, 512);
    p.pop();
  }
  
  // Progress info
  p.push();
  p.fill(60, 50, 70);
  p.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
  p.fill(200, 200, 220);
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Zone: ${gameState.currentZone} | Score: ${gameState.score} | Gold: ${gameState.gold}`, 30, CANVAS_HEIGHT - 25);
  
  // Controls hint
  p.fill(150, 150, 170);
  p.textSize(12);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text("↑↓: Navigate | Space: Select | ESC: Pause", CANVAS_WIDTH - 30, CANVAS_HEIGHT - 25);
  p.pop();
}

export function drawHeroesScreen(p) {
  p.background(40, 35, 50);
  
  // Header
  p.push();
  p.fill(60, 50, 70);
  p.rect(0, 0, CANVAS_WIDTH, 60);
  p.fill(255, 220, 150);
  p.textSize(28);
  p.textAlign(p.LEFT, p.TOP);
  p.text("HEROES", 30, 15);
  p.pop();
  
  // Instructions
  p.push();
  p.fill(150, 150, 170);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Space: Add/Remove from party | Arrow Keys: Select | ESC: Back", 30, CANVAS_HEIGHT - 35);
  p.pop();
  
  if (gameState.heroes.length === 0) {
    p.push();
    p.fill(150, 150, 170);
    p.textSize(18);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("No heroes recruited yet. Visit the Sanctuary to recruit heroes.", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    p.pop();
    return;
  }
  
  // Hero list
  const startY = 90;
  for (let i = 0; i < gameState.heroes.length; i++) {
    const hero = gameState.heroes[i];
    const isSelected = gameState.selectedHeroIndex === i;
    const inParty = gameState.party.includes(hero);
    
    p.push();
    p.fill(isSelected ? 80 : 60, isSelected ? 70 : 60, isSelected ? 100 : 80);
    p.rect(30, startY + i * 80, 840, 70, 5);
    
    // Hero info
    p.fill(inParty ? 150 : 200, inParty ? 255 : 200, inParty ? 150 : 220);
    p.textSize(18);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`${hero.class} - Level ${hero.level}`, 50, startY + i * 80 + 15);
    
    p.fill(180, 180, 200);
    p.textSize(14);
    p.text(`HP: ${hero.health}/${hero.maxHealth} | ATK: ${hero.attack} | DEF: ${hero.defense}`, 50, startY + i * 80 + 42);
    p.text(`Ability: ${hero.ability}`, 500, startY + i * 80 + 42);
    
    if (inParty) {
      p.fill(150, 255, 150);
      p.textSize(14);
      p.text("[IN PARTY]", 750, startY + i * 80 + 15);
    }
    p.pop();
  }
}

export function drawDungeonScreen(p) {
  p.background(25, 20, 35);
  
  // Header
  p.push();
  p.fill(50, 40, 60);
  p.rect(0, 0, CANVAS_WIDTH, 50);
  p.fill(255, 220, 150);
  p.textSize(22);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Zone ${gameState.currentZone} Dungeon`, 30, 12);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(18);
  p.fill(200, 200, 220);
  p.text(`Progress: ${gameState.dungeonProgress}%`, CANVAS_WIDTH - 30, 14);
  p.pop();
  
  // Draw dungeon map
  const map = gameState.dungeonMap;
  const cellSize = 60;
  const startX = (CANVAS_WIDTH - map[0].length * cellSize) / 2;
  const startY = 80;
  
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      const cell = map[y][x];
      const cellX = startX + x * cellSize;
      const cellY = startY + y * cellSize;
      const isExplored = cell.explored || (Math.abs(x - gameState.playerX) <= 1 && Math.abs(y - gameState.playerY) <= 1);
      
      p.push();
      
      if (!isExplored) {
        p.fill(30, 25, 40);
      } else {
        switch (cell.type) {
          case "wall":
            p.fill(100, 95, 110);
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
            p.fill(40, 35, 50);
        }
      }
      
      p.rect(cellX, cellY, cellSize - 3, cellSize - 3, 4);
      
      // Draw player with pulse effect
      if (x === gameState.playerX && y === gameState.playerY) {
        const pulse = Math.sin(p.frameCount * 0.15) * 5;
        p.fill(100, 200, 255);
        p.ellipse(cellX + cellSize / 2, cellY + cellSize / 2, cellSize * 0.6 + pulse);
      }
      
      // Draw icons for explored cells
      if (isExplored) {
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(14);
        switch (cell.type) {
          case "enemy":
            p.fill(255, 200, 200);
            p.text("E", cellX + cellSize / 2, cellY + cellSize / 2);
            break;
          case "treasure":
            const treasurePulse = Math.sin(p.frameCount * 0.1) * 20;
            p.fill(255, 255, 200 - treasurePulse);
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
  
  // Draw particles and floating texts
  drawParticles(p);
  drawFloatingTexts(p);
  
  // Party status
  p.push();
  p.fill(50, 40, 60);
  p.rect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);
  p.fill(200, 200, 220);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Party:", 30, CANVAS_HEIGHT - 85);
  
  for (let i = 0; i < gameState.party.length; i++) {
    const hero = gameState.party[i];
    const barWidth = 180;
    const barX = 30 + i * 220;
    const barY = CANVAS_HEIGHT - 60;
    
    p.fill(150, 150, 170);
    p.text(`${hero.class} Lv${hero.level}`, barX, barY - 20);
    
    // Health bar
    p.fill(80, 60, 60);
    p.rect(barX, barY, barWidth, 16);
    p.fill(hero.health > hero.maxHealth * 0.5 ? 100 : 180, hero.health > hero.maxHealth * 0.5 ? 180 : 80, 80);
    const healthPercent = hero.health / hero.maxHealth;
    p.rect(barX, barY, barWidth * healthPercent, 16);
    
    p.fill(255, 255, 255);
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`${hero.health}/${hero.maxHealth}`, barX + barWidth / 2, barY + 8);
  }
  p.pop();
}

export function drawCombatScreen(p) {
  // Apply screen shake
  p.push();
  if (gameState.shakeEffect.timer > 0) {
    const shakeX = (Math.random() - 0.5) * gameState.shakeEffect.intensity;
    const shakeY = (Math.random() - 0.5) * gameState.shakeEffect.intensity;
    p.translate(shakeX, shakeY);
    gameState.shakeEffect.timer--;
    if (gameState.shakeEffect.timer <= 0) {
      gameState.shakeEffect.intensity = 0;
    }
  }
  
  p.background(30, 20, 25);
  
  // Header
  p.push();
  p.fill(60, 40, 50);
  p.rect(0, 0, CANVAS_WIDTH, 50);
  p.fill(255, 150, 150);
  p.textSize(24);
  p.textAlign(p.CENTER, p.TOP);
  p.text("COMBAT", CANVAS_WIDTH / 2, 13);
  p.pop();
  
  // Turn indicator with animated background
  p.push();
  const turnBarY = 55;
  const turnBarHeight = 35;
  
  if (gameState.combatPhase === COMBAT_PHASES.PLAYER_TURN) {
    const pulse = Math.sin(p.frameCount * 0.15) * 10;
    p.fill(50 + pulse, 100 + pulse, 150 + pulse, 200);
    p.rect(0, turnBarY, CANVAS_WIDTH, turnBarHeight);
    p.fill(150 + pulse, 200 + pulse, 255);
    p.textSize(18);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`TURN ${gameState.turnNumber} - YOUR TURN`, CANVAS_WIDTH / 2, turnBarY + turnBarHeight / 2);
    
    // Show which heroes have acted
    const actedText = `Heroes Acted: ${gameState.heroesActedThisTurn.length}/${gameState.party.filter(h => h.health > 0).length}`;
    p.textSize(12);
    p.fill(180, 220, 255);
    p.text(actedText, CANVAS_WIDTH / 2, turnBarY + turnBarHeight / 2 + 18);
  } else if (gameState.combatPhase === COMBAT_PHASES.ENEMY_TURN) {
    const pulse = Math.sin(p.frameCount * 0.15) * 10;
    p.fill(150 + pulse, 50 + pulse, 50 + pulse, 200);
    p.rect(0, turnBarY, CANVAS_WIDTH, turnBarHeight);
    p.fill(255, 150 + pulse, 150 + pulse);
    p.textSize(18);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`TURN ${gameState.turnNumber} - ENEMY TURN`, CANVAS_WIDTH / 2, turnBarY + turnBarHeight / 2);
  } else {
    p.fill(100, 100, 100, 200);
    p.rect(0, turnBarY, CANVAS_WIDTH, turnBarHeight);
    p.fill(200, 200, 200);
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("Processing...", CANVAS_WIDTH / 2, turnBarY + turnBarHeight / 2);
  }
  p.pop();
  
  // Draw enemies
  const enemyY = 140;
  const enemySpacing = CANVAS_WIDTH / (gameState.enemies.length + 1);
  
  for (let i = 0; i < gameState.enemies.length; i++) {
    const enemy = gameState.enemies[i];
    const x = enemySpacing * (i + 1);
    
    // Check for flash effect
    const flash = gameState.flashEffects.find(f => f.target === `enemy_${i}`);
    const flashAmount = flash ? (flash.timer / 15) * 100 : 0;
    
    if (enemy.health > 0) {
      // Enemy body with glow effect
      p.push();
      
      // Glow layer
      if (flashAmount > 0) {
        p.fill(255, 255, 255, flashAmount);
        p.ellipse(x, enemyY, 70 + flashAmount/5, 85 + flashAmount/5);
      }
      
      p.fill(180 + flashAmount, 60 + flashAmount, 60 + flashAmount);
      p.ellipse(x, enemyY, 60, 75);
      p.fill(200 + flashAmount, 80 + flashAmount, 80 + flashAmount);
      p.ellipse(x, enemyY - 12, 42);
      
      // Eyes
      p.fill(255, 50, 50);
      p.ellipse(x - 10, enemyY - 18, 10);
      p.ellipse(x + 10, enemyY - 18, 10);
      p.pop();
      
      // Name and health bar
      p.push();
      p.fill(200, 200, 220);
      p.textSize(14);
      p.textAlign(p.CENTER, p.TOP);
      p.text(enemy.name, x, enemyY + 50);
      
      const barWidth = 80;
      p.fill(80, 40, 40);
      p.rect(x - barWidth / 2, enemyY + 70, barWidth, 12, 2);
      p.fill(180, 80, 80);
      const healthPercent = enemy.health / enemy.maxHealth;
      p.rect(x - barWidth / 2, enemyY + 70, barWidth * healthPercent, 12, 2);
      
      // Health text
      p.fill(255, 255, 255);
      p.textSize(10);
      p.text(`${Math.ceil(enemy.health)}/${Math.ceil(enemy.maxHealth)}`, x, enemyY + 86);
      p.pop();
    } else {
      // Dead enemy with fade effect
      p.push();
      p.fill(100, 60, 60, 150);
      p.textSize(30);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("💀", x, enemyY);
      p.fill(150, 100, 100);
      p.textSize(14);
      p.text("Defeated", x, enemyY + 40);
      p.pop();
    }
  }
  
  // Draw party
  const partyY = 340;
  const partySpacing = CANVAS_WIDTH / (gameState.party.length + 1);
  
  for (let i = 0; i < gameState.party.length; i++) {
    const hero = gameState.party[i];
    const x = partySpacing * (i + 1);
    const isSelected = gameState.selectedPartyMember === i;
    const hasActed = gameState.heroesActedThisTurn.includes(i);
    
    // Check for flash effect
    const flash = gameState.flashEffects.find(f => f.target === `hero_${i}`);
    const flashAmount = flash ? (flash.timer / 15) * 100 : 0;
    
    if (hero.health > 0) {
      // Hero body
      p.push();
      
      // Glow effect for flash
      if (flashAmount > 0) {
        p.fill(255, 255, 255, flashAmount);
        p.ellipse(x, partyY, 60 + flashAmount/5, 72 + flashAmount/5);
      }
      
      const heroColor = isSelected ? [100 + flashAmount, 200 + flashAmount, 255] : [80 + flashAmount, 150 + flashAmount, 200 + flashAmount];
      
      // Dimmed if already acted
      if (hasActed) {
        heroColor[0] *= 0.5;
        heroColor[1] *= 0.5;
        heroColor[2] *= 0.5;
      }
      
      p.fill(...heroColor);
      p.ellipse(x, partyY, 50, 62);
      p.fill(heroColor[0] + 20, heroColor[1] + 20, heroColor[2] + 20);
      p.ellipse(x, partyY - 10, 35);
      
      // Class indicator
      p.fill(255, 255, 255);
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(hero.class[0], x, partyY - 10);
      p.pop();
      
      // Selection indicator with pulse
      if (isSelected && !hasActed) {
        p.push();
        p.noFill();
        const pulse = Math.sin(p.frameCount * 0.2) * 5;
        p.stroke(255, 220, 100);
        p.strokeWeight(3);
        p.ellipse(x, partyY, 68 + pulse, 80 + pulse);
        p.pop();
      }
      
      // "Acted" indicator
      if (hasActed) {
        p.push();
        p.fill(100, 255, 100, 150);
        p.textSize(10);
        p.textAlign(p.CENTER, p.TOP);
        p.text("✓ ACTED", x, partyY - 45);
        p.pop();
      }
      
      // Name and health bar
      p.push();
      p.fill(200, 200, 220);
      p.textSize(12);
      p.textAlign(p.CENTER, p.TOP);
      p.text(hero.class, x, partyY + 40);
      
      const barWidth = 65;
      p.fill(60, 80, 60);
      p.rect(x - barWidth / 2, partyY + 58, barWidth, 12, 2);
      p.fill(100, 180, 100);
      const healthPercent = hero.health / hero.maxHealth;
      p.rect(x - barWidth / 2, partyY + 58, barWidth * healthPercent, 12, 2);
      
      // Health text
      p.fill(255, 255, 255);
      p.textSize(9);
      p.text(`${hero.health}/${hero.maxHealth}`, x, partyY + 73);
      
      // Ability cooldown with visual indicator
      if (hero.currentCooldown > 0) {
        p.fill(150, 150, 170);
        p.textSize(9);
        p.text(`CD: ${hero.currentCooldown}`, x, partyY + 85);
      } else {
        const readyPulse = Math.sin(p.frameCount * 0.15) * 50 + 205;
        p.fill(150, readyPulse, 150);
        p.textSize(9);
        p.text("READY", x, partyY + 85);
      }
      p.pop();
    } else {
      // Dead hero
      p.push();
      p.fill(100, 100, 120, 150);
      p.textSize(24);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("💀", x, partyY);
      p.fill(120, 120, 140);
      p.textSize(12);
      p.text("KO", x, partyY + 30);
      p.pop();
    }
  }
  
  // Draw particles and floating texts
  drawParticles(p);
  drawFloatingTextsForCombat(p);
  
  // Combat log with scrolling effect and better styling
  p.push();
  p.fill(40, 30, 40, 240);
  p.rect(20, CANVAS_HEIGHT - 110, CANVAS_WIDTH - 40, 100, 5);
  
  // Log title
  p.fill(200, 200, 220);
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Combat Log:", 30, CANVAS_HEIGHT - 105);
  
  p.textSize(12);
  const logStart = Math.max(0, gameState.combatLog.length - 5);
  for (let i = logStart; i < gameState.combatLog.length; i++) {
    const alpha = i === gameState.combatLog.length - 1 ? 255 : 180;
    const isImportant = gameState.combatLog[i].includes("Turn") || 
                        gameState.combatLog[i].includes("Victory") ||
                        gameState.combatLog[i].includes("defeated");
    
    if (isImportant) {
      p.fill(255, 220, 150, alpha);
    } else {
      p.fill(200, 200, 220, alpha);
    }
    p.text(gameState.combatLog[i], 30, CANVAS_HEIGHT - 88 + (i - logStart) * 17);
  }
  p.pop();
  
  // Controls hint
  p.push();
  p.fill(150, 150, 170);
  p.textSize(11);
  p.textAlign(p.CENTER, p.BOTTOM);
  
  if (gameState.combatPhase === COMBAT_PHASES.PLAYER_TURN) {
    const selectedHero = gameState.party[gameState.selectedPartyMember];
    const hasActed = gameState.heroesActedThisTurn.includes(gameState.selectedPartyMember);
    
    if (hasActed) {
      p.fill(200, 200, 100);
      p.text("This hero has already acted. Select another hero with Arrow Keys.", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 15);
    } else if (selectedHero && selectedHero.health > 0) {
      p.text("Space: Attack | Z: Use Ability | ←→: Switch Hero", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 15);
    }
  } else if (gameState.combatPhase === COMBAT_PHASES.ENEMY_TURN) {
    p.fill(255, 150, 150);
    p.text("Enemy Turn - Watch out!", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 15);
  }
  p.pop();
  
  p.pop(); // End screen shake transform
}

function drawParticles(p) {
  p.push();
  for (const particle of gameState.particles) {
    const alpha = (particle.timer / 60) * 255;
    p.fill(...particle.color, alpha);
    p.noStroke();
    p.ellipse(particle.x, particle.y, particle.size);
  }
  p.pop();
}

function drawFloatingTexts(p) {
  p.push();
  for (const text of gameState.floatingTexts) {
    const alpha = (text.timer / 60) * 255;
    p.fill(...text.color, alpha);
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(text.text, text.x, text.y);
  }
  p.pop();
}

function drawFloatingTextsForCombat(p) {
  p.push();
  for (const text of gameState.floatingTexts) {
    const alpha = (text.timer / 60) * 255;
    
    // Position text based on game state in combat
    let displayX = text.x;
    let displayY = text.y;
    
    // If text position is 0,0, calculate position based on last action
    if (text.x === 0 && text.y === 0) {
      const partySpacing = CANVAS_WIDTH / (gameState.party.length + 1);
      const enemySpacing = CANVAS_WIDTH / (gameState.enemies.length + 1);
      
      // Position near selected hero/enemy
      if (text.text.includes('+')) {
        // Healing text - position near hero
        displayX = partySpacing * (gameState.selectedPartyMember + 1);
        displayY = 340 - 40 - (60 - text.timer);
      } else {
        // Damage text - position near enemies
        displayX = enemySpacing * 1.5;
        displayY = 140 - 30 - (60 - text.timer);
      }
    } else {
      displayX = text.x;
      displayY = text.y;
    }
    
    p.fill(...text.color, alpha);
    p.textSize(20);
    p.textAlign(p.CENTER, p.CENTER);
    p.strokeWeight(3);
    p.stroke(0, 0, 0, alpha);
    p.text(text.text, displayX, displayY);
    p.noStroke();
  }
  p.pop();
}

export function drawPauseOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.textSize(18);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  p.pop();
}

export function drawGameOverScreen(p, isWin) {
  p.push();
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (isWin) {
    p.fill(150, 255, 150);
    p.textSize(56);
    p.text("VICTORY!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);
    
    p.fill(255, 255, 200);
    p.textSize(28);
    p.text("Arena Unlocked!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  } else {
    p.fill(255, 150, 150);
    p.textSize(56);
    p.text("DEFEAT", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  }
  
  p.fill(200, 200, 220);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  p.text(`Zone Reached: ${gameState.currentZone}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
  
  p.fill(255, 220, 100);
  p.textSize(22);
  const pulseAlpha = 150 + Math.sin(p.frameCount * 0.1) * 105;
  p.fill(255, 220, 100, pulseAlpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 130);
  p.pop();
}