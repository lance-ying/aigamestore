// battle_ui.js - Battle UI rendering
import { CANVAS_WIDTH, CANVAS_HEIGHT, BATTLE_PHASES, gameState } from './globals.js';
import { ENEMY_ACTS } from './enemies.js';

export function drawBattleUI(p) {
  // Draw battle box
  p.push();
  p.fill(0);
  p.stroke(255);
  p.strokeWeight(4);
  p.rect(CANVAS_WIDTH / 2 - 140, 240, 280, 130);
  p.pop();
  
  // Draw HP bar
  // Moved to the right as requested
  const hpBarX = 230;
  const hpBarY = 210;
  
  p.push();
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(`HP: ${gameState.playerHP} / ${gameState.maxHP}`, hpBarX, hpBarY);
  
  // HP bar background
  p.fill(100, 0, 0);
  p.rect(hpBarX + 80, hpBarY, 100, 16);
  
  // HP bar fill
  const hpPercent = gameState.playerHP / gameState.maxHP;
  p.fill(255, 255, 0);
  p.rect(hpBarX + 80, hpBarY, 100 * hpPercent, 16);
  p.pop();
  
  // Draw enemy
  if (gameState.currentEnemy) {
    p.push();
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(18);
    p.text(gameState.currentEnemy.name, CANVAS_WIDTH / 2, 100);
    
    // Enemy HP bar
    const enemyHpPercent = gameState.currentEnemy.hp / gameState.currentEnemy.maxHP;
    p.fill(100, 0, 0);
    p.rect(CANVAS_WIDTH / 2 - 80, 120, 160, 10);
    p.fill(0, 255, 0);
    p.rect(CANVAS_WIDTH / 2 - 80, 120, 160 * enemyHpPercent, 10);
    
    // Draw simple enemy sprite
    drawEnemySprite(p, gameState.currentEnemy.name);
    p.pop();
  }
}

function drawEnemySprite(p, enemyName) {
  const x = CANVAS_WIDTH / 2;
  const y = 170;
  
  p.push();
  p.noStroke();
  
  switch (enemyName) {
    case "Froggit":
      // Green frog
      p.fill(100, 200, 100);
      p.ellipse(x, y, 50, 40);
      p.fill(50, 150, 50);
      p.ellipse(x - 12, y - 8, 12, 12); // Eye
      p.ellipse(x + 12, y - 8, 12, 12); // Eye
      p.fill(0);
      p.circle(x - 12, y - 8, 6);
      p.circle(x + 12, y - 8, 6);
      break;
      
    case "Whimsun":
      // Pink butterfly
      p.fill(255, 150, 255);
      p.ellipse(x - 15, y, 25, 35);
      p.ellipse(x + 15, y, 25, 35);
      p.fill(200, 100, 200);
      p.ellipse(x, y, 12, 30);
      // Antennae
      p.stroke(100);
      p.strokeWeight(2);
      p.line(x - 3, y - 15, x - 8, y - 25);
      p.line(x + 3, y - 15, x + 8, y - 25);
      break;
      
    case "Moldsmal":
      // Green blob
      p.fill(150, 255, 150);
      p.ellipse(x, y, 45, 35);
      p.fill(100, 200, 100);
      p.ellipse(x, y - 5, 30, 20);
      p.fill(50, 150, 50);
      p.circle(x - 8, y - 3, 8);
      p.circle(x + 8, y - 3, 8);
      break;
      
    case "Tsunderplane":
      // Blue airplane
      p.fill(150, 150, 255);
      p.triangle(x - 30, y, x + 30, y, x, y - 20);
      p.rect(x - 15, y, 30, 15);
      p.fill(100, 100, 200);
      p.triangle(x - 25, y + 5, x - 5, y + 5, x - 15, y + 15);
      p.triangle(x + 25, y + 5, x + 5, y + 5, x + 15, y + 15);
      break;
      
    case "Loox":
      // Large eye
      p.fill(255);
      p.ellipse(x, y, 50, 50);
      p.fill(100, 150, 255);
      p.circle(x, y, 30);
      p.fill(0);
      p.circle(x, y, 15);
      p.fill(255);
      p.circle(x - 3, y - 3, 5);
      break;
      
    case "Migosp":
      // Yellow bug swarm
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * p.TWO_PI;
        const bx = x + p.cos(angle) * 20;
        const by = y + p.sin(angle) * 15;
        p.fill(255, 200, 100);
        p.ellipse(bx, by, 10, 15);
        p.fill(200, 150, 50);
        p.ellipse(bx, by, 6, 10);
      }
      break;
      
    case "Knight Knight":
      // Armored knight
      p.fill(180, 180, 200);
      p.rect(x - 20, y - 10, 40, 35);
      p.fill(150, 150, 180);
      p.ellipse(x, y - 20, 35, 30);
      p.fill(100, 100, 120);
      p.rect(x - 25, y, 10, 20); // Arm
      p.rect(x + 15, y, 10, 20); // Arm
      p.fill(200, 200, 220);
      p.triangle(x + 20, y - 5, x + 30, y + 10, x + 20, y + 10); // Sword
      break;
      
    case "Madjick":
      // Magical orb creature
      p.fill(255, 100, 255);
      p.ellipse(x, y, 40, 40);
      p.fill(200, 50, 200);
      p.triangle(x, y - 25, x - 15, y + 20, x + 15, y + 20);
      // Orbiting particles
      const time = p.frameCount * 0.1;
      for (let i = 0; i < 3; i++) {
        const angle = time + (i * p.TWO_PI / 3);
        const px = x + p.cos(angle) * 30;
        const py = y + p.sin(angle) * 30;
        p.fill(255, 150, 255);
        p.circle(px, py, 8);
      }
      break;
      
    case "Final Froggit":
      // Larger, more imposing frog
      p.fill(50, 180, 50);
      p.ellipse(x, y, 60, 50);
      p.fill(30, 130, 30);
      p.ellipse(x - 15, y - 10, 16, 16); // Eye
      p.ellipse(x + 15, y - 10, 16, 16); // Eye
      p.fill(0);
      p.circle(x - 15, y - 10, 8);
      p.circle(x + 15, y - 10, 8);
      p.fill(255, 200, 0);
      p.stroke(255, 200, 0);
      p.strokeWeight(2);
      p.line(x - 20, y + 10, x - 30, y + 20); // Crown
      p.line(x, y + 5, x, y - 5);
      p.line(x + 20, y + 10, x + 30, y + 20);
      break;
  }
  p.pop();
}

