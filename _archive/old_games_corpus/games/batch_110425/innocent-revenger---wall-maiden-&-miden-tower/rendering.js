// rendering.js
import { gameState, GAME_PHASES, BATTLE_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { getAvailableActions, getValidTargets } from './battle.js';

export function renderGame(p) {
  p.background(20, 15, 30);
  
  switch (gameState.gamePhase) {
    case GAME_PHASES.START:
      renderStartScreen(p);
      break;
    case GAME_PHASES.PLAYING:
      renderPlayingScreen(p);
      break;
    case GAME_PHASES.PAUSED:
      renderPlayingScreen(p);
      renderPauseOverlay(p);
      break;
    case GAME_PHASES.GAME_OVER_WIN:
    case GAME_PHASES.GAME_OVER_LOSE:
      renderGameOverScreen(p);
      break;
  }
}

function renderStartScreen(p) {
  p.fill(255, 220, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("INNOCENT REVENGER", CANVAS_WIDTH / 2, 60);
  
  p.textSize(16);
  p.fill(200, 180, 220);
  p.text("Wall Maiden & Miden Tower", CANVAS_WIDTH / 2, 95);
  
  p.textSize(14);
  p.fill(220, 220, 220);
  p.textAlign(p.LEFT, p.TOP);
  const instructions = [
    "Lead your party through the Miden Tower!",
    "Battle enemies in turn-based formation combat.",
    "Mule the Wall Maiden can merge with walls for defense.",
    "",
    "OBJECTIVE:",
    "- Defeat enemies on all 5 floors",
    "- Level up to 999 and unlock 100+ skills",
    "- Transmute items to create powerful equipment",
    "",
    "CONTROLS:",
    "Arrow Keys - Navigate menus",
    "Space - Confirm selection",
    "Z - Cancel/Back",
    "Shift - Transmutation menu",
    "ESC - Pause | R - Restart"
  ];
  
  let yPos = 130;
  instructions.forEach(line => {
    p.text(line, 50, yPos);
    yPos += 18;
  });
  
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
}

function renderPlayingScreen(p) {
  // Background gradient
  for (let y = 0; y < CANVAS_HEIGHT; y++) {
    const inter = y / CANVAS_HEIGHT;
    p.stroke(20 + inter * 30, 15 + inter * 25, 30 + inter * 40);
    p.line(0, y, CANVAS_WIDTH, y);
  }
  
  // Battle grid area
  const gridX = 50;
  const gridY = 50;
  const cellSize = 60;
  
  // Draw grid
  p.stroke(80, 70, 100);
  p.strokeWeight(1);
  p.noFill();
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 4; j++) {
      p.rect(gridX + i * cellSize, gridY + j * cellSize, cellSize, cellSize);
    }
  }
  
  // Draw walls
  p.fill(100, 90, 110);
  p.noStroke();
  p.rect(gridX - 10, gridY, 10, cellSize * 4);
  p.rect(gridX + cellSize * 5, gridY, 10, cellSize * 4);
  
  // Draw party members
  gameState.party.forEach((member, idx) => {
    const px = gridX + member.gridX * cellSize + cellSize / 2;
    const py = gridY + member.gridY * cellSize + cellSize / 2;
    
    const isSelected = gameState.battlePhase === BATTLE_PHASES.SELECT_CHARACTER && 
                      idx === gameState.selectedCharacterIndex;
    
    if (member.type === "WallMaiden") {
      if (member.isWallMerged) {
        p.fill(150, 140, 170);
        p.rect(px - 20, py - 20, 40, 40);
      } else {
        p.fill(180, 160, 220);
        p.ellipse(px, py, 35, 35);
      }
    } else {
      p.fill(100, 180, 255);
      p.ellipse(px, py, 30, 30);
    }
    
    if (isSelected) {
      p.noFill();
      p.stroke(255, 255, 100);
      p.strokeWeight(3);
      p.ellipse(px, py, 45, 45);
      p.noStroke();
    }
    
    // HP bar
    const hpRatio = member.hp / member.maxHp;
    p.fill(40, 40, 40);
    p.rect(px - 15, py + 20, 30, 4);
    p.fill(...(hpRatio > 0.5 ? [100, 255, 100] : hpRatio > 0.25 ? [255, 200, 100] : [255, 100, 100]));
    p.rect(px - 15, py + 20, 30 * hpRatio, 4);
    
    // Name
    p.fill(255);
    p.textSize(10);
    p.textAlign(p.CENTER, p.TOP);
    p.text(member.name, px, py + 26);
  });
  
  // Draw enemies
  gameState.enemies.forEach((enemy, idx) => {
    if (!enemy.isAlive()) return;
    
    const px = gridX + enemy.gridX * cellSize + cellSize / 2;
    const py = gridY + enemy.gridY * cellSize + cellSize / 2;
    
    const isSelected = gameState.battlePhase === BATTLE_PHASES.SELECT_TARGET && 
                      idx === gameState.selectedTargetIndex;
    
    p.fill(255, 100, 100);
    p.beginShape();
    for (let i = 0; i < 3; i++) {
      const angle = i * p.TWO_PI / 3 - p.PI / 2;
      p.vertex(px + p.cos(angle) * 18, py + p.sin(angle) * 18);
    }
    p.endShape(p.CLOSE);
    
    if (isSelected) {
      p.noFill();
      p.stroke(255, 255, 100);
      p.strokeWeight(3);
      p.ellipse(px, py, 45, 45);
      p.noStroke();
    }
    
    // HP bar
    const hpRatio = enemy.hp / enemy.maxHp;
    p.fill(40, 40, 40);
    p.rect(px - 15, py + 20, 30, 4);
    p.fill(...(hpRatio > 0.5 ? [100, 255, 100] : hpRatio > 0.25 ? [255, 200, 100] : [255, 100, 100]));
    p.rect(px - 15, py + 20, 30 * hpRatio, 4);
    
    // Level
    p.fill(255, 200, 100);
    p.textSize(9);
    p.textAlign(p.CENTER, p.TOP);
    p.text(`Lv${enemy.level}`, px, py + 26);
  });
  
  // Draw battle animations
  if (gameState.currentAnimation) {
    const elapsed = Date.now() - gameState.currentAnimation.startTime;
    const progress = Math.min(elapsed / gameState.currentAnimation.duration, 1);
    
    const actor = gameState.currentAnimation.actor;
    const target = gameState.currentAnimation.target;
    
    const ax = gridX + actor.gridX * cellSize + cellSize / 2;
    const ay = gridY + actor.gridY * cellSize + cellSize / 2;
    const tx = gridX + target.gridX * cellSize + cellSize / 2;
    const ty = gridY + target.gridY * cellSize + cellSize / 2;
    
    if (gameState.currentAnimation.type === "attack" || gameState.currentAnimation.type === "magic") {
      const x = p.lerp(ax, tx, progress);
      const y = p.lerp(ay, ty, progress);
      
      p.fill(255, 255, 100, 255 * (1 - progress));
      p.noStroke();
      p.ellipse(x, y, 15, 15);
      
      if (progress > 0.7) {
        p.fill(255, 100, 100, 255 * (1 - (progress - 0.7) / 0.3));
        p.textSize(16);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("HIT!", tx, ty - 30);
      }
    }
    
    if (progress >= 1) {
      gameState.currentAnimation = null;
    }
  }
  
  // UI Panel
  const panelX = 350;
  const panelY = 50;
  const panelW = 230;
  const panelH = 300;
  
  p.fill(30, 25, 45, 230);
  p.stroke(100, 90, 120);
  p.strokeWeight(2);
  p.rect(panelX, panelY, panelW, panelH);
  
  p.noStroke();
  p.fill(255, 220, 100);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Floor: ${gameState.currentFloor}/${gameState.maxFloor}`, panelX + 10, panelY + 10);
  p.text(`Score: ${gameState.score}`, panelX + 10, panelY + 30);
  
  // Battle phase info
  let phaseText = "";
  switch (gameState.battlePhase) {
    case BATTLE_PHASES.SELECT_CHARACTER:
      phaseText = "Select Party Member";
      break;
    case BATTLE_PHASES.SELECT_ACTION:
      phaseText = "Select Action";
      break;
    case BATTLE_PHASES.SELECT_TARGET:
      phaseText = "Select Target";
      break;
    case BATTLE_PHASES.EXECUTING:
      phaseText = "Executing...";
      break;
    case BATTLE_PHASES.ENEMY_TURN:
      phaseText = "Enemy Turn";
      break;
  }
  
  p.fill(200, 200, 255);
  p.text(phaseText, panelX + 10, panelY + 55);
  
  // Menu rendering based on phase
  let yOffset = panelY + 85;
  
  if (gameState.battlePhase === BATTLE_PHASES.SELECT_CHARACTER) {
    p.fill(255);
    p.textSize(12);
    p.text("Party:", panelX + 10, yOffset);
    yOffset += 20;
    
    gameState.party.forEach((member, idx) => {
      const isSelected = idx === gameState.selectedCharacterIndex;
      p.fill(...(isSelected ? [255, 255, 100] : [200, 200, 200]));
      p.text(`${member.name} Lv${member.level}`, panelX + 15, yOffset);
      yOffset += 15;
      p.textSize(10);
      p.fill(...(isSelected ? [220, 220, 180] : [150, 150, 150]));
      p.text(`HP: ${member.hp}/${member.maxHp}`, panelX + 20, yOffset);
      p.text(`MP: ${member.mp}/${member.maxMp}`, panelX + 120, yOffset);
      yOffset += 20;
      p.textSize(12);
    });
  } else if (gameState.battlePhase === BATTLE_PHASES.SELECT_ACTION) {
    const character = gameState.party[gameState.selectedCharacterIndex];
    const actions = getAvailableActions(character);
    
    p.fill(255);
    p.textSize(12);
    p.text(`${character.name}'s Actions:`, panelX + 10, yOffset);
    yOffset += 20;
    
    actions.forEach((action, idx) => {
      const isSelected = idx === gameState.selectedActionIndex;
      p.fill(...(isSelected ? [255, 255, 100] : [200, 200, 200]));
      const costText = action.cost > 0 ? ` (${action.cost} MP)` : "";
      p.text(`${action.name}${costText}`, panelX + 15, yOffset);
      yOffset += 18;
    });
  } else if (gameState.battlePhase === BATTLE_PHASES.SELECT_TARGET) {
    const character = gameState.party[gameState.selectedCharacterIndex];
    const actions = getAvailableActions(character);
    const action = actions[gameState.selectedActionIndex];
    const targets = getValidTargets(action);
    
    p.fill(255);
    p.textSize(12);
    p.text("Select Target:", panelX + 10, yOffset);
    yOffset += 20;
    
    targets.forEach((target, idx) => {
      const isSelected = idx === gameState.selectedTargetIndex;
      p.fill(...(isSelected ? [255, 255, 100] : [200, 200, 200]));
      const targetName = target.isEnemy ? target.name : target.name;
      p.text(`${targetName} (HP: ${target.hp})`, panelX + 15, yOffset);
      yOffset += 18;
    });
  }
  
  // Transmutation menu
  if (gameState.transmutationMenu) {
    renderTransmutationMenu(p);
  }
  
  // Stats bar at bottom
  p.fill(30, 25, 45, 230);
  p.rect(0, CANVAS_HEIGHT - 35, CANVAS_WIDTH, 35);
  p.fill(200, 200, 200);
  p.textSize(11);
  p.textAlign(p.LEFT, p.CENTER);
  p.text(`Skills: ${gameState.party[0]?.skills.length || 0}`, 10, CANVAS_HEIGHT - 17);
  p.text(`Items: ${gameState.inventory.length}`, 120, CANVAS_HEIGHT - 17);
  p.text(`Battles Won: ${gameState.battlesWon}`, 230, CANVAS_HEIGHT - 17);
  p.text(`[SHIFT] Transmute`, 420, CANVAS_HEIGHT - 17);
}

