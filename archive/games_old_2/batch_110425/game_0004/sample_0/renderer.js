// renderer.js
import { gameState, GAME_PHASES, GAME_MODES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { EQUIPMENT_RECIPES, JOB_TYPES } from './globals.js';

export function renderGame(p) {
  p.background(20, 15, 25);
  
  if (gameState.gamePhase === GAME_PHASES.START) {
    renderStartScreen(p);
  } else if (gameState.gamePhase === GAME_PHASES.PLAYING) {
    if (gameState.currentMode === GAME_MODES.CASTLE) {
      renderCastle(p);
    } else if (gameState.currentMode === GAME_MODES.MAZE) {
      renderMaze(p);
    }
    renderUI(p);
  } else if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    if (gameState.currentMode === GAME_MODES.CASTLE) {
      renderCastle(p);
    } else if (gameState.currentMode === GAME_MODES.MAZE) {
      renderMaze(p);
    }
    renderUI(p);
    renderPauseOverlay(p);
  } else if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN || 
             gameState.gamePhase === GAME_PHASES.GAME_OVER_LOSE) {
    renderGameOver(p);
  }
}

function renderStartScreen(p) {
  p.push();
  
  // Title
  p.fill(220, 180, 120);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("CASTLE ALCHEMY", CANVAS_WIDTH / 2, 80);
  
  p.textSize(16);
  p.fill(180, 150, 100);
  p.text("Alchemist's Magical Journey", CANVAS_WIDTH / 2, 115);
  
  // Description
  p.textSize(12);
  p.fill(200, 200, 200);
  p.textAlign(p.CENTER, p.CENTER);
  const desc = [
    "Manage your castle resources and craft equipment.",
    "Recruit adventurers and explore dangerous mazes.",
    "Defeat enemies and collect treasures to progress.",
    "",
    "GOAL: Reach maze depth 5+ with 500+ score to win!"
  ];
  
  for (let i = 0; i < desc.length; i++) {
    p.text(desc[i], CANVAS_WIDTH / 2, 160 + i * 18);
  }
  
  // Instructions
  p.textSize(11);
  p.fill(150, 200, 255);
  const instructions = [
    "CONTROLS:",
    "Arrow Keys - Navigate menus and maze",
    "Space - Confirm / Interact / Speed up time",
    "Shift+Space - Instant craft (in crafting menu)",
    "Z - Switch between Castle and Maze",
    "",
    "ESC - Pause    |    R - Restart"
  ];
  
  for (let i = 0; i < instructions.length; i++) {
    p.text(instructions[i], CANVAS_WIDTH / 2, 270 + i * 16);
  }
  
  // Start prompt
  p.textSize(18);
  p.fill(255, 220, 100);
  const pulse = 200 + Math.sin(p.frameCount * 0.1) * 55;
  p.fill(pulse, pulse * 0.8, 50);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 380);
  
  p.pop();
}

function renderCastle(p) {
  p.push();
  
  // Background
  p.fill(30, 25, 40);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Castle silhouette
  p.fill(15, 12, 20);
  p.rect(50, 250, 100, 150);
  p.triangle(50, 250, 100, 200, 150, 250);
  p.rect(200, 280, 80, 120);
  p.triangle(200, 280, 240, 230, 280, 280);
  
  // Stars
  p.fill(255, 255, 200, 150);
  for (let i = 0; i < 20; i++) {
    const x = (i * 73) % CANVAS_WIDTH;
    const y = (i * 41) % 200;
    p.circle(x, y, 2);
  }
  
  // Tab interface
  const tabWidth = 150;
  const tabHeight = 30;
  const tabY = 20;
  
  // Crafting tab
  p.fill(...(gameState.castleTab === 0 ? [80, 60, 100] : [50, 40, 60]));
  p.rect(50, tabY, tabWidth, tabHeight);
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text("Crafting", 50 + tabWidth / 2, tabY + tabHeight / 2);
  
  // Team tab
  p.fill(...(gameState.castleTab === 1 ? [80, 60, 100] : [50, 40, 60]));
  p.rect(210, tabY, tabWidth, tabHeight);
  p.fill(255);
  p.text("Team", 210 + tabWidth / 2, tabY + tabHeight / 2);
  
  if (gameState.castleTab === 0) {
    renderCraftingTab(p);
  } else if (gameState.castleTab === 1) {
    renderTeamTab(p);
  }
  
  // Resources display
  renderResources(p);
  
  p.pop();
}

