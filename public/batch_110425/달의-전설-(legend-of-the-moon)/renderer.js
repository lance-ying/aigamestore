// renderer.js - All rendering functions

import {
  CANVAS_WIDTH, CANVAS_HEIGHT, ROOM_PADDING,
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
  PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  gameState
} from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 15, 35);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('달의 전설', CANVAS_WIDTH / 2, 80);
  
  p.textSize(24);
  p.fill(200, 180, 255);
  p.text('Legend of the Moon', CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.textSize(14);
  p.fill(220, 220, 220);
  p.textAlign(p.CENTER, p.TOP);
  
  const instructions = [
    'Navigate through dangerous dungeons',
    'Defeat monsters and collect powerful equipment',
    'Survive all rooms and defeat the final boss',
    '',
    'Movement: Arrow Keys',
    'Attack: Space (melee)',
    'Fireball: Z (ranged, 5s cooldown)',
    'Heal: Shift (restore HP, 10s cooldown)',
    '',
    'PRESS ENTER TO START'
  ];
  
  let yPos = 160;
  instructions.forEach(line => {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 20;
  });
}

export function renderPlaying(p) {
  p.background(40, 35, 45);
  
  // Render room
  renderRoom(p);
  
  // Render items
  gameState.items.forEach(item => {
    if (!item.collected) {
      renderItem(p, item);
    }
  });
  
  // Render projectiles
  gameState.projectiles.forEach(proj => {
    if (proj.active) {
      renderProjectile(p, proj);
    }
  });
  
  // Render enemies
  gameState.enemies.forEach(enemy => {
    if (enemy.isAlive) {
      renderEnemy(p, enemy);
    }
  });
  
  // Render player
  if (gameState.player) {
    renderPlayer(p, gameState.player);
  }
  
  // Render UI
  renderUI(p);
  
  // Room transition overlay
  if (gameState.transitionTimer > 0) {
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text(`Room ${gameState.currentRoom + 1}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
}

export function renderPaused(p) {
  renderPlaying(p);
  
  // Pause overlay
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  // Small indicator
  p.textSize(12);
  p.textAlign(p.RIGHT, p.TOP);
  p.text('PAUSED', CANVAS_WIDTH - 10, 10);
}

export function renderGameOver(p, win) {
  p.background(win ? [30, 50, 30] : [50, 30, 30]);
  
  p.fill(win ? [100, 255, 100] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(win ? 'VICTORY!' : 'GAME OVER', CANVAS_WIDTH / 2, 100);
  
  p.textSize(24);
  p.fill(255);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 160);
  p.text(`Gold Collected: ${gameState.gold}`, CANVAS_WIDTH / 2, 200);
  p.text(`Rooms Cleared: ${gameState.roomsCleared}`, CANVAS_WIDTH / 2, 240);
  
  p.textSize(18);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 320);
}

function renderRoom(p) {
  // Room floor
  p.fill(60, 55, 65);
  p.rect(ROOM_PADDING, ROOM_PADDING, 
         CANVAS_WIDTH - 2 * ROOM_PADDING, 
         CANVAS_HEIGHT - 2 * ROOM_PADDING);
  
  // Room walls
  p.stroke(80, 75, 85);
  p.strokeWeight(3);
  p.noFill();
  p.rect(ROOM_PADDING, ROOM_PADDING, 
         CANVAS_WIDTH - 2 * ROOM_PADDING, 
         CANVAS_HEIGHT - 2 * ROOM_PADDING);
  p.noStroke();
  
  // Floor pattern
  p.stroke(50, 45, 55);
  p.strokeWeight(1);
  for (let i = ROOM_PADDING; i < CANVAS_WIDTH - ROOM_PADDING; i += 30) {
    p.line(i, ROOM_PADDING, i, CANVAS_HEIGHT - ROOM_PADDING);
  }
  for (let j = ROOM_PADDING; j < CANVAS_HEIGHT - ROOM_PADDING; j += 30) {
    p.line(ROOM_PADDING, j, CANVAS_WIDTH - ROOM_PADDING, j);
  }
  p.noStroke();
}

function renderPlayer(p, player) {
  p.push();
  p.translate(player.x, player.y);
  
  // Body
  p.fill(100, 150, 255);
  p.ellipse(0, 0, player.size, player.size);
  
  // Direction indicator
  p.fill(255, 255, 255);
  const indicatorDist = player.size / 2 + 3;
  let dx = 0, dy = 0;
  switch(player.facingDirection) {
    case 0: dy = indicatorDist; break;
    case 1: dx = -indicatorDist; break;
    case 2: dy = -indicatorDist; break;
    case 3: dx = indicatorDist; break;
  }
  p.ellipse(dx, dy, 5, 5);
  
  // Equipment indicator
  if (player.equipment.weapon) {
    p.fill(255, 215, 0);
    p.rect(dx - 2, dy - 8, 4, 10);
  }
  
  // Health bar
  p.fill(200, 50, 50);
  p.rect(-player.size / 2, -player.size / 2 - 8, player.size, 4);
  p.fill(100, 255, 100);
  const healthWidth = (player.hp / player.maxHp) * player.size;
  p.rect(-player.size / 2, -player.size / 2 - 8, healthWidth, 4);
  
  p.pop();
}

function renderEnemy(p, enemy) {
  p.push();
  p.translate(enemy.x, enemy.y);
  
  // Body color based on type
  let bodyColor = [150, 255, 150]; // slime
  if (enemy.type === 'goblin') bodyColor = [150, 200, 100];
  if (enemy.type === 'orc') bodyColor = [200, 100, 100];
  if (enemy.type === 'boss') bodyColor = [150, 50, 150];
  
  p.fill(...bodyColor);
  p.ellipse(0, 0, enemy.size, enemy.size);
  
  // Eyes
  p.fill(255, 50, 50);
  const eyeOffset = enemy.size / 4;
  p.ellipse(-eyeOffset, -eyeOffset / 2, 4, 4);
  p.ellipse(eyeOffset, -eyeOffset / 2, 4, 4);
  
  // Boss crown
  if (enemy.type === 'boss') {
    p.fill(255, 215, 0);
    p.triangle(-8, -enemy.size / 2 - 2, 0, -enemy.size / 2 - 10, 8, -enemy.size / 2 - 2);
  }
  
  // Health bar
  p.fill(200, 50, 50);
  p.rect(-enemy.size / 2, -enemy.size / 2 - 8, enemy.size, 3);
  p.fill(255, 100, 100);
  const healthWidth = (enemy.hp / enemy.maxHp) * enemy.size;
  p.rect(-enemy.size / 2, -enemy.size / 2 - 8, healthWidth, 3);
  
  p.pop();
}

function renderItem(p, item) {
  item.update();
  
  p.push();
  p.translate(item.x, item.y);
  
  // Floating animation
  const floatOffset = Math.sin(item.animationFrame * 0.1) * 2;
  p.translate(0, floatOffset);
  
  // Rarity glow
  if (item.rarity === 'rare') {
    p.fill(100, 100, 255, 100);
    p.ellipse(0, 0, item.size + 8, item.size + 8);
  } else if (item.rarity === 'epic') {
    p.fill(200, 0, 200, 100);
    p.ellipse(0, 0, item.size + 10, item.size + 10);
  }
  
  // Item icon
  if (item.type === 'gold') {
    p.fill(255, 215, 0);
    p.ellipse(0, 0, item.size, item.size);
    p.fill(255, 235, 50);
    p.ellipse(0, 0, item.size - 4, item.size - 4);
  } else if (item.type === 'weapon') {
    p.fill(200, 200, 200);
    p.rect(-2, -item.size / 2, 4, item.size);
    p.fill(150, 100, 50);
    p.rect(-3, item.size / 2 - 4, 6, 4);
  } else if (item.type === 'armor') {
    p.fill(180, 180, 180);
    p.ellipse(0, 0, item.size, item.size);
    p.fill(140, 140, 140);
    p.ellipse(0, 0, item.size - 4, item.size - 4);
  } else if (item.type === 'shield') {
    p.fill(100, 150, 200);
    p.ellipse(0, 0, item.size, item.size);
    p.fill(220, 220, 220);
    p.ellipse(0, 0, 4, 4);
  }
  
  p.pop();
}

function renderProjectile(p, proj) {
  p.push();
  
  // Fireball effect
  p.fill(255, 150, 0, 200);
  p.ellipse(proj.x, proj.y, proj.size + 4, proj.size + 4);
  p.fill(255, 200, 50);
  p.ellipse(proj.x, proj.y, proj.size, proj.size);
  
  // Trail
  const trailLength = 3;
  for (let i = 1; i <= trailLength; i++) {
    const trailX = proj.x - Math.cos(proj.direction) * i * 3;
    const trailY = proj.y - Math.sin(proj.direction) * i * 3;
    const alpha = 150 - i * 40;
    p.fill(255, 100, 0, alpha);
    p.ellipse(trailX, trailY, proj.size - i, proj.size - i);
  }
  
  p.pop();
}

function renderUI(p) {
  const player = gameState.player;
  if (!player) return;
  
  // Background panel
  p.fill(0, 0, 0, 150);
  p.rect(5, 5, 200, 80);
  
  // Stats
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`HP: ${Math.ceil(player.hp)}/${player.maxHp}`, 10, 10);
  p.text(`ATK: ${player.attack} | DEF: ${player.defense}`, 10, 25);
  p.text(`Gold: ${gameState.gold}`, 10, 40);
  p.text(`Score: ${gameState.score}`, 10, 55);
  p.text(`Room: ${gameState.currentRoom + 1}/${gameState.totalRooms}`, 10, 70);
  
  // Cooldown indicators
  const cooldownX = CANVAS_WIDTH - 150;
  const cooldownY = 10;
  
  p.fill(0, 0, 0, 150);
  p.rect(cooldownX - 5, cooldownY - 5, 145, 70);
  
  p.textSize(10);
  p.fill(255);
  
  // Attack cooldown
  p.text('Attack [SPACE]', cooldownX, cooldownY);
  renderCooldownBar(p, cooldownX, cooldownY + 12, 130, 6, 
                    gameState.attackCooldown, 30);
  
  // Fireball cooldown
  p.text('Fireball [Z]', cooldownX, cooldownY + 22);
  renderCooldownBar(p, cooldownX, cooldownY + 34, 130, 6, 
                    gameState.fireballCooldown, 300);
  
  // Heal cooldown
  p.text('Heal [Shift]', cooldownX, cooldownY + 44);
  renderCooldownBar(p, cooldownX, cooldownY + 56, 130, 6, 
                    gameState.healCooldown, 600);
}

function renderCooldownBar(p, x, y, width, height, current, max) {
  p.fill(80, 80, 80);
  p.rect(x, y, width, height);
  
  const progress = Math.max(0, 1 - current / max);
  p.fill(100, 200, 100);
  p.rect(x, y, width * progress, height);
  
  if (current > 0) {
    p.fill(255, 100, 100);
    p.rect(x + width * progress, y, width * (1 - progress), height);
  }
}