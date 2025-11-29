// ui.js - UI rendering functions

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE 
} from './globals.js';

export function renderStartScreen(p) {
  // Dark, eerie background
  p.background(20, 15, 25);
  
  // Flickering effect
  const flicker = Math.sin(gameState.frameCount * 0.1) * 10 + 20;
  
  // Title with glow effect
  p.textAlign(p.CENTER, p.CENTER);
  
  // Glow
  p.fill(100, 50, 150, 100);
  p.textSize(52);
  p.text('SALLY FACE', CANVAS_WIDTH / 2 + 2, 80 + 2);
  
  // Main title
  p.fill(200, 180, 255);
  p.textSize(50);
  p.text('SALLY FACE', CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(150, 130, 180);
  p.textSize(18);
  p.text('Strange Neighbors', CANVAS_WIDTH / 2, 120);
  
  // Description box
  p.fill(30, 25, 35, 200);
  p.rect(50, 150, CANVAS_WIDTH - 100, 120, 5);
  
  p.fill(200, 190, 210);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const desc = 'Explore Addison Apartments as Sal, a boy with\na prosthetic face. Uncover dark mysteries,\ncollect evidence, and avoid shadow creatures.\nUse your Gear Boy to detect supernatural activity.';
  p.text(desc, 70, 165);
  
  // Controls
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(180, 170, 200);
  p.textSize(13);
  p.text('Arrow Keys: Move  |  Z: Interact  |  Space: Gear Boy  |  Shift: Sprint', CANVAS_WIDTH / 2, 290);
  p.text('ESC: Pause  |  R: Restart', CANVAS_WIDTH / 2, 310);
  
  // Start prompt with flicker
  p.fill(255, 255, 255, flicker + 235);
  p.textSize(22);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 350);
  
  // Decorative elements
  drawSpookyBorder(p);
}

