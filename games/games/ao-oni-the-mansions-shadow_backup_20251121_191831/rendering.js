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
    "- Navigate through 8 challenging levels",
    "- Collect required objectives (★) to unlock exit",
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
  
  let y = 150;
  for (const line of instructions) {
    p.text(line, 90, y);
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
    
    // Add dramatic effect
    p.fill(255, 0, 0, 50);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
  
  // Final score
  p.fill(255, 255, 255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
  
  // Instructions
  p.fill(220, 220, 240);
  p.textSize(16);
  p.text("Press R to restart", CANVAS_WIDTH / 2, 300);
  
  const blink = Math.floor(p.frameCount / 30) % 2;
  if (blink) {
    p.text("▼", CANVAS_WIDTH / 2, 330);
  }
}

export function renderPausedIndicator(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(14);
  p.fill(220, 220, 240);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  p.pop();
}

export function renderUI(p) {
  // Semi-transparent background for UI
  p.push();
  p.fill(0, 0, 0, 120);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);
  p.rect(0, CANVAS_HEIGHT - 60, CANVAS_WIDTH, 60);
  p.pop();
  
  // Score
  p.push();
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 8);
  p.pop();
  
  // Level
  p.push();
  p.fill(100, 200, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Level: ${gameState.level} / 8`, 10, 8);
  p.pop();
  
  // Objectives collected indicator
  if (gameState.requiredItemIds.length > 0) {
    p.push();
    const collected = gameState.collectedRequiredItems.size;
    const total = gameState.requiredItemIds.length;
    const isComplete = collected >= total;
    
    p.fill(isComplete ? 100 : 255, isComplete ? 255 : 150, isComplete ? 100 : 150);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(14);
    p.text(`Objectives: ${collected}/${total} ${isComplete ? '✓' : ''}`, CANVAS_WIDTH / 2, 8);
    p.pop();
  }
  
  // Inventory header
  p.push();
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.BOTTOM);
  p.textSize(14);
  p.text("Inventory:", 10, CANVAS_HEIGHT - 42);
  p.pop();
  
  // Inventory items
  p.push();
  let x = 10;
  const y = CANVAS_HEIGHT - 22;
  
  if (gameState.inventory && gameState.inventory.length > 0) {
    for (const item of gameState.inventory) {
      // Item box
      p.fill(50, 50, 60);
      p.stroke(200, 200, 220);
      p.strokeWeight(2);
      p.rect(x, y - 20, 24, 24, 2);
      
      // Item icon
      p.fill(255, 215, 0);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      if (item.type === "key") {
        p.text("🔑", x + 12, y - 8);
      } else if (item.type === "flashlight") {
        p.text("🔦", x + 12, y - 8);
      } else {
        p.text("📦", x + 12, y - 8);
      }
      
      x += 30;
    }
  } else {
    p.fill(150, 150, 150);
    p.noStroke();
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(12);
    p.text("(empty)", x, y - 8);
  }
  p.pop();
  
  // Sprint indicator
  if (gameState.isRunning) {
    p.push();
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(12);
    p.text("SPRINTING", CANVAS_WIDTH / 2, 8);
    p.pop();
  }
  
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
    
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text("! CHASE !", CANVAS_WIDTH / 2, 20);
    p.pop();
  }
}

export function renderMessages(p) {
  if (!gameState.messages || gameState.messages.length === 0) return;
  
  p.push();
  let y = 60;
  
  for (const msg of gameState.messages) {
    const alpha = Math.min(255, msg.time * 2);
    
    // Message background
    p.fill(0, 0, 0, alpha * 0.7);
    p.noStroke();
    const textW = p.textWidth(msg.text);
    p.rect(CANVAS_WIDTH / 2 - textW / 2 - 10, y - 10, textW + 20, 25, 5);
    
    // Message text
    let color;
    if (msg.type === "success") {
      color = [100, 255, 100, alpha];
    } else if (msg.type === "warning") {
      color = [255, 200, 100, alpha];
    } else if (msg.type === "error") {
      color = [255, 100, 100, alpha];
    } else {
      color = [255, 255, 255, alpha];
    }
    
    p.fill(...color);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(14);
    p.text(msg.text, CANVAS_WIDTH / 2, y - 5);
    
    y += 30;
  }
  
  p.pop();
}

export function renderDarkness(p) {
  if (gameState.level >= 7 && gameState.player) {
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