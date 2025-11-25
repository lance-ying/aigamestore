// ui.js - UI rendering for all game screens

import {
  gameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAY_AREA_LEFT,
  PLAY_AREA_RIGHT,
  PLAY_AREA_TOP,
  PLAY_AREA_BOTTOM,
  PLAY_AREA_WIDTH,
  PLAY_AREA_HEIGHT,
  ITEM_COLLECTION_LINE,
  BENTLER_RED,
  BENTLER_BLUE,
  BENTLER_GREEN
} from './globals.js';

export function renderStartScreen(p) {
  // Background
  p.background(10, 10, 30);
  
  // Starfield effect
  for (let i = 0; i < 50; i++) {
    const x = (i * 17 + gameState.frameCount) % CANVAS_WIDTH;
    const y = (i * 23) % CANVAS_HEIGHT;
    const brightness = 150 + Math.sin(gameState.frameCount * 0.02 + i) * 100;
    p.fill(brightness);
    p.noStroke();
    p.circle(x, y, 2);
  }
  
  // Title
  p.fill(255, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text('Undefined Fantastic Object', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 200, 255);
  p.textSize(16);
  p.text('Mystical Bullet-Hell Shooter', CANVAS_WIDTH / 2, 120);
  
  // Description
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.CENTER, p.CENTER);
  const desc = [
    'A mysterious flying ship has appeared in the clouds!',
    'Shoot down enemies and collect Bentler items.',
    'Match 3 colors to summon powerful UFOs.',
    'Survive the bullet patterns and defeat the boss!'
  ];
  desc.forEach((line, i) => {
    p.text(line, CANVAS_WIDTH / 2, 160 + i * 20);
  });
  
  // Controls
  p.fill(200, 255, 200);
  p.textSize(14);
  p.text('Controls:', CANVAS_WIDTH / 2, 260);
  p.fill(255);
  p.textSize(11);
  const controls = [
    'Arrow Keys: Move',
    'Z: Shoot',
    'Shift: Focus (slow move)',
    'Space: Spell Card (bomb)',
    'ESC: Pause',
    'R: Restart'
  ];
  controls.forEach((line, i) => {
    p.text(line, CANVAS_WIDTH / 2, 280 + i * 16);
  });
  
  // Flashing prompt
  if (Math.floor(gameState.frameCount / 30) % 2 === 0) {
    p.fill(255, 255, 0);
    p.textSize(18);
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 380);
  }
}

