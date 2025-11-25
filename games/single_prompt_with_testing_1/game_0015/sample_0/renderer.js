// renderer.js - Rendering functions

import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, GAME_PHASES } from './globals.js';

export function renderWorld(p, player) {
  // Draw floor and ceiling with perspective
  drawFloorCeiling(p, player);

  // Draw walls with 3D perspective
  drawWalls(p, player);

  // Draw ambient entities
  for (let entity of gameState.entities) {
    entity.draw(p, player);
  }

  // Draw interactables
  for (let obj of gameState.interactables) {
    obj.draw(p, player);
  }

  // Apply vignette and atmosphere
  applyAtmosphereEffects(p);
}

function drawFloorCeiling(p, player) {
  // Gradient floor
  for (let i = 0; i < p.height / 2; i++) {
    const t = i / (p.height / 2);
    const darkness = 20 + t * 30;
    p.stroke(darkness, darkness - 5, darkness + 5);
    p.line(0, p.height / 2 + i, p.width, p.height / 2 + i);
  }

  // Gradient ceiling
  for (let i = 0; i < p.height / 2; i++) {
    const t = i / (p.height / 2);
    const darkness = 15 + t * 25;
    p.stroke(darkness - 5, darkness - 5, darkness);
    p.line(0, p.height / 2 - i, p.width, p.height / 2 - i);
  }
}

function drawWalls(p, player) {
  for (let wall of gameState.walls) {
    // Draw wall corners
    const corners = [
      { x: wall.x1, z: wall.z1 },
      { x: wall.x2, z: wall.z1 },
      { x: wall.x2, z: wall.z2 },
      { x: wall.x1, z: wall.z2 }
    ];

    // Project corners to screen
    const projectedCorners = corners.map(corner => {
      const dx = corner.x - player.x;
      const dz = corner.z - player.z;
      
      const rotatedX = dx * Math.cos(-player.angle) - dz * Math.sin(-player.angle);
      const rotatedZ = dx * Math.sin(-player.angle) + dz * Math.cos(-player.angle);

      if (rotatedZ < 1) return null;

      const scale = 300 / rotatedZ;
      const screenX = p.width / 2 + rotatedX * scale;
      const screenYTop = p.height / 2 - wall.height * scale + Math.sin(player.bobOffset) * 3;
      const screenYBottom = p.height / 2 + Math.sin(player.bobOffset) * 3;

      return { screenX, screenYTop, screenYBottom, depth: rotatedZ };
    });

    // Draw wall segments
    for (let i = 0; i < 4; i++) {
      const next = (i + 1) % 4;
      if (!projectedCorners[i] || !projectedCorners[next]) continue;

      const c1 = projectedCorners[i];
      const c2 = projectedCorners[next];

      // Calculate lighting based on distance
      const avgDepth = (c1.depth + c2.depth) / 2;
      const brightness = Math.max(0, Math.min(255, 400 / avgDepth));
      
      // Flashlight effect
      let flashlightBoost = 0;
      if (gameState.flashlightOn) {
        flashlightBoost = 50;
      }

      p.fill(brightness + flashlightBoost, brightness * 0.9 + flashlightBoost, brightness * 0.8 + flashlightBoost);
      p.stroke(brightness * 0.5, brightness * 0.4, brightness * 0.3);
      p.strokeWeight(1);

      // Draw wall segment as quad
      p.beginShape();
      p.vertex(c1.screenX, c1.screenYTop);
      p.vertex(c2.screenX, c2.screenYTop);
      p.vertex(c2.screenX, c2.screenYBottom);
      p.vertex(c1.screenX, c1.screenYBottom);
      p.endShape(p.CLOSE);
    }
  }
}

function applyAtmosphereEffects(p) {
  // Vignette
  p.push();
  p.noStroke();
  const vignetteSize = 200;
  for (let i = 0; i < vignetteSize; i++) {
    const alpha = (i / vignetteSize) * 150 * (0.5 + gameState.atmosphereIntensity * 0.5);
    p.fill(0, 0, 0, alpha / vignetteSize);
    p.rect(0, 0, p.width, i);
    p.rect(0, p.height - i, p.width, i);
    p.rect(0, 0, i, p.height);
    p.rect(p.width - i, 0, i, p.height);
  }
  p.pop();

  // Flashlight cone effect
  if (gameState.flashlightOn) {
    p.push();
    p.fill(255, 255, 200, 30);
    p.noStroke();
    p.ellipse(p.width / 2, p.height / 2, 300, 400);
    p.pop();
  }
}

