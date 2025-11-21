// renderer.js
import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PHASE_START, 
  PHASE_PLAYING, 
  PHASE_PAUSED, 
  PHASE_GAME_OVER_WIN,
  TIMELINE_PAST,
  TIMELINE_FUTURE
} from './globals.js';

export class Renderer {
  constructor(p, puzzleManager) {
    this.p = p;
    this.puzzleManager = puzzleManager;
  }

  render() {
    const p = this.p;
    p.background(20, 20, 30);
    
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
    const p = this.p;
    
    // Title
    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(100, 180, 255);
    p.textSize(48);
    p.text("THE PAST WITHIN", CANVAS_WIDTH / 2, 80);
    
    // Description
    p.fill(200, 200, 220);
    p.textSize(14);
    p.text("A Cooperative Puzzle Adventure Across Time", CANVAS_WIDTH / 2, 130);
    
    // Instructions box
    p.fill(40, 40, 60);
    p.rect(50, 160, CANVAS_WIDTH - 100, 180, 10);
    
    p.fill(220, 220, 240);
    p.textSize(12);
    p.textAlign(p.LEFT);
    p.text("OBJECTIVE:", 70, 185);
    p.textSize(11);
    p.fill(180, 180, 200);
    p.text("Work across two timelines to solve puzzles.", 70, 205);
    p.text("Complete 2 chapters by finding clues and items.", 70, 220);
    
    p.fill(220, 220, 240);
    p.textSize(12);
    p.text("CONTROLS:", 70, 245);
    p.textSize(11);
    p.fill(180, 180, 200);
    p.text("Arrow Keys: Navigate between objects", 70, 265);
    p.text("Space: Examine/Interact with object", 70, 280);
    p.text("Z: Use held item on selected object", 70, 295);
    p.text("Shift: Switch between Past/Future", 70, 310);
    p.text("ESC: Pause  |  R: Restart", 70, 325);
    
    // Start prompt
    p.fill(100, 255, 100);
    p.textSize(20);
    p.textAlign(p.CENTER);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
    p.pop();
  }

  renderGame() {
    const p = this.p;
    
    // Draw timeline background
    if (gameState.currentTimeline === TIMELINE_PAST) {
      this.renderPastTimeline();
    } else {
      this.renderFutureTimeline();
    }
    
    // Draw UI
    this.renderUI();
  }

  renderPastTimeline() {
    const p = this.p;
    
    // Past environment - warm sepia tones
    p.fill(80, 70, 50);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Wooden floor texture
    for (let i = 0; i < 10; i++) {
      p.stroke(60, 50, 30);
      p.strokeWeight(2);
      p.line(0, 50 + i * 35, CANVAS_WIDTH, 50 + i * 35);
    }
    p.noStroke();
    
    // Wall decorations
    p.fill(60, 50, 40);
    p.rect(20, 20, CANVAS_WIDTH - 40, 30);
    
    // Title
    p.fill(200, 180, 150);
    p.textAlign(p.CENTER);
    p.textSize(16);
    p.text("THE PAST", CANVAS_WIDTH / 2, 40);
    
    // Draw objects
    const objects = this.puzzleManager.getCurrentObjects(TIMELINE_PAST);
    objects.forEach((obj, idx) => {
      this.renderObject(obj, idx === gameState.selectedObjectIndex);
    });
  }

  renderFutureTimeline() {
    const p = this.p;
    
    // Future environment - cool tech colors
    p.fill(20, 30, 50);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Tech grid pattern
    p.stroke(40, 60, 100, 100);
    p.strokeWeight(1);
    for (let i = 0; i < 20; i++) {
      p.line(i * 30, 0, i * 30, CANVAS_HEIGHT);
      p.line(0, i * 20, CANVAS_WIDTH, i * 20);
    }
    p.noStroke();
    
    // Tech header
    p.fill(30, 40, 60);
    p.rect(20, 20, CANVAS_WIDTH - 40, 30);
    
    // Animated tech lines
    const offset = (p.frameCount * 2) % 100;
    p.stroke(80, 150, 255, 100);
    p.strokeWeight(2);
    p.line(20 + offset, 35, 100 + offset, 35);
    p.line(CANVAS_WIDTH - 100 - offset, 35, CANVAS_WIDTH - 20 - offset, 35);
    p.noStroke();
    
    // Title
    p.fill(80, 150, 255);
    p.textAlign(p.CENTER);
    p.textSize(16);
    p.text("THE FUTURE", CANVAS_WIDTH / 2, 40);
    
    // Draw objects
    const objects = this.puzzleManager.getCurrentObjects(TIMELINE_FUTURE);
    objects.forEach((obj, idx) => {
      this.renderObject(obj, idx === gameState.selectedObjectIndex);
    });
  }

