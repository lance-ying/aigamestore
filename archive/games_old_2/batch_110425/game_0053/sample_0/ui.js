// ui.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, gameState } from './globals.js';

export class UI {
  drawStartScreen(p) {
    p.push();
    
    // Title
    p.fill(255, 215, 0);
    p.stroke(255, 140, 0);
    p.strokeWeight(4);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(36);
    p.text("LIFE: ROAD TRIP", CANVAS_WIDTH / 2, 60);
    
    // Subtitle
    p.noStroke();
    p.fill(255);
    p.textSize(18);
    p.text("Island Memory Adventure", CANVAS_WIDTH / 2, 100);
    
    // Description box
    p.fill(255, 255, 255, 230);
    p.stroke(100);
    p.strokeWeight(2);
    p.rect(50, 130, CANVAS_WIDTH - 100, 180, 10);
    
    // Description
    p.fill(0);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(14);
    const desc = [
      "Navigate the tropical island path collecting",
      "memories and souvenirs along the way!",
      "",
      "• Spin the wheel to move forward",
      "• Land on special spaces for rewards",
      "• Complete mini-games for bonus points",
      "• Reach the finish with maximum memories!"
    ];
    
    for (let i = 0; i < desc.length; i++) {
      p.text(desc[i], 70, 145 + i * 22);
    }
    
    // Controls
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.fill(255, 100, 100);
    p.text("SPACE: Spin Wheel | ARROWS: Navigate | Z: Action", CANVAS_WIDTH / 2, 330);
    
    // Start prompt
    p.fill(0, 255, 0);
    p.textSize(20);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
    
    p.pop();
  }
  
  drawGameUI(p) {
    // HUD Panel
    p.push();
    p.fill(34, 34, 34, 200);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 40);
    p.pop();
    
    // Score
    p.push();
    p.fill(255, 215, 0);
    p.noStroke();
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(16);
    p.text(`Memories: ${gameState.memories}`, 10, 20);
    p.pop();
    
    // Position
    p.push();
    p.fill(100, 200, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(`Space: ${gameState.currentSpace}/${gameState.boardPath.length - 1}`, CANVAS_WIDTH / 2, 20);
    p.pop();
    
    // Inventory
    p.push();
    p.fill(255, 105, 180);
    p.textAlign(p.RIGHT, p.CENTER);
    p.textSize(14);
    p.text(`🎁${gameState.souvenirs} 📷${gameState.photos}`, CANVAS_WIDTH - 10, 20);
    p.pop();
    
    // Message display
    if (gameState.messageTimer > 0) {
      p.push();
      p.fill(255, 255, 255, Math.min(gameState.messageTimer * 2, 255));
      p.stroke(0);
      p.strokeWeight(3);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(18);
      p.text(gameState.currentMessage, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
      p.pop();
      gameState.messageTimer--;
    }
    
    // Spin prompt
    if (!gameState.wheelSpinning && !gameState.moving && !gameState.minigameActive) {
      p.push();
      p.fill(255, 255, 0);
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(14);
      p.text("Press SPACE to spin!", 500, 150);
      p.pop();
    }
  }
  
  drawPauseScreen(p) {
    p.push();
    p.fill(255, 255, 0);
    p.noStroke();
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
    p.pop();
  }
  
  drawGameOverScreen(p) {
    p.push();
    
    // Overlay
    p.fill(0, 0, 0, 200);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Result box
    p.fill(255, 255, 255);
    p.stroke(100);
    p.strokeWeight(3);
    p.rect(100, 80, CANVAS_WIDTH - 200, CANVAS_HEIGHT - 160, 10);
    
    // Title
    const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
    p.fill(isWin ? [0, 200, 0] : [200, 0, 0]);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text(isWin ? "JOURNEY COMPLETE!" : "GAME OVER", CANVAS_WIDTH / 2, 120);
    
    // Stats
    p.fill(0);
    p.textSize(20);
    p.text(`Total Memories: ${gameState.memories}`, CANVAS_WIDTH / 2, 180);
    p.textSize(16);
    p.text(`Souvenirs Collected: ${gameState.souvenirs}`, CANVAS_WIDTH / 2, 220);
    p.text(`Photos Taken: ${gameState.photos}`, CANVAS_WIDTH / 2, 250);
    
    // Message
    if (isWin) {
      p.fill(50, 150, 50);
      p.textSize(18);
      p.text("You've collected wonderful memories!", CANVAS_WIDTH / 2, 290);
    }
    
    // Restart prompt
    p.fill(255, 100, 100);
    p.textSize(20);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
    
    p.pop();
  }
}