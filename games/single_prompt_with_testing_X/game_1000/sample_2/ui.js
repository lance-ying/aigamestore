// ui.js - UI rendering functions
import { gameState, BIRD_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT, SLINGSHOT_X, SLINGSHOT_Y, GROUND_Y } from './globals.js';

export function drawStartScreen(p) {
  p.background(135, 206, 235);
  drawGround(p);
  
  // Title
  p.fill(0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("BIRD SIEGE", CANVAS_WIDTH / 2, 80);
  
  p.textSize(16);
  p.fill(50);
  const desc = "Launch birds to destroy enemy structures\nand defeat all the pigs!";
  p.text(desc, CANVAS_WIDTH / 2, 140);
  
  // Instructions
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.fill(0);
  const instructions = [
    "CONTROLS:",
    "• Arrow Keys: Adjust aim angle and power",
    "• SPACE: Launch bird / Activate ability",
    "• Z: Change bird type",
    "• ESC: Pause game",
    "",
    "BIRD ABILITIES:",
    "• Red: No special ability",
    "• Blue: Splits into 3 birds",
    "• Yellow: Speed boost",
    "• Black: Explosive impact"
  ];
  
  let y = 200;
  instructions.forEach(line => {
    p.text(line, 50, y);
    y += 20;
  });
  
  // Start prompt
  p.textSize(20);
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(0, 150, 0);
  if (p.frameCount % 60 < 30) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  }
}

export function drawPausedIndicator(p) {
  p.push();
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.fill(255, 0, 0);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

export function drawGameOverScreen(p, won) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255);
  p.textSize(48);
  p.text(won ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 120);
  
  p.textSize(24);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 170);
  p.text(`Gems Earned: ${won ? Math.floor(gameState.score / 10) : 0}`, CANVAS_WIDTH / 2, 210);
  
  p.textSize(18);
  p.fill(200);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 280);
  p.pop();
}

export function drawHUD(p) {
  p.push();
  p.fill(0);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Score: ${gameState.score}`, 10, 10);
  p.text(`Gems: ${gameState.gems}`, 10, 30);
  p.text(`Birds: ${gameState.birdsRemaining}`, 10, 50);
  p.text(`Level: ${gameState.level}`, 10, 70);
  
  // Current bird type
  const birdType = BIRD_TYPES[gameState.currentBirdType];
  p.text(`Bird: ${birdType.name}`, 10, 90);
  
  // Show unlocked birds
  p.textSize(12);
  p.text("Available (Z):", 10, 110);
  let yPos = 130;
  Object.entries(BIRD_TYPES).forEach(([key, type]) => {
    if (type.unlocked) {
      p.fill(key === gameState.currentBirdType ? [0, 200, 0] : [100, 100, 100]);
      p.text(`${type.name}`, 15, yPos);
      yPos += 15;
    }
  });
  
  p.pop();
}

export function drawSlingshot(p) {
  p.push();
  p.stroke(80, 50, 30);
  p.strokeWeight(6);
  p.line(SLINGSHOT_X - 15, SLINGSHOT_Y, SLINGSHOT_X - 15, SLINGSHOT_Y - 40);
  p.line(SLINGSHOT_X + 15, SLINGSHOT_Y, SLINGSHOT_X + 15, SLINGSHOT_Y - 40);
  
  p.fill(80, 50, 30);
  p.noStroke();
  p.rect(SLINGSHOT_X - 20, SLINGSHOT_Y, 40, 10);
  p.pop();
}

export function drawAimingLine(p) {
  const angle = p.radians(gameState.slingshotAngle);
  const power = gameState.slingshotPower;
  
  p.push();
  p.stroke(255, 0, 0, 100);
  p.strokeWeight(2);
  p.line(
    SLINGSHOT_X,
    SLINGSHOT_Y - 20,
    SLINGSHOT_X + p.cos(angle) * power * 10,
    SLINGSHOT_Y - 20 + p.sin(angle) * power * 10
  );
  
  // Draw trajectory preview
  p.stroke(255, 255, 0, 80);
  p.strokeWeight(3);
  p.noFill();
  p.beginShape();
  let px = SLINGSHOT_X;
  let py = SLINGSHOT_Y - 20;
  let vx = p.cos(angle) * power;
  let vy = p.sin(angle) * power;
  
  for (let i = 0; i < 40; i++) {
    p.vertex(px, py);
    vy += 0.3;
    px += vx;
    py += vy;
    if (py > GROUND_Y) break;
  }
  p.endShape();
  p.pop();
  
  // Power indicator
  p.push();
  p.fill(0);
  p.textSize(12);
  p.textAlign(p.CENTER);
  p.text(`Power: ${Math.floor(power)}`, SLINGSHOT_X, SLINGSHOT_Y + 40);
  p.text(`Angle: ${Math.floor(gameState.slingshotAngle)}°`, SLINGSHOT_X, SLINGSHOT_Y + 55);
  p.pop();
}

export function drawGround(p) {
  p.push();
  p.fill(100, 180, 80);
  p.noStroke();
  p.rect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
  
  // Grass texture
  p.stroke(80, 150, 60);
  p.strokeWeight(2);
  for (let x = 0; x < CANVAS_WIDTH; x += 10) {
    const h = p.random(5, 10);
    p.line(x, GROUND_Y, x, GROUND_Y - h);
  }
  p.pop();
}

export function drawSky(p) {
  // Sky gradient
  for (let y = 0; y < GROUND_Y; y++) {
    const inter = p.map(y, 0, GROUND_Y, 0, 1);
    const c = p.lerpColor(p.color(135, 206, 235), p.color(200, 230, 255), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Clouds
  p.push();
  p.noStroke();
  p.fill(255, 255, 255, 180);
  p.ellipse(100, 50, 60, 30);
  p.ellipse(120, 45, 50, 25);
  p.ellipse(80, 45, 40, 20);
  
  p.ellipse(350, 80, 70, 35);
  p.ellipse(380, 75, 60, 30);
  p.ellipse(320, 75, 50, 25);
  p.pop();
}