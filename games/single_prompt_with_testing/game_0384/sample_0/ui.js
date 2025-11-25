// ui.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
  // Timer
  p.fill(220, 220, 200);
  p.noStroke();
  p.textSize(18);
  p.textAlign(p.RIGHT, p.TOP);
  const minutes = Math.floor(gameState.timeRemaining / 60);
  const seconds = gameState.timeRemaining % 60;
  const timeColor = gameState.timeRemaining < 30 ? [255, 100, 100] : [220, 220, 200];
  p.fill(...timeColor);
  p.text(`Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, CANVAS_WIDTH - 10, 10);
  
  // Score
  p.fill(220, 220, 200);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Prep: ${gameState.score}%`, 10, 40);
  
  // Secured status
  p.textSize(14);
  let yPos = 65;
  p.text("Secured:", 10, yPos);
  yPos += 20;
  
  for (const [point, secured] of Object.entries(gameState.securedPoints)) {
    const color = secured ? [100, 255, 100] : [255, 100, 100];
    p.fill(...color);
    const displayName = point.replace(/([A-Z])/g, ' $1').trim();
    p.text(`${displayName}: ${secured ? '✓' : '✗'}`, 15, yPos);
    yPos += 18;
  }
  
  // Sedative status
  const sedColor = gameState.usedSedative ? [100, 255, 100] : [200, 200, 200];
  p.fill(...sedColor);
  p.text(`Sedative: ${gameState.usedSedative ? '✓' : '✗'}`, 15, yPos);
  
  // Interaction prompt
  p.fill(220, 220, 180);
  p.textSize(12);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text("SPACE: Interact | Z: Inventory", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 100);
    p.textSize(16);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 40);
  }
}

export function renderStartScreen(p) {
  p.background(20, 20, 30);
  
  // Title with glow effect
  p.fill(200, 50, 50);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("DON'T ESCAPE", CANVAS_WIDTH / 2, 80);
  
  p.fill(220, 220, 200);
  p.textSize(18);
  p.text("Reverse Escape Room", CANVAS_WIDTH / 2, 120);
  
  // Story
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  const story = [
    "You wake up in your cabin with a terrible feeling.",
    "Tonight is the full moon, and you know what that means.",
    "",
    "You have limited time to secure yourself inside",
    "before the transformation begins.",
    "",
    "Find items, solve puzzles, and barricade all entry points.",
    "Your survival - and the safety of others - depends on it."
  ];
  
  let yPos = 160;
  for (const line of story) {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 20;
  }
  
  // Controls
  p.fill(150, 150, 200);
  p.textSize(13);
  yPos += 10;
  p.text("ARROW KEYS: Move between rooms", CANVAS_WIDTH / 2, yPos);
  yPos += 18;
  p.text("SPACE: Interact with objects", CANVAS_WIDTH / 2, yPos);
  yPos += 18;
  p.text("Z: Open/close inventory", CANVAS_WIDTH / 2, yPos);
  yPos += 18;
  p.text("SHIFT: Combine items in inventory", CANVAS_WIDTH / 2, yPos);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

export function renderGameOver(p, won) {
  p.background(20, 20, 30);
  
  if (won) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("YOU SURVIVED", CANVAS_WIDTH / 2, 100);
    
    p.fill(220, 220, 200);
    p.textSize(16);
    const messages = [
      "The sun rises. You made it through the night.",
      "Your preparations held strong.",
      "The village is safe... for now.",
      "",
      `Final Preparation Score: ${gameState.score}%`
    ];
    
    let yPos = 160;
    for (const msg of messages) {
      p.text(msg, CANVAS_WIDTH / 2, yPos);
      yPos += 25;
    }
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("YOU ESCAPED", CANVAS_WIDTH / 2, 100);
    
    p.fill(220, 220, 200);
    p.textSize(16);
    const messages = [
      "Time ran out. The transformation began.",
      "Your defenses were inadequate.",
      "The beast broke free...",
      "",
      "The village paid the price.",
      "",
      `Preparation Score: ${gameState.score}%`
    ];
    
    let yPos = 160;
    for (const msg of messages) {
      p.text(msg, CANVAS_WIDTH / 2, yPos);
      yPos += 25;
    }
  }
  
  p.fill(255, 255, 100);
  p.textSize(18);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}