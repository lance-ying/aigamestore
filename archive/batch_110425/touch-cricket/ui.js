// ui.js - UI rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(34, 139, 34); // Cricket field green
  
  // Draw decorative field
  drawField(p);
  
  // Title
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("TOUCH CRICKET", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.textSize(20);
  p.textStyle(p.NORMAL);
  p.text("Arcade Batting Challenge", CANVAS_WIDTH / 2, 120);
  
  // Game description
  p.textSize(14);
  p.fill(255, 255, 200);
  const desc = [
    "Face challenging deliveries and time your shots perfectly!",
    "Combine footwork and directional strokes to score runs.",
    "Survive 10 wickets and reach the target score to win!"
  ];
  
  desc.forEach((line, i) => {
    p.text(line, CANVAS_WIDTH / 2, 160 + i * 20);
  });
  
  // Controls
  p.textSize(13);
  p.fill(255);
  p.textAlign(p.LEFT);
  const controls = [
    "W/↑: Front Foot Shot",
    "S/↓: Back Foot Shot",
    "A/←: Off Side Shot",
    "D/→: On Side Shot",
    "SPACE: Defensive Block",
    "SHIFT: Power Shot (hold)",
    "Z: Late Cut/Flick"
  ];
  
  const startX = CANVAS_WIDTH / 2 - 130;
  controls.forEach((control, i) => {
    p.text(control, startX, 240 + i * 18);
  });
  
  // Target info
  p.textAlign(p.CENTER);
  p.textSize(16);
  p.fill(255, 255, 100);
  p.text(`Target: ${gameState.targetScore} runs | Wickets: ${gameState.wickets}`, CANVAS_WIDTH / 2, 360);
  
  // Start prompt
  p.textSize(20);
  p.fill(255, 255, 0);
  const flash = Math.floor(p.frameCount / 30) % 2;
  if (flash) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  }
}

export function renderGame(p) {
  // Draw field
  p.background(34, 139, 34);
  drawField(p);
  
  // Draw field zones
  gameState.fieldZones.forEach(zone => zone.render());
  
  // Draw entities
  if (gameState.bowler) {
    gameState.bowler.render();
  }
  
  if (gameState.player) {
    gameState.player.render();
  }
  
  if (gameState.ball) {
    gameState.ball.render();
  }
  
  // Draw particles
  gameState.particles.forEach(particle => particle.render());
  
  // Draw UI
  renderGameUI(p);
  
  // Draw delivery info
  if (gameState.deliveryType) {
    p.fill(255, 255, 255, 200);
    p.textSize(12);
    p.textAlign(p.LEFT);
    p.text(`Delivery: ${gameState.deliveryType}`, 10, CANVAS_HEIGHT - 10);
  }
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(16);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

export function renderGameOver(p) {
  p.background(20, 20, 40);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(isWin ? [255, 215, 0] : [255, 100, 100]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text(isWin ? "VICTORY!" : "ALL OUT!", CANVAS_WIDTH / 2, 80);
  
  // Score
  p.fill(255);
  p.textSize(32);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 150);
  
  // Stats
  p.textSize(18);
  p.text(`Balls Played: ${gameState.ballsPlayed}`, CANVAS_WIDTH / 2, 190);
  p.text(`Wickets Lost: ${10 - gameState.wickets}`, CANVAS_WIDTH / 2, 220);
  
  const strikeRate = gameState.ballsPlayed > 0 ? 
                     ((gameState.score / gameState.ballsPlayed) * 100).toFixed(1) : 0;
  p.text(`Strike Rate: ${strikeRate}`, CANVAS_WIDTH / 2, 250);
  
  // Message
  p.textSize(16);
  p.fill(200, 200, 255);
  if (isWin) {
    p.text("Excellent batting! You've reached the target!", CANVAS_WIDTH / 2, 290);
  } else {
    p.text("Better luck next time! Practice your timing.", CANVAS_WIDTH / 2, 290);
  }
  
  // Restart prompt
  p.textSize(20);
  p.fill(255, 255, 0);
  const flash = Math.floor(p.frameCount / 30) % 2;
  if (flash) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  }
}

function renderGameUI(p) {
  // Score panel
  p.fill(0, 0, 0, 150);
  p.rect(10, 10, 200, 80);
  
  p.fill(255, 255, 0);
  p.textAlign(p.LEFT);
  p.textSize(24);
  p.text(`Score: ${gameState.score}`, 20, 35);
  
  p.fill(255);
  p.textSize(16);
  p.text(`Target: ${gameState.targetScore}`, 20, 55);
  p.text(`Wickets: ${gameState.wickets}`, 20, 75);
  
  // Balls played
  p.fill(200, 200, 255);
  p.textSize(14);
  p.textAlign(p.RIGHT);
  p.text(`Balls: ${gameState.ballsPlayed}`, CANVAS_WIDTH - 20, 30);
  
  // Shot indicator
  if (gameState.shotPrepared) {
    p.fill(255, 255, 0, 150);
    p.rect(CANVAS_WIDTH / 2 - 100, 10, 200, 30);
    p.fill(0);
    p.textAlign(p.CENTER);
    p.textSize(14);
    p.text(`Shot Ready: ${gameState.shotType}`, CANVAS_WIDTH / 2, 28);
  }
}

function drawField(p) {
  // Pitch
  p.fill(160, 120, 80);
  p.rect(CANVAS_WIDTH / 2 - 50, 100, 100, 240);
  
  // Pitch lines
  p.stroke(255, 200);
  p.strokeWeight(1);
  for (let i = 0; i < 5; i++) {
    const y = 120 + i * 50;
    p.line(CANVAS_WIDTH / 2 - 50, y, CANVAS_WIDTH / 2 + 50, y);
  }
  
  // Boundary circle
  p.noFill();
  p.stroke(255, 255, 255, 100);
  p.strokeWeight(2);
  p.circle(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 360);
  
  // Creases
  p.stroke(255);
  p.strokeWeight(2);
  p.line(CANVAS_WIDTH / 2 - 60, 320, CANVAS_WIDTH / 2 + 60, 320); // Batting crease
  p.line(CANVAS_WIDTH / 2 - 60, 100, CANVAS_WIDTH / 2 + 60, 100); // Bowling crease
  
  p.noStroke();
}