export function renderUI(p, player) {
  p.push();
  p.textAlign(p.LEFT, p.TOP);
  p.fill(200, 200, 200);
  p.textSize(14);
  p.noStroke();

  // Score and clues
  p.text(`Score: ${gameState.score}`, 10, 10);
  p.text(`Clues: ${gameState.cluesCollected}/${gameState.totalClues}`, 10, 30);
  
  // Flashlight indicator
  if (gameState.flashlightOn) {
    p.fill(255, 255, 150);
    p.text("Flashlight: ON", 10, 50);
  } else {
    p.fill(100, 100, 100);
    p.text("Flashlight: OFF", 10, 50);
  }

  // Nearby object prompt
  if (gameState.nearbyObject) {
    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    p.fill(255, 255, 150);
    p.textSize(16);
    p.text(`[SPACE] ${gameState.nearbyObject.name}`, p.width / 2, p.height - 40);
    p.pop();
  }

  // Messages
  let messageY = p.height / 2 - 60;
  for (let msg of gameState.messageQueue) {
    p.push();
    p.textAlign(p.CENTER, p.CENTER);
    const alpha = Math.min(255, msg.duration * 2);
    p.fill(...msg.color, alpha);
    p.textSize(18);
    p.text(msg.text, p.width / 2, messageY);
    messageY += 30;
    p.pop();
  }

  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.push();
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(255, 255, 150);
    p.textSize(14);
    p.text("PAUSED", p.width - 10, 10);
    p.pop();
  }

  p.pop();
}

export function renderStartScreen(p) {
  p.background(10, 10, 15);
  
  // Title with glitch effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Shadow/glitch layers
  p.fill(100, 0, 0, 100);
  p.textSize(48);
  p.text("Du bist der Einzige hier", p.width / 2 + 2, p.height / 2 - 120 + 2);
  
  p.fill(255, 50, 50);
  p.textSize(48);
  p.text("Du bist der Einzige hier", p.width / 2, p.height / 2 - 120);

  // Subtitle
  p.fill(150, 150, 200);
  p.textSize(16);
  p.text("You Are The Only One Here", p.width / 2, p.height / 2 - 70);

  // Instructions
  p.textAlign(p.CENTER, p.TOP);
  p.fill(200, 200, 200);
  p.textSize(14);
  const instructions = [
    "Navigate a surreal dreamscape of memories and nightmares",
    "Collect 5 clues to unlock the true escape",
    "",
    "Arrow Keys - Move and Turn",
    "SPACE - Interact with objects",
    "SHIFT - Sprint",
    "Z - Toggle flashlight",
    "",
    "Find the clues... discover the truth... escape..."
  ];
  
  let y = p.height / 2 - 30;
  for (let line of instructions) {
    p.text(line, p.width / 2, y);
    y += 22;
  }

  // Pulse effect on start prompt
  const pulse = Math.sin(p.frameCount * 0.05) * 0.3 + 0.7;
  p.fill(255, 255, 150, 255 * pulse);
  p.textSize(18);
  p.text("PRESS ENTER TO START", p.width / 2, p.height - 40);
  
  p.pop();
}

export function renderGameOverScreen(p) {
  p.background(0, 0, 0, 200);
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    // Win screen
    p.fill(100, 255, 100);
    p.textSize(48);
    p.text("YOU ESCAPED", p.width / 2, p.height / 2 - 80);
    
    p.fill(200, 255, 200);
    p.textSize(18);
    p.text("You found all the clues and discovered the truth", p.width / 2, p.height / 2 - 30);
    p.text("The nightmare is over... or is it?", p.width / 2, p.height / 2);
  } else {
    // Lose screen (if implemented)
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("CONSUMED", p.width / 2, p.height / 2 - 80);
    
    p.fill(255, 200, 200);
    p.textSize(18);
    p.text("The darkness took you", p.width / 2, p.height / 2 - 30);
  }
  
  // Score
  p.fill(255, 255, 255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, p.width / 2, p.height / 2 + 50);
  
  // Restart prompt
  const pulse = Math.sin(p.frameCount * 0.05) * 0.3 + 0.7;
  p.fill(255, 255, 150, 255 * pulse);
  p.textSize(18);
  p.text("PRESS R TO RESTART", p.width / 2, p.height - 40);
  
  p.pop();
}