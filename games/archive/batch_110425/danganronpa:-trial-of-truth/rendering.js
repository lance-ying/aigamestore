import { gameState, GAME_PHASES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function drawStartScreen(p) {
  p.background(20, 10, 30);
  
  // Animated background
  for (let i = 0; i < 50; i++) {
    const x = (i * 37 + p.frameCount * 0.5) % CANVAS_WIDTH;
    const y = (i * 23) % CANVAS_HEIGHT;
    p.fill(100, 50, 150, 30);
    p.noStroke();
    p.circle(x, y, 20);
  }
  
  // Title
  p.fill(255, 50, 100);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(36);
  p.text("DANGANRONPA", CANVAS_WIDTH / 2, 80);
  
  p.fill(255, 200, 220);
  p.textSize(24);
  p.text("Trial of Truth", CANVAS_WIDTH / 2, 120);
  
  // Description box
  p.fill(40, 20, 60, 200);
  p.rect(50, 160, CANVAS_WIDTH - 100, 140);
  
  p.fill(255, 255, 255);
  p.textSize(14);
  p.textAlign(p.CENTER, p.TOP);
  p.text("Expose the lies in the Nonstop Debate!", CANVAS_WIDTH / 2, 170);
  
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  p.text("← → : Select Truth Bullet", 80, 200);
  p.text("SPACE: Fire Truth Bullet", 80, 220);
  p.text("Z: Absorb Statement", 80, 240);
  p.text("ESC: Pause", 80, 260);
  
  p.textAlign(p.CENTER, p.CENTER);
  p.fill(255, 255, 100);
  p.textSize(16);
  const flash = Math.sin(p.frameCount * 0.1) * 0.5 + 0.5;
  p.fill(255, 255, 100, 150 + flash * 105);
  p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 330);
}

export function drawGame(p) {
  p.background(30, 20, 50);
  
  // Animated background
  p.push();
  for (let i = 0; i < 30; i++) {
    const x = (i * 47 + p.frameCount * 0.3) % CANVAS_WIDTH;
    const y = (i * 31) % CANVAS_HEIGHT;
    p.fill(80, 40, 100, 20);
    p.noStroke();
    p.circle(x, y, 15);
  }
  p.pop();
  
  // Draw statements
  for (const stmt of gameState.statements) {
    drawStatement(p, stmt);
  }
  
  // Draw fired bullets
  for (const bullet of gameState.firedBullets) {
    drawFiredBullet(p, bullet);
  }
  
  // Draw effects
  for (const effect of gameState.effects) {
    drawEffect(p, effect);
  }
  
  // Draw player
  drawPlayer(p);
  
  // Draw UI
  drawUI(p);
  
  // Pause indicator
  if (gameState.gamePhase === GAME_PHASES.PAUSED) {
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }
}

function drawStatement(p, stmt) {
  p.push();
  
  // Speaker name background
  p.fill(60, 40, 80, stmt.alpha);
  p.rect(stmt.x - 10, stmt.y - 25, 100, 20);
  
  p.fill(255, 200, 255, stmt.alpha);
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(12);
  p.text(stmt.speaker, stmt.x, stmt.y - 15);
  
  // Statement background
  const bgColor = stmt.absorbable ? [40, 80, 100] : [50, 30, 70];
  p.fill(...bgColor, stmt.alpha * 0.9);
  p.rect(stmt.x, stmt.y - 10, 300, 30, 5);
  
  // Statement text
  const textColor = stmt.exposed ? [100, 100, 100] : [255, 255, 255];
  p.fill(...textColor, stmt.alpha);
  p.textSize(14);
  p.text(stmt.text, stmt.x + 5, stmt.y + 5);
  
  // Weak point indicator
  if (stmt.hasWeakPoint && !stmt.exposed) {
    const wpX = stmt.getWeakPointX();
    const wpY = stmt.getWeakPointY();
    
    // Pulsing circle
    const pulseSize = 15 + Math.sin(p.frameCount * 0.15) * 5;
    p.noFill();
    p.stroke(255, 100, 150, stmt.alpha);
    p.strokeWeight(3);
    p.circle(wpX, wpY + 5, pulseSize);
    
    p.fill(255, 50, 100, stmt.alpha);
    p.noStroke();
    p.circle(wpX, wpY + 5, 8);
  }
  
  // Absorbable indicator
  if (stmt.absorbable && !stmt.exposed) {
    p.fill(100, 200, 255, stmt.alpha);
    p.noStroke();
    p.textSize(10);
    p.textAlign(p.RIGHT, p.TOP);
    p.text("[Z]", stmt.x + 290, stmt.y - 8);
  }
  
  p.pop();
}

