// rendering.js - All rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PALETTE_HEIGHT, GAME_HEIGHT, LEVELS } from './globals.js';

export function renderGame(p) {
  p.background(240, 240, 245);
  
  if (gameState.gamePhase === "START") {
    renderStartScreen(p);
  } else if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
    renderPlayingScreen(p);
    if (gameState.gamePhase === "PAUSED") {
      renderPauseOverlay(p);
    }
  } else if (gameState.gamePhase === "GAME_OVER_WIN") {
    renderGameOverScreen(p);
  }
}

function renderStartScreen(p) {
  p.fill(50, 50, 80);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("Numbered Canvas", CANVAS_WIDTH / 2, 80);
  p.text("Masterpiece", CANVAS_WIDTH / 2, 130);
  
  p.textSize(16);
  p.fill(80, 80, 100);
  p.text("Complete beautiful artworks by filling numbered segments", CANVAS_WIDTH / 2, 180);
  p.text("with their matching colors from the palette below.", CANVAS_WIDTH / 2, 200);
  
  p.textSize(14);
  p.fill(100, 100, 120);
  p.text("ARROW KEYS - Pan canvas", CANVAS_WIDTH / 2, 240);
  p.text("SPACE - Select next color", CANVAS_WIDTH / 2, 260);
  p.text("ESC - Pause game", CANVAS_WIDTH / 2, 280);
  
  p.textSize(24);
  p.fill(255, 200, 50);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 340);
  
  // Show high score
  if (gameState.highScore > 0) {
    p.textSize(18);
    p.fill(150, 100, 200);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 300);
  }
}

function renderPlayingScreen(p) {
  // Draw game area
  p.push();
  p.fill(255);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, GAME_HEIGHT);
  p.pop();
  
  // Apply camera transform and render artwork
  p.push();
  p.translate(gameState.canvasTransform.panOffsetX, gameState.canvasTransform.panOffsetY);
  p.scale(gameState.canvasTransform.zoomLevel);
  
  renderArtwork(p);
  
  p.pop();
  
  // Draw UI
  renderUI(p);
  renderPalette(p);
  
  // Draw completion animation if active
  if (gameState.completionAnimation.active) {
    renderCompletionAnimation(p);
  }
}

function renderArtwork(p) {
  for (let segment of gameState.artworkSegments) {
    // Determine if segment should be highlighted
    const isMatchingColor = !segment.isFilled && 
                           gameState.currentSelectedColorID === segment.targetColorID;
    
    // Draw segment
    if (segment.isFilled) {
      // Filled segment
      p.fill(segment.fillColor.h, segment.fillColor.s, segment.fillColor.b);
      p.stroke(200);
      p.strokeWeight(1);
    } else {
      // Unfilled segment
      p.fill(250);
      p.stroke(isMatchingColor ? [100, 150, 255] : [180]);
      p.strokeWeight(isMatchingColor ? 3 : 1);
    }
    
    p.beginShape();
    for (let vertex of segment.vertices) {
      p.vertex(vertex[0], vertex[1]);
    }
    p.endShape(p.CLOSE);
    
    // Draw number if not filled
    if (!segment.isFilled) {
      p.fill(100);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14 / gameState.canvasTransform.zoomLevel);
      p.text(segment.number, segment.centerX, segment.centerY);
    }
  }
}

function renderUI(p) {
  // Score
  p.fill(50, 50, 80);
  p.noStroke();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(18);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Level
  p.textAlign(p.LEFT, p.TOP);
  const levelConfig = LEVELS[gameState.currentLevel - 1];
  p.text(`Level ${gameState.currentLevel}: ${levelConfig.name}`, 10, 10);
  
  // Progress
  const progress = gameState.totalSegments > 0 ? 
                   (gameState.filledSegments / gameState.totalSegments * 100).toFixed(0) : 0;
  p.textSize(14);
  p.text(`Progress: ${progress}%`, 10, 35);
  
  // Time bonus indicator
  if (gameState.levelStartTime > 0) {
    const elapsed = Math.floor((Date.now() - gameState.levelStartTime) / 1000);
    const remaining = Math.max(0, levelConfig.maxTime - elapsed);
    p.fill(remaining < 60 ? [200, 50, 50] : [80, 80, 100]);
    p.text(`Time Bonus: ${remaining}s`, 10, 55);
  }
}

