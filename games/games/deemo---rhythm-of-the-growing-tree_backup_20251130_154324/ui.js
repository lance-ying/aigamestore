// ui.js - UI rendering
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  JUDGMENT_LINE_Y,
  NUM_LANES,
  LANE_WIDTH,
  TREE_HEIGHT_TARGET,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_LOADING_LEVEL,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  gameState,
  MAX_MISSES
} from './globals.js';

export class UI {
  constructor(p) {
    this.p = p;
    this.feedbackText = "";
    this.feedbackAlpha = 0;
    this.feedbackX = 0;
    this.feedbackY = 0;
  }

  showFeedback(text, x, y) {
    this.feedbackText = text;
    this.feedbackAlpha = 255;
    this.feedbackX = x;
    this.feedbackY = y;
  }

  update() {
    this.feedbackAlpha *= 0.95;
  }

  renderStartScreen() {
    const p = this.p;
    p.push();

    // Background gradient
    for (let i = 0; i < CANVAS_HEIGHT; i++) {
      const inter = i / CANVAS_HEIGHT;
      p.stroke(20 + inter * 30, 20 + inter * 40, 40 + inter * 60);
      p.line(0, i, CANVAS_WIDTH, i);
    }

    // Title
    p.textAlign(p.CENTER, p.CENTER);
    p.noStroke();
    p.fill(150, 200, 255);
    p.textSize(48);
    p.text("DEEMO", CANVAS_WIDTH / 2, 60);

    // Subtitle
    p.fill(200, 220, 255);
    p.textSize(16);
    p.text("Rhythm of the Growing Tree", CANVAS_WIDTH / 2, 100);

    // Instructions box
    p.fill(30, 40, 60, 200);
    p.rect(50, 140, CANVAS_WIDTH - 100, 180, 10);

    // Instructions
    p.fill(255);
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    const instructions = [
      "OBJECTIVE:",
      "Hit falling notes with perfect timing to grow the tree.",
      "Complete songs to unlock new levels.",
      "",
      "CONTROLS:",
      "← → Arrow Keys: Move between lanes",
      "SPACE: Hit Red/Green notes",
      "Z: Hit Yellow notes",
      "",
      "Build combos for bonus points and faster tree growth!"
    ];

    let yPos = 150;
    for (let line of instructions) {
      p.text(line, 70, yPos);
      yPos += 18;
    }

    // Start prompt
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(100, 255, 150);
    p.textSize(20);
    const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
    p.fill(100 * pulse, 255 * pulse, 150 * pulse);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);