export function renderUI(p) {
  // Score
  p.fill(200, 190, 210);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(16);
  p.text(`Evidence: ${gameState.cluesCollected}/${gameState.totalClues}`, 10, 10);
  p.text(`Score: ${gameState.score}`, 10, 30);
  
  // Gear Boy indicator
  const gearBoyX = CANVAS_WIDTH - 120;
  const gearBoyY = 15;
  
  p.fill(40, 40, 60);
  p.rect(gearBoyX, gearBoyY, 110, 50, 5);
  
  p.fill(180, 180, 200);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text('GEAR BOY', gearBoyX + 5, gearBoyY + 5);
  
  // Status
  if (gameState.gearBoyActive) {
    p.fill(100, 255, 100);
    p.text('ACTIVE', gearBoyX + 5, gearBoyY + 22);
    
    // Duration bar
    const durationRatio = gameState.gearBoyDuration / 180;
    p.fill(60, 60, 80);
    p.rect(gearBoyX + 5, gearBoyY + 38, 100, 6);
    p.fill(100, 255, 100);
    p.rect(gearBoyX + 5, gearBoyY + 38, 100 * durationRatio, 6);
  } else if (gameState.gearBoyCooldown > 0) {
    p.fill(255, 100, 100);
    p.text('COOLDOWN', gearBoyX + 5, gearBoyY + 22);
    
    // Cooldown bar
    const cooldownRatio = gameState.gearBoyCooldown / 60;
    p.fill(60, 60, 80);
    p.rect(gearBoyX + 5, gearBoyY + 38, 100, 6);
    p.fill(255, 100, 100);
    p.rect(gearBoyX + 5, gearBoyY + 38, 100 * cooldownRatio, 6);
  } else {
    p.fill(180, 180, 200);
    p.text('READY', gearBoyX + 5, gearBoyY + 22);
    p.text('[SPACE]', gearBoyX + 5, gearBoyY + 35);
  }
  
  // Interaction prompt
  if (gameState.player) {
    let nearbyInteractable = false;
    
    // Check for nearby clues
    for (const clue of gameState.clues) {
      if (!clue.collected) {
        const dist = Math.sqrt(
          Math.pow(gameState.player.x - clue.x, 2) + 
          Math.pow(gameState.player.y - clue.y, 2)
        );
        if (dist < 50) {
          nearbyInteractable = true;
          break;
        }
      }
    }
    
    // Check for nearby doors
    if (!nearbyInteractable) {
      for (const door of gameState.doors) {
        const dist = Math.sqrt(
          Math.pow(gameState.player.x - door.x, 2) + 
          Math.pow(gameState.player.y - door.y, 2)
        );
        if (dist < 50) {
          nearbyInteractable = true;
          break;
        }
      }
    }
    
    if (nearbyInteractable) {
      p.fill(255, 255, 255, Math.sin(gameState.frameCount * 0.1) * 50 + 205);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.text('Press Z to Interact', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    }
  }
  
  // Gear Boy visual effect when active
  if (gameState.gearBoyActive) {
    drawGearBoyEffect(p);
  }
}

export function renderPausedOverlay(p) {
  // Semi-transparent overlay
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(200, 190, 210);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(20);
  p.text('Press ESC to Resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  
  // Game stats
  p.textSize(16);
  p.fill(180, 170, 200);
  p.text(`Evidence Collected: ${gameState.cluesCollected}/${gameState.totalClues}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 95);
}

export function renderGameOver(p) {
  // Background overlay
  p.fill(0, 0, 0, 220);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  
  if (isWin) {
    // Glow effect for win
    p.fill(100, 255, 100, 100);
    p.textSize(52);
    p.text('MYSTERY SOLVED', CANVAS_WIDTH / 2 + 2, CANVAS_HEIGHT / 2 - 78);
    
    p.fill(150, 255, 150);
    p.textSize(50);
    p.text('MYSTERY SOLVED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    p.fill(200, 255, 200);
    p.textSize(18);
    p.text('You uncovered the dark truth of Addison Apartments', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  } else {
    // Glow effect for lose
    p.fill(255, 50, 50, 100);
    p.textSize(52);
    p.text('CONSUMED BY DARKNESS', CANVAS_WIDTH / 2 + 2, CANVAS_HEIGHT / 2 - 78);
    
    p.fill(255, 100, 100);
    p.textSize(50);
    p.text('CONSUMED BY DARKNESS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    p.fill(255, 150, 150);
    p.textSize(18);
    p.text('The shadows have claimed you...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  }
  
  // Stats box
  p.fill(30, 25, 35, 200);
  p.rect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 - 10, 300, 80, 5);
  
  p.fill(200, 190, 210);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
  p.textSize(16);
  p.text(`Evidence Collected: ${gameState.cluesCollected}/${gameState.totalClues}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  
  // Restart instruction
  p.fill(255, 255, 255, Math.sin(gameState.frameCount * 0.1) * 50 + 205);
  p.textSize(22);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
}

function drawSpookyBorder(p) {
  p.stroke(100, 50, 150, 100);
  p.strokeWeight(3);
  p.noFill();
  p.rect(10, 10, CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20, 10);
  
  // Corner decorations
  const corners = [
    [20, 20], [CANVAS_WIDTH - 20, 20],
    [20, CANVAS_HEIGHT - 20], [CANVAS_WIDTH - 20, CANVAS_HEIGHT - 20]
  ];
  
  p.stroke(150, 100, 200);
  p.strokeWeight(2);
  corners.forEach(([x, y]) => {
    p.line(x - 10, y, x + 10, y);
    p.line(x, y - 10, x, y + 10);
  });
  p.noStroke();
}

function drawGearBoyEffect(p) {
  // Scanline effect
  p.stroke(100, 255, 100, 30);
  p.strokeWeight(1);
  for (let i = 0; i < CANVAS_HEIGHT; i += 4) {
    p.line(0, i, CANVAS_WIDTH, i);
  }
  p.noStroke();
  
  // Vignette
  const gradient = p.drawingContext.createRadialGradient(
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 50,
    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH
  );
  gradient.addColorStop(0, 'rgba(0, 255, 100, 0)');
  gradient.addColorStop(1, 'rgba(0, 100, 50, 0.3)');
  p.drawingContext.fillStyle = gradient;
  p.drawingContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}