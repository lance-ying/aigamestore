// ui.js - UI rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './globals.js';

export function renderStartScreen(p) {
  // Animated background
  renderAnimatedBackground(p);
  
  // Title with glow effect
  p.textAlign(p.CENTER, p.CENTER);
  
  // Glow
  p.fill(255, 200, 255, 100);
  p.noStroke();
  p.textSize(56);
  p.text('Lost in Dreams', CANVAS_WIDTH / 2 + 2, 80 + 2);
  
  // Title
  p.fill(255, 240, 255);
  p.textSize(54);
  p.text('Lost in Dreams', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 180, 220);
  p.textSize(16);
  p.text('A Magical Puzzle Adventure', CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(255, 255, 255, 200);
  p.textSize(12);
  const desc = 'Help brother and sister find their way home\nthrough enchanted puzzles and magical creatures!';
  p.text(desc, CANVAS_WIDTH / 2, 170);
  
  // Controls
  p.fill(180, 180, 200);
  p.textSize(11);
  p.textAlign(p.LEFT, p.CENTER);
  const controlsX = 150;
  p.text('← → : Move', controlsX, 230);
  p.text('↑ : Jump', controlsX, 250);
  p.text('SPACE : Switch Character', controlsX, 270);
  p.text('SHIFT : Interact', controlsX, 290);
  
  // Start prompt (pulsing)
  const pulse = Math.sin(gameState.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 255, pulse * 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 340);
}

export function renderUI(p) {
  // Score and artifacts
  p.fill(255, 255, 255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Artifacts counter with icons
  p.textSize(14);
  p.text('Artifacts:', 10, 35);
  
  for (let i = 0; i < gameState.totalArtifacts; i++) {
    const x = 85 + i * 25;
    const y = 40;
    
    if (i < gameState.artifactsCollected) {
      // Collected - show filled crystal
      p.fill(100, 200, 255);
      p.stroke(80, 180, 235);
    } else {
      // Not collected - show outline
      p.noFill();
      p.stroke(100, 100, 100);
    }
    p.strokeWeight(2);
    
    // Diamond shape
    p.beginShape();
    p.vertex(x, y - 8);
    p.vertex(x + 8, y);
    p.vertex(x, y + 8);
    p.vertex(x - 8, y);
    p.endShape(p.CLOSE);
  }
  
  // Active character indicator
  p.fill(255, 255, 255);
  p.noStroke();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  const charName = gameState.activeCharacter === 'brother' ? 'Brother' : 'Sister';
  p.text(`Playing: ${charName}`, CANVAS_WIDTH - 10, 10);
  
  // Character portraits
  renderCharacterPortraits(p);
}

function renderCharacterPortraits(p) {
  const brother = gameState.brother;
  const sister = gameState.sister;
  
  if (!brother || !sister) return;
  
  const portraitSize = 30;
  const spacing = 40;
  const startX = CANVAS_WIDTH - 50;
  const startY = 35;
  
  // Brother portrait
  p.push();
  p.translate(startX, startY);
  
  if (gameState.activeCharacter === 'brother') {
    p.fill(255, 255, 255, 150);
    p.noStroke();
    p.circle(0, 0, portraitSize + 8);
  }
  
  p.fill(COLORS.brotherMain[0], COLORS.brotherMain[1], COLORS.brotherMain[2]);
  p.stroke(COLORS.brotherDark[0], COLORS.brotherDark[1], COLORS.brotherDark[2]);
  p.strokeWeight(2);
  p.circle(0, 0, portraitSize);
  p.pop();
  
  // Sister portrait
  p.push();
  p.translate(startX, startY + spacing);
  
  if (gameState.activeCharacter === 'sister') {
    p.fill(255, 255, 255, 150);
    p.noStroke();
    p.circle(0, 0, portraitSize + 8);
  }
  
  p.fill(COLORS.sisterMain[0], COLORS.sisterMain[1], COLORS.sisterMain[2]);
  p.stroke(COLORS.sisterDark[0], COLORS.sisterDark[1], COLORS.sisterDark[2]);
  p.strokeWeight(2);
  p.circle(0, 0, portraitSize);
  p.pop();
}

export function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(18);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  // Background overlay
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  if (isWin) {
    // Stars animation
    for (let i = 0; i < 20; i++) {
      const x = (gameState.frameCount * 2 + i * 30) % CANVAS_WIDTH;
      const y = 80 + Math.sin(gameState.frameCount * 0.05 + i) * 20;
      p.fill(255, 255, 200, 150);
      p.noStroke();
      p.push();
      p.translate(x, y);
      p.rotate(gameState.frameCount * 0.02 + i);
      drawStar(p, 0, 0, 3, 6, 5);
      p.pop();
    }
    
    p.fill(255, 220, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(54);
    p.text('Journey Complete!', CANVAS_WIDTH / 2, 100);
    
    p.fill(255, 255, 255);
    p.textSize(20);
    p.text('You found your way home!', CANVAS_WIDTH / 2, 160);
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('Lost Forever...', CANVAS_WIDTH / 2, 100);
  }
  
  // Final score
  p.fill(255, 255, 255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.textSize(18);
  p.text(`Artifacts: ${gameState.artifactsCollected}/${gameState.totalArtifacts}`, CANVAS_WIDTH / 2, 250);
  
  // Restart instruction
  const pulse = Math.sin(gameState.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 255, pulse * 255);
  p.textSize(20);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, 320);
}

function renderAnimatedBackground(p) {
  // Gradient background
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = y / CANVAS_HEIGHT;
    const c = p.lerpColor(
      p.color(135, 206, 235),
      p.color(255, 228, 181),
      inter
    );
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Floating particles
  for (let i = 0; i < 30; i++) {
    const x = (gameState.frameCount * 0.5 + i * 20) % CANVAS_WIDTH;
    const y = 50 + Math.sin(gameState.frameCount * 0.02 + i) * 150;
    const size = 3 + Math.sin(gameState.frameCount * 0.05 + i) * 2;
    
    p.fill(255, 255, 255, 100);
    p.noStroke();
    p.circle(x, y, size);
  }
}

function drawStar(p, x, y, radius1, radius2, npoints) {
  const angle = p.TWO_PI / npoints;
  const halfAngle = angle / 2.0;
  p.beginShape();
  for (let a = -p.PI / 2; a < p.TWO_PI - p.PI / 2; a += angle) {
    let sx = x + p.cos(a) * radius2;
    let sy = y + p.sin(a) * radius2;
    p.vertex(sx, sy);
    sx = x + p.cos(a + halfAngle) * radius1;
    sy = y + p.sin(a + halfAngle) * radius1;
    p.vertex(sx, sy);
  }
  p.endShape(p.CLOSE);
}

export function renderBackground(p) {
  // Sky gradient
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = y / CANVAS_HEIGHT;
    const c = p.lerpColor(
      p.color(COLORS.skyTop[0], COLORS.skyTop[1], COLORS.skyTop[2]),
      p.color(COLORS.skyBottom[0], COLORS.skyBottom[1], COLORS.skyBottom[2]),
      inter
    );
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Distant trees/forest silhouette
  p.noStroke();
  for (let i = 0; i < 20; i++) {
    const x = i * 60 - gameState.cameraX * 0.3;
    const h = 100 + Math.sin(i * 0.5) * 30;
    p.fill(60, 100, 60, 150);
    p.triangle(x, CANVAS_HEIGHT - 60, x + 30, CANVAS_HEIGHT - 60 - h, x + 60, CANVAS_HEIGHT - 60);
  }
  
  // Ground
  p.fill(COLORS.grass[0], COLORS.grass[1], COLORS.grass[2]);
  p.rect(0, CANVAS_HEIGHT - 40, CANVAS_WIDTH, 40);
  
  // Ground texture
  p.fill(COLORS.groundDark[0], COLORS.groundDark[1], COLORS.groundDark[2]);
  for (let i = 0; i < gameState.worldWidth; i += 20) {
    const x = i - gameState.cameraX;
    if (x > -20 && x < CANVAS_WIDTH + 20) {
      p.rect(x, CANVAS_HEIGHT - 35, 10, 5);
    }
  }
}