export function renderPlayingUI(p) {
  // Play area border
  p.noFill();
  p.stroke(100, 100, 150);
  p.strokeWeight(2);
  p.rect(PLAY_AREA_LEFT, PLAY_AREA_TOP, PLAY_AREA_WIDTH, PLAY_AREA_HEIGHT);
  
  // Item collection line indicator
  p.stroke(255, 255, 0, 100);
  p.strokeWeight(1);
  p.line(PLAY_AREA_LEFT, ITEM_COLLECTION_LINE, PLAY_AREA_RIGHT, ITEM_COLLECTION_LINE);
  
  // Right panel background
  p.fill(20, 20, 40);
  p.noStroke();
  p.rect(PLAY_AREA_RIGHT, 0, CANVAS_WIDTH - PLAY_AREA_RIGHT, CANVAS_HEIGHT);
  
  // Score
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text('SCORE', PLAY_AREA_RIGHT + 10, 10);
  p.textSize(16);
  p.text(gameState.score.toString().padStart(10, '0'), PLAY_AREA_RIGHT + 10, 25);
  
  // Lives
  p.textSize(12);
  p.text('LIVES', PLAY_AREA_RIGHT + 10, 55);
  for (let i = 0; i < gameState.lives; i++) {
    p.fill(255, 100, 100);
    p.circle(PLAY_AREA_RIGHT + 20 + i * 20, 75, 12);
  }
  
  // Spell Cards (Bombs)
  p.fill(255);
  p.textSize(12);
  p.text('BOMBS', PLAY_AREA_RIGHT + 10, 95);
  for (let i = 0; i < gameState.spellCards; i++) {
    p.fill(100, 200, 255);
    p.star(PLAY_AREA_RIGHT + 20 + i * 20, 115, 6, 3, 5);
  }
  
  // Power
  p.fill(255);
  p.textSize(12);
  p.text('POWER', PLAY_AREA_RIGHT + 10, 135);
  p.textSize(14);
  p.text(gameState.power.toFixed(2) + ' / 4.00', PLAY_AREA_RIGHT + 10, 150);
  
  // Power bar
  const powerRatio = gameState.power / gameState.maxPower;
  p.fill(100, 0, 0);
  p.noStroke();
  p.rect(PLAY_AREA_RIGHT + 10, 170, 160, 15);
  p.fill(255, 0, 0);
  p.rect(PLAY_AREA_RIGHT + 10, 170, 160 * powerRatio, 15);
  p.noFill();
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(PLAY_AREA_RIGHT + 10, 170, 160, 15);
  
  // Bentler Stock
  p.fill(255);
  p.noStroke();
  p.textSize(12);
  p.text('BENTLER', PLAY_AREA_RIGHT + 10, 195);
  
  // Draw bentler stock
  gameState.bentlerStock.forEach((color, i) => {
    p.push();
    p.translate(PLAY_AREA_RIGHT + 30 + i * 30, 220);
    
    let rgb;
    switch (color) {
      case BENTLER_RED:
        rgb = [255, 100, 100];
        break;
      case BENTLER_BLUE:
        rgb = [100, 100, 255];
        break;
      case BENTLER_GREEN:
        rgb = [100, 255, 100];
        break;
      default:
        rgb = [255, 255, 255];
    }
    
    p.fill(...rgb);
    p.noStroke();
    p.beginShape();
    for (let j = 0; j < 5; j++) {
      const angle = (Math.PI * 2 / 5) * j - Math.PI / 2;
      const x = Math.cos(angle) * 10;
      const y = Math.sin(angle) * 10;
      p.vertex(x, y);
    }
    p.endShape(p.CLOSE);
    
    p.pop();
  });
  
  // Stage progress
  p.fill(255);
  p.textSize(12);
  p.text('STAGE 1', PLAY_AREA_RIGHT + 10, 250);
  p.text(`Enemies: ${gameState.enemiesKilled}/${gameState.requiredKills}`, 
    PLAY_AREA_RIGHT + 10, 270);
  
  // Progress bar
  const progressRatio = gameState.enemiesKilled / gameState.requiredKills;
  p.fill(50, 50, 100);
  p.noStroke();
  p.rect(PLAY_AREA_RIGHT + 10, 290, 160, 10);
  p.fill(100, 200, 255);
  p.rect(PLAY_AREA_RIGHT + 10, 290, 160 * progressRatio, 10);
  p.noFill();
  p.stroke(255);
  p.strokeWeight(1);
  p.rect(PLAY_AREA_RIGHT + 10, 290, 160, 10);
  
  // UFO info
  p.fill(255);
  p.textSize(10);
  p.text('UFO TYPES:', PLAY_AREA_RIGHT + 10, 315);
  p.text('3 Red: Life bonus', PLAY_AREA_RIGHT + 10, 330);
  p.text('3 Blue: Point boost', PLAY_AREA_RIGHT + 10, 342);
  p.text('3 Green: Bomb bonus', PLAY_AREA_RIGHT + 10, 354);
  p.text('Rainbow: Special!', PLAY_AREA_RIGHT + 10, 366);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(20);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
}

export function renderGameOver(p) {
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Title
  p.fill(isWin ? 255 : 255, isWin ? 255 : 100, isWin ? 100 : 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? 'STAGE CLEAR!' : 'GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  
  // Final score
  p.fill(255);
  p.textSize(20);
  p.text('Final Score', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  p.textSize(32);
  p.text(gameState.score.toString().padStart(10, '0'), CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  // Stats
  p.textSize(16);
  p.text(`Enemies Defeated: ${gameState.enemiesKilled}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  
  // Restart instruction
  if (Math.floor(gameState.frameCount / 30) % 2 === 0) {
    p.fill(255, 255, 0);
    p.textSize(20);
    p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
  }
}

// Helper function to draw a star
p5.prototype.star = function(x, y, radius1, radius2, npoints) {
  let angle = Math.PI * 2 / npoints;
  let halfAngle = angle / 2.0;
  this.beginShape();
  for (let a = -Math.PI / 2; a < Math.PI * 2 - Math.PI / 2; a += angle) {
    let sx = x + Math.cos(a) * radius1;
    let sy = y + Math.sin(a) * radius1;
    this.vertex(sx, sy);
    sx = x + Math.cos(a + halfAngle) * radius2;
    sy = y + Math.sin(a + halfAngle) * radius2;
    this.vertex(sx, sy);
  }
  this.endShape(this.CLOSE);
};