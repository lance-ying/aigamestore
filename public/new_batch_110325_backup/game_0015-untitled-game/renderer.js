// renderer.js - Game rendering
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';
import { UIManager } from './ui_manager.js';

export class Renderer {
  constructor(p, locationManager) {
    this.p = p;
    this.locationManager = locationManager;
    this.uiManager = new UIManager(p);
  }
  
  draw() {
    const p = this.p;
    
    // Single background call
    p.background(50);
    
    switch (gameState.gamePhase) {
      case GAME_PHASES.START:
        this.uiManager.drawStartScreen();
        break;
      case GAME_PHASES.PLAYING:
        this.drawGame();
        break;
      case GAME_PHASES.PAUSED:
        this.drawGame();
        this.uiManager.drawPauseIndicator();
        break;
      case GAME_PHASES.GAME_OVER_WIN:
        this.uiManager.drawGameOverScreen(true);
        break;
      case GAME_PHASES.GAME_OVER_LOSE:
        this.uiManager.drawGameOverScreen(false);
        break;
    }
  }
  
  drawGame() {
    const p = this.p;
    const location = this.locationManager.getCurrentLocation();
    
    if (!location) return;
    
    // Background
    p.background(...location.background);
    
    // Draw location environment
    this.drawLocationEnvironment(location);
    
    // Draw hotspots
    const hotspots = location.hotspots.filter(h => h.active && !h.collected);
    hotspots.forEach((hotspot, index) => {
      hotspot.draw(p, index === gameState.selectedHotspot);
    });
    
    // Draw NPCs
    location.npcs.forEach(npc => {
      npc.draw(p);
    });
    
    // Draw player
    if (gameState.player) {
      gameState.player.draw(p);
    }
    
    // UI overlay
    this.uiManager.drawGameUI();
    
    // Dialogue
    if (gameState.currentDialogue) {
      const dialogues = gameState.currentDialogue.getDialogues();
      if (gameState.dialogueIndex < dialogues.length) {
        this.uiManager.drawDialogue(
          dialogues[gameState.dialogueIndex],
          gameState.currentDialogue.name
        );
      }
    }
    
    // Puzzle notification
    if (gameState.currentPuzzle) {
      this.uiManager.drawPuzzleScreen(gameState.currentPuzzle);
    }
    
    // Draw location selector
    this.drawLocationSelector();
  }
  
  drawLocationEnvironment(location) {
    const p = this.p;
    const locId = gameState.currentLocation;
    
    // Draw themed decorations based on location
    p.push();
    
    if (locId === "headquarters") {
      // Junkyard environment
      p.fill(160, 140, 120);
      p.noStroke();
      p.rect(80, 140, 100, 80, 5); // Desk
      p.fill(180, 160, 140);
      p.rect(85, 145, 90, 10); // Desk drawer
      
      p.fill(200, 180, 150);
      p.rect(390, 90, 110, 90, 5); // Map board
      
      p.fill(100, 100, 110);
      p.rect(490, 190, 70, 60, 5); // Phone table
    } else if (locId === "park") {
      // Trees
      p.fill(100, 140, 80);
      p.circle(80, 120, 60);
      p.circle(520, 140, 70);
      p.fill(80, 60, 40);
      p.rect(75, 120, 10, 40);
      p.rect(515, 140, 10, 40);
      
      // Grass
      p.fill(120, 160, 100);
      for (let i = 0; i < 10; i++) {
        p.rect(50 + i * 50, 300, 30, 10);
      }
    } else if (locId === "library") {
      // Bookshelves
      p.fill(100, 70, 40);
      p.rect(130, 110, 110, 90, 5);
      p.rect(330, 100, 110, 90, 5);
      
      // Books
      p.fill(180, 60, 60);
      p.rect(140, 120, 15, 60);
      p.fill(60, 100, 180);
      p.rect(160, 120, 15, 60);
      p.fill(60, 180, 100);
      p.rect(180, 120, 15, 60);
    } else if (locId === "warehouse") {
      // Crates
      p.fill(120, 100, 70);
      p.stroke(80, 60, 40);
      p.strokeWeight(2);
      p.rect(180, 160, 110, 90, 5);
      p.line(185, 180, 285, 180);
      p.line(235, 165, 235, 245);
      
      // Paint cans
      p.fill(100, 200, 100);
      p.circle(430, 180, 40);
      p.fill(80, 180, 80);
      p.ellipse(430, 175, 40, 8);
    } else if (locId === "pier") {
      // Water
      p.fill(100, 140, 180);
      p.noStroke();
      p.rect(0, 250, CANVAS_WIDTH, 150);
      
      // Waves
      p.stroke(120, 160, 200);
      p.strokeWeight(2);
      p.noFill();
      for (let i = 0; i < 5; i++) {
        p.arc(100 + i * 120, 280, 60, 20, 0, p.PI);
      }
      
      // Boat
      p.fill(150, 100, 70);
      p.noStroke();
      p.beginShape();
      p.vertex(130, 220);
      p.vertex(180, 220);
      p.vertex(190, 240);
      p.vertex(120, 240);
      p.endShape(p.CLOSE);
    }
    
    p.pop();
  }
  
  drawLocationSelector() {
    const p = this.p;
    
    // Show available locations
    p.push();
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(10, 40, 200, 30 + gameState.unlockedLocations.length * 20);
    
    p.fill(200, 200, 200);
    p.textAlign(p.LEFT);
    p.textSize(10);
    p.text("Locations (← →):", 15, 55);
    
    gameState.unlockedLocations.forEach((loc, i) => {
      const isCurrent = loc === gameState.currentLocation;
      p.fill(...(isCurrent ? [255, 255, 100] : [180, 180, 180]));
      p.text(`${isCurrent ? '▶ ' : '  '}${loc}`, 20, 72 + i * 18);
    });
    
    p.pop();
  }
}