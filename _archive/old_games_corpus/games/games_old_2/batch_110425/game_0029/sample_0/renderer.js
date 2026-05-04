// renderer.js
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES } from './globals.js';
import { SCENES } from './scenes.js';
import { PUZZLES } from './puzzles.js';

export function renderStartScreen(p) {
  p.background(20, 30, 50);
  
  // Title
  p.fill(100, 200, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("MERIDIAN ISLAND", CANVAS_WIDTH/2, 80);
  
  // Subtitle
  p.textSize(20);
  p.fill(150, 200, 255);
  p.text("Escape Adventure", CANVAS_WIDTH/2, 120);
  
  // Instructions
  p.textSize(14);
  p.fill(200, 220, 240);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "OBJECTIVE:",
    "Explore the island, solve puzzles, and escape!",
    "",
    "CONTROLS:",
    "Arrow Keys - Navigate between scenes",
    "Z - Interact with objects/use items",
    "Space - Select items in inventory",
    "Shift - Combine selected items",
    "",
    "TIPS:",
    "• Collect items to solve puzzles",
    "• Some items can be combined",
    "• Use items on interactive objects",
    "• Explore all areas thoroughly"
  ];
  
  let y = 160;
  for (const line of instructions) {
    if (line.startsWith("OBJECTIVE:") || line.startsWith("CONTROLS:") || line.startsWith("TIPS:")) {
      p.fill(255, 220, 100);
      p.textSize(14);
    } else if (line.startsWith("•")) {
      p.fill(180, 200, 220);
      p.textSize(12);
    } else {
      p.fill(200, 220, 240);
      p.textSize(13);
    }
    p.text(line, 50, y);
    y += line === "" ? 10 : 18;
  }
  
  // Start prompt
  p.textSize(18);
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  const pulse = 0.5 + 0.5 * Math.sin(p.frameCount * 0.1);
  p.fill(100 + 155 * pulse, 255, 100);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH/2, CANVAS_HEIGHT - 40);
}

export function renderPlayingScreen(p) {
  p.background(40, 50, 60);
  
  const scene = SCENES[gameState.currentScene];
  
  // Render scene background
  renderSceneBackground(p, scene);
  
  // Render objects
  renderSceneObjects(p, scene);
  
  // Render interactables
  renderSceneInteractables(p, scene);
  
  // Render player
  if (gameState.player) {
    gameState.player.render(p);
  }
  
  // Render UI
  renderUI(p, scene);
  
  // Render directional arrows
  renderDirectionalArrows(p);
  
  // Render inventory
  renderInventory(p);
  
  // Render puzzle overlay if active
  if (gameState.interactionTarget) {
    renderPuzzleOverlay(p);
  }
}

function renderSceneBackground(p, scene) {
  // Different background colors for different scenes
  const bgColors = {
    beach: [194, 178, 128],
    forest: [34, 60, 34],
    cave: [30, 30, 40],
    caveDeep: [20, 20, 30],
    clearing: [60, 100, 60],
    ruins: [80, 70, 60],
    tower: [70, 70, 80],
    bridge: [100, 90, 80],
    dock: [120, 110, 100]
  };
  
  const color = bgColors[gameState.currentScene] || [40, 50, 60];
  p.fill(...color);
  p.rect(0, 0, CANVAS_WIDTH, 300);
  
  // Ground
  p.fill(color[0] - 30, color[1] - 30, color[2] - 30);
  p.rect(0, 300, CANVAS_WIDTH, 100);
  
  // Scene-specific details
  if (gameState.currentScene === "beach") {
    // Water
    p.fill(50, 100, 200);
    for (let i = 0; i < 5; i++) {
      p.ellipse(100 + i * 100, 320 + Math.sin(p.frameCount * 0.05 + i) * 5, 80, 20);
    }
  } else if (gameState.currentScene === "forest" || gameState.currentScene === "clearing") {
    // Trees
    for (let i = 0; i < 4; i++) {
      p.fill(60, 40, 20);
      p.rect(50 + i * 150, 150, 20, 100);
      p.fill(40, 80, 40);
      p.ellipse(60 + i * 150, 140, 60, 60);
    }
  } else if (gameState.currentScene === "cave" || gameState.currentScene === "caveDeep") {
    // Cave walls
    p.fill(50, 50, 60);
    p.arc(0, 150, 200, 300, -p.PI/2, p.PI/2);
    p.arc(CANVAS_WIDTH, 150, 200, 300, p.PI/2, 3*p.PI/2);
  } else if (gameState.currentScene === "ruins" || gameState.currentScene === "tower") {
    // Stone blocks
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 4; j++) {
        p.fill(100 + i * 10, 90 + j * 5, 80);
        p.rect(50 + j * 130, 100 + i * 60, 100, 50);
      }
    }
  }
}

