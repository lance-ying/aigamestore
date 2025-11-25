// renderer.js - All rendering functions
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, PANEL_SIZE, PANEL_GAP, GAME_PHASES } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 15, 30);
  
  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Glow
  for (let i = 3; i > 0; i--) {
    p.fill(100, 80, 150, 30);
    p.textSize(48 + i * 2);
    p.text("FRAME WITHIN FRAMES", CANVAS_WIDTH / 2, 60);
  }
  
  // Main title
  p.fill(230, 220, 255);
  p.textSize(48);
  p.text("FRAME WITHIN FRAMES", CANVAS_WIDTH / 2, 60);
  
  // Description
  p.textSize(14);
  p.fill(180, 170, 200);
  const desc = [
    "Manipulate interconnected panels to solve visual puzzles.",
    "Zoom in and out to reveal hidden connections.",
    "Collect all 5 mystical orbs to win!"
  ];
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], CANVAS_WIDTH / 2, 120 + i * 20);
  }
  
  // Instructions
  p.textSize(13);
  p.fill(200, 190, 220);
  const instructions = [
    "ARROW KEYS - Navigate between panels",
    "SPACE - Interact / Zoom",
    "SHIFT - Swap panels",
    "Z - Undo (3 uses per level)"
  ];
  for (let i = 0; i < instructions.length; i++) {
    p.text(instructions[i], CANVAS_WIDTH / 2, 200 + i * 22);
  }
  
  // Start prompt with animation
  const alpha = 150 + 105 * p.sin(p.frameCount * 0.05);
  p.fill(255, 220, 150, alpha);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 330);
  
  p.pop();
}

export function renderPausedOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.fill(255, 255, 255);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

export function renderGameOverScreen(p) {
  p.background(20, 15, 30);
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  if (isWin) {
    // Victory glow
    for (let i = 3; i > 0; i--) {
      p.fill(255, 215, 0, 40);
      p.textSize(52 + i * 2);
      p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
    }
    p.fill(255, 223, 0);
    p.textSize(52);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
    
    p.fill(200, 190, 220);
    p.textSize(18);
    p.text("You collected all 5 mystical orbs!", CANVAS_WIDTH / 2, 150);
  } else {
    p.fill(220, 80, 80);
    p.textSize(48);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
  }
  
  // Score
  p.fill(180, 170, 200);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  p.textSize(20);
  p.text(`Orbs Collected: ${gameState.orbsCollected} / 5`, CANVAS_WIDTH / 2, 235);
  
  // Restart prompt
  const alpha = 150 + 105 * p.sin(p.frameCount * 0.05);
  p.fill(255, 220, 150, alpha);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
  
  p.pop();
}

export function renderPlayingScreen(p) {
  p.background(30, 25, 40);
  
  // Draw all panels
  for (let i = 0; i < gameState.panels.length; i++) {
    const panel = gameState.panels[i];
    const x = PANEL_GAP + (i % 2) * (PANEL_SIZE + PANEL_GAP);
    const y = PANEL_GAP + Math.floor(i / 2) * (PANEL_SIZE + PANEL_GAP);
    
    renderPanel(p, panel, x, y, i === gameState.selectedPanel);
  }
  
  // UI
  renderUI(p);
}

