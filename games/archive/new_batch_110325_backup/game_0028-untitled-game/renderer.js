// renderer.js - Game rendering

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { PHASE_START, PHASE_PLAYING, PHASE_PAUSED, PHASE_GAME_OVER_WIN } from './globals.js';
import { HABITAT_FOREST, HABITAT_GRASSLAND, HABITAT_WETLAND } from './globals.js';
import { FOOD_SEED, FOOD_BERRY, FOOD_FISH, FOOD_RODENT } from './globals.js';

export function drawGame(p) {
  p.background(230, 240, 250);
  
  if (gameState.gamePhase === PHASE_START) {
    drawStartScreen(p);
  } else if (gameState.gamePhase === PHASE_PLAYING) {
    drawPlayingScreen(p);
  } else if (gameState.gamePhase === PHASE_PAUSED) {
    drawPlayingScreen(p);
    drawPausedOverlay(p);
  } else if (gameState.gamePhase === PHASE_GAME_OVER_WIN || gameState.gamePhase === "GAME_OVER_LOSE") {
    drawGameOverScreen(p);
  }
}

function drawStartScreen(p) {
  p.push();
  
  // Title
  p.fill(40, 70, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("WINGSPAN", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.textSize(14);
  p.fill(60, 80, 100);
  const desc = [
    "Build your nature preserve by playing birds",
    "across three habitats to score victory points.",
    "",
    "Play over 4 rounds with decreasing actions:",
    "Round 1: 8 actions → Round 4: 5 actions"
  ];
  
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], CANVAS_WIDTH / 2, 140 + i * 20);
  }
  
  // Instructions
  p.textSize(13);
  p.fill(80, 100, 120);
  const instructions = [
    "CONTROLS:",
    "Arrow Keys: Navigate menus",
    "SPACE: Confirm selection",
    "Z: Cancel/Go back",
    "ESC: Pause game",
    "R: Return to start screen"
  ];
  
  for (let i = 0; i < instructions.length; i++) {
    p.text(instructions[i], CANVAS_WIDTH / 2, 260 + i * 18);
  }
  
  // Start prompt
  p.textSize(18);
  p.fill(100, 150, 200);
  if (p.frameCount % 60 < 30) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 370);
  }
  
  p.pop();
}

function drawPlayingScreen(p) {
  // Draw habitats
  drawHabitats(p);
  
  // Draw hand
  drawHand(p);
  
  // Draw resources
  drawResources(p);
  
  // Draw round info
  drawRoundInfo(p);
  
  // Draw UI based on mode
  drawUI(p);
  
  // Draw message
  if (gameState.messageTimer > 0) {
    drawMessage(p);
  }
}

function drawHabitats(p) {
  const habitats = [
    { name: HABITAT_FOREST, color: [80, 150, 80], y: 60 },
    { name: HABITAT_GRASSLAND, color: [200, 180, 100], y: 130 },
    { name: HABITAT_WETLAND, color: [100, 150, 200], y: 200 }
  ];
  
  for (const habitat of habitats) {
    p.push();
    
    // Background
    const isSelected = gameState.selectedHabitat === habitat.name;
    p.fill(...(isSelected ? [255, 255, 150] : habitat.color));
    p.stroke(0);
    p.strokeWeight(2);
    p.rect(10, habitat.y, 580, 60, 5);
    
    // Label
    p.fill(255);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.text(habitat.name, 15, habitat.y + 5);
    
    // Draw birds
    const birds = gameState.habitats[habitat.name];
    for (let i = 0; i < birds.length; i++) {
      drawBird(p, birds[i], 60 + i * 90, habitat.y + 25);
    }
    
    p.pop();
  }
}

function drawBird(p, bird, x, y) {
  p.push();
  
  // Card background
  p.fill(255);
  p.stroke(0);
  p.strokeWeight(1);
  p.rect(x, y, 80, 30, 3);
  
  // Bird name
  p.fill(0);
  p.noStroke();
  p.textSize(8);
  p.textAlign(p.CENTER, p.TOP);
  p.text(bird.name, x + 40, y + 2);
  
  // Points
  p.textSize(10);
  p.fill(200, 100, 50);
  p.text(`${bird.points}pt`, x + 15, y + 12);
  
  // Eggs
  for (let i = 0; i < bird.eggs; i++) {
    p.fill(255, 220, 180);
    p.stroke(200, 180, 140);
    p.ellipse(x + 45 + i * 12, y + 20, 8, 10);
  }
  
  p.pop();
}

