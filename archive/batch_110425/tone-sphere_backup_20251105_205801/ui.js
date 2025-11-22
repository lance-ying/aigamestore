// ui.js - UI rendering functions

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  TARGET_RADIUS,
  TARGET_INNER_RADIUS,
  PERFECT_RANGE,
  GREAT_RANGE,
  GOOD_RANGE
} from './globals.js';

export function renderStartScreen(p, gameState) {
  p.background(20, 15, 30);
  
  // Animated background
  renderAnimatedBackground(p);
  
  // Title
  p.push();
  p.fill(200, 180, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("TONE SPHERE", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.textSize(16);
  p.fill(150, 140, 200);
  p.text("Rhythm Game", CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.textSize(14);
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    "OBJECTIVE:",
    "• Hit notes as they reach the center target ring",
    "• Maintain your health by hitting notes accurately",
    "• Build combos for higher scores",
    "",
    "CONTROLS:",
    "• SPACE - Hit blue circular notes",
    "• Z - Hit gold star notes",
    "• SHIFT - Hold for purple rectangular notes",
    "",
    "• ESC - Pause/Unpause",
    "• R - Restart"
  ];
  
  let yPos = 160;
  instructions.forEach(line => {
    p.text(line, 80, yPos);
    yPos += 18;
  });
  
  // Press Enter prompt (pulsing)
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 220, 100, 255 * pulse);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}

export function renderGame(p, gameState) {
  // Background
  p.background(...gameState.backgroundColor);
  
  // Animated background effects
  renderAnimatedBackground(p);
  
  // Render notes
  gameState.notes.forEach(note => note.render());
  
  // Render particles
  gameState.particles.forEach(particle => particle.render());
  
  // Render target zone
  renderTargetZone(p, gameState);
  
  // Render UI elements
  renderGameUI(p, gameState);
  
  // Render judgment
  if (gameState.judgmentTimer > 0) {
    renderJudgment(p, gameState);
  }
  
  // Paused indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.push();
    p.fill(255, 200);
    p.textSize(14);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
    p.pop();
  }
}

export function renderGameOverScreen(p, gameState) {
  p.background(20, 15, 30);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
  p.text(isWin ? "SONG COMPLETE!" : "SONG FAILED", CANVAS_WIDTH / 2, 80);
  
  // Stats
  p.textSize(20);
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  
  const stats = [
    `Score: ${gameState.score}`,
    `Max Combo: ${gameState.maxCombo}`,
    `Accuracy: ${calculateAccuracy(gameState)}%`,
    ``,
    `Perfect: ${gameState.perfectHits}`,
    `Great: ${gameState.greatHits}`,
    `Good: ${gameState.goodHits}`,
    `Miss: ${gameState.notesMissed}`
  ];
  
  let yPos = 140;
  stats.forEach(stat => {
    p.text(stat, CANVAS_WIDTH / 2, yPos);
    yPos += 30;
  });
  
  // Restart prompt
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 220, 100, 255 * pulse);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}

function renderAnimatedBackground(p) {
  p.push();
  p.noStroke();
  
  // Rotating rings
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;
  
  for (let i = 0; i < 3; i++) {
    const radius = 100 + i * 80;
    const speed = 0.01 + i * 0.005;
    const angle = p.frameCount * speed;
    
    p.colorMode(p.HSB);
    for (let j = 0; j < 8; j++) {
      const a = angle + (j * p.TWO_PI) / 8;
      const x = centerX + p.cos(a) * radius;
      const y = centerY + p.sin(a) * radius;
      const hue = (j * 360) / 8;
      p.fill(hue, 40, 50, 0.3);
      p.circle(x, y, 10);
    }
  }
  
  p.colorMode(p.RGB);
  p.pop();
}

