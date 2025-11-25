// renderer.js - Rendering logic

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderGame(p) {
  // Background with gradient
  drawBackground(p);
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING || gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderGameplay(p);
    renderUI(p);
    
    if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      renderPauseOverlay(p);
    }
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameplay(p);
    renderGameOverScreen(p);
  }
}

function drawBackground(p) {
  // Gradient background
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = p.map(y, 0, CANVAS_HEIGHT, 0, 1);
    const c = p.lerpColor(p.color(10, 10, 30), p.color(40, 20, 60), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Grid effect
  p.stroke(50, 50, 80, 100);
  p.strokeWeight(1);
  for (let x = 0; x < CANVAS_WIDTH; x += 40) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
    p.line(0, y, CANVAS_WIDTH, y);
  }
}

function renderStartScreen(p) {
  p.push();
  
  // Title
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("NEON STRIKER", CANVAS_WIDTH / 2, 80);
  
  // Subtitle glow
  p.fill(100, 200, 255);
  p.textSize(16);
  p.text("Heaven's Speedrun Challenge", CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.fill(200, 200, 200);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    "OBJECTIVE:",
    "• Eliminate all demons to activate the exit portal",
    "• Collect Soul Cards from defeated enemies",
    "• Use cards to shoot or unlock parkour abilities",
    "",
    "CONTROLS:",
    "• Arrow Keys: Move and Aim",
    "• SPACE: Jump (double jump with card)",
    "• Z: Shoot / Use card ability",
    "• SHIFT: Dash (with dash card)",
    "",
    "CARD TYPES:",
    "• PISTOL (Red): Shoot projectiles",
    "• DASH (Green): Sacrifice for dash ability",
    "• JUMP (Blue): Sacrifice for double jump"
  ];
  
  let yPos = 160;
  for (let line of instructions) {
    p.text(line, 50, yPos);
    yPos += 18;
  }
  
  // Start prompt with pulse
  const pulseAlpha = p.map(p.sin(p.frameCount * 0.1), -1, 1, 150, 255);
  p.fill(100, 255, 255, pulseAlpha);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}

function renderGameplay(p) {
  // Render platforms
  for (let platform of gameState.platforms) {
    platform.render();
  }
  
  // Render exit portal
  if (gameState.exitPortal) {
    gameState.exitPortal.render();
  }
  
  // Render cards
  for (let card of gameState.cards) {
    if (card.active) {
      card.render();
    }
  }
  
  // Render demons
  for (let demon of gameState.demons) {
    if (demon.active) {
      demon.render();
    }
  }
  
  // Render entities (bullets, projectiles)
  for (let entity of gameState.entities) {
    if (entity.active && entity.render && !gameState.demons.includes(entity)) {
      entity.render();
    }
  }
  
  // Render particles
  for (let particle of gameState.particles) {
    if (particle.active) {
      particle.render();
    }
  }
  
  // Render player
  if (gameState.player) {
    gameState.player.render();
  }
}

function renderUI(p) {
  const player = gameState.player;
  if (!player) return;
  
  p.push();
  
  // Health bar
  p.fill(50);
  p.noStroke();
  p.rect(10, 10, 120, 20);
  p.fill(255, 50, 50);
  const healthWidth = (player.health / player.maxHealth) * 120;
  p.rect(10, 10, healthWidth, 20);
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`HP: ${Math.ceil(player.health)}`, 15, 13);
  
  // Score and stats
  p.fill(255);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, 10, 40);
  p.text(`Demons: ${gameState.demonsKilled}/${gameState.totalDemons}`, 10, 60);
  
  // Timer
  if (gameState.gamePhase === GAME_PHASES.PLAYING && gameState.startTime > 0) {
    const elapsed = ((Date.now() - gameState.startTime) / 1000).toFixed(1);
    p.text(`Time: ${elapsed}s`, 10, 80);
  }
  
  // Current card display
  const card = player.getCurrentCard();
  if (card) {
    p.fill(50);
    p.rect(CANVAS_WIDTH - 110, 10, 100, 80);
    
    p.fill(...card.type.color);
    p.textSize(16);
    p.textAlign(p.CENTER, p.TOP);
    p.text(card.type.name, CANVAS_WIDTH - 60, 15);
    
    p.fill(200);
    p.textSize(11);
    p.text(`[Z] ${card.type.abilityName}`, CANVAS_WIDTH - 60, 40);
    
    // Card icon
    p.fill(...card.type.color);
    p.noStroke();
    p.rect(CANVAS_WIDTH - 80, 60, 40, 25);
  }
  
  p.pop();
}

function renderPauseOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

function renderGameOverScreen(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Game over message
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  p.fill(isWin ? 100 : 255, isWin ? 255 : 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "DEFEATED", CANVAS_WIDTH / 2, 120);
  
  // Stats
  p.fill(255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  
  if (isWin && gameState.completionTime > 0) {
    p.text(`Time: ${gameState.completionTime.toFixed(2)}s`, CANVAS_WIDTH / 2, 210);
  }
  
  p.text(`Demons Eliminated: ${gameState.demonsKilled}/${gameState.totalDemons}`, 
         CANVAS_WIDTH / 2, 240);
  
  // Restart prompt
  const pulseAlpha = p.map(p.sin(p.frameCount * 0.1), -1, 1, 150, 255);
  p.fill(100, 255, 255, pulseAlpha);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
  
  p.pop();
}