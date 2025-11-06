// renderer.js
import { gameState, GAME_PHASES, ACTIONS, HABITATS, FOOD_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawStartScreen(p) {
  p.background(40, 60, 80);
  
  // Title
  p.fill(255, 230, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("WINGSPAN", CANVAS_WIDTH / 2, 80);
  
  // Description
  p.fill(200, 220, 240);
  p.textSize(14);
  p.text("Build your bird sanctuary strategically!", CANVAS_WIDTH / 2, 140);
  p.text("Play birds, gain food, lay eggs, and draw cards.", CANVAS_WIDTH / 2, 160);
  p.text("Complete 4 rounds to achieve the highest score!", CANVAS_WIDTH / 2, 180);
  
  // Instructions
  p.textSize(12);
  p.fill(180, 200, 220);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 220);
  p.text("Arrow Keys: Navigate | Space: Confirm | Z: Cancel", CANVAS_WIDTH / 2, 240);
  p.text("ESC: Pause | R: Restart", CANVAS_WIDTH / 2, 260);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  const pulse = 200 + Math.sin(p.frameCount * 0.1) * 55;
  p.fill(pulse, pulse, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 320);
}

export function drawPlayingScreen(p) {
  p.background(50, 70, 90);
  
  // Draw game info
  drawGameInfo(p);
  
  // Draw player resources
  drawResources(p);
  
  // Draw board
  drawBoard(p);
  
  // Draw hand
  drawHand(p);
  
  // Draw action selection
  drawActionSelection(p);
  
  // Draw message
  if (gameState.showingMessage) {
    drawMessage(p);
  }
  
  // Draw pause indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255);
    p.textSize(16);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

export function drawGameInfo(p) {
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`Round: ${gameState.round}/${gameState.maxRounds}`, 10, 10);
  p.text(`Turn: ${gameState.turnsThisRound + 1}/${gameState.maxTurnsPerRound}`, 10, 25);
  p.text(`Score: ${gameState.score}`, 10, 40);
}

export function drawResources(p) {
  const startX = 120;
  const y = 15;
  
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(11);
  
  // Food icons and counts
  const foods = [
    { type: FOOD_TYPES.WORM, color: [220, 100, 100], symbol: "W" },
    { type: FOOD_TYPES.SEED, color: [200, 180, 100], symbol: "S" },
    { type: FOOD_TYPES.FISH, color: [100, 150, 220], symbol: "F" },
    { type: FOOD_TYPES.BERRY, color: [180, 100, 180], symbol: "B" }
  ];
  
  let x = startX;
  for (let food of foods) {
    p.fill(...food.color);
    p.circle(x, y + 6, 12);
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(food.symbol, x, y + 6);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`×${gameState.food[food.type]}`, x + 10, y + 2);
    x += 50;
  }
}

export function drawBoard(p) {
  const habitatY = {
    [HABITATS.FOREST]: 70,
    [HABITATS.GRASSLAND]: 130,
    [HABITATS.WETLAND]: 190
  };
  
  const habitatColors = {
    [HABITATS.FOREST]: [80, 140, 80],
    [HABITATS.GRASSLAND]: [140, 140, 80],
    [HABITATS.WETLAND]: [80, 120, 160]
  };
  
  const habitatNames = {
    [HABITATS.FOREST]: "Forest",
    [HABITATS.GRASSLAND]: "Grassland",
    [HABITATS.WETLAND]: "Wetland"
  };
  
  for (let habitat in habitatY) {
    const y = habitatY[habitat];
    const color = habitatColors[habitat];
    
    // Habitat row background
    p.fill(...color, 50);
    p.rect(10, y, 580, 50, 5);
    
    // Habitat label
    p.fill(255);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(10);
    p.text(habitatNames[habitat], 15, y + 25);
    
    // Draw birds in this habitat
    const birds = gameState.board[habitat];
    const startX = 100;
    for (let i = 0; i < birds.length; i++) {
      drawBirdOnBoard(p, birds[i], startX + i * 60, y + 10);
    }
    
    // Show slot selection for playing bird
    if (gameState.actionPhase === "SELECT_SLOT" && gameState.selectedHabitat === habitat) {
      const slotX = startX + gameState.selectedBirdSlot * 60;
      p.stroke(255, 255, 0);
      p.strokeWeight(2);
      p.noFill();
      p.rect(slotX - 3, y + 7, 36, 36, 3);
      p.noStroke();
    }
  }
}

export function drawBirdOnBoard(p, bird, x, y) {
  // Bird card
  p.fill(60, 60, 80);
  p.stroke(200);
  p.strokeWeight(1);
  p.rect(x, y, 30, 30, 3);
  p.noStroke();
  
  // Bird initial
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text(bird.name.charAt(0), x + 15, y + 12);
  
  // Points
  p.textSize(8);
  p.fill(255, 220, 100);
  p.text(bird.pointValue, x + 7, y + 25);
  
  // Eggs
  if (bird.eggs > 0) {
    p.fill(255, 255, 255);
    p.circle(x + 23, y + 25, 6);
    p.fill(100, 100, 150);
    p.textSize(7);
    p.text(bird.eggs, x + 23, y + 25);
  }
}

