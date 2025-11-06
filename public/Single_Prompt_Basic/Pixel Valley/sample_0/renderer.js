import { TILE_SIZE, TILE_TYPES, CROP_STAGES, gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function renderGame(p) {
  p.background(50, 120, 50);
  
  // Render tiles and crops
  for (const tile of gameState.tiles) {
    renderTile(p, tile);
    
    if (tile.crop) {
      renderCrop(p, tile.crop);
    }
  }
  
  // Render tile highlighting
  renderTileHighlight(p);
  
  // Render bed
  renderBed(p, gameState.bed);
  
  // Render player
  renderPlayer(p, gameState.player);
  
  // Render UI
  renderUI(p);
  
  // Render exhaustion overlay
  if (gameState.isExhausted) {
    renderExhaustionOverlay(p);
  }
  
  // Render appropriate game phase screen
  switch (gameState.gamePhase) {
    case "START":
      renderStartScreen(p);
      break;
    case "PAUSED":
      renderPausedScreen(p);
      break;
    case "GAME_OVER_WIN":
      renderGameOverWinScreen(p);
      break;
    case "GAME_OVER_LOSE":
      renderGameOverLoseScreen(p);
      break;
  }
}

function renderTile(p, tile) {
  switch (tile.type) {
    case TILE_TYPES.GRASS:
      p.fill(50, 120, 50);
      break;
    case TILE_TYPES.TILLED:
      p.fill(139, 69, 19);
      break;
    case TILE_TYPES.PLANTED:
      p.fill(139, 69, 19);
      break;
    case TILE_TYPES.WATERED:
      p.fill(101, 67, 33);
      break;
  }
  
  p.stroke(0);
  p.strokeWeight(1);
  p.rect(tile.screenX, tile.screenY, TILE_SIZE, TILE_SIZE);
}

function renderTileHighlight(p) {
  if (!gameState.hoveredTile) return;
  
  const tileX = gameState.hoveredTile.x * TILE_SIZE;
  const tileY = gameState.hoveredTile.y * TILE_SIZE;
  
  // Draw highlight border
  p.stroke(255, 255, 100);
  p.strokeWeight(3);
  p.noFill();
  p.rect(tileX, tileY, TILE_SIZE, TILE_SIZE);
  
  // Draw subtle overlay
  p.fill(255, 255, 100, 30);
  p.noStroke();
  p.rect(tileX, tileY, TILE_SIZE, TILE_SIZE);
}

function renderCrop(p, crop) {
  p.push();
  
  switch (crop.stage) {
    case CROP_STAGES.SEED:
      p.fill(150, 75, 0);
      p.ellipse(crop.screenX + TILE_SIZE / 2, crop.screenY + TILE_SIZE / 2, 5, 5);
      break;
    case CROP_STAGES.SPROUT:
      p.fill(0, 200, 0);
      p.rect(crop.screenX + TILE_SIZE / 2 - 2, crop.screenY + TILE_SIZE / 2 - 5, 4, 10);
      p.ellipse(crop.screenX + TILE_SIZE / 2, crop.screenY + TILE_SIZE / 2 - 8, 8, 4);
      break;
    case CROP_STAGES.GROWING:
      p.fill(0, 180, 0);
      p.rect(crop.screenX + TILE_SIZE / 2 - 2, crop.screenY + TILE_SIZE / 2 - 10, 4, 20);
      p.ellipse(crop.screenX + TILE_SIZE / 2 - 5, crop.screenY + TILE_SIZE / 2 - 8, 8, 4);
      p.ellipse(crop.screenX + TILE_SIZE / 2 + 5, crop.screenY + TILE_SIZE / 2 - 10, 8, 4);
      break;
    case CROP_STAGES.READY:
      p.fill(0, 160, 0);
      p.rect(crop.screenX + TILE_SIZE / 2 - 2, crop.screenY + TILE_SIZE / 2 - 15, 4, 30);
      
      p.fill(255, 50, 50);
      p.ellipse(crop.screenX + TILE_SIZE / 2 - 8, crop.screenY + TILE_SIZE / 2 - 10, 10, 10);
      p.ellipse(crop.screenX + TILE_SIZE / 2 + 8, crop.screenY + TILE_SIZE / 2 - 12, 10, 10);
      p.ellipse(crop.screenX + TILE_SIZE / 2, crop.screenY + TILE_SIZE / 2 - 5, 10, 10);
      break;
  }
  
  p.pop();
}

function renderPlayer(p, player) {
  // Draw player with transparency if exhausted
  if (gameState.isExhausted) {
    p.tint(255, 150);
  }
  
  p.fill(player.color[0], player.color[1], player.color[2]);
  p.stroke(0);
  p.strokeWeight(2);
  p.rect(player.x, player.y, player.width, player.height);
  
  // Draw tool indicator
  p.push();
  p.translate(player.x + player.width / 2, player.y + player.height / 2);
  
  switch (gameState.currentTool) {
    case 0: // Hoe
      p.stroke(150, 75, 0);
      p.strokeWeight(3);
      p.line(0, 0, 15, 15);
      break;
    case 1: // Seeds
      p.fill(150, 75, 0);
      p.noStroke();
      p.ellipse(10, 10, 6, 6);
      p.ellipse(5, 8, 4, 4);
      p.ellipse(8, 3, 5, 5);
      break;
    case 2: // Watering can
      p.fill(100, 100, 200);
      p.noStroke();
      p.rect(5, 5, 10, 8);
      p.rect(15, 7, 4, 4);
      break;
  }
  
  p.pop();
  p.noTint();
}

function renderBed(p, bed) {
  p.fill(150, 75, 0);
  p.stroke(0);
  p.strokeWeight(1);
  p.rect(bed.screenX, bed.screenY, bed.width, bed.height);
  
  p.fill(200, 200, 255);
  p.rect(bed.screenX + 5, bed.screenY + 5, bed.width - 10, bed.height - 10);
}

function renderExhaustionOverlay(p) {
  // Pulsing red overlay to indicate exhaustion
  const alpha = 50 + 30 * Math.sin(gameState.autoSleepTimer * 0.2);
  p.fill(255, 0, 0, alpha);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Display exhaustion message
  p.fill(255);
  p.textSize(20);
  p.textAlign(p.CENTER);
  p.text("EXHAUSTED! Find a bed to sleep!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  // Show countdown
  const timeLeft = Math.ceil(gameState.autoSleepTimer / 60);
  p.textSize(16);
  p.text(`Auto-sleep in: ${timeLeft}s`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
}

function renderUI(p) {
  // Background for UI
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 30);
  
  // Day counter
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.LEFT);
  p.text(`Day: ${gameState.day}`, 10, 20);
  
  // Gold counter with progress
  p.fill(255, 215, 0);
  p.text(`Gold: ${gameState.gold}/500`, 100, 20);
  
  // Energy bar
  p.fill(255);
  p.text(`Energy: `, 200, 20);
  p.noFill();
  p.stroke(255);
  p.rect(260, 10, 100, 10);
  
  p.noStroke();
  const energyPercent = gameState.energy / gameState.maxEnergy;
  const energyColor = gameState.isExhausted ? [255, 0, 0] : [255, 100 * (1 - energyPercent), 100 * (1 - energyPercent)];
  p.fill(energyColor[0], energyColor[1], energyColor[2]);
  p.rect(260, 10, 100 * energyPercent, 10);
  
  // Current tool
  p.fill(255);
  p.textAlign(p.RIGHT);
  p.text(`Tool: ${gameState.tools[gameState.currentTool]}`, CANVAS_WIDTH - 10, 20);
  
  // Render helpful hints
  renderGameplayHints(p);
}

function renderGameplayHints(p) {
  // Only show hints during actual gameplay
  if (gameState.gamePhase !== "PLAYING") return;
  
  const playerTile = gameState.player.getCurrentTile();
  const currentTile = gameState.tiles.find(t => t.x === playerTile.x && t.y === playerTile.y);
  
  // Hint background
  p.fill(0, 0, 0, 120);
  p.noStroke();
  p.rect(10, CANVAS_HEIGHT - 50, CANVAS_WIDTH - 20, 40);
  
  p.fill(255);
  p.textAlign(p.LEFT);
  p.textSize(12);
  
  let hint = "";
  
  // Check if near bed
  const bed = gameState.bed;
  if ((playerTile.x === bed.x || playerTile.x === bed.x + 1) && playerTile.y === bed.y) {
    hint = "💤 Press Z or S to sleep and advance to the next day";
  }
  // Check current tile and tool for contextual hints
  else if (currentTile) {
    switch (gameState.currentTool) {
      case 0: // HOE
        if (currentTile.type === 0) { // GRASS
          hint = "🔨 Press Z to till this soil (costs 5 energy)";
        } else {
          hint = "🔨 HOE: Use on grass tiles to prepare for planting • Press SPACE to switch tools";
        }
        break;
      case 1: // SEEDS
        if (currentTile.type === 1 && !currentTile.crop && gameState.gold >= gameState.seedPrice) { // TILLED, no crop
          hint = "🌱 Press Z to plant seeds here (costs 10 gold, 3 energy)";
        } else if (gameState.gold < gameState.seedPrice) {
          hint = "🌱 SEEDS: Need more gold to buy seeds! Current: " + gameState.gold + ", Need: " + gameState.seedPrice;
        } else {
          hint = "🌱 SEEDS: Use on tilled (brown) soil to plant crops • Press SPACE to switch tools";
        }
        break;
      case 2: // WATERING_CAN
        if ((currentTile.type === 1 || currentTile.type === 2) && currentTile.type !== 3) { // TILLED or PLANTED, not watered
          hint = "💧 Press Z to water this tile (costs 2 energy)";
        } else {
          hint = "💧 WATERING CAN: Use on planted crops to help them grow • Press SPACE to switch tools";
        }
        break;
    }
    
    // Override with harvest hint if crop is ready
    if (currentTile.crop && currentTile.crop.stage === 3) {
      hint = "🌾 Press Z to harvest this crop! (earn 40 gold, costs 4 energy)";
    }
  }
  
  // Energy warnings
  if (gameState.energy <= 20 && gameState.energy > 0) {
    hint = "⚡ Low energy! Find the bed (blue rectangle) to sleep and restore energy";
  }
  
  // Default hint if none specific
  if (!hint) {
    hint = "🎮 Arrow keys to move • SPACE to switch tools • Z to interact • Yellow highlight shows current tile";
  }
  
  p.text(hint, 15, CANVAS_HEIGHT - 25);
}

function renderStartScreen(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textSize(32);
  p.textAlign(p.CENTER);
  p.text("Pixel Valley", CANVAS_WIDTH / 2, 60);
  
  p.textSize(14);
  p.text("Grow crops and earn money to build your farm", CANVAS_WIDTH / 2, 100);
  p.fill(255, 215, 0);
  p.textSize(16);
  p.text("Goal: Reach 500 gold to win!", CANVAS_WIDTH / 2, 125);
  
  // Controls section
  p.fill(200, 255, 200);
  p.textSize(18);
  p.text("CONTROLS", CANVAS_WIDTH / 2, 165);
  
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT);
  const leftCol = CANVAS_WIDTH / 2 - 120;
  const rightCol = CANVAS_WIDTH / 2 + 20;
  
  p.text("Arrow Keys - Move", leftCol, 190);
  p.text("SPACE - Switch Tools", rightCol, 190);
  p.text("Z - Interact", leftCol, 210);
  p.text("S - Sleep (at bed)", rightCol, 210);
  p.text("ESC - Pause", leftCol, 230);
  p.text("R - Restart", rightCol, 230);
  
  // Tips section
  p.fill(150, 200, 255);
  p.textAlign(p.CENTER);
  p.textSize(16);
  p.text("TIPS", CANVAS_WIDTH / 2, 265);
  
  p.fill(255);
  p.textSize(12);
  p.text("• Use the HOE to till soil, then plant SEEDS", CANVAS_WIDTH / 2, 285);
  p.text("• Water crops daily to help them grow", CANVAS_WIDTH / 2, 300);
  p.text("• Sleep in the bed (blue rectangle) to restore energy", CANVAS_WIDTH / 2, 315);
  p.text("• Highlighted tiles show where you can interact", CANVAS_WIDTH / 2, 330);
  
  p.fill(100, 255, 100);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

function renderPausedScreen(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textSize(24);
  p.textAlign(p.CENTER);
  p.text("GAME PAUSED", CANVAS_WIDTH / 2, 150);
  
  p.textSize(14);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, 180);
  
  // Quick reference
  p.fill(200, 200, 255);
  p.textSize(16);
  p.text("QUICK REFERENCE", CANVAS_WIDTH / 2, 220);
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT);
  const leftCol = CANVAS_WIDTH / 2 - 100;
  const rightCol = CANVAS_WIDTH / 2 + 20;
  
  p.text("Tools: HOE → SEEDS → WATER", leftCol, 245);
  p.text("Farming: Till → Plant → Water → Harvest", leftCol, 265);
  p.text("Energy: Sleep in bed to restore", leftCol, 285);
  p.text("Goal: Earn 500 gold to win!", leftCol, 305);
}

function renderGameOverWinScreen(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 215, 0);
  p.textSize(32);
  p.textAlign(p.CENTER);
  p.text("You Win!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
  
  p.fill(255);
  p.textSize(18);
  p.text(`You've earned ${gameState.gold} gold in ${gameState.day} days!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.text("Your farm is flourishing!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT * 2 / 3);
}

function renderGameOverLoseScreen(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 100, 100);
  p.textSize(32);
  p.textAlign(p.CENTER);
  p.text("Game Over", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
  
  p.fill(255);
  p.textSize(18);
  p.text(`You've earned ${gameState.gold} gold in ${gameState.day} days`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.text("Better luck next time!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT * 2 / 3);
}