function drawHand(p) {
  p.push();
  
  p.fill(180, 160, 140);
  p.noStroke();
  p.rect(0, 270, CANVAS_WIDTH, 80);
  
  p.fill(255);
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  p.text("HAND:", 10, 275);
  
  // Draw cards
  for (let i = 0; i < gameState.hand.length; i++) {
    const card = gameState.hand[i];
    const isSelected = gameState.uiMode === "CARD_SELECT" && gameState.menuIndex === i;
    drawHandCard(p, card, 10 + i * 72, 290, isSelected);
  }
  
  p.pop();
}

function drawHandCard(p, card, x, y, selected) {
  p.push();
  
  // Card
  p.fill(...(selected ? [255, 255, 150] : [255, 255, 255]));
  p.stroke(0);
  p.strokeWeight(selected ? 2 : 1);
  p.rect(x, y, 68, 50, 3);
  
  // Habitat color
  const habitatColors = {
    [HABITAT_FOREST]: [80, 150, 80],
    [HABITAT_GRASSLAND]: [200, 180, 100],
    [HABITAT_WETLAND]: [100, 150, 200]
  };
  p.fill(...habitatColors[card.habitat]);
  p.noStroke();
  p.rect(x, y, 68, 8, 3, 3, 0, 0);
  
  // Name
  p.fill(0);
  p.textSize(8);
  p.textAlign(p.CENTER, p.TOP);
  p.text(card.name, x + 34, y + 10);
  
  // Points
  p.textSize(12);
  p.fill(200, 100, 50);
  p.text(card.points, x + 10, y + 22);
  
  // Food cost
  p.textSize(7);
  p.fill(100, 80, 60);
  let costText = "";
  if (card.foodCost.length > 0) {
    for (const food of card.foodCost) {
      costText += food[0] + " ";
    }
  } else {
    costText = "Free";
  }
  p.text(costText, x + 34, y + 38);
  
  p.pop();
}

function drawResources(p) {
  p.push();
  
  p.fill(60, 50, 40);
  p.textSize(11);
  p.textAlign(p.LEFT, p.TOP);
  
  const foods = [
    { type: FOOD_SEED, icon: "S", color: [200, 180, 140] },
    { type: FOOD_BERRY, icon: "B", color: [180, 60, 100] },
    { type: FOOD_FISH, icon: "F", color: [100, 150, 180] },
    { type: FOOD_RODENT, icon: "R", color: [140, 120, 100] }
  ];
  
  let x = 10;
  for (const food of foods) {
    p.fill(...food.color);
    p.stroke(0);
    p.strokeWeight(1);
    p.ellipse(x + 10, 358, 16, 16);
    
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(food.icon, x + 10, 358);
    
    p.fill(0);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(`×${gameState.foodSupply[food.type]}`, x + 20, 358);
    
    x += 50;
  }
  
  p.pop();
}