function drawFiredBullet(p, bullet) {
  p.push();
  
  // Bullet trail
  p.stroke(255, 200, 100, 150);
  p.strokeWeight(3);
  p.line(bullet.startX, bullet.startY, bullet.x, bullet.y);
  
  // Bullet
  p.fill(255, 220, 100);
  p.noStroke();
  p.circle(bullet.x, bullet.y, 12);
  
  p.fill(255, 100, 50);
  p.circle(bullet.x, bullet.y, 6);
  
  p.pop();
}

function drawPlayer(p) {
  const player = gameState.player;
  
  p.push();
  
  // Platform
  p.fill(80, 60, 100);
  p.rect(player.x - 60, player.y + 25, 120, 10);
  
  // Player character (simple avatar)
  p.fill(100, 80, 150);
  p.ellipse(player.x, player.y - 10, 30, 40);
  
  // Head
  p.fill(255, 220, 180);
  p.circle(player.x, player.y - 30, 25);
  
  // Eyes
  p.fill(50, 50, 50);
  p.circle(player.x - 6, player.y - 32, 4);
  p.circle(player.x + 6, player.y - 32, 4);
  
  // Weapon indicator
  p.stroke(255, 200, 100);
  p.strokeWeight(2);
  p.noFill();
  p.circle(player.x, player.y, 40 + Math.sin(p.frameCount * 0.1) * 5);
  
  p.pop();
}