  renderObject(obj, isSelected) {
    const p = this.p;
    const isPast = gameState.currentTimeline === TIMELINE_PAST;
    
    p.push();
    
    // Highlight if selected
    if (isSelected) {
      p.fill(255, 255, 100, 100);
      p.ellipse(obj.x, obj.y, 70, 70);
    }
    
    // Object icon
    if (isPast) {
      this.renderPastObject(obj, isSelected);
    } else {
      this.renderFutureObject(obj, isSelected);
    }
    
    // Object label
    p.fill(isSelected ? 255 : 180);
    p.textAlign(p.CENTER);
    p.textSize(10);
    p.text(obj.name, obj.x, obj.y + 40);
    
    // Status indicators
    if (obj.examined) {
      p.fill(100, 255, 100);
      p.ellipse(obj.x + 25, obj.y - 25, 8, 8);
    }
    if (obj.collected) {
      p.fill(255, 200, 100);
      p.ellipse(obj.x + 25, obj.y - 15, 8, 8);
    }
    if (obj.unlocked || obj.opened || obj.activated || obj.solved) {
      p.fill(255, 100, 255);
      p.ellipse(obj.x + 25, obj.y - 5, 8, 8);
    }
    
    p.pop();
  }

  renderPastObject(obj, isSelected) {
    const p = this.p;
    const color = isSelected ? [220, 200, 150] : [150, 130, 100];
    
    p.fill(...color);
    p.stroke(100, 80, 60);
    p.strokeWeight(2);
    
    switch (obj.id) {
      case "book":
        p.rect(obj.x - 15, obj.y - 20, 30, 40, 3);
        p.line(obj.x, obj.y - 20, obj.x, obj.y + 20);
        break;
      case "box":
        p.rect(obj.x - 20, obj.y - 15, 40, 30, 5);
        if (!obj.unlocked) {
          p.fill(80, 60, 40);
          p.rect(obj.x - 5, obj.y - 5, 10, 10);
        }
        break;
      case "key":
        p.ellipse(obj.x - 10, obj.y, 12, 12);
        p.rect(obj.x, obj.y - 2, 20, 4);
        break;
      case "painting":
        p.rect(obj.x - 25, obj.y - 20, 50, 40, 3);
        p.fill(200, 180, 100);
        p.rect(obj.x - 20, obj.y - 15, 40, 30);
        break;
      case "dial":
        p.ellipse(obj.x, obj.y, 40, 40);
        p.fill(200, 180, 150);
        for (let i = 0; i < 4; i++) {
          const angle = i * p.PI / 2;
          p.ellipse(obj.x + p.cos(angle) * 12, obj.y + p.sin(angle) * 12, 6, 6);
        }
        break;
      case "chest":
        p.rect(obj.x - 20, obj.y - 15, 40, 30, 5);
        if (obj.opened) {
          p.fill(255, 215, 0);
          p.ellipse(obj.x, obj.y - 5, 10, 10);
        }
        break;
    }
    
    p.noStroke();
  }