function renderCraftingTab(p) {
  p.push();
  
  const startY = 70;
  const lineHeight = 35;
  
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.fill(255, 220, 150);
  p.text("EQUIPMENT RECIPES:", 50, startY);
  
  // Recipe list
  for (let i = 0; i < EQUIPMENT_RECIPES.length; i++) {
    const recipe = EQUIPMENT_RECIPES[i];
    const y = startY + 25 + i * lineHeight;
    
    // Selection highlight
    if (i === gameState.selectedRecipe) {
      p.fill(100, 80, 120, 100);
      p.rect(45, y - 3, 250, lineHeight - 5);
    }
    
    p.fill(200, 200, 255);
    p.text(recipe.name, 50, y);
    
    // Cost
    p.textSize(10);
    p.fill(150, 150, 150);
    let costText = "Cost: ";
    for (let mat in recipe.cost) {
      costText += `${mat}:${recipe.cost[mat]} `;
    }
    p.text(costText, 50, y + 14);
    
    // Stats
    p.fill(255, 200, 100);
    p.text(`ATK:${recipe.atk} DEF:${recipe.def}`, 200, y + 14);
    
    p.textSize(12);
  }
  
  // Crafting queue
  p.fill(255, 220, 150);
  p.text("CRAFTING QUEUE:", 320, startY);
  
  for (let i = 0; i < gameState.craftingQueue.length; i++) {
    const job = gameState.craftingQueue[i];
    const y = startY + 25 + i * 30;
    
    p.fill(200, 200, 255);
    p.textSize(11);
    p.text(job.recipe.name, 325, y);
    
    // Progress bar
    const progress = job.getProgress();
    p.fill(50, 50, 70);
    p.rect(325, y + 14, 200, 10);
    p.fill(100, 200, 100);
    p.rect(325, y + 14, 200 * progress, 10);
  }
  
  // Inventory
  p.fill(255, 220, 150);
  p.text("INVENTORY:", 320, 200);
  
  for (let i = 0; i < Math.min(5, gameState.inventory.length); i++) {
    const item = gameState.inventory[i];
    const y = 225 + i * 20;
    
    p.fill(200, 200, 255);
    p.textSize(10);
    p.text(`${item.name} (A:${item.atk} D:${item.def})`, 325, y);
  }
  
  p.pop();
}

function renderTeamTab(p) {
  p.push();
  
  const startY = 70;
  const lineHeight = 30;
  
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.fill(255, 220, 150);
  p.text("RECRUIT ADVENTURERS:", 50, startY);
  
  // Job types
  for (let i = 0; i < JOB_TYPES.length; i++) {
    const job = JOB_TYPES[i];
    const y = startY + 25 + i * lineHeight;
    
    // Selection highlight
    if (i === gameState.selectedAdventurer) {
      p.fill(100, 80, 120, 100);
      p.rect(45, y - 3, 280, lineHeight - 5);
    }
    
    p.fill(200, 200, 255);
    p.text(job.name, 50, y);
    
    // Stats
    p.textSize(10);
    p.fill(150, 200, 150);
    p.text(`HP:${job.hp} ATK:${job.atk} DEF:${job.def}`, 150, y + 3);
    
    // Cost
    p.fill(255, 200, 100);
    p.text(`Cost: ${job.cost} iron`, 250, y + 3);
    
    p.textSize(12);
  }
  
  // Current team
  p.fill(255, 220, 150);
  p.text("CURRENT TEAM:", 350, startY);
  
  for (let i = 0; i < gameState.adventurers.length; i++) {
    const adv = gameState.adventurers[i];
    const y = startY + 25 + i * 45;
    
    p.fill(200, 200, 255);
    p.textSize(11);
    p.text(`${adv.jobType.name} Lv${adv.level}`, 355, y);
    
    // HP bar
    const hpPercent = adv.currentHp / adv.getMaxHp();
    p.fill(50, 50, 70);
    p.rect(355, y + 14, 180, 8);
    p.fill(...(hpPercent > 0.5 ? [100, 200, 100] : [200, 100, 100]));
    p.rect(355, y + 14, 180 * hpPercent, 8);
    
    // Stats
    p.textSize(9);
    p.fill(150, 200, 150);
    p.text(`HP:${Math.floor(adv.currentHp)}/${adv.getMaxHp()} ATK:${adv.getTotalAtk()} DEF:${adv.getTotalDef()}`, 355, y + 26);
    
    // Equipment
    p.fill(200, 180, 150);
    const weapon = adv.equipment.weapon ? adv.equipment.weapon.name : "None";
    const armor = adv.equipment.armor ? adv.equipment.armor.name : "None";
    p.text(`W:${weapon}`, 355, y + 36);
  }
  
  p.pop();
}

