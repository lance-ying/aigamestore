// rendering.js - All rendering functions

import { gameState, GAME_PHASES, BATTLE_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Character } from './character.js';

export function renderStartScreen(p) {
  p.background(20, 10, 40);
  
  // Title with glow effect
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  p.fill(100, 50, 150, 100);
  p.text("RPG Crystal Osa", CANVAS_WIDTH / 2 + 3, 80 + 3);
  p.fill(200, 150, 255);
  p.text("RPG Crystal Osa", CANVAS_WIDTH / 2, 80);
  p.pop();
  
  // Description
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.fill(200, 200, 220);
  p.text("Lead your party through dangerous dungeons", CANVAS_WIDTH / 2, 140);
  p.text("Battle monsters, gain experience, and craft equipment", CANVAS_WIDTH / 2, 160);
  p.text("Defeat the boss on Floor 5 to win!", CANVAS_WIDTH / 2, 180);
  p.pop();
  
  // Instructions
  p.push();
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  p.fill(180, 180, 200);
  const startY = 220;
  p.text("CONTROLS:", 100, startY);
  p.text("Arrow Keys: Move, Navigate menus", 100, startY + 20);
  p.text("Space: Confirm, Advance dialogue", 100, startY + 40);
  p.text("Shift: Cancel, Go back", 100, startY + 60);
  p.text("Z: Party menu (during exploration)", 100, startY + 80);
  p.text("ESC: Pause    R: Restart", 100, startY + 100);
  p.pop();
  
  // Start prompt
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 100, pulse * 255);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
  p.pop();
}

export function renderDungeon(p, dungeon) {
  const tileSize = 32;
  const offsetX = 50;
  const offsetY = 50;
  
  // Draw dungeon tiles
  for (let y = 0; y < dungeon.height; y++) {
    for (let x = 0; x < dungeon.width; x++) {
      const tile = dungeon.tiles[y][x];
      const screenX = offsetX + x * tileSize;
      const screenY = offsetY + y * tileSize;
      
      // Tile background
      if (tile.type === "WALL") {
        p.fill(60, 60, 80);
        p.stroke(40, 40, 60);
      } else if (tile.type === "FLOOR") {
        p.fill(100, 100, 120);
        p.stroke(80, 80, 100);
      } else if (tile.type === "STAIRS") {
        p.fill(200, 180, 100);
        p.stroke(180, 160, 80);
      } else if (tile.type === "ENTRANCE") {
        p.fill(100, 200, 100);
        p.stroke(80, 180, 80);
      }
      
      p.strokeWeight(1);
      p.rect(screenX, screenY, tileSize, tileSize);
      
      // Fog of war
      if (!tile.visited && tile.type === "FLOOR") {
        p.fill(0, 0, 0, 150);
        p.noStroke();
        p.rect(screenX, screenY, tileSize, tileSize);
      }
    }
  }
  
  // Draw player
  const playerScreenX = offsetX + gameState.dungeonX * tileSize + tileSize / 2;
  const playerScreenY = offsetY + gameState.dungeonY * tileSize + tileSize / 2;
  p.fill(100, 150, 255);
  p.noStroke();
  p.ellipse(playerScreenX, playerScreenY, tileSize * 0.6, tileSize * 0.6);
  p.fill(255, 255, 255);
  p.ellipse(playerScreenX - 3, playerScreenY - 3, 4, 4);
  p.ellipse(playerScreenX + 3, playerScreenY - 3, 4, 4);
  
  // UI
  renderDungeonUI(p);
}

export function renderDungeonUI(p) {
  // Floor indicator
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(10, 10, 150, 50);
  p.fill(255, 255, 255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`Floor: ${gameState.currentFloor}/${gameState.maxFloor}`, 20, 20);
  p.text(`Ores: ${gameState.totalOres}`, 20, 40);
  p.pop();
  
  // Party status
  p.push();
  p.fill(0, 0, 0, 150);
  p.noStroke();
  p.rect(CANVAS_WIDTH - 160, 10, 150, 120);
  p.fill(255, 255, 255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  let yPos = 20;
  gameState.party.forEach((char, i) => {
    const hpPercent = char.hp / char.maxHP;
    p.fill(hpPercent > 0.5 ? 100 : hpPercent > 0.25 ? 200 : 255, hpPercent > 0.25 ? 255 : 100, 100);
    p.text(`${char.name.substring(0, 8)}`, CANVAS_WIDTH - 150, yPos);
    p.text(`HP:${char.hp}/${char.maxHP}`, CANVAS_WIDTH - 150, yPos + 15);
    yPos += 30;
  });
  p.pop();
}

export function renderBattle(p, battle) {
  p.background(40, 20, 20);
  
  // Battle background
  p.fill(60, 30, 30);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT * 0.6);
  
  // Draw allies
  const allyStartX = 100;
  const allyY = CANVAS_HEIGHT * 0.5;
  battle.allies.forEach((ally, i) => {
    const x = allyStartX + i * 80;
    renderCharacter(p, ally, x, allyY, true);
  });
  
  // Draw enemies
  const enemyStartX = CANVAS_WIDTH - 150;
  const enemyY = CANVAS_HEIGHT * 0.4;
  battle.enemies.forEach((enemy, i) => {
    const x = enemyStartX - i * 100;
    renderCharacter(p, enemy, x, enemyY, false);
  });
  
  // Animation effects
  if (battle.currentAnimation) {
    renderBattleAnimation(p, battle);
  }
  
  // Battle UI
  renderBattleUI(p, battle);
}

