// renderer.js - Rendering functions for the game

import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  NUM_LANES,
  LANE_WIDTH,
  LANE_Y,
  PLAYER_SIZE,
  NECK_SEGMENT_HEIGHT,
  SEGMENT_WIDTH,
  PLAYER_COLORS,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE
} from './globals.js';

export class Renderer {
  constructor(p) {
    this.p = p;
    this.groundPattern = [];
    this.backgroundOffset = 0;
    this.initGroundPattern();
  }

  initGroundPattern() {
    for (let i = 0; i < 20; i++) {
      this.groundPattern.push({
        x: i * 50,
        type: Math.floor(this.p.random() * 3)
      });
    }
  }

  render(gameState) {
    const p = this.p;
    
    switch(gameState.gamePhase) {
      case PHASE_START:
        this.renderStartScreen();
        break;
      case PHASE_PLAYING:
        this.renderGame(gameState);
        break;
      case PHASE_PAUSED:
        this.renderGame(gameState);
        this.renderPauseOverlay();
        break;
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        this.renderGameOver(gameState);
        break;
    }
  }

  renderStartScreen() {
    const p = this.p;
    
    // Background
    p.background(20, 30, 50);
    
    // Title
    p.fill(255, 220, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("LONG NECK RUN", CANVAS_WIDTH / 2, 80);
    
    // Description
    p.fill(200);
    p.textSize(14);
    p.text("Navigate an endless runner with a growing neck!", CANVAS_WIDTH / 2, 140);
    p.text("Collect matching colored rings to grow your neck.", CANVAS_WIDTH / 2, 160);
    p.text("Avoid wrong colors and obstacles!", CANVAS_WIDTH / 2, 180);
    
    // Instructions
    p.fill(150, 200, 255);
    p.textSize(13);
    p.text("← → : Move Left/Right", CANVAS_WIDTH / 2, 220);
    p.text("↑ : Jump", CANVAS_WIDTH / 2, 240);
    p.text("↓ : Duck", CANVAS_WIDTH / 2, 260);
    
    // Tips
    p.fill(255, 200, 100);
    p.textSize(12);
    p.text("• Match your color to rings for +1 neck segment", CANVAS_WIDTH / 2, 290);
    p.text("• Wrong color removes 2 segments", CANVAS_WIDTH / 2, 305);
    p.text("• Your neck must be tall enough for ziplines!", CANVAS_WIDTH / 2, 320);
    p.text("• Duck under low barriers, jump over tall ones", CANVAS_WIDTH / 2, 335);
    
    // Start prompt
    p.fill(100, 255, 100);
    p.textSize(20);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  }

  renderGame(gameState) {
    const p = this.p;
    
    // Sky gradient background
    for (let y = 0; y < LANE_Y; y++) {
      const inter = y / LANE_Y;
      p.stroke(20 + inter * 40, 30 + inter * 60, 80 + inter * 100);
      p.line(0, y, CANVAS_WIDTH, y);
    }
    
    // Ground
    this.renderGround(gameState.currentSpeed);
    
    // Lanes
    this.renderLanes();
    
    // Rings
    gameState.rings.forEach(ring => {
      if (!ring.collected) {
        this.renderRing(ring);
      }
    });
    
    // Obstacles
    gameState.obstacles.forEach(obstacle => {
      this.renderObstacle(obstacle);
    });
    
    // Player
    if (gameState.player) {
      this.renderPlayer(gameState.player, gameState.neckLength, gameState.playerColor);
    }
    
    // UI
    this.renderUI(gameState);
  }

  renderGround(speed) {
    const p = this.p;
    
    this.backgroundOffset += speed;
    if (this.backgroundOffset >= 50) {
      this.backgroundOffset = 0;
    }
    
    p.fill(60, 80, 40);
    p.noStroke();
    p.rect(0, LANE_Y, CANVAS_WIDTH, CANVAS_HEIGHT - LANE_Y);
    
    // Ground details
    p.fill(50, 70, 30);
    for (let i = 0; i < this.groundPattern.length; i++) {
      const x = this.groundPattern[i].x - this.backgroundOffset;
      if (x > -50 && x < CANVAS_WIDTH + 50) {
        p.rect(x, LANE_Y + 10 + this.groundPattern[i].type * 5, 40, 5);
      }
    }
  }

  renderLanes() {
    const p = this.p;
    const startX = (CANVAS_WIDTH - NUM_LANES * LANE_WIDTH) / 2;
    
    p.stroke(100, 120, 80);
    p.strokeWeight(2);
    
    for (let i = 0; i <= NUM_LANES; i++) {
      const x = startX + i * LANE_WIDTH;
      p.line(x, LANE_Y - 150, x, LANE_Y);
    }
  }

  renderPlayer(player, neckLength, colorIndex) {
    const p = this.p;
    const color = PLAYER_COLORS[colorIndex];
    
    // Neck segments
    const baseY = player.y;
    const duckOffset = player.isDucking ? 15 : 0;
    
    for (let i = 0; i < neckLength; i++) {
      const segmentY = baseY - i * NECK_SEGMENT_HEIGHT + duckOffset;
      
      // Segment shadow
      p.fill(0, 0, 0, 30);
      p.noStroke();
      p.rect(player.x - SEGMENT_WIDTH / 2 + 2, segmentY - NECK_SEGMENT_HEIGHT / 2 + 2, 
             SEGMENT_WIDTH, NECK_SEGMENT_HEIGHT, 3);
      
      // Segment
      const brightness = 1 - (i / neckLength) * 0.3;
      p.fill(color[0] * brightness, color[1] * brightness, color[2] * brightness);
      p.stroke(color[0] * 0.6, color[1] * 0.6, color[2] * 0.6);
      p.strokeWeight(2);
      p.rect(player.x - SEGMENT_WIDTH / 2, segmentY - NECK_SEGMENT_HEIGHT / 2, 
             SEGMENT_WIDTH, NECK_SEGMENT_HEIGHT, 3);
    }
    
    // Head
    const headY = player.getHeadY(neckLength);
    
    // Head shadow
    p.fill(0, 0, 0, 40);
    p.noStroke();
    p.ellipse(player.x + 3, headY + 3, PLAYER_SIZE, PLAYER_SIZE);
    
    // Head
    p.fill(color[0], color[1], color[2]);
    p.stroke(color[0] * 0.7, color[1] * 0.7, color[2] * 0.7);
    p.strokeWeight(2);
    p.ellipse(player.x, headY, PLAYER_SIZE, PLAYER_SIZE);
    
    // Eyes
    p.fill(255);
    p.noStroke();
    p.ellipse(player.x - 6, headY - 3, 8, 8);
    p.ellipse(player.x + 6, headY - 3, 8, 8);
    p.fill(0);
    p.ellipse(player.x - 5, headY - 2, 4, 4);
    p.ellipse(player.x + 7, headY - 2, 4, 4);
    
    // Body (base)
    p.fill(color[0] * 0.8, color[1] * 0.8, color[2] * 0.8);
    p.stroke(color[0] * 0.6, color[1] * 0.6, color[2] * 0.6);
    p.strokeWeight(2);
    const bodyHeight = player.isDucking ? 15 : 25;
    p.rect(player.x - PLAYER_SIZE / 2 + 5, baseY - bodyHeight / 2, 
           PLAYER_SIZE - 10, bodyHeight, 5);
  }

  renderRing(ring) {
    const p = this.p;
    const color = PLAYER_COLORS[ring.colorIndex];
    
    p.push();
    p.translate(ring.x, ring.y);
    p.rotate(ring.rotation);
    
    // Ring glow
    p.noFill();
    p.stroke(color[0], color[1], color[2], 100);
    p.strokeWeight(8);
    p.ellipse(0, 0, ring.radius * 2 + 10, ring.radius * 2 + 10);
    
    // Ring
    p.stroke(color[0], color[1], color[2]);
    p.strokeWeight(ring.thickness);
    p.ellipse(0, 0, ring.radius * 2, ring.radius * 2);
    
    // Inner highlight
    p.stroke(255, 255, 255, 150);
    p.strokeWeight(2);
    p.arc(0, 0, ring.radius * 2 - 5, ring.radius * 2 - 5, -p.PI / 4, p.PI / 4);
    
    p.pop();
  }

  renderObstacle(obstacle) {
    const p = this.p;
    
    if (obstacle.type === "barrier") {
      // Tall barrier
      p.fill(100, 50, 50);
      p.stroke(80, 40, 40);
      p.strokeWeight(2);
      p.rect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 5);
      
      // Stripes
      p.stroke(120, 60, 60);
      p.strokeWeight(3);
      for (let i = 0; i < 3; i++) {
        const y = obstacle.y + (i + 1) * obstacle.height / 4;
        p.line(obstacle.x, y, obstacle.x + obstacle.width, y);
      }
    } else if (obstacle.type === "zipline") {
      // Zipline
      p.stroke(150, 150, 150);
      p.strokeWeight(3);
      p.line(obstacle.x, obstacle.y, obstacle.x + obstacle.width, obstacle.y);
      
      // Support posts
      p.fill(100, 100, 100);
      p.noStroke();
      p.rect(obstacle.x - 3, obstacle.y, 6, LANE_Y - obstacle.y);
      p.rect(obstacle.x + obstacle.width - 3, obstacle.y, 6, LANE_Y - obstacle.y);
      
      // Height indicator
      if (obstacle.minNeckHeight > 0) {
        p.fill(255, 200, 100);
        p.textSize(10);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(`${obstacle.minNeckHeight}`, obstacle.x + obstacle.width / 2, obstacle.y - 10);
      }
    } else if (obstacle.type === "low_barrier") {
      // Low barrier
      p.fill(80, 60, 40);
      p.stroke(60, 40, 20);
      p.strokeWeight(2);
      p.rect(obstacle.x, obstacle.y, obstacle.width, obstacle.height, 5);
      
      // Warning stripes
      p.fill(255, 200, 0);
      p.noStroke();
      for (let i = 0; i < 3; i++) {
        const y = obstacle.y + i * 15;
        p.triangle(
          obstacle.x + 10, y,
          obstacle.x + 20, y + 10,
          obstacle.x + 10, y + 10
        );
      }
    }
  }

