// ui.js - UI rendering and interactions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, MODES } from './globals.js';

export class UI {
  constructor(p) {
    this.p = p;
  }
  
  drawStartScreen() {
    const p = this.p;
    p.background(25, 30, 45);
    
    // Title with gradient effect
    p.textAlign(p.CENTER, p.CENTER);
    
    // Main title
    p.textSize(48);
    p.fill(100, 200, 255);
    p.text("WORD LOOKUP PRO", CANVAS_WIDTH / 2, 60);
    
    // Subtitle
    p.textSize(16);
    p.fill(150, 180, 220);
    p.text("Advanced Dictionary & Anagram Solver", CANVAS_WIDTH / 2, 100);
    
    // Description box
    p.fill(40, 50, 70);
    p.rect(50, 130, CANVAS_WIDTH - 100, 140, 8);
    
    p.textSize(14);
    p.fill(200, 210, 230);
    p.textAlign(p.LEFT, p.TOP);
    const desc = [
      "Search through 170,000+ words using wildcards:",
      "  • Type letters to search (? = any letter, * = multiple)",
      "  • Press SPACE to switch to Anagram mode",
      "  • Find all possible words from your letters",
      "  • Discover high-scoring combinations!",
      "",
      "Reach 500 points to complete the challenge!"
    ];
    
    let yPos = 145;
    for (let line of desc) {
      p.text(line, 70, yPos);
      yPos += 18;
    }
    
    // Controls
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.fill(180, 190, 210);
    p.text("CONTROLS: Arrow Keys - Navigate | A-Z - Type | Z - Backspace | SPACE - Switch Mode", CANVAS_WIDTH / 2, 300);
    
    // Start prompt
    p.textSize(20);
    p.fill(100, 255, 150);
    if (Math.floor(p.frameCount / 30) % 2 === 0) {
      p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
    }
  }
  
  drawPlayingScreen(dictionary) {
    const p = this.p;
    p.background(25, 30, 45);
    
    // Top bar
    this.drawTopBar();
    
    // Mode tabs
    this.drawModeTabs();
    
    // Input area
    this.drawInputArea();
    
    // Results area
    this.drawResults(dictionary);
    
    // Score display
    this.drawScorePanel();
  }
  
  drawTopBar() {
    const p = this.p;
    p.fill(40, 50, 70);
    p.rect(0, 0, CANVAS_WIDTH, 40);
    
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(18);
    p.fill(100, 200, 255);
    p.text("WORD LOOKUP PRO", 10, 20);
    
    p.textAlign(p.RIGHT, p.CENTER);
    p.textSize(14);
    p.fill(180, 190, 210);
    p.text(`Score: ${gameState.score} / ${gameState.targetScore}`, CANVAS_WIDTH - 10, 20);
  }
  
