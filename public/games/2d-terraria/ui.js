import { ITEM_TYPES, CRAFTING_RECIPES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

// Draw HUD elements
export function drawHUD(p, health, maxHealth, inventory, selectedTool, selectedBlock, isDay, score) {
  // Draw health bar
  p.fill(0, 0, 0, 150);
  p.rect(10, 10, 150, 20);
  p.fill(255, 0, 0);
  p.rect(10, 10, 150 * (health / maxHealth), 20);
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`Health: ${health}/${maxHealth}`, 85, 20);
  
  // Draw selected tool
  p.fill(0, 0, 0, 150);
  p.rect(10, 40, 150, 30);
  p.fill(255);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Tool: ${selectedTool}`, 20, 55);
  
  // Draw selected block if any
  if (selectedBlock) {
    p.fill(0, 0, 0, 150);
    p.rect(10, 80, 150, 30);
    p.fill(255);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(`Block: ${selectedBlock}`, 20, 95);
  }
  
  // Draw time indicator
  p.fill(0, 0, 0, 150);
  p.rect(CANVAS_WIDTH - 100, 10, 90, 30);
  p.fill(isDay ? 255 : 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(isDay ? "Day" : "Night", CANVAS_WIDTH - 55, 25);
  
  // Draw score
  p.fill(0, 0, 0, 150);
  p.rect(CANVAS_WIDTH - 100, 50, 90, 30);
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(`Score: ${score}`, CANVAS_WIDTH - 55, 65);
  
  // Draw inventory
  drawInventory(p, inventory);
}

// Fix the overlapping inventory display
function drawInventory(p, inventory) {
  const startX = CANVAS_WIDTH - 250; // More space
  const startY = CANVAS_HEIGHT - 80; // More height
  
  p.fill(0, 0, 0, 150);
  p.rect(startX, startY, 240, 70); // Bigger box
  
  p.fill(255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.CENTER);
  
  let x = startX + 10;
  let y = startY + 15;
  let displayCount = 0;
  let itemsPerRow = 2; // Only 2 items per row
  
  for (const item in inventory) {
    if (inventory[item] > 0) {
      // Shorten item names for display
      let displayName = item;
      if (item === 'wooden_platform') displayName = 'w.platform';
      else if (item === 'wooden_wall') displayName = 'w.wall';
      else if (item === 'stone_wall') displayName = 's.wall';
      
      p.text(`${displayName}: ${inventory[item]}`, x, y);
      
      displayCount++;
      if (displayCount % itemsPerRow === 0) {
        // New row
        x = startX + 10;
        y += 20;
      } else {
        // Same row
        x += 115; // More spacing between items
      }
      
      if (displayCount >= 6) break; // Limit to 6 items max
    }
  }
}

// Draw start screen
export function drawStartScreen(p) {
  p.background(0);
  
  // Draw title
  p.fill(255);
  p.textSize(40);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("2D Terraria", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 4);
  
  // Draw instructions
  p.textSize(16);
  p.text("Mine resources, build blocks, and defeat enemies!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.textSize(14);
  p.text("LEFT/RIGHT: Move, UP: Jump, DOWN: Duck", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  p.text("SPACE: Mine/Attack, Z: Switch Tools/Blocks", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text("SHIFT: Place Blocks, X: Craft Blocks", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  
  p.textSize(20);
  p.text("Press ENTER to start", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
}

// Draw pause screen
export function drawPauseScreen(p) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textSize(30);
  p.textAlign(p.CENTER, p.CENTER);
  p.text("PAUSED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(16);
  p.text("Press ESC to resume", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
}

// Draw game over screen
export function drawGameOverScreen(p, win, score) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(win ? [0, 255, 0] : [255, 0, 0]);
  p.textSize(40);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(win ? "YOU WIN!" : "GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
  
  p.fill(255);
  p.textSize(24);
  p.text(`Final Score: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(20);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80);
}

// Draw crafting menu
export function drawCraftingMenu(p, inventory) {
  const startX = 170;
  const startY = 10;
  
  p.fill(0, 0, 0, 200);
  p.rect(startX, startY, 260, 150);
  
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Crafting", startX + 130, startY + 10);
  
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  
  let y = startY + 40;
  
  for (const recipe of CRAFTING_RECIPES) {
    if (y < startY + 140) {
      const canCraft = canCraftItem(inventory, recipe);
      p.fill(canCraft ? [255, 255, 255] : [150, 150, 150]);
      
      let reqText = "";
      for (const req of recipe.requirements) {
        reqText += `${req.type}:${req.amount} `;
      }
      
      p.text(`${recipe.result} (${reqText})`, startX + 10, y);
      y += 20;
    }
  }
}

// Check if player can craft an item
export function canCraftItem(inventory, recipe) {
  for (const req of recipe.requirements) {
    if (!inventory[req.type] || inventory[req.type] < req.amount) {
      return false;
    }
  }
  return true;
}

// Craft an item
export function craftItem(inventory, itemType) {
  const recipe = CRAFTING_RECIPES.find(r => r.result === itemType);
  
  if (!recipe) return false;
  
  if (canCraftItem(inventory, recipe)) {
    // Remove required materials
    for (const req of recipe.requirements) {
      inventory[req.type] -= req.amount;
    }
    
    // Add crafted item
    if (!inventory[itemType]) {
      inventory[itemType] = 0;
    }
    inventory[itemType]++;
    
    return true;
  }
  
  return false;
}

// Draw day/night background
export function drawBackground(p, isDay, dayTime, dayLength) {
  // Sky color based on time
  let skyColor;
  
  if (isDay) {
    const dayProgress = dayTime / (dayLength / 2);
    if (dayProgress < 0.2) {
      // Dawn - orange to blue
      skyColor = p.lerpColor(p.color(255, 150, 50), p.color(135, 206, 235), dayProgress * 5);
    } else if (dayProgress > 0.8) {
      // Dusk - blue to orange
      skyColor = p.lerpColor(p.color(135, 206, 235), p.color(255, 150, 50), (dayProgress - 0.8) * 5);
    } else {
      // Day - blue
      skyColor = p.color(135, 206, 235);
    }
  } else {
    // Night - dark blue
    skyColor = p.color(20, 20, 50);
  }
  
  p.background(skyColor);
  
  // Draw sun or moon
  if (isDay) {
    p.fill(255, 255, 0);
    p.ellipse(100, 80, 40, 40);
  } else {
    p.fill(240);
    p.ellipse(100, 80, 30, 30);
    
    // Moon crater
    p.fill(220);
    p.ellipse(95, 75, 8, 8);
    p.ellipse(110, 85, 6, 6);
    p.ellipse(90, 90, 5, 5);
  }
  
  // Draw stars at night
  if (!isDay) {
    p.fill(255);
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % CANVAS_WIDTH;
      const y = ((i * 23) % 150) + 10;
      const size = ((i * 13) % 3) + 1;
      p.ellipse(x, y, size, size);
    }
  }
}