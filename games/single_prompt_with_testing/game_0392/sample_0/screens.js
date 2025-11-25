import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_AREA_X, GAME_AREA_WIDTH, gameState } from './globals.js';

export function renderStartScreen(p) {
  p.push();
  
  // Background gradient
  for (let i = 0; i < CANVAS_HEIGHT; i++) {
    const inter = i / CANVAS_HEIGHT;
    const c = p.lerpColor(p.color(20, 20, 60), p.color(60, 20, 80), inter);
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  
  // Decorative stars
  p.fill(255, 255, 255, 150);
  p.noStroke();
  for (let i = 0; i < 20; i++) {
    const x = (i * 123) % CANVAS_WIDTH;
    const y = (i * 456) % CANVAS_HEIGHT;
    const size = 2 + (i % 3);
    p.circle(x, y, size);
  }
  
  // Title
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text('未確認幻想物体', CANVAS_WIDTH / 2, 60);
  
  p.textSize(20);
  p.fill(200, 200, 255);
  p.text('Undefined Fantastic Object', CANVAS_WIDTH / 2, 95);
  
  // Description box
  p.fill(0, 0, 0, 100);
  p.rect(50, 130, CANVAS_WIDTH - 100, 180, 10);
  
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    'A mysterious ship floats in the sky...',
    '',
    'Defeat enemies and collect Venturer items!',
    'Match 3 colors to summon powerful UFOs:',
    '  • Red UFO - Grants life fragments',
    '  • Blue UFO - Multiplies point value',
    '  • Green UFO - Grants spell fragments',
    '  • Rainbow UFO - Special bonuses!',
    '',
    'Move to screen top to auto-collect items',
    'Use slow mode to attract nearby items'
  ];
  
  let y = 140;
  for (let line of instructions) {
    p.text(line, 70, y);
    y += 16;
  }
  
  // Controls
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.fill(255, 255, 100);
  p.text('CONTROLS', CANVAS_WIDTH / 2, 330);
  
  p.textSize(12);
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  const controls = [
    'Arrow Keys: Move',
    'Z: Shoot',
    'Shift: Slow Mode',
    'Space: Spell Card',
  ];
  
  y = 350;
  for (let line of controls) {
    p.text(line, 200, y);
    y += 18;
  }
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.fill(255, 255, 255, 150 + Math.sin(p.frameCount * 0.1) * 100);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
  
  p.pop();
}

export function renderGameOverScreen(p, won) {
  p.push();
  
  // Semi-transparent overlay
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Result message
  p.textAlign(p.CENTER, p.CENTER);
  if (won) {
    p.fill(255, 255, 100);
    p.textSize(48);
    p.text('STAGE CLEAR!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    p.fill(200, 255, 200);
    p.textSize(24);
    p.text('The mysterious ship has been revealed!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    
    p.fill(255, 200, 200);
    p.textSize(24);
    p.text('The mystery remains unsolved...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  }
  
  // Final score
  p.fill(255);
  p.textSize(28);
  p.text('Final Score: ' + gameState.score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  
  // Restart instruction
  p.textSize(20);
  p.fill(255, 255, 255, 150 + Math.sin(p.frameCount * 0.1) * 100);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  
  p.pop();
}

export function renderPausedIndicator(p) {
  p.push();
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text('PAUSED', CANVAS_WIDTH - 10, 10);
  p.pop();
}