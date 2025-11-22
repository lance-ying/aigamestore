import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, WEAPONS, ROBOT_MASTERS, GAME_PHASES } from './globals.js';

export function drawGame(p) {
  // Draw stage
  if (gameState.currentStage) {
    gameState.currentStage.draw(p);
  }

  // Draw entities
  for (let entity of gameState.entities) {
    entity.draw(p);
  }

  // Draw projectiles
  for (let proj of gameState.projectiles) {
    const screenX = proj.x - gameState.camera.x;
    const screenY = proj.y - gameState.camera.y;
    
    p.push();
    p.fill(...proj.color);
    p.noStroke();
    
    if (proj.weapon === 'HYPER_BOMB') {
      p.ellipse(screenX, screenY, 8, 8);
    } else if (proj.weapon === 'FIRE_STORM') {
      p.fill(255, 150, 50);
      p.ellipse(screenX, screenY, 10, 10);
      p.fill(255, 50, 50);
      p.ellipse(screenX, screenY, 6, 6);
    } else if (proj.weapon === 'ICE_SLASHER') {
      p.rect(screenX - 4, screenY - 2, 8, 4);
    } else {
      p.ellipse(screenX, screenY, 6, 6);
    }
    p.pop();
  }

  // Draw drops
  for (let drop of gameState.drops) {
    const screenX = drop.x - gameState.camera.x;
    const screenY = drop.y - gameState.camera.y;
    
    p.push();
    if (drop.type === 'weapon_energy') {
      p.fill(255, 200, 100);
      p.rect(screenX, screenY, 10, 10);
      p.fill(255, 255, 150);
      p.rect(screenX + 2, screenY + 2, 6, 6);
    }
    p.pop();
  }

  // Draw particles
  for (let particle of gameState.particles) {
    const screenX = particle.x - gameState.camera.x;
    const screenY = particle.y - gameState.camera.y;
    
    p.push();
    p.fill(...particle.color, particle.alpha);
    p.noStroke();
    p.ellipse(screenX, screenY, 4, 4);
    p.pop();
  }

  // Draw UI
  drawUI(p);
}

export function drawUI(p) {
  const uiColor = [255, 255, 255];
  
  // Health bar
  p.push();
  p.fill(0, 0, 0, 180);
  p.rect(10, 10, 150, 35);
  
  p.fill(...uiColor);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text('ENERGY', 15, 12);
  
  // Health blocks
  const healthBlocks = 28;
  const blockWidth = 4;
  const blockHeight = 12;
  for (let i = 0; i < healthBlocks; i++) {
    if (i < gameState.playerHealth) {
      p.fill(255, 200, 50);
    } else {
      p.fill(50, 50, 50);
    }
    p.rect(15 + i * blockWidth, 28, blockWidth - 1, blockHeight);
  }
  p.pop();

  // Weapon display
  p.push();
  p.fill(0, 0, 0, 180);
  p.rect(10, 55, 150, 60);
  
  const weaponKey = gameState.unlockedWeapons[gameState.currentWeapon];
  const weapon = WEAPONS[weaponKey];
  
  p.fill(...weapon.color);
  p.textSize(10);
  p.textAlign(p.LEFT, p.TOP);
  p.text(weapon.name, 15, 58);
  
  // Weapon energy
  if (weaponKey !== 'BUSTER') {
    const energy = gameState.weaponEnergy[weaponKey] || 0;
    for (let i = 0; i < 28; i++) {
      if (i < energy) {
        p.fill(...weapon.color);
      } else {
        p.fill(50, 50, 50);
      }
      p.rect(15 + i * 4, 75, 3, 8);
    }
    
    p.fill(255, 255, 255);
    p.textSize(10);
    p.text(`${energy}/28`, 15, 90);
  } else {
    p.fill(255, 255, 255);
    p.textSize(10);
    p.text('UNLIMITED', 15, 90);
  }
  
  p.fill(200, 200, 200);
  p.textSize(8);
  p.text('SHIFT: Switch Weapon', 15, 103);
  p.pop();

  // Boss health bar
  if (gameState.showBossHealthBar && gameState.currentStage && gameState.currentStage.boss) {
    p.push();
    p.fill(0, 0, 0, 180);
    p.rect(CANVAS_WIDTH - 160, 10, 150, 35);
    
    p.fill(255, 255, 255);
    p.textSize(10);
    p.textAlign(p.LEFT, p.TOP);
    p.text('BOSS', CANVAS_WIDTH - 155, 12);
    
    const boss = gameState.currentStage.boss;
    for (let i = 0; i < 28; i++) {
      if (i < boss.health) {
        p.fill(255, 50, 50);
      } else {
        p.fill(50, 50, 50);
      }
      p.rect(CANVAS_WIDTH - 155 + i * 4, 28, 3, 12);
    }
    p.pop();
  }

  // Score and Lives
  p.push();
  p.fill(0, 0, 0, 180);
  p.rect(10, CANVAS_HEIGHT - 45, 120, 35);
  
  p.fill(255, 255, 255);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text(`SCORE: ${gameState.score}`, 15, CANVAS_HEIGHT - 42);
  p.text(`LIVES: ${gameState.lives}`, 15, CANVAS_HEIGHT - 25);
  p.pop();

  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.push();
    p.fill(255, 255, 255);
    p.textSize(14);
    p.textAlign(p.RIGHT, p.TOP);
    p.text('PAUSED', CANVAS_WIDTH - 10, 10);
    p.pop();
  }
}

