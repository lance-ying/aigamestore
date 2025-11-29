// ui.js - UI rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PHASE_START, PHASE_PAUSED, 
         PHASE_GAME_OVER_WIN, PHASE_GAME_OVER_LOSE } from './globals.js';

export function renderStartScreen(p) {
  p.push();
  
  // Background
  const bgGradient = p.drawingContext.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  bgGradient.addColorStop(0, '#000033');
  bgGradient.addColorStop(1, '#1a0052');
  p.drawingContext.fillStyle = bgGradient;
  p.drawingContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Animated grid
  p.stroke(0, 255, 255, 50);
  p.strokeWeight(1);
  const offset = (p.frameCount % 40) - 40;
  for (let i = offset; i < CANVAS_WIDTH; i += 40) {
    p.line(i, 0, i, CANVAS_HEIGHT);
  }
  for (let j = offset; j < CANVAS_HEIGHT; j += 40) {
    p.line(0, j, CANVAS_WIDTH, j);
  }
  
  // Title
  p.fill(0, 255, 255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text('海姆达尔', CANVAS_WIDTH / 2, 80);
  
  p.textSize(32);
  p.fill(100, 200, 255);
  p.text('HEIMDALLR', CANVAS_WIDTH / 2, 120);
  
  // Subtitle
  p.textSize(14);
  p.fill(200, 200, 200);
  p.text('A CYBER INVESTIGATION', CANVAS_WIDTH / 2, 155);
  
  // Description
  p.textSize(12);
  p.fill(180, 180, 180);
  p.textAlign(p.CENTER, p.TOP);
  const desc1 = 'You are Jason, a hacker investigating a 15-year-old murder.';
  const desc2 = 'Decrypt data in puzzle mode, then escape in parkour mode.';
  const desc3 = 'Collect data fragments to unlock different endings.';
  p.text(desc1, CANVAS_WIDTH / 2, 190);
  p.text(desc2, CANVAS_WIDTH / 2, 210);
  p.text(desc3, CANVAS_WIDTH / 2, 230);
  
  // Controls
  p.fill(255, 255, 100);
  p.textSize(13);
  p.textAlign(p.LEFT, p.TOP);
  let y = 270;
  p.text('CONTROLS:', 80, y);
  y += 20;
  p.fill(200);
  p.textSize(11);
  p.text('ARROW KEYS - Move / Navigate menus', 80, y);
  y += 18;
  p.text('SPACE - Jump / Select in puzzle', 80, y);
  y += 18;
  p.text('Z - Slide under obstacles', 80, y);
  y += 18;
  p.text('SHIFT - Sprint (hold)', 80, y);
  y += 18;
  p.text('ESC - Pause', 80, y);
  
  // Start prompt (pulsing)
  const pulse = Math.sin(p.frameCount * 0.1) * 30 + 225;
  p.fill(0, 255, 255, pulse);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}

export function renderPauseOverlay(p) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Pause indicator
  p.fill(255, 255, 0);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text('PAUSED', CANVAS_WIDTH - 20, 20);
  
  // Center message
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text('GAME PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
  
  p.textSize(14);
  p.fill(200);
  p.text('Press ESC to resume', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text('Press R to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45);
  
  p.pop();
}

export function renderGameOverScreen(p) {
  p.push();
  
  // Background
  const bgGradient = p.drawingContext.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    bgGradient.addColorStop(0, '#001a00');
    bgGradient.addColorStop(1, '#003300');
  } else {
    bgGradient.addColorStop(0, '#1a0000');
    bgGradient.addColorStop(1, '#330000');
  }
  p.drawingContext.fillStyle = bgGradient;
  p.drawingContext.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Result message
  p.textAlign(p.CENTER, p.CENTER);
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    p.fill(0, 255, 0);
    p.textSize(36);
    p.text('CASE SOLVED', CANVAS_WIDTH / 2, 100);
    
    p.textSize(16);
    p.fill(200, 255, 200);
    p.text('You uncovered the truth behind the murder', CANVAS_WIDTH / 2, 150);
    
    // Ending type
    p.textSize(14);
    p.fill(150, 255, 150);
    const endingText = getEndingDescription();
    p.text(endingText, CANVAS_WIDTH / 2, 190);
  } else {
    p.fill(255, 50, 50);
    p.textSize(36);
    p.text('CONNECTION LOST', CANVAS_WIDTH / 2, 100);
    
    p.textSize(16);
    p.fill(255, 200, 200);
    p.text('The investigation has been compromised', CANVAS_WIDTH / 2, 150);
  }
  
  // Stats
  p.fill(255, 255, 255);
  p.textSize(14);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.text(`DATA COLLECTED: ${gameState.collectedFragments}/${gameState.totalFragments}`, CANVAS_WIDTH / 2, 245);
  p.text(`CHAPTERS COMPLETED: ${gameState.currentChapter + 1}/${gameState.totalChapters}`, CANVAS_WIDTH / 2, 270);
  
  // Restart prompt
  const pulse = Math.sin(p.frameCount * 0.1) * 30 + 225;
  p.fill(255, 255, 255, pulse);
  p.textSize(16);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}

function getEndingDescription() {
  const fragmentPercent = gameState.collectedFragments / gameState.totalFragments;
  
  if (fragmentPercent >= 0.9) {
    return 'ENDING: COMPLETE TRUTH - All evidence recovered';
  } else if (fragmentPercent >= 0.7) {
    return 'ENDING: JUSTICE SERVED - Major evidence found';
  } else if (fragmentPercent >= 0.5) {
    return 'ENDING: PARTIAL TRUTH - Some gaps remain';
  } else {
    return 'ENDING: SURFACE DISCOVERY - Many questions unanswered';
  }
}

export function renderTransition(p) {
  p.push();
  
  const progress = gameState.transitionTimer / gameState.transitionDuration;
  
  // Fade effect
  p.fill(0, 0, 0, 255 * Math.sin(progress * Math.PI));
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Transition message
  if (progress < 0.5) {
    p.fill(0, 255, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(18);
    p.text('INITIALIZING PARKOUR SEQUENCE...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
  
  p.pop();
}