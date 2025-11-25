// gameLogic.js - Core game logic and state management
import { gameState, GAME_PHASES, STORY_DATA, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Player } from './player.js';
import { MemoryOrb } from './memoryOrb.js';
import { TemporalDistortion } from './temporalDistortion.js';
import { StoryDisplay } from './storyDisplay.js';

export function initializeGame(p) {
  // Reset game state
  gameState.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
  gameState.entities = [gameState.player];
  gameState.memoryOrbs = [];
  gameState.temporalDistortions = [];
  gameState.score = 0;
  gameState.orbsCollected = 0;
  gameState.currentLayer = 1;
  gameState.memoryIntegrity = 100;
  gameState.storyFragments = [];
  gameState.currentStoryIndex = 0;
  gameState.temporalStabilizerActive = false;
  gameState.temporalStabilizerCooldown = 0;
  gameState.framesSinceLastOrb = 0;
  gameState.totalGameFrames = 0;

  // Create story display
  gameState.storyDisplay = new StoryDisplay();

  // Spawn initial memory layer
  spawnMemoryLayer(1, p);
}

export function spawnMemoryLayer(layer, p) {
  const layerData = STORY_DATA.find(f => f.layer === layer);
  if (!layerData) return;

  // Clear old orbs and distortions
  gameState.memoryOrbs = [];
  gameState.temporalDistortions = [];

  // Spawn memory orbs for this layer
  for (let i = 0; i < layerData.orbs; i++) {
    const x = 50 + (i % 4) * 130 + p.random(-20, 20);
    const y = 60 + Math.floor(i / 4) * 80 + p.random(-20, 20);
    gameState.memoryOrbs.push(new MemoryOrb(x, y, layer));
  }

  // Spawn temporal distortions (increases with layer)
  const distortionCount = layer + 1;
  for (let i = 0; i < distortionCount; i++) {
    const x = p.random(80, CANVAS_WIDTH - 80);
    const y = p.random(80, CANVAS_HEIGHT - 80);
    const types = ['static', 'moving', 'expanding'];
    const type = types[Math.floor(p.random(types.length))];
    gameState.temporalDistortions.push(new TemporalDistortion(x, y, type));
  }

  // Show story fragment
  gameState.storyDisplay.showStoryFragment(layer);
}

export function updateGame(p, keys) {
  gameState.totalGameFrames++;
  gameState.framesSinceLastOrb++;

  // Update player
  gameState.player.update(keys);

  // Update temporal stabilizer
  if (gameState.temporalStabilizerActive) {
    gameState.temporalStabilizerCooldown = 120; // 2 second cooldown after use
    gameState.temporalStabilizerActive = false;
  }
  if (gameState.temporalStabilizerCooldown > 0) {
    gameState.temporalStabilizerCooldown--;
  }

  // Activate temporal stabilizer
  if (keys.z && gameState.temporalStabilizerCooldown === 0) {
    gameState.temporalStabilizerActive = true;
  }

  // Update memory orbs
  gameState.memoryOrbs.forEach(orb => {
    orb.update();
    if (orb.checkCollection(gameState.player, p)) {
      // Check if layer is complete
      const layerData = STORY_DATA.find(f => f.layer === gameState.currentLayer);
      const orbsInLayer = gameState.memoryOrbs.filter(o => o.layer === gameState.currentLayer);
      const collectedInLayer = orbsInLayer.filter(o => o.collected).length;
      
      if (collectedInLayer >= layerData.orbs) {
        // Move to next layer
        gameState.currentLayer++;
        if (gameState.currentLayer > gameState.maxLayers) {
          // Win condition
          gameState.gamePhase = GAME_PHASES.GAME_OVER_WIN;
        } else {
          spawnMemoryLayer(gameState.currentLayer, p);
        }
      }
    }
  });

  // Update temporal distortions
  gameState.temporalDistortions.forEach(distortion => {
    distortion.update();
    distortion.checkCollision(gameState.player, p);
  });

  // Update story display
  gameState.storyDisplay.update();

  // Check lose condition
  if (gameState.memoryIntegrity <= 0) {
    gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
  }

  // Prevent stalling - if no orbs collected in 20 seconds in test mode
  if (gameState.controlMode !== 'HUMAN' && gameState.framesSinceLastOrb > 1200) {
    // Help AI by respawning layer
    spawnMemoryLayer(gameState.currentLayer, p);
    gameState.framesSinceLastOrb = 0;
  }
}

export function drawGame(p) {
  // Background - memory space
  const bgColor = [10, 15, 30];
  p.background(...bgColor);

  // Draw memory grid
  p.push();
  p.stroke(50, 70, 100, 100);
  p.strokeWeight(1);
  for (let x = 0; x < CANVAS_WIDTH; x += 40) {
    p.line(x, 0, x, CANVAS_HEIGHT);
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
    p.line(0, y, CANVAS_WIDTH, y);
  }
  p.pop();

  // Draw temporal distortions
  gameState.temporalDistortions.forEach(distortion => distortion.draw(p));

  // Draw memory orbs
  gameState.memoryOrbs.forEach(orb => orb.draw(p));

  // Draw player
  gameState.player.draw(p);

  // Draw UI
  drawUI(p);

  // Draw story display
  gameState.storyDisplay.draw(p);
}