function renderMaze(p) {
  p.push();
  
  // Background
  p.fill(15, 10, 20);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Draw connections
  p.stroke(80, 60, 100);
  p.strokeWeight(2);
  for (let node of gameState.mazeNodes) {
    if (node.explored) {
      for (let conn of node.connections) {
        if (conn.explored) {
          p.line(node.x, node.y, conn.x, conn.y);
        }
      }
    }
  }
  
  // Draw nodes
  p.noStroke();
  for (let i = 0; i < gameState.mazeNodes.length; i++) {
    const node = gameState.mazeNodes[i];
    
    if (!node.explored) continue;
    
    const isCurrent = node === gameState.currentNode;
    const size = isCurrent ? 20 : 14;
    
    // Node color based on type
    if (node.cleared) {
      p.fill(80, 80, 80);
    } else if (node.type === "boss") {
      p.fill(200, 50, 50);
    } else if (node.type === "enemy") {
      p.fill(200, 100, 50);
    } else if (node.type === "treasure") {
      p.fill(255, 200, 50);
    } else if (node.type === "rest") {
      p.fill(50, 200, 100);
    } else {
      p.fill(150, 150, 150);
    }
    
    if (isCurrent) {
      // Pulse effect
      const pulse = 5 + Math.sin(p.frameCount * 0.15) * 3;
      p.circle(node.x, node.y, size + pulse);
      p.fill(255, 255, 100, 100);
      p.circle(node.x, node.y, size + pulse + 5);
    } else {
      p.circle(node.x, node.y, size);
    }
    
    // Depth indicator
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(8);
    p.text(node.depth, node.x, node.y);
  }
  
  // Connection selection UI
  if (gameState.currentNode) {
    const node = gameState.currentNode;
    
    p.textSize(12);
    p.fill(255, 255, 200);
    p.textAlign(p.CENTER, p.BOTTOM);
    
    if (!node.cleared) {
      p.text(`[${node.type.toUpperCase()}]`, node.x, node.y - 25);
      p.text("Press SPACE to interact", CANVAS_WIDTH / 2, 30);
    } else {
      p.text("Select path with ↑↓, SPACE to move", CANVAS_WIDTH / 2, 30);
      
      // Show available connections
      for (let i = 0; i < node.connections.length; i++) {
        const conn = node.connections[i];
        const isSelected = i === gameState.selectedNodeIndex;
        
        if (isSelected) {
          p.stroke(255, 255, 100);
          p.strokeWeight(3);
          p.noFill();
          p.circle(conn.x, conn.y, 25);
        }
      }
    }
  }
  
  p.pop();
}

function renderResources(p) {
  p.push();
  
  p.fill(40, 35, 50);
  p.rect(10, 355, 280, 35);
  
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(10);
  
  const materials = gameState.materials;
  let x = 15;
  
  for (let mat in materials) {
    p.fill(255, 200, 100);
    p.text(`${mat}:`, x, 372);
    p.fill(200, 255, 200);
    p.text(Math.floor(materials[mat]), x + 40, 372);
    x += 70;
  }
  
  p.pop();
}

function renderUI(p) {
  p.push();
  
  // Score
  p.fill(255, 220, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Mode indicator
  p.fill(150, 200, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`Mode: ${gameState.currentMode}`, 10, 10);
  
  // Maze depth
  if (gameState.currentMode === GAME_MODES.MAZE) {
    p.fill(255, 180, 100);
    p.textAlign(p.CENTER, p.TOP);
    p.text(`Depth: ${gameState.mazeDepth}`, CANVAS_WIDTH / 2, 10);
  }
  
  // Team size
  p.fill(200, 255, 200);
  p.textAlign(p.RIGHT, p.BOTTOM);
  p.textSize(11);
  p.text(`Team: ${gameState.adventurers.length}/${gameState.maxTeamSize}`, CANVAS_WIDTH - 10, CANVAS_HEIGHT - 10);
  
  p.pop();
}

function renderPauseOverlay(p) {
  p.push();
  
  p.fill(255, 255, 255);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text("PAUSED", CANVAS_WIDTH - 10, 30);
  
  p.pop();
}

function renderGameOver(p) {
  p.push();
  
  p.background(20, 15, 25);
  
  p.textAlign(p.CENTER, p.CENTER);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.textSize(36);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 120);
    
    p.fill(200, 255, 200);
    p.textSize(16);
    p.text("You conquered the depths!", CANVAS_WIDTH / 2, 160);
  } else {
    p.fill(255, 100, 100);
    p.textSize(36);
    p.text("DEFEAT", CANVAS_WIDTH / 2, 120);
    
    p.fill(255, 200, 200);
    p.textSize(16);
    p.text("Your team has fallen...", CANVAS_WIDTH / 2, 160);
  }
  
  p.fill(255, 220, 100);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  p.fill(200, 200, 255);
  p.textSize(14);
  p.text(`Maze Depth Reached: ${gameState.mazeDepth}`, CANVAS_WIDTH / 2, 260);
  p.text(`Adventurers Recruited: ${gameState.adventurers.length}`, CANVAS_WIDTH / 2, 285);
  p.text(`Equipment Crafted: ${gameState.inventory.length + gameState.adventurers.reduce((sum, a) => {
    return sum + (a.equipment.weapon ? 1 : 0) + (a.equipment.armor ? 1 : 0);
  }, 0)}`, CANVAS_WIDTH / 2, 310);
  
  p.fill(255, 255, 100);
  p.textSize(18);
  const pulse = 200 + Math.sin(p.frameCount * 0.1) * 55;
  p.fill(pulse, pulse * 0.8, 50);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 360);
  
  p.pop();
}