function renderPanel(p, panel, x, y, isSelected) {
  p.push();
  
  // Panel border with selection highlight
  if (isSelected) {
    // Animated glow
    const glowSize = 6 + 2 * p.sin(p.frameCount * 0.1);
    p.fill(150, 120, 255, 80);
    p.rect(x - glowSize, y - glowSize, PANEL_SIZE + glowSize * 2, PANEL_SIZE + glowSize * 2, 8);
    
    p.fill(120, 100, 200);
    p.rect(x - 3, y - 3, PANEL_SIZE + 6, PANEL_SIZE + 6, 6);
  }
  
  // Panel background
  p.fill(40, 35, 50);
  p.rect(x, y, PANEL_SIZE, PANEL_SIZE, 4);
  
  // Render scene based on type and zoom
  p.push();
  p.translate(x, y);
  p.clip(() => p.rect(0, 0, PANEL_SIZE, PANEL_SIZE, 4));
  
  renderScene(p, panel);
  
  p.pop();
  
  // Orb indicator
  if (panel.orbRevealed) {
    const orbSize = 20 + 5 * p.sin(p.frameCount * 0.15);
    p.fill(255, 215, 0, 200);
    p.circle(x + PANEL_SIZE - 25, y + 25, orbSize);
    p.fill(255, 255, 200, 150);
    p.circle(x + PANEL_SIZE - 25, y + 25, orbSize * 0.6);
  }
  
  // Zoom level indicator
  if (panel.zoomLevel > 0) {
    p.fill(200, 200, 255, 150);
    p.textSize(10);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`ZOOM: ${panel.zoomLevel}`, x + 5, y + 5);
  }
  
  p.pop();
}

function renderScene(p, panel) {
  const zoom = 1 + panel.zoomLevel * 0.8;
  const centerX = PANEL_SIZE / 2;
  const centerY = PANEL_SIZE / 2;
  
  p.push();
  p.translate(centerX, centerY);
  p.scale(zoom);
  p.translate(-centerX + panel.offset.x, -centerY + panel.offset.y);
  
  switch(panel.sceneType) {
    case 'forest':
      renderForest(p, panel);
      break;
    case 'mountain':
      renderMountain(p, panel);
      break;
    case 'river':
      renderRiver(p, panel);
      break;
    case 'temple':
      renderTemple(p, panel);
      break;
    case 'city':
      renderCity(p, panel);
      break;
    case 'window':
      renderWindow(p, panel);
      break;
    case 'door':
      renderDoor(p, panel);
      break;
    case 'garden':
      renderGarden(p, panel);
      break;
    case 'tower':
      renderTower(p, panel);
      break;
    case 'stairs':
      renderStairs(p, panel);
      break;
    case 'bridge':
      renderBridge(p, panel);
      break;
    case 'cave':
      renderCave(p, panel);
      break;
    case 'sky':
      renderSky(p, panel);
      break;
    case 'cloud':
      renderCloud(p, panel);
      break;
    case 'bird':
      renderBird(p, panel);
      break;
    case 'nest':
      renderNest(p, panel);
      break;
    case 'palace':
      renderPalace(p, panel);
      break;
    case 'mirror':
      renderMirror(p, panel);
      break;
    case 'crystal':
      renderCrystal(p, panel);
      break;
    case 'treasure':
      renderTreasure(p, panel);
      break;
  }
  
  p.pop();
}

// Scene rendering functions
function renderForest(p, panel) {
  // Sky gradient
  for (let i = 0; i < PANEL_SIZE; i++) {
    const inter = i / PANEL_SIZE;
    p.stroke(100 - inter * 50, 150 - inter * 50, 200 - inter * 80);
    p.line(0, i, PANEL_SIZE, i);
  }
  
  // Trees
  p.noStroke();
  for (let i = 0; i < 8; i++) {
    const x = (i * 35 + 20) % PANEL_SIZE;
    const y = PANEL_SIZE - 60 + (i % 3) * 10;
    // Trunk
    p.fill(80, 50, 30);
    p.rect(x, y, 15, 50);
    // Foliage
    p.fill(40, 120, 40);
    p.circle(x + 7, y - 10, 40);
    p.fill(50, 140, 50);
    p.circle(x + 7, y - 5, 35);
  }
}