export function renderCharacter(p, character, x, y, isAlly) {
  if (!character.isAlive()) {
    // Draw defeated character
    p.push();
    p.fill(80, 80, 80);
    p.noStroke();
    p.ellipse(x, y + 20, 40, 10);
    p.pop();
    return;
  }
  
  p.push();
  
  // Body
  if (isAlly) {
    if (character.heroType === "WARRIOR") {
      p.fill(150, 100, 50);
    } else if (character.heroType === "MAGE") {
      p.fill(100, 100, 200);
    } else if (character.heroType === "ROGUE") {
      p.fill(80, 120, 80);
    } else {
      p.fill(120, 80, 120);
    }
  } else {
    p.fill(150, 50, 50);
  }
  
  p.noStroke();
  p.ellipse(x, y, 40, 50);
  
  // Head
  p.fill(220, 180, 150);
  p.ellipse(x, y - 20, 30, 30);
  
  // Eyes
  p.fill(0);
  p.ellipse(x - 6, y - 22, 4, 4);
  p.ellipse(x + 6, y - 22, 4, 4);
  
  // HP bar
  const hpPercent = character.hp / character.maxHP;
  p.fill(100, 100, 100);
  p.rect(x - 20, y + 35, 40, 4);
  p.fill(hpPercent > 0.5 ? 100 : 255, hpPercent > 0.25 ? 255 : 100, 100);
  p.rect(x - 20, y + 35, 40 * hpPercent, 4);
  
  p.pop();
}

export function renderBattleAnimation(p, battle) {
  const anim = battle.currentAnimation;
  const progress = battle.animationTimer / anim.duration;
  
  if (anim.type === "ATTACK") {
    p.push();
    p.stroke(255, 200, 0);
    p.strokeWeight(3);
    p.line(
      p.lerp(50, CANVAS_WIDTH - 50, progress),
      CANVAS_HEIGHT * 0.4,
      p.lerp(50, CANVAS_WIDTH - 50, progress) + 20,
      CANVAS_HEIGHT * 0.4 - 20
    );
    p.pop();
  } else if (anim.type === "SKILL") {
    p.push();
    p.fill(150, 100, 255, (1 - progress) * 200);
    p.noStroke();
    p.ellipse(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.4, progress * 100, progress * 100);
    p.pop();
  }
}

