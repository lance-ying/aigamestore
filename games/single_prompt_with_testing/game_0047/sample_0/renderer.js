// renderer.js - Rendering functions

import {
  CANVAS_WIDTH, CANVAS_HEIGHT, DECK_WIDTH, DECK_LENGTH,
  PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE, TOTAL_CLUES
} from './globals.js';

export function renderStartScreen(p, gameState) {
  p.background(20, 25, 35);
  
  // Title with dithered effect
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(200, 210, 220);
  p.textSize(32);
  p.text("LOST AT SEA, 1803", CANVAS_WIDTH / 2, 80);
  
  p.textSize(24);
  p.fill(180, 190, 200);
  p.text('the good ship', CANVAS_WIDTH / 2, 120);
  
  p.textSize(40);
  p.fill(220, 230, 240);
  p.text('"OBRA DINN"', CANVAS_WIDTH / 2, 160);
  
  // Divider
  p.stroke(120, 130, 140);
  p.strokeWeight(2);
  p.line(150, 190, 450, 190);
  p.noStroke();
  
  // Ship info
  p.textSize(12);
  p.fill(150, 160, 170);
  p.textAlign(p.CENTER);
  p.text("Built 1796, London ~ 800 tons, 18ft draught", CANVAS_WIDTH / 2, 210);
  p.text("Captain R. WITTEREL ~ Crew 51 men", CANVAS_WIDTH / 2, 228);
  p.text("Last voyage to Orient ~ Cape rendezvous unmet", CANVAS_WIDTH / 2, 246);
  
  // Instructions
  p.textSize(14);
  p.fill(180, 190, 200);
  p.text("As an insurance investigator, board the ship", CANVAS_WIDTH / 2, 280);
  p.text("and discover what happened to the crew.", CANVAS_WIDTH / 2, 300);
  p.text("Find all " + TOTAL_CLUES + " clues to complete your investigation.", CANVAS_WIDTH / 2, 320);
  
  // Start prompt
  p.textSize(18);
  p.fill(200, 220, 255);
  const blinkPhase = Math.floor(p.frameCount / 30) % 2;
  if (blinkPhase === 0) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 360);
  }
}

export function renderGameOverScreen(p, gameState) {
  p.background(20, 25, 35);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    p.fill(100, 220, 120);
    p.textSize(36);
    p.text("INVESTIGATION COMPLETE", CANVAS_WIDTH / 2, 120);
    
    p.fill(180, 190, 200);
    p.textSize(18);
    p.text("You discovered all clues and escaped the Obra Dinn.", CANVAS_WIDTH / 2, 180);
    p.text("The mystery of the crew's fate has been documented.", CANVAS_WIDTH / 2, 210);
  } else {
    p.fill(220, 100, 100);
    p.textSize(36);
    p.text("INVESTIGATION FAILED", CANVAS_WIDTH / 2, 120);
    
    p.fill(180, 190, 200);
    p.textSize(18);
    p.text(gameState.gameOverMessage, CANVAS_WIDTH / 2, 180);
  }
  
  // Score
  p.fill(200, 210, 220);
  p.textSize(24);
  p.text("Clues Found: " + gameState.cluesFound + " / " + TOTAL_CLUES, CANVAS_WIDTH / 2, 250);
  
  // Restart
  p.textSize(18);
  p.fill(200, 220, 255);
  const blinkPhase = Math.floor(p.frameCount / 30) % 2;
  if (blinkPhase === 0) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
  }
}

