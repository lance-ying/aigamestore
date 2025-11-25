import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 30, 50);
  
  // Animated background
  p.fill(40, 60, 100, 50);
  p.noStroke();
  for (let i = 0; i < 5; i++) {
    const offset = (p.frameCount * 0.5 + i * 50) % CANVAS_HEIGHT;
    p.ellipse(100 + i * 100, offset, 60, 60);
  }
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.strokeWeight(3);
  p.stroke(50, 30, 10);
  p.text("TOGETHER ESCAPE", CANVAS_WIDTH / 2, 60);
  
  // Subtitle
  p.noStroke();
  p.fill(150, 200, 255);
  p.textSize(16);
  p.text("A Cooperative Adventure", CANVAS_WIDTH / 2, 95);
  
  // Instructions box
  p.fill(30, 40, 60, 200);
  p.stroke(100, 150, 200);
  p.strokeWeight(2);
  p.rect(50, 120, CANVAS_WIDTH - 100, 200, 10);
  
  // Instructions
  p.noStroke();
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    "OBJECTIVE:",
    "Guide both friends through the level together!",
    "Collect all keys to unlock doors.",
    "Both must reach the exit portal to win.",
    "",
    "CONTROLS:",
    "Player 1 (Blue): Arrow Keys (↑ to jump)",
    "Player 2 (Red): WASD (W to jump)",
    "SPACE: Switch active player (single-player)",
    "",
    "RULES:",
    "• Avoid spikes and falling off!",
    "• Both players must survive to win",
    "• Work together to overcome obstacles"
  ];
  
  let yPos = 130;
  for (let line of instructions) {
    if (line.includes("OBJECTIVE") || line.includes("CONTROLS") || line.includes("RULES")) {
      p.fill(255, 220, 100);
      p.textSize(13);
    } else {
      p.fill(200, 220, 255);
      p.textSize(12);
    }
    p.text(line, 70, yPos);
    yPos += line === "" ? 8 : 18;
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const alpha = 200 + Math.sin(p.frameCount * 0.1) * 55;
  p.fill(100, 255, 100, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

export function drawPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 220, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function drawGameOverScreen(p, won) {
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Result message
  p.textAlign(p.CENTER, p.CENTER);
  if (won) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("YOU WIN!", CANVAS_WIDTH / 2, 130);
    
    p.fill(255, 255, 255);
    p.textSize(20);
    p.text("You escaped together!", CANVAS_WIDTH / 2, 180);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 130);
    
    p.fill(255, 255, 255);
    p.textSize(20);
    p.text("One of you didn't make it...", CANVAS_WIDTH / 2, 180);
  }
  
  // Score
  p.fill(255, 220, 100);
  p.textSize(24);
  p.text(`Keys Collected: ${gameState.keysCollected}`, CANVAS_WIDTH / 2, 230);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 260);
  
  // Restart prompt
  p.fill(150, 200, 255);
  p.textSize(18);
  const alpha = 200 + Math.sin(p.frameCount * 0.1) * 55;
  p.fill(150, 200, 255, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
}

export function drawHUD(p) {
  // Semi-transparent background for HUD
  p.fill(0, 0, 0, 100);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  // Keys collected
  p.fill(255, 215, 0);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Keys: ${gameState.keysCollected}/3`, 10, 10);
  
  // Score
  p.fill(150, 200, 255);
  p.text(`Score: ${gameState.score}`, 120, 10);
  
  // Player status
  const p1Status = gameState.player1 && gameState.player1.isAlive ? "ALIVE" : "DEAD";
  const p2Status = gameState.player2 && gameState.player2.isAlive ? "ALIVE" : "DEAD";
  
  p.fill(100, 150, 255);
  p.textSize(12);
  p.text(`P1: ${p1Status}`, 250, 12);
  
  p.fill(255, 100, 100);
  p.text(`P2: ${p2Status}`, 330, 12);
  
  // Controls hint
  p.fill(200, 200, 200);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(10);
  p.text("ESC: Pause | R: Restart", CANVAS_WIDTH - 10, 12);
}