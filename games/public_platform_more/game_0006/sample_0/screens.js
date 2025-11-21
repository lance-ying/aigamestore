import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, GAME_PHASES } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 30, 50);
  
  // Animated background
  for (let i = 0; i < 50; i++) {
    const x = (i * 37 + p.frameCount * 0.5) % CANVAS_WIDTH;
    const y = (i * 23 + p.frameCount * 0.3) % CANVAS_HEIGHT;
    p.fill(255, 255, 255, 30);
    p.noStroke();
    p.ellipse(x, y, 3, 3);
  }
  
  // Title
  p.fill(255, 215, 0);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("LIFE JOURNEY", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(150, 200, 255);
  p.textSize(18);
  p.text("A Game of Choices & Fortune", CANVAS_WIDTH / 2, 120);
  
  // Instructions box
  p.fill(40, 40, 60, 200);
  p.stroke(100, 150, 200);
  p.strokeWeight(2);
  p.rectMode(p.CENTER);
  p.rect(CANVAS_WIDTH / 2, 220, 500, 140, 10);
  
  // Instructions
  p.fill(255);
  p.noStroke();
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instrX = CANVAS_WIDTH / 2 - 230;
  let instrY = 160;
  
  p.text("• SPACE: Spin the spinner and move forward", instrX, instrY);
  instrY += 25;
  p.text("• Arrow Keys: Navigate choices at decision spaces", instrX, instrY);
  instrY += 25;
  p.text("• Make smart choices and win minigames to earn money", instrX, instrY);
  instrY += 25;
  p.text("• Reach Retirement with $100K+ net worth to win!", instrX, instrY);
  
  // Start prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const flashAlpha = (Math.sin(p.frameCount * 0.1) + 1) * 0.5 * 255;
  p.fill(255, 255, 0, flashAlpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 320);
  
  // Controls reminder
  p.fill(150);
  p.textSize(12);
  p.text("ESC: Pause  |  R: Restart", CANVAS_WIDTH / 2, 370);
}

export function drawGameOverScreen(p) {
  p.background(20, 20, 30);
  
  const won = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  const netWorth = gameState.money + gameState.assets;
  
  // Title
  if (won) {
    p.fill(100, 255, 100);
    p.textSize(56);
    p.text("CONGRATULATIONS!", CANVAS_WIDTH / 2, 80);
    
    p.fill(255, 215, 0);
    p.textSize(24);
    p.text("You've Retired Successfully!", CANVAS_WIDTH / 2, 130);
  } else {
    p.fill(255, 100, 100);
    p.textSize(56);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 80);
    
    p.fill(200);
    p.textSize(20);
    if (gameState.money < 0) {
      p.text("You went bankrupt!", CANVAS_WIDTH / 2, 130);
    } else {
      p.text("You retired, but didn't reach the goal.", CANVAS_WIDTH / 2, 130);
    }
  }
  
  // Stats box
  p.fill(40, 40, 60, 200);
  p.stroke(won ? [100, 255, 100] : [255, 100, 100]);
  p.strokeWeight(3);
  p.rectMode(p.CENTER);
  p.rect(CANVAS_WIDTH / 2, 220, 400, 120, 10);
  
  // Stats
  p.fill(255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text(`Final Cash: $${gameState.money.toLocaleString()}`, CANVAS_WIDTH / 2, 190);
  p.text(`Assets: $${gameState.assets.toLocaleString()}`, CANVAS_WIDTH / 2, 215);
  
  p.fill(255, 215, 0);
  p.textSize(24);
  p.text(`Net Worth: $${netWorth.toLocaleString()}`, CANVAS_WIDTH / 2, 245);
  
  p.fill(255, 150, 255);
  p.textSize(18);
  p.text(`Life Points: ${gameState.lifePoints}`, CANVAS_WIDTH / 2, 275);
  
  // Restart prompt
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const flashAlpha = (Math.sin(p.frameCount * 0.1) + 1) * 0.5 * 255;
  p.fill(255, 255, 0, flashAlpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}