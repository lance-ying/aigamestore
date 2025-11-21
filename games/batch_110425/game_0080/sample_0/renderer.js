// renderer.js - Handles all rendering

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, GAME_PHASES } from './globals.js';

export class Renderer {
  constructor(p) {
    this.p = p;
  }
  
  render() {
    const p = this.p;
    
    switch(gameState.gamePhase) {
      case GAME_PHASES.START:
        this.renderStartScreen();
        break;
      case GAME_PHASES.PLAYING:
      case GAME_PHASES.PAUSED:
        this.renderGame();
        if (gameState.gamePhase === GAME_PHASES.PAUSED) {
          this.renderPauseOverlay();
        }
        break;
      case GAME_PHASES.GAME_OVER_WIN:
      case GAME_PHASES.GAME_OVER_LOSE:
        this.renderGameOver();
        break;
    }
  }
  
  renderStartScreen() {
    const p = this.p;
    
    // Background
    p.background(15, 20, 35);
    
    // Animated stars
    p.noStroke();
    for (let i = 0; i < 50; i++) {
      const x = (i * 37 + p.frameCount * 0.5) % CANVAS_WIDTH;
      const y = (i * 53) % CANVAS_HEIGHT;
      const brightness = 150 + Math.sin(p.frameCount * 0.05 + i) * 50;
      p.fill(brightness, brightness, brightness + 50);
      p.circle(x, y, 2);
    }
    
    // Title
    p.fill(100, 200, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('异星要塞', CANVAS_WIDTH / 2, 80);
    
    p.textSize(20);
    p.fill(150, 180, 255);
    p.text('ALIEN FORTRESS', CANVAS_WIDTH / 2, 115);
    
    // Description
    p.textSize(14);
    p.fill(200, 200, 220);
    p.textAlign(p.CENTER, p.TOP);
    const desc = 'Survive waves of alien enemies in your combat mech.\nCollect upgrades and reach the exit portal.';
    p.text(desc, CANVAS_WIDTH / 2, 160);
    
    // Instructions
    p.textSize(12);
    p.fill(180, 180, 200);
    p.textAlign(p.LEFT, p.TOP);
    const instructions = [
      'ARROW KEYS: Move your mech',
      'SPACE: Dash (cooldown)',
      'SHIFT: Shield (limited charges)',
      'Z: Toggle auto-fire',
      '',
      'ESC: Pause game',
      'R: Restart from game over'
    ];
    
    let yPos = 220;
    for (let line of instructions) {
      p.text(line, 100, yPos);
      yPos += 18;
    }
    
    // Start prompt (pulsing)
    const pulse = 200 + Math.sin(p.frameCount * 0.1) * 55;
    p.fill(pulse, pulse, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 370);
  }
  
  renderGame() {
    const p = this.p;
    
    // Background
    p.background(20, 25, 40);
    
    // Grid
    this.renderGrid();
    
    // Particles (behind entities)
    for (let particle of gameState.particles) {
      particle.render();
    }
    
    // Pickups
    for (let pickup of gameState.pickups) {
      pickup.render();
    }
    
    // Bullets
    for (let bullet of gameState.bullets) {
      bullet.render();
    }
    for (let bullet of gameState.enemyBullets) {
      bullet.render();
    }
    
    // Enemies
    for (let enemy of gameState.enemies) {
      if (!enemy.isDead) {
        enemy.render();
      }
    }
    
    // Portal
    if (gameState.exitPortal) {
      gameState.exitPortal.render();
    }
    
    // Player
    if (gameState.player && !gameState.player.isDead) {
      gameState.player.render();
    }
    
    // UI
    this.renderUI();
  }
  
  renderGrid() {
    const p = this.p;
    
    p.stroke(40, 50, 70, 100);
    p.strokeWeight(1);
    
    const gridSize = 40;
    for (let x = 0; x < CANVAS_WIDTH; x += gridSize) {
      p.line(x, 0, x, CANVAS_HEIGHT);
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += gridSize) {
      p.line(0, y, CANVAS_WIDTH, y);
    }
  }
  
  renderUI() {
    const p = this.p;
    
    // Top bar background
    p.noStroke();
    p.fill(10, 15, 25, 200);
    p.rect(0, 0, CANVAS_WIDTH, 40);
    
    // Score
    p.fill(255, 255, 255);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(14);
    p.text(`SCORE: ${gameState.score}`, 10, 20);
    
    // Level and wave
    p.text(`LEVEL ${gameState.level} - WAVE ${gameState.wave}`, 150, 20);
    
    // Enemy counter
    const remaining = gameState.totalEnemiesForWave - gameState.enemiesDefeated;
    p.text(`ENEMIES: ${remaining}`, 350, 20);
    
    // Abilities cooldown indicators
    if (gameState.player) {
      const player = gameState.player;
      const barWidth = 40;
      const barHeight = 6;
      
      // Dash cooldown
      const dashX = 480;
      const dashY = 12;
      const dashProgress = Math.min(1, (gameState.frameCount - gameState.lastDashTime) / player.dashCooldown);
      
      p.fill(40, 40, 60);
      p.rect(dashX, dashY, barWidth, barHeight);
      p.fill(100, 200, 255);
      p.rect(dashX, dashY, barWidth * dashProgress, barHeight);
      
      p.fill(180, 180, 200);
      p.textSize(10);
      p.text('DASH', dashX, dashY - 8);
      
      // Shield charges
      const shieldX = 540;
      const shieldY = 20;
      
      p.textSize(10);
      p.text('SHIELD', shieldX, 12);
      
      for (let i = 0; i < 3; i++) {
        if (i < gameState.shieldCharges) {
          p.fill(100, 220, 255);
        } else {
          p.fill(40, 40, 60);
        }
        p.circle(shieldX + i * 12, shieldY, 8);
      }
    }
    
    // Wave complete message
    if (gameState.waveComplete && !gameState.exitPortal) {
      p.fill(100, 255, 150);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(20);
      p.text('WAVE COMPLETE!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
      p.textSize(14);
      p.text('Next wave incoming...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
    
    // Level complete message
    if (gameState.exitPortal && gameState.exitPortal.active) {
      p.fill(100, 200, 255);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(20);
      p.text('LEVEL COMPLETE!', CANVAS_WIDTH / 2, 80);
      p.textSize(14);
      p.text('Enter the portal to continue', CANVAS_WIDTH / 2, 105);
    }
  }
  
  renderPauseOverlay() {
    const p = this.p;
    
    // Semi-transparent overlay
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Pause text
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text('PAUSED', CANVAS_WIDTH - 10, 10);
    
    // Instructions
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
  
  renderGameOver() {
    const p = this.p;
    
    // Background
    p.background(15, 20, 35);
    
    const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
    
    // Title
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    
    if (isWin) {
      p.fill(100, 255, 150);
      p.text('VICTORY!', CANVAS_WIDTH / 2, 100);
    } else {
      p.fill(255, 100, 100);
      p.text('DEFEATED', CANVAS_WIDTH / 2, 100);
    }
    
    // Stats
    p.textSize(20);
    p.fill(200, 200, 220);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
    p.text(`Level Reached: ${gameState.level}`, CANVAS_WIDTH / 2, 210);
    p.text(`Waves Survived: ${gameState.wave - 1}`, CANVAS_WIDTH / 2, 240);
    
    // Message
    p.textSize(14);
    p.fill(180, 180, 200);
    if (isWin) {
      p.text('Excellent piloting, Commander!', CANVAS_WIDTH / 2, 290);
    } else {
      p.text('Your mech has been destroyed.', CANVAS_WIDTH / 2, 290);
    }
    
    // Restart prompt
    const pulse = 200 + Math.sin(p.frameCount * 0.1) * 55;
    p.fill(pulse, pulse, 255);
    p.textSize(16);
    p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 350);
  }
}