function renderSceneObjects(p, scene) {
  for (const obj of scene.objects) {
    if (!gameState.inventory.includes(obj.id)) {
      p.push();
      
      // Highlight if near player
      const dist = p.dist(gameState.player.x, gameState.player.y, obj.x + obj.w/2, obj.y + obj.h/2);
      if (dist < 80) {
        p.fill(255, 255, 0, 100);
        p.ellipse(obj.x + obj.w/2, obj.y + obj.h/2, obj.w + 20, obj.h + 20);
      }
      
      // Draw object
      if (obj.id === "rope") {
        p.stroke(150, 100, 50);
        p.strokeWeight(3);
        p.noFill();
        for (let i = 0; i < 5; i++) {
          p.line(obj.x + i * 8, obj.y, obj.x + i * 8 + 5, obj.y + obj.h);
        }
      } else if (obj.id === "stick") {
        p.fill(100, 70, 40);
        p.noStroke();
        p.rect(obj.x, obj.y, obj.w, obj.h);
      } else if (obj.id === "mushroom") {
        p.fill(200, 50, 50);
        p.ellipse(obj.x + obj.w/2, obj.y, obj.w, obj.h);
        p.fill(230, 230, 200);
        p.rect(obj.x + obj.w/2 - 4, obj.y, 8, obj.h);
      } else if (obj.id === "flower") {
        p.fill(50, 100, 255);
        for (let i = 0; i < 5; i++) {
          p.ellipse(
            obj.x + obj.w/2 + Math.cos(i * p.TWO_PI / 5) * 8,
            obj.y + obj.h/2 + Math.sin(i * p.TWO_PI / 5) * 8,
            10, 10
          );
        }
        p.fill(255, 255, 100);
        p.ellipse(obj.x + obj.w/2, obj.y + obj.h/2, 8, 8);
      } else {
        p.fill(150, 150, 200);
        p.rect(obj.x, obj.y, obj.w, obj.h);
      }
      
      p.pop();
    }
  }
}