function renderTransmutationMenu(p) {
  p.fill(0, 0, 0, 200);
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  const menuX = 150;
  const menuY = 100;
  const menuW = 300;
  const menuH = 200;
  
  p.fill(40, 35, 55);
  p.stroke(120, 110, 140);
  p.strokeWeight(2);
  p.rect(menuX, menuY, menuW, menuH);
  
  p.noStroke();
  p.fill(255, 220, 100);
  p.textSize(16);
  p.textAlign(p.CENTER, p.TOP);
  p.text("TRANSMUTATION KILN", menuX + menuW / 2, menuY + 10);
  
  p.fill(200, 200, 200);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text("Place 2 items to transmute:", menuX + 20, menuY + 40);
  
  // Kiln slots
  let yOffset = menuY + 65;
  gameState.kilnItems.forEach((item, idx) => {
    p.fill(100, 90, 120);
    p.rect(menuX + 20, yOffset, 260, 20);
    p.fill(255, 255, 255);
    p.text(item.name, menuX + 25, yOffset + 3);
    yOffset += 25;
  });
  
  if (gameState.kilnItems.length < 2) {
    p.fill(150, 150, 150);
    p.text("Add items from inventory...", menuX + 20, yOffset + 10);
  }
  
  p.fill(200, 200, 200);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(11);
  p.text("Press Z to close", menuX + menuW / 2, menuY + menuH - 25);
}

