// evolution.js - Evolution system and menu

import { gameState, EVOLUTIONS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function canPurchaseEvolution(category, evolutionId) {
  const evolution = EVOLUTIONS[category].find(e => e.id === evolutionId);
  if (!evolution) return false;
  
  // Check if already purchased
  const currentCategory = gameState[category === 'transmission' ? 'transmissions' : 
                                   category === 'symptoms' ? 'symptoms' : 'abilities'];
  if (currentCategory[evolutionId]) return false;
  
  // Check DNA points
  if (gameState.dnaPoints < evolution.cost) return false;
  
  // Check requirements
  if (evolution.requires) {
    if (!currentCategory[evolution.requires]) return false;
  }
  
  return true;
}

export function purchaseEvolution(category, evolutionId) {
  if (!canPurchaseEvolution(category, evolutionId)) return false;
  
  const evolution = EVOLUTIONS[category].find(e => e.id === evolutionId);
  
  // Deduct cost
  gameState.dnaPoints -= evolution.cost;
  
  // Mark as purchased
  const currentCategory = gameState[category === 'transmission' ? 'transmissions' : 
                                   category === 'symptoms' ? 'symptoms' : 'abilities'];
  currentCategory[evolutionId] = true;
  
  // Apply effects
  gameState.infectivity += evolution.infectivity;
  gameState.severity += evolution.severity;
  gameState.lethality += evolution.lethality;
  
  return true;
}

export function getAvailableEvolutions(category) {
  return EVOLUTIONS[category].filter(evo => {
    const currentCategory = gameState[category === 'transmission' ? 'transmissions' : 
                                     category === 'symptoms' ? 'symptoms' : 'abilities'];
    
    // Not already purchased
    if (currentCategory[evo.id]) return false;
    
    // Requirements met
    if (evo.requires && !currentCategory[evo.requires]) return false;
    
    return true;
  });
}

export function renderEvolutionMenu(p) {
  // Semi-transparent background
  p.fill(0, 0, 0, 200);
  p.rect(50, 50, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 100);
  
  // Title
  p.fill(255, 100, 100);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(20);
  p.text('EVOLUTION MENU', CANVAS_WIDTH / 2, 60);
  
  // Category tabs
  const categories = ['transmission', 'symptoms', 'abilities'];
  const tabWidth = 150;
  const tabX = CANVAS_WIDTH / 2 - (categories.length * tabWidth) / 2;
  
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const x = tabX + i * tabWidth;
    const isSelected = gameState.evolutionCategory === cat;
    
    p.fill(isSelected ? 80 : 50);
    p.stroke(isSelected ? 255 : 150);
    p.strokeWeight(2);
    p.rect(x, 90, tabWidth - 10, 30);
    
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(14);
    p.text(cat.toUpperCase(), x + tabWidth / 2 - 5, 105);
  }
  
  // Evolution list
  const evolutions = getAvailableEvolutions(gameState.evolutionCategory);
  const startY = 140;
  const itemHeight = 40;
  
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  
  for (let i = 0; i < evolutions.length; i++) {
    const evo = evolutions[i];
    const y = startY + i * itemHeight;
    const isSelected = i === gameState.evolutionMenuIndex;
    const canAfford = gameState.dnaPoints >= evo.cost;
    
    // Background
    p.fill(isSelected ? 80 : 40);
    p.stroke(isSelected ? 255 : 100);
    p.strokeWeight(2);
    p.rect(70, y, CANVAS_WIDTH - 140, itemHeight - 5);
    
    // Evolution name
    p.fill(canAfford ? 255 : 150);
    p.noStroke();
    p.text(evo.name, 80, y + 5);
    
    // Cost
    p.fill(canAfford ? 100 : 255, canAfford ? 255 : 100, 100);
    p.text(`Cost: ${evo.cost} DNA`, 80, y + 20);
    
    // Stats
    let statsText = '';
    if (evo.infectivity > 0) statsText += `Inf+${evo.infectivity} `;
    if (evo.severity > 0) statsText += `Sev+${evo.severity} `;
    if (evo.lethality > 0) statsText += `Leth+${evo.lethality}`;
    
    p.fill(200);
    p.text(statsText, 250, y + 5);
  }
  
  // Instructions
  p.fill(255);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(12);
  p.text('Arrow Keys: Navigate | Space: Purchase | Z: Close', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);
  
  // DNA Points display
  p.fill(255, 200, 50);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(16);
  p.text(`DNA Points: ${gameState.dnaPoints}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 45);
}