// render.js - Rendering functions

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, MAX_ENERGY, GAME_PHASES, GRAVITY_GUN_RANGE } from './globals.js';

export function renderGame(p) {
  // Background
  p.background(20, 15, 30);

  // Stars
  p.fill(255, 255, 200, 150);
  p.noStroke();
  for (let i = 0; i < 50; i++) {
    let x = (i * 73) % CANVAS_WIDTH;
    let y = (i * 97) % CANVAS_HEIGHT;
    p.circle(x, y, 2);
  }

  // Render platforms
  for (let platform of gameState.platforms) {
    platform.render(p);
  }

  // Render hazards
  for (let hazard of gameState.hazards) {
    hazard.render(p, p.frameCount);
  }

  // Render goal
  if (gameState.goal) {
    gameState.goal.render(p, p.frameCount);
  }

  // Render blocks
  for (let block of gameState.blocks) {
    block.render(p);
  }

  // Render enemies
  for (let enemy of gameState.enemies) {
    enemy.render(p);
  }

  // Render gravity gun beam
  if (gameState.gravityGunActive && gameState.targetedObject && gameState.player) {
    p.push();
    let playerCenterX = gameState.player.x + gameState.player.width / 2;
    let playerCenterY = gameState.player.y + gameState.player.height / 2;
    let targetX = gameState.targetedObject.x + gameState.targetedObject.width / 2;
    let targetY = gameState.targetedObject.y + gameState.targetedObject.height / 2;

    // Beam color based on mode
    if (gameState.gravityGunMode === "ATTRACT") {
      p.stroke(100, 150, 255, 150);
    } else {
      p.stroke(255, 100, 100, 150);
    }
    p.strokeWeight(3);
    p.line(playerCenterX, playerCenterY, targetX, targetY);

    // Particles along beam
    p.noStroke();
    for (let i = 0; i < 5; i++) {
      let t = i / 5 + (p.frameCount * 0.05) % 1;
      let px = p.lerp(playerCenterX, targetX, t);
      let py = p.lerp(playerCenterY, targetY, t);
      p.fill(200, 200, 255, 200);
      p.circle(px, py, 4);
    }
    p.pop();
  }

  // Render player
  if (gameState.player) {
    gameState.player.render(p);

    // Gravity gun indicator on player
    if (gameState.gravityGunActive) {
      p.push();
      p.noFill();
      if (gameState.gravityGunMode === "ATTRACT") {
        p.stroke(100, 150, 255);
      } else {
        p.stroke(255, 100, 100);
      }
      p.strokeWeight(2);
      let pulseSize = 5 + Math.sin(p.frameCount * 0.2) * 2;
      p.circle(gameState.player.x + gameState.player.width / 2, 
               gameState.player.y + gameState.player.height / 2, 
               gameState.player.width + pulseSize);
      p.pop();
    }
  }

  // UI
  renderUI(p);
}

export function renderUI(p) {
  p.push();

  // Health
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.LEFT, p.TOP);
  p.text('Health:', 10, 10);
  for (let i = 0; i < gameState.player.health; i++) {
    p.fill(255, 50, 50);
    p.noStroke();
    p.circle(70 + i * 20, 18, 12);
  }

  // Score
  p.fill(255);
  p.text(`Score: ${gameState.score}`, 10, 30);

  // Energy bar
  p.fill(255);
  p.text('Energy:', 10, 50);
  p.noFill();
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(70, 45, 100, 15);
  
  let energyWidth = (gameState.energy / MAX_ENERGY) * 96;
  p.noStroke();
  p.fill(100, 200, 255);
  p.rect(72, 47, energyWidth, 11);

  // Gravity gun mode
  p.fill(255);
  p.textSize(12);
  p.text(`Gun Mode: ${gameState.gravityGunMode}`, 10, 70);
  p.textSize(10);
  p.fill(200);
  p.text('(Press Z to toggle)', 10, 85);

  // Paused indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 100);
    p.textSize(16);
    p.textAlign(p.RIGHT, p.TOP);
    p.text('PAUSED', CANVAS_WIDTH - 10, 10);
  }

  p.pop();
}

export function renderStartScreen(p) {
  p.background(20, 15, 30);

  // Stars
  p.fill(255, 255, 200, 150);
  p.noStroke();
  for (let i = 0; i < 100; i++) {
    let x = (i * 73) % CANVAS_WIDTH;
    let y = (i * 97) % CANVAS_HEIGHT;
    let twinkle = Math.sin(p.frameCount * 0.1 + i) * 0.5 + 0.5;
    p.circle(x, y, 2 * twinkle);
  }

  p.push();
  
  // Title
  p.fill(100, 200, 255);
  p.textSize(48);
  p.textAlign(p.CENTER, p.CENTER);
  p.text('BEEP', CANVAS_WIDTH / 2, 80);

  // Subtitle
  p.fill(150, 220, 255);
  p.textSize(16);
  p.text('Gravity Gun Platformer', CANVAS_WIDTH / 2, 120);

  // Instructions
  p.fill(255);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  p.text('Navigate through dangerous levels using your gravity gun!', CANVAS_WIDTH / 2, 160);
  p.text('Manipulate blocks to solve puzzles and defeat enemies.', CANVAS_WIDTH / 2, 180);
  p.text('Reach the green goal platform to win!', CANVAS_WIDTH / 2, 200);

  // Controls
  p.textSize(12);
  p.fill(200, 200, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.text('Arrow Keys: Move', 200, 240);
  p.text('Space: Jump (hold for higher)', 200, 260);
  p.text('Shift: Fire Gravity Gun', 200, 280);
  p.text('Z: Toggle Gun Mode', 200, 300);

  // Mode explanation
  p.fill(255, 200, 100);
  p.textSize(11);
  p.text('ATTRACT mode: Pull blocks toward you', 180, 325);
  p.text('REPEL mode: Push blocks away from you', 180, 342);

  // Start prompt
  p.fill(100, 255, 100);
  p.textSize(18);
  p.textAlign(p.CENTER, p.CENTER);
  let blink = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(100, 255, 100, 255 * blink);
  p.text('PRESS ENTER TO START', CANVAS_WIDTH / 2, 370);

  p.pop();
}

export function renderGameOver(p, won) {
  p.background(20, 15, 30);

  p.push();
  
  if (won) {
    p.fill(100, 255, 100);
    p.textSize(48);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('LEVEL COMPLETE!', CANVAS_WIDTH / 2, 120);

    p.fill(255, 255, 100);
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);

    p.fill(200, 200, 255);
    p.textSize(16);
    p.text('You mastered the gravity gun!', CANVAS_WIDTH / 2, 220);
  } else {
    p.fill(255, 100, 100);
    p.textSize(48);
    p.textAlign(p.CENTER, p.CENTER);
    p.text('GAME OVER', CANVAS_WIDTH / 2, 120);

    p.fill(255, 200, 100);
    p.textSize(24);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 180);

    p.fill(200, 200, 255);
    p.textSize(16);
    p.text('Better luck next time!', CANVAS_WIDTH / 2, 220);
  }

  // Restart prompt
  p.fill(255);
  p.textSize(18);
  p.textAlign(p.CENTER, p.CENTER);
  let blink = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 255, 255 * blink);
  p.text('PRESS R TO RESTART', CANVAS_WIDTH / 2, 320);

  p.pop();
}