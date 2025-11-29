// rendering.js - Rendering functions

import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT, ENTITY_TYPES } from './globals.js';

export function renderGame(p) {
  p.background(20, 30, 50);
  
  switch (gameState.gamePhase) {
    case GAME_PHASES.START:
      renderStartScreen(p);
      break;
    case GAME_PHASES.PLAYING:
    case GAME_PHASES.PAUSED:
      renderGameplay(p);
      if (gameState.gamePhase === GAME_PHASES.PAUSED) {
        renderPauseOverlay(p);
      }
      break;
    case GAME_PHASES.GAME_OVER_WIN:
    case GAME_PHASES.GAME_OVER_LOSE:
      renderGameplay(p);
      renderGameOverScreen(p);
      break;
  }
}

function renderStartScreen(p) {
  p.background(10, 20, 40);
  
  // Animated background
  for (let i = 0; i < 50; i++) {
    p.fill(100, 150, 200, 30);
    p.noStroke();
    const x = (i * 50 + p.frameCount * 0.5) % (CANVAS_WIDTH + 100) - 50;
    const y = (i * 30) % CANVAS_HEIGHT;
    p.ellipse(x, y, 20, 20);
  }
  
  // Title
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(100, 200, 255);
  p.textSize(48);
  p.text("SUBNAUTICA", CANVAS_WIDTH / 2, 60);
  p.textSize(32);
  p.text("Below Zero", CANVAS_WIDTH / 2, 100);
  
  // Description
  p.textSize(14);
  p.fill(200, 220, 255);
  p.text("Explore the frozen depths of Planet 4546B", CANVAS_WIDTH / 2, 150);
  p.text("Collect resources, build habitats, and find alien artifacts", CANVAS_WIDTH / 2, 170);
  p.text("Manage your oxygen and temperature to survive", CANVAS_WIDTH / 2, 190);
  
  // Instructions
  p.fill(150, 200, 255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  const instructX = 80;
  p.text("Arrow Keys: Move", instructX, 230);
  p.text("Space: Collect resources/artifacts", instructX, 250);
  p.text("Shift: Sprint (uses more oxygen)", instructX, 270);
  p.text("Z: Build habitat (2 Titanium, 1 Copper, 1 Quartz)", instructX, 290);
  
  // Objectives
  p.fill(255, 200, 100);
  p.textSize(13);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("OBJECTIVE: Collect all 3 alien artifacts to win", CANVAS_WIDTH / 2, 330);
  p.text("Avoid the Shadow Leviathans!", CANVAS_WIDTH / 2, 350);
  
  // Start prompt
  p.fill(100, 255, 150);
  p.textSize(20);
  const alpha = 150 + p.sin(p.frameCount * 0.1) * 100;
  p.fill(100, 255, 150, alpha);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 380);
}

function renderGameplay(p) {
  const cameraX = gameState.camera.x;
  const cameraY = gameState.camera.y;
  
  // Render biomes
  gameState.biomes.forEach(biome => {
    biome.render(p, cameraX, cameraY);
  });
  
  // Render entities (back to front)
  const sortedEntities = [...gameState.entities].sort((a, b) => {
    if (a.type === ENTITY_TYPES.PLAYER) return 1;
    if (b.type === ENTITY_TYPES.PLAYER) return -1;
    return a.y - b.y;
  });
  
  sortedEntities.forEach(entity => {
    if (entity.active) {
      entity.render(p, cameraX, cameraY);
    }
  });
  
  // UI
  renderUI(p);
}

function renderUI(p) {
  // Background panel
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 80);
  
  const player = gameState.player;
  
  // Oxygen bar
  p.fill(50, 50, 50);
  p.rect(10, 10, 200, 20, 5);
  const oxygenColor = player.oxygen > 30 ? [100, 200, 255] : [255, 100, 100];
  p.fill(...oxygenColor);
  p.rect(10, 10, (player.oxygen / player.maxOxygen) * 200, 20, 5);
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text("OXYGEN", 10, 40);
  
  // Temperature bar
  p.fill(50, 50, 50);
  p.rect(10, 50, 200, 20, 5);
  const tempColor = player.temperature > 30 ? [255, 150, 100] : [100, 150, 255];
  p.fill(...tempColor);
  p.rect(10, 50, (player.temperature / player.maxTemperature) * 200, 20, 5);
  p.fill(255);
  p.text("TEMPERATURE", 220, 60);
  
  // Resources
  p.textAlign(p.RIGHT, p.CENTER);
  p.fill(180, 180, 200);
  p.text(`Titanium: ${gameState.resources.TITANIUM}`, CANVAS_WIDTH - 10, 20);
  p.fill(255, 150, 50);
  p.text(`Copper: ${gameState.resources.COPPER}`, CANVAS_WIDTH - 10, 35);
  p.fill(200, 220, 255);
  p.text(`Quartz: ${gameState.resources.QUARTZ}`, CANVAS_WIDTH - 10, 50);
  
  // Score and artifacts
  p.fill(100, 255, 150);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 5);
  p.fill(150, 255, 220);
  p.text(`Artifacts: ${gameState.artifactsCollected}/${gameState.totalArtifacts}`, CANVAS_WIDTH / 2, 15);
  
  // Biome name
  const currentBiome = player.getCurrentBiome(gameState);
  if (currentBiome) {
    p.fill(200, 230, 255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(currentBiome.type.replace(/_/g, ' '), CANVAS_WIDTH / 2, 40);
  }
}

function renderPauseOverlay(p) {
  p.fill(0, 0, 0, 100);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textSize(20);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function renderGameOverScreen(p) {
  p.fill(0, 0, 0, 180);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.fill(100, 255, 150);
    p.textSize(48);
    p.text("MISSION COMPLETE", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    p.textSize(20);
    p.fill(200, 255, 200);
    p.text("You discovered the truth about Planet 4546B", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.text("MISSION FAILED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
    p.textSize(20);
    p.fill(255, 200, 200);
    const reason = gameState.player.oxygen <= 0 ? "Oxygen depleted" : "Temperature critical";
    p.text(reason, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
  
  p.fill(200, 200, 255);
  p.textSize(16);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  p.text(`Artifacts Collected: ${gameState.artifactsCollected}/${gameState.totalArtifacts}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
  
  p.fill(150, 200, 255);
  p.textSize(18);
  const alpha = 150 + p.sin(p.frameCount * 0.1) * 100;
  p.fill(150, 200, 255, alpha);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
}