function renderMountain(p, panel) {
  // Sky
  p.fill(150, 180, 220);
  p.rect(0, 0, PANEL_SIZE, PANEL_SIZE * 0.6);
  
  // Mountains
  p.fill(100, 100, 120);
  p.triangle(0, PANEL_SIZE * 0.6, PANEL_SIZE * 0.5, PANEL_SIZE * 0.2, PANEL_SIZE, PANEL_SIZE * 0.6);
  p.fill(80, 80, 100);
  p.triangle(PANEL_SIZE * 0.3, PANEL_SIZE * 0.6, PANEL_SIZE * 0.7, PANEL_SIZE * 0.3, PANEL_SIZE, PANEL_SIZE * 0.6);
  
  // Snow caps
  p.fill(240, 240, 255);
  p.triangle(PANEL_SIZE * 0.45, PANEL_SIZE * 0.3, PANEL_SIZE * 0.5, PANEL_SIZE * 0.2, PANEL_SIZE * 0.55, PANEL_SIZE * 0.3);
  
  // Ground
  p.fill(60, 100, 60);
  p.rect(0, PANEL_SIZE * 0.6, PANEL_SIZE, PANEL_SIZE * 0.4);
}

function renderRiver(p, panel) {
  // Banks
  p.fill(80, 120, 60);
  p.rect(0, 0, PANEL_SIZE, PANEL_SIZE);
  
  // River
  p.fill(100, 150, 200, 200);
  p.beginShape();
  p.vertex(0, PANEL_SIZE * 0.4);
  p.bezierVertex(PANEL_SIZE * 0.3, PANEL_SIZE * 0.3, PANEL_SIZE * 0.7, PANEL_SIZE * 0.6, PANEL_SIZE, PANEL_SIZE * 0.5);
  p.vertex(PANEL_SIZE, PANEL_SIZE * 0.7);
  p.bezierVertex(PANEL_SIZE * 0.6, PANEL_SIZE * 0.8, PANEL_SIZE * 0.4, PANEL_SIZE * 0.5, 0, PANEL_SIZE * 0.6);
  p.endShape(p.CLOSE);
  
  // Ripples
  p.noFill();
  p.stroke(120, 170, 220, 150);
  p.strokeWeight(2);
  for (let i = 0; i < 3; i++) {
    const offset = (p.frameCount * 2 + i * 20) % 60;
    p.circle(PANEL_SIZE * 0.3, PANEL_SIZE * 0.5, offset);
  }
  p.noStroke();
}

function renderTemple(p, panel) {
  // Sky
  p.fill(180, 160, 200);
  p.rect(0, 0, PANEL_SIZE, PANEL_SIZE * 0.5);
  
  // Temple structure
  p.fill(150, 130, 100);
  p.rect(PANEL_SIZE * 0.25, PANEL_SIZE * 0.4, PANEL_SIZE * 0.5, PANEL_SIZE * 0.45);
  
  // Roof
  p.fill(120, 100, 80);
  p.triangle(PANEL_SIZE * 0.2, PANEL_SIZE * 0.4, PANEL_SIZE * 0.5, PANEL_SIZE * 0.25, PANEL_SIZE * 0.8, PANEL_SIZE * 0.4);
  
  // Door
  p.fill(80, 60, 40);
  p.rect(PANEL_SIZE * 0.4, PANEL_SIZE * 0.6, PANEL_SIZE * 0.2, PANEL_SIZE * 0.25);
  
  // Columns
  p.fill(130, 110, 90);
  p.rect(PANEL_SIZE * 0.28, PANEL_SIZE * 0.5, PANEL_SIZE * 0.08, PANEL_SIZE * 0.35);
  p.rect(PANEL_SIZE * 0.64, PANEL_SIZE * 0.5, PANEL_SIZE * 0.08, PANEL_SIZE * 0.35);
  
  // Orb glow if revealed
  if (panel.orbRevealed) {
    const glowAlpha = 50 + 30 * p.sin(p.frameCount * 0.1);
    p.fill(255, 215, 0, glowAlpha);
    p.circle(PANEL_SIZE * 0.5, PANEL_SIZE * 0.7, 60);
  }
}