function renderSceneInteractables(p, scene) {
  for (const inter of scene.interactables) {
    p.push();
    
    const dist = p.dist(gameState.player.x, gameState.player.y, inter.x + inter.w/2, inter.y + inter.h/2);
    if (dist < 80) {
      p.fill(255, 255, 0, 100);
      p.ellipse(inter.x + inter.w/2, inter.y + inter.h/2, inter.w + 20, inter.h + 20);
    }
    
    if (inter.id === "door") {
      const isUnlocked = gameState.progressFlags.doorUnlocked;
      p.fill(isUnlocked ? 100 : 80, isUnlocked ? 50 : 40, isUnlocked ? 30 : 20);
      p.rect(inter.x, inter.y, inter.w, inter.h);
      p.fill(200, 180, 100);
      p.ellipse(inter.x + 10, inter.y + inter.h/2, 8, 8);
      if (!isUnlocked) {
        p.fill(50, 50, 50);
        p.rect(inter.x + inter.w/2 - 5, inter.y + inter.h/2 - 10, 10, 20);
      }
    } else if (inter.id === "codePanel") {
      p.fill(60, 60, 80);
      p.rect(inter.x, inter.y, inter.w, inter.h);
      p.fill(100, 255, 100);
      p.rect(inter.x + 10, inter.y + 10, inter.w - 20, 30);
      p.fill(200);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(12);
      p.text("CODE PANEL", inter.x + inter.w/2, inter.y + inter.h - 15);
    } else if (inter.id === "lever") {
      const isPulled = gameState.progressFlags.leverPulled;
      p.fill(100, 100, 120);
      p.rect(inter.x, inter.y, inter.w, inter.h * 0.7);
      p.fill(200, 50, 50);
      p.push();
      p.translate(inter.x + inter.w/2, inter.y + inter.h * 0.7);
      if (isPulled) {
        p.rotate(p.PI/4);
      }
      p.rect(-5, 0, 10, 30);
      p.ellipse(0, 30, 15, 15);
      p.pop();
    } else if (inter.id === "bridgeGap") {
      const isFixed = gameState.progressFlags.bridgeFixed;
      if (!isFixed) {
        p.fill(80, 60, 40);
        p.rect(inter.x - 50, inter.y, 50, inter.h);
        p.rect(inter.x + inter.w, inter.y, 50, inter.h);
        p.fill(0, 0, 0, 100);
        p.rect(inter.x, inter.y, inter.w, inter.h);
      } else {
        p.fill(100, 80, 60);
        p.rect(inter.x - 50, inter.y, inter.w + 100, inter.h);
      }
    } else if (inter.id === "boat") {
      p.fill(80, 60, 40);
      p.beginShape();
      p.vertex(inter.x + 20, inter.y);
      p.vertex(inter.x + inter.w - 20, inter.y);
      p.vertex(inter.x + inter.w, inter.y + inter.h);
      p.vertex(inter.x, inter.y + inter.h);
      p.endShape(p.CLOSE);
      p.fill(150, 120, 90);
      p.rect(inter.x + inter.w/2 - 5, inter.y - 40, 10, 40);
    } else if (inter.id === "rockPile") {
      p.fill(120, 120, 130);
      for (let i = 0; i < 5; i++) {
        p.ellipse(inter.x + i * 15, inter.y + 30, 30, 30);
      }
    } else {
      p.fill(150, 150, 200);
      p.rect(inter.x, inter.y, inter.w, inter.h);
    }
    
    p.pop();
  }
}

