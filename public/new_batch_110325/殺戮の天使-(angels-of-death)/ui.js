// ui.js - User interface rendering
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';

export class UI {
  constructor(p) {
    this.p = p;
    this.messageQueue = [];
    this.messageTimer = 0;
  }

  showMessage(text, duration = 120) {
    this.messageQueue.push({ text, duration, timer: 0 });
  }

  update() {
    this.messageQueue = this.messageQueue.filter(msg => {
      msg.timer++;
      return msg.timer < msg.duration;
    });
  }

  drawStartScreen() {
    const p = this.p;
    
    p.push();
    p.fill(0, 0, 0, 200);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Title
    p.fill(200, 50, 50);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(36);
    p.text("殺戮の天使", CANVAS_WIDTH/2, 80);
    
    p.fill(255, 255, 255);
    p.textSize(24);
    p.text("Angels of Death", CANVAS_WIDTH/2, 120);
    
    // Description
    p.textSize(14);
    p.fill(220, 220, 220);
    const desc = [
      "You are Rachel, trapped in a mysterious building.",
      "Navigate through dangerous floors, solve puzzles,",
      "and avoid deadly traps to escape.",
      "",
      "Find items, combine them, and use them wisely.",
      "One wrong move could be fatal."
    ];
    
    for (let i = 0; i < desc.length; i++) {
      p.text(desc[i], CANVAS_WIDTH/2, 170 + i * 20);
    }
    
    // Controls
    p.fill(200, 200, 255);
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    const controls = [
      "Arrow Keys: Move and climb",
      "SPACE: Interact with objects",
      "Z: Open/Close inventory",
      "SHIFT: Sprint",
      "ESC: Pause"
    ];
    
    for (let i = 0; i < controls.length; i++) {
      p.text(controls[i], 50, 290 + i * 16);
    }
    
    // Start prompt
    p.fill(255, 255, 100);
    p.textSize(18);
    p.textAlign(p.CENTER, p.CENTER);
    const alpha = (Math.sin(p.frameCount * 0.1) + 1) * 127 + 128;
    p.fill(255, 255, 100, alpha);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, 360);
    
    p.pop();
  }

  drawHUD() {
    const p = this.p;
    
    p.push();
    
    // Score
    p.fill(255, 255, 255);
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`Floor: ${gameState.currentFloor + 1}/${gameState.totalFloors}`, 10, 30);
    p.text(`Score: ${gameState.score}`, 10, 48);
    
    // Inventory count
    p.text(`Items: ${gameState.inventory.length}`, 10, 66);
    
    // Puzzle progress
    const solved = gameState.puzzlesSolved.length;
    const total = gameState.requiredPuzzles.length;
    p.text(`Puzzles: ${solved}/${total}`, 10, 84);
    
    // Interaction hint
    if (gameState.player) {
      const nearbyObj = gameState.player.canInteract(gameState.interactables);
      if (nearbyObj) {
        p.fill(255, 255, 100);
        p.textAlign(p.CENTER, p.TOP);
        p.text("Press SPACE to interact", CANVAS_WIDTH/2, 10);
      }
    }
    
    // Messages
    for (let i = 0; i < this.messageQueue.length; i++) {
      const msg = this.messageQueue[i];
      const alpha = Math.min(255, (msg.duration - msg.timer) * 5);
      p.fill(255, 255, 255, alpha);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(16);
      p.text(msg.text, CANVAS_WIDTH/2, 120 + i * 25);
    }
    
    p.pop();
  }

  drawInventory() {
    const p = this.p;
    
    p.push();
    
    // Semi-transparent background
    p.fill(0, 0, 0, 180);
    p.noStroke();
    p.rect(100, 80, 400, 240);
    
    // Border
    p.stroke(255, 255, 255);
    p.strokeWeight(2);
    p.noFill();
    p.rect(100, 80, 400, 240);
    
    // Title
    p.fill(255, 255, 255);
    p.textSize(20);
    p.textAlign(p.CENTER, p.TOP);
    p.text("INVENTORY", CANVAS_WIDTH/2, 90);
    
    // Items
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    
    if (gameState.inventory.length === 0) {
      p.fill(150, 150, 150);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("No items", CANVAS_WIDTH/2, 200);
    } else {
      for (let i = 0; i < gameState.inventory.length; i++) {
        const item = gameState.inventory[i];
        const x = 120 + (i % 3) * 120;
        const y = 130 + Math.floor(i / 3) * 60;
        
        // Item box
        if (i === gameState.selectedInventoryIndex) {
          p.fill(100, 100, 150);
        } else {
          p.fill(60, 60, 80);
        }
        p.rect(x, y, 100, 50, 5);
        
        // Item name
        p.fill(255, 255, 255);
        p.textSize(11);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(item.type.replace(/_/g, ' '), x + 50, y + 25);
      }
    }
    
    // Instructions
    p.fill(200, 200, 200);
    p.textSize(12);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text("Press Z to close", CANVAS_WIDTH/2, 310);
    
    p.pop();
  }

  drawPauseScreen() {
    const p = this.p;
    
    p.push();
    p.fill(255, 255, 255);
    p.textSize(16);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
    p.pop();
  }

  drawGameOverScreen(won) {
    const p = this.p;
    
    p.push();
    p.fill(0, 0, 0, 200);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Title
    if (won) {
      p.fill(100, 255, 100);
      p.textSize(48);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("ESCAPED!", CANVAS_WIDTH/2, 120);
      
      p.fill(255, 255, 255);
      p.textSize(20);
      p.text("You have successfully escaped the building!", CANVAS_WIDTH/2, 170);
      
      // Victory message
      p.textSize(16);
      p.fill(200, 200, 255);
      p.text("Rachel is free at last.", CANVAS_WIDTH/2, 210);
      p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 240);
      p.text(`Floors Completed: ${gameState.totalFloors}`, CANVAS_WIDTH/2, 265);
      
    } else {
      p.fill(255, 100, 100);
      p.textSize(48);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("GAME OVER", CANVAS_WIDTH/2, 120);
      
      p.fill(255, 255, 255);
      p.textSize(20);
      p.text(gameState.deathMessage || "You have died.", CANVAS_WIDTH/2, 170);
      
      p.textSize(16);
      p.fill(200, 200, 200);
      p.text(`Score: ${gameState.score}`, CANVAS_WIDTH/2, 210);
    }
    
    // Restart prompt
    p.fill(255, 255, 100);
    p.textSize(18);
    const alpha = (Math.sin(p.frameCount * 0.1) + 1) * 127 + 128;
    p.fill(255, 255, 100, alpha);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH/2, 320);
    
    p.pop();
  }
}