function renderCity(p, panel) {
  // Sky
  const skyGrad = p.lerpColor(p.color(100, 120, 180), p.color(200, 180, 220), panel.zoomLevel / 2);
  p.fill(skyGrad);
  p.rect(0, 0, PANEL_SIZE, PANEL_SIZE * 0.6);
  
  // Buildings
  for (let i = 0; i < 6; i++) {
    const x = i * (PANEL_SIZE / 6);
    const h = 80 + (i % 3) * 40;
    p.fill(60 + i * 10, 60 + i * 8, 80 + i * 5);
    p.rect(x, PANEL_SIZE - h, PANEL_SIZE / 6, h);
    
    // Windows
    p.fill(200, 200, 100, 150);
    for (let j = 0; j < 4; j++) {
      for (let k = 0; k < 2; k++) {
        p.rect(x + 5 + k * 15, PANEL_SIZE - h + 10 + j * 20, 8, 12);
      }
    }
  }
}

function renderWindow(p, panel) {
  // Frame
  p.fill(100, 80, 60);
  p.rect(0, 0, PANEL_SIZE, PANEL_SIZE);
  
  // Window panes
  p.fill(150, 200, 250, 180);
  p.rect(PANEL_SIZE * 0.1, PANEL_SIZE * 0.1, PANEL_SIZE * 0.35, PANEL_SIZE * 0.8);
  p.rect(PANEL_SIZE * 0.55, PANEL_SIZE * 0.1, PANEL_SIZE * 0.35, PANEL_SIZE * 0.8);
  
  // Cross bars
  p.fill(80, 60, 40);
  p.rect(PANEL_SIZE * 0.45, 0, PANEL_SIZE * 0.1, PANEL_SIZE);
  p.rect(0, PANEL_SIZE * 0.45, PANEL_SIZE, PANEL_SIZE * 0.1);
  
  // View through window
  if (panel.zoomLevel >= 1) {
    p.fill(200, 220, 255, 100);
    p.rect(PANEL_SIZE * 0.15, PANEL_SIZE * 0.15, PANEL_SIZE * 0.25, PANEL_SIZE * 0.25);
    
    if (panel.hasOrb && panel.zoomLevel === 2) {
      const orbGlow = 100 + 50 * p.sin(p.frameCount * 0.1);
      p.fill(255, 215, 0, orbGlow);
      p.circle(PANEL_SIZE * 0.275, PANEL_SIZE * 0.275, 30);
    }
  }
}

function renderDoor(p, panel) {
  // Wall
  p.fill(120, 100, 80);
  p.rect(0, 0, PANEL_SIZE, PANEL_SIZE);
  
  // Door
  p.fill(80, 50, 30);
  p.rect(PANEL_SIZE * 0.2, PANEL_SIZE * 0.1, PANEL_SIZE * 0.6, PANEL_SIZE * 0.85, 10);
  
  // Door panels
  p.fill(100, 70, 50);
  p.rect(PANEL_SIZE * 0.25, PANEL_SIZE * 0.15, PANEL_SIZE * 0.23, PANEL_SIZE * 0.35, 5);
  p.rect(PANEL_SIZE * 0.52, PANEL_SIZE * 0.15, PANEL_SIZE * 0.23, PANEL_SIZE * 0.35, 5);
  p.rect(PANEL_SIZE * 0.25, PANEL_SIZE * 0.55, PANEL_SIZE * 0.23, PANEL_SIZE * 0.35, 5);
  p.rect(PANEL_SIZE * 0.52, PANEL_SIZE * 0.55, PANEL_SIZE * 0.23, PANEL_SIZE * 0.35, 5);
  
  // Handle
  p.fill(200, 180, 100);
  p.circle(PANEL_SIZE * 0.7, PANEL_SIZE * 0.5, 12);
}

