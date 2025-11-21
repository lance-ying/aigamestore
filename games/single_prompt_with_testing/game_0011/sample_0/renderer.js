// renderer.js
import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, getCategoryColor, ELEMENT_CATEGORIES } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 15, 30);
  
  // Animated background particles
  for (let i = 0; i < 30; i++) {
    const x = (p.frameCount * 0.5 + i * 137) % CANVAS_WIDTH;
    const y = (i * 43) % CANVAS_HEIGHT;
    p.fill(150, 50, 50, 50);
    p.noStroke();
    p.circle(x, y, 4);
  }
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 50, 50);
  p.textSize(48);
  p.text("DOODLE DEVIL™", CANVAS_WIDTH / 2, 80);
  
  // Subtitle with glow effect
  p.fill(255, 100, 100, 200);
  p.textSize(16);
  p.text("The Dark Alchemy Puzzle", CANVAS_WIDTH / 2, 120);
  
  // Instructions box
  p.fill(40, 30, 50, 200);
  p.stroke(150, 50, 50);
  p.strokeWeight(2);
  p.rect(100, 150, 400, 180, 10);
  
  p.noStroke();
  p.fill(255, 200, 200);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  const instructions = [
    "Combine elements to discover evil creations!",
    "",
    "ARROW KEYS - Navigate elements",
    "SPACE - Select element / Combine",
    "Z - Clear selection",
    "ESC - Pause game",
    "",
    "Discover all elements to win!"
  ];
  
  let yPos = 160;
  for (const line of instructions) {
    p.text(line, 120, yPos);
    yPos += 20;
  }
  
  // Start prompt (pulsing)
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 150, 150, pulse * 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  
  // Element preview icons
  const elements = ["Fire", "Earth", "Wind", "Water"];
  const icons = ["🔥", "🌍", "💨", "💧"];
  p.textSize(24);
  for (let i = 0; i < 4; i++) {
    const x = 150 + i * 80;
    p.text(icons[i], x, 50);
  }
}

export function drawPlayingScreen(p) {
  p.background(25, 20, 35);
  
  // Draw main UI areas
  drawElementPanel(p);
  drawCombinationArea(p);
  drawStatsArea(p);
  drawMessage(p);
  
  // Draw animation if active
  if (gameState.animatingElement && gameState.animationTimer > 0) {
    drawDiscoveryAnimation(p);
  }
}

function drawElementPanel(p) {
  // Panel background
  p.fill(30, 25, 40);
  p.stroke(100, 80, 120);
  p.strokeWeight(2);
  p.rect(10, 10, 180, 380, 5);
  
  // Title
  p.fill(200, 180, 220);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text("Elements", 100, 20);
  
  // Element list
  const visibleElements = 12;
  const startIdx = Math.max(0, gameState.elementCursor - Math.floor(visibleElements / 2));
  const endIdx = Math.min(gameState.discoveredElements.length, startIdx + visibleElements);
  
  for (let i = startIdx; i < endIdx; i++) {
    const element = gameState.discoveredElements[i];
    const y = 45 + (i - startIdx) * 28;
    const isSelected = i === gameState.elementCursor;
    const isInSlot = gameState.selectedSlots.includes(element);
    
    // Highlight
    if (isSelected) {
      p.fill(80, 60, 100);
      p.noStroke();
      p.rect(15, y, 170, 25, 3);
    }
    
    // Element color based on category
    const category = ELEMENT_CATEGORIES[element] || "basic";
    const color = getCategoryColor(category);
    
    if (isInSlot) {
      p.fill(...color, 150);
    } else {
      p.fill(...color);
    }
    
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(12);
    p.text(element, 25, y + 12);
  }
  
  // Scroll indicators
  if (startIdx > 0) {
    p.fill(200, 180, 220);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("▲", 100, 40);
  }
  if (endIdx < gameState.discoveredElements.length) {
    p.fill(200, 180, 220);
    p.textAlign(p.CENTER, p.CENTER);
    p.text("▼", 100, 370);
  }
}

function drawCombinationArea(p) {
  // Main area background
  p.fill(35, 30, 45);
  p.stroke(100, 80, 120);
  p.strokeWeight(2);
  p.rect(200, 10, 390, 300, 5);
  
  // Title
  p.fill(200, 180, 220);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text("Combination Forge", 395, 25);
  
  // Slot 1
  drawCombinationSlot(p, 250, 100, gameState.selectedSlots[0], gameState.currentSelection === 0);
  
  // Plus sign
  p.fill(255, 200, 100);
  p.textSize(40);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("+", 395, 150);
  
  // Slot 2
  drawCombinationSlot(p, 450, 100, gameState.selectedSlots[1], gameState.currentSelection === 1);
  
  // Result indicator
  p.fill(50, 45, 60);
  p.stroke(120, 100, 140);
  p.strokeWeight(2);
  p.rect(300, 210, 190, 80, 5);
  
  const result = tryGetCombinationResult();
  if (result) {
    if (gameState.discoveredElements.includes(result)) {
      p.fill(150, 150, 150);
      p.noStroke();
      p.textSize(14);
      p.text("Already Discovered:", 395, 230);
      p.fill(180, 180, 180);
      p.textSize(18);
      p.text(result, 395, 260);
    } else {
      p.fill(100, 255, 100);
      p.noStroke();
      p.textSize(14);
      p.text("New Discovery:", 395, 230);
      p.fill(150, 255, 150);
      p.textSize(18);
      p.text("???", 395, 260);
    }
  } else if (gameState.selectedSlots[0] && gameState.selectedSlots[1]) {
    p.fill(255, 100, 100);
    p.noStroke();
    p.textSize(14);
    p.text("Invalid Combination", 395, 245);
  } else {
    p.fill(150, 140, 160);
    p.noStroke();
    p.textSize(14);
    p.text("Select two elements", 395, 245);
  }
}

