// ui.js - UI rendering

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderUI(p) {
  // Inventory bar at bottom
  renderInventory(p);
  
  // Score
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, 10, 5);
  
  // Hint cooldown indicator
  if (gameState.hintCooldown > 0) {
    const cooldownSeconds = Math.ceil(gameState.hintCooldown / 60);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`Hint: ${cooldownSeconds}s`, 590, 5);
  } else {
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(100, 255, 100);
    p.text("Hint: Ready", 590, 5);
  }
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(255, 200, 100);
    p.textSize(12);
    p.text("PAUSED", 590, 20);
  }
}

export function renderInventory(p) {
  const invY = 355;
  const invHeight = 45;
  
  p.fill(40, 50, 65);
  p.stroke(100, 150, 180);
  p.strokeWeight(2);
  p.rect(0, invY, CANVAS_WIDTH, invHeight);
  
  // Inventory label
  p.fill(200);
  p.noStroke();
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  p.text("Inventory:", 10, invY + invHeight/2);
  
  // Draw inventory items
  const startX = 100;
  const spacing = 50;
  
  gameState.inventory.forEach((item, index) => {
    const x = startX + index * spacing;
    const y = invY + invHeight/2;
    
    // Highlight selected item
    if (index === gameState.selectedItemIndex) {
      p.fill(255, 255, 0, 100);
      p.noStroke();
      p.rect(x - 25, y - 20, 45, 35, 5);
    }
    
    item.render(p, x, y, 28);
  });
  
  // Instructions
  p.fill(180);
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(10);
  p.text("Z: Select | Space: Use", 590, invY + invHeight/2);
}

export function renderStartScreen(p) {
  p.background(20, 30, 45);
  
  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Glow
  for (let i = 0; i < 3; i++) {
    p.fill(100, 200, 255, 50 - i * 15);
    p.textSize(48 + i * 2);
    p.text("MERIDIAN 157", 300, 80);
  }
  
  // Title
  p.fill(150, 220, 255);
  p.textSize(48);
  p.text("MERIDIAN 157", 300, 80);
  
  p.fill(200, 230, 255);
  p.textSize(18);
  p.text("Chapter 1: The Facility", 300, 120);
  p.pop();
  
  // Description box
  p.fill(30, 40, 55);
  p.stroke(100, 150, 180);
  p.strokeWeight(2);
  p.rect(50, 150, 500, 120, 5);
  
  p.fill(220);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(13);
  const desc = "You are David Zander, investigating a mysterious\nsubarctic research facility. Navigate through scenes,\ncollect items, and solve puzzles to uncover the truth.\nUse inventory items on hotspots to progress.";
  p.text(desc, 70, 165);
  
  // Controls box
  p.fill(30, 40, 55);
  p.stroke(100, 150, 180);
  p.strokeWeight(2);
  p.rect(50, 280, 500, 70, 5);
  
  p.fill(220);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("Arrow Keys: Navigate scenes  |  Space: Interact/Use item", 70, 290);
  p.text("Z: Select inventory item  |  Shift: Request hint", 70, 310);
  p.text("ESC: Pause  |  R: Restart", 70, 330);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  const flash = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255 * flash, 255 * flash, 100);
  p.text("PRESS ENTER TO START", 300, 375);
}

export function renderGameOverScreen(p, win) {
  p.background(20, 30, 45);
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  if (win) {
    // Victory glow
    for (let i = 0; i < 3; i++) {
      p.fill(100, 255, 100, 50 - i * 15);
      p.textSize(52 + i * 2);
      p.text("MYSTERY SOLVED", 300, 100);
    }
    
    p.fill(150, 255, 150);
    p.textSize(52);
    p.text("MYSTERY SOLVED", 300, 100);
    
    p.fill(200, 255, 200);
    p.textSize(16);
    p.text("You've uncovered the truth about Meridian 157", 300, 160);
  } else {
    p.fill(255, 150, 150);
    p.textSize(52);
    p.text("INVESTIGATION ENDED", 300, 100);
  }
  
  // Score box
  p.fill(30, 40, 55);
  p.stroke(100, 150, 180);
  p.strokeWeight(2);
  p.rect(150, 200, 300, 80, 5);
  
  p.fill(255, 255, 100);
  p.noStroke();
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, 300, 230);
  
  p.fill(200);
  p.textSize(14);
  p.text(`Scenes Visited: ${gameState.visitedScenes.length}`, 300, 260);
  
  // Restart prompt
  p.fill(100, 200, 255);
  p.textSize(20);
  const flash = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(100 * flash, 200 * flash, 255);
  p.text("PRESS R TO RESTART", 300, 330);
  
  p.pop();
}

export function renderHint(p) {
  const scene = getCurrentSceneForHint();
  const hint = getHintForCurrentState();
  
  if (hint && gameState.gamePhase === GAME_PHASES.PLAYING) {
    p.push();
    p.fill(40, 50, 65, 230);
    p.stroke(255, 255, 100);
    p.strokeWeight(2);
    p.rect(100, 150, 400, 80, 5);
    
    p.fill(255, 255, 150);
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(12);
    p.text("HINT", 300, 160);
    
    p.fill(220);
    p.textSize(11);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(hint, 300, 195, 370);
    p.pop();
  }
}

function getCurrentSceneForHint() {
  return gameState.currentScene;
}

function getHintForCurrentState() {
  const scene = gameState.currentScene;
  const inventory = gameState.inventory;
  
  // Scene-specific hints
  const hints = {
    0: "Look for items to collect. Try exploring other rooms.",
    1: "The control panel needs a keycard. Have you found one?",
    2: "Chemical analysis requires a sample. Check for chemicals.",
    3: "Some doors need tools to open. Look for a wrench.",
    4: "The radio needs power. Find a battery to activate it.",
    5: "Solve all puzzles in the facility to unlock the core."
  };
  
  return hints[scene] || "Explore and interact with glowing objects.";
}