function renderGarden(p, panel) {
  // Ground
  p.fill(60, 140, 60);
  p.rect(0, 0, PANEL_SIZE, PANEL_SIZE);
  
  // Flowers
  for (let i = 0; i < 15; i++) {
    const x = ((i * 37) % PANEL_SIZE);
    const y = ((i * 53) % PANEL_SIZE);
    const flowerColor = [(i * 40) % 255, (i * 80 + 100) % 255, (i * 120 + 100) % 255];
    
    // Stem
    p.fill(50, 120, 50);
    p.rect(x, y, 3, 20);
    
    // Petals
    p.fill(...flowerColor);
    for (let j = 0; j < 6; j++) {
      const angle = j * p.PI / 3;
      p.circle(x + p.cos(angle) * 8, y + p.sin(angle) * 8, 12);
    }
    
    // Center
    p.fill(255, 200, 50);
    p.circle(x, y, 8);
  }
}

function renderTower(p, panel) {
  // Sky
  p.fill(120, 140, 200);
  p.rect(0, 0, PANEL_SIZE, PANEL_SIZE);
  
  // Tower base
  p.fill(100, 100, 120);
  p.rect(PANEL_SIZE * 0.3, PANEL_SIZE * 0.5, PANEL_SIZE * 0.4, PANEL_SIZE * 0.5);
  
  // Tower middle
  p.rect(PANEL_SIZE * 0.35, PANEL_SIZE * 0.3, PANEL_SIZE * 0.3, PANEL_SIZE * 0.2);
  
  // Tower top
  p.rect(PANEL_SIZE * 0.4, PANEL_SIZE * 0.1, PANEL_SIZE * 0.2, PANEL_SIZE * 0.2);
  
  // Spire
  p.fill(80, 80, 100);
  p.triangle(PANEL_SIZE * 0.35, PANEL_SIZE * 0.1, PANEL_SIZE * 0.5, PANEL_SIZE * 0.02, PANEL_SIZE * 0.65, PANEL_SIZE * 0.1);
  
  // Windows
  p.fill(200, 200, 100, 150);
  for (let i = 0; i < 3; i++) {
    p.circle(PANEL_SIZE * 0.5, PANEL_SIZE * 0.6 + i * 0.1, 15);
  }
}

function renderStairs(p, panel) {
  // Background
  p.fill(80, 80, 100);
  p.rect(0, 0, PANEL_SIZE, PANEL_SIZE);
  
  // Stairs going up
  for (let i = 0; i < 8; i++) {
    const gray = 100 + i * 10;
    p.fill(gray, gray, gray + 20);
    const y = PANEL_SIZE - i * (PANEL_SIZE / 8);
    const x = i * (PANEL_SIZE / 16);
    p.rect(x, y - PANEL_SIZE / 8, PANEL_SIZE / 8, PANEL_SIZE / 8);
  }
  
  // Railing
  p.stroke(150, 150, 170);
  p.strokeWeight(3);
  p.noFill();
  p.beginShape();
  for (let i = 0; i < 8; i++) {
    const y = PANEL_SIZE - i * (PANEL_SIZE / 8) - PANEL_SIZE / 16;
    const x = i * (PANEL_SIZE / 16) + PANEL_SIZE / 16;
    p.vertex(x, y);
  }
  p.endShape();
  p.noStroke();
}

function renderBridge(p, panel) {
  // Sky
  p.fill(140, 180, 220);
  p.rect(0, 0, PANEL_SIZE, PANEL_SIZE * 0.4);
  
  // Water
  p.fill(80, 120, 180);
  p.rect(0, PANEL_SIZE * 0.4, PANEL_SIZE, PANEL_SIZE * 0.6);
  
  // Bridge arch
  p.fill(120, 100, 80);
  p.arc(PANEL_SIZE / 2, PANEL_SIZE * 0.5, PANEL_SIZE * 0.8, PANEL_SIZE * 0.4, p.PI, 0);
  
  // Bridge deck
  p.fill(100, 80, 60);
  p.rect(0, PANEL_SIZE * 0.35, PANEL_SIZE, PANEL_SIZE * 0.08);
  
  // Orb on bridge
  if (panel.hasOrb && panel.zoomLevel >= 1) {
    const orbGlow = 100 + 50 * p.sin(p.frameCount * 0.1);
    p.fill(255, 215, 0, orbGlow);
    p.circle(PANEL_SIZE / 2, PANEL_SIZE * 0.35, 40);
  }
}