function drawUI(p) {
  p.push();
  
  // Top bar background
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 50);

  // Memory Integrity bar
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Memory Integrity:", 10, 10);
  
  // Integrity bar
  const barWidth = 150;
  const barHeight = 15;
  p.stroke(100);
  p.strokeWeight(2);
  p.noFill();
  p.rect(10, 25, barWidth, barHeight);
  
  const integrityPercent = Math.max(0, gameState.memoryIntegrity) / 100;
  const barColor = integrityPercent > 0.5 ? [100, 255, 150] : integrityPercent > 0.25 ? [255, 200, 100] : [255, 100, 100];
  p.fill(...barColor);
  p.noStroke();
  p.rect(10, 25, barWidth * integrityPercent, barHeight);

  // Layer info
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(14);
  p.text(`Memory Layer: ${gameState.currentLayer}/${gameState.maxLayers}`, CANVAS_WIDTH / 2, 12);

  // Orbs collected in current layer
  const layerData = STORY_DATA.find(f => f.layer === gameState.currentLayer);
  if (layerData) {
    const orbsInLayer = gameState.memoryOrbs.filter(o => o.layer === gameState.currentLayer);
    const collectedInLayer = orbsInLayer.filter(o => o.collected).length;
    p.textSize(12);
    p.text(`Orbs: ${collectedInLayer}/${layerData.orbs}`, CANVAS_WIDTH / 2, 30);
  }

  // Score
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);

  // Temporal Stabilizer status
  p.textAlign(p.RIGHT, p.TOP);
  if (gameState.temporalStabilizerCooldown > 0) {
    p.fill(150, 150, 150);
    p.text(`Stabilizer: ${Math.ceil(gameState.temporalStabilizerCooldown / 60)}s`, CANVAS_WIDTH - 10, 25);
  } else {
    p.fill(100, 255, 150);
    p.text("Stabilizer: READY (Z)", CANVAS_WIDTH - 10, 25);
  }

  p.pop();
}

export function drawStartScreen(p) {
  p.background(10, 15, 30);

  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  
  // Title glow
  p.fill(100, 150, 255, 50);
  p.textSize(48);
  p.text("TO THE MOON", p.width / 2, 80);
  
  // Title
  p.fill(220, 240, 255);
  p.textSize(44);
  p.text("TO THE MOON", p.width / 2, 80);

  // Subtitle
  p.fill(150, 180, 220);
  p.textSize(16);
  p.text("A Memory Traversal Experience", p.width / 2, 120);

  // Instructions box
  p.fill(20, 30, 50, 200);
  p.rect(50, 160, p.width - 100, 180, 8);

  // Instructions
  p.fill(200, 220, 255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "OBJECTIVE:",
    "Journey through Johnny's fading memories, collecting orbs",
    "to unlock deeper layers of his past. Discover why his final",
    "wish is to go to the moon.",
    "",
    "CONTROLS:",
    "Arrow Keys - Move through memory spaces",
    "Space - Interact with memory fragments",
    "Z - Temporal Stabilizer (slows distortions)",
    "Shift - Sprint",
    "",
    "Avoid temporal distortions that corrupt memories!"
  ];
  
  let yPos = 175;
  instructions.forEach(line => {
    p.text(line, 70, yPos);
    yPos += 18;
  });

  // Start prompt
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const blinkAlpha = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(100, 200, 255, 150 + blinkAlpha * 105);
  p.text("PRESS ENTER TO START", p.width / 2, 370);

  p.pop();
}

export function drawPauseOverlay(p) {
  p.push();
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, p.width, p.height);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text("PAUSED", p.width - 10, 10);
  p.pop();
}

export function drawGameOverScreen(p, isWin) {
  p.background(10, 15, 30);

  p.push();
  p.textAlign(p.CENTER, p.CENTER);

  if (isWin) {
    // Win screen
    p.fill(100, 255, 150);
    p.textSize(48);
    p.text("MISSION COMPLETE", p.width / 2, 100);

    p.fill(200, 230, 255);
    p.textSize(18);
    p.text("Johnny's wish has been fulfilled.", p.width / 2, 160);
    p.text("He can finally go to the moon...", p.width / 2, 190);
    p.text("...with River.", p.width / 2, 220);

    // Moon
    p.fill(240, 240, 220);
    p.noStroke();
    p.ellipse(p.width / 2, 280, 60, 60);
    p.fill(220, 220, 200);
    p.ellipse(p.width / 2 - 10, 275, 12, 12);
    p.ellipse(p.width / 2 + 8, 285, 15, 15);
  } else {
    // Lose screen
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("MEMORY CORRUPTED", p.width / 2, 120);

    p.fill(200, 200, 200);
    p.textSize(18);
    p.text("The memories have been lost to time.", p.width / 2, 180);
    p.text("Johnny's wish remains unfulfilled.", p.width / 2, 210);
  }

  // Score
  p.fill(255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, p.width / 2, 280);
  p.text(`Layers Completed: ${gameState.currentLayer - 1}/${gameState.maxLayers}`, p.width / 2, 310);

  // Restart prompt
  p.fill(150, 200, 255);
  p.textSize(18);
  p.text("PRESS R TO RESTART", p.width / 2, 360);

  p.pop();
}