// rendering.js
import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, COURSE_X_OFFSET, COURSE_WIDTH,
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED, 
  PHASE_GAME_OVER_LOSE, COLORS, gameState 
} from './globals.js';
import { renderParticles } from './particles.js';

export function renderGame(p) {
  // Background
  p.background(135, 206, 235); // Sky blue
  
  // Draw ground/course
  renderCourse(p);
  
  // Render game entities
  for (const obstacle of gameState.obstacles) {
    obstacle.render(p);
  }
  
  for (const ring of gameState.rings) {
    ring.render(p);
  }
  
  renderParticles(p, gameState.particles);
  
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // UI
  renderUI(p);
}

function renderCourse(p) {
  // Course background
  p.push();
  p.fill(100, 180, 100);
  p.noStroke();
  p.rect(COURSE_X_OFFSET, 0, COURSE_WIDTH, CANVAS_HEIGHT);
  
  // Course lines
  p.stroke(80, 150, 80);
  p.strokeWeight(2);
  const lineOffset = (gameState.frameCounter * gameState.courseSpeed) % 40;
  for (let y = -40 + lineOffset; y < CANVAS_HEIGHT; y += 40) {
    p.line(COURSE_X_OFFSET, y, COURSE_X_OFFSET + COURSE_WIDTH, y);
  }
  
  // Course borders
  p.fill(60, 40, 20);
  p.noStroke();
  p.rect(0, 0, COURSE_X_OFFSET, CANVAS_HEIGHT);
  p.rect(COURSE_X_OFFSET + COURSE_WIDTH, 0, CANVAS_WIDTH - COURSE_X_OFFSET - COURSE_WIDTH, CANVAS_HEIGHT);
  p.pop();
}

function renderUI(p) {
  p.push();
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  
  // Score
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Neck length with color indicator
  const color = COLORS[gameState.currentColor];
  p.fill(...color.rgb);
  p.text(`Neck: ${gameState.neckLength}`, 10, 35);
  
  // Current color
  p.fill(255);
  p.text(`Color: ${color.display}`, 10, 60);
  
  // Distance
  p.text(`Distance: ${Math.floor(gameState.distance / 10)}m`, 10, 85);
  
  // Gems
  p.text(`Gems: ${gameState.totalGems}`, 10, 110);
  
  // Paused indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(14);
    p.fill(255, 255, 100);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
  
  p.pop();
}

export function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  p.push();
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("Long Neck Run", CANVAS_WIDTH / 2, 80);
  
  // Instructions
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  
  const instructions = [
    "Collect colored rings to grow your neck!",
    "",
    "Match your color: +1 neck length",
    "Wrong color: -2 neck length",
    "",
    "Pass obstacles with enough neck length:",
    "Hurdle (8+), Pool (10+), Zipline (15+)",
    "",
    "Controls:",
    "← → : Move horizontally",
    "SPACE: Change color",
    "",
    "Survive as long as possible!"
  ];
  
  let yPos = 150;
  for (const line of instructions) {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 20;
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  
  p.pop();
}

export function renderGameOverScreen(p) {
  p.background(40, 20, 20);
  
  p.push();
  // Game Over title
  p.fill(255, 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("Game Over", CANVAS_WIDTH / 2, 100);
  
  // Stats
  p.fill(255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 170);
  p.text(`Distance: ${Math.floor(gameState.distance / 10)}m`, CANVAS_WIDTH / 2, 200);
  p.text(`Final Neck Length: ${gameState.neckLength}`, CANVAS_WIDTH / 2, 230);
  
  // Gems earned
  const gemsEarned = Math.floor(gameState.neckLength / 5);
  p.fill(255, 220, 100);
  p.textSize(24);
  p.text(`Gems Earned: ${gemsEarned}`, CANVAS_WIDTH / 2, 270);
  p.text(`Total Gems: ${gameState.totalGems}`, CANVAS_WIDTH / 2, 300);
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
  
  p.pop();
}