  renderFutureObject(obj, isSelected) {
    const p = this.p;
    const color = isSelected ? [100, 180, 255] : [60, 120, 200];
    
    p.fill(...color);
    p.stroke(40, 100, 180);
    p.strokeWeight(2);
    
    switch (obj.id) {
      case "console":
        p.rect(obj.x - 20, obj.y - 15, 40, 30, 5);
        if (obj.activated) {
          p.fill(100, 255, 100);
          p.ellipse(obj.x, obj.y - 5, 8, 8);
        }
        break;
      case "door":
        if (obj.opened) {
          p.fill(50, 100, 150);
          p.rect(obj.x - 25, obj.y - 25, 15, 50, 5);
          p.rect(obj.x + 10, obj.y - 25, 15, 50, 5);
        } else {
          p.rect(obj.x - 25, obj.y - 25, 50, 50, 5);
        }
        break;
      case "terminal":
        p.rect(obj.x - 20, obj.y - 20, 40, 40, 5);
        p.fill(20, 40, 60);
        p.rect(obj.x - 15, obj.y - 15, 30, 25);
        break;
      case "hologram":
        const pulse = p.sin(p.frameCount * 0.1) * 5;
        p.ellipse(obj.x, obj.y, 30 + pulse, 30 + pulse);
        p.fill(150, 200, 255, 150);
        p.ellipse(obj.x, obj.y, 20 + pulse, 20 + pulse);
        break;
      case "portal":
        const glow = p.sin(p.frameCount * 0.15) * 10;
        p.fill(100, 50, 200, 150);
        p.ellipse(obj.x, obj.y, 40 + glow, 50 + glow);
        if (obj.activated) {
          p.fill(255, 100, 255, 200);
          p.ellipse(obj.x, obj.y, 25 + glow, 35 + glow);
        }
        break;
      case "scanner":
        p.rect(obj.x - 15, obj.y - 20, 30, 40, 5);
        const scanLine = (p.frameCount * 3) % 40;
        p.stroke(100, 255, 200);
        p.line(obj.x - 15, obj.y - 20 + scanLine, obj.x + 15, obj.y - 20 + scanLine);
        break;
    }
    
    p.noStroke();
  }

  renderUI() {
    const p = this.p;
    
    // Top bar
    p.fill(0, 0, 0, 180);
    p.rect(0, 0, CANVAS_WIDTH, 60);
    
    // Chapter
    p.fill(255, 200, 100);
    p.textAlign(p.LEFT);
    p.textSize(14);
    p.text(`Chapter ${gameState.currentChapter}`, 15, 20);
    
    // Score
    p.fill(100, 255, 100);
    p.text(`Score: ${gameState.score}`, 15, 40);
    
    // Timeline indicator
    p.fill(gameState.currentTimeline === TIMELINE_PAST ? [255, 180, 100] : [100, 180, 255]);
    p.textAlign(p.RIGHT);
    p.text(`Timeline: ${gameState.currentTimeline}`, CANVAS_WIDTH - 15, 20);
    
    // Inventory
    if (gameState.inventory.length > 0) {
      p.fill(200, 200, 255);
      p.text(`Items: ${gameState.inventory.length}`, CANVAS_WIDTH - 15, 40);
    }
    
    // Hint text at bottom
    if (gameState.currentTimeline === TIMELINE_PAST) {
      p.fill(220, 200, 180, 200);
    } else {
      p.fill(150, 200, 255, 200);
    }
    p.textAlign(p.CENTER);
    p.textSize(11);
    p.text("Arrow Keys: Select | Space: Interact | Z: Use Item | Shift: Switch Timeline", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
  }

  renderPauseOverlay() {
    const p = this.p;
    
    p.fill(0, 0, 0, 150);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    p.textSize(16);
    p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  }

  renderGameOver() {
    const p = this.p;
    
    // Background
    p.background(20, 20, 40);
    
    // Victory effect
    for (let i = 0; i < 10; i++) {
      const angle = (p.frameCount * 0.02 + i * p.TWO_PI / 10);
      const x = CANVAS_WIDTH / 2 + p.cos(angle) * 150;
      const y = CANVAS_HEIGHT / 2 + p.sin(angle) * 100;
      p.fill(100 + i * 15, 180, 255, 100);
      p.ellipse(x, y, 20, 20);
    }
    
    // Victory message
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
    
    p.fill(200, 200, 255);
    p.textSize(24);
    p.text("You solved all puzzles across time!", CANVAS_WIDTH / 2, 160);
    
    // Stats
    p.fill(255, 200, 100);
    p.textSize(20);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
    p.text(`Chapters Completed: ${gameState.chaptersCompleted}`, CANVAS_WIDTH / 2, 250);
    
    // Restart prompt
    p.fill(100, 255, 255);
    p.textSize(18);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 330);
  }
}