  drawModeTabs() {
    const p = this.p;
    const tabWidth = 150;
    const tabHeight = 35;
    const startX = CANVAS_WIDTH / 2 - tabWidth;
    const y = 50;
    
    // Search tab
    const searchActive = gameState.currentMode === MODES.SEARCH;
    p.fill(...(searchActive ? [60, 120, 200] : [50, 60, 80]));
    p.rect(startX, y, tabWidth, tabHeight, 8, 8, 0, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.fill(...(searchActive ? [255, 255, 255] : [150, 160, 180]));
    p.text("SEARCH", startX + tabWidth / 2, y + tabHeight / 2);
    
    // Anagram tab
    const anagramActive = gameState.currentMode === MODES.ANAGRAM;
    p.fill(...(anagramActive ? [60, 120, 200] : [50, 60, 80]));
    p.rect(startX + tabWidth, y, tabWidth, tabHeight, 8, 8, 0, 0);
    p.fill(...(anagramActive ? [255, 255, 255] : [150, 160, 180]));
    p.text("ANAGRAM", startX + tabWidth + tabWidth / 2, y + tabHeight / 2);
  }
  
  drawInputArea() {
    const p = this.p;
    const boxY = 95;
    const boxHeight = 50;
    
    // Input box
    p.fill(40, 50, 70);
    p.stroke(80, 100, 140);
    p.strokeWeight(2);
    p.rect(50, boxY, CANVAS_WIDTH - 100, boxHeight, 8);
    p.noStroke();
    
    // Input text
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(24);
    p.fill(200, 210, 230);
    const displayText = gameState.inputText || (gameState.currentMode === MODES.SEARCH ? "Type to search..." : "Enter letters...");
    const textColor = gameState.inputText ? [200, 210, 230] : [100, 110, 130];
    p.fill(...textColor);
    p.text(displayText, 65, boxY + boxHeight / 2);
    
    // Cursor
    if (gameState.inputText && gameState.cursorBlink) {
      const textWidth = p.textWidth(gameState.inputText);
      p.stroke(100, 200, 255);
      p.strokeWeight(2);
      p.line(65 + textWidth + 5, boxY + 15, 65 + textWidth + 5, boxY + boxHeight - 15);
      p.noStroke();
    }
    
    // Instructions
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(11);
    p.fill(120, 130, 150);
    if (gameState.currentMode === MODES.SEARCH) {
      p.text("Use ? for single letter wildcard, * for multiple letters", CANVAS_WIDTH / 2, boxY + boxHeight + 15);
    } else {
      p.text("Use ? or * as blank wildcards (max 2)", CANVAS_WIDTH / 2, boxY + boxHeight + 15);
    }
  }
  
  drawResults(dictionary) {
    const p = this.p;
    const startY = 175;
    const boxHeight = 170;
    
    // Results box
    p.fill(40, 50, 70);
    p.rect(50, startY, CANVAS_WIDTH - 100, boxHeight, 8);
    
    // Title
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    p.fill(150, 180, 220);
    const resultCount = gameState.searchResults.length;
    const modeText = gameState.currentMode === MODES.SEARCH ? "Search Results" : "Anagrams Found";
    p.text(`${modeText} (${resultCount})`, 65, startY + 10);
    
    // Display results
    if (resultCount === 0) {
      p.textAlign(p.CENTER, p.CENTER);
      p.fill(100, 110, 130);
      p.textSize(12);
      p.text(gameState.inputText ? "No matches found" : "Type to see results", CANVAS_WIDTH / 2, startY + boxHeight / 2);
    } else {
      const itemsPerRow = 4;
      const itemWidth = (CANVAS_WIDTH - 140) / itemsPerRow;
      const itemHeight = 30;
      const startIndex = Math.floor(gameState.selectedResultIndex / itemsPerRow) * itemsPerRow;
      const maxDisplay = 20;
      
      let x = 65;
      let y = startY + 35;
      let count = 0;
      
      for (let i = startIndex; i < Math.min(startIndex + maxDisplay, resultCount); i++) {
        const word = gameState.searchResults[i];
        const score = dictionary.calculateScore(word);
        const isSelected = i === gameState.selectedResultIndex;
        
        // Highlight selected
        if (isSelected) {
          p.fill(60, 120, 200, 100);
          p.rect(x - 5, y - 2, itemWidth, itemHeight - 2, 4);
        }
        
        // Word
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(13);
        p.fill(...(isSelected ? [255, 255, 150] : [200, 210, 230]));
        p.text(word, x, y);
        
        // Score
        p.textSize(10);
        p.fill(...(isSelected ? [150, 255, 150] : [120, 180, 120]));
        p.text(`${score}pts`, x, y + 15);
        
        count++;
        if (count % itemsPerRow === 0) {
          x = 65;
          y += itemHeight;
        } else {
          x += itemWidth;
        }
      }
      
      // Scroll indicator
      if (resultCount > maxDisplay) {
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(10);
        p.fill(120, 130, 150);
        p.text("Use ↑↓ to scroll more results", CANVAS_WIDTH / 2, startY + boxHeight - 15);
      }
    }
  }
  
  drawScorePanel() {
    const p = this.p;
    const panelY = 355;
    
    // Panel background
    p.fill(40, 50, 70);
    p.rect(50, panelY, CANVAS_WIDTH - 100, 35, 8);
    
    // Stats
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(12);
    p.fill(150, 180, 220);
    p.text(`Words Found: ${gameState.totalWordsFound}`, 65, panelY + 17);
    
    p.textAlign(p.RIGHT, p.CENTER);
    const percentComplete = Math.min(100, Math.floor((gameState.score / gameState.targetScore) * 100));
    p.fill(...(percentComplete >= 100 ? [100, 255, 150] : [180, 190, 210]));
    p.text(`${percentComplete}% Complete`, CANVAS_WIDTH - 65, panelY + 17);
  }
  
  drawPausedScreen() {
    const p = this.p;
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.fill(255, 255, 100);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
  
  drawGameOverScreen(isWin) {
    const p = this.p;
    p.background(25, 30, 45);
    
    // Semi-transparent overlay
    p.fill(0, 0, 0, 200);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Result box
    p.fill(40, 50, 70);
    p.rect(100, 100, CANVAS_WIDTH - 200, CANVAS_HEIGHT - 200, 12);
    
    // Title
    p.textAlign(p.CENTER, p.CENTER);
    if (isWin) {
      p.textSize(48);
      p.fill(100, 255, 150);
      p.text("VICTORY!", CANVAS_WIDTH / 2, 160);
      
      p.textSize(18);
      p.fill(200, 210, 230);
      p.text("You've mastered the dictionary!", CANVAS_WIDTH / 2, 210);
    } else {
      p.textSize(48);
      p.fill(255, 150, 100);
      p.text("GAME OVER", CANVAS_WIDTH / 2, 160);
    }
    
    // Stats
    p.textSize(16);
    p.fill(180, 190, 210);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 250);
    p.text(`Words Found: ${gameState.totalWordsFound}`, CANVAS_WIDTH / 2, 275);
    
    // Restart prompt
    p.textSize(18);
    p.fill(100, 200, 255);
    if (Math.floor(p.frameCount / 30) % 2 === 0) {
      p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 330);
    }
  }
}