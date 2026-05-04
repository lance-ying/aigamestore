// render.js - Rendering functions

import { gameState, GAME_PHASES, BATTLE_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.fill(255, 220, 100);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("STEAMWORLD QUEST", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(150, 180, 220);
  p.textSize(16);
  p.text("A Card-Based Battle Adventure", CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.fill(200, 210, 230);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "OBJECTIVE:",
    "  Defeat all enemies in 3 battles to win!",
    "",
    "HOW TO PLAY:",
    "  • Select up to 3 cards per turn using Arrow Keys",
    "  • Press SPACE to play selected cards",
    "  • Manage your Steam energy wisely",
    "  • Cards cost Steam points shown on each card",
    "  • Attack enemies, defend your heroes, use specials",
    "",
    "CONTROLS:",
    "  Arrow Keys: Navigate cards",
    "  SPACE: Confirm/Play cards",
    "  Z: Cancel selection",
    "  SHIFT (hold): View deck stats",
    "  ESC: Pause game",
    "  R: Restart"
  ];
  
  let y = 160;
  instructions.forEach(line => {
    if (line.startsWith("OBJECTIVE:") || line.startsWith("HOW TO PLAY:") || line.startsWith("CONTROLS:")) {
      p.fill(255, 220, 100);
      p.textSize(16);
    } else if (line.startsWith("  •") || line.startsWith("  Arrow") || line.startsWith("  SPACE") || 
               line.startsWith("  Z:") || line.startsWith("  SHIFT") || line.startsWith("  ESC:") || line.startsWith("  R:")) {
      p.fill(180, 200, 220);
      p.textSize(13);
    } else {
      p.fill(200, 210, 230);
      p.textSize(13);
    }
    p.text(line, 50, y);
    y += line === "" ? 8 : 18;
  });
  
  // Press Enter prompt
  p.fill(100, 255, 100);
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  const pulse = 0.5 + 0.5 * Math.sin(p.frameCount * 0.1);
  p.fill(100 + pulse * 155, 255, 100 + pulse * 155);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

export function renderGameScreen(p) {
  p.background(30, 40, 60);
  
  // Render battlefield
  renderBattlefield(p);
  
  // Render entities
  renderHeroes(p);
  renderEnemies(p);
  
  // Render UI
  renderUI(p);
  
  // Render hand
  renderHand(p);
  
  // Render animations
  renderAnimations(p);
  
  // Render pause indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 255, 200);
    p.textSize(16);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
  
  // Render shift info
  if (p.keyIsDown(16)) {
    renderDeckInfo(p);
  }
}

export function renderBattlefield(p) {
  // Ground
  p.fill(40, 50, 70);
  p.rect(0, 200, CANVAS_WIDTH, CANVAS_HEIGHT - 200);
  
  // Grid lines
  p.stroke(50, 60, 80);
  p.strokeWeight(1);
  for (let i = 0; i < CANVAS_WIDTH; i += 40) {
    p.line(i, 200, i, CANVAS_HEIGHT);
  }
  for (let i = 200; i < CANVAS_HEIGHT; i += 40) {
    p.line(0, i, CANVAS_WIDTH, i);
  }
  p.noStroke();
}

export function renderHeroes(p) {
  gameState.heroes.forEach(hero => {
    p.push();
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.ellipse(hero.x, hero.y + 25, 30, 10);
    
    // Body
    if (hero.isDead()) {
      p.fill(60, 60, 60);
    } else {
      p.fill(80, 120, 200);
    }
    p.rect(hero.x - 15, hero.y - 20, 30, 35, 5);
    
    // Head
    if (!hero.isDead()) {
      p.fill(100, 140, 220);
    }
    p.ellipse(hero.x, hero.y - 28, 20, 20);
    
    // Shield effect
    if (hero.shield > 0) {
      p.noFill();
      p.stroke(100, 150, 255, 150);
      p.strokeWeight(3);
      p.ellipse(hero.x, hero.y, 50, 60);
      p.noStroke();
    }
    
    // HP Bar
    const barWidth = 40;
    const barHeight = 5;
    const hpPercent = hero.hp / hero.maxHp;
    
    p.fill(100, 0, 0);
    p.rect(hero.x - barWidth / 2, hero.y + 20, barWidth, barHeight);
    p.fill(0, 255, 0);
    p.rect(hero.x - barWidth / 2, hero.y + 20, barWidth * hpPercent, barHeight);
    
    // HP text
    p.fill(255);
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`${hero.hp}/${hero.maxHp}`, hero.x, hero.y + 32);
    
    // Shield text
    if (hero.shield > 0) {
      p.fill(100, 150, 255);
      p.textSize(11);
      p.text(`${hero.shield}`, hero.x, hero.y + 42);
    }
    
    // Name
    p.fill(200, 220, 255);
    p.textSize(11);
    p.text(hero.name, hero.x, hero.y - 45);
    
    // Status effects
    let statusY = hero.y - 55;
    if (hero.statusEffects.POWER_UP) {
      p.fill(255, 200, 0);
      p.textSize(9);
      p.text("PWR+" + hero.statusEffects.POWER_UP.value, hero.x, statusY);
      statusY -= 10;
    }
    
    p.pop();
  });
}

export function renderEnemies(p) {
  gameState.enemies.forEach(enemy => {
    if (enemy.isDead()) return;
    
    p.push();
    
    // Shadow
    p.fill(0, 0, 0, 50);
    p.ellipse(enemy.x, enemy.y + 25, 30, 10);
    
    // Body
    p.fill(200, 80, 80);
    p.rect(enemy.x - 15, enemy.y - 20, 30, 35, 5);
    
    // Head
    p.fill(220, 100, 100);
    p.rect(enemy.x - 10, enemy.y - 30, 20, 15, 3);
    
    // Eyes
    p.fill(255, 0, 0);
    p.ellipse(enemy.x - 5, enemy.y - 25, 4, 4);
    p.ellipse(enemy.x + 5, enemy.y - 25, 4, 4);
    
    // Shield effect
    if (enemy.shield > 0) {
      p.noFill();
      p.stroke(200, 100, 100, 150);
      p.strokeWeight(3);
      p.ellipse(enemy.x, enemy.y, 50, 60);
      p.noStroke();
    }
    
    // HP Bar
    const barWidth = 40;
    const barHeight = 5;
    const hpPercent = enemy.hp / enemy.maxHp;
    
    p.fill(100, 0, 0);
    p.rect(enemy.x - barWidth / 2, enemy.y + 20, barWidth, barHeight);
    p.fill(255, 0, 0);
    p.rect(enemy.x - barWidth / 2, enemy.y + 20, barWidth * hpPercent, barHeight);
    
    // HP text
    p.fill(255);
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`${enemy.hp}/${enemy.maxHp}`, enemy.x, enemy.y + 32);
    
    // Shield text
    if (enemy.shield > 0) {
      p.fill(200, 100, 100);
      p.textSize(11);
      p.text(`${enemy.shield}`, enemy.x, enemy.y + 42);
    }
    
    // Name
    p.fill(255, 200, 200);
    p.textSize(11);
    p.text(enemy.name, enemy.x, enemy.y - 45);
    
    // Next action indicator
    if (enemy.nextAction) {
      p.fill(255, 150, 0);
      p.textSize(9);
      p.text(`⚔ ${enemy.attack}`, enemy.x, enemy.y - 55);
    }
    
    // Status effects
    if (enemy.statusEffects.WEAK) {
      p.fill(150, 150, 255);
      p.textSize(9);
      p.text("WEAK", enemy.x, enemy.y - 65);
    }
    
    p.pop();
  });
}