function drawRoundInfo(p) {
  p.push();
  
  p.fill(40, 60, 80);
  p.textSize(14);
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Round ${gameState.currentRound}/4`, CANVAS_WIDTH - 10, 10);
  
  p.textSize(12);
  p.text(`Actions: ${gameState.actionsRemaining}/${gameState.totalActions}`, CANVAS_WIDTH - 10, 28);
  
  p.textSize(11);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 44);
  
  p.pop();
}

function drawUI(p) {
  if (gameState.uiMode === "ACTION_SELECT") {
    drawActionMenu(p);
  } else if (gameState.uiMode === "FOOD_SELECT") {
    drawFoodMenu(p);
  } else if (gameState.uiMode === "EGG_SELECT") {
    drawEggMenu(p);
  }
}

function drawActionMenu(p) {
  p.push();
  
  p.fill(255, 255, 255, 230);
  p.stroke(0);
  p.strokeWeight(2);
  p.rect(220, 80, 160, 140, 5);
  
  p.fill(40, 60, 80);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  p.text("SELECT ACTION", 300, 88);
  
  const actions = [
    { name: "Play Bird", key: "PLAY_BIRD" },
    { name: "Gain Food", key: "GAIN_FOOD" },
    { name: "Lay Eggs", key: "LAY_EGGS" },
    { name: "Draw Cards", key: "DRAW_CARDS" }
  ];
  
  for (let i = 0; i < actions.length; i++) {
    const isSelected = gameState.menuIndex === i;
    p.fill(...(isSelected ? [100, 150, 200] : [200, 200, 200]));
    p.rect(230, 110 + i * 32, 140, 28, 3);
    
    p.fill(...(isSelected ? [255, 255, 255] : [60, 60, 60]));
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(actions[i].name, 300, 124 + i * 32);
  }
  
  p.pop();
}

function drawFoodMenu(p) {
  p.push();
  
  p.fill(255, 255, 255, 230);
  p.stroke(0);
  p.strokeWeight(2);
  p.rect(200, 100, 200, 100, 5);
  
  p.fill(40, 60, 80);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  p.text("SELECT FOOD", 300, 108);
  
  const foods = [
    { type: FOOD_SEED, name: "Seed" },
    { type: FOOD_BERRY, name: "Berry" },
    { type: FOOD_FISH, name: "Fish" },
    { type: FOOD_RODENT, name: "Rodent" }
  ];
  
  for (let i = 0; i < foods.length; i++) {
    const isSelected = gameState.menuIndex === i;
    p.fill(...(isSelected ? [100, 150, 200] : [220, 220, 220]));
    p.rect(210 + i * 45, 135, 40, 50, 3);
    
    p.fill(...(isSelected ? [255, 255, 255] : [80, 80, 80]));
    p.textSize(10);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(foods[i].name, 230 + i * 45, 160);
  }
  
  p.pop();
}

function drawEggMenu(p) {
  p.push();
  
  p.fill(255, 255, 255, 230);
  p.stroke(0);
  p.strokeWeight(2);
  p.rect(180, 90, 240, 80, 5);
  
  p.fill(40, 60, 80);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  p.text("SELECT BIRD TO LAY EGG", 300, 98);
  
  p.textSize(10);
  p.text("Use ← → arrows, SPACE to confirm", 300, 150);
  
  p.pop();
}

function drawMessage(p) {
  p.push();
  
  p.fill(40, 60, 80, 200);
  p.noStroke();
  p.rect(150, 8, 300, 30, 5);
  
  p.fill(255);
  p.textSize(13);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(gameState.messageText, 300, 23);
  
  p.pop();
}

function drawPausedOverlay(p) {
  p.push();
  
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 60);
  
  p.pop();
}

function drawGameOverScreen(p) {
  p.push();
  
  p.fill(40, 60, 80);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  
  if (gameState.gamePhase === PHASE_GAME_OVER_WIN) {
    p.fill(100, 180, 100);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 100);
  } else {
    p.fill(180, 100, 100);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 100);
  }
  
  // Final score
  p.fill(60, 80, 100);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 150);
  
  // Breakdown
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Score Breakdown:", 100, 190);
  
  let birdPoints = 0;
  let eggPoints = 0;
  for (const habitat in gameState.habitats) {
    for (const bird of gameState.habitats[habitat]) {
      birdPoints += bird.points;
      eggPoints += bird.eggs;
    }
  }
  
  p.textSize(12);
  p.text(`Birds: ${birdPoints} points`, 120, 215);
  p.text(`Eggs: ${eggPoints} points`, 120, 235);
  
  let goalTotal = 0;
  for (const score of gameState.roundGoalScores) {
    goalTotal += score;
  }
  p.text(`Round Goals: ${goalTotal} points`, 120, 255);
  
  // Restart
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.fill(100, 150, 200);
  if (p.frameCount % 60 < 30) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 320);
  }
  
  p.pop();
}