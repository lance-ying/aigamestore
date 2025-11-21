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
import { createSongList } from './song.js';

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
  
  // Subtitle with level info
  p.textSize(16);
  p.fill(150, 140, 200);
  const songs = createSongList();
  const levelText = `Level ${gameState.currentDifficulty} of ${songs.length}`;
  p.text(levelText, CANVAS_WIDTH / 2, 110);
  
  p.textSize(14);
  p.fill(100, 200, 255);
  p.text(`Next Song: ${songs[gameState.currentDifficulty - 1].name}`, CANVAS_WIDTH / 2, 130);
  
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
    "• R - Restart from Level 1"
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

export function renderGame(p, gameState, inputHandler) {
  // Background
  p.background(...gameState.backgroundColor);
  
  // Animated background effects
  renderAnimatedBackground(p);
  
  // Render notes
  gameState.notes.forEach(note => note.render());
  
  // Render particles
  gameState.particles.forEach(particle => particle.render());
  
  // Render target zone with key press feedback
  renderTargetZone(p, gameState, inputHandler);
  
  // Render UI elements
  renderGameUI(p, gameState);
  
  // Render key press indicators
  renderKeyPressIndicators(p, inputHandler);
  
  // Render judgment
  if (gameState.judgmentTimer > 0) {
    renderJudgment(p, gameState);
  }
  
  // Paused indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.push();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255, 255);
    p.textSize(48);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    p.textSize(18);
    p.text("Press ESC to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
    p.pop();
  }
}

export function renderGameOverScreen(p, gameState) {
  p.background(20, 15, 30);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  const songs = createSongList();
  const hasMoreLevels = gameState.currentDifficulty < songs.length;
  const allLevelsComplete = isWin && !hasMoreLevels;
  
  // Title
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  
  if (allLevelsComplete) {
    p.fill(255, 215, 0); // Gold color for completing all levels
    p.text("ALL LEVELS COMPLETE!", CANVAS_WIDTH / 2, 60);
  } else {
    p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
    p.text(isWin ? "LEVEL COMPLETE!" : "LEVEL FAILED", CANVAS_WIDTH / 2, 70);
  }
  
  // Level info
  p.textSize(18);
  p.fill(200, 200, 255);
  p.text(`Level ${gameState.currentDifficulty}: ${gameState.currentSong.name}`, CANVAS_WIDTH / 2, allLevelsComplete ? 100 : 110);
  
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
  
  let yPos = allLevelsComplete ? 130 : 140;
  stats.forEach(stat => {
    p.text(stat, CANVAS_WIDTH / 2, yPos);
    yPos += 28;
  });
  
  // Action prompts
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.textSize(18);
  
  if (isWin && hasMoreLevels) {
    // Show next level option
    p.fill(100, 255, 100, 255 * pulse);
    p.text("PRESS ENTER FOR NEXT LEVEL", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 70);
    
    p.fill(200, 200, 200);
    p.textSize(14);
    p.text("Press R to restart from Level 1", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  } else if (allLevelsComplete) {
    // All levels complete
    p.fill(255, 215, 0, 255 * pulse);
    p.textSize(20);
    p.text("CONGRATULATIONS!", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 70);
    
    p.fill(200, 200, 200);
    p.textSize(16);
    p.text("Press ENTER or R to play again", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  } else {
    // Failed - only show restart
    p.fill(255, 220, 100, 255 * pulse);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  }
  
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

function renderTargetZone(p, gameState, inputHandler) {
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;
  
  p.push();
  p.noFill();
  p.strokeWeight(3);
  
  // Check if any gameplay keys are pressed
  const gameplayKeys = [32, 90, 16];
  let anyKeyPressed = false;
  if (inputHandler) {
    anyKeyPressed = gameplayKeys.some(key => inputHandler.isKeyPressed(key));
  }
  
  // Outer ring (Good range)
  p.stroke(150, 150, 255, 100);
  p.circle(centerX, centerY, (TARGET_RADIUS + GOOD_RANGE) * 2);
  
  // Middle ring (Great range)
  p.stroke(100, 200, 255, 150);
  p.circle(centerX, centerY, (TARGET_RADIUS + GREAT_RANGE) * 2);
  
  // Inner ring (Perfect range)
  p.stroke(50, 255, 200, 200);
  p.circle(centerX, centerY, (TARGET_RADIUS + PERFECT_RANGE) * 2);
  
  // Target ring with feedback when key is pressed
  p.strokeWeight(anyKeyPressed ? 6 : 4);
  p.stroke(255, 255, 255, anyKeyPressed ? 255 : 200);
  p.circle(centerX, centerY, TARGET_RADIUS * 2);
  
  // Glow effect when key is pressed
  if (anyKeyPressed) {
    p.strokeWeight(2);
    p.stroke(100, 255, 255, 150);
    p.circle(centerX, centerY, (TARGET_RADIUS + 5) * 2);
    p.stroke(100, 255, 255, 80);
    p.circle(centerX, centerY, (TARGET_RADIUS + 10) * 2);
  }
  
  // Center indicator
  p.fill(anyKeyPressed ? [100, 255, 255, 200] : [255, 255, 255, 150]);
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

function renderKeyPressIndicators(p, inputHandler) {
  if (!inputHandler) return;
  
  p.push();
  
  // Display which keys are currently pressed
  const keyInfo = [
    { code: 32, label: 'SPACE', x: CANVAS_WIDTH / 2 - 100, color: [100, 150, 255] },
    { code: 90, label: 'Z', x: CANVAS_WIDTH / 2, color: [255, 200, 50] },
    { code: 16, label: 'SHIFT', x: CANVAS_WIDTH / 2 + 100, color: [200, 100, 255] }
  ];
  
  const y = CANVAS_HEIGHT - 60;
  
  keyInfo.forEach(key => {
    const isPressed = inputHandler.isKeyPressed(key.code);
    
    // Background box
    p.fill(isPressed ? [...key.color, 200] : [60, 60, 80, 150]);
    p.stroke(isPressed ? [255, 255, 255] : [100, 100, 120]);
    p.strokeWeight(isPressed ? 3 : 2);
    p.rect(key.x - 35, y - 15, 70, 30, 5);
    
    // Key label
    p.fill(isPressed ? [255, 255, 255] : [200, 200, 200]);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(key.label, key.x, y);
    
    // Glow effect when pressed
    if (isPressed) {
      p.noFill();
      p.stroke(...key.color, 100);
      p.strokeWeight(2);
      p.rect(key.x - 40, y - 20, 80, 40, 8);
    }
  });
  
  p.pop();
}

function renderGameUI(p, gameState) {
  p.push();
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  
  // Score
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Level info
  const songs = createSongList();
  p.textSize(14);
  p.fill(150, 200, 255);
  p.text(`Level ${gameState.currentDifficulty}/${songs.length}`, 10, 35);
  
  // Combo
  p.fill(255);
  p.textSize(16);
  if (gameState.combo > 0) {
    const comboColor = gameState.combo > 50 ? [255, 200, 50] : 
                      gameState.combo > 20 ? [100, 255, 100] : [255, 255, 255];
    p.fill(...comboColor);
    p.text(`Combo: ${gameState.combo}`, 10, 60);
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
  
  // Outline for better visibility
  p.stroke(0);
  p.strokeWeight(4);
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