export function drawStartScreen(p) {
  p.background(20, 30, 50);
  
  // Animated background
  for (let i = 0; i < 10; i++) {
    p.fill(50, 80, 120, 100);
    const offset = (p.frameCount * 0.5) % 400;
    p.rect(i * 100 - offset, 0, 80, CANVAS_HEIGHT);
  }

  // Title
  p.push();
  p.fill(100, 200, 255);
  p.textSize(36);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('MEGA RUNNER', CANVAS_WIDTH / 2, 60);
  
  p.fill(255, 200, 50);
  p.textSize(16);
  p.text('ROBOT MASTER CHALLENGE', CANVAS_WIDTH / 2, 100);
  p.pop();

  // Description
  p.push();
  p.fill(220, 220, 220);
  p.textSize(12);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('Defeat 6 Robot Masters in any order!', CANVAS_WIDTH / 2, 140);
  p.text('Each boss grants a unique weapon.', CANVAS_WIDTH / 2, 160);
  p.text('Use weapon weaknesses to your advantage.', CANVAS_WIDTH / 2, 180);
  p.text('Survive Wily\'s fortress and the final gauntlet!', CANVAS_WIDTH / 2, 200);
  p.pop();

  // Controls
  p.push();
  p.fill(0, 0, 0, 180);
  p.rect(CANVAS_WIDTH / 2 - 140, 230, 280, 110);
  
  p.fill(255, 255, 100);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text('CONTROLS:', CANVAS_WIDTH / 2 - 130, 240);
  
  p.fill(200, 200, 200);
  p.textSize(11);
  p.text('Arrow Keys: Move & Aim', CANVAS_WIDTH / 2 - 130, 260);
  p.text('Z: Jump', CANVAS_WIDTH / 2 - 130, 275);
  p.text('Space: Shoot', CANVAS_WIDTH / 2 - 130, 290);
  p.text('Shift: Cycle Weapons', CANVAS_WIDTH / 2 - 130, 305);
  p.text('ESC: Pause    R: Restart', CANVAS_WIDTH / 2 - 130, 320);
  p.pop();

  // Start prompt
  p.push();
  const flashAlpha = (Math.sin(p.frameCount * 0.1) + 1) * 127.5;
  p.fill(100, 255, 100, flashAlpha);
  p.textSize(18);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 370);
  p.pop();
}

