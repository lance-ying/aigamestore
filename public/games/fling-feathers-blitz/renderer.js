import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y, SLINGSHOT_X, SLINGSHOT_Y, BIRD_TYPES } from './globals.js';
import { Bird, Pig, StructureBlock } from './entities.js';

export function renderGame(p) {
  // Background
  renderBackground(p);

  if (gameState.gamePhase === "START") {
    renderStartScreen(p);
  } else if (gameState.gamePhase === "PLAYING" || gameState.gamePhase === "PAUSED") {
    renderGameplay(p);
    if (gameState.gamePhase === "PAUSED") {
      renderPauseOverlay(p);
    }
  } else if (gameState.gamePhase === "LEVEL_COMPLETE") {
    renderGameplay(p);
    renderLevelCompleteScreen(p);
  } else if (gameState.gamePhase === "GAME_OVER_WIN" || gameState.gamePhase === "GAME_OVER_LOSE") {
    renderGameplay(p);
    renderGameOverScreen(p);
  }
}

function renderBackground(p) {
  // Sky gradient
  for (let y = 0; y < GROUND_Y; y++) {
    const inter = y / GROUND_Y;
    const c = p.lerpColor(p.color(135, 206, 235), p.color(100, 150, 200), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Ground
  p.fill(100, 200, 100);
  p.noStroke();
  p.rect(0, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y);
}

function renderStartScreen(p) {
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("FLING FEATHERS BLITZ", CANVAS_WIDTH / 2, 80);
  
  p.textSize(16);
  p.text("Launch birds from the slingshot to destroy", CANVAS_WIDTH / 2, 150);
  p.text("structures and eliminate all pigs!", CANVAS_WIDTH / 2, 175);
  
  p.textSize(14);
  p.fill(255, 255, 150);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 220);
  p.fill(255);
  p.textSize(12);
  p.text("SPACE: Hold to aim, release to launch", CANVAS_WIDTH / 2, 245);
  p.text("ARROW KEYS: Adjust slingshot aim", CANVAS_WIDTH / 2, 265);
  p.text("Z: Activate bird's special ability", CANVAS_WIDTH / 2, 285);
  p.text("ESC: Pause    R: Restart", CANVAS_WIDTH / 2, 305);
  
  p.textSize(14);
  p.fill(255, 200, 100);
  p.text("BIRD ABILITIES:", CANVAS_WIDTH / 2, 335);
  p.fill(255);
  p.textSize(11);
  p.text("Red: Basic bird", CANVAS_WIDTH / 2, 355);
  p.text("Blue: Splits into three mini-birds", CANVAS_WIDTH / 2, 372);
  p.text("Yellow: Speed boost", CANVAS_WIDTH / 2, 389);
  
  if (gameState.highScore > 0) {
    p.fill(255, 215, 0);
    p.textSize(14);
    p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, 420);
  }
  
  p.fill(100, 255, 100);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

function renderGameplay(p) {
  // Slingshot
  renderSlingshot(p);
  
  // Entities
  gameState.entities.forEach(entity => {
    if (entity instanceof Bird) {
      renderBird(p, entity);
    } else if (entity instanceof Pig) {
      renderPig(p, entity);
    } else if (entity instanceof StructureBlock) {
      renderStructureBlock(p, entity);
    }
  });
  
  // Particle effects
  renderParticles(p);
  
  // UI
  renderUI(p);
  
  // Trajectory preview when aiming
  if (gameState.isAiming) {
    renderTrajectoryPreview(p);
  }
}

function renderSlingshot(p) {
  const baseX = SLINGSHOT_X;
  const baseY = SLINGSHOT_Y;
  
  // Base
  p.fill(80, 50, 30);
  p.noStroke();
  p.rect(baseX - 8, baseY, 16, 30);
  
  // Rubber bands
  if (gameState.isAiming) {
    const pullX = baseX + gameState.slingshotPullPos.x;
    const pullY = baseY + gameState.slingshotPullPos.y;
    
    p.stroke(60, 40, 20);
    p.strokeWeight(3);
    p.line(baseX - 6, baseY, pullX, pullY);
    p.line(baseX + 6, baseY, pullX, pullY);
    
    // Bird at pull position
    const birdType = gameState.birdsRemaining[0];
    drawBirdIcon(p, pullX, pullY, birdType, 20);
  } else if (gameState.birdsRemaining.length > 0 && gameState.activeBirds.length === 0) {
    // Bird ready at slingshot
    const birdType = gameState.birdsRemaining[0];
    drawBirdIcon(p, baseX, baseY, birdType, 20);
  }
}

function renderBird(p, bird) {
  if (!bird.body.active) return;
  
  drawBirdIcon(p, bird.body.x, bird.body.y, bird.birdType, bird.body.width);
  
  // Trail for yellow bird during boost
  if (bird.birdType === BIRD_TYPES.YELLOW && bird.abilityUsed) {
    p.stroke(255, 255, 0, 100);
    p.strokeWeight(bird.body.width);
    for (let i = 0; i < bird.trail.length - 1; i++) {
      const alpha = (i / bird.trail.length) * 100;
      p.stroke(255, 255, 0, alpha);
      p.line(bird.trail[i].x, bird.trail[i].y, bird.trail[i + 1].x, bird.trail[i + 1].y);
    }
  }
}

function drawBirdIcon(p, x, y, birdType, size) {
  p.noStroke();
  
  if (birdType === BIRD_TYPES.RED) {
    p.fill(220, 20, 20);
  } else if (birdType === BIRD_TYPES.BLUE) {
    p.fill(20, 100, 220);
  } else if (birdType === BIRD_TYPES.YELLOW) {
    p.fill(255, 220, 0);
  }
  
  p.ellipse(x, y, size, size);
  
  // Eyes
  p.fill(0);
  p.ellipse(x + size * 0.15, y - size * 0.1, size * 0.2, size * 0.2);
  p.ellipse(x - size * 0.15, y - size * 0.1, size * 0.2, size * 0.2);
  
  // Eyebrows for angry look
  p.stroke(0);
  p.strokeWeight(1.5);
  p.line(x - size * 0.25, y - size * 0.25, x - size * 0.1, y - size * 0.15);
  p.line(x + size * 0.25, y - size * 0.25, x + size * 0.1, y - size * 0.15);
}

function renderPig(p, pig) {
  if (!pig.body.active) return;
  
  // Body
  p.fill(100, 200, 100);
  p.noStroke();
  p.ellipse(pig.body.x, pig.body.y, pig.body.width, pig.body.height);
  
  // Eyes
  p.fill(255);
  const eyeOffset = pig.body.width * 0.2;
  p.ellipse(pig.body.x - eyeOffset, pig.body.y - eyeOffset * 0.5, pig.body.width * 0.25, pig.body.width * 0.25);
  p.ellipse(pig.body.x + eyeOffset, pig.body.y - eyeOffset * 0.5, pig.body.width * 0.25, pig.body.width * 0.25);
  
  p.fill(0);
  p.ellipse(pig.body.x - eyeOffset, pig.body.y - eyeOffset * 0.5, pig.body.width * 0.15, pig.body.width * 0.15);
  p.ellipse(pig.body.x + eyeOffset, pig.body.y - eyeOffset * 0.5, pig.body.width * 0.15, pig.body.width * 0.15);
  
  // Snout
  p.fill(80, 160, 80);
  p.ellipse(pig.body.x, pig.body.y + eyeOffset, pig.body.width * 0.4, pig.body.width * 0.3);
  p.fill(60, 140, 60);
  p.ellipse(pig.body.x - pig.body.width * 0.1, pig.body.y + eyeOffset, pig.body.width * 0.1, pig.body.width * 0.1);
  p.ellipse(pig.body.x + pig.body.width * 0.1, pig.body.y + eyeOffset, pig.body.width * 0.1, pig.body.width * 0.1);
}

function renderStructureBlock(p, block) {
  if (!block.body.active) return;
  
  p.push();
  p.translate(block.body.x, block.body.y);
  p.rotate(block.body.rotation);
  
  if (block.material === 'WOOD') {
    p.fill(139, 90, 43);
    p.stroke(100, 60, 30);
  } else if (block.material === 'STONE') {
    p.fill(120, 120, 120);
    p.stroke(80, 80, 80);
  }
  
  p.strokeWeight(2);
  p.rectMode(p.CENTER);
  p.rect(0, 0, block.body.width, block.body.height);
  
  // Texture lines
  p.stroke(block.material === 'WOOD' ? 100 : 90, block.material === 'WOOD' ? 60 : 90, block.material === 'WOOD' ? 30 : 90, 100);
  p.strokeWeight(1);
  if (block.material === 'WOOD') {
    for (let i = -block.body.width / 2; i < block.body.width / 2; i += 5) {
      p.line(i, -block.body.height / 2, i, block.body.height / 2);
    }
  }
  
  p.pop();
}

function renderParticles(p) {
  p.noStroke();
  gameState.particleEffects.forEach(particle => {
    const alpha = (particle.life / particle.maxLife) * 200;
    p.fill(...particle.color, alpha);
    p.ellipse(particle.x, particle.y, particle.size, particle.size);
  });
}

function renderUI(p) {
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`LEVEL: ${gameState.currentLevel}`, 10, 10);
  p.text(`SCORE: ${gameState.score}`, 10, 30);
  
  // Birds remaining
  p.textSize(14);
  p.text(`BIRDS: ${gameState.birdsRemaining.length}`, 10, 55);
  
  // Bird icons
  let iconX = 80;
  for (let i = 0; i < Math.min(3, gameState.birdsRemaining.length); i++) {
    drawBirdIcon(p, iconX, 62, gameState.birdsRemaining[i], 12);
    iconX += 18;
  }
  if (gameState.birdsRemaining.length > 3) {
    p.fill(255);
    p.textSize(12);
    p.text(`+${gameState.birdsRemaining.length - 3}`, iconX, 57);
  }
  
  // Pigs remaining
  p.fill(255);
  p.textSize(14);
  p.text(`PIGS: ${gameState.pigsRemaining}`, 10, 80);
}