export function renderBattleUI(p, battle) {
  // Battle log
  p.push();
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(10, CANVAS_HEIGHT - 120, CANVAS_WIDTH - 20, 60);
  p.fill(255, 255, 255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  battle.logMessages.forEach((msg, i) => {
    p.text(msg, 20, CANVAS_HEIGHT - 110 + i * 15);
  });
  p.pop();
  
  const currentActor = battle.getCurrentActor();
  if (!currentActor || currentActor.type === "ENEMY" || currentActor.actionReady) {
    return;
  }
  
  // Action menu
  if (battle.actionState === "SELECTING_ACTION") {
    renderActionMenu(p, battle, currentActor);
  } else if (battle.actionState === "SELECTING_SKILL") {
    renderSkillMenu(p, battle, currentActor);
  } else if (battle.actionState === "SELECTING_TARGET") {
    renderTargetSelection(p, battle, currentActor);
  }
}

export function renderActionMenu(p, battle, actor) {
  const menuX = CANVAS_WIDTH / 2 - 100;
  const menuY = CANVAS_HEIGHT - 50;
  
  p.push();
  p.fill(0, 0, 0, 200);
  p.noStroke();
  p.rect(menuX, menuY - 40, 200, 40);
  
  const actions = ["Attack", "Skill", "Defend"];
  if (actor.canLearn) {
    actions.push("Learn");
  }
  
  p.textSize(14);
  p.textAlign(p.LEFT, p.CENTER);
  actions.forEach((action, i) => {
    if (i === battle.actionMenuSelection) {
      p.fill(255, 255, 100);
    } else {
      p.fill(255, 255, 255);
    }
    p.text(action, menuX + 10 + i * 50, menuY - 20);
  });
  p.pop();
}

export function renderSkillMenu(p, battle, actor) {
  const menuX = CANVAS_WIDTH / 2 - 150;
  const menuY = CANVAS_HEIGHT / 2 - 100;
  
  p.push();
  p.fill(0, 0, 0, 220);
  p.noStroke();
  p.rect(menuX, menuY, 300, 200);
  
  p.fill(255, 255, 255);
  p.textSize(16);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Select Skill", menuX + 150, menuY + 10);
  
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  actor.equippedSkills.forEach((skill, i) => {
    const yPos = menuY + 40 + i * 30;
    if (i === battle.skillSelection) {
      p.fill(255, 255, 100);
    } else if (actor.mp < skill.mpCost) {
      p.fill(150, 150, 150);
    } else {
      p.fill(255, 255, 255);
    }
    p.text(`${skill.name} (${skill.mpCost} MP)`, menuX + 20, yPos);
    p.text(`Power: ${skill.power}`, menuX + 180, yPos);
  });
  
  p.fill(200, 200, 200);
  p.textSize(12);
  p.text(`MP: ${actor.mp}/${actor.maxMP}`, menuX + 20, menuY + 170);
  p.pop();
}

export function renderTargetSelection(p, battle, actor) {
  const action = actor.selectedAction;
  let targets;
  
  if (action.type === "SKILL" && action.skill && action.skill.target.includes("ALLY")) {
    targets = battle.allies.filter(a => a.isAlive());
  } else {
    targets = battle.enemies.filter(e => e.isAlive());
  }
  
  // Highlight selected target
  if (targets.length > 0 && battle.targetSelection < targets.length) {
    const target = targets[battle.targetSelection];
    const isAlly = target.type !== "ENEMY";
    const targetIndex = isAlly ? battle.allies.indexOf(target) : battle.enemies.indexOf(target);
    
    let x, y;
    if (isAlly) {
      x = 100 + targetIndex * 80;
      y = CANVAS_HEIGHT * 0.5;
    } else {
      x = CANVAS_WIDTH - 150 - targetIndex * 100;
      y = CANVAS_HEIGHT * 0.4;
    }
    
    p.push();
    p.noFill();
    p.stroke(255, 255, 0);
    p.strokeWeight(3);
    p.ellipse(x, y, 60, 70);
    p.pop();
  }
}

export function renderPartyMenu(p) {
  const menuX = CANVAS_WIDTH / 2 - 200;
  const menuY = CANVAS_HEIGHT / 2 - 150;
  
  p.push();
  p.fill(0, 0, 0, 230);
  p.noStroke();
  p.rect(menuX, menuY, 400, 300);
  
  p.fill(255, 255, 255);
  p.textSize(18);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Party Status", menuX + 200, menuY + 10);
  
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  let yPos = menuY + 50;
  gameState.party.forEach((char, i) => {
    if (i === gameState.menuSelection) {
      p.fill(255, 255, 100);
    } else {
      p.fill(255, 255, 255);
    }
    
    p.text(`${char.name} - Lv.${char.level}`, menuX + 20, yPos);
    p.text(`HP: ${char.hp}/${char.maxHP}`, menuX + 20, yPos + 20);
    p.text(`MP: ${char.mp}/${char.maxMP}`, menuX + 20, yPos + 40);
    p.text(`ATK: ${char.attack}  DEF: ${char.defense}  SPD: ${char.speed}`, menuX + 20, yPos + 60);
    
    yPos += 80;
  });
  
  p.fill(200, 200, 200);
  p.textSize(12);
  p.text("Press Shift to close", menuX + 20, menuY + 280);
  p.pop();
}

export function renderPauseScreen(p) {
  p.push();
  p.fill(255, 255, 100);
  p.textSize(16);
  p.textAlign(p.RIGHT, p.TOP);
  p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  p.pop();
}

export function renderGameOverScreen(p, isWin) {
  p.background(0, 0, 0, 200);
  
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(48);
  
  if (isWin) {
    p.fill(100, 255, 100);
    p.text("VICTORY!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    p.textSize(20);
    p.fill(255, 255, 255);
    p.text("You have defeated the final boss!", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  } else {
    p.fill(255, 100, 100);
    p.text("GAME OVER", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
    p.textSize(20);
    p.fill(255, 255, 255);
    p.text("Your party has been defeated...", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
  }
  
  p.textSize(16);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  p.text(`Battles Won: ${gameState.battlesWon}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 45);
  p.text(`Ores Collected: ${gameState.totalOres}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70);
  
  p.textSize(18);
  const pulse = Math.sin(p.frameCount * 0.1) * 0.3 + 0.7;
  p.fill(255, 255, 100, pulse * 255);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 120);
  p.pop();
}