export function drawStageSelect(p) {
  p.background(30, 30, 60);
  
  // Title
  p.push();
  p.fill(255, 255, 255);
  p.textSize(24);
  p.textAlign(p.CENTER, p.TOP);
  p.text('STAGE SELECT', CANVAS_WIDTH / 2, 20);
  p.pop();

  // Robot Master selection
  const cols = 3;
  const rows = 2;
  const boxWidth = 160;
  const boxHeight = 80;
  const startX = (CANVAS_WIDTH - cols * boxWidth) / 2 + 20;
  const startY = 80;

  for (let i = 0; i < ROBOT_MASTERS.length; i++) {
    const rm = ROBOT_MASTERS[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (boxWidth + 10);
    const y = startY + row * (boxHeight + 10);

    // Box
    p.push();
    if (gameState.robotMastersDefeated[rm.name]) {
      p.fill(50, 50, 50, 150);
    } else {
      p.fill(...rm.color.map(c => c * 0.7));
    }
    p.rect(x, y, boxWidth, boxHeight);
    
    // Border
    p.noFill();
    p.stroke(255, 255, 255);
    p.strokeWeight(2);
    p.rect(x, y, boxWidth, boxHeight);
    p.pop();

    // Name
    p.push();
    p.fill(255, 255, 255);
    p.textSize(14);
    p.textAlign(p.CENTER, p.TOP);
    p.text(`${rm.name} MAN`, x + boxWidth / 2, y + 10);
    
    if (gameState.robotMastersDefeated[rm.name]) {
      p.fill(100, 255, 100);
      p.textSize(12);
      p.text('DEFEATED', x + boxWidth / 2, y + 35);
    } else {
      p.fill(200, 200, 200);
      p.textSize(10);
      p.text(`Press ${i + 1}`, x + boxWidth / 2, y + 55);
    }
    p.pop();
  }

  // Wily Stage option
  const allDefeated = ROBOT_MASTERS.every(rm => gameState.robotMastersDefeated[rm.name]);
  if (allDefeated) {
    const wilyY = startY + rows * (boxHeight + 10) + 20;
    
    p.push();
    p.fill(60, 30, 80);
    p.rect(CANVAS_WIDTH / 2 - 100, wilyY, 200, 60);
    
    p.noFill();
    p.stroke(200, 100, 255);
    p.strokeWeight(3);
    p.rect(CANVAS_WIDTH / 2 - 100, wilyY, 200, 60);
    
    p.fill(255, 255, 100);
    p.textSize(18);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('WILY FORTRESS', CANVAS_WIDTH / 2, wilyY + 20);
    
    p.fill(200, 200, 200);
    p.textSize(12);
    p.text('Press 0', CANVAS_WIDTH / 2, wilyY + 45);
    p.pop();
  }

  // Instructions
  p.push();
  p.fill(255, 255, 255);
  p.textSize(11);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.text('Select a stage number to begin', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
  p.pop();
}

export function drawGameOver(p, won) {
  p.background(won ? [30, 60, 30] : [60, 30, 30]);
  
  // Title
  p.push();
  p.fill(won ? [100, 255, 100] : [255, 100, 100]);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(won ? 'VICTORY!' : 'GAME OVER', CANVAS_WIDTH / 2, 120);
  
  // Message
  p.fill(255, 255, 255);
  p.textSize(16);
  if (won) {
    p.text('All Robot Masters Defeated!', CANVAS_WIDTH / 2, 180);
    p.text('The world is safe once again.', CANVAS_WIDTH / 2, 205);
  } else {
    p.text('The battle is lost...', CANVAS_WIDTH / 2, 180);
    p.text('But the fight continues!', CANVAS_WIDTH / 2, 205);
  }
  
  // Score
  p.fill(255, 255, 100);
  p.textSize(20);
  p.text(`FINAL SCORE: ${gameState.score}`, CANVAS_WIDTH / 2, 250);
  
  // Restart prompt
  const flashAlpha = (Math.sin(p.frameCount * 0.1) + 1) * 127.5;
  p.fill(200, 200, 200, flashAlpha);
  p.textSize(16);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 320);
  p.pop();
}