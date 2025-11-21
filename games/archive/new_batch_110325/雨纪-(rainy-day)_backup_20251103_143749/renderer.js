// renderer.js - Rendering logic for all game screens

import {
  gameState, PHASE_START, PHASE_PLAYING, PHASE_PAUSED,
  PHASE_GAME_OVER_WIN, CANVAS_WIDTH, CANVAS_HEIGHT
} from './globals.js';
import { gridToScreen } from './utils.js';

export class Renderer {
  constructor(p) {
    this.p = p;
    this.raindrops = [];
    this.initRain();
  }

  initRain() {
    for (let i = 0; i < 100; i++) {
      this.raindrops.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        speed: 3 + Math.random() * 3,
        length: 5 + Math.random() * 10
      });
    }
  }

  render() {
    this.p.background(30, 40, 55);

    switch (gameState.gamePhase) {
      case PHASE_START:
        this.renderStartScreen();
        break;
      case PHASE_PLAYING:
        this.renderGame();
        break;
      case PHASE_PAUSED:
        this.renderGame();
        this.renderPauseOverlay();
        break;
      case PHASE_GAME_OVER_WIN:
        this.renderGameOver();
        break;
    }
  }

  renderStartScreen() {
    // Draw rain effect
    this.drawRain();

    // Title
    this.p.push();
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.fill(200, 220, 255);
    this.p.textSize(48);
    this.p.text("雨纪", CANVAS_WIDTH / 2, 80);
    this.p.textSize(24);
    this.p.text("Rainy Day", CANVAS_WIDTH / 2, 120);

    // Description
    this.p.textSize(14);
    this.p.fill(180, 200, 220);
    const desc = [
      "Navigate through flooded city sections",
      "Activate light sources to recede water",
      "Collect cores and activate robots",
      "Reach the exit to complete each level"
    ];
    for (let i = 0; i < desc.length; i++) {
      this.p.text(desc[i], CANVAS_WIDTH / 2, 170 + i * 22);
    }

    // Controls
    this.p.fill(160, 180, 200);
    this.p.textSize(13);
    const controls = [
      "ARROW KEYS: Move to nearby points",
      "SPACE: Activate light/collect items",
      "Z: Toggle interactive selection",
      "ESC: Pause game",
      "R: Restart from beginning"
    ];
    for (let i = 0; i < controls.length; i++) {
      this.p.text(controls[i], CANVAS_WIDTH / 2, 270 + i * 20);
    }

    // Start prompt
    this.p.fill(255, 255, 200);
    this.p.textSize(18);
    const blink = Math.sin(this.p.frameCount * 0.1) > 0;
    if (blink) {
      this.p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
    }
    this.p.pop();
  }

  renderGame() {
    // Draw rain based on water level
    if (gameState.waterLevel > 1) {
      this.drawRain();
    }

    // Draw water overlay
    this.drawWaterOverlay();

    // Draw grid background
    this.drawGrid();

    // Sort entities by Y position for proper depth
    const sortedEntities = [...gameState.entities].sort((a, b) => {
      return (a.gridX + a.gridY) - (b.gridX + b.gridY);
    });

    // Render all entities
    for (const entity of sortedEntities) {
      if (entity.visible) {
        entity.render(this.p, gameState);
      }
    }

    // Draw UI
    this.drawUI();

    // Draw transition effect
    if (gameState.transition.active) {
      this.drawTransition();
    }
  }

  drawRain() {
    this.p.push();
    this.p.stroke(180, 200, 220, 100);
    this.p.strokeWeight(1);

    for (const drop of this.raindrops) {
      this.p.line(drop.x, drop.y, drop.x - 2, drop.y + drop.length);
      drop.y += drop.speed;
      drop.x -= 0.5;

      if (drop.y > CANVAS_HEIGHT) {
        drop.y = -drop.length;
        drop.x = Math.random() * CANVAS_WIDTH;
      }
      if (drop.x < 0) {
        drop.x = CANVAS_WIDTH;
      }
    }
    this.p.pop();
  }

  drawWaterOverlay() {
    if (gameState.waterLevel === 0) return;

    const alpha = gameState.waterLevel * 15;
    this.p.push();
    this.p.fill(100, 150, 200, alpha);
    this.p.noStroke();
    this.p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.p.pop();
  }

  drawGrid() {
    this.p.push();
    this.p.stroke(60, 70, 85, 80);
    this.p.strokeWeight(1);

    for (let gx = 0; gx <= 10; gx++) {
      for (let gy = 0; gy <= 7; gy++) {
        const screen = gridToScreen(gx, gy, 0);
        this.p.noFill();
        this.p.beginShape();
        this.p.vertex(screen.x - 16, screen.y);
        this.p.vertex(screen.x, screen.y - 8);
        this.p.vertex(screen.x + 16, screen.y);
        this.p.vertex(screen.x, screen.y + 8);
        this.p.endShape(this.p.CLOSE);
      }
    }
    this.p.pop();
  }

  drawUI() {
    this.p.push();
    this.p.textAlign(this.p.LEFT, this.p.TOP);
    this.p.fill(255, 255, 255);
    this.p.textSize(14);

    // Level info
    this.p.text(`Level: ${gameState.currentLevel}/${gameState.maxLevel}`, 10, 10);
    this.p.text(`Score: ${gameState.score}`, 10, 30);
    this.p.text(`Moves: ${gameState.moves}`, 10, 50);

    // Collectibles
    this.p.text(`Cores: ${gameState.collectedCores}/${gameState.totalCores}`, 10, 70);
    this.p.text(`Robots: ${gameState.activatedRobots}/${gameState.totalRobots}`, 10, 90);

    // Water level indicator
    this.p.textAlign(this.p.RIGHT, this.p.TOP);
    const waterText = ['None', 'Low', 'Mid', 'High'][gameState.waterLevel];
    this.p.text(`Water: ${waterText}`, CANVAS_WIDTH - 10, 10);

    this.p.pop();
  }

  drawTransition() {
    this.p.push();
    const alpha = (1 - Math.abs(gameState.transition.progress * 2 - 1)) * 255;
    this.p.fill(30, 40, 55, alpha);
    this.p.noStroke();
    this.p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.p.pop();
  }

  renderPauseOverlay() {
    this.p.push();
    this.p.fill(0, 0, 0, 100);
    this.p.noStroke();
    this.p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.p.textAlign(this.p.RIGHT, this.p.TOP);
    this.p.fill(255, 255, 200);
    this.p.textSize(16);
    this.p.text("PAUSED", CANVAS_WIDTH - 10, 10);
    this.p.pop();
  }

  renderGameOver() {
    // Draw rain effect
    this.drawRain();

    this.p.push();
    this.p.textAlign(this.p.CENTER, this.p.CENTER);

    // Victory message
    this.p.fill(200, 255, 200);
    this.p.textSize(48);
    this.p.text("Victory!", CANVAS_WIDTH / 2, 100);

    // Level complete
    this.p.fill(180, 220, 180);
    this.p.textSize(24);
    this.p.text(`Level ${gameState.currentLevel} Complete`, CANVAS_WIDTH / 2, 150);

    // Stats
    this.p.textSize(18);
    this.p.fill(160, 200, 160);
    this.p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
    this.p.text(`Moves Used: ${gameState.moves}`, CANVAS_WIDTH / 2, 230);
    this.p.text(`Cores: ${gameState.collectedCores}/${gameState.totalCores}`, CANVAS_WIDTH / 2, 260);
    this.p.text(`Robots: ${gameState.activatedRobots}/${gameState.totalRobots}`, CANVAS_WIDTH / 2, 290);

    // Restart prompt
    this.p.fill(255, 255, 200);
    this.p.textSize(16);
    this.p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);

    this.p.pop();
  }
}