// rendering.js - All rendering functions

import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TILE_SIZE,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  SUBPHASE_OVERWORLD,
  SUBPHASE_BATTLE,
  SUBPHASE_DIALOGUE,
  BATTLE_MENU
} from './globals.js';
import { drawTile } from './world.js';
import { SKILLS } from './creo_data.js';

export function renderGame(p, world) {
  p.background(20, 20, 30);
  
  switch (gameState.gamePhase) {
    case PHASE_START:
      renderStartScreen(p);
      break;
    case PHASE_PLAYING:
      if (gameState.subPhase === SUBPHASE_OVERWORLD) {
        renderOverworld(p, world);
      } else if (gameState.subPhase === SUBPHASE_BATTLE) {
        renderBattle(p);
      } else if (gameState.subPhase === SUBPHASE_DIALOGUE) {
        renderOverworld(p, world);
        renderDialogue(p);
      }
      break;
    case PHASE_PAUSED:
      renderOverworld(p, world);
      renderPauseOverlay(p);
      break;
    case PHASE_GAME_OVER_WIN:
    case PHASE_GAME_OVER_LOSE:
      renderGameOver(p);
      break;
  }
}

function renderStartScreen(p) {
  p.background(20, 40, 60);
  
  // Title
  p.fill(255, 200, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("CREO ADVENTURE", CANVAS_WIDTH / 2, 80);
  
  // Decorative Creo
  p.push();
  p.translate(CANVAS_WIDTH / 2 - 100, 140);
  drawCreoIcon(p, [255, 100, 50], 40);
  p.pop();
  
  p.push();
  p.translate(CANVAS_WIDTH / 2 + 100, 140);
  drawCreoIcon(p, [50, 150, 255], 40);
  p.pop();
  
  // Instructions
  p.fill(220);
  p.textSize(14);
  p.textAlign(p.LEFT);
  
  const instructions = [
    "OBJECTIVE:",
    "• Capture and train powerful Creo creatures",
    "• Battle trainers and complete story missions",
    "• Defeat the legendary Infernox to win",
    "",
    "CONTROLS:",
    "• Arrow Keys: Move / Navigate menus",
    "• Z: Interact / Confirm",
    "• Space: Cancel / Back",
    "• ESC: Pause",
    "",
    "TIPS:",
    "• Weaken wild Creo before capturing",
    "• Use type advantages in battle",
    "• Visit healers to restore your team"
  ];
  
  let y = 210;
  for (let line of instructions) {
    p.text(line, 80, y);
    y += 18;
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER);
  p.textSize(20);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 380);
  }
}

function renderOverworld(p, world) {
  p.background(50, 120, 80);
  
  const player = gameState.player;
  if (!player) return;
  
  // Calculate camera position (center on player)
  gameState.cameraX = player.x - CANVAS_WIDTH / 2;
  gameState.cameraY = player.y - CANVAS_HEIGHT / 2;
  
  // Clamp camera to world bounds
  gameState.cameraX = Math.max(0, Math.min(gameState.cameraX, world.width - CANVAS_WIDTH));
  gameState.cameraY = Math.max(0, Math.min(gameState.cameraY, world.height - CANVAS_HEIGHT));
  
  p.push();
  p.translate(-gameState.cameraX, -gameState.cameraY);
  
  // Draw tiles
  const startCol = Math.floor(gameState.cameraX / TILE_SIZE);
  const endCol = Math.ceil((gameState.cameraX + CANVAS_WIDTH) / TILE_SIZE);
  const startRow = Math.floor(gameState.cameraY / TILE_SIZE);
  const endRow = Math.ceil((gameState.cameraY + CANVAS_HEIGHT) / TILE_SIZE);
  
  for (let row = startRow; row <= endRow && row < world.tiles.length; row++) {
    for (let col = startCol; col <= endCol && col < world.tiles[0].length; col++) {
      if (row >= 0 && col >= 0) {
        drawTile(p, world.tiles[row][col], col * TILE_SIZE, row * TILE_SIZE);
      }
    }
  }
  
  // Draw NPCs
  for (let npc of world.npcs) {
    drawNPC(p, npc);
  }
  
  // Draw player
  drawPlayer(p, player);
  
  p.pop();
  
  // UI
  renderOverworldUI(p);
}

