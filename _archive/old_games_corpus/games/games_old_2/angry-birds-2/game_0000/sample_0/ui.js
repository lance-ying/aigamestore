// ui.js - User interface rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  p.background(135, 206, 235); // Sky blue
  
  // Title
  p.fill(220, 50, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("ANGRY BIRDS", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(255);
  p.textSize(20);
  p.textStyle(p.NORMAL);
  p.text("Physics Puzzle", CANVAS_WIDTH / 2, 120);
  
  // Instructions
  p.fill(50);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "OBJECTIVE:",
    "• Destroy all the green pigs!",
    "• Use physics to collapse structures",
    "• Aim carefully with limited birds",
    "",
    "CONTROLS:",
    "• Arrow Keys: Aim angle & adjust power",
    "• SPACE: Launch bird",
    "• Z: Use special ability (mid-flight)",
    "",
    "BIRD TYPES:",
    "• Red: Speed boost",
    "• Blue: Split into 3 birds",
    "• Yellow: Dive attack"
  ];
  
  let yPos = 160;
  instructions.forEach(line => {
    p.text(line, 100, yPos);
    yPos += 20;
  });
  
  // Start prompt
  p.fill(255, 200, 0);
  p.textSize(24);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  
  // Blinking effect
  if (p.frameCount % 60 < 30) {
    p.fill(255, 150, 0);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  }
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(20);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

export function renderGameOver(p) {
  p.background(135, 206, 235);
  
  const isWin = gameState.gamePhase === "GAME_OVER_WIN";
  
  // Title
  p.fill(isWin ? [50, 200, 50] : [200, 50, 50]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Score
  p.fill(50);
  p.textSize(24);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 160);
  
  if (isWin) {
    // Stars
    p.textSize(20);
    p.text("Stars Earned:", CANVAS_WIDTH / 2, 200);
    
    for (let i = 0; i < 3; i++) {
      if (i < gameState.starsEarned) {
        p.fill(255, 215, 0); // Gold
      } else {
        p.fill(150);
      }
      p.push();
      p.translate(CANVAS_WIDTH / 2 - 60 + i * 60, 240);
      drawStar(p, 0, 0, 15, 30, 5);
      p.pop();
    }
    
    p.fill(50);
    p.textSize(18);
    p.text(`Pigs Destroyed: ${gameState.pigsDestroyed}/${gameState.totalPigs}`, CANVAS_WIDTH / 2, 290);
  } else {
    p.fill(50);
    p.textSize(18);
    p.text(`Pigs Remaining: ${gameState.totalPigs - gameState.pigsDestroyed}`, CANVAS_WIDTH / 2, 220);
  }
  
  // Restart prompt
  p.fill(255, 200, 0);
  p.textSize(24);
  p.text("Press R to Restart", CANVAS_WIDTH / 2, 340);
}

function drawStar(p, x, y, radius1, radius2, npoints) {
  const angle = p.TWO_PI / npoints;
  const halfAngle = angle / 2.0;
  
  p.beginShape();
  for (let a = -p.PI / 2; a < p.TWO_PI - p.PI / 2; a += angle) {
    let sx = x + Math.cos(a) * radius2;
    let sy = y + Math.sin(a) * radius2;
    p.vertex(sx, sy);
    sx = x + Math.cos(a + halfAngle) * radius1;
    sy = y + Math.sin(a + halfAngle) * radius1;
    p.vertex(sx, sy);
  }
  p.endShape(p.CLOSE);
}

export function renderUI(p) {
  // Score
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(3);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(20);
  p.text(`Score: ${gameState.score}`, 10, 10);
  
  // Birds remaining
  p.text(`Birds: ${gameState.availableBirds.length + (gameState.currentBird ? 1 : 0)}`, 10, 35);
  
  // Pigs remaining
  p.text(`Pigs: ${gameState.totalPigs - gameState.pigsDestroyed}/${gameState.totalPigs}`, 10, 60);
  
  // Power meter
  if (gameState.currentBird && !gameState.birdInFlight) {
    p.fill(100);
    p.rect(10, 90, 100, 20);
    p.fill(255, 200, 0);
    p.rect(10, 90, gameState.slingshotPower, 20);
    p.fill(255);
    p.noStroke();
    p.textSize(12);
    p.text("Power", 10, 115);
    
    // Angle indicator
    p.text(`Angle: ${Math.round(gameState.slingshotAngle)}°`, 10, 130);
  }
  
  // Ability hint
  if (gameState.birdInFlight && !gameState.abilityUsed) {
    p.fill(255, 255, 0);
    p.stroke(0);
    p.strokeWeight(2);
    p.textSize(16);
    p.textAlign(p.CENTER, p.TOP);
    p.text("Press Z for special ability!", CANVAS_WIDTH / 2, 10);
  }
}

export function renderSlingshot(p) {
  if (!gameState.currentBird || gameState.birdInFlight) return;
  
  const slingshotX = 80;
  const slingshotY = 320;
  
  // Slingshot base
  p.fill(101, 67, 33);
  p.noStroke();
  p.rect(slingshotX - 5, slingshotY, 10, 40);
  
  // Slingshot arms
  p.stroke(60, 40, 20);
  p.strokeWeight(4);
  p.line(slingshotX - 15, slingshotY - 40, slingshotX - 5, slingshotY);
  p.line(slingshotX + 15, slingshotY - 40, slingshotX + 5, slingshotY);
  
  // Slingshot band
  const bird = gameState.currentBird;
  if (bird) {
    p.stroke(100, 50, 0);
    p.strokeWeight(3);
    p.line(slingshotX - 15, slingshotY - 40, bird.body.position.x, bird.body.position.y);
    p.line(slingshotX + 15, slingshotY - 40, bird.body.position.x, bird.body.position.y);
  }
  
  // Trajectory preview
  if (bird) {
    const radians = gameState.slingshotAngle * Math.PI / 180;
    const force = gameState.slingshotPower / 1000;
    const velocityX = Math.cos(radians) * force * 100;
    const velocityY = Math.sin(radians) * force * 100;
    
    p.stroke(255, 255, 255, 100);
    p.strokeWeight(2);
    p.noFill();
    
    let px = bird.body.position.x;
    let py = bird.body.position.y;
    
    for (let t = 0; t < 2; t += 0.1) {
      const x = px + velocityX * t;
      const y = py + velocityY * t + 0.5 * 980 * t * t / 60; // gravity effect
      
      if (y > 360) break;
      
      p.circle(x, y, 3);
    }
  }
}