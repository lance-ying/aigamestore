// rendering.js - Rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 50, 30);
  
  // Replaced title with "press enter to begin" centered vertically
  p.fill(255, 255, 0); // Yellow color for the prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32); // Slightly larger for prominence
  if (Math.floor(p.frameCount / 30) % 2 === 0) {
    p.text("press enter to begin", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2); // Centered vertically
  }
  
  // Preserved Instructions, adjusted vertical position
  p.textSize(12);
  p.fill(200, 200, 200);
  p.textAlign(p.LEFT);
  p.text("Arrow Keys: Aim & Adjust Power", 100, CANVAS_HEIGHT / 2 + 70); // Adjusted Y position
  p.text("Shift + Arrows: Apply Spin", 100, CANVAS_HEIGHT / 2 + 90); // Adjusted Y position
  p.text("Space: Execute Shot", 100, CANVAS_HEIGHT / 2 + 110); // Adjusted Y position
  p.text("ESC: Pause    R: Restart", 100, CANVAS_HEIGHT / 2 + 130); // Adjusted Y position
}

export function renderGame(p) {
  p.background(50, 30, 20);
  
  // Render table
  if (gameState.table) {
    gameState.table.render();
  }
  
  // Render balls
  gameState.ballsOnTable.forEach(ball => ball.render());
  
  // Render cue stick (only during aiming)
  if (gameState.playingPhase === "AIMING" && gameState.cueStick && gameState.cueBall && !gameState.cueBall.pocketed) {
    gameState.cueStick.render(gameState.cueBall, gameState.aimAngle, gameState.shotPower);
    
    // Render aim guide
    renderAimGuide(p);
  }
  
  // Render UI
  renderUI(p);
  
  // Render foul message
  if (gameState.foulStatus || gameState.playingPhase === "FOUL") {
    p.fill(255, 0, 0);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text(gameState.foulMessage || "FOUL!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
}

function renderAimGuide(p) {
  if (!gameState.cueBall || gameState.cueBall.pocketed) return;
  
  const cueBallPos = gameState.cueBall.body.position;
  const guideLength = 100;
  
  p.stroke(255, 255, 255, 100);
  p.strokeWeight(2);
  p.line(
    cueBallPos.x,
    cueBallPos.y,
    cueBallPos.x + Math.cos(gameState.aimAngle) * guideLength,
    cueBallPos.y + Math.sin(gameState.aimAngle) * guideLength
  );
}

function renderUI(p) {
  // Score (top-right)
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`SCORE: ${String(gameState.score).padStart(5, '0')}`, CANVAS_WIDTH - 10, 10);
  
  // Level and difficulty (top-left)
  p.textAlign(p.LEFT, p.TOP);
  let difficulty = "EASY";
  if (gameState.level >= 7) difficulty = "HARD";
  else if (gameState.level >= 4) difficulty = "MEDIUM";
  
  p.text(`LEVEL: ${gameState.level}/9`, 10, 10);
  p.textSize(12);
  p.fill(difficulty === "EASY" ? [0, 255, 0] : difficulty === "MEDIUM" ? [255, 200, 0] : [255, 50, 50]);
  p.text(`[${difficulty}]`, 10, 28);
  
  // Balls remaining (top-center)
  const ballsRemaining = gameState.ballsOnTable.filter(b => !b.pocketed && b.number !== 0).length;
  p.textAlign(p.CENTER, p.TOP);
  p.fill(255, 215, 0);
  p.textSize(16);
  p.text(`BALLS LEFT: ${ballsRemaining}`, CANVAS_WIDTH / 2, 10);
  
  // Power meter (bottom-left)
  if (gameState.playingPhase === "AIMING") {
    const meterWidth = 100;
    const meterHeight = 10;
    const meterX = 10;
    const meterY = CANVAS_HEIGHT - 30;
    
    p.fill(50);
    p.noStroke();
    p.rect(meterX, meterY, meterWidth, meterHeight);
    
    const powerRatio = gameState.shotPower / gameState.maxShotPower;
    const powerColor = p.lerpColor(p.color(0, 255, 0), p.color(255, 0, 0), powerRatio);
    p.fill(powerColor);
    p.rect(meterX, meterY, meterWidth * powerRatio, meterHeight);
    
    p.fill(255);
    p.textAlign(p.LEFT, p.BOTTOM);
    p.textSize(10);
    p.text("POWER", meterX, meterY - 2);
  }
  
  // Spin indicator (bottom-right)
  if (gameState.playingPhase === "AIMING" && (gameState.spinEffect.x !== 0 || gameState.spinEffect.y !== 0)) {
    const spinX = CANVAS_WIDTH - 40;
    const spinY = CANVAS_HEIGHT - 40;
    
    p.fill(100);
    p.noStroke();
    p.circle(spinX, spinY, 30);
    
    p.fill(255, 255, 0);
    p.circle(spinX + gameState.spinEffect.x * 10, spinY + gameState.spinEffect.y * 10, 8);
    
    p.fill(255);
    p.textAlign(p.RIGHT, p.BOTTOM);
    p.textSize(10);
    p.text("SPIN", spinX + 15, spinY - 20);
  }
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  p.textSize(16);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  p.text("Press R to restart", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 55);
}

export function renderGameOver(p) {
  p.background(20, 20, 20);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Message
  p.fill(isWin ? [0, 255, 0] : [255, 0, 0]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "LEVEL COMPLETE!" : "GAME OVER", CANVAS_WIDTH / 2, 120);
  
  // Score
  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.text(`Level: ${gameState.level}/9`, CANVAS_WIDTH / 2, 210);
  
  // Next level or restart
  p.textSize(16);
  if (isWin && gameState.level < 9) {
    p.text("Press ENTER for Next Level", CANVAS_WIDTH / 2, 280);
  } else if (isWin && gameState.level === 9) {
    p.text("ALL 9 LEVELS COMPLETE!", CANVAS_WIDTH / 2, 250);
    p.fill(255, 215, 0);
    p.textSize(20);
    p.text("You are the Pool Master!", CANVAS_WIDTH / 2, 280);
  }
  
  p.fill(255);
  p.textSize(16);
  p.text("Press R to Restart", CANVAS_WIDTH / 2, 320);
}