function drawPlayer(p, player) {
  p.push();
  p.translate(player.x + player.width / 2, player.y + player.height / 2);
  
  // Body
  p.fill(100, 150, 250);
  p.ellipse(0, 0, player.width * 0.8, player.height * 0.9);
  
  // Head
  p.fill(255, 220, 180);
  p.ellipse(0, -player.height * 0.3, player.width * 0.6, player.height * 0.6);
  
  // Eyes
  p.fill(0);
  const eyeOffset = player.width * 0.15;
  p.ellipse(-eyeOffset, -player.height * 0.35, 3, 3);
  p.ellipse(eyeOffset, -player.height * 0.35, 3, 3);
  
  // Animation wobble when moving
  if (player.moving) {
    const wobble = Math.sin(player.animFrame * 0.5) * 2;
    p.translate(0, wobble);
  }
  
  p.pop();
}

function drawNPC(p, npc) {
  p.push();
  p.translate(npc.x + npc.width / 2, npc.y + npc.height / 2);
  
  let color;
  if (npc.type === "TRAINER") {
    color = npc.defeated ? [100, 100, 100] : [250, 100, 100];
  } else if (npc.type === "HEALER") {
    color = [250, 200, 250];
  } else {
    color = [100, 250, 100];
  }
  
  // Body
  p.fill(...color);
  p.ellipse(0, 0, npc.width * 0.8, npc.height * 0.9);
  
  // Head
  p.fill(255, 220, 180);
  p.ellipse(0, -npc.height * 0.3, npc.width * 0.6, npc.height * 0.6);
  
  // Indicator
  if (npc.canInteract() && !npc.interacted) {
    p.fill(255, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text("!", 0, -npc.height);
  }
  
  p.pop();
}

function renderOverworldUI(p) {
  // Team display (top left)
  p.fill(0, 0, 0, 150);
  p.rect(5, 5, 200, 80);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("Your Team:", 10, 10);
  
  let y = 28;
  for (let i = 0; i < Math.min(3, gameState.playerTeam.length); i++) {
    const creo = gameState.playerTeam[i];
    const hpPercent = creo.hp / creo.maxHp;
    
    p.fill(200);
    p.text(`${creo.name} Lv${creo.level}`, 10, y);
    
    // HP bar
    p.fill(50);
    p.rect(110, y, 85, 10);
    p.fill(...(hpPercent > 0.5 ? [100, 255, 100] : hpPercent > 0.25 ? [255, 200, 100] : [255, 100, 100]));
    p.rect(110, y, 85 * hpPercent, 10);
    
    y += 18;
  }
  
  // Stats (top right)
  p.fill(0, 0, 0, 150);
  p.rect(CANVAS_WIDTH - 155, 5, 150, 60);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`Battles: ${gameState.totalBattles}`, CANVAS_WIDTH - 150, 10);
  p.text(`Captured: ${gameState.creosCaptured}`, CANVAS_WIDTH - 150, 25);
  p.text(`Trainers: ${gameState.trainersDefeated}`, CANVAS_WIDTH - 150, 40);
  p.text(`Items: ${gameState.captureItems}`, CANVAS_WIDTH - 150, 55);
}

function renderBattle(p) {
  // Background
  p.background(150, 100, 50);
  
  // Ground
  p.fill(100, 80, 40);
  p.rect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);
  
  // Enemy Creo platform
  p.fill(80, 70, 40);
  p.ellipse(CANVAS_WIDTH * 0.7, CANVAS_HEIGHT * 0.35, 120, 40);
  
  // Player Creo platform
  p.fill(80, 70, 40);
  p.ellipse(CANVAS_WIDTH * 0.3, CANVAS_HEIGHT * 0.65, 120, 40);
  
  // Draw Creo
  if (gameState.enemyCreo) {
    drawBattleCreo(p, gameState.enemyCreo, CANVAS_WIDTH * 0.7, CANVAS_HEIGHT * 0.3, false);
  }
  
  if (gameState.playerCreo) {
    drawBattleCreo(p, gameState.playerCreo, CANVAS_WIDTH * 0.3, CANVAS_HEIGHT * 0.6, true);
  }
  
  // Battle animations
  if (gameState.battleAnimation) {
    drawBattleAnimation(p);
  }
  
  // Battle UI
  renderBattleUI(p);
}