  renderUI(gameState) {
    const p = this.p;
    
    // Score and distance
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.text(`Distance: ${Math.floor(gameState.distance)}`, 10, 10);
    p.text(`Neck: ${gameState.neckLength} segments`, 10, 30);
    p.text(`Speed: ${gameState.currentSpeed.toFixed(1)}x`, 10, 50);
    
    // Color indicator
    const color = PLAYER_COLORS[gameState.playerColor];
    p.fill(color[0], color[1], color[2]);
    p.stroke(255);
    p.strokeWeight(2);
    p.rect(10, 70, 30, 30, 5);
    p.fill(255);
    p.noStroke();
    p.textSize(10);
    p.text("Color", 45, 78);
  }

  renderPauseOverlay() {
    const p = this.p;
    
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }

  renderGameOver(gameState) {
    const p = this.p;
    
    // Dim background
    p.background(20, 20, 30);
    
    // Title
    const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
    p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text(isWin ? "AMAZING RUN!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
    
    // Stats
    p.fill(255);
    p.textSize(20);
    p.text(`Distance: ${Math.floor(gameState.distance)}`, CANVAS_WIDTH / 2, 180);
    p.text(`Final Neck Length: ${gameState.neckLength}`, CANVAS_WIDTH / 2, 210);
    p.text(`Max Speed: ${gameState.currentSpeed.toFixed(2)}x`, CANVAS_WIDTH / 2, 240);
    
    // Rewards
    p.fill(255, 220, 100);
    p.textSize(16);
    p.text(`Keys Earned: ${gameState.keys}`, CANVAS_WIDTH / 2, 280);
    p.text(`Gems Earned: ${gameState.gems}`, CANVAS_WIDTH / 2, 305);
    
    // Restart prompt
    p.fill(150, 200, 255);
    p.textSize(18);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
  }
}