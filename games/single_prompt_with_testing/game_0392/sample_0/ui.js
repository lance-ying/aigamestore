import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_AREA_X, GAME_AREA_WIDTH } from './globals.js';

export function renderUI(p) {
  p.push();
  
  // Side panel background
  p.fill(20, 20, 40);
  p.noStroke();
  p.rect(GAME_AREA_X + GAME_AREA_WIDTH, 0, CANVAS_WIDTH - (GAME_AREA_X + GAME_AREA_WIDTH), CANVAS_HEIGHT);
  
  // Score
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text('Score', GAME_AREA_X + GAME_AREA_WIDTH + 10, 30);
  p.textSize(16);
  p.text(gameState.score, GAME_AREA_X + GAME_AREA_WIDTH + 10, 50);
  
  // Lives
  p.textSize(14);
  p.text('Lives', GAME_AREA_X + GAME_AREA_WIDTH + 10, 90);
  for (let i = 0; i < gameState.lives; i++) {
    p.fill(255, 50, 80);
    p.circle(GAME_AREA_X + GAME_AREA_WIDTH + 20 + i * 20, 115, 12);
  }
  
  // Life fragments
  for (let i = 0; i < gameState.lifeFragments; i++) {
    p.fill(255, 200, 100);
    p.star(GAME_AREA_X + GAME_AREA_WIDTH + 20 + i * 15, 135, 4, 8, 4);
  }
  
  // Spell Cards
  p.fill(255);
  p.textSize(14);
  p.text('Spells', GAME_AREA_X + GAME_AREA_WIDTH + 10, 150);
  for (let i = 0; i < gameState.spellCards; i++) {
    p.fill(255, 100, 255);
    p.rect(GAME_AREA_X + GAME_AREA_WIDTH + 15 + (i % 3) * 25, 170 + Math.floor(i / 3) * 25, 20, 20);
  }
  
  // Spell fragments
  for (let i = 0; i < gameState.spellFragments; i++) {
    p.fill(200, 100, 255);
    p.star(GAME_AREA_X + GAME_AREA_WIDTH + 20 + i * 15, 220, 3, 6, 5);
  }
  
  // Power
  p.fill(255);
  p.textSize(14);
  p.text('Power', GAME_AREA_X + GAME_AREA_WIDTH + 10, 240);
  p.textSize(16);
  p.text(gameState.power.toFixed(2) + '/' + gameState.maxPower.toFixed(2), 
         GAME_AREA_X + GAME_AREA_WIDTH + 10, 260);
  
  // Power bar
  p.fill(100, 100, 100);
  p.rect(GAME_AREA_X + GAME_AREA_WIDTH + 10, 285, 160, 10);
  p.fill(255, 100, 100);
  p.rect(GAME_AREA_X + GAME_AREA_WIDTH + 10, 285, 160 * (gameState.power / gameState.maxPower), 10);
  
  // Venturer items
  p.fill(255);
  p.textSize(14);
  p.text('Venturer', GAME_AREA_X + GAME_AREA_WIDTH + 10, 310);
  
  const venturerY = 330;
  // Red
  p.fill(255, 100, 100);
  for (let i = 0; i < gameState.venturer.red; i++) {
    p.circle(GAME_AREA_X + GAME_AREA_WIDTH + 20 + i * 15, venturerY, 10);
  }
  
  // Blue
  p.fill(100, 100, 255);
  for (let i = 0; i < gameState.venturer.blue; i++) {
    p.circle(GAME_AREA_X + GAME_AREA_WIDTH + 20 + i * 15, venturerY + 20, 10);
  }
  
  // Green
  p.fill(100, 255, 100);
  for (let i = 0; i < gameState.venturer.green; i++) {
    p.circle(GAME_AREA_X + GAME_AREA_WIDTH + 20 + i * 15, venturerY + 40, 10);
  }
  
  // Wave
  p.fill(255);
  p.textSize(12);
  p.text(`Wave ${gameState.wave}/${gameState.maxWave}`, 10, CANVAS_HEIGHT - 20);
  
  p.pop();
}

// Helper for star drawing
if (!window.p5.prototype.star) {
  window.p5.prototype.star = function(x, y, radius1, radius2, npoints) {
    let angle = this.TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    this.beginShape();
    for (let a = -this.HALF_PI; a < this.TWO_PI - this.HALF_PI; a += angle) {
      let sx = x + this.cos(a) * radius2;
      let sy = y + this.sin(a) * radius2;
      this.vertex(sx, sy);
      sx = x + this.cos(a + halfAngle) * radius1;
      sy = y + this.sin(a + halfAngle) * radius1;
      this.vertex(sx, sy);
    }
    this.endShape(this.CLOSE);
  };
}