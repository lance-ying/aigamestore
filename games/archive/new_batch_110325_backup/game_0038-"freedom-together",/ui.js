// ui.js
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, ALIEN_WORDS } from './globals.js';

export class DictionaryUI {
  constructor(p) {
    this.p = p;
    this.scrollOffset = 0;
    this.maxScroll = 0;
  }
  
  draw() {
    const p = this.p;
    
    if (!gameState.dictionaryOpen) return;
    
    p.push();
    
    // Overlay background
    p.fill(0, 0, 0, 180);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Dictionary panel
    const panelX = 50;
    const panelY = 30;
    const panelWidth = CANVAS_WIDTH - 100;
    const panelHeight = CANVAS_HEIGHT - 60;
    
    p.fill(240, 235, 220);
    p.stroke(100, 80, 60);
    p.strokeWeight(3);
    p.rect(panelX, panelY, panelWidth, panelHeight, 10);
    
    // Title
    p.fill(80, 60, 40);
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(20);
    p.text("Your Dictionary", CANVAS_WIDTH / 2, panelY + 15);
    
    // Instructions
    p.textSize(11);
    p.fill(120, 100, 80);
    p.text("Arrow Keys: Navigate | Space: Select | Shift: Clear | Z: Close", CANVAS_WIDTH / 2, panelY + 40);
    
    // Input area
    const inputY = panelY + 65;
    p.fill(255);
    p.stroke(150);
    p.strokeWeight(2);
    p.rect(panelX + 20, inputY, panelWidth - 40, 70, 5);
    
    // Input labels and text
    p.fill(60);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.text("Alien Word:", panelX + 30, inputY + 8);
    p.text("Translation:", panelX + 30, inputY + 40);
    
    // Current input display
    p.textSize(14);
    p.fill(gameState.inputMode === "word" ? [0, 100, 200] : [0, 0, 0]);
    p.text(gameState.currentInputWord || "_", panelX + 120, inputY + 8);
    
    p.fill(gameState.inputMode === "translation" ? [0, 100, 200] : [0, 0, 0]);
    p.text(gameState.currentInputTranslation || "_", panelX + 120, inputY + 40);
    
    // Discovered words list
    const listY = inputY + 85;
    const listHeight = panelHeight - 140;
    
    p.fill(250);
    p.stroke(150);
    p.strokeWeight(2);
    p.rect(panelX + 20, listY, panelWidth / 2 - 30, listHeight, 5);
    
    p.fill(60);
    p.noStroke();
    p.textSize(12);
    p.text("Discovered Words:", panelX + 30, listY + 8);
    
    // Draw discovered words
    let yOffset = listY + 30;
    for (let i = 0; i < gameState.discoveredWords.length; i++) {
      const word = gameState.discoveredWords[i];
      if (yOffset < listY + listHeight - 10) {
        p.textSize(13);
        p.fill(80, 60, 120);
        p.text(word.alienWord, panelX + 30, yOffset);
        p.textSize(10);
        p.fill(120);
        p.text(`(${word.context})`, panelX + 100, yOffset + 2);
        yOffset += 22;
      }
    }
    
    // Dictionary entries
    p.fill(250);
    p.stroke(150);
    p.strokeWeight(2);
    p.rect(panelX + panelWidth / 2 + 10, listY, panelWidth / 2 - 30, listHeight, 5);
    
    p.fill(60);
    p.noStroke();
    p.textSize(12);
    p.text("Your Translations:", panelX + panelWidth / 2 + 20, listY + 8);
    
    // Draw dictionary entries
    yOffset = listY + 30;
    for (let alienWord in gameState.playerDictionary) {
      if (yOffset < listY + listHeight - 10) {
        p.textSize(12);
        p.fill(80, 60, 120);
        p.text(alienWord + ":", panelX + panelWidth / 2 + 20, yOffset);
        p.fill(0);
        p.text(gameState.playerDictionary[alienWord], panelX + panelWidth / 2 + 80, yOffset);
        yOffset += 20;
      }
    }
    
    p.pop();
  }
  
  handleInput(key, keyCode) {
    if (!gameState.dictionaryOpen) return;
    
    const p = this.p;
    
    // Handle mode switching
    if (keyCode === p.UP_ARROW || keyCode === p.DOWN_ARROW) {
      gameState.inputMode = gameState.inputMode === "word" ? "translation" : "word";
      return;
    }
    
    // Handle text input
    if (key && key.length === 1 && /[a-zA-Z ]/.test(key)) {
      if (gameState.inputMode === "word") {
        gameState.currentInputWord += key.toLowerCase();
      } else {
        gameState.currentInputTranslation += key;
      }
      return;
    }
    
    // Backspace
    if (keyCode === 8) {
      if (gameState.inputMode === "word") {
        gameState.currentInputWord = gameState.currentInputWord.slice(0, -1);
      } else {
        gameState.currentInputTranslation = gameState.currentInputTranslation.slice(0, -1);
      }
      return;
    }
    
    // Clear with Shift
    if (keyCode === 16) {
      gameState.currentInputWord = "";
      gameState.currentInputTranslation = "";
      return;
    }
    
    // Confirm with Space
    if (keyCode === 32 && gameState.currentInputWord && gameState.currentInputTranslation) {
      gameState.playerDictionary[gameState.currentInputWord] = gameState.currentInputTranslation;
      gameState.currentInputWord = "";
      gameState.currentInputTranslation = "";
      gameState.inputMode = "word";
      
      // Add to score for completing dictionary entry
      gameState.score += 10;
    }
  }
}

export class GameUI {
  constructor(p) {
    this.p = p;
  }
  
  drawHUD() {
    const p = this.p;
    p.push();
    
    // Top bar background
    p.fill(40, 40, 50, 200);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 35);
    
    // Day counter
    p.fill(255, 220, 100);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(16);
    p.text(`Day ${gameState.currentDay}/7`, 15, 17);
    
    // Time of day
    p.fill(200, 200, 255);
    p.textSize(14);
    p.text(`${gameState.timeOfDay.charAt(0).toUpperCase() + gameState.timeOfDay.slice(1)}`, 100, 17);
    
    // Score
    p.fill(150, 255, 150);
    p.text(`Score: ${gameState.score}`, 200, 17);
    
    // Dictionary hint
    p.fill(255, 255, 100);
    p.textAlign(p.RIGHT, p.CENTER);
    p.textSize(12);
    p.text("Press Z for Dictionary", CANVAS_WIDTH - 15, 17);
    
    // Word count
    p.fill(200);
    p.textSize(11);
    p.text(`${Object.keys(gameState.playerDictionary).length} words learned`, CANVAS_WIDTH - 15, 28);
    
    p.pop();
  }
  
  drawTimeIndicator() {
    const p = this.p;
    const colors = {
      morning: [255, 250, 200],
      afternoon: [255, 220, 150],
      evening: [200, 150, 200],
      night: [80, 80, 120]
    };
    
    const bgColor = colors[gameState.timeOfDay] || [200, 200, 200];
    
    // Sky color indicator (subtle)
    p.push();
    p.noStroke();
    p.fill(...bgColor, 30);
    p.rect(0, 35, CANVAS_WIDTH, CANVAS_HEIGHT - 35);
    p.pop();
  }
}