export function renderUI(p) {
  // Top bar
  p.fill(20, 25, 40, 200);
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  // Steam energy
  p.fill(255, 200, 100);
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`STEAM: ${gameState.currentSteam}/${gameState.maxSteam}`, 10, 18);
  
  // Steam orbs
  for (let i = 0; i < gameState.maxSteam; i++) {
    const filled = i < gameState.currentSteam;
    p.fill(filled ? 255 : 100, filled ? 200 : 100, filled ? 0 : 50);
    p.ellipse(140 + i * 25, 18, 15, 15);
  }
  
  // Turn number
  p.fill(200, 220, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`Turn ${gameState.turnNumber}`, CANVAS_WIDTH / 2, 18);
  
  // Battle and score
  p.textAlign(p.RIGHT, p.CENTER);
  p.fill(255, 220, 100);
  p.text(`Battle ${gameState.battleNumber}/3`, CANVAS_WIDTH - 120, 10);
  p.fill(200, 220, 255);
  p.text(`Gold: ${gameState.gold}`, CANVAS_WIDTH - 10, 10);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 25);
}

export function renderHand(p) {
  const cardWidth = 70;
  const cardHeight = 90;
  const cardSpacing = 5;
  const handY = CANVAS_HEIGHT - cardHeight - 10;
  const totalWidth = gameState.hand.length * (cardWidth + cardSpacing) - cardSpacing;
  const startX = (CANVAS_WIDTH - totalWidth) / 2;
  
  gameState.hand.forEach((card, index) => {
    const x = startX + index * (cardWidth + cardSpacing);
    const y = handY;
    const isSelected = gameState.selectedCards.includes(index);
    const isHovered = gameState.hoveredCardIndex === index;
    
    renderCard(p, card, x, y, cardWidth, cardHeight, isSelected, isHovered);
  });
  
  // Instructions
  if (gameState.battlePhase === BATTLE_PHASES.PLAYER_SELECT) {
    p.fill(200, 220, 255);
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("Arrow Keys: Select | SPACE: Play | Z: Cancel", CANVAS_WIDTH / 2, CANVAS_HEIGHT - cardHeight - 20);
  }
}

