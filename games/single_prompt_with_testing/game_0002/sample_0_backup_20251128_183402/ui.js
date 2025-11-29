// ui.js - User interface rendering

import {
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
  PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE,
  CANVAS_WIDTH, CANVAS_HEIGHT
} from './globals.js';

export function renderUI(p, gameState) {
  const phase = gameState.gamePhase;
  
  if (phase === PHASE_START) {
    renderStartScreen(p);
  } else if (phase === PHASE_PLAYING) {
    renderGameUI(p, gameState);
  } else if (phase === PHASE_PAUSED) {
    renderGameUI(p, gameState);
    renderPauseOverlay(p);
  } else if (phase === PHASE_GAME_OVER_WIN || phase === PHASE_GAME_OVER_LOSE) {
    renderGameOverScreen(p, gameState);
  }
}

function renderStartScreen(p) {
  p.background(20, 15, 30);
  
  // Decorative background
  for (let i = 0; i < 20; i++) {
    const x = (i * 137.508) % CANVAS_WIDTH;
    const y = (i * 73.234) % CANVAS_HEIGHT;
    const size = (i * 23) % 30 + 10;
    p.fill(80, 50, 100, 50);
    p.noStroke();
    p.ellipse(x, y, size, size);
  }
  
  // Title
  p.fill(200, 150, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("UNDERWORLD", CANVAS_WIDTH / 2, 80);
  
  p.fill(150, 100, 200);
  p.textSize(24);
  p.text("ESCAPE", CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(200, 200, 200);
  p.textSize(14);
  p.textAlign(p.CENTER, p.CENTER);
  const desc = "Battle through the depths of the Underworld!\nDefeat enemies, collect boons from the gods,\nand reach the surface to escape!";
  p.text(desc, CANVAS_WIDTH / 2, 180);
  
  // Instructions
  p.fill(255, 220, 150);
  p.textSize(16);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 250);
  
  p.fill(200, 200, 200);
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  const instructions = [
    "Arrow Keys - Move Zagreus",
    "Z - Attack enemies",
    "Space - Dash (dodge with invulnerability)",
    "ESC - Pause game",
    "R - Restart (from game over)"
  ];
  
  let y = 280;
  for (const inst of instructions) {
    p.text(inst, 120, y);
    y += 22;
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const flash = Math.floor(p.frameCount / 30) % 2 === 0;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 380);
  }
}

function renderGameUI(p, gameState) {
  const player = gameState.player;
  if (!player) return;
  
  // Health bar
  const hpBarX = 10;
  const hpBarY = 10;
  const hpBarWidth = 150;
  const hpBarHeight = 20;
  
  p.fill(50, 50, 50);
  p.noStroke();
  p.rect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
  
  const hpPercent = player.health / player.maxHealth;
  const hpColor = hpPercent > 0.5 ? [100, 255, 100] : hpPercent > 0.25 ? [255, 200, 100] : [255, 100, 100];
  p.fill(...hpColor);
  p.rect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`HP: ${Math.floor(player.health)}/${player.maxHealth}`, hpBarX + 5, hpBarY + 4);
  
  // Score
  p.fill(255, 220, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Rooms cleared
  p.fill(200, 200, 255);
  p.textSize(14);
  p.text(`Room: ${gameState.currentRoom + 1}/9`, CANVAS_WIDTH - 10, 35);
  
  // Dash cooldown indicator
  if (player.dashCooldown > 0) {
    const cooldownPercent = player.dashCooldown / 30;
    p.fill(100, 150, 255, 150);
    p.rect(10, 40, 100 * (1 - cooldownPercent), 8);
    
    p.fill(200, 200, 255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(10);
    p.text("Dash Ready", 10, 50);
  } else {
    p.fill(100, 255, 100);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(10);
    p.text("Dash Ready!", 10, 40);
  }
  
  // Boons collected
  if (gameState.attackBonus > 0 || gameState.speedBonus > 0 || gameState.dashBonus > 0) {
    p.fill(255, 220, 100);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(11);
    let boonY = 60;
    
    if (gameState.attackBonus > 0) {
      p.text(`⚡ Attack +${gameState.attackBonus}`, 10, boonY);
      boonY += 15;
    }
    if (gameState.speedBonus > 0) {
      p.text(`🏃 Speed +${gameState.speedBonus}`, 10, boonY);
      boonY += 15;
    }
    if (gameState.dashBonus > 0) {
      p.text(`🌊 Dash +${gameState.dashBonus}`, 10, boonY);
      boonY += 15;
    }
  }
}

function renderPauseOverlay(p) {
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 60);
}

function renderGameOverScreen(p, gameState) {
  // Dim background
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const win = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  if (win) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("ESCAPED!", CANVAS_WIDTH / 2, 120);
    
    p.fill(200, 255, 200);
    p.textSize(20);
    p.text("You have defied the god of the dead!", CANVAS_WIDTH / 2, 170);
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("DEFEATED", CANVAS_WIDTH / 2, 120);
    
    p.fill(255, 200, 200);
    p.textSize(20);
    p.text("The Underworld claims you... for now.", CANVAS_WIDTH / 2, 170);
  }
  
  // Final score
  p.fill(255, 220, 100);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  // Stats
  p.fill(200, 200, 200);
  p.textSize(16);
  p.text(`Rooms Cleared: ${gameState.roomsCleared}`, CANVAS_WIDTH / 2, 260);
  p.text(`Boons Collected: ${gameState.attackBonus + gameState.speedBonus + gameState.dashBonus}`, CANVAS_WIDTH / 2, 285);
  
  // Restart prompt
  p.fill(255, 255, 255);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}