function renderTargetZone(p, gameState) {
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;
  
  p.push();
  p.noFill();
  p.strokeWeight(3);
  
  // Outer ring (Good range)
  p.stroke(150, 150, 255, 100);
  p.circle(centerX, centerY, (TARGET_RADIUS + GOOD_RANGE) * 2);
  
  // Middle ring (Great range)
  p.stroke(100, 200, 255, 150);
  p.circle(centerX, centerY, (TARGET_RADIUS + GREAT_RANGE) * 2);
  
  // Inner ring (Perfect range)
  p.stroke(50, 255, 200, 200);
  p.circle(centerX, centerY, (TARGET_RADIUS + PERFECT_RANGE) * 2);
  
  // Target ring
  p.strokeWeight(4);
  p.stroke(255, 255, 255, 200);
  p.circle(centerX, centerY, TARGET_RADIUS * 2);
  
  // Center indicator
  p.fill(255, 255, 255, 150);
  p.noStroke();
  p.circle(centerX, centerY, TARGET_INNER_RADIUS * 2);
  
  // Pulse effect
  const pulse = p.sin(p.frameCount * 0.15) * 5;
  p.noFill();
  p.stroke(255, 255, 255, 100);
  p.strokeWeight(2);
  p.circle(centerX, centerY, (TARGET_RADIUS + pulse) * 2);
  
  p.pop();
}

function renderGameUI(p, gameState) {
  p.push();
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  
  // Score
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Combo
  if (gameState.combo > 0) {
    const comboColor = gameState.combo > 50 ? [255, 200, 50] : 
                      gameState.combo > 20 ? [100, 255, 100] : [255, 255, 255];
    p.fill(...comboColor);
    p.text(`Combo: ${gameState.combo}`, 10, 35);
  }
  
  // Health bar
  renderHealthBar(p, gameState);
  
  // Song progress
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  const progress = Math.min(100, (gameState.songProgress / gameState.currentSong.duration) * 100);
  p.text(`${progress.toFixed(0)}%`, CANVAS_WIDTH - 10, 10);
  
  // Song name
  p.textSize(12);
  p.fill(200);
  p.text(gameState.currentSong.name, CANVAS_WIDTH - 10, 35);
  
  p.pop();
}

function renderHealthBar(p, gameState) {
  const barWidth = 200;
  const barHeight = 20;
  const x = CANVAS_WIDTH - barWidth - 10;
  const y = CANVAS_HEIGHT - barHeight - 10;
  
  p.push();
  
  // Background
  p.fill(40, 40, 60);
  p.noStroke();
  p.rect(x, y, barWidth, barHeight, 5);
  
  // Health fill
  const healthPercent = gameState.health / gameState.maxHealth;
  const fillWidth = barWidth * healthPercent;
  
  let healthColor;
  if (healthPercent > 0.6) {
    healthColor = [100, 255, 100];
  } else if (healthPercent > 0.3) {
    healthColor = [255, 200, 50];
  } else {
    healthColor = [255, 100, 100];
  }
  
  p.fill(...healthColor);
  p.rect(x, y, fillWidth, barHeight, 5);
  
  // Border
  p.noFill();
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(x, y, barWidth, barHeight, 5);
  
  // Health text
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(12);
  p.text(`${Math.floor(gameState.health)}`, x + barWidth / 2, y + barHeight / 2);
  
  p.pop();
}

function renderJudgment(p, gameState) {
  if (!gameState.lastJudgment) return;
  
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2 - 80;
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  const alpha = (gameState.judgmentTimer / 30) * 255;
  let color, size, text;
  
  switch (gameState.lastJudgment) {
    case "PERFECT":
      color = [100, 255, 255];
      size = 32;
      text = "PERFECT!";
      break;
    case "GREAT":
      color = [100, 255, 100];
      size = 28;
      text = "GREAT!";
      break;
    case "GOOD":
      color = [255, 200, 100];
      size = 24;
      text = "GOOD";
      break;
    case "MISS":
      color = [255, 100, 100];
      size = 28;
      text = "MISS";
      break;
    default:
      p.pop();
      return;
  }
  
  p.fill(...color, alpha);
  p.textSize(size);
  p.text(text, centerX, centerY);
  
  p.pop();
}

function calculateAccuracy(gameState) {
  const totalNotes = gameState.notesHit + gameState.notesMissed;
  if (totalNotes === 0) return 0;
  return Math.floor((gameState.notesHit / totalNotes) * 100);
}