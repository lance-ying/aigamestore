import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, HIT_ZONE_X, HIT_ZONE_WIDTH, LANE_Y_POSITIONS } from './globals.js';

export class Renderer {
  constructor(p) {
    this.p = p;
    this.bgStars = [];
    
    // Create background stars
    for (let i = 0; i < 50; i++) {
      this.bgStars.push({
        x: this.p.random(CANVAS_WIDTH),
        y: this.p.random(CANVAS_HEIGHT),
        size: this.p.random(1, 3),
        speed: this.p.random(0.5, 2)
      });
    }
  }

  render() {
    this.p.background(20, 15, 40);
    
    if (gameState.gamePhase === GAME_PHASES.START) {
      this.renderStartScreen();
    } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
      this.renderGame();
    } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
      this.renderGame();
      // Removed renderPauseOverlay call to hide "PAUSED" text and overlay
    } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
               gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
      this.renderGameOver();
    }
  }

  renderBackground() {
    // Animated stars
    for (let star of this.bgStars) {
      star.x -= star.speed * gameState.difficulty;
      if (star.x < 0) star.x = CANVAS_WIDTH;
      
      this.p.noStroke();
      this.p.fill(255, 255, 255, 150);
      this.p.ellipse(star.x, star.y, star.size, star.size);
    }
    
    // Lane lines
    this.p.stroke(80, 70, 120, 100);
    this.p.strokeWeight(2);
    this.p.line(0, 150, CANVAS_WIDTH, 150);
    this.p.line(0, 250, CANVAS_WIDTH, 250);
    
    // Highway divider
    this.p.stroke(100, 90, 150, 80);
    this.p.strokeWeight(3);
    for (let i = 0; i < CANVAS_WIDTH; i += 40) {
      this.p.line(i, 200, i + 20, 200);
    }
  }

  renderHitZone() {
    // Hit zone indicator
    this.p.noFill();
    this.p.stroke(100, 255, 100, 150);
    this.p.strokeWeight(3);
    this.p.rect(HIT_ZONE_X - HIT_ZONE_WIDTH/2, 120, HIT_ZONE_WIDTH, 180);
    
    // Perfect hit line
    this.p.stroke(255, 255, 100, 200);
    this.p.strokeWeight(2);
    this.p.line(HIT_ZONE_X, 120, HIT_ZONE_X, 300);
    
    // Lane labels - showing which arrow key corresponds to which lane
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(14);
    this.p.textStyle(this.p.BOLD);
    
    // Upper lane - LEFT ARROW
    this.p.fill(100, 255, 100);
    this.p.noStroke();
    this.p.text('LEFT ←', HIT_ZONE_X, 130);
    
    // Lower lane - RIGHT ARROW
    this.p.fill(100, 255, 100);
    this.p.text('RIGHT →', HIT_ZONE_X, 290);
    
    this.p.textStyle(this.p.NORMAL);
  }

  renderUI() {
    // Score
    this.p.fill(255);
    this.p.noStroke();
    this.p.textAlign(this.p.LEFT, this.p.TOP);
    this.p.textSize(20);
    this.p.text(`Score: ${gameState.score}`, 10, 10);
    
    // Combo
    if (gameState.combo > 0) {
      const comboColor = gameState.combo > 10 ? [255, 215, 0] : [255, 255, 255];
      this.p.fill(...comboColor);
      this.p.textSize(24);
      this.p.text(`Combo: ${gameState.combo}x`, 10, 35);
    }
    
    // Multiplier
    if (gameState.scoreMultiplier > 1.0) {
      this.p.fill(150, 255, 150);
      this.p.textSize(16);
      this.p.text(`Multiplier: ${gameState.scoreMultiplier.toFixed(1)}x`, 10, 65);
    }
    
    // Misses
    this.p.fill(255, 100, 100);
    this.p.textSize(16);
    this.p.text(`Misses: ${gameState.missedNotes}/${gameState.maxMisses}`, 10, 85);
    
    // Special meter
    this.p.noStroke();
    this.p.fill(50, 50, 80);
    this.p.rect(CANVAS_WIDTH - 120, 10, 110, 20);
    
    const meterColor = gameState.specialMeter >= 100 ? [255, 255, 100] : [100, 150, 255];
    this.p.fill(...meterColor);
    this.p.rect(CANVAS_WIDTH - 120, 10, (gameState.specialMeter / 100) * 110, 20);
    
    this.p.fill(255);
    this.p.textSize(12);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.text('SPECIAL', CANVAS_WIDTH - 65, 20);
    
    // Special active indicator
    if (gameState.specialActive) {
      this.p.fill(255, 255, 100);
      this.p.textSize(18);
      this.p.textAlign(this.p.CENTER, this.p.TOP);
      this.p.text('SPECIAL ACTIVE!', CANVAS_WIDTH / 2, 10);
    }
  }

  renderGame() {
    this.renderBackground();
    this.renderHitZone();
    
    // Render enemies first
    for (let enemy of gameState.enemies) {
      if (enemy && enemy.active) {
        enemy.draw();
      }
    }
    
    // Render notes
    for (let note of gameState.notes) {
      if (note && note.active) {
        note.draw();
      }
    }
    
    // Render elfins
    for (let elfin of gameState.elfins) {
      if (elfin && elfin.active) {
        elfin.draw();
      }
    }
    
    // Render particles
    for (let particle of gameState.particles) {
      if (particle && particle.active) {
        particle.draw(this.p);
      }
    }
    
    // Render player on top
    if (gameState.player) {
      gameState.player.draw();
    }
    
    this.renderUI();
  }

  renderStartScreen() {
    this.renderBackground();
    
    this.p.fill(255);
    this.p.noStroke();
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(32);
    this.p.text('press enter to begin', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }

  renderGameOver() {
    this.renderBackground();
    
    const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
    
    // Title
    this.p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
    this.p.noStroke();
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(48);
    this.p.text(isWin ? 'VICTORY!' : 'GAME OVER', CANVAS_WIDTH / 2, 100);
    
    // Stats
    this.p.fill(255);
    this.p.textSize(20);
    const stats = [
      `Final Score: ${gameState.score}`,
      `Max Combo: ${gameState.maxCombo}`,
      `Perfect Hits: ${gameState.perfectHits}`,
      `Notes Hit: ${gameState.notesHit}`,
      `Missed: ${gameState.missedNotes}`
    ];
    
    let yPos = 180;
    for (let stat of stats) {
      this.p.text(stat, CANVAS_WIDTH / 2, yPos);
      yPos += 30;
    }
    
    // Restart prompt
    this.p.fill(255, 215, 0);
    this.p.textSize(24);
    const pulse = this.p.sin(this.p.frameCount * 0.1) * 20 + 235;
    this.p.fill(pulse, pulse, 100);
    this.p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 360);
  }
}