export function renderCard(p, card, x, y, w, h, isSelected, isHovered) {
  p.push();
  
  // Elevation for selected
  const yOffset = isSelected ? -10 : 0;
  
  // Card background
  p.fill(isSelected ? 255 : (isHovered ? 220 : 200), isSelected ? 240 : (isHovered ? 200 : 180), 150);
  p.stroke(isSelected ? 255 : 100, isSelected ? 220 : 80, isSelected ? 0 : 50);
  p.strokeWeight(isSelected ? 3 : 2);
  p.rect(x, y + yOffset, w, h, 5);
  
  // Card type color
  let typeColor;
  if (card.type === "ATTACK") typeColor = [255, 100, 100];
  else if (card.type === "DEFEND") typeColor = [100, 150, 255];
  else typeColor = [200, 100, 255];
  
  p.fill(...typeColor);
  p.noStroke();
  p.rect(x + 2, y + yOffset + 2, w - 4, 20, 3);
  
  // Card name
  p.fill(255);
  p.textSize(10);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(card.name, x + w / 2, y + yOffset + 12);
  
  // Card cost
  p.fill(255, 200, 0);
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(card.cost, x + w - 15, y + yOffset + 35);
  
  // Card effect
  p.fill(50);
  p.textSize(9);
  p.textAlign(p.CENTER, p.CENTER);
  const lines = wrapText(card.description, 60);
  lines.forEach((line, i) => {
    p.text(line, x + w / 2, y + yOffset + 55 + i * 10);
  });
  
  p.pop();
}

function wrapText(text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    if ((currentLine + word).length <= maxWidth / 5) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  
  if (currentLine) lines.push(currentLine);
  return lines;
}

export function renderDeckInfo(p) {
  p.fill(20, 30, 50, 230);
  p.rect(50, 50, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 100, 10);
  
  p.fill(255, 220, 100);
  p.textSize(18);
  p.textAlign(p.CENTER, p.TOP);
  p.text("DECK INFO", CANVAS_WIDTH / 2, 60);
  
  p.fill(200, 220, 255);
  p.textSize(13);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Cards in Deck: ${gameState.deck.length}`, 70, 90);
  p.text(`Cards in Hand: ${gameState.hand.length}`, 70, 110);
  p.text(`Cards in Discard: ${gameState.discardPile.length}`, 70, 130);
  p.text(`Experience: ${gameState.experience}`, 70, 160);
  
  // Hero stats
  p.fill(255, 220, 100);
  p.textSize(14);
  p.text("HEROES:", 70, 190);
  
  gameState.heroes.forEach((hero, i) => {
    p.fill(200, 220, 255);
    p.textSize(12);
    p.text(`${hero.name} - Lv${hero.level}`, 90, 210 + i * 40);
    p.textSize(11);
    p.text(`HP: ${hero.hp}/${hero.maxHp}`, 90, 225 + i * 40);
    p.text(`Attack: ${hero.baseAttack}`, 90, 240 + i * 40);
  });
}

export function renderAnimations(p) {
  gameState.animations.forEach(anim => {
    anim.render(p);
  });
}

export function renderGameOver(p) {
  p.background(20, 30, 50);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? 100 : 255, isWin ? 255 : 100, 100);
  p.textSize(56);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(isWin ? "VICTORY!" : "DEFEATED", CANVAS_WIDTH / 2, 100);
  
  // Stats
  p.fill(200, 220, 255);
  p.textSize(18);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.text(`Gold Earned: ${gameState.gold}`, CANVAS_WIDTH / 2, 210);
  p.text(`Battles Completed: ${gameState.battleNumber - 1}`, CANVAS_WIDTH / 2, 240);
  
  if (isWin) {
    p.fill(255, 220, 100);
    p.textSize(16);
    p.text("You defeated all enemies and saved SteamWorld!", CANVAS_WIDTH / 2, 280);
  } else {
    p.fill(255, 180, 180);
    p.textSize(16);
    p.text("Your heroes have fallen in battle...", CANVAS_WIDTH / 2, 280);
  }
  
  // Restart prompt
  p.fill(100, 255, 100);
  p.textSize(20);
  const pulse = 0.5 + 0.5 * Math.sin(p.frameCount * 0.1);
  p.fill(100 + pulse * 155, 255, 100 + pulse * 155);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
}