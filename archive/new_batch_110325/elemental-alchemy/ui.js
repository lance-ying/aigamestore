// ui.js - UI rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';
import { ELEMENT_RECIPES, getCategorizedElements } from './elements.js';

export function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Glow
  p.fill(100, 100, 255, 50);
  p.textSize(48);
  p.text("ELEMENTAL ALCHEMY", CANVAS_WIDTH / 2 + 2, 60 + 2);
  
  // Title
  p.fill(200, 200, 255);
  p.textSize(48);
  p.text("ELEMENTAL ALCHEMY", CANVAS_WIDTH / 2, 60);
  
  // Subtitle
  p.fill(150, 150, 200);
  p.textSize(16);
  p.text("Discover the Universe of Creation", CANVAS_WIDTH / 2, 100);
  
  // Description box
  p.fill(30, 30, 60, 200);
  p.rect(50, 130, CANVAS_WIDTH - 100, 140, 10);
  
  p.fill(220, 220, 240);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const desc = [
    "Start with four basic elements and combine them to discover",
    "new materials, creatures, and magical items!",
    "",
    "HOW TO PLAY:",
    "• Use ARROW KEYS to navigate elements",
    "• Press SPACE to select first element, then second to combine",
    "• Discover new categories and unlock the creation tree",
    "• Find all 100+ elements to win!"
  ];
  
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], 70, 145 + i * 18);
  }
  
  // Starting elements preview
  p.fill(200, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text("STARTING ELEMENTS:", CANVAS_WIDTH / 2, 295);
  
  const startElements = ["Air", "Earth", "Fire", "Water"];
  const spacing = 80;
  const startX = (CANVAS_WIDTH - spacing * 3) / 2;
  
  for (let i = 0; i < startElements.length; i++) {
    const elem = ELEMENT_RECIPES[startElements[i]];
    const x = startX + i * spacing;
    const y = 325;
    
    p.fill(...elem.color);
    p.circle(x, y, 40);
    p.fill(255);
    p.textSize(24);
    p.text(elem.icon, x, y - 2);
  }
  
  // Start prompt
  p.fill(100, 255, 100);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 375);
  
  p.pop();
}

export function renderGameOverScreen(p) {
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  p.push();
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (isWin) {
    // Win screen
    p.fill(255, 215, 0);
    p.textSize(48);
    p.text("CREATION COMPLETE!", CANVAS_WIDTH / 2, 120);
    
    p.fill(200, 255, 200);
    p.textSize(24);
    p.text("You've discovered all elements!", CANVAS_WIDTH / 2, 170);
    
    // Stats
    p.fill(220, 220, 255);
    p.textSize(18);
    p.text(`Elements Discovered: ${gameState.discoveredElements.size}`, CANVAS_WIDTH / 2, 220);
    p.text(`Successful Combinations: ${gameState.successfulCombinations}`, CANVAS_WIDTH / 2, 250);
    p.text(`Total Attempts: ${gameState.totalCombinations}`, CANVAS_WIDTH / 2, 280);
  } else {
    // This game doesn't have a lose condition, but keeping structure
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 150);
  }
  
  p.fill(150, 255, 150);
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
  
  p.pop();
}

export function renderPlayingScreen(p) {
  // Background
  p.background(25, 25, 45);
  
  // Top bar
  renderTopBar(p);
  
  // Element panels
  renderElementPanels(p);
  
  // Selected element indicator
  if (gameState.firstSelectedElement) {
    renderSelectedElementIndicator(p);
  }
  
  // Animations
  renderAnimations(p);
  
  // Pause indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.push();
    p.fill(255, 255, 100);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
    p.pop();
  }
}

