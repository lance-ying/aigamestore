// ui.js - UI rendering functions

import { gameState, RECIPES, CANVAS_WIDTH, CANVAS_HEIGHT, QUEST_DEFINITIONS } from './globals.js';

export function renderUI(p) {
  // Inventory display
  renderInventory(p);
  
  // Quest tracker
  renderQuestTracker(p);
  
  // Score
  p.fill(255);
  p.textSize(16);
  p.textAlign(p.LEFT);
  p.text(`Score: ${gameState.score}`, 10, 30);
  
  // Crafting menu
  if (gameState.craftingOpen) {
    renderCraftingMenu(p);
  }
  
  // Breaking progress
  if (gameState.breakingBlock && gameState.breakProgress > 0) {
    const progress = gameState.breakProgress;
    const x = CANVAS_WIDTH / 2 - 50;
    const y = CANVAS_HEIGHT - 40;
    p.fill(50);
    p.rect(x, y, 100, 10);
    p.fill(100, 200, 100);
    p.rect(x, y, 100 * progress, 10);
  }
}

function renderInventory(p) {
  p.fill(0, 0, 0, 150);
  p.rect(10, 50, 150, 120);
  
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT);
  p.text("Inventory:", 15, 70);
  
  let y = 85;
  for (const [material, count] of Object.entries(gameState.inventory)) {
    if (count > 0) {
      p.text(`${material}: ${count}`, 15, y);
      y += 18;
    }
  }
  
  // Show crafted items
  if (gameState.inventory.wooden_sword) {
    p.text(`Weapon: Wooden Sword`, 15, y);
  }
}

function renderQuestTracker(p) {
  p.fill(0, 0, 0, 150);
  p.rect(CANVAS_WIDTH - 210, 10, 200, 150);
  
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT);
  p.text("Active Quests:", CANVAS_WIDTH - 205, 30);
  
  let y = 50;
  for (const quest of gameState.quests) {
    if (!quest.completed) {
      p.fill(255, 255, 0);
      p.textSize(12);
      p.text(quest.title, CANVAS_WIDTH - 205, y);
      y += 15;
      
      p.fill(200);
      p.textSize(10);
      // Show progress
      for (const [key, value] of Object.entries(quest.objectives)) {
        const current = gameState.inventory[key] || 0;
        p.text(`${key}: ${current}/${value}`, CANVAS_WIDTH - 200, y);
        y += 13;
      }
      y += 5;
    }
  }
}

function renderCraftingMenu(p) {
  // Semi-transparent background
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Menu box
  p.fill(60, 40, 20);
  p.rect(100, 50, CANVAS_WIDTH - 200, CANVAS_HEIGHT - 100);
  
  p.fill(255);
  p.textSize(18);
  p.textAlign(p.CENTER);
  p.text("Crafting Menu (Press SHIFT to close)", CANVAS_WIDTH / 2, 80);
  
  // List recipes
  let y = 120;
  let index = 0;
  for (const [recipeName, recipe] of Object.entries(RECIPES)) {
    const canCraft = checkCanCraft(recipe);
    p.fill(canCraft ? 100 : 150, canCraft ? 200 : 100, canCraft ? 100 : 100);
    p.rect(120, y - 20, CANVAS_WIDTH - 240, 40);
    
    p.fill(255);
    p.textSize(14);
    p.textAlign(p.LEFT);
    p.text(recipeName.replace(/_/g, ' '), 130, y);
    
    // Show materials needed
    let matText = "Needs: ";
    for (const [mat, count] of Object.entries(recipe.materials)) {
      const has = gameState.inventory[mat] || 0;
      matText += `${mat}:${has}/${count} `;
    }
    p.textSize(11);
    p.text(matText, 130, y + 15);
    
    y += 50;
    index++;
  }
  
  p.textSize(12);
  p.textAlign(p.CENTER);
  p.fill(255, 255, 0);
  p.text("Use Z to craft first available recipe", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 70);
}

function checkCanCraft(recipe) {
  for (const [material, count] of Object.entries(recipe.materials)) {
    if ((gameState.inventory[material] || 0) < count) {
      return false;
    }
  }
  return true;
}

export function renderStartScreen(p) {
  p.background(20, 30, 60);
  
  // Title with fancy styling
  p.fill(255, 215, 0);
  p.textSize(36);
  p.textAlign(p.CENTER);
  p.text("DRAGON QUEST BUILDERS", CANVAS_WIDTH / 2, 80);
  
  p.fill(200);
  p.textSize(14);
  p.text("Restore the World of Alefgard", CANVAS_WIDTH / 2, 110);
  
  // Instructions
  p.fill(255);
  p.textSize(13);
  p.textAlign(p.LEFT);
  const instructions = [
    "OBJECTIVE:",
    "- Gather materials by breaking blocks",
    "- Craft tools and items",
    "- Build structures to complete quests",
    "- Defend against monster attacks",
    "",
    "CONTROLS:",
    "Arrow Keys: Move",
    "Space: Break blocks / Attack",
    "Z: Place blocks / Interact",
    "Shift: Open crafting menu",
    "",
    "Complete all quests to win!"
  ];
  
  let y = 150;
  for (const line of instructions) {
    p.text(line, 100, y);
    y += 20;
  }
  
  // Start prompt
  p.fill(255, 255, 0);
  p.textSize(18);
  p.textAlign(p.CENTER);
  const blink = Math.floor(p.frameCount / 30) % 2 === 0;
  if (blink) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  }
}

export function renderGameOver(p, won) {
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(won ? 100 : 255, won ? 255 : 100, 100);
  p.textSize(48);
  p.textAlign(p.CENTER);
  p.text(won ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50);
  
  p.fill(255);
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  if (won) {
    p.textSize(16);
    p.text("You have restored Alefgard!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
  }
  
  p.fill(255, 255, 0);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80);
}

export function renderPausedIndicator(p) {
  p.fill(255, 255, 0);
  p.textSize(16);
  p.textAlign(p.RIGHT);
  p.text("PAUSED", CANVAS_WIDTH - 10, 25);
}