// ui.js - UI rendering (HUD, menus, etc.)
import { gameState, PHASE, HAT_TYPE, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawStartScreen(p) {
  p.background(135, 206, 235);
  
  // Decorative background
  p.noStroke();
  for (let i = 0; i < 20; i++) {
    p.fill(255, 255, 255, 100);
    const x = (i * 123) % CANVAS_WIDTH;
    const y = (i * 234) % CANVAS_HEIGHT;
    p.ellipse(x, y, 30, 30);
  }

  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.fill(138, 43, 226);
  p.stroke(255, 255, 255);
  p.strokeWeight(4);
  p.text("A HAT IN TIME", CANVAS_WIDTH / 2, 60);
  
  // Subtitle
  p.noStroke();
  p.textSize(18);
  p.fill(100, 50, 150);
  p.text("Mini Adventure", CANVAS_WIDTH / 2, 100);

  // Description
  p.textSize(14);
  p.fill(50, 50, 50);
  const desc = [
    "Help Hat Kid collect all 5 Time Pieces!",
    "",
    "Collect magical yarn to unlock powerful hats:",
    "• Sprint Hat (3 yarn) - Run faster with SHIFT",
    "• Brewing Hat (6 yarn) - Create explosions with Z",
    "• Dimension Hat (9 yarn) - Reveal hidden secrets with Z"
  ];
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], CANVAS_WIDTH / 2, 140 + i * 20);
  }

  // Controls
  p.textSize(14);
  p.fill(70, 70, 70);
  p.text("CONTROLS", CANVAS_WIDTH / 2, 280);
  
  p.textSize(12);
  const controls = [
    "Arrow Keys - Move and climb ladders",
    "Space - Jump (press twice for double jump)",
    "Shift - Sprint (with Sprint Hat)",
    "Z - Use hat ability",
    "ESC - Pause    R - Restart"
  ];
  for (let i = 0; i < controls.length; i++) {
    p.text(controls[i], CANVAS_WIDTH / 2, 305 + i * 18);
  }

  // Start prompt
  p.textSize(20);
  p.fill(138, 43, 226);
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 380);
  }
}

export function drawHUD(p) {
  p.push();
  p.textAlign(p.LEFT, p.TOP);
  
  // Background panel
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(5, 5, 250, 90, 5);
  
  // Score and collectibles
  p.textSize(14);
  p.fill(255, 255, 255);
  p.text(`Time Pieces: ${gameState.timePiecesCollected} / ${gameState.totalTimePieces}`, 15, 15);
  p.text(`Yarn: ${gameState.yarnCollected}`, 15, 35);
  
  // Health
  p.text("Health:", 15, 55);
  for (let i = 0; i < 3; i++) {
    if (i < gameState.player.health) {
      p.fill(255, 0, 0);
    } else {
      p.fill(100, 100, 100);
    }
    p.ellipse(75 + i * 25, 63, 15, 15);
  }
  
  // Current hat
  p.fill(255, 255, 255);
  p.text(`Hat: ${gameState.currentHat}`, 15, 75);
  
  // Hat switching hint
  if (gameState.unlockedHats.length > 1) {
    p.textSize(10);
    p.fill(200, 200, 200);
    p.text("Press 1-4 to switch hats", 15, 95);
  }
  
  // Paused indicator
  if (gameState.gamePhase === PHASE.PAUSED) {
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.fill(255, 255, 0);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
  
  p.pop();
}

export function drawGameOverScreen(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === PHASE.GAME_OVER_WIN) {
    // Win screen
    p.textSize(48);
    p.fill(255, 215, 0);
    p.stroke(255, 255, 255);
    p.strokeWeight(4);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
    
    p.noStroke();
    p.textSize(24);
    p.fill(255, 255, 255);
    p.text("All Time Pieces Collected!", CANVAS_WIDTH / 2, 160);
    
    p.textSize(18);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
    p.text(`Yarn Collected: ${gameState.yarnCollected}`, CANVAS_WIDTH / 2, 230);
    
    // Sparkle effect
    for (let i = 0; i < 10; i++) {
      const x = CANVAS_WIDTH / 2 + Math.cos(p.frameCount * 0.05 + i) * 100;
      const y = 100 + Math.sin(p.frameCount * 0.05 + i) * 50;
      p.fill(255, 255, 200, 200);
      p.ellipse(x, y, 5, 5);
    }
  } else {
    // Lose screen
    p.textSize(48);
    p.fill(255, 100, 100);
    p.stroke(255, 255, 255);
    p.strokeWeight(4);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
    
    p.noStroke();
    p.textSize(20);
    p.fill(255, 255, 255);
    p.text("Hat Kid needs to try again!", CANVAS_WIDTH / 2, 180);
    
    p.textSize(16);
    p.text(`Time Pieces: ${gameState.timePiecesCollected} / ${gameState.totalTimePieces}`, CANVAS_WIDTH / 2, 220);
  }
  
  // Restart prompt
  p.textSize(20);
  p.fill(255, 255, 255);
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 300);
  }
  
  p.pop();
}