function drawBattleCreo(p, creo, x, y, isPlayer) {
  const size = 60;
  
  p.push();
  p.translate(x, y);
  
  // Shake effect when taking damage
  if (gameState.battleAnimation) {
    const shake = Math.sin(gameState.battleAnimation.timer * 0.5) * 3;
    if ((gameState.battleAnimation.type === "ATTACK" && !isPlayer) ||
        (gameState.battleAnimation.type === "ENEMY_ATTACK" && isPlayer)) {
      p.translate(shake, 0);
    }
  }
  
  // Creo body
  p.fill(...creo.color);
  p.ellipse(0, 0, size, size * 0.8);
  
  // Features based on type
  p.fill(255, 255, 255, 200);
  p.ellipse(-size * 0.2, -size * 0.1, size * 0.2, size * 0.25);
  p.ellipse(size * 0.2, -size * 0.1, size * 0.2, size * 0.25);
  
  p.fill(0);
  p.ellipse(-size * 0.2, -size * 0.05, size * 0.1, size * 0.1);
  p.ellipse(size * 0.2, -size * 0.05, size * 0.1, size * 0.1);
  
  p.pop();
  
  // HP bar
  const hpPercent = creo.hp / creo.maxHp;
  const barWidth = 100;
  const barHeight = 8;
  const barX = x - barWidth / 2;
  const barY = y + size / 2 + 10;
  
  p.fill(0);
  p.rect(barX, barY, barWidth, barHeight);
  p.fill(...(hpPercent > 0.5 ? [100, 255, 100] : hpPercent > 0.25 ? [255, 200, 100] : [255, 100, 100]));
  p.rect(barX, barY, barWidth * hpPercent, barHeight);
  
  // Name and level
  p.fill(255);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(12);
  p.text(`${creo.name} Lv${creo.level}`, x, barY - 2);
  
  // HP text
  p.textSize(10);
  p.text(`${creo.hp}/${creo.maxHp}`, x, barY + barHeight + 12);
}

function drawBattleAnimation(p) {
  const anim = gameState.battleAnimation;
  if (!anim) return;
  
  if (anim.type === "ATTACK") {
    const skill = SKILLS[anim.skillId];
    const progress = 1 - anim.timer / 30;
    
    // Effect from player to enemy
    const startX = CANVAS_WIDTH * 0.3;
    const startY = CANVAS_HEIGHT * 0.6;
    const endX = CANVAS_WIDTH * 0.7;
    const endY = CANVAS_HEIGHT * 0.3;
    
    const x = startX + (endX - startX) * progress;
    const y = startY + (endY - startY) * progress;
    
    p.fill(255, 200, 50, 200);
    p.ellipse(x, y, 20, 20);
  }
  else if (anim.type === "ENEMY_ATTACK") {
    const skill = SKILLS[anim.skillId];
    const progress = 1 - anim.timer / 30;
    
    const startX = CANVAS_WIDTH * 0.7;
    const startY = CANVAS_HEIGHT * 0.3;
    const endX = CANVAS_WIDTH * 0.3;
    const endY = CANVAS_HEIGHT * 0.6;
    
    const x = startX + (endX - startX) * progress;
    const y = startY + (endY - startY) * progress;
    
    p.fill(255, 100, 100, 200);
    p.ellipse(x, y, 20, 20);
  }
}

function renderBattleUI(p) {
  // Message box
  p.fill(0, 0, 0, 200);
  p.rect(10, CANVAS_HEIGHT - 90, CANVAS_WIDTH - 20, 80);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  
  // Word wrap message
  const words = gameState.battleMessage.split(' ');
  let line = '';
  let y = CANVAS_HEIGHT - 80;
  const maxWidth = CANVAS_WIDTH - 40;
  
  for (let word of words) {
    const testLine = line + word + ' ';
    const testWidth = p.textWidth(testLine);
    
    if (testWidth > maxWidth && line.length > 0) {
      p.text(line, 20, y);
      line = word + ' ';
      y += 18;
    } else {
      line = testLine;
    }
  }
  p.text(line, 20, y);
  
  // Battle menu
  if (gameState.battleState === BATTLE_MENU) {
    renderBattleMenu(p);
  }
}

function renderBattleMenu(p) {
  const menuX = CANVAS_WIDTH - 210;
  const menuY = CANVAS_HEIGHT - 180;
  
  p.fill(0, 0, 0, 200);
  p.rect(menuX, menuY, 200, 160);
  
  // Main menu
  if (gameState.battleMenu.mainMenu < 4) {
    const options = ["Attack", "Skills", "Items", "Switch"];
    
    for (let i = 0; i < options.length; i++) {
      const selected = gameState.battleMenu.mainMenu === i;
      p.fill(...(selected ? [255, 255, 100] : [255, 255, 255]));
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(16);
      
      if (selected) {
        p.text("> " + options[i], menuX + 15, menuY + 15 + i * 35);
      } else {
        p.text(options[i], menuX + 20, menuY + 15 + i * 35);
      }
    }
  }
  
  // Skills submenu
  if (gameState.battleMenu.mainMenu === 1) {
    drawSkillsSubmenu(p, menuX - 220, menuY);
  }
  
  // Switch submenu
  if (gameState.battleMenu.mainMenu === 3) {
    drawSwitchSubmenu(p, menuX - 220, menuY);
  }
}

