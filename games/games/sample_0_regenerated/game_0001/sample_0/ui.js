// UI rendering for all game screens
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderStartScreen(p) {
  // Animated background
  renderAnimatedBackground(p);
  
  // Title with shadow
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title shadow
  p.fill(0, 0, 0, 150);
  p.textSize(56);
  p.text('TEMPLE RUN', CANVAS_WIDTH / 2 + 3, 63);
  
  // Title
  p.fill(255, 215, 0);
  p.stroke(200, 150, 0);
  p.strokeWeight(3);
  p.textSize(56);
  p.text('TEMPLE RUN', CANVAS_WIDTH / 2, 60);
  
  // Subtitle
  p.noStroke();
  p.fill(255, 200, 100);
  p.textSize(18);
  p.text('The Endless Running Adventure', CANVAS_WIDTH / 2, 110);
  
  // Description
  p.fill(220, 220, 220);
  p.textSize(14);
  const descLines = [
    "You've stolen the cursed idol!",
    "Run through the ancient temple.",
    "Avoid obstacles and collect coins.",
    "The temple generates endlessly!"
  ];
  descLines.forEach((line, i) => {
    p.text(line, CANVAS_WIDTH / 2, 150 + i * 22);
  });
  
  // Controls
  p.fill(255, 255, 150);
  p.textSize(16);
  p.text('CONTROLS', CANVAS_WIDTH / 2, 260);
  
  p.fill(200, 200, 200);
  p.textSize(13);
  const controls = [
    '← → Arrow Keys: Change Lanes',
    '↑ or Space: Jump Over Obstacles',
    '↓ Arrow Key: Slide Under Barriers'
  ];
  controls.forEach((line, i) => {
    p.text(line, CANVAS_WIDTH / 2, 285 + i * 20);
  });
  
  // Start prompt (blinking)
  const alpha = (Math.sin(p.frameCount * 0.1) + 1) / 2 * 255;
  p.fill(255, 255, 0, alpha);
  p.textSize(22);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 360);
  
  p.pop();
}

export function renderPlayingScreen(p) {
  // Render sky/background
  renderSky(p);
  
  // Render path segments
  gameState.segments.forEach(segment => segment.render(p));
  
  // Render obstacles
  gameState.obstacles.forEach(obstacle => obstacle.render(p));
  
  // Render coins
  gameState.collectibles.forEach(coin => coin.render(p));
  
  // Render particles
  gameState.particles.forEach(particle => particle.render(p));
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Render HUD
  renderHUD(p);
  
  // Tutorial hints (first 5 seconds)
  if (gameState.showTutorial && gameState.frameCount < 300) {
    renderTutorial(p);
  }
}

function renderSky(p) {
  // Gradient sky
  for (let i = 0; i < CANVAS_HEIGHT - 150; i++) {
    const inter = i / (CANVAS_HEIGHT - 150);
    const c = p.lerpColor(
      p.color(135, 206, 235), // Sky blue
      p.color(255, 200, 150), // Sunset orange
      inter
    );
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Sun
  p.fill(255, 255, 200, 200);
  p.noStroke();
  p.circle(500, 80, 60);
  p.fill(255, 255, 150, 100);
  p.circle(500, 80, 80);
  
  // Distant temple silhouettes
  p.fill(80, 60, 100, 150);
  p.triangle(100, 150, 150, 150, 125, 100);
  p.triangle(450, 160, 520, 160, 485, 110);
}

function renderAnimatedBackground(p) {
  // Animated temple background
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = i / CANVAS_HEIGHT;
    const c = p.lerpColor(
      p.color(20, 30, 50),
      p.color(80, 60, 40),
      inter
    );
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Animated stone blocks
  const blockOffset = (p.frameCount * 0.5) % 40;
  p.fill(60, 50, 40, 100);
  p.noStroke();
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 15; j++) {
      const x = i * 40 - blockOffset;
      const y = j * 40;
      if (x < 0) continue;
      p.rect(x, y, 38, 38);
    }
  }
}

function renderHUD(p) {
  p.push();
  p.textAlign(p.LEFT, p.TOP);
  
  // Score background
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(5, 5, 200, 70, 5);
  
  // Distance
  p.fill(255, 255, 100);
  p.textSize(16);
  p.text(`Distance: ${gameState.distance}m`, 15, 15);
  
  // Coins
  p.fill(255, 215, 0);
  p.textSize(16);
  
  // Draw coin icon
  p.fill(255, 215, 0);
  p.stroke(200, 170, 0);
  p.strokeWeight(2);
  p.circle(25, 45, 15);
  
  p.noStroke();
  p.fill(255);
  p.textSize(18);
  p.text(`x ${gameState.coins}`, 40, 38);
  
  // Speed indicator
  p.fill(255, 255, 255, 200);
  p.textSize(12);
  p.text(`Speed: ${gameState.currentSpeed.toFixed(1)}`, 120, 45);
  
  p.pop();
}

function renderTutorial(p) {
  // Semi-transparent overlay at bottom
  p.fill(0, 0, 0, 180);
  p.rect(0, CANVAS_HEIGHT - 80, CANVAS_WIDTH, 80);
  
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  
  const tutorialTime = Math.floor(gameState.frameCount / 60);
  
  if (tutorialTime < 2) {
    p.text('Use LEFT and RIGHT arrows to change lanes!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  } else if (tutorialTime < 4) {
    p.text('Press UP or SPACE to jump over obstacles!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  } else {
    p.text('Press DOWN to slide under low barriers!', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  }
}

export function renderPausedScreen(p) {
  // Darken the game
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255, 255, 0);
  p.stroke(200, 150, 0);
  p.strokeWeight(3);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  
  // Instructions
  p.noStroke();
  p.fill(255);
  p.textSize(20);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
}

export function renderGameOverScreen(p) {
  // Darken background
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Game Over title
  p.fill(255, 50, 50);
  p.stroke(150, 0, 0);
  p.strokeWeight(4);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(56);
  p.text('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
  
  // Stats box
  p.noStroke();
  p.fill(40, 30, 20, 220);
  p.rect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 - 20, 300, 120, 10);
  
  // Stats
  p.fill(255, 215, 0);
  p.textSize(24);
  p.text('FINAL STATS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.fill(255);
  p.textSize(18);
  p.text(`Distance: ${gameState.distance}m`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  p.text(`Coins: ${gameState.coins}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 55);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
  
  // Restart prompt
  const alpha = (Math.sin(p.frameCount * 0.15) + 1) / 2 * 255;
  p.fill(255, 255, 0, alpha);
  p.textSize(22);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 130);
}