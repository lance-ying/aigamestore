import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, BLOCK_SIZE, BLOCK_COLORS, BLOCK_TYPES } from './globals.js';
import { getAvailableRecipes, canCraft } from './crafting.js';

export function renderWorld(p) {
  const startX = Math.floor(gameState.camera.x / BLOCK_SIZE);
  const endX = Math.ceil((gameState.camera.x + CANVAS_WIDTH) / BLOCK_SIZE);
  const startY = Math.floor(gameState.camera.y / BLOCK_SIZE);
  const endY = Math.ceil((gameState.camera.y + CANVAS_HEIGHT) / BLOCK_SIZE);
  
  for (let x = Math.max(0, startX); x < Math.min(gameState.blocks.length, endX); x++) {
    for (let y = Math.max(0, startY); y < Math.min(gameState.blocks[0].length, endY); y++) {
      const block = gameState.blocks[x][y];
      if (block.type !== BLOCK_TYPES.AIR) {
        const screenX = x * BLOCK_SIZE - gameState.camera.x;
        const screenY = y * BLOCK_SIZE - gameState.camera.y;
        
        const color = BLOCK_COLORS[block.type] || [200, 200, 200];
        p.fill(...color);
        p.stroke(0, 30);
        p.rect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }
  
  // Mining progress indicator
  if (gameState.player && gameState.player.miningBlock) {
    const mb = gameState.player.miningBlock;
    const screenX = mb.x * BLOCK_SIZE - gameState.camera.x;
    const screenY = mb.y * BLOCK_SIZE - gameState.camera.y;
    
    p.noFill();
    p.stroke(255, 255, 0);
    p.strokeWeight(2);
    p.rect(screenX, screenY, BLOCK_SIZE, BLOCK_SIZE);
    
    // Progress bar
    const progress = gameState.player.miningProgress / 60;
    p.fill(255, 255, 0, 150);
    p.noStroke();
    p.rect(screenX, screenY + BLOCK_SIZE - 3, BLOCK_SIZE * progress, 3);
  }
}

export function renderUI(p) {
  p.push();
  
  // Background for UI
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, 40);
  
  // Health bar
  p.fill(255, 50, 50);
  p.rect(10, 10, 100, 20);
  p.fill(50, 255, 50);
  const healthPercent = gameState.playerHealth / gameState.playerMaxHealth;
  p.rect(10, 10, 100 * healthPercent, 20);
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`HP: ${gameState.playerHealth}/${gameState.playerMaxHealth}`, 15, 20);
  
  // Score
  p.textAlign(p.RIGHT, p.CENTER);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 20);
  
  // Time of day indicator
  const timePercent = gameState.time / gameState.dayLength;
  const isDay = gameState.time < 500;
  p.fill(isDay ? [255, 255, 100] : [100, 100, 200]);
  p.ellipse(CANVAS_WIDTH / 2, 20, 15, 15);
  
  // Equipped items
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(10);
  let yPos = 50;
  if (gameState.player) {
    if (gameState.player.equippedTool !== "none") {
      p.text(`Tool: ${gameState.player.equippedTool}`, 10, yPos);
      yPos += 15;
    }
    if (gameState.player.equippedWeapon !== "none") {
      p.text(`Weapon: ${gameState.player.equippedWeapon}`, 10, yPos);
      yPos += 15;
    }
    if (gameState.player.equippedArmor !== "none") {
      p.text(`Armor: ${gameState.player.equippedArmor}`, 10, yPos);
    }
  }
  
  // Paused indicator
  if (gameState.gamePhase === "PAUSED") {
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 50);
  }
  
  p.pop();
}

export function renderCraftingMenu(p) {
  if (!gameState.craftingMenuOpen) return;
  
  p.push();
  
  // Background
  p.fill(40, 40, 40, 230);
  p.stroke(200);
  p.strokeWeight(2);
  p.rect(100, 60, 400, 280);
  
  // Title
  p.fill(255);
  p.noStroke();
  p.textSize(20);
  p.textAlign(p.CENTER, p.TOP);
  p.text("CRAFTING", 300, 70);
  
  // Available recipes
  const recipes = getAvailableRecipes();
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  
  let yPos = 100;
  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    const craftable = canCraft(recipe);
    
    // Highlight selected
    if (i === gameState.selectedRecipe) {
      p.fill(100, 100, 150);
      p.rect(110, yPos - 5, 380, 30);
    }
    
    // Recipe name
    p.fill(craftable ? [255, 255, 255] : [150, 150, 150]);
    p.text(recipe.replace(/_/g, ' ').toUpperCase(), 120, yPos);
    
    // Requirements
    const requirements = Object.entries(p.window.CRAFTING_RECIPES[recipe] || {});
    let reqText = "";
    for (const [item, amount] of requirements) {
      const hasAmount = gameState.playerInventory[item] || 0;
      reqText += `${item}: ${hasAmount}/${amount}  `;
    }
    p.textSize(10);
    p.text(reqText, 120, yPos + 15);
    p.textSize(14);
    
    yPos += 35;
  }
  
  // Instructions
  p.fill(200);
  p.textSize(12);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text("Arrow Keys: Navigate | Z: Craft | Shift: Close", 300, 330);
  
  p.pop();
}

export function renderStartScreen(p) {
  p.background(20, 40, 60);
  
  p.fill(255, 215, 0);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("MINEQUEST", CANVAS_WIDTH / 2, 80);
  
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  
  const desc = [
    "Explore a vast procedurally generated world!",
    "Mine resources, craft tools, and build structures.",
    "Battle enemies and defeat the Stone Golem boss to win!",
    "",
    "CONTROLS:",
    "Arrow Keys - Move",
    "Space - Jump",
    "Z (Hold) - Mine / Attack / Place",
    "Shift - Open/Close Crafting Menu",
    "",
    "Survive the night when more enemies spawn.",
    "Craft better tools to mine faster.",
    "Defeat the boss to unlock advanced recipes!",
  ];
  
  let yPos = 140;
  for (const line of desc) {
    p.text(line, CANVAS_WIDTH / 2, yPos);
    yPos += 20;
  }
  
  p.fill(255, 255, 0);
  p.textSize(20);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
}

export function renderGameOver(p) {
  p.push();
  
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === "GAME_OVER_WIN") {
    p.fill(255, 215, 0);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 150);
    p.fill(255);
    p.textSize(20);
    p.text("You defeated the Stone Golem!", CANVAS_WIDTH / 2, 200);
  } else {
    p.fill(255, 50, 50);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 150);
    p.fill(255);
    p.textSize(20);
    p.text("You were defeated...", CANVAS_WIDTH / 2, 200);
  }
  
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 250);
  
  p.fill(255, 255, 0);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
  
  p.pop();
}