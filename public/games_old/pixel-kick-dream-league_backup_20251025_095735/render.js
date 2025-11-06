// render.js - Rendering functions
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Ball, Defender, Goalkeeper } from './entities.js';

export function renderGame(p) {
  p.background(34, 139, 34);
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    renderPlayingScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    renderPlayingScreen(p);
    renderPausedOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    renderGameOverScreen(p, true);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOverScreen(p, false);
  }
}

function renderStartScreen(p) {
  p.push();
  
  // Title
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PIXEL KICK', CANVAS_WIDTH / 2, 100);
  
  p.textSize(24);
  p.text('Dream League', CANVAS_WIDTH / 2, 140);
  
  // Description
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  const desc = [
    'Score goals by aiming, powering, and curving your shots.',
    'Beat defenders and the goalkeeper across 5 challenging levels.',
    '',
    'Arrow Keys: Adjust aim (Left/Right) and power (Up/Down)',
    'Z: Apply left curve | Shift: Apply right curve',
    'Space: Take the shot',
    'ESC: Pause | R: Restart to menu',
    '',
    'Precision Bonus: +50 points for hitting no defenders!'
  ];
  
  let yPos = 190;
  desc.forEach(line => {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 20;
  });
  
  // Start prompt
  p.textSize(20);
  p.fill(255, 255, 0);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 370);
  }
  
  p.pop();
}

function renderPlayingScreen(p) {
  // Draw field
  drawField(p);
  
  // Draw goal
  drawGoal(p);
  
  // Draw entities (defenders, goalkeeper, ball)
  gameState.entities.forEach(entity => {
    if (entity instanceof Ball) return; // Draw ball last
    if (entity.render) {
      entity.render(p);
    }
  });
  
  // Draw ball
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Draw aiming UI
  if (gameState.shotPhase === 'AIMING') {
    drawAimingUI(p);
  }
  
  // Draw HUD
  drawHUD(p);
}

function drawField(p) {
  p.push();
  
  // Field boundaries
  p.noFill();
  p.stroke(255);
  p.strokeWeight(3);
  p.rect(50, 50, 500, 340);
  
  // Center circle
  p.noFill();
  p.circle(300, 200, 80);
  
  // Center line
  p.line(50, 200, 550, 200);
  
  p.pop();
}

function drawGoal(p) {
  const goalWidth = gameState.levelData ? gameState.levelData.goalWidth : 120;
  const goalLeft = 300 - goalWidth / 2;
  const goalRight = 300 + goalWidth / 2;
  
  p.push();
  
  // Goal area
  p.fill(50, 100, 50, 100);
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(goalLeft, 50, goalWidth, 40);
  
  // Goal posts
  p.fill(255);
  p.noStroke();
  p.rect(goalLeft - 3, 50, 6, 40);
  p.rect(goalRight - 3, 50, 6, 40);
  
  // Net pattern
  p.stroke(255, 150);
  p.strokeWeight(1);
  for (let i = 0; i < 5; i++) {
    const x = goalLeft + (goalWidth / 4) * i;
    p.line(x, 50, x, 90);
  }
  for (let i = 0; i < 3; i++) {
    const y = 50 + 13.3 * i;
    p.line(goalLeft, y, goalRight, y);
  }
  
  p.pop();
}

function drawAimingUI(p) {
  if (!gameState.player) return;
  
  const ball = gameState.player;
  const arrowLength = 100;
  
  p.push();
  
  // Aiming arrow
  p.stroke(255, 255, 0);
  p.strokeWeight(3);
  const endX = ball.x + Math.cos(gameState.aimAngle) * arrowLength;
  const endY = ball.y + Math.sin(gameState.aimAngle) * arrowLength;
  p.line(ball.x, ball.y, endX, endY);
  
  // Arrow head
  const headSize = 10;
  const angle = gameState.aimAngle;
  p.fill(255, 255, 0);
  p.noStroke();
  p.triangle(
    endX, endY,
    endX - headSize * Math.cos(angle - 0.5), endY - headSize * Math.sin(angle - 0.5),
    endX - headSize * Math.cos(angle + 0.5), endY - headSize * Math.sin(angle + 0.5)
  );
  
  // Power meter
  p.fill(50);
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(520, 100, 30, 200);
  
  const powerHeight = (gameState.shotPower / 100) * 196;
  const powerColor = gameState.shotPower < 50 ? [255, 255, 0] : [255, 100, 0];
  p.fill(...powerColor);
  p.noStroke();
  p.rect(522, 298 - powerHeight, 26, powerHeight);
  
  p.fill(255);
  p.textAlign(p.CENTER);
  p.textSize(12);
  p.text('POWER', 535, 90);
  p.text(Math.round(gameState.shotPower), 535, 310);
  
  // Curve indicator
  p.textAlign(p.CENTER);
  p.textSize(14);
  if (gameState.shotCurveDirection === 'LEFT') {
    p.fill(100, 200, 255);
    p.text('◄ LEFT CURVE', ball.x, ball.y - 30);
  } else if (gameState.shotCurveDirection === 'RIGHT') {
    p.fill(100, 200, 255);
    p.text('RIGHT CURVE ►', ball.x, ball.y - 30);
  }
  
  p.pop();
}

function drawHUD(p) {
  p.push();
  
  // Score (top-left)
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(20);
  p.text(`SCORE: ${gameState.score}`, 10, 10);
  
  // Level (top-right)
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`LEVEL: ${gameState.currentLevel}/${gameState.totalLevels}`, CANVAS_WIDTH - 10, 10);
  
  // Level name
  if (gameState.levelData) {
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(16);
    p.fill(255, 255, 150);
    p.text(gameState.levelData.name, CANVAS_WIDTH / 2, 10);
  }
  
  // Goal message
  if (gameState.isGoal && gameState.shotPhase === 'COMPLETE') {
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.fill(255, 215, 0);
    p.text('GOAL!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    
    p.textSize(20);
    const bonus = gameState.defenderCollisions === 0 ? '+50 Precision Bonus!' : '';
    p.text(bonus, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
  } else if (!gameState.isGoal && gameState.shotPhase === 'COMPLETE') {
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.fill(255, 100, 100);
    p.text('MISS!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
  
  p.pop();
}

function renderPausedOverlay(p) {
  p.push();
  
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(20);
  p.text('PAUSED', CANVAS_WIDTH - 10, 10);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text('ESC: Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  p.text('R: Restart to Menu', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  p.pop();
}

function renderGameOverScreen(p, isWin) {
  p.push();
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (isWin) {
    p.textSize(48);
    p.fill(255, 215, 0);
    p.text('GAME COMPLETE!', CANVAS_WIDTH / 2, 120);
    
    p.textSize(32);
    p.fill(255);
    p.text('Congratulations!', CANVAS_WIDTH / 2, 180);
    
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
    p.text(`All ${gameState.totalLevels} levels conquered!`, CANVAS_WIDTH / 2, 270);
  } else {
    p.textSize(48);
    p.fill(255, 100, 100);
    p.text('LEVEL FAILED', CANVAS_WIDTH / 2, 150);
    
    p.textSize(24);
    p.fill(255);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  }
  
  p.textSize(20);
  p.fill(255, 255, 0);
  const flash = Math.sin(p.frameCount * 0.1) > 0;
  if (flash) {
    p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 330);
  }
  
  p.pop();
}