function renderCave(p, panel) {
  // Dark background
  p.fill(20, 20, 30);
  p.rect(0, 0, PANEL_SIZE, PANEL_SIZE);
  
  // Cave opening
  p.fill(40, 40, 60);
  p.arc(PANEL_SIZE / 2, PANEL_SIZE * 0.8, PANEL_SIZE * 0.6, PANEL_SIZE * 0.8, p.PI, 0);
  
  // Stalactites
  for (let i = 0; i < 5; i++) {
    p.fill(60, 60, 80);
    const x = PANEL_SIZE * 0.2 + i * PANEL_SIZE * 0.15;
    p.triangle(x - 10, PANEL_SIZE * 0.4, x, PANEL_SIZE * 0.6, x + 10, PANEL_SIZE * 0.4);
  }
  
  // Light from outside
  const lightAlpha = 50 + 30 * p.sin(p.frameCount * 0.05);
  p.fill(200, 220, 255, lightAlpha);
  p.circle(PANEL_SIZE / 2, PANEL_SIZE * 0.8, PANEL_SIZE * 0.5);
}

function renderSky(p, panel) {
  // Gradient sky
  for (let i = 0; i < PANEL_SIZE; i++) {
    const inter = i / PANEL_SIZE;
    const skyColor = p.lerpColor(p.color(100, 150, 255), p.color(200, 220, 255), inter);
    p.stroke(skyColor);
    p.line(0, i, PANEL_SIZE, i);
  }
  p.noStroke();
  
  // Sun
  p.fill(255, 240, 150);
  p.circle(PANEL_SIZE * 0.8, PANEL_SIZE * 0.2, 60);
  p.fill(255, 250, 200, 100);
  p.circle(PANEL_SIZE * 0.8, PANEL_SIZE * 0.2, 80);
}

function renderCloud(p, panel) {
  // Sky
  p.fill(150, 180, 255);
  p.rect(0, 0, PANEL_SIZE, PANEL_SIZE);
  
  // Cloud shape
  const cloudX = PANEL_SIZE / 2;
  const cloudY = PANEL_SIZE / 2;
  p.fill(255, 255, 255, 230);
  p.circle(cloudX, cloudY, 80);
  p.circle(cloudX - 40, cloudY, 60);
  p.circle(cloudX + 40, cloudY, 60);
  p.circle(cloudX - 20, cloudY - 20, 50);
  p.circle(cloudX + 20, cloudY - 20, 50);
  
  // Softer edges
  p.fill(255, 255, 255, 150);
  p.circle(cloudX, cloudY, 100);
}

function renderBird(p, panel) {
  // Sky
  p.fill(140, 170, 240);
  p.rect(0, 0, PANEL_SIZE, PANEL_SIZE);
  
  // Bird
  const birdX = PANEL_SIZE / 2;
  const birdY = PANEL_SIZE / 2;
  const wingFlap = p.sin(p.frameCount * 0.15) * 10;
  
  // Body
  p.fill(80, 60, 40);
  p.ellipse(birdX, birdY, 40, 25);
  
  // Head
  p.fill(70, 50, 30);
  p.circle(birdX + 15, birdY - 5, 20);
  
  // Beak
  p.fill(200, 150, 50);
  p.triangle(birdX + 22, birdY - 5, birdX + 32, birdY - 8, birdX + 32, birdY - 2);
  
  // Wings
  p.fill(90, 70, 50);
  p.push();
  p.translate(birdX - 10, birdY);
  p.rotate(-0.3 + wingFlap * 0.05);
  p.ellipse(0, 0, 35, 15);
  p.pop();
  
  p.push();
  p.translate(birdX + 10, birdY);
  p.rotate(0.3 - wingFlap * 0.05);
  p.ellipse(0, 0, 35, 15);
  p.pop();
}

