// renderer.js - Rendering functions

import { gameState, GAME_PHASE, CANVAS_WIDTH, CANVAS_HEIGHT, GRID_CONFIG, TILE_TYPES, WEAPONS } from './globals.js';

export function renderGame(p) {
  p.background(40, 40, 50);
  
  switch (gameState.gamePhase) {
    case GAME_PHASE.START:
      renderStartScreen(p);
      break;
    case GAME_PHASE.PLAYING:
      renderPlaying(p);
      if (gameState.shopOpen) {
        renderShop(p);
      }
      break;
    case GAME_PHASE.PAUSED:
      renderPlaying(p);
      if (gameState.shopOpen) {
        renderShop(p);
      }
      break;
    case GAME_PHASE.LEVEL_TRANSITION:
      renderLevelTransition(p);
      break;
    case GAME_PHASE.GAME_OVER_WIN:
      renderGameOver(p, true);
      break;
    case GAME_PHASE.GAME_OVER_LOSE:
      renderGameOver(p, false);
      break;
  }
}

function renderStartScreen(p) {
  p.push();
  
  // New main title: "press enter to begin"
  p.fill(255); // White color
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36); // Larger text size for the main message
  p.text('press enter to begin', CANVAS_WIDTH / 2, 120); // Centered where the old title was
  
  // High Score
  p.textSize(20);
  p.fill(255, 255, 100);
  p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 160); // Adjusted Y position
  
  // Instructions (preserved as they do not contain the game name)
  p.textSize(14);
  p.fill(220, 220, 220);
  p.textAlign(p.CENTER, p.CENTER);
  
  const instructions = [
    'Navigate levels to reach the exit!',
    '',
    'Move: ARROW KEYS or WASD',
    'Shoot: SPACEBAR | Shop: S KEY',
    'Interact: E KEY | Heal (100 gold): H',
    '',
    'BUY WEAPONS at the shop!',
    'DEFEAT ALL enemies to unlock the exit!',
    'Enemy types: Normal, Fast, Tank, Ranged'
  ];
  
  let y = 190; // Adjusted Y position to accommodate new title
  instructions.forEach(line => {
    p.text(line, CANVAS_WIDTH / 2, y);
    y += 18;
  });
  
  p.pop();
}

function renderPlaying(p) {
  if (!gameState.currentMap || !gameState.player) return;
  
  // Render UI at top (before map so it doesn't overlap)
  renderUI(p);
  
  // Render event message at top if active (between UI and grid)
  if (gameState.eventMessageTimer > 0) {
    renderEventMessage(p);
  }
  
  // Render map
  renderMap(p, gameState.currentMap);
  
  // Render projectiles (both player and enemy)
  if (gameState.projectiles && gameState.projectiles.length > 0) {
    gameState.projectiles.forEach(proj => {
      if (proj.active) {
        proj.render(p);
      }
    });
  }
  
  // Render enemies
  if (gameState.enemies && gameState.enemies.length > 0) {
    gameState.enemies.forEach(enemy => {
      enemy.render(p);
    });
  }
  
  // Render player
  gameState.player.render(p);
  
  // Render interaction prompt
  if (gameState.needsInteraction) {
    renderInteractionPrompt(p);
  }
}

function renderMap(p, map) {
  const tileSize = GRID_CONFIG.tileSize;
  const offsetX = GRID_CONFIG.offsetX;
  const offsetY = GRID_CONFIG.offsetY;
  
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const tile = map.tiles[y][x];
      const screenX = offsetX + x * tileSize;
      const screenY = offsetY + y * tileSize;
      
      // Base tile
      if (tile.type === TILE_TYPES.WALL) {
        p.fill(60, 60, 70);
      } else if (tile.visited) {
        p.fill(200, 200, 210);
      } else {
        p.fill(150, 150, 160);
      }
      
      p.stroke(100, 100, 110);
      p.strokeWeight(1);
      p.rect(screenX, screenY, tileSize, tileSize);
      
      // Tile content
      if (tile.type === TILE_TYPES.EXIT) {
        // Check if all enemies defeated
        const activeEnemies = gameState.enemies.filter(e => e.active).length;
        if (activeEnemies > 0) {
          // Locked exit
          p.fill(150, 50, 50);
          p.noStroke();
          p.rect(screenX + 3, screenY + 3, tileSize - 6, tileSize - 6);
          p.fill(255, 100, 100);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(16);
          p.text('🔒', screenX + tileSize / 2, screenY + tileSize / 2);
        } else {
          // Unlocked exit
          p.fill(50, 255, 50);
          p.noStroke();
          p.rect(screenX + 3, screenY + 3, tileSize - 6, tileSize - 6);
          p.fill(0);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(20);
          p.text('E', screenX + tileSize / 2, screenY + tileSize / 2);
        }
      } else if (!tile.interacted) {
        renderTileIcon(p, tile.type, screenX + tileSize / 2, screenY + tileSize / 2);
      }
    }
  }
}

