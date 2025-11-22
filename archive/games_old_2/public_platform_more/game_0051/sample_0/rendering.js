// rendering.js
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, POWER_UPS } from './globals.js';

export function renderStartScreen(p) {
  p.background(100, 150, 255);
  
  // Draw decorative golf course background
  p.fill(50, 150, 50);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);
  
  p.fill(80, 180, 80);
  for (let i = 0; i < 5; i++) {
    const x = (i * CANVAS_WIDTH / 5) + (CANVAS_WIDTH / 10);
    const y = CANVAS_HEIGHT - 50 + Math.sin(i) * 10;
    p.ellipse(x, y, 80, 40);
  }
  
  // Title
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(4);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("STICKMAN GOLF", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.noStroke();
  p.textSize(20);
  p.fill(255, 255, 150);
  p.text("Physics-Based Challenge", CANVAS_WIDTH / 2, 130);
  
  // Instructions
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "Get the ball in the hole in the fewest strokes!",
    "",
    "Controls:",
    "Arrow Keys (Left/Right): Adjust shot angle",
    "Arrow Keys (Up/Down): Adjust shot power",
    "SPACE: Take the shot",
    "S: Activate Sticky Ball power-up",
    "W: Activate Power Boost power-up",
    "ESC: Pause game"
  ];
  
  let yPos = 170;
  instructions.forEach(line => {
    p.text(line, 50, yPos);
    yPos += 20;
  });
  
  // Press Enter prompt
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 0, pulse * 255);
  p.textSize(24);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

export function renderGame(p) {
  // Sky background
  p.background(135, 206, 235);
  
  // Draw clouds
  p.fill(255, 255, 255, 150);
  p.noStroke();
  p.ellipse(100, 50, 60, 30);
  p.ellipse(130, 50, 60, 30);
  p.ellipse(400, 80, 80, 40);
  p.ellipse(440, 80, 70, 35);
  
  // Draw all entities
  gameState.obstacles.forEach(obstacle => {
    if (obstacle.render) obstacle.render();
  });
  
  if (gameState.holePosition) {
    const hole = gameState.entities.find(e => e.constructor.name === 'Hole');
    if (hole) hole.render();
  }
  
  if (gameState.player) {
    gameState.player.render();
  }
  
  if (gameState.ball) {
    gameState.ball.render();
  }
  
  // Draw aiming line when ball is stationary
  if (!gameState.ballInMotion && gameState.ball) {
    drawAimingLine(p);
  }
  
  // Draw UI
  drawUI(p);
}

function drawAimingLine(p) {
  const ball = gameState.ball;
  const angle = gameState.aimingVisuals.angle;
  const power = gameState.aimingVisuals.power;
  
  const radians = (angle * Math.PI) / 180;
  const lineLength = power * 2;
  
  const endX = ball.body.position.x + Math.cos(radians) * lineLength;
  const endY = ball.body.position.y + Math.sin(radians) * lineLength;
  
  p.push();
  p.stroke(255, 255, 0);
  p.strokeWeight(3);
  p.drawingContext.setLineDash([5, 5]);
  p.line(ball.body.position.x, ball.body.position.y, endX, endY);
  p.drawingContext.setLineDash([]);
  
  // Draw arrow head
  p.fill(255, 255, 0);
  p.noStroke();
  p.push();
  p.translate(endX, endY);
  p.rotate(radians);
  p.triangle(0, 0, -10, -5, -10, 5);
  p.pop();
  
  p.pop();
}

function drawUI(p) {
  // Score panel
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(10, 10, 180, 120, 5);
  
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Course: ${gameState.currentCourse + 1}`, 20, 20);
  p.text(`Strokes: ${gameState.strokes}`, 20, 40);
  p.text(`Score: ${gameState.score}`, 20, 60);
  p.text(`Currency: ${gameState.currency}`, 20, 80);
  p.text(`Angle: ${Math.round(gameState.aimingVisuals.angle)}°`, 20, 100);
  
  // Power-ups panel
  p.fill(0, 0, 0, 150);
  p.rect(CANVAS_WIDTH - 130, 10, 120, 80, 5);
  
  p.fill(255);
  p.textSize(12);
  p.text("Power-ups:", CANVAS_WIDTH - 120, 20);
  
  // Sticky ball
  const stickyColor = gameState.activePowerUp === POWER_UPS.STICKY ? 
    [255, 255, 0] : [255, 255, 255];
  p.fill(stickyColor);
  p.text(`[S] Sticky: ${gameState.powerUps.sticky}`, CANVAS_WIDTH - 120, 40);
  
  // Boost
  const boostColor = gameState.activePowerUp === POWER_UPS.BOOST ? 
    [255, 255, 0] : [255, 255, 255];
  p.fill(boostColor);
  p.text(`[W] Boost: ${gameState.powerUps.boost}`, CANVAS_WIDTH - 120, 60);
  
  // Power meter
  const meterWidth = 100;
  const meterHeight = 20;
  const meterX = CANVAS_WIDTH - 130;
  const meterY = CANVAS_HEIGHT - 50;
  
  p.fill(0, 0, 0, 150);
  p.rect(meterX, meterY, meterWidth + 20, meterHeight + 20, 5);
  
  p.fill(50);
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(meterX + 10, meterY + 10, meterWidth, meterHeight);
  
  const powerFill = (gameState.aimingVisuals.power / 100) * meterWidth;
  p.noStroke();
  p.fill(255, 200, 0);
  p.rect(meterX + 10, meterY + 10, powerFill, meterHeight);
  
  p.fill(255);
  p.textSize(10);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("POWER", meterX + 60, meterY + 20);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(3);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.noStroke();
  p.textSize(20);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  p.background(50, 100, 150);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(4);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (isWin) {
    p.fill(100, 255, 100);
    p.text("COURSE COMPLETE!", CANVAS_WIDTH / 2, 80);
  } else {
    p.fill(255, 100, 100);
    p.text("OUT OF STROKES!", CANVAS_WIDTH / 2, 80);
  }
  
  // Stats
  p.fill(255);
  p.noStroke();
  p.textSize(24);
  p.text(`Strokes: ${gameState.strokes}`, CANVAS_WIDTH / 2, 150);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 190);
  p.text(`Currency Earned: ${gameState.currency}`, CANVAS_WIDTH / 2, 230);
  
  if (isWin) {
    p.textSize(18);
    p.fill(255, 255, 150);
    p.text(`Course ${gameState.currentCourse + 1} unlocked!`, CANVAS_WIDTH / 2, 270);
  }
  
  // Restart prompt
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 0, pulse * 255);
  p.textSize(24);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
}