function renderNest(p, panel) {
  // Branch
  p.fill(100, 70, 40);
  p.rect(0, PANEL_SIZE * 0.4, PANEL_SIZE, PANEL_SIZE * 0.1);
  
  // Sky
  p.fill(160, 190, 250);
  p.rect(0, 0, PANEL_SIZE, PANEL_SIZE * 0.4);
  
  // Ground below
  p.fill(80, 120, 60);
  p.rect(0, PANEL_SIZE * 0.5, PANEL_SIZE, PANEL_SIZE * 0.5);
  
  // Nest
  p.fill(120, 90, 50);
  p.ellipse(PANEL_SIZE / 2, PANEL_SIZE * 0.45, PANEL_SIZE * 0.4, PANEL_SIZE * 0.15);
  p.fill(140, 110, 70);
  p.ellipse(PANEL_SIZE / 2, PANEL_SIZE * 0.45, PANEL_SIZE * 0.3, PANEL_SIZE * 0.1);
  
  // Eggs
  p.fill(230, 240, 255);
  p.ellipse(PANEL_SIZE * 0.45, PANEL_SIZE * 0.45, 20, 25);
  p.ellipse(PANEL_SIZE * 0.55, PANEL_SIZE * 0.45, 20, 25);
  
  // Orb glow
  if (panel.hasOrb && panel.zoomLevel >= 2) {
    const orbGlow = 100 + 50 * p.sin(p.frameCount * 0.1);
    p.fill(255, 215, 0, orbGlow);
    p.circle(PANEL_SIZE / 2, PANEL_SIZE * 0.45, 50);
  }
}

function renderPalace(p, panel) {
  // Sky
  p.fill(180, 150, 220);
  p.rect(0, 0, PANEL_SIZE, PANEL_SIZE * 0.4);
  
  // Palace
  p.fill(200, 180, 150);
  p.rect(PANEL_SIZE * 0.15, PANEL_SIZE * 0.4, PANEL_SIZE * 0.7, PANEL_SIZE * 0.5);
  
  // Domes
  p.fill(180, 160, 130);
  p.arc(PANEL_SIZE * 0.35, PANEL_SIZE * 0.4, PANEL_SIZE * 0.25, PANEL_SIZE * 0.2, p.PI, 0);
  p.arc(PANEL_SIZE * 0.65, PANEL_SIZE * 0.4, PANEL_SIZE * 0.25, PANEL_SIZE * 0.2, p.PI, 0);
  
  // Decorative elements
  p.fill(220, 200, 170);
  for (let i = 0; i < 5; i++) {
    const x = PANEL_SIZE * 0.2 + i * PANEL_SIZE * 0.15;
    p.rect(x, PANEL_SIZE * 0.55, PANEL_SIZE * 0.08, PANEL_SIZE * 0.3);
  }
  
  // Orb location hint
  if (panel.hasOrb) {
    const glowAlpha = 30 + 20 * p.sin(p.frameCount * 0.1);
    p.fill(255, 215, 0, glowAlpha);
    p.circle(PANEL_SIZE * 0.5, PANEL_SIZE * 0.65, 40);
  }
}

function renderMirror(p, panel) {
  // Frame
  p.fill(150, 120, 80);
  p.rect(0, 0, PANEL_SIZE, PANEL_SIZE);
  
  // Mirror surface
  p.fill(200, 220, 255, 200);
  p.rect(PANEL_SIZE * 0.1, PANEL_SIZE * 0.1, PANEL_SIZE * 0.8, PANEL_SIZE * 0.8);
  
  // Decorative border
  p.noFill();
  p.stroke(180, 150, 100);
  p.strokeWeight(8);
  p.rect(PANEL_SIZE * 0.1, PANEL_SIZE * 0.1, PANEL_SIZE * 0.8, PANEL_SIZE * 0.8);
  p.noStroke();
  
  // Reflection shimmer
  const shimmerAlpha = 50 + 30 * p.sin(p.frameCount * 0.08);
  p.fill(255, 255, 255, shimmerAlpha);
  p.rect(PANEL_SIZE * 0.15, PANEL_SIZE * 0.15, PANEL_SIZE * 0.3, PANEL_SIZE * 0.7);
}