export function renderGame(p, gameState) {
  // Clear with fog color
  p.background(60, 70, 80);
  
  const player = gameState.player;
  if (!player) return;
  
  // Render 3D first-person view
  render3DView(p, gameState);
  
  // Render UI overlay
  renderUI(p, gameState);
  
  // Pause indicator
  if (gameState.gamePhase === PHASE_PAUSED) {
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(255, 255, 255);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

function render3DView(p, gameState) {
  const player = gameState.player;
  
  // Simple pseudo-3D rendering
  // Draw deck
  renderDeck(p, player);
  
  // Collect and sort entities by distance for proper rendering order
  const renderQueue = [];
  
  // Add clues
  gameState.clues.forEach(clue => {
    if (!clue.discovered) {
      const dist = Math.sqrt((clue.x - player.x) ** 2 + (clue.z - player.z) ** 2);
      renderQueue.push({ type: 'clue', entity: clue, dist });
    }
  });
  
  // Add spirits
  gameState.spirits.forEach(spirit => {
    const dist = Math.sqrt((spirit.x - player.x) ** 2 + (spirit.z - player.z) ** 2);
    renderQueue.push({ type: 'spirit', entity: spirit, dist });
  });
  
  // Add exit portal
  if (gameState.exitPortal && gameState.exitPortal.active) {
    const dist = Math.sqrt((gameState.exitPortal.x - player.x) ** 2 + (gameState.exitPortal.z - player.z) ** 2);
    renderQueue.push({ type: 'portal', entity: gameState.exitPortal, dist });
  }
  
  // Sort by distance (far to near)
  renderQueue.sort((a, b) => b.dist - a.dist);
  
  // Render entities
  renderQueue.forEach(item => {
    if (item.type === 'clue') {
      renderClue(p, item.entity, player);
    } else if (item.type === 'spirit') {
      renderSpirit(p, item.entity, player);
    } else if (item.type === 'portal') {
      renderPortal(p, item.entity, player);
    }
  });
}

function renderDeck(p, player) {
  // Draw wooden deck planks in pseudo-3D
  const deckColor = [80, 70, 50];
  const plankColor = [70, 60, 45];
  
  // Draw base deck
  p.fill(...deckColor);
  p.noStroke();
  p.rect(0, CANVAS_HEIGHT * 0.6, CANVAS_WIDTH, CANVAS_HEIGHT * 0.4);
  
  // Draw deck planks
  p.stroke(...plankColor);
  p.strokeWeight(1);
  for (let i = 0; i < 20; i++) {
    const y = CANVAS_HEIGHT * 0.6 + i * 8;
    p.line(0, y, CANVAS_WIDTH, y);
  }
  p.noStroke();
  
  // Draw sky/fog
  for (let i = 0; i < CANVAS_HEIGHT * 0.6; i += 2) {
    const fogAmount = i / (CANVAS_HEIGHT * 0.6);
    const c = p.lerpColor(p.color(40, 50, 60), p.color(90, 100, 110), fogAmount);
    p.stroke(c);
    p.line(0, i, CANVAS_WIDTH, i);
  }
  p.noStroke();
  
  // Draw ship railings on sides
  p.fill(50, 45, 35);
  p.rect(0, CANVAS_HEIGHT * 0.55, 40, CANVAS_HEIGHT * 0.1);
  p.rect(CANVAS_WIDTH - 40, CANVAS_HEIGHT * 0.55, 40, CANVAS_HEIGHT * 0.1);
}

function renderClue(p, clue, player) {
  const pos = worldToScreen(p, clue.x, clue.y, clue.z, player);
  if (!pos) return;
  
  const dist = Math.sqrt((clue.x - player.x) ** 2 + (clue.z - player.z) ** 2);
  const size = 30 / (dist * 0.5 + 1);
  
  // Pulsing glow effect
  const pulseScale = 1 + Math.sin(clue.pulsePhase) * 0.2;
  
  p.push();
  p.translate(pos.x, pos.y);
  
  // Outer glow
  p.fill(200, 200, 100, 80);
  p.noStroke();
  p.ellipse(0, 0, size * pulseScale * 1.5, size * pulseScale * 1.5);
  
  // Inner core
  p.fill(255, 255, 150);
  p.ellipse(0, 0, size * pulseScale, size * pulseScale);
  
  // Highlight
  p.fill(255, 255, 200, 150);
  p.ellipse(-size * 0.15, -size * 0.15, size * 0.4, size * 0.4);
  
  p.pop();
  
  // Draw interaction hint if close
  if (player.canInteractWith(clue)) {
    p.textAlign(p.CENTER);
    p.fill(255, 255, 200);
    p.textSize(12);
    p.text("[SPACE] Examine", pos.x, pos.y + size + 10);
  }
}

function renderSpirit(p, spirit, player) {
  const pos = worldToScreen(p, spirit.x, spirit.y, spirit.z, player);
  if (!pos) return;
  
  const dist = Math.sqrt((spirit.x - player.x) ** 2 + (spirit.z - player.z) ** 2);
  const size = 60 / (dist * 0.5 + 1);
  
  p.push();
  p.translate(pos.x, pos.y);
  
  // Ghostly appearance
  const alpha = Math.max(50, 150 - dist * 10);
  
  // Outer glow
  p.fill(100, 100, 150, alpha * 0.3);
  p.noStroke();
  p.ellipse(0, 0, size * 1.8, size * 2.2);
  
  // Body
  p.fill(120, 120, 160, alpha);
  p.ellipse(0, 0, size * 1.2, size * 1.6);
  
  // Eyes (if chasing)
  if (spirit.isChasing) {
    p.fill(255, 100, 100, alpha);
    p.ellipse(-size * 0.2, -size * 0.15, size * 0.2, size * 0.2);
    p.ellipse(size * 0.2, -size * 0.15, size * 0.2, size * 0.2);
  } else {
    p.fill(150, 150, 180, alpha);
    p.ellipse(-size * 0.15, -size * 0.1, size * 0.15, size * 0.15);
    p.ellipse(size * 0.15, -size * 0.1, size * 0.15, size * 0.15);
  }
  
  // Wispy trails
  for (let i = 0; i < 3; i++) {
    const wispY = size * 0.6 + i * 8;
    const wispAlpha = alpha * (0.5 - i * 0.15);
    p.fill(100, 100, 140, wispAlpha);
    p.ellipse(0, wispY, size * (0.8 - i * 0.2), size * 0.4);
  }
  
  p.pop();
}

function renderPortal(p, portal, player) {
  const pos = worldToScreen(p, portal.x, portal.y + 1, portal.z, player);
  if (!pos) return;
  
  const dist = Math.sqrt((portal.x - player.x) ** 2 + (portal.z - player.z) ** 2);
  const size = 100 / (dist * 0.5 + 1);
  
  p.push();
  p.translate(pos.x, pos.y);
  p.rotate(portal.rotationPhase);
  
  // Swirling portal effect
  for (let i = 0; i < 5; i++) {
    const ringSize = size * (1 - i * 0.15);
    const ringAlpha = 100 - i * 15;
    p.fill(100, 150, 255, ringAlpha);
    p.noStroke();
    p.ellipse(0, 0, ringSize, ringSize);
    
    // Draw rotating segments
    p.stroke(150, 200, 255, ringAlpha);
    p.strokeWeight(2);
    p.noFill();
    const segments = 8;
    for (let j = 0; j < segments; j++) {
      const angle = (j / segments) * Math.PI * 2 + portal.rotationPhase * (i + 1);
      const x1 = Math.cos(angle) * ringSize * 0.3;
      const y1 = Math.sin(angle) * ringSize * 0.3;
      const x2 = Math.cos(angle) * ringSize * 0.5;
      const y2 = Math.sin(angle) * ringSize * 0.5;
      p.line(x1, y1, x2, y2);
    }
  }
  
  // Center core
  p.fill(200, 220, 255, 200);
  p.noStroke();
  p.ellipse(0, 0, size * 0.3, size * 0.3);
  
  p.pop();
  
  // Interaction hint
  if (player.canInteractWith(portal)) {
    p.textAlign(p.CENTER);
    p.fill(150, 200, 255);
    p.textSize(14);
    p.text("[SPACE] Escape", pos.x, pos.y + size * 0.8);
  }
}

function worldToScreen(p, worldX, worldY, worldZ, player) {
  // Convert world coordinates to screen coordinates (pseudo-3D)
  const dx = worldX - player.x;
  const dz = worldZ - player.z;
  
  // Rotate by player angle
  const rotatedX = dx * Math.sin(player.angle) + dz * Math.cos(player.angle);
  const rotatedZ = dz * Math.sin(player.angle) - dx * Math.cos(player.angle);
  
  // Check if behind player
  if (rotatedZ <= 0.5) return null;
  
  // Project to screen
  const scale = 300 / rotatedZ;
  const screenX = CANVAS_WIDTH / 2 + rotatedX * scale;
  const screenY = CANVAS_HEIGHT * 0.5 - (worldY - player.y) * scale;
  
  // Check if on screen
  if (screenX < -50 || screenX > CANVAS_WIDTH + 50) return null;
  if (screenY < -50 || screenY > CANVAS_HEIGHT + 50) return null;
  
  return { x: screenX, y: screenY };
}

function renderUI(p, gameState) {
  // Top bar with stats
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);
  
  // Clues counter
  p.textAlign(p.LEFT, p.TOP);
  p.fill(255, 255, 200);
  p.textSize(16);
  p.text("Clues: " + gameState.cluesFound + " / " + TOTAL_CLUES, 10, 10);
  
  // Sprint indicator
  if (gameState.player && gameState.player.isSprinting) {
    p.fill(255, 200, 100);
    p.text("SPRINT", 10, 30);
  }
  
  // Compass in top right
  renderCompass(p, gameState.player, CANVAS_WIDTH - 60, 30);
}

function renderCompass(p, player, x, y) {
  p.push();
  p.translate(x, y);
  
  // Background
  p.fill(40, 40, 50, 200);
  p.stroke(200, 200, 220);
  p.strokeWeight(2);
  p.ellipse(0, 0, 40, 40);
  
  // North indicator
  p.rotate(player.angle);
  p.fill(255, 100, 100);
  p.noStroke();
  p.triangle(0, -15, -4, -5, 4, -5);
  
  // South indicator
  p.fill(200, 200, 220);
  p.triangle(0, 15, -4, 5, 4, 5);
  
  p.pop();
  
  // N label
  p.textAlign(p.CENTER);
  p.fill(255, 255, 255);
  p.textSize(10);
  p.text("N", x, y - 25);
}