export function drawHand(p) {
  const y = 260;
  p.fill(40, 40, 60, 200);
  p.rect(0, y, CANVAS_WIDTH, CANVAS_HEIGHT - y);
  
  p.fill(200, 220, 240);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(10);
  p.text("Hand:", 10, y + 5);
  
  const startX = 10;
  const cardY = y + 25;
  
  for (let i = 0; i < gameState.handCards.length; i++) {
    const bird = gameState.handCards[i];
    const x = startX + i * 70;
    
    // Highlight selected card
    const isSelected = (gameState.actionPhase === "SELECT_CARD" || gameState.actionPhase === "SELECT_SLOT") 
                      && gameState.selectedCardIndex === i;
    
    drawBirdCard(p, bird, x, cardY, isSelected);
  }
}

export function drawBirdCard(p, bird, x, y, isSelected) {
  // Card background
  const habitatColors = {
    [HABITATS.FOREST]: [80, 140, 80],
    [HABITATS.GRASSLAND]: [140, 140, 80],
    [HABITATS.WETLAND]: [80, 120, 160]
  };
  
  const color = habitatColors[bird.habitat];
  
  if (isSelected) {
    p.fill(255, 255, 100);
    p.rect(x - 2, y - 2, 64, 94, 5);
  }
  
  p.fill(...color);
  p.stroke(200);
  p.strokeWeight(1);
  p.rect(x, y, 60, 90, 5);
  p.noStroke();
  
  // Bird name
  p.fill(255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(9);
  p.text(bird.name, x + 30, y + 5);
  
  // Points
  p.fill(255, 220, 100);
  p.textSize(16);
  p.text(bird.pointValue, x + 30, y + 25);
  
  // Food cost
  p.textSize(8);
  p.fill(255);
  p.text("Cost:", x + 30, y + 50);
  
  let costY = y + 62;
  const foodColors = {
    [FOOD_TYPES.WORM]: [220, 100, 100],
    [FOOD_TYPES.SEED]: [200, 180, 100],
    [FOOD_TYPES.FISH]: [100, 150, 220],
    [FOOD_TYPES.BERRY]: [180, 100, 180]
  };
  
  for (let food of bird.foodCost) {
    p.fill(...foodColors[food]);
    p.circle(x + 30, costY, 8);
    costY += 10;
  }
}

export function drawActionSelection(p) {
  if (gameState.actionPhase !== "SELECT_ACTION") return;
  
  const actions = [
    { action: ACTIONS.PLAY_BIRD, label: "Play Bird", x: 400, y: 80, key: "↑" },
    { action: ACTIONS.GAIN_FOOD, label: "Gain Food", x: 330, y: 120, key: "←" },
    { action: ACTIONS.DRAW_CARDS, label: "Draw Cards", x: 470, y: 120, key: "→" },
    { action: ACTIONS.LAY_EGGS, label: "Lay Eggs", x: 400, y: 160, key: "↓" }
  ];
  
  for (let act of actions) {
    const isSelected = gameState.selectedAction === act.action;
    
    p.fill(...(isSelected ? [255, 255, 100] : [100, 120, 140]));
    p.rect(act.x, act.y, 80, 30, 5);
    
    p.fill(...(isSelected ? [0, 0, 0] : [255, 255, 255]));
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(10);
    p.text(act.label, act.x + 40, act.y + 10);
    p.textSize(8);
    p.text(act.key, act.x + 40, act.y + 22);
  }
  
  // Instructions
  p.fill(200, 220, 240);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(11);
  p.text("Select action with arrows, SPACE to confirm", CANVAS_WIDTH / 2, 210);
}

export function drawMessage(p) {
  p.fill(40, 40, 60, 220);
  p.rect(CANVAS_WIDTH / 2 - 150, CANVAS_HEIGHT / 2 - 30, 300, 60, 10);
  
  p.fill(255, 255, 150);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text(gameState.message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}

export function drawGameOverScreen(p) {
  p.background(30, 30, 50);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  // Title
  p.fill(...(isWin ? [150, 255, 150] : [255, 150, 150]));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "VICTORY!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
  
  // Score
  p.fill(255, 255, 150);
  p.textSize(32);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 160);
  
  // Message
  p.fill(200, 220, 240);
  p.textSize(16);
  if (isWin) {
    p.text("You've built an amazing bird sanctuary!", CANVAS_WIDTH / 2, 220);
  } else {
    p.text("Keep trying to reach 50 points!", CANVAS_WIDTH / 2, 220);
  }
  
  // Stats
  p.textSize(12);
  let totalBirds = 0;
  let totalEggs = 0;
  for (let habitat in gameState.board) {
    totalBirds += gameState.board[habitat].length;
    for (let bird of gameState.board[habitat]) {
      totalEggs += bird.eggs;
    }
  }
  
  p.text(`Birds Played: ${totalBirds}`, CANVAS_WIDTH / 2, 260);
  p.text(`Total Eggs: ${totalEggs}`, CANVAS_WIDTH / 2, 280);
  
  // Restart prompt
  p.fill(255, 255, 100);
  p.textSize(20);
  const pulse = 200 + Math.sin(p.frameCount * 0.1) * 55;
  p.fill(pulse, pulse, 100);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
}