function renderCrystal(p, panel) {
  // Dark background
  p.fill(30, 20, 40);
  p.rect(0, 0, PANEL_SIZE, PANEL_SIZE);
  
  // Crystal facets
  const centerX = PANEL_SIZE / 2;
  const centerY = PANEL_SIZE / 2;
  
  p.fill(150, 100, 200, 180);
  p.triangle(centerX, centerY - 60, centerX - 40, centerY, centerX + 40, centerY);
  
  p.fill(180, 130, 220, 180);
  p.triangle(centerX - 40, centerY, centerX, centerY + 60, centerX + 40, centerY);
  
  p.fill(120, 80, 180, 180);
  p.triangle(centerX - 40, centerY, centerX - 70, centerY + 40, centerX, centerY + 60);
  
  p.fill(140, 100, 200, 180);
  p.triangle(centerX + 40, centerY, centerX + 70, centerY + 40, centerX, centerY + 60);
  
  // Inner glow
  const glowSize = 40 + 10 * p.sin(p.frameCount * 0.1);
  p.fill(200, 150, 255, 100);
  p.circle(centerX, centerY, glowSize);
}

function renderTreasure(p, panel) {
  // Dark room
  p.fill(40, 30, 20);
  p.rect(0, 0, PANEL_SIZE, PANEL_SIZE);
  
  // Treasure chest
  p.fill(100, 70, 40);
  p.rect(PANEL_SIZE * 0.3, PANEL_SIZE * 0.5, PANEL_SIZE * 0.4, PANEL_SIZE * 0.3);
  
  // Chest lid
  p.fill(120, 90, 60);
  p.arc(PANEL_SIZE * 0.5, PANEL_SIZE * 0.5, PANEL_SIZE * 0.4, PANEL_SIZE * 0.2, p.PI, 0);
  
  // Gold bands
  p.fill(200, 180, 100);
  p.rect(PANEL_SIZE * 0.3, PANEL_SIZE * 0.6, PANEL_SIZE * 0.4, PANEL_SIZE * 0.03);
  p.rect(PANEL_SIZE * 0.3, PANEL_SIZE * 0.7, PANEL_SIZE * 0.4, PANEL_SIZE * 0.03);
  
  // Coins spilling out
  for (let i = 0; i < 8; i++) {
    p.fill(220, 200, 100);
    const x = PANEL_SIZE * 0.35 + (i % 4) * 20;
    const y = PANEL_SIZE * 0.78 + Math.floor(i / 4) * 15;
    p.ellipse(x, y, 15, 10);
  }
  
  // Ambient glow
  const ambientGlow = 50 + 30 * p.sin(p.frameCount * 0.08);
  p.fill(255, 215, 100, ambientGlow);
  p.circle(PANEL_SIZE * 0.5, PANEL_SIZE * 0.65, 80);
}

function renderUI(p) {
  p.push();
  
  // Top UI bar
  p.fill(20, 15, 30, 200);
  p.rect(0, 0, CANVAS_WIDTH, 35);
  
  // Level info
  p.fill(200, 190, 220);
  p.textSize(16);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Level ${gameState.currentLevel + 1}/${gameState.totalLevels}`, 10, 8);
  
  // Orbs collected
  p.text(`Orbs: ${gameState.orbsCollected}/${gameState.totalLevels}`, 150, 8);
  
  // Score
  p.text(`Score: ${gameState.score}`, 300, 8);
  
  // Undos remaining
  p.fill(180, 170, 200);
  p.textSize(14);
  p.text(`Undos: ${gameState.undosRemaining}`, 450, 10);
  
  // Swap mode indicator
  if (gameState.swapMode) {
    p.fill(255, 200, 100);
    p.textSize(14);
    p.textAlign(p.CENTER, p.TOP);
    p.text("SWAP MODE - Select destination panel", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 25);
  }
  
  p.pop();
}