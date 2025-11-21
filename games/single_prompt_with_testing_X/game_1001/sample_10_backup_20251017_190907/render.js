import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState, GAME_PHASES, REALMS } from './globals.js';

export function renderStartScreen(p) {
  p.background(20, 20, 40);
  
  // Title
  p.fill(255, 215, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  p.text("LEGEND OF THE REALMS", CANVAS_WIDTH / 2, 60);
  
  // Description
  p.fill(200, 200, 200);
  p.textSize(14);
  p.text("Explore dungeons, solve puzzles, and defeat bosses!", CANVAS_WIDTH / 2, 120);
  p.text("Collect keys and special items to unlock new areas.", CANVAS_WIDTH / 2, 140);
  p.text("Switch between Light and Dark realms for secrets.", CANVAS_WIDTH / 2, 160);
  
  // Instructions
  p.textSize(12);
  p.text("CONTROLS:", CANVAS_WIDTH / 2, 200);
  p.text("Arrow Keys: Move", CANVAS_WIDTH / 2, 220);
  p.text("Z: Sword Attack (Hold to charge Spin Attack)", CANVAS_WIDTH / 2, 240);
  p.text("Space: Use Equipped Item", CANVAS_WIDTH / 2, 260);
  p.text("Shift: Dash (with Dash Boots)", CANVAS_WIDTH / 2, 280);
  p.text("ESC: Pause", CANVAS_WIDTH / 2, 300);
  
  // Start prompt
  p.fill(255, 255, 100);
  p.textSize(16);
  const blink = Math.floor(p.frameCount / 30) % 2;
  if (blink === 0) {
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 350);
  }
}

export function renderGame(p) {
  // Background based on realm
  if (gameState.currentRealm === REALMS.LIGHT) {
    p.background(60, 80, 60);
  } else {
    p.background(40, 30, 60);
  }
  
  // Render entities
  for (const entity of gameState.entities) {
    if (entity && entity.active && entity.render) {
      entity.render();
    }
  }
  
  // Render projectiles
  for (const proj of gameState.projectiles) {
    if (proj.active) {
      proj.render();
    }
  }
  
  // Render particles
  for (const particle of gameState.particles) {
    if (particle.active) {
      particle.render();
    }
  }
  
  // UI
  renderUI(p);
}

function renderUI(p) {
  // Health bar
  p.fill(0, 0, 0, 150);
  p.rect(10, 10, 120, 20);
  p.fill(255, 0, 0);
  const healthWidth = (gameState.player.health / gameState.player.maxHealth) * 110;
  p.rect(15, 13, healthWidth, 14);
  
  // Score
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text(`Score: ${gameState.score}`, 10, 40);
  
  // Keys
  p.text(`Keys: ${gameState.smallKeys}`, 10, 60);
  if (gameState.hasBigKey) {
    p.fill(255, 215, 0);
    p.text("BIG KEY", 10, 80);
  }
  
  // Current item
  if (gameState.equippedItem) {
    p.fill(255, 255, 255);
    p.text(`Item: ${gameState.equippedItem}`, 10, 100);
  }
  
  // Realm indicator
  p.textAlign(p.RIGHT, p.TOP);
  const realmColor = gameState.currentRealm === REALMS.LIGHT ? [255, 255, 100] : [180, 150, 255];
  p.fill(...realmColor);
  p.text(`${gameState.currentRealm} REALM`, CANVAS_WIDTH - 10, 10);
  
  // Room coordinates
  p.fill(200, 200, 200);
  p.textSize(10);
  p.text(`Room: ${gameState.currentRoom.x}, ${gameState.currentRoom.y}`, CANVAS_WIDTH - 10, 30);
  
  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.textAlign(p.RIGHT, p.TOP);
    p.fill(255, 255, 255);
    p.textSize(14);
    p.text("PAUSED", CANVAS_WIDTH - 10, 50);
  }
}

export function renderGameOver(p) {
  p.background(0, 0, 0);
  
  p.fill(255, 255, 255);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(32);
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    p.fill(100, 255, 100);
    p.text("VICTORY!", CANVAS_WIDTH / 2, 120);
    p.fill(255, 255, 255);
    p.textSize(16);
    p.text("You have conquered the dungeons!", CANVAS_WIDTH / 2, 160);
  } else {
    p.fill(255, 100, 100);
    p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
    p.fill(255, 255, 255);
    p.textSize(16);
    p.text("Your quest has ended...", CANVAS_WIDTH / 2, 160);
  }
  
  p.textSize(20);
  p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
  p.text(`Bosses Defeated: ${gameState.bossesDefeated}`, CANVAS_WIDTH / 2, 250);
  p.text(`Treasures: ${gameState.dungeonTreasures}`, CANVAS_WIDTH / 2, 280);
  
  p.fill(255, 255, 100);
  p.textSize(16);
  const blink = Math.floor(p.frameCount / 30) % 2;
  if (blink === 0) {
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 340);
  }
}