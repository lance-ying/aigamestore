// render.js - Rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, HERO_CLASSES } from './globals.js';

export function renderGame(p) {
  p.background(20, 15, 25);

  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PARTY_SELECT) {
    renderPartySelectScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderPlaying(p);
  } else if (gameState.gamePhase === GAME_PHASES.COMBAT) {
    renderCombat(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderPlaying(p);
    renderPaused(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    renderGameOver(p, true);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOver(p, false);
  }
}

function renderStartScreen(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("DUNGEON SURVIVAL", CANVAS_WIDTH / 2, 80);
  
  p.textSize(14);
  p.fill(200);
  const instructions = [
    "Assemble a party of heroes and venture into the dungeons",
    "Navigate using ARROW KEYS, fight monsters, collect loot",
    "Reach level 5 and defeat the final boss to win!",
    "",
    "Combat: SPACE (attack), SHIFT (skills), Z (back)",
    "",
    "PRESS ENTER TO BEGIN"
  ];
  
  for (let i = 0; i < instructions.length; i++) {
    p.text(instructions[i], CANVAS_WIDTH / 2, 180 + i * 25);
  }
}

function renderPartySelectScreen(p) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text("SELECT YOUR PARTY", CANVAS_WIDTH / 2, 30);
  
  p.textSize(12);
  p.fill(200);
  p.text("Arrow Keys to navigate | SPACE to add hero | ENTER to start", CANVAS_WIDTH / 2, 60);
  
  // Display available classes
  const classNames = Object.keys(HERO_CLASSES);
  const startX = 50;
  const startY = 100;
  
  for (let i = 0; i < classNames.length; i++) {
    const className = classNames[i];
    const classData = HERO_CLASSES[className];
    const x = startX + (i % 3) * 180;
    const y = startY + Math.floor(i / 3) * 80;
    
    const isSelected = (i === gameState.selectedHeroClass);
    
    p.fill(...(isSelected ? [255, 255, 150] : [150]));
    p.noStroke();
    p.rect(x - 5, y - 5, 170, 70, 5);
    
    p.fill(...classData.color);
    p.ellipse(x + 20, y + 25, 30, 30);
    
    p.fill(isSelected ? 0 : 255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.text(classData.name, x + 40, y + 5);
    
    p.textSize(10);
    p.text(`HP:${classData.hp} ATK:${classData.atk}`, x + 40, y + 25);
    p.text(`DEF:${classData.def} SPD:${classData.spd}`, x + 40, y + 40);
  }
  
  // Display current party
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text(`Current Party (${gameState.partySize}/${gameState.maxPartySize})`, CANVAS_WIDTH / 2, 320);
  
  for (let i = 0; i < gameState.maxPartySize; i++) {
    const x = 150 + i * 80;
    const y = 350;
    
    const isSelected = (i === gameState.selectedPartySlot);
    
    p.fill(...(isSelected ? [255, 255, 150] : [80]));
    p.rect(x - 25, y - 25, 50, 50, 5);
    
    if (i < gameState.party.length) {
      const hero = gameState.party[i];
      p.fill(...hero.color);
      p.ellipse(x, y, 40, 40);
      
      p.fill(255);
      p.textSize(10);
      p.text(hero.name.substring(0, 3), x, y + 30);
    }
  }
}

function renderPlaying(p) {
  if (!gameState.dungeon || !gameState.player) return;
  
  const dungeon = gameState.dungeon;
  const viewWidth = Math.floor(CANVAS_WIDTH / TILE_SIZE);
  const viewHeight = Math.floor((CANVAS_HEIGHT - 60) / TILE_SIZE);
  
  // Center camera on player
  gameState.cameraX = gameState.player.x - Math.floor(viewWidth / 2);
  gameState.cameraY = gameState.player.y - Math.floor(viewHeight / 2);
  
  // Render dungeon
  for (let y = 0; y < viewHeight; y++) {
    for (let x = 0; x < viewWidth; x++) {
      const worldX = x + gameState.cameraX;
      const worldY = y + gameState.cameraY;
      const tile = dungeon.getTile(worldX, worldY);
      
      if (!tile || !tile.explored) {
        p.fill(0);
      } else {
        if (tile.type === "wall") {
          p.fill(60, 50, 70);
        } else if (tile.type === "floor") {
          p.fill(40, 35, 45);
        } else if (tile.type === "start") {
          p.fill(50, 100, 50);
        } else if (tile.type === "stairs") {
          p.fill(100, 100, 200);
        } else if (tile.type === "chest") {
          p.fill(tile.opened ? 80 : 180, 140, 50);
        }
      }
      
      p.noStroke();
      p.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      
      // Render enemies
      if (tile && tile.explored) {
        const enemy = dungeon.getEnemyAt(worldX, worldY);
        if (enemy && enemy.alive) {
          p.fill(...enemy.color);
          p.ellipse(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE * 0.8, TILE_SIZE * 0.8);
          
          if (enemy.isBoss) {
            p.fill(255, 0, 255);
            p.textSize(8);
            p.textAlign(p.CENTER, p.CENTER);
            p.text("BOSS", x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2);
          }
        }
      }
    }
  }
  
  // Render player
  const playerScreenX = (gameState.player.x - gameState.cameraX) * TILE_SIZE;
  const playerScreenY = (gameState.player.y - gameState.cameraY) * TILE_SIZE;
  
  p.fill(...gameState.player.color);
  p.ellipse(playerScreenX + TILE_SIZE / 2, playerScreenY + TILE_SIZE / 2, TILE_SIZE * 0.9, TILE_SIZE * 0.9);
  
  // Draw white border around player
  p.noFill();
  p.stroke(255);
  p.strokeWeight(2);
  p.ellipse(playerScreenX + TILE_SIZE / 2, playerScreenY + TILE_SIZE / 2, TILE_SIZE * 0.9, TILE_SIZE * 0.9);
  p.noStroke();
  
  // Render UI
  renderUI(p);
}

function renderUI(p) {
  // Top bar
  p.fill(20, 15, 25, 200);
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(14);
  p.text(`Level: ${gameState.dungeonLevel}`, 10, 15);
  p.text(`Gold: ${gameState.score}`, 10, 35);
  
  // Party status
  const startX = 200;
  for (let i = 0; i < gameState.party.length; i++) {
    const hero = gameState.party[i];
    const x = startX + i * 100;
    
    p.fill(...hero.color);
    p.ellipse(x, 25, 30, 30);
    
    p.fill(255);
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(hero.name.substring(0, 3), x, 45);
    
    // HP bar
    const barWidth = 60;
    const barHeight = 6;
    const hpPercent = hero.hp / hero.maxHp;
    
    p.fill(100, 0, 0);
    p.rect(x - barWidth / 2, 12, barWidth, barHeight);
    
    p.fill(0, 200, 0);
    p.rect(x - barWidth / 2, 12, barWidth * hpPercent, barHeight);
    
    p.fill(255);
    p.textSize(8);
    p.text(`${hero.hp}/${hero.maxHp}`, x, 8);
  }
}

function renderCombat(p) {
  if (!gameState.combat) return;
  
  const combat = gameState.combat;
  
  p.background(30, 20, 40);
  
  // Title
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("COMBAT", CANVAS_WIDTH / 2, 20);
  
  // Render enemies
  const enemyStartX = 400;
  const enemyStartY = 100;
  for (let i = 0; i < combat.enemies.length; i++) {
    const enemy = combat.enemies[i];
    if (!enemy.alive) continue;
    
    const x = enemyStartX;
    const y = enemyStartY + i * 60;
    
    const isTargeted = (combat.menuState === "target" && i === combat.selectedTargetIndex);
    
    if (isTargeted) {
      p.fill(255, 255, 0, 100);
      p.ellipse(x, y, 60, 60);
    }
    
    p.fill(...enemy.color);
    p.ellipse(x, y, 50, 50);
    
    p.fill(255);
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(enemy.name, x, y - 35);
    
    // HP bar
    const barWidth = 80;
    const barHeight = 8;
    const hpPercent = enemy.hp / enemy.maxHp;
    
    p.fill(100, 0, 0);
    p.rect(x - barWidth / 2, y + 30, barWidth, barHeight);
    
    p.fill(200, 0, 0);
    p.rect(x - barWidth / 2, y + 30, barWidth * hpPercent, barHeight);
    
    p.fill(255);
    p.textSize(10);
    p.text(`${enemy.hp}/${enemy.maxHp}`, x, y + 45);
  }
  
  // Render heroes
  const heroStartX = 150;
  const heroStartY = 100;
  for (let i = 0; i < combat.heroes.length; i++) {
    const hero = combat.heroes[i];
    if (!hero.alive) continue;
    
    const x = heroStartX;
    const y = heroStartY + i * 60;
    
    const isCurrent = (combat.getCurrentActor() === hero);
    
    if (isCurrent) {
      p.fill(255, 255, 0, 100);
      p.ellipse(x, y, 60, 60);
    }
    
    p.fill(...hero.color);
    p.ellipse(x, y, 50, 50);
    
    p.fill(255);
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(hero.name, x, y - 35);
    
    // HP bar
    const barWidth = 80;
    const barHeight = 8;
    const hpPercent = hero.hp / hero.maxHp;
    
    p.fill(100, 0, 0);
    p.rect(x - barWidth / 2, y + 30, barWidth, barHeight);
    
    p.fill(0, 200, 0);
    p.rect(x - barWidth / 2, y + 30, barWidth * hpPercent, barHeight);
    
    p.fill(255);
    p.textSize(10);
    p.text(`${hero.hp}/${hero.maxHp}`, x, y + 45);
  }
  
  // Combat menu
  if (combat.isHeroTurn() && !combat.actionInProgress) {
    const menuX = 50;
    const menuY = 300;
    
    p.fill(40, 30, 50, 230);
    p.rect(menuX, menuY, 250, 80, 5);
    
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    
    if (combat.menuState === "main") {
      p.text("SPACE: Basic Attack", menuX + 10, menuY + 10);
      p.text("SHIFT: Use Skill", menuX + 10, menuY + 30);
    } else if (combat.menuState === "skills") {
      const hero = combat.getCurrentActor();
      p.text("Select Skill (Z to cancel):", menuX + 10, menuY + 5);
      for (let i = 0; i < hero.skills.length; i++) {
        const skill = hero.skills[i];
        const isSelected = (i === combat.selectedSkillIndex);
        p.fill(...(isSelected ? [255, 255, 0] : [200]));
        p.text(`${i + 1}. ${skill.name}`, menuX + 10, menuY + 25 + i * 18);
      }
    } else if (combat.menuState === "target") {
      p.text("Select Target (Z to cancel)", menuX + 10, menuY + 10);
      p.text("Arrow Keys + SPACE to confirm", menuX + 10, menuY + 30);
    }
  }
  
  // Combat log
  p.fill(40, 30, 50, 230);
  p.rect(320, 300, 260, 80, 5);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(11);
  for (let i = 0; i < combat.combatLog.length; i++) {
    p.text(combat.combatLog[i], 330, 305 + i * 15);
  }
}

function renderPaused(p) {
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function renderGameOver(p, won) {
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text(won ? "VICTORY!" : "DEFEAT", CANVAS_WIDTH / 2, 120);
  
  p.textSize(18);
  p.fill(200);
  if (won) {
    p.text("You have conquered the dungeons of Black Haze!", CANVAS_WIDTH / 2, 180);
  } else {
    p.text("Your party has fallen...", CANVAS_WIDTH / 2, 180);
  }
  
  p.textSize(16);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.text(`Dungeon Level Reached: ${gameState.dungeonLevel}`, CANVAS_WIDTH / 2, 250);
  
  p.textSize(14);
  p.fill(255, 255, 150);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}

export { renderStartScreen, renderPartySelectScreen, renderPlaying, renderCombat, renderPaused, renderGameOver };