function renderTrajectoryPreview(p) {
  if (!gameState.slingshotPullPos) return;
  
  const startX = SLINGSHOT_X;
  const startY = SLINGSHOT_Y;
  const vx = -gameState.slingshotPullPos.x * 0.15;
  const vy = -gameState.slingshotPullPos.y * 0.15;
  
  p.stroke(255, 255, 255, 150);
  p.strokeWeight(2);
  p.noFill();
  
  // Draw dotted trajectory
  for (let t = 0; t < 50; t += 3) {
    const x = startX + vx * t;
    const y = startY + vy * t + 0.4 * t * t / 2;
    if (y > CANVAS_HEIGHT) break;
    p.point(x, y);
  }
}

function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 100);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(18);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function renderLevelCompleteScreen(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(`LEVEL ${gameState.currentLevel} COMPLETE!`, CANVAS_WIDTH / 2, 120);
  
  p.fill(255);
  p.textSize(20);
  p.text(`Level Score: ${gameState.levelScore}`, CANVAS_WIDTH / 2, 180);
  p.text(`Total Score: ${gameState.score}`, CANVAS_WIDTH / 2, 210);
  
  if (gameState.currentLevel < gameState.totalLevels) {
    p.fill(255, 255, 100);
    p.textSize(18);
    p.text("PRESS ENTER FOR NEXT LEVEL", CANVAS_WIDTH / 2, 280);
  } else {
    p.fill(255, 215, 0);
    p.textSize(32);
    p.text("YOU WIN!", CANVAS_WIDTH / 2, 260);
    p.fill(255, 255, 100);
    p.textSize(18);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 310);
  }
}

function renderGameOverScreen(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  if (gameState.gamePhase === "GAME_OVER_WIN") {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("YOU WIN!", CANVAS_WIDTH / 2, 120);
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
  }
  
  p.fill(255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);
  p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 210);
  
  p.fill(255, 255, 100);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 280);
}