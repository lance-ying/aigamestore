// ui_manager.js - UI rendering and management
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, STORY_DATA, CLUE_DATA } from './globals.js';

export class UIManager {
  constructor(p) {
    this.p = p;
  }
  
  drawStartScreen() {
    const p = this.p;
    
    p.background(30, 30, 50);
    
    // Title
    p.push();
    p.fill(255, 215, 0);
    p.textAlign(p.CENTER);
    p.textSize(32);
    p.text("Die drei ??? – Ruf der Trolle", CANVAS_WIDTH/2, 80);
    
    p.fill(200, 200, 255);
    p.textSize(14);
    p.text("The Three Investigators", CANVAS_WIDTH/2, 110);
    p.pop();
    
    // Story intro
    p.push();
    p.fill(220, 220, 220);
    p.textAlign(p.CENTER);
    p.textSize(12);
    const lines = this.wrapText(STORY_DATA.prologue, 500);
    lines.forEach((line, i) => {
      p.text(line, CANVAS_WIDTH/2, 150 + i * 18);
    });
    p.pop();
    
    // Instructions
    p.push();
    p.fill(180, 200, 255);
    p.textAlign(p.LEFT);
    p.textSize(11);
    p.text("HOW TO PLAY:", 100, 230);
    p.fill(200, 200, 200);
    p.textSize(10);
    p.text("• Arrow Keys: Navigate locations and hotspots", 100, 250);
    p.text("• Space: Interact with objects and advance dialogue", 100, 265);
    p.text("• Z: Open/Close inventory", 100, 280);
    p.text("• Shift: Combine selected items (when applicable)", 100, 295);
    p.text("• Collect clues, solve puzzles, find the culprit!", 100, 310);
    p.pop();
    
    // Start prompt
    p.push();
    p.fill(255, 255, 0);
    p.textAlign(p.CENTER);
    p.textSize(16);
    const flash = Math.sin(p.frameCount * 0.1) > 0;
    if (flash) {
      p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, 360);
    }
    p.pop();
  }
  
  drawGameUI() {
    const p = this.p;
    
    // Location name
    const location = gameState.currentLocation;
    const locationData = STORY_DATA.locations[location];
    
    p.push();
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 35);
    
    p.fill(255, 215, 0);
    p.textAlign(p.LEFT);
    p.textSize(16);
    p.text(locationData?.name || location, 10, 22);
    
    // Score
    p.fill(200, 200, 200);
    p.textAlign(p.RIGHT);
    p.textSize(12);
    p.text(`Clues: ${gameState.mysteryCluesFound}/${gameState.requiredCluesForWin}`, CANVAS_WIDTH - 10, 22);
    p.pop();
    
    // Inventory bar
    this.drawInventoryBar();
    
    // Hotspot info
    if (gameState.selectedHotspot >= 0) {
      this.drawHotspotInfo();
    }
  }
  
  drawInventoryBar() {
    const p = this.p;
    const barHeight = 60;
    const barY = CANVAS_HEIGHT - barHeight;
    
    p.push();
    p.fill(0, 0, 0, 180);
    p.noStroke();
    p.rect(0, barY, CANVAS_WIDTH, barHeight);
    
    p.fill(255, 215, 0);
    p.textAlign(p.LEFT);
    p.textSize(11);
    p.text("Inventory (Z)", 10, barY + 15);
    
    if (gameState.inventoryOpen) {
      p.fill(200, 255, 200);
      p.text("OPEN", 100, barY + 15);
      
      // Draw inventory items
      const items = gameState.inventory;
      const itemWidth = 50;
      const itemHeight = 35;
      const startX = 10;
      const startY = barY + 22;
      
      items.forEach((itemId, i) => {
        const x = startX + i * (itemWidth + 5);
        const isSelected = gameState.selectedInventoryItem === itemId;
        
        p.push();
        p.fill(...(isSelected ? [255, 255, 100] : [60, 60, 80]));
        p.stroke(...(isSelected ? [255, 255, 0] : [100, 100, 120]));
        p.strokeWeight(2);
        p.rect(x, startY, itemWidth, itemHeight, 3);
        
        p.fill(255);
        p.noStroke();
        p.textAlign(p.CENTER);
        p.textSize(8);
        const clueData = CLUE_DATA[itemId];
        if (clueData) {
          p.text(clueData.name.substring(0, 10), x + itemWidth/2, startY + itemHeight/2);
        }
        p.pop();
      });
      
      p.fill(180, 180, 200);
      p.textAlign(p.RIGHT);
      p.textSize(9);
      p.text("Shift to combine", CANVAS_WIDTH - 10, barY + 15);
    }
    p.pop();
  }
  
  drawHotspotInfo() {
    const p = this.p;
    // This is drawn by the main game when a hotspot is selected
  }
  
  drawDialogue(dialogue, npcName) {
    const p = this.p;
    const boxHeight = 100;
    const boxY = CANVAS_HEIGHT - boxHeight - 10;
    
    p.push();
    p.fill(0, 0, 0, 200);
    p.stroke(100, 150, 200);
    p.strokeWeight(3);
    p.rect(20, boxY, CANVAS_WIDTH - 40, boxHeight, 10);
    
    p.fill(255, 215, 0);
    p.noStroke();
    p.textAlign(p.LEFT);
    p.textSize(14);
    p.text(npcName + ":", 35, boxY + 20);
    
    p.fill(255);
    p.textSize(12);
    const lines = this.wrapText(dialogue, CANVAS_WIDTH - 80);
    lines.forEach((line, i) => {
      p.text(line, 35, boxY + 42 + i * 16);
    });
    
    p.fill(200, 200, 200);
    p.textAlign(p.RIGHT);
    p.textSize(10);
    p.text("Space to continue", CANVAS_WIDTH - 35, boxY + boxHeight - 15);
    p.pop();
  }
  
  drawPuzzleScreen(puzzleData) {
    const p = this.p;
    
    p.push();
    p.fill(0, 0, 0, 220);
    p.noStroke();
    p.rect(50, 80, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 160);
    
    p.fill(255, 215, 0);
    p.textAlign(p.CENTER);
    p.textSize(18);
    p.text(puzzleData.name, CANVAS_WIDTH/2, 110);
    
    p.fill(200, 200, 200);
    p.textSize(12);
    const lines = this.wrapText(puzzleData.description, CANVAS_WIDTH - 140);
    lines.forEach((line, i) => {
      p.text(line, CANVAS_WIDTH/2, 145 + i * 18);
    });
    
    p.fill(150, 255, 150);
    p.textSize(11);
    p.text("Puzzle Solved!", CANVAS_WIDTH/2, 220);
    p.fill(200, 200, 200);
    p.text("Space to continue", CANVAS_WIDTH/2, 240);
    p.pop();
  }
  
  drawPauseIndicator() {
    const p = this.p;
    p.push();
    p.fill(255, 255, 0);
    p.textAlign(p.RIGHT);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 20);
    p.pop();
  }
  
  drawGameOverScreen(won) {
    const p = this.p;
    
    p.background(won ? [20, 40, 20] : [40, 20, 20]);
    
    p.push();
    p.fill(won ? [100, 255, 100] : [255, 100, 100]);
    p.textAlign(p.CENTER);
    p.textSize(36);
    p.text(won ? "MYSTERY SOLVED!" : "INVESTIGATION STALLED", CANVAS_WIDTH/2, 120);
    
    p.fill(255);
    p.textSize(16);
    if (won) {
      p.text("The Three Investigators cracked the case!", CANVAS_WIDTH/2, 180);
      p.text("You identified the culprit and gathered all evidence.", CANVAS_WIDTH/2, 210);
    } else {
      p.text("You couldn't solve the mystery this time.", CANVAS_WIDTH/2, 180);
    }
    
    p.fill(200, 200, 200);
    p.textSize(14);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 260);
    p.text(`Clues Found: ${gameState.mysteryCluesFound}/${gameState.requiredCluesForWin}`, CANVAS_WIDTH/2, 285);
    
    p.fill(255, 255, 0);
    p.textSize(16);
    const flash = Math.sin(p.frameCount * 0.1) > 0;
    if (flash) {
      p.text("PRESS R TO RESTART", CANVAS_WIDTH/2, 340);
    }
    p.pop();
  }
  
  wrapText(text, maxWidth) {
    const p = this.p;
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = p.textWidth(testLine);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }
}