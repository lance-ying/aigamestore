// screens.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, GAME_PHASES } from './globals.js';

export function drawStartScreen(p) {
  p.background(30, 30, 40);
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("7 Days to End with You", CANVAS_WIDTH / 2, 80);
  
  // Subtitle
  p.fill(200, 180, 150);
  p.textSize(14);
  p.text("A Language Learning Mystery", CANVAS_WIDTH / 2, 115);
  
  // Description box
  p.fill(50, 50, 60);
  p.noStroke();
  p.rect(60, 145, CANVAS_WIDTH - 120, 120, 10);
  
  p.fill(220);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const desc = [
    "You're trapped in a room with a mysterious character",
    "who speaks an unknown language. You have 7 days to",
    "learn their language by interacting with objects and",
    "building your own dictionary. Your translations will",
    "shape the story and determine the ending.",
    "",
    "Can you bridge the language barrier in time?"
  ];
  
  let yPos = 155;
  for (let line of desc) {
    p.text(line, 80, yPos);
    yPos += 16;
  }
  
  // Controls
  p.fill(100, 150, 200);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(13);
  p.text("CONTROLS", CANVAS_WIDTH / 2, 285);
  
  p.fill(200);
  p.textSize(11);
  const controls = [
    "Arrow Keys - Navigate objects and dictionary",
    "Space - Interact with objects / Confirm entry",
    "Z - Open/Close dictionary",
    "Shift - Clear dictionary input"
  ];
  
  yPos = 305;
  for (let line of controls) {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 16;
  }
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(16);
  const flashAlpha = (Math.sin(p.frameCount * 0.1) + 1) * 127 + 50;
  p.fill(255, 255, 100, flashAlpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 365);
}

export function drawPausedOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255);
  p.textSize(16);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.pop();
}

export function drawGameOverScreen(p, narrative) {
  p.background(30, 30, 40);
  
  const ending = narrative.getEnding();
  
  // Title
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(28);
  p.text("Seven Days Have Passed", CANVAS_WIDTH / 2, 60);
  
  // Ending title
  p.fill(200, 180, 255);
  p.textSize(22);
  p.text(ending.title, CANVAS_WIDTH / 2, 110);
  
  // Message box
  p.fill(50, 50, 60);
  p.noStroke();
  p.rect(60, 150, CANVAS_WIDTH - 120, 100, 10);
  
  p.fill(220);
  p.textSize(13);
  p.textAlign(p.CENTER, p.CENTER);
  
  // Word wrap message
  const words = ending.message.split(' ');
  let line = '';
  let y = 170;
  const maxWidth = CANVAS_WIDTH - 140;
  
  for (let word of words) {
    const testLine = line + word + ' ';
    const testWidth = p.textWidth(testLine);
    
    if (testWidth > maxWidth && line !== '') {
      p.text(line, CANVAS_WIDTH / 2, y);
      line = word + ' ';
      y += 18;
    } else {
      line = testLine;
    }
  }
  p.text(line, CANVAS_WIDTH / 2, y);
  
  // Stats
  p.fill(150, 200, 255);
  p.textSize(14);
  p.text(`Words Discovered: ${gameState.discoveredWords.length}`, CANVAS_WIDTH / 2, 270);
  p.text(`Dictionary Entries: ${Object.keys(gameState.playerDictionary).length}`, CANVAS_WIDTH / 2, 290);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 310);
  
  // Restart prompt
  const flashAlpha = (Math.sin(p.frameCount * 0.1) + 1) * 127 + 50;
  p.fill(255, 255, 100, flashAlpha);
  p.textSize(16);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 355);
}