function renderPauseOverlay(p) {
  p.fill(255, 255, 255);
  p.textSize(14);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
}

function renderGameOverScreen(p) {
  p.background(20, 15, 30);
  
  const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
  
  p.fill(...(isWin ? [100, 255, 100] : [255, 100, 100]));
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text(isWin ? "VICTORY!" : "DEFEAT", CANVAS_WIDTH / 2, 100);
  
  p.fill(255, 255, 255);
  p.textSize(18);
  
  if (isWin) {
    p.text("You conquered the Miden Tower!", CANVAS_WIDTH / 2, 150);
  } else {
    p.text("Your party has fallen...", CANVAS_WIDTH / 2, 150);
  }
  
  p.textSize(16);
  p.fill(220, 220, 220);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 200);
  p.text(`Floors Cleared: ${gameState.currentFloor - 1}`, CANVAS_WIDTH / 2, 230);
  p.text(`Battles Won: ${gameState.battlesWon}`, CANVAS_WIDTH / 2, 260);
  
  if (gameState.party.length > 0) {
    p.text(`Party Level: ${gameState.party[0].level}`, CANVAS_WIDTH / 2, 290);
    p.text(`Skills Unlocked: ${gameState.party[0].skills.length}`, CANVAS_WIDTH / 2, 320);
  }
  
  p.fill(255, 255, 100);
  p.textSize(18);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
}