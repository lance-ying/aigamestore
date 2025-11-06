import { GAME_PHASES, ITEM_TYPES, CRAFTING_RECIPES, gameState } from './globals.js';

// Draw the user interface
export function drawUI(p) {
  switch (gameState.gamePhase) {
    case GAME_PHASES.START:
      drawStartScreen(p);
      break;
    case GAME_PHASES.PLAYING:
      drawPlayingUI(p);
      break;
    case GAME_PHASES.PAUSED:
      drawPlayingUI(p);
      drawPauseOverlay(p);
      break;
    case GAME_PHASES.GAME_OVER_WIN:
      drawGameOverScreen(p, true);
      break;
    case GAME_PHASES.GAME_OVER_LOSE:
      drawGameOverScreen(p, false);
      break;
  }
}

function drawStartScreen(p) {
  p.background(20, 20, 50);
  
  // Title
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text("PIXEL MINER", p.width / 2, p.height / 3);
  
  // Instructions
  p.textSize(16);
  p.text("Explore, mine resources, craft tools, and build a portal to win!", p.width / 2, p.height / 2);
  
  // Controls
  p.textSize(14);
  const controls = [
    "Controls:",
    "Arrow Keys: Move and Jump",
    "Z: Mine/Attack",
    "Space: Place blocks/Use items",
    "Shift: Switch inventory items",
    "Esc: Pause game"
  ];
  
  for (let i = 0; i < controls.length; i++) {
    p.text(controls[i], p.width / 2, p.height * 0.6 + i * 20);
  }
  
  // Start prompt
  p.textSize(20);
  p.fill(255, 255, 0);
  p.text("PRESS ENTER TO START", p.width / 2, p.height * 0.85);
}