    p.pop();
  }

  renderGameplay() {
    const p = this.p;
    p.push();

    // Background gradient based on current song
    let topColor = [10, 10, 20];
    let bottomColor = [20, 20, 40];

    if (gameState.currentSong && gameState.currentSong.bgColor) {
      topColor = gameState.currentSong.bgColor.top;
      bottomColor = gameState.currentSong.bgColor.bottom;
    }

    for (let i = 0; i < CANVAS_HEIGHT; i++) {
      const inter = i / CANVAS_HEIGHT;
      p.stroke(
        p.lerp(topColor[0], bottomColor[0], inter),
        p.lerp(topColor[1], bottomColor[1], inter),
        p.lerp(topColor[2], bottomColor[2], inter)
      );
      p.line(0, i, CANVAS_WIDTH, i);
    }

    // Lane dividers
    p.stroke(60, 60, 80, 150);
    p.strokeWeight(1);
    for (let i = 1; i < NUM_LANES; i++) {
      const x = i * LANE_WIDTH;
      p.line(x, 0, x, JUDGMENT_LINE_Y + 50);
    }

    // Judgment line
    p.stroke(255, 255, 255, 200);
    p.strokeWeight(3);
    p.line(0, JUDGMENT_LINE_Y, CANVAS_WIDTH, JUDGMENT_LINE_Y);
    
    // Judgment line glow
    p.stroke(100, 200, 255, 100);
    p.strokeWeight(6);
    p.line(0, JUDGMENT_LINE_Y, CANVAS_WIDTH, JUDGMENT_LINE_Y);

    p.pop();

    // Render HUD
    this.renderHUD();

    // Render feedback
    if (this.feedbackAlpha > 10) {
      this.renderFeedback();
    }
  }

  renderHUD() {
    const p = this.p;
    p.push();

    // Semi-transparent background for HUD
    p.noStroke();
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, 60);

    // Score
    p.fill(255);
    p.textSize(18);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`SCORE: ${gameState.score}`, 10, 10);

    // Combo
    if (gameState.combo > 0) {
      const comboColor = gameState.combo > 20 ? [255, 200, 0] : [100, 200, 255];
      p.fill(...comboColor);
      p.textSize(16);
      p.text(`COMBO: ${gameState.combo}`, 10, 35);
    }

    // Misses
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(16);
    p.text(`Misses: ${gameState.missesInLevel} / ${MAX_MISSES}`, CANVAS_WIDTH / 2, 35);

    // Tree height - Continuous growth, removed cap from text
    p.fill(100, 255, 150);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(18);
    p.text(`Tree: ${gameState.treeHeight.toFixed(1)}m`, CANVAS_WIDTH - 10, 10);

    // Song info
    if (gameState.currentSong) {
      p.fill(200);
      p.textSize(14);
      p.text(gameState.currentSong.name, CANVAS_WIDTH - 10, 35);
    }

    // Progress bar (Visual only, caps at full)
    const progress = Math.min(gameState.treeHeight / TREE_HEIGHT_TARGET, 1);
    p.fill(40, 40, 60);
    p.rect(10, 55, CANVAS_WIDTH - 20, 5);
    p.fill(100, 255, 150);
    p.rect(10, 55, (CANVAS_WIDTH - 20) * progress, 5);

    p.pop();
  }

  renderFeedback() {
    const p = this.p;
    p.push();

    p.textAlign(p.CENTER, p.CENTER);
    p.noStroke();
    
    let textColor = [255, 255, 255];
    let textSize = 24;

    if (this.feedbackText === "Perfect") {
      textColor = [255, 220, 0];
      textSize = 28;
    } else if (this.feedbackText === "Great") {
      textColor = [100, 255, 100];
      textSize = 26;
    } else if (this.feedbackText === "Good") {
      textColor = [100, 200, 255];
      textSize = 24;
    } else if (this.feedbackText === "Miss") {
      textColor = [255, 100, 100];
      textSize = 22;
    } else if (this.feedbackText === "Hold Start") {
      textColor = [100, 255, 150];
      textSize = 22;
    }

    p.fill(...textColor, this.feedbackAlpha);
    p.textSize(textSize);
    p.text(this.feedbackText, this.feedbackX, this.feedbackY - 40);

    p.pop();
  }

  renderPauseIndicator() {
    const p = this.p;
    p.push();
    
    p.fill(255, 255, 0);
    p.textSize(16);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);

    p.pop();
  }

  renderLoadingScreen() {
    const p = this.p;
    p.push();

    // Semi-transparent overlay
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    p.textAlign(p.CENTER, p.CENTER);
    p.noStroke();

    // Level Complete Text
    p.fill(255, 220, 100);
    p.textSize(36);
    p.text("LEVEL COMPLETE", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

    // Loading Text
    p.fill(200, 255, 200);
    p.textSize(20);
    // Simple pulsing animation
    const dots = ".".repeat(Math.floor(p.frameCount / 20) % 4);
    p.text(`Loading next memory${dots}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

    p.pop();
  }

  renderGameOverScreen(isWin) {
    const p = this.p;
    p.push();

    // Semi-transparent overlay
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Result message
    p.textAlign(p.CENTER, p.CENTER);
    p.noStroke();
    
    if (isWin) {
      p.fill(255, 220, 100);
      p.textSize(48);
      p.text("STORY COMPLETE!", CANVAS_WIDTH / 2, 100);
      
      p.fill(200, 255, 200);
      p.textSize(20);
      p.text("The tree has reached its full height!", CANVAS_WIDTH / 2, 150);
      p.text("The memories are now complete.", CANVAS_WIDTH / 2, 180);
    } else {
      p.fill(200, 100, 100);
      p.textSize(36);
      p.text("GAME OVER", CANVAS_WIDTH / 2, 80);
      p.textSize(24);
      p.text("Too many misses", CANVAS_WIDTH / 2, 120);
    }

    // Stats box
    p.fill(30, 40, 60, 220);
    p.rect(100, 200, CANVAS_WIDTH - 200, 120, 10);

    p.fill(255);
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Final Score: ${gameState.score}`, 120, 215);
    p.text(`Max Combo: ${gameState.maxCombo}`, 120, 240);
    p.text(`Tree Height: ${gameState.treeHeight.toFixed(1)}m`, 120, 265);
    p.text(`Perfect: ${gameState.perfectHits}  Great: ${gameState.greatHits}`, 120, 290);

    // Restart prompt
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(150, 200, 255);
    p.textSize(20);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);

    p.pop();
  }
}