function renderTileIcon(p, type, x, y) {
  p.push();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(18);
  p.strokeWeight(1);
  
  switch (type) {
    case TILE_TYPES.EVENT_TREASURE:
      p.fill(255, 215, 0);
      p.stroke(200, 150, 0);
      p.text('★', x, y);
      break;
    case TILE_TYPES.EVENT_TRAP:
      p.fill(200, 50, 50);
      p.stroke(150, 0, 0);
      p.text('!', x, y);
      break;
    case TILE_TYPES.EVENT_ENEMY:
      p.fill(255, 100, 100);
      p.stroke(200, 0, 0);
      p.text('☠', x, y);
      break;
    case TILE_TYPES.EVENT_NPC:
      p.fill(150, 150, 255);
      p.stroke(100, 100, 200);
      p.text('N', x, y);
      break;
    case TILE_TYPES.EVENT_MYSTERY:
      p.fill(200, 150, 255);
      p.stroke(150, 100, 200);
      p.text('?', x, y);
      break;
    case TILE_TYPES.WEAPON:
      p.fill(255, 150, 50);
      p.stroke(200, 100, 0);
      p.text('⚔', x, y);
      break;
  }
  p.pop();
}

function renderUI(p) {
  p.push();
  
  // HP Bar
  const hpBarX = 10;
  const hpBarY = 10;
  const hpBarWidth = 150;
  const hpBarHeight = 18;
  
  p.fill(80, 80, 80);
  p.stroke(200, 200, 200);
  p.strokeWeight(2);
  p.rect(hpBarX, hpBarY, hpBarWidth, hpBarHeight);
  
  const hpPercent = gameState.player.hp / gameState.player.maxHP;
  const hpColor = hpPercent > 0.5 ? [50, 255, 50] : hpPercent > 0.25 ? [255, 200, 50] : [255, 50, 50];
  p.fill(...hpColor);
  p.noStroke();
  p.rect(hpBarX + 2, hpBarY + 2, (hpBarWidth - 4) * hpPercent, hpBarHeight - 4);
  
  p.fill(255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(11);
  p.text(`HP: ${gameState.player.hp}/${gameState.player.maxHP}`, hpBarX + 5, hpBarY + 3);
  
  // Gold/Score
  p.fill(255, 215, 0);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(16);
  p.text(`GOLD: ${gameState.score}`, CANVAS_WIDTH - 10, 10);
  
  // Current weapon
  const weapon = WEAPONS[gameState.currentWeapon];
  p.fill(...weapon.color);
  p.textSize(14);
  p.text(`${weapon.icon} ${weapon.name}`, CANVAS_WIDTH - 10, 30);
  
  // Level
  p.fill(150, 200, 255);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(18);
  p.text(`LEVEL ${gameState.currentLevel}`, CANVAS_WIDTH / 2, 10);
  
  // Enemy count
  const activeEnemies = gameState.enemies.filter(e => e.active).length;
  p.fill(255, 100, 100);
  p.textSize(12);
  p.text(`Enemies: ${activeEnemies}`, CANVAS_WIDTH / 2, 32);
  
  // Controls hint
  p.fill(180, 180, 180);
  p.textSize(10);
  p.text('SPACE: Shoot | E: Interact | H: Heal | S: Shop', CANVAS_WIDTH / 2, 48);
  
  p.pop();
}

function renderShop(p) {
  p.push();
  
  // Overlay
  p.fill(0, 0, 0, 180);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Shop box
  const boxWidth = 520;
  const boxHeight = 340;
  const boxX = (CANVAS_WIDTH - boxWidth) / 2;
  const boxY = (CANVAS_HEIGHT - boxHeight) / 2;
  
  p.fill(40, 40, 50);
  p.stroke(255, 215, 0);
  p.strokeWeight(3);
  p.rect(boxX, boxY, boxWidth, boxHeight, 10);
  
  // Title
  p.fill(255, 215, 0);
  p.noStroke();
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(28);
  p.text('🏪 WEAPON SHOP 🏪', CANVAS_WIDTH / 2, boxY + 15);
  
  p.textSize(14);
  p.fill(200, 200, 200);
  p.text(`Your Gold: ${gameState.score}`, CANVAS_WIDTH / 2, boxY + 50);
  
  // Weapons list
  const weaponList = ["PISTOL", "SWORD", "SHOTGUN", "RIFLE", "LASER"];
  const startY = boxY + 85;
  const spacing = 48;
  
  weaponList.forEach((weaponKey, index) => {
    const weapon = WEAPONS[weaponKey];
    const y = startY + index * spacing;
    const owned = gameState.ownedWeapons.includes(weaponKey);
    const equipped = gameState.currentWeapon === weaponKey;
    
    // Background
    if (equipped) {
      p.fill(100, 200, 100, 100);
      p.noStroke();
      p.rect(boxX + 10, y - 5, boxWidth - 20, 40, 5);
    }
    
    // Weapon info
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(18);
    
    if (owned) {
      p.fill(100, 255, 100);
    } else {
      p.fill(255, 255, 255);
    }
    
    const numberKey = index + 1;
    p.text(`${numberKey}. ${weapon.icon} ${weapon.name}`, boxX + 30, y + 10);
    
    // Stats
    p.textSize(12);
    p.fill(200, 200, 200);
    p.text(`DMG: ${weapon.damage} | SPD: ${6 - weapon.speed}`, boxX + 220, y + 10);
    
    // Price or status
    p.textAlign(p.RIGHT, p.CENTER);
    p.textSize(14);
    if (owned) {
      if (equipped) {
        p.fill(100, 255, 100);
        p.text('EQUIPPED', boxX + boxWidth - 30, y + 10);
      } else {
        p.fill(255, 215, 0);
        p.text('OWNED', boxX + boxWidth - 30, y + 10);
      }
    } else {
      if (gameState.score >= weapon.cost) {
        p.fill(255, 215, 0);
      } else {
        p.fill(150, 150, 150);
      }
      p.text(`${weapon.cost} gold`, boxX + boxWidth - 30, y + 10);
    }
  });
  
  // Instructions
  p.fill(255, 255, 100);
  p.textAlign(p.CENTER, p.TOP);
  p.textSize(12);
  p.text('Press 1-5 to buy/equip weapons | Press S to close shop', CANVAS_WIDTH / 2, boxY + boxHeight - 30);
  
  p.pop();
}

function renderEventMessage(p) {
  p.push();
  
  const boxWidth = 500;
  const boxHeight = 35;
  const boxX = (CANVAS_WIDTH - boxWidth) / 2;
  const boxY = 64;
  
  // Box background
  p.fill(0, 0, 0, 220);
  p.stroke(255, 220, 100);
  p.strokeWeight(2);
  p.rect(boxX, boxY, boxWidth, boxHeight, 5);
  
  // Message text
  p.fill(255, 255, 255);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(14);
  p.text(gameState.eventMessage, CANVAS_WIDTH / 2, boxY + boxHeight / 2);
  
  p.pop();
}

function renderInteractionPrompt(p) {
  p.push();
  
  const tile = gameState.currentMap.getTileAt(gameState.player.gridX, gameState.player.gridY);
  let message = 'Press E to interact';
  
  // Check if exit and enemies alive
  if (tile && tile.type === 'EXIT') {
    const activeEnemies = gameState.enemies.filter(e => e.active).length;
    if (activeEnemies > 0) {
      message = `Defeat ${activeEnemies} enemies to unlock exit!`;
      p.fill(255, 100, 100, 220);
    } else {
      message = 'Press E to exit level';
      p.fill(100, 255, 100, 220);
    }
  } else {
    p.fill(255, 255, 100, 220);
  }
  
  p.stroke(0);
  p.strokeWeight(2);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(13);
  const promptY = 85;
  p.text(message, CANVAS_WIDTH / 2, promptY);
  
  p.pop();
}

function renderLevelTransition(p) {
  p.background(20, 20, 30);
  
  p.push();
  
  p.fill(100, 255, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text(`Level ${gameState.currentLevel - 1} Complete!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
  
  p.fill(200, 200, 255);
  p.textSize(24);
  p.text(`Preparing Level ${gameState.currentLevel}...`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
  
  p.pop();
}

function renderGameOver(p, isWin) {
  p.background(20, 20, 30);
  
  p.push();
  
  if (isWin) {
    p.fill(100, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(56);
    p.text('YOU WIN!', CANVAS_WIDTH / 2, 100);
    
    p.fill(255, 220, 100);
    p.textSize(28);
    p.text('★ Congratulations! ★', CANVAS_WIDTH / 2, 160);
  } else {
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text('GAME OVER', CANVAS_WIDTH / 2, 120);
  }
  
  p.fill(255, 255, 255);
  p.textSize(24);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  
  if (gameState.score > gameState.highScore) {
    p.fill(255, 220, 100);
    p.textSize(20);
    p.text('NEW HIGH SCORE!', CANVAS_WIDTH / 2, 260);
  } else {
    p.fill(200, 200, 200);
    p.textSize(18);
    p.text(`High Score: ${gameState.highScore}`, CANVAS_WIDTH / 2, 260);
  }
  
  p.fill(150, 200, 255);
  p.textSize(20);
  p.text('Press R to Restart', CANVAS_WIDTH / 2, 330);
  
  p.pop();
}
// Removed renderPausedOverlay function as requested