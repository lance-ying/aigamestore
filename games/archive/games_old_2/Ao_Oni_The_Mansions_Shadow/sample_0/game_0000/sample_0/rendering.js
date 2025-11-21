// rendering.js - Rendering functions
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 15, 30);
  
  // Title
  p.fill(150, 100, 200);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("Ao Oni: The Mansion's Shadow", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 180, 220);
  p.textSize(14);
  p.text("A Survival Horror Experience", CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.fill(220, 220, 240);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "OBJECTIVE: Escape the haunted mansion",
    "- Navigate through 5 challenging levels",
    "- Find keys to unlock doors",
    "- Avoid Ao Oni, the blue monster",
    "- Hide when spotted to evade capture",
    "",
    "CONTROLS:",
    "Arrow Keys - Move",
    "Shift - Sprint",
    "Space - Interact (doors, items, hide)",
    "Z - Toggle flashlight (in dark levels)",
    "ESC - Pause game",
    "R - Restart to title"
  ];
  
  let y = 160;
  for (const line of instructions) {
    p.text(line, 100, y);
    y += 16;
  }
  
  // Press Enter prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const blink = Math.floor(p.frameCount / 30) % 2;
  if (blink) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  }
}

export function renderGameOverScreen(p, won) {
  p.background(20, 15, 30);
  
  if (won) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(36);
    p.text("YOU ESCAPED!", CANVAS_WIDTH / 2, 120);
    
    p.fill(200, 255, 200);
    p.textSize(18);
    p.text("Congratulations on escaping the mansion!", CANVAS_WIDTH / 2, 170);
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(36);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
    
    p.fill(255, 200, 200);
    p.textSize(18);
    p.text("Ao Oni caught you...", CANVAS_WIDTH / 2, 170);
  }
  
  // Final score
  p.fill(255, 255, 255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
  
  // Instructions
  p.fill(220, 220, 240);
  p.textSize(16);
  p.text("Press R to restart", CANVAS_WIDTH / 2, 300);
}

export function renderPausedIndicator(p) {
  p.push();
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

export function renderUI(p) {
  // Score
  p.push();
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  p.pop();
  
  // Level
  p.push();
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Level: ${gameState.level}`, 10, 10);
  p.pop();
  
  // Inventory
  p.push();
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.BOTTOM);
  p.textSize(12);
  p.text("Inventory:", 10, CANVAS_HEIGHT - 40);
  
  let x = 10;
  const y = CANVAS_HEIGHT - 20;
  for (const item of gameState.inventory) {
    p.fill(200, 200, 200);
    p.stroke(150);
    p.strokeWeight(1);
    p.rect(x, y - 15, 20, 20);
    
    p.fill(255, 215, 0);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    if (item.type === "key") {
      p.text("🔑", x + 10, y - 5);
    } else if (item.type === "flashlight") {
      p.text("🔦", x + 10, y - 5);
    } else {
      p.text("📦", x + 10, y - 5);
    }
    
    x += 25;
  }
  p.pop();
  
  // Chase indicator
  if (gameState.inChase) {
    p.push();
    const alpha = 50 + Math.sin(p.frameCount * 0.2) * 30;
    p.fill(255, 0, 0, alpha);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 10);
    p.rect(0, 0, 10, CANVAS_HEIGHT);
    p.rect(CANVAS_WIDTH - 10, 0, 10, CANVAS_HEIGHT);
    p.rect(0, CANVAS_HEIGHT - 10, CANVAS_WIDTH, 10);
    p.pop();
  }
}

export function renderDarkness(p) {
  if (gameState.level >= 4 && gameState.player) {
    p.push();
    
    // Create darkness overlay
    p.fill(0, 0, 0, 200);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Player light
    const lightRadius = gameState.flashlightOn ? 120 : 80;
    const gradient = p.drawingContext.createRadialGradient(
      gameState.player.x, gameState.player.y, 0,
      gameState.player.x, gameState.player.y, lightRadius
    );
    gradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 200, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    p.drawingContext.globalCompositeOperation = 'destination-out';
    p.drawingContext.fillStyle = gradient;
    p.drawingContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.drawingContext.globalCompositeOperation = 'source-over';
    
    p.pop();
  }
}