export function drawMenu(p) {
  // Menu box
  p.push();
  p.fill(0);
  p.stroke(255);
  p.strokeWeight(3);
  p.rect(40, 380, 520, 50);
  
  const options = ["FIGHT", "ACT", "ITEM", "SPARE"];
  const spacing = 130;
  const startX = 80;
  
  p.noStroke();
  for (let i = 0; i < options.length; i++) {
    const x = startX + i * spacing;
    
    // Highlight selected
    if (gameState.menuSelection === i) {
      p.fill(255, 255, 0);
      p.text("❤", x - 20, 405);
    }
    
    // Yellow text if can spare
    if (options[i] === "SPARE" && gameState.currentEnemy && gameState.currentEnemy.canSpare) {
      p.fill(255, 255, 0);
    } else {
      p.fill(255);
    }
    
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(16);
    p.text(options[i], x, 405);
  }
  p.pop();
}

export function drawSubMenu(p, subMenuType) {
  p.push();
  p.fill(0);
  p.stroke(255);
  p.strokeWeight(3);
  p.rect(40, 300, 520, 70);
  
  let options = [];
  
  if (subMenuType === "ACT" && gameState.currentEnemy) {
    options = ENEMY_ACTS[gameState.currentEnemy.name] || [];
    options.push("Check");
  } else if (subMenuType === "ITEM") {
    options = gameState.inventory; // Use dynamic inventory
  }
  
  const cols = 2;
  const spacing = 260;
  const rowHeight = 25;
  
  p.noStroke();
  if (options.length === 0) {
    p.fill(255);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(14);
    p.text("No items.", 80, 315);
  } else {
    for (let i = 0; i < options.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = 80 + col * spacing;
      const y = 315 + row * rowHeight;
      
      if (gameState.subMenuSelection === i) {
        p.fill(255, 255, 0);
        p.text("❤", x - 20, y);
      }
      
      p.fill(255);
      p.textAlign(p.LEFT, p.CENTER);
      p.textSize(14);
      p.text(options[i], x, y);
    }
  }
  p.pop();
}

export function drawDialogue(p, text) {
  p.push();
  p.fill(0);
  p.stroke(255);
  p.strokeWeight(3);
  p.rect(40, 300, 520, 70);
  
  p.fill(255);
  p.noStroke();
  p.textAlign(p.LEFT, p.TOP);
  p.textSize(14);
  p.text(text, 60, 315, 480, 50);
  p.pop();
}

export function drawAttackBar(p, timing) {
  const barWidth = 300;
  const barHeight = 20;
  const x = CANVAS_WIDTH / 2 - barWidth / 2;
  const y = 320;
  
  p.push();
  
  // Background
  p.fill(50);
  p.stroke(255);
  p.strokeWeight(2);
  p.rect(x, y, barWidth, barHeight);
  
  // Target zone
  p.fill(100, 255, 100, 100);
  p.noStroke();
  const targetStart = barWidth * 0.4;
  const targetWidth = barWidth * 0.2;
  p.rect(x + targetStart, y, targetWidth, barHeight);
  
  // Moving indicator
  const indicatorX = x + (timing / 100) * barWidth;
  p.fill(255, 255, 0);
  p.rect(indicatorX - 3, y, 6, barHeight);
  
  p.fill(255);
  p.textAlign(p.CENTER, p.BOTTOM);
  p.textSize(14);
  p.text("Press Z when in the green zone!", CANVAS_WIDTH / 2, y - 5);
  
  p.pop();
}

export function drawVictoryMessage(p, message) {
  p.push();
  p.fill(0, 200);
  p.noStroke();
  p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  p.fill(255, 255, 0);
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(24);
  p.text(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  
  p.textSize(16);
  p.text("(Press Z to continue)", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
  p.pop();
}