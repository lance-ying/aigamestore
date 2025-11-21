// rendering.js - Rendering functions
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, BIRD_TYPES } from './globals.js';
import { drawBird, drawPig, drawBlock, drawParticles } from './entities.js';

const SLINGSHOT_X = 100;
const SLINGSHOT_Y = 300;

export function drawBackground(p) {
  // Sky gradient
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = p.map(y, 0, CANVAS_HEIGHT, 0, 1);
    const c = p.lerpColor(p.color(135, 206, 250), p.color(152, 251, 152), inter);
    p.stroke(c);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Ground
  p.fill(100, 160, 100);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT - 50, CANVAS_WIDTH, 50);
}

export function drawSlingshot(p) {
  p.push();
  
  // Posts
  p.fill(101, 67, 33);
  p.noStroke();
  p.rect(SLINGSHOT_X - 25, SLINGSHOT_Y - 40, 10, 80);
  p.rect(SLINGSHOT_X + 15, SLINGSHOT_Y - 40, 10, 80);
  
  // Elastic bands
  if (gameState.slingshotBird && gameState.slingshotAiming) {
    const angle = gameState.slingshotPullAngle;
    const distance = gameState.slingshotPullDistance;
    const pullX = SLINGSHOT_X - Math.cos(angle) * distance;
    const pullY = SLINGSHOT_Y - Math.sin(angle) * distance;
    
    p.stroke(139, 90, 43);
    p.strokeWeight(3);
    p.line(SLINGSHOT_X - 20, SLINGSHOT_Y - 30, pullX, pullY);
    p.line(SLINGSHOT_X + 20, SLINGSHOT_Y - 30, pullX, pullY);
  }
  
  p.pop();
}

export function drawUI(p) {
  p.push();
  
  // Score
  p.fill(255);
  p.textSize(20);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`SCORE: ${String(gameState.score).padStart(6, '0')}`, 20, 20);
  
  // Level
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`LEVEL ${gameState.currentLevel} of ${gameState.totalLevels}`, CANVAS_WIDTH - 20, 20);
  
  // Bird inventory
  p.textAlign(p.LEFT, p.BOTTOM);
  p.textSize(14);
  let x = 20;
  gameState.birds.forEach((birdData, index) => {
    if (!birdData.available) return;
    
    const isActive = index === gameState.currentBirdIndex;
    
    if (isActive) {
      p.stroke(255, 255, 0);
      p.strokeWeight(3);
      p.noFill();
      p.circle(x + 15, CANVAS_HEIGHT - 35, 35);
    }
    
    p.noStroke();
    const colors = {
      RED: [220, 50, 50],
      YELLOW: [255, 220, 0],
      BLUE: [50, 150, 255],
      BLACK: [40, 40, 40]
    };
    p.fill(...colors[birdData.type]);
    p.circle(x + 15, CANVAS_HEIGHT - 35, 25);
    
    x += 40;
  });
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255);
    p.textSize(16);
    p.textAlign(p.RIGHT, p.TOP);
    p.text('PAUSED', CANVAS_WIDTH - 20, 50);
  }
  
  p.pop();
}