function drawCombinationSlot(p, x, y, element, isActive) {
  const width = 120;
  const height = 80;
  
  // Slot background
  if (isActive) {
    p.fill(70, 60, 90);
    p.stroke(150, 130, 180);
  } else {
    p.fill(45, 40, 55);
    p.stroke(100, 80, 120);
  }
  p.strokeWeight(isActive ? 3 : 2);
  p.rect(x, y, width, height, 5);
  
  if (element) {
    const category = ELEMENT_CATEGORIES[element] || "basic";
    const color = getCategoryColor(category);
    p.fill(...color);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(element, x + width / 2, y + height / 2);
  } else {
    p.fill(100, 90, 110);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    p.text("Empty", x + width / 2, y + height / 2);
  }
}

function drawStatsArea(p) {
  // Stats background
  p.fill(30, 25, 40);
  p.stroke(100, 80, 120);
  p.strokeWeight(2);
  p.rect(200, 320, 390, 70, 5);
  
  p.fill(200, 180, 220);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  
  const discovered = gameState.discoveredElements.length;
  const total = gameState.totalElements;
  const percentage = ((discovered / total) * 100).toFixed(1);
  
  p.text(`Elements Discovered: ${discovered} / ${total} (${percentage}%)`, 210, 330);
  p.text(`Combinations Tried: ${gameState.combinationAttempts}`, 210, 350);
  p.text(`Successful: ${gameState.successfulCombinations}`, 210, 370);
  
  // Progress bar
  p.fill(50, 45, 60);
  p.noStroke();
  p.rect(420, 335, 160, 20, 3);
  
  const progress = discovered / total;
  const barColor = progress > 0.8 ? [100, 255, 100] : progress > 0.5 ? [255, 200, 100] : [255, 100, 100];
  p.fill(...barColor);
  p.rect(420, 335, 160 * progress, 20, 3);
}

function drawMessage(p) {
  if (gameState.message && gameState.messageTimer > 0) {
    const alpha = Math.min(255, gameState.messageTimer * 8);
    p.fill(255, 255, 255, alpha);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(gameState.message, CANVAS_WIDTH / 2, 30);
  }
}

function drawDiscoveryAnimation(p) {
  const progress = 1 - (gameState.animationTimer / 60);
  const scale = 1 + progress * 2;
  const alpha = (1 - progress) * 255;
  
  p.push();
  p.translate(395, 250);
  p.scale(scale);
  
  p.fill(255, 215, 0, alpha);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text(gameState.animatingElement, 0, 0);
  
  // Particles
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * p.TWO_PI + p.frameCount * 0.1;
    const r = progress * 100;
    const px = p.cos(angle) * r;
    const py = p.sin(angle) * r;
    p.fill(255, 215, 0, alpha * 0.5);
    p.circle(px, py, 5);
  }
  
  p.pop();
}

export function drawPausedScreen(p) {
  drawPlayingScreen(p);
  
  // Dark overlay
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Paused text
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  // Small indicator in top right
  p.fill(255, 255, 100);
  p.textSize(14);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function drawGameOverScreen(p) {
  p.background(20, 15, 30);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Animated background
  for (let i = 0; i < 50; i++) {
    const x = (p.frameCount * 0.3 + i * 137) % CANVAS_WIDTH;
    const y = (i * 43) % CANVAS_HEIGHT;
    const color = isWin ? [255, 215, 0, 30] : [150, 50, 50, 30];
    p.fill(...color);
    p.noStroke();
    p.circle(x, y, 6);
  }
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  if (isWin) {
    p.fill(255, 215, 0);
    p.textSize(56);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
    
    p.fill(255, 255, 200);
    p.textSize(20);
    p.text("You've discovered all evil elements!", CANVAS_WIDTH / 2, 150);
  } else {
    p.fill(255, 100, 100);
    p.textSize(56);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
  }
  
  // Stats box
  p.fill(40, 30, 50, 200);
  p.stroke(isWin ? [255, 215, 0] : [150, 50, 50]);
  p.strokeWeight(2);
  p.rect(150, 180, 300, 140, 10);
  
  p.noStroke();
  p.fill(255, 255, 255);
  p.textSize(18);
  p.text("Final Statistics", CANVAS_WIDTH / 2, 200);
  
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const stats = [
    `Elements Discovered: ${gameState.discoveredElements.length}`,
    `Total Combinations Tried: ${gameState.combinationAttempts}`,
    `Successful Combinations: ${gameState.successfulCombinations}`,
    `Success Rate: ${gameState.combinationAttempts > 0 ? ((gameState.successfulCombinations / gameState.combinationAttempts) * 100).toFixed(1) : 0}%`
  ];
  
  let yPos = 230;
  for (const stat of stats) {
    p.text(stat, 170, yPos);
    yPos += 25;
  }
  
  // Restart prompt
  const pulse = p.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 255, pulse * 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
}

function tryGetCombinationResult() {
  if (!gameState.selectedSlots[0] || !gameState.selectedSlots[1]) {
    return null;
  }
  
  const elem1 = gameState.selectedSlots[0];
  const elem2 = gameState.selectedSlots[1];
  
  // Check both orderings
  const key1 = `${elem1}+${elem2}`;
  const key2 = `${elem2}+${elem1}`;
  const sorted = [elem1, elem2].sort();
  const key3 = `${sorted[0]}+${sorted[1]}`;
  
  const { ELEMENT_RECIPES } = await import('./globals.js');
  return ELEMENT_RECIPES[key1] || ELEMENT_RECIPES[key2] || ELEMENT_RECIPES[key3] || null;
}