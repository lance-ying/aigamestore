import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class UI {
  constructor(p) {
    this.p = p;
  }

  drawStartScreen() {
    const p = this.p;
    
    p.push();
    // Background
    p.background(20, 10, 40);
    this.drawStarfield();
    
    // Title
    p.fill(255, 200, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('タイムサーファー', CANVAS_WIDTH / 2, 80);
    
    p.fill(150, 200, 255);
    p.textSize(24);
    p.text('TIME SURFER', CANVAS_WIDTH / 2, 120);
    
    // Description
    p.fill(200, 200, 200);
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    const desc = [
      'Surf across cosmic platforms and collect gems!',
      'Dive to gain speed, rise to avoid obstacles.',
      'Use time rewind to escape danger.',
      'Stay ahead of the cosmic end!'
    ];
    for (let i = 0; i < desc.length; i++) {
      p.text(desc[i], CANVAS_WIDTH / 2, 170 + i * 20);
    }
    
    // Controls
    p.fill(255, 255, 150);
    p.textSize(16);
    p.text('CONTROLS', CANVAS_WIDTH / 2, 280);
    
    p.fill(200, 200, 200);
    p.textSize(13);
    p.textAlign(p.LEFT, p.CENTER);
    const controls = [
      'SPACE: Hold to dive, Release to rise',
      'Z: Activate time rewind (costs energy)',
      'ESC: Pause game',
      'R: Restart to menu'
    ];
    for (let i = 0; i < controls.length; i++) {
      p.text(controls[i], 150, 310 + i * 20);
    }
    
    // Start prompt
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(20);
    const pulse = p.sin(p.frameCount * 0.1) * 20 + 235;
    p.fill(pulse, 255, pulse);
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 380);
    p.pop();
  }

  drawGameOver(won) {
    const p = this.p;
    
    p.push();
    p.fill(0, 0, 0, 180);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Message
    if (won) {
      p.fill(100, 255, 100);
      p.textSize(48);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('VICTORY!', CANVAS_WIDTH / 2, 120);
    } else {
      p.fill(255, 100, 100);
      p.textSize(48);
      p.textAlign(p.CENTER, p.CENTER);
      p.text('GAME OVER', CANVAS_WIDTH / 2, 120);
    }
    
    // Score
    p.fill(255, 255, 255);
    p.textSize(24);
    p.text('Final Score: ' + Math.floor(gameState.score), CANVAS_WIDTH / 2, 180);
    p.text('Distance: ' + Math.floor(gameState.distanceTraveled) + 'm', CANVAS_WIDTH / 2, 210);
    
    // Restart prompt
    p.fill(200, 200, 200);
    p.textSize(18);
    p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 280);
    p.pop();
  }

  drawPaused() {
    const p = this.p;
    p.push();
    p.fill(255, 255, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text('PAUSED', CANVAS_WIDTH - 10, 10);
    p.pop();
  }

  drawHUD() {
    const p = this.p;
    
    p.push();
    // Score
    p.fill(255, 255, 255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(18);
    p.text('Score: ' + Math.floor(gameState.score), 10, 10);
    p.text('Distance: ' + Math.floor(gameState.distanceTraveled) + 'm', 10, 35);
    
    // Time energy bar
    p.fill(200, 200, 200);
    p.textSize(14);
    p.text('Time Energy', 10, 65);
    
    const barWidth = 150;
    const barHeight = 20;
    const barX = 10;
    const barY = 85;
    
    // Bar background
    p.fill(40, 40, 60);
    p.stroke(100, 100, 120);
    p.strokeWeight(2);
    p.rect(barX, barY, barWidth, barHeight);
    
    // Bar fill
    const fillWidth = (gameState.timeEnergy / gameState.maxTimeEnergy) * barWidth;
    const barColor = gameState.timeEnergy > 30 ? [150, 100, 255] : [255, 100, 100];
    p.noStroke();
    p.fill(...barColor);
    p.rect(barX, barY, fillWidth, barHeight);
    
    // Bar text
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text(Math.floor(gameState.timeEnergy) + '%', barX + barWidth / 2, barY + barHeight / 2);
    
    p.pop();
  }

  drawStarfield() {
    const p = this.p;
    p.push();
    p.noStroke();
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % CANVAS_WIDTH;
      const y = (i * 73) % CANVAS_HEIGHT;
      const size = ((i * 13) % 3) + 1;
      const brightness = 150 + ((i * 17) % 105);
      p.fill(brightness);
      p.circle(x, y, size);
    }
    p.pop();
  }

  drawBackground() {
    const p = this.p;
    
    // Gradient background
    for (let y = 0; y < CANVAS_HEIGHT; y++) {
      const c1 = [20, 10, 40];
      const c2 = [60, 30, 80];
      const amt = y / CANVAS_HEIGHT;
      p.stroke(
        p.lerp(c1[0], c2[0], amt),
        p.lerp(c1[1], c2[1], amt),
        p.lerp(c1[2], c2[2], amt)
      );
      p.line(0, y, CANVAS_WIDTH, y);
    }
    
    // Moving stars
    this.drawStarfield();
  }
}