export function drawStartScreen(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 220, 50);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('FLING FEATHERS', CANVAS_WIDTH / 2, 80);
  
  p.fill(255);
  p.textSize(18);
  p.text('Launch birds to destroy pig fortresses!', CANVAS_WIDTH / 2, 140);
  
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    'HOLD SPACE: Aim slingshot',
    'ARROWS: Adjust angle (Up/Down) and power (Left/Right)',
    'RELEASE SPACE: Launch bird',
    'SPACE (in flight): Activate bird ability',
    'A/D: Cycle through birds',
    'ESC: Pause game',
    'R: Restart to menu'
  ];
  
  let y = 180;
  instructions.forEach(line => {
    p.text(line, 100, y);
    y += 25;
  });
  
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  
  if (gameState.highScore > 0) {
    p.fill(255, 200, 0);
    p.textSize(16);
    p.text(`HIGH SCORE: ${gameState.highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
  }
  
  p.pop();
}

export function drawGameOverScreen(p) {
  p.push();
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text('GAME COMPLETE!', CANVAS_WIDTH / 2, 100);
    
    p.fill(255);
    p.textSize(24);
    p.text('ALL EGGS SAVED!', CANVAS_WIDTH / 2, 160);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text('GAME OVER', CANVAS_WIDTH / 2, 100);
    
    p.fill(255);
    p.textSize(24);
    p.text('Out of birds!', CANVAS_WIDTH / 2, 160);
  }
  
  p.fill(255, 255, 100);
  p.textSize(32);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  if (gameState.score >= gameState.highScore && gameState.highScore > 0) {
    p.fill(255, 200, 0);
    p.textSize(20);
    p.text('NEW HIGH SCORE!', CANVAS_WIDTH / 2, 260);
  }
  
  p.fill(255);
  p.textSize(20);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
  
  p.pop();
}

export function drawEntities(p) {
  // Draw blocks
  gameState.blocks.forEach(block => {
    if (!block.destroyed) {
      drawBlock(p, block);
    }
  });
  
  // Draw pigs
  gameState.pigs.forEach(pig => {
    if (!pig.destroyed) {
      drawPig(p, pig);
    }
  });
  
  // Draw bird in slingshot
  if (gameState.slingshotBird) {
    const bird = gameState.slingshotBird;
    
    // Bird position is calculated here but NOT applied to physics body
    // This avoids interfering with Matter.js physics state
    let displayX, displayY;
    
    if (gameState.slingshotAiming) {
      const angle = gameState.slingshotPullAngle;
      const distance = gameState.slingshotPullDistance;
      displayX = SLINGSHOT_X - Math.cos(angle) * distance;
      displayY = SLINGSHOT_Y - Math.sin(angle) * distance;
      
      // Draw trajectory preview
      p.push();
      p.stroke(255, 255, 255, 100);
      p.strokeWeight(2);
      p.noFill();
      
      const launchAngle = angle;
      const power = distance / gameState.maxPullDistance;
      const launchSpeed = 12 + power * 18;
      
      let px = displayX;
      let py = displayY;
      let vx = Math.cos(launchAngle) * launchSpeed;
      let vy = Math.sin(launchAngle) * launchSpeed;
      
      for (let i = 0; i < 30; i++) {
        const nx = px + vx * 2;
        const ny = py + vy * 2;
        
        if (i % 3 === 0) {
          p.circle(nx, ny, 3);
        }
        
        px = nx;
        py = ny;
        vy += 1.0 * 2; // gravity
      }
      
      p.pop();
    } else {
      // Use actual physics body position when not aiming
      displayX = bird.position.x;
      displayY = bird.position.y;
    }
    
    // Draw bird at calculated display position (not modifying physics)
    p.push();
    p.translate(displayX, displayY);
    p.rotate(bird.angle);
    
    // Draw based on bird type
    const type = bird.birdType;
    if (type === BIRD_TYPES.RED) {
      p.fill(220, 50, 50);
      p.circle(0, 0, 30);
      p.fill(0);
      p.circle(-5, -3, 4);
      p.circle(5, -3, 4);
    } else if (type === BIRD_TYPES.YELLOW) {
      p.fill(255, 220, 0);
      p.triangle(-15, 15, 15, 15, 0, -20);
      p.fill(0);
      p.circle(-5, 5, 3);
      p.circle(5, 5, 3);
    } else if (type === BIRD_TYPES.BLUE) {
      p.fill(50, 150, 255);
      p.circle(0, 0, 20);
      p.fill(0);
      p.circle(-3, -2, 3);
      p.circle(3, -2, 3);
    } else if (type === BIRD_TYPES.BLACK) {
      p.fill(40, 40, 40);
      p.circle(0, 0, 34);
      p.fill(0);
      p.circle(-6, -3, 4);
      p.circle(6, -3, 4);
      p.strokeWeight(2);
      p.stroke(255, 0, 0);
      p.line(-8, 5, -3, 8);
      p.line(3, 8, 8, 5);
    }
    
    p.pop();
  }
  
  // Draw bird in flight
  if (gameState.birdInFlight && !gameState.birdInFlight.destroyed) {
    drawBird(p, gameState.birdInFlight);
  }
}