function drawPlayingUI(p) {
  // Health bar
  p.fill(255, 0, 0);
  p.rect(10, 10, 150, 20);
  p.fill(0, 255, 0);
  const healthPercent = gameState.player.health / gameState.player.maxHealth;
  p.rect(10, 10, 150 * healthPercent, 20);
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text(`Health: ${gameState.player.health}/${gameState.player.maxHealth}`, 85, 20);
  
  // Day/Night indicator
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`Day ${gameState.dayCount}`, 10, 40);
  
  // Time indicator
  const timeOfDay = gameState.time % gameState.DAY_LENGTH < gameState.DAY_LENGTH / 2 ? "Day" : "Night";
  p.text(`${timeOfDay}`, 10, 60);
  
  // Score
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Score: ${gameState.score}`, p.width - 10, 10);
  
  // Draw inventory
  drawInventory(p);
  
  // Draw crafting menu if near crafting table
  if (gameState.nearCraftingTable) {
    drawCraftingMenu(p);
  }
}

function drawInventory(p) {
  // Inventory background
  p.fill(50, 50, 50, 200);
  p.rect(10, p.height - 60, p.width - 20, 50);
  
  // Inventory slots
  const slotWidth = 50;
  const slotsPerRow = Math.floor((p.width - 20) / slotWidth);
  
  for (let i = 0; i < slotsPerRow; i++) {
    const x = 10 + i * slotWidth;
    const y = p.height - 60;
    
    // Highlight selected slot
    if (i === gameState.selectedItemIndex) {
      p.fill(100, 100, 200, 200);
    } else {
      p.fill(70, 70, 70, 200);
    }
    
    p.rect(x, y, slotWidth - 2, slotWidth - 2);
    
    // Draw item if exists
    if (i < gameState.inventory.length) {
      const item = gameState.inventory[i];
      drawItem(p, item, x + slotWidth / 2, y + slotWidth / 2);
      
      // Draw count
      p.fill(255);
      p.textAlign(p.RIGHT, p.BOTTOM);
      p.textSize(12);
      p.text(item.count, x + slotWidth - 5, y + slotWidth - 5);
    }
  }
}

function drawItem(p, item, x, y) {
  p.push();
  p.rectMode(p.CENTER);
  
  switch (item.type) {
    case ITEM_TYPES.DIRT:
      p.fill(139, 69, 19);
      p.rect(x, y, 30, 30);
      break;
    case ITEM_TYPES.STONE:
      p.fill(128, 128, 128);
      p.rect(x, y, 30, 30);
      break;
    case ITEM_TYPES.IRON:
      p.fill(200, 200, 200);
      p.rect(x, y, 30, 30);
      break;
    case ITEM_TYPES.GOLD:
      p.fill(255, 215, 0);
      p.rect(x, y, 30, 30);
      break;
    case ITEM_TYPES.WOOD:
      p.fill(101, 67, 33);
      p.rect(x, y, 30, 30);
      break;
    case ITEM_TYPES.WOODEN_PICKAXE:
      p.fill(101, 67, 33);
      p.rect(x, y, 30, 10);
      p.rect(x, y - 10, 10, 20);
      break;
    case ITEM_TYPES.STONE_PICKAXE:
      p.fill(128, 128, 128);
      p.rect(x, y, 30, 10);
      p.fill(101, 67, 33);
      p.rect(x, y - 10, 10, 20);
      break;
    case ITEM_TYPES.IRON_PICKAXE:
      p.fill(200, 200, 200);
      p.rect(x, y, 30, 10);
      p.fill(101, 67, 33);
      p.rect(x, y - 10, 10, 20);
      break;
    case ITEM_TYPES.GOLD_PICKAXE:
      p.fill(255, 215, 0);
      p.rect(x, y, 30, 10);
      p.fill(101, 67, 33);
      p.rect(x, y - 10, 10, 20);
      break;
    case ITEM_TYPES.WOODEN_SWORD:
      p.fill(101, 67, 33);
      p.rect(x, y, 10, 30);
      p.rect(x, y - 15, 20, 5);
      break;
    case ITEM_TYPES.STONE_SWORD:
      p.fill(128, 128, 128);
      p.rect(x, y, 10, 30);
      p.fill(101, 67, 33);
      p.rect(x, y + 15, 20, 5);
      break;
    case ITEM_TYPES.IRON_SWORD:
      p.fill(200, 200, 200);
      p.rect(x, y, 10, 30);
      p.fill(101, 67, 33);
      p.rect(x, y + 15, 20, 5);
      break;
    case ITEM_TYPES.GOLD_SWORD:
      p.fill(255, 215, 0);
      p.rect(x, y, 10, 30);
      p.fill(101, 67, 33);
      p.rect(x, y + 15, 20, 5);
      break;
    case ITEM_TYPES.CRAFTING_TABLE:
      p.fill(160, 82, 45);
      p.rect(x, y, 30, 30);
      p.stroke(101, 67, 33);
      p.strokeWeight(2);
      p.line(x - 15, y - 15, x + 15, y + 15);
      p.line(x + 15, y - 15, x - 15, y + 15);
      break;
    case ITEM_TYPES.PORTAL:
      // Animate portal item
      const portalColor = p.map(Math.sin(p.frameCount * 0.1), -1, 1, 100, 255);
      p.fill(portalColor, 0, portalColor);
      p.rect(x, y, 30, 30);
      break;
  }
  
  p.pop();
}

function drawCraftingMenu(p) {
  // Background
  p.fill(70, 50, 30, 230);
  p.rect(p.width / 2 - 150, 70, 300, 250);
  
  // Title
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  p.text("Crafting", p.width / 2, 80);
  
  // List available recipes
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  
  let y = 110;
  for (const recipe of CRAFTING_RECIPES) {
    // Skip recipes that require a crafting table if not at one
    if (recipe.station === BLOCK_TYPES.CRAFTING_TABLE && !gameState.nearCraftingTable) {
      continue;
    }
    
    // Check if player has ingredients
    let canCraft = true;
    for (const ingredient of recipe.ingredients) {
      let hasEnough = false;
      for (const item of gameState.inventory) {
        if (item.type === ingredient.type && item.count >= ingredient.count) {
          hasEnough = true;
          break;
        }
      }
      if (!hasEnough) {
        canCraft = false;
        break;
      }
    }
    
    // Draw recipe
    p.fill(canCraft ? 255 : 150);
    
    // Get item name
    let itemName = "Unknown";
    switch (recipe.result) {
      case ITEM_TYPES.WOODEN_PICKAXE: itemName = "Wooden Pickaxe"; break;
      case ITEM_TYPES.STONE_PICKAXE: itemName = "Stone Pickaxe"; break;
      case ITEM_TYPES.IRON_PICKAXE: itemName = "Iron Pickaxe"; break;
      case ITEM_TYPES.GOLD_PICKAXE: itemName = "Gold Pickaxe"; break;
      case ITEM_TYPES.WOODEN_SWORD: itemName = "Wooden Sword"; break;
      case ITEM_TYPES.STONE_SWORD: itemName = "Stone Sword"; break;
      case ITEM_TYPES.IRON_SWORD: itemName = "Iron Sword"; break;
      case ITEM_TYPES.GOLD_SWORD: itemName = "Gold Sword"; break;
      case ITEM_TYPES.CRAFTING_TABLE: itemName = "Crafting Table"; break;
      case ITEM_TYPES.PORTAL: itemName = "Portal (Win)"; break;
    }
    
    p.text(itemName, p.width / 2 - 140, y);
    
    // Ingredients
    let ingredientText = "Requires: ";
    for (let i = 0; i < recipe.ingredients.length; i++) {
      const ingredient = recipe.ingredients[i];
      let ingredientName = "Unknown";
      switch (ingredient.type) {
        case ITEM_TYPES.DIRT: ingredientName = "Dirt"; break;
        case ITEM_TYPES.STONE: ingredientName = "Stone"; break;
        case ITEM_TYPES.IRON: ingredientName = "Iron"; break;
        case ITEM_TYPES.GOLD: ingredientName = "Gold"; break;
        case ITEM_TYPES.WOOD: ingredientName = "Wood"; break;
      }
      
      ingredientText += `${ingredient.count} ${ingredientName}`;
      if (i < recipe.ingredients.length - 1) {
        ingredientText += ", ";
      }
    }
    
    p.text(ingredientText, p.width / 2 - 130, y + 20);
    
    // Craft button
    if (canCraft) {
      p.fill(0, 150, 0);
      p.rect(p.width / 2 + 80, y, 60, 25);
      p.fill(255);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("Craft", p.width / 2 + 110, y + 12);
      
      // Check if button is clicked
      if (p.mouseIsPressed && 
          p.mouseX > p.width / 2 + 80 && p.mouseX < p.width / 2 + 140 &&
          p.mouseY > y && p.mouseY < y + 25) {
        
        // Craft the item
        craftItem(recipe);
      }
    }
    
    y += 45;
    if (y > 280) break; // Don't show too many recipes
  }
}

function craftItem(recipe) {
  // Remove ingredients
  for (const ingredient of recipe.ingredients) {
    let remainingToRemove = ingredient.count;
    
    for (let i = 0; i < gameState.inventory.length; i++) {
      const item = gameState.inventory[i];
      
      if (item.type === ingredient.type) {
        const amountToRemove = Math.min(remainingToRemove, item.count);
        item.count -= amountToRemove;
        remainingToRemove -= amountToRemove;
        
        // Remove item if count is 0
        if (item.count <= 0) {
          gameState.inventory.splice(i, 1);
          i--;
        }
        
        if (remainingToRemove <= 0) {
          break;
        }
      }
    }
  }
  
  // Add crafted item
  let added = false;
  for (const item of gameState.inventory) {
    if (item.type === recipe.result) {
      item.count++;
      added = true;
      break;
    }
  }
  
  if (!added) {
    gameState.inventory.push({ type: recipe.result, count: 1 });
  }
  
  // Add score
  gameState.score += 50;
}

function drawPauseOverlay(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, p.width, p.height);
  
  p.fill(255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(20);
  p.text("PAUSED", p.width - 20, 20);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(16);
  p.text("Press ESC to resume", p.width / 2, p.height / 2);
}

function drawGameOverScreen(p, isWin) {
  p.background(isWin ? 0, 50, 0 : 50, 0, 0);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(40);
  p.text(isWin ? "YOU WIN!" : "GAME OVER", p.width / 2, p.height / 3);
  
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, p.width / 2, p.height / 2);
  p.text(`Survived ${gameState.dayCount} days`, p.width / 2, p.height / 2 + 30);
  
  p.textSize(16);
  p.fill(255, 255, 0);
  p.text("PRESS R TO RESTART", p.width / 2, p.height * 0.7);
}