function drawUI(p) {
  // Influence gauge
  p.push();
  p.fill(40, 20, 60, 200);
  p.rect(10, 10, 200, 50, 5);
  
  p.fill(255, 255, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text("INFLUENCE", 20, 15);
  
  for (let i = 0; i < gameState.maxInfluencePoints; i++) {
    if (i < gameState.influencePoints) {
      p.fill(255, 100, 150);
    } else {
      p.fill(80, 40, 60);
    }
    p.circle(30 + i * 35, 45, 20);
  }
  p.pop();
  
  // Score
  p.push();
  p.fill(40, 20, 60, 200);
  p.rect(CANVAS_WIDTH - 160, 10, 150, 30, 5);
  
  p.fill(255, 255, 100);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(14);
  p.text(`SCORE: ${gameState.score}`, CANVAS_WIDTH - 20, 18);
  p.pop();
  
  // Progress
  p.push();
  p.fill(40, 20, 60, 200);
  p.rect(CANVAS_WIDTH - 160, 50, 150, 30, 5);
  
  p.fill(150, 255, 150);
  p.textAlign(p.RIGHT, p.TOP);
  p.textSize(12);
  p.text(`EXPOSED: ${gameState.contradictionsExposed}/${gameState.requiredContradictions}`, CANVAS_WIDTH - 20, 58);
  p.pop();
  
  // Truth Bullets inventory
  p.push();
  p.fill(40, 20, 60, 220);
  p.rect(50, CANVAS_HEIGHT - 60, CANVAS_WIDTH - 100, 50, 5);
  
  p.fill(255, 200, 255);
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(12);
  p.text("TRUTH BULLETS", 60, CANVAS_HEIGHT - 55);
  
  // Draw bullets
  for (let i = 0; i < gameState.truthBullets.length; i++) {
    const bullet = gameState.truthBullets[i];
    const x = 60 + i * 120;
    const y = CANVAS_HEIGHT - 35;
    
    const isSelected = i === gameState.selectedBulletIndex;
    
    // Bullet slot
    if (isSelected) {
      p.fill(255, 200, 100, 150);
      p.stroke(255, 220, 100);
      p.strokeWeight(3);
    } else {
      p.fill(60, 40, 80);
      p.stroke(100, 80, 120);
      p.strokeWeight(1);
    }
    p.rect(x, y - 5, 110, 25, 3);
    
    // Bullet icon
    p.noStroke();
    const bulletColor = getBulletTypeColor(bullet.type);
    p.fill(...bulletColor);
    p.circle(x + 10, y + 7, 12);
    
    // Bullet name
    p.fill(255, 255, 255);
    p.textSize(10);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(bullet.name.substring(0, 14), x + 20, y + 7);
  }
  
  p.pop();
}

function getBulletTypeColor(type) {
  switch (type) {
    case 'weapon': return [255, 100, 100];
    case 'alibi': return [100, 255, 100];
    case 'location': return [100, 100, 255];
    case 'time': return [255, 255, 100];
    case 'evidence': return [255, 100, 255];
    default: return [200, 200, 200];
  }
}

function drawEffect(p, effect) {
  p.push();
  
  if (effect.type === 'expose') {
    p.fill(255, 255, 100, effect.alpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(24);
    p.text(effect.data.text, effect.x, effect.y);
    
    // Explosion effect
    const radius = effect.frame * 3;
    p.noFill();
    p.stroke(255, 200, 100, effect.alpha * 0.5);
    p.strokeWeight(3);
    p.circle(effect.x, effect.y, radius);
  } else if (effect.type === 'miss' || effect.type === 'damage') {
    p.fill(255, 100, 100, effect.alpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(18);
    p.text(effect.data.text, effect.x, effect.y);
  } else if (effect.type === 'hit') {
    p.fill(100, 255, 100, effect.alpha);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(16);
    p.text(effect.data.text, effect.x, effect.y);
  }
  
  p.pop();
}

export function drawGameOver(p) {
  p.background(20, 10, 30);
  
  // Animated background
  for (let i = 0; i < 100; i++) {
    const x = (i * 23 + p.frameCount * 0.2) % CANVAS_WIDTH;
    const y = (i * 17) % CANVAS_HEIGHT;
    const isWin = gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN;
    p.fill(isWin ? 100 : 150, isWin ? 150 : 50, isWin ? 100 : 50, 20);
    p.noStroke();
    p.circle(x, y, 15);
  }
  
  if (gameState.gamePhase === GAME_PHASES.GAME_OVER_WIN) {
    // Win screen
    p.fill(255, 255, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("TRUTH REVEALED!", CANVAS_WIDTH / 2, 120);
    
    p.fill(100, 255, 100);
    p.textSize(24);
    p.text("All contradictions exposed!", CANVAS_WIDTH / 2, 180);
    
    p.fill(255, 255, 255);
    p.textSize(20);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
    p.text(`Influence Remaining: ${gameState.influencePoints}`, CANVAS_WIDTH / 2, 260);
  } else {
    // Lose screen
    p.fill(255, 100, 100);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("INFLUENCE DEPLETED!", CANVAS_WIDTH / 2, 120);
    
    p.fill(255, 150, 150);
    p.textSize(24);
    p.text("You failed to expose the truth...", CANVAS_WIDTH / 2, 180);
    
    p.fill(255, 255, 255);
    p.textSize(20);
    p.text(`Score: ${gameState.score}`, CANVAS_WIDTH / 2, 230);
    p.text(`Contradictions: ${gameState.contradictionsExposed}/${gameState.requiredContradictions}`, CANVAS_WIDTH / 2, 260);
  }
  
  p.fill(255, 255, 200);
  p.textSize(18);
  const flash = Math.sin(p.frameCount * 0.15) * 0.5 + 0.5;
  p.fill(255, 255, 200, 150 + flash * 105);
  p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 330);
}