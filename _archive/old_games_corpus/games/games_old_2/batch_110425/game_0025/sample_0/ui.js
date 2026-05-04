// ui.js - UI rendering functions

import { 
  gameState, 
  GAME_PHASES,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SLINGSHOT_X,
  SLINGSHOT_Y,
  STAR_THRESHOLDS,
  BIRD_BONUS
} from './globals.js';

export function renderStartScreen(p) {
  p.background(135, 206, 235);
  
  // Title
  p.fill(220, 50, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("RED'S FIRST FLIGHT", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(255);
  p.textSize(20);
  p.textStyle(p.NORMAL);
  p.text("An Angry Birds Tribute", CANVAS_WIDTH / 2, 130);
  
  // Instructions
  p.fill(50);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "HOW TO PLAY:",
    "• Use Arrow Keys to aim the slingshot",
    "• UP/DOWN adjusts power, LEFT/RIGHT adjusts angle",
    "• Press SPACE to launch the bird",
    "• Destroy all pigs to win!",
    "• Earn stars based on your score",
    "",
    "CONTROLS:",
    "• ENTER - Start Game",
    "• ESC - Pause/Unpause",
    "• R - Restart (on game over)"
  ];
  
  let y = 180;
  instructions.forEach(line => {
    p.text(line, 120, y);
    y += 20;
  });
  
  // Start prompt
  p.fill(220, 50, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.textStyle(p.BOLD);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
}

export function renderGame(p) {
  // Sky background
  p.background(135, 206, 235);
  
  // Clouds
  drawClouds(p);
  
  // Render all entities
  if (gameState.ground) gameState.ground.render();
  if (gameState.slingshot) {
    gameState.slingshot.render(gameState.slingshotAngle, gameState.slingshotPower);
  }
  
  gameState.blocks.forEach(block => block.render());
  gameState.pigs.forEach(pig => pig.render());
  gameState.birds.forEach(bird => bird.render());
  
  // Render trajectory guide if bird is ready
  if (gameState.currentBird && !gameState.birdLaunched) {
    renderTrajectory(p);
  }
  
  // UI
  renderHUD(p);
}

export function renderPausedOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(20);
  p.textStyle(p.NORMAL);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

export function renderGameOver(p) {
  p.background(135, 206, 235);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(isWin ? [100, 200, 100] : [200, 50, 50]);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.textStyle(p.BOLD);
  p.text(isWin ? "LEVEL COMPLETE!" : "LEVEL FAILED", CANVAS_WIDTH / 2, 80);
  
  // Score
  p.fill(50);
  p.textSize(32);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 150);
  
  if (isWin) {
    // Stars
    p.textSize(24);
    p.text("Stars Earned:", CANVAS_WIDTH / 2, 200);
    
    renderStars(p, CANVAS_WIDTH / 2, 240, gameState.stars);
    
    // Breakdown
    p.fill(80);
    p.textSize(16);
    p.textAlign(p.LEFT, p.TOP);
    const breakdown = [
      `Birds Remaining Bonus: ${gameState.birdsRemaining * BIRD_BONUS}`,
      `Total Score: ${gameState.score}`
    ];
    let y = 290;
    breakdown.forEach(line => {
      p.text(line, 150, y);
      y += 25;
    });
  } else {
    // Failure message
    p.fill(80);
    p.textSize(20);
    p.text(`Pigs Remaining: ${gameState.pigs.length}`, CANVAS_WIDTH / 2, 210);
  }
  
  // Restart prompt
  p.fill(220, 50, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.textStyle(p.BOLD);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
}

function renderHUD(p) {
  // Score
  p.fill(50);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.textStyle(p.BOLD);
  p.text(`Score: ${gameState.score}`, 10, 10);
  p.text(`Level: ${gameState.level}`, 10, 35);
  
  // Birds remaining
  p.text(`Birds: ${gameState.birdsRemaining}`, 10, 60);
  for (let i = 0; i < gameState.birdsRemaining; i++) {
    p.fill(220, 50, 50);
    p.circle(80 + i * 20, 70, 12);
  }
  
  // Power and angle indicators
  if (gameState.currentBird && !gameState.birdLaunched) {
    p.fill(50);
    p.text(`Power: ${Math.round(gameState.slingshotPower * 100)}%`, CANVAS_WIDTH - 150, 10);
    p.text(`Angle: ${Math.round(gameState.slingshotAngle)}°`, CANVAS_WIDTH - 150, 35);
    
    // Power bar
    p.fill(200);
    p.rect(CANVAS_WIDTH - 150, 55, 100, 10);
    p.fill(220, 50, 50);
    p.rect(CANVAS_WIDTH - 150, 55, gameState.slingshotPower * 100, 10);
  }
}

function renderTrajectory(p) {
  const angleRad = (gameState.slingshotAngle * Math.PI) / 180;
  const power = gameState.slingshotPower;
  
  const vx = Math.cos(angleRad) * power * 15;
  const vy = Math.sin(angleRad) * power * 15;
  
  p.stroke(255, 255, 255, 100);
  p.strokeWeight(2);
  p.noFill();
  
  let x = SLINGSHOT_X;
  let y = SLINGSHOT_Y - 30;
  
  for (let t = 0; t < 2; t += 0.1) {
    const nx = x + vx * t * 10;
    const ny = y + vy * t * 10 + 0.5 * 60 * t * t;
    
    if (t > 0) {
      p.line(x, y, nx, ny);
    }
    
    x = nx;
    y = ny;
    
    if (ny > CANVAS_HEIGHT) break;
  }
}

function renderStars(p, x, y, count) {
  for (let i = 0; i < 3; i++) {
    if (i < count) {
      p.fill(255, 215, 0);
    } else {
      p.fill(100);
    }
    drawStar(p, x - 40 + i * 40, y, 15);
  }
}

function drawStar(p, x, y, size) {
  p.push();
  p.translate(x, y);
  p.beginShape();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const sx = Math.cos(angle) * size;
    const sy = Math.sin(angle) * size;
    p.vertex(sx, sy);
  }
  p.endShape(p.CLOSE);
  p.pop();
}

function drawClouds(p) {
  p.fill(255, 255, 255, 180);
  p.noStroke();
  
  // Cloud 1
  p.circle(100, 60, 30);
  p.circle(120, 55, 35);
  p.circle(140, 60, 30);
  
  // Cloud 2
  p.circle(400, 80, 25);
  p.circle(420, 75, 30);
  p.circle(440, 80, 25);
  
  // Cloud 3
  p.circle(500, 50, 28);
  p.circle(520, 48, 32);
  p.circle(540, 52, 26);
}