function renderTopBar(p) {
  p.push();
  
  // Background
  p.fill(40, 40, 70);
  p.rect(0, 0, CANVAS_WIDTH, 40);
  
  // Stats
  p.fill(255, 255, 255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Elements: ${gameState.discoveredElements.size}/${gameState.totalElementsInGame}`, 10, 20);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`Combinations: ${gameState.successfulCombinations}`, CANVAS_WIDTH / 2, 20);
  
  p.textAlign(p.RIGHT, p.CENTER);
  const progress = (gameState.discoveredElements.size / gameState.totalElementsInGame * 100).toFixed(0);
  p.text(`Progress: ${progress}%`, CANVAS_WIDTH - 10, 20);
  
  p.pop();
}

function renderElementPanels(p) {
  const categorized = getCategorizedElements(gameState.discoveredElements);
  const categories = Object.keys(categorized).sort();
  
  if (categories.length === 0) return;
  
  const panelWidth = 270;
  const panelHeight = CANVAS_HEIGHT - 50;
  const panelY = 45;
  
  // Left panel (categories)
  p.push();
  p.fill(35, 35, 60);
  p.rect(5, panelY, panelWidth, panelHeight, 5);
  
  p.fill(200, 200, 255);
  p.textSize(16);
  p.textAlign(p.CENTER, p.TOP);
  p.text("CATEGORIES", 5 + panelWidth / 2, panelY + 5);
  
  // Draw categories
  const categoryStartY = panelY + 30;
  const categoryHeight = 35;
  
  for (let i = 0; i < categories.length; i++) {
    const y = categoryStartY + i * categoryHeight;
    const isSelected = i === gameState.selectedCategory;
    
    if (isSelected) {
      p.fill(70, 70, 120);
      p.rect(10, y, panelWidth - 10, categoryHeight - 5, 5);
    }
    
    p.fill(isSelected ? 255 : 180, isSelected ? 255 : 180, isSelected ? 255 : 200);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(14);
    p.text(`${categories[i]} (${categorized[categories[i]].length})`, 20, y + (categoryHeight - 5) / 2);
  }
  
  p.pop();
  
  // Right panel (elements in selected category)
  const currentCategory = categories[gameState.selectedCategory];
  if (currentCategory) {
    const elements = categorized[currentCategory];
    
    p.push();
    p.fill(35, 35, 60);
    p.rect(CANVAS_WIDTH - panelWidth - 5, panelY, panelWidth, panelHeight, 5);
    
    p.fill(200, 200, 255);
    p.textSize(16);
    p.textAlign(p.CENTER, p.TOP);
    p.text(currentCategory.toUpperCase(), CANVAS_WIDTH - panelWidth / 2 - 5, panelY + 5);
    
    // Draw elements
    const elemStartY = panelY + 30;
    const elemHeight = 40;
    const visibleElements = Math.floor((panelHeight - 35) / elemHeight);
    const scrollOffset = Math.max(0, gameState.selectedElementIndex - visibleElements + 3);
    
    for (let i = 0; i < elements.length; i++) {
      const displayIndex = i - scrollOffset;
      if (displayIndex < 0 || displayIndex >= visibleElements) continue;
      
      const elementName = elements[i];
      const element = ELEMENT_RECIPES[elementName];
      const y = elemStartY + displayIndex * elemHeight;
      const isSelected = i === gameState.selectedElementIndex;
      
      if (isSelected) {
        p.fill(70, 70, 120);
        p.rect(CANVAS_WIDTH - panelWidth, y, panelWidth - 10, elemHeight - 5, 5);
      }
      
      // Element circle
      p.fill(...element.color);
      p.circle(CANVAS_WIDTH - panelWidth + 25, y + (elemHeight - 5) / 2, 30);
      
      // Icon
      p.textSize(20);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(element.icon, CANVAS_WIDTH - panelWidth + 25, y + (elemHeight - 5) / 2 - 2);
      
      // Name
      p.fill(isSelected ? 255 : 200, isSelected ? 255 : 200, isSelected ? 255 : 220);
      p.textSize(14);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(elementName, CANVAS_WIDTH - panelWidth + 50, y + (elemHeight - 5) / 2);
    }
    
    p.pop();
  }
}

function renderSelectedElementIndicator(p) {
  const elem = ELEMENT_RECIPES[gameState.firstSelectedElement];
  if (!elem) return;
  
  p.push();
  
  // Draw in center
  const x = CANVAS_WIDTH / 2;
  const y = CANVAS_HEIGHT / 2;
  
  // Glow effect
  for (let i = 3; i > 0; i--) {
    p.fill(...elem.color, 30);
    p.circle(x, y, 80 + i * 10);
  }
  
  // Element
  p.fill(...elem.color);
  p.circle(x, y, 70);
  
  // Icon
  p.textSize(36);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(elem.icon, x, y - 3);
  
  // Label
  p.fill(255);
  p.textSize(14);
  p.text(gameState.firstSelectedElement, x, y + 50);
  
  p.fill(200, 200, 255);
  p.textSize(12);
  p.text("Select another element to combine", x, y + 70);
  
  p.pop();
}

function renderAnimations(p) {
  for (let i = gameState.animations.length - 1; i >= 0; i--) {
    const anim = gameState.animations[i];
    
    if (anim.type === 'discovery') {
      renderDiscoveryAnimation(p, anim);
    } else if (anim.type === 'failed') {
      renderFailedAnimation(p, anim);
    }
    
    anim.time++;
    if (anim.time > anim.duration) {
      gameState.animations.splice(i, 1);
    }
  }
}

function renderDiscoveryAnimation(p, anim) {
  const progress = anim.time / anim.duration;
  const alpha = 255 * (1 - progress);
  const scale = 1 + progress * 0.5;
  
  p.push();
  p.translate(anim.x, anim.y);
  p.scale(scale);
  
  // Particles
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * p.TWO_PI + progress * p.PI;
    const dist = progress * 50;
    const px = p.cos(angle) * dist;
    const py = p.sin(angle) * dist;
    
    p.fill(255, 255, 100, alpha);
    p.circle(px, py, 5);
  }
  
  // Element
  const elem = ELEMENT_RECIPES[anim.element];
  if (elem) {
    p.fill(...elem.color, alpha);
    p.circle(0, 0, 50);
    
    p.fill(255, 255, 255, alpha);
    p.textSize(28);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(elem.icon, 0, -2);
    
    p.textSize(12);
    p.text(anim.element, 0, 35);
  }
  
  p.pop();
}

function renderFailedAnimation(p, anim) {
  const progress = anim.time / anim.duration;
  const alpha = 255 * (1 - progress);
  
  p.push();
  p.fill(255, 100, 100, alpha);
  p.textSize(16);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("No combination!", anim.x, anim.y - progress * 30);
  p.pop();
}