function renderUI(p, scene) {
  // Scene name
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(18);
  p.text(scene.name, 10, 10);
  
  // Score
  p.textAlign(p.RIGHT, p.TOP);
  p.text(`Score: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Description
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(12);
  p.fill(200, 220, 240);
  p.text(scene.description, CANVAS_WIDTH/2, 35);
}

function renderDirectionalArrows(p) {
  const arrowPositions = {
    UP: { x: CANVAS_WIDTH/2, y: 60, angle: -p.PI/2 },
    DOWN: { x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT - 20, angle: p.PI/2 },
    LEFT: { x: 30, y: CANVAS_HEIGHT/2, angle: p.PI },
    RIGHT: { x: CANVAS_WIDTH - 30, y: CANVAS_HEIGHT/2, angle: 0 }
  };
  
  for (const dir of gameState.availableDirections) {
    const pos = arrowPositions[dir];
    if (pos) {
      p.push();
      p.translate(pos.x, pos.y);
      p.rotate(pos.angle);
      
      p.fill(100, 200, 255, 150);
      p.noStroke();
      p.triangle(0, -10, -8, 5, 8, 5);
      p.rect(-3, 5, 6, 10);
      
      p.pop();
    }
  }
}

function renderInventory(p) {
  const invY = CANVAS_HEIGHT - 60;
  const invHeight = 55;
  
  p.fill(20, 20, 30, 220);
  p.rect(0, invY, CANVAS_WIDTH, invHeight);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("Inventory:", 10, invY + 5);
  
  const startX = 10;
  const startY = invY + 22;
  const slotSize = 30;
  const spacing = 5;
  
  for (let i = 0; i < gameState.inventory.length; i++) {
    const x = startX + i * (slotSize + spacing);
    const itemId = gameState.inventory[i];
    const isSelected = gameState.selectedItems.includes(itemId);
    
    p.fill(isSelected ? 100 : 60, isSelected ? 100 : 60, isSelected ? 150 : 80);
    p.rect(x, startY, slotSize, slotSize);
    
    // Draw item icon
    p.push();
    p.translate(x + slotSize/2, startY + slotSize/2);
    p.scale(0.5);
    renderItemIcon(p, itemId);
    p.pop();
    
    // Selection indicator
    if (isSelected) {
      p.noFill();
      p.stroke(255, 255, 100);
      p.strokeWeight(2);
      p.rect(x - 2, startY - 2, slotSize + 4, slotSize + 4);
      p.noStroke();
    }
  }
  
  // Instructions
  p.fill(180, 180, 200);
  p.textSize(10);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("SPACE: Select | SHIFT: Combine | Z: Use", CANVAS_WIDTH - 10, invY + 5);
}

function renderItemIcon(p, itemId) {
  if (itemId === "rope") {
    p.stroke(150, 100, 50);
    p.strokeWeight(2);
    p.noFill();
    for (let i = 0; i < 3; i++) {
      p.line(-10 + i * 8, -10, -10 + i * 8 + 5, 10);
    }
    p.noStroke();
  } else if (itemId === "stick") {
    p.fill(100, 70, 40);
    p.rect(-15, -3, 30, 6);
  } else if (itemId === "mushroom") {
    p.fill(200, 50, 50);
    p.ellipse(0, -5, 20, 15);
    p.fill(230, 230, 200);
    p.rect(-3, -5, 6, 15);
  } else if (itemId === "flower") {
    p.fill(50, 100, 255);
    for (let i = 0; i < 5; i++) {
      p.ellipse(Math.cos(i * p.TWO_PI / 5) * 8, Math.sin(i * p.TWO_PI / 5) * 8, 8, 8);
    }
    p.fill(255, 255, 100);
    p.ellipse(0, 0, 6, 6);
  } else if (itemId === "key") {
    p.fill(200, 180, 100);
    p.ellipse(-8, 0, 10, 10);
    p.rect(-3, -2, 12, 4);
    p.rect(9, -4, 2, 3);
    p.rect(9, 1, 2, 3);
  } else if (itemId === "rope-stick") {
    p.fill(100, 70, 40);
    p.rect(-15, -3, 30, 6);
    p.stroke(150, 100, 50);
    p.strokeWeight(2);
    p.line(-10, -3, -5, -10);
    p.line(0, -3, 5, -10);
    p.line(10, -3, 15, -10);
    p.noStroke();
  } else {
    p.fill(150);
    p.rect(-10, -10, 20, 20);
  }
}

function renderPuzzleOverlay(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const puzzle = PUZZLES[gameState.interactionTarget];
  const state = gameState.puzzleStates[gameState.interactionTarget];
  
  if (puzzle && state) {
    const panelW = 300;
    const panelH = 200;
    const panelX = (CANVAS_WIDTH - panelW) / 2;
    const panelY = (CANVAS_HEIGHT - panelH) / 2;
    
    p.fill(40, 40, 60);
    p.rect(panelX, panelY, panelW, panelH);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(16);
    p.text(puzzle.description, panelX + panelW/2, panelY + 20);
    
    // Display current input
    p.fill(100, 255, 100);
    p.rect(panelX + 50, panelY + 60, panelW - 100, 40);
    p.fill(0);
    p.textSize(24);
    p.text(state.currentInput || "", panelX + panelW/2, panelY + 70);
    
    // Instructions
    p.fill(200);
    p.textSize(12);
    p.text("Type numbers 0-9, Z to submit, ESC to close", panelX + panelW/2, panelY + 120);
    
    if (state.attempts > 0) {
      p.fill(255, 100, 100);
      p.text(`Incorrect! Attempts: ${state.attempts}`, panelX + panelW/2, panelY + 145);
    }
  }
}

export function renderPausedScreen(p) {
  renderPlayingScreen(p);
  
  p.fill(0, 0, 0, 150);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text("PAUSED", CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
  
  p.textSize(16);
  p.text("Press ESC to resume", CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 50);
  
  // Small indicator
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

export function renderGameOverScreen(p) {
  p.background(20, 30, 50);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  p.fill(isWin ? 100 : 255, isWin ? 255 : 100, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.text(isWin ? "ESCAPED!" : "GAME OVER", CANVAS_WIDTH/2, 100);
  
  p.textSize(24);
  p.fill(255);
  if (isWin) {
    p.text("You successfully escaped the island!", CANVAS_WIDTH/2, 160);
  } else {
    p.text("You couldn't escape...", CANVAS_WIDTH/2, 160);
  }
  
  p.textSize(32);
  p.fill(255, 255, 100);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH/2, 220);
  
  p.textSize(18);
  p.fill(200, 220, 240);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH/2, CANVAS_HEIGHT - 60);
}