function renderPalette(p) {
  const paletteY = GAME_HEIGHT;
  
  // Background
  p.fill(60, 60, 80);
  p.noStroke();
  p.rect(0, paletteY, CANVAS_WIDTH, PALETTE_HEIGHT);
  
  // Color swatches
  const swatchCount = gameState.colorPalette.length;
  const swatchWidth = Math.min(60, (CANVAS_WIDTH - 20) / swatchCount);
  const swatchHeight = 50;
  const startX = (CANVAS_WIDTH - swatchWidth * swatchCount) / 2;
  
  for (let i = 0; i < swatchCount; i++) {
    const color = gameState.colorPalette[i];
    const x = startX + i * swatchWidth;
    const y = paletteY + 15;
    
    const isSelected = gameState.currentSelectedColorID === color.id;
    
    // Swatch background
    if (isSelected) {
      p.fill(255, 220, 100);
      p.stroke(255, 200, 50);
      p.strokeWeight(3);
      p.rect(x - 3, y - 3, swatchWidth + 6, swatchHeight + 6, 5);
    }
    
    // Swatch color
    p.fill(color.hue, color.saturation, color.brightness);
    p.stroke(isSelected ? [255] : [200]);
    p.strokeWeight(isSelected ? 2 : 1);
    p.rect(x, y, swatchWidth, swatchHeight, 5);
    
    // Number
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    p.text(color.id, x + swatchWidth / 2, y + swatchHeight / 2);
  }
  
  // Instructions
  p.fill(200);
  p.textSize(11);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Select color with SPACE | Fill matching segments", CANVAS_WIDTH / 2, paletteY + 70);
}

function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(18);
  p.text("Press ESC to continue", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

function renderGameOverScreen(p) {
  p.fill(50, 50, 80);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.text("Congratulations!", CANVAS_WIDTH / 2, 100);
  
  p.textSize(24);
  p.fill(100, 150, 100);
  p.text("You've completed all artworks!", CANVAS_WIDTH / 2, 160);
  
  p.textSize(32);
  p.fill(200, 150, 50);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  if (gameState.score > gameState.highScore) {
    p.textSize(20);
    p.fill(255, 200, 100);
    p.text("NEW HIGH SCORE!", CANVAS_WIDTH / 2, 260);
  }
  
  p.textSize(20);
  p.fill(150, 150, 180);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}

function renderCompletionAnimation(p) {
  const elapsed = Date.now() - gameState.completionAnimation.startTime;
  
  for (let particle of gameState.completionAnimation.particles) {
    const life = (elapsed - particle.startTime) / particle.lifetime;
    
    if (life >= 0 && life < 1) {
      const alpha = 255 * (1 - life);
      p.fill(particle.color[0], particle.color[1], particle.color[2], alpha);
      p.noStroke();
      p.circle(
        particle.x + particle.vx * (elapsed - particle.startTime) / 1000,
        particle.y + particle.vy * (elapsed - particle.startTime) / 1000,
        particle.size * (1 - life * 0.5)
      );
    }
  }
  
  // Stop animation after duration
  if (elapsed > 3000) {
    gameState.completionAnimation.active = false;
  }
}

export function startCompletionAnimation() {
  gameState.completionAnimation = {
    active: true,
    startTime: Date.now(),
    particles: []
  };
  
  // Create particles
  for (let i = 0; i < 100; i++) {
    gameState.completionAnimation.particles.push({
      x: CANVAS_WIDTH / 2,
      y: GAME_HEIGHT / 2,
      vx: (Math.random() - 0.5) * 200,
      vy: (Math.random() - 0.5) * 200,
      size: 5 + Math.random() * 10,
      color: [Math.random() * 255, Math.random() * 255, Math.random() * 255],
      startTime: Date.now() + i * 30,
      lifetime: 1000 + Math.random() * 1000
    });
  }
}