function drawSkillsSubmenu(p, x, y) {
  const creo = gameState.playerCreo;
  if (!creo) return;
  
  p.fill(0, 0, 0, 200);
  p.rect(x, y, 210, 160);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text("Skills:", x + 10, y + 10);
  
  for (let i = 0; i < creo.skills.length; i++) {
    const skillId = creo.skills[i];
    const skill = SKILLS[skillId];
    const selected = gameState.battleMenu.skillMenu === i;
    
    p.fill(...(selected ? [255, 255, 100] : [220, 220, 220]));
    p.textSize(12);
    
    if (selected) {
      p.text(`> ${skill.name}`, x + 15, y + 35 + i * 25);
    } else {
      p.text(skill.name, x + 20, y + 35 + i * 25);
    }
    
    p.fill(150);
    p.textSize(10);
    p.text(`Pow:${skill.power}`, x + 140, y + 35 + i * 25);
  }
}

function drawSwitchSubmenu(p, x, y) {
  p.fill(0, 0, 0, 200);
  p.rect(x, y, 210, 160);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text("Switch Creo:", x + 10, y + 10);
  
  const aliveCreo = gameState.playerTeam.filter(c => c.isAlive());
  
  for (let i = 0; i < Math.min(4, aliveCreo.length); i++) {
    const creo = aliveCreo[i];
    const selected = gameState.battleMenu.switchMenu === i;
    const isCurrent = creo === gameState.playerCreo;
    
    if (isCurrent) {
      p.fill(150);
    } else {
      p.fill(...(selected ? [255, 255, 100] : [220, 220, 220]));
    }
    
    p.textSize(12);
    
    const prefix = isCurrent ? "[Active]" : selected ? ">" : "";
    p.text(`${prefix} ${creo.name} Lv${creo.level}`, x + 15, y + 35 + i * 25);
    
    const hpPercent = creo.hp / creo.maxHp;
    p.fill(50);
    p.rect(x + 15, y + 50 + i * 25, 80, 6);
    p.fill(...(hpPercent > 0.5 ? [100, 255, 100] : [255, 200, 100]));
    p.rect(x + 15, y + 50 + i * 25, 80 * hpPercent, 6);
  }
}

function renderDialogue(p) {
  // Dialogue box
  p.fill(0, 0, 0, 220);
  p.rect(20, CANVAS_HEIGHT - 120, CANVAS_WIDTH - 40, 100);
  
  if (gameState.dialogue && gameState.dialogueIndex < gameState.dialogue.length) {
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    
    const text = gameState.dialogue[gameState.dialogueIndex];
    p.text(text, 30, CANVAS_HEIGHT - 110, CANVAS_WIDTH - 60, 80);
    
    // Continue indicator
    const flash = Math.floor(p.frameCount / 20) % 2 === 0;
    if (flash) {
      p.fill(255, 255, 100);
      p.textSize(12);
      p.textAlign(p.RIGHT, p.BOTTOM);
      p.text("Press Z", CANVAS_WIDTH - 30, CANVAS_HEIGHT - 30);
    }
  }
}

function renderPauseOverlay(p) {
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function renderGameOver(p) {
  p.background(20, 20, 30);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Stats
  p.fill(255);
  p.textSize(18);
  let y = 180;
  
  if (isWin) {
    p.text("You have become the ultimate Creo master!", CANVAS_WIDTH / 2, y);
    y += 40;
  }
  
  p.textSize(16);
  p.text(`Total Battles: ${gameState.totalBattles}`, CANVAS_WIDTH / 2, y);
  y += 30;
  p.text(`Creo Captured: ${gameState.creosCaptured}`, CANVAS_WIDTH / 2, y);
  y += 30;
  p.text(`Trainers Defeated: ${gameState.trainersDefeated}`, CANVAS_WIDTH / 2, y);
  y += 30;
  p.text(`Missions Completed: ${gameState.completedMissions}`, CANVAS_WIDTH / 2, y);
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
  }
}

function drawCreoIcon(p, color, size) {
  p.fill(...color);
  p.ellipse(0, 0, size, size * 0.8);
  
  p.fill(255, 255, 255, 200);
  p.ellipse(-size * 0.2, -size * 0.1, size * 0.2, size * 0.25);
  p.ellipse(size * 0.2, -size * 0.1, size * 0.2, size * 0.25);
  
  p.fill(0);
  p.ellipse(-size * 0.2, -size * 0.05, size * 0.1, size * 0.1);
  p.ellipse(size * 0.2, -size * 0.05, size * 0.1, size * 0.1);
}