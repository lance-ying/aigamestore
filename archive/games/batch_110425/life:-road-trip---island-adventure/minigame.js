// minigame.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Minigame {
  constructor() {
    this.cursorX = CANVAS_WIDTH / 2;
    this.cursorY = CANVAS_HEIGHT / 2;
  }
  
  update(p) {
    if (!gameState.minigameActive) return;
    
    gameState.minigameTimer--;
    
    if (gameState.minigameTimer <= 0) {
      this.endMinigame(p);
      return;
    }
    
    // Handle cursor movement
    if (p.keyIsDown(37)) this.cursorX -= 5; // LEFT
    if (p.keyIsDown(39)) this.cursorX += 5; // RIGHT
    if (p.keyIsDown(38)) this.cursorY -= 5; // UP
    if (p.keyIsDown(40)) this.cursorY += 5; // DOWN
    
    this.cursorX = p.constrain(this.cursorX, 0, CANVAS_WIDTH);
    this.cursorY = p.constrain(this.cursorY, 0, CANVAS_HEIGHT);
    
    // Game-specific updates
    if (gameState.minigameType === "SCUBA") {
      this.updateScuba(p);
    } else if (gameState.minigameType === "SANDCASTLE") {
      this.updateSandcastle(p);
    } else if (gameState.minigameType === "SURFING") {
      this.updateSurfing(p);
    }
  }
  
  updateScuba(p) {
    // Move fish
    for (let target of gameState.minigameTargets) {
      if (!target.caught) {
        target.x += target.vx;
        target.y += target.vy;
        
        // Bounce off walls
        if (target.x < 20 || target.x > CANVAS_WIDTH - 20) target.vx *= -1;
        if (target.y < 20 || target.y > CANVAS_HEIGHT - 20) target.vy *= -1;
        
        // Check collision with cursor
        const dist = Math.sqrt((target.x - this.cursorX) ** 2 + (target.y - this.cursorY) ** 2);
        if (dist < 25 && gameState.zPressed) {
          target.caught = true;
          gameState.minigameScore++;
        }
      }
    }
  }
  
  updateSandcastle(p) {
    // Build by pressing Z repeatedly
    if (gameState.zPressed && gameState.minigameTargets[0].progress < gameState.minigameTargets[0].maxProgress) {
      gameState.minigameTargets[0].progress += 2;
      gameState.minigameScore = Math.floor(gameState.minigameTargets[0].progress);
    }
  }
  
  updateSurfing(p) {
    // Move waves
    for (let target of gameState.minigameTargets) {
      target.x -= 4;
      
      // Check collision
      if (!target.hit && Math.abs(target.x - this.cursorX) < 30 && Math.abs(target.y - this.cursorY) < 30) {
        if (gameState.zPressed) {
          target.hit = true;
          gameState.minigameScore++;
        }
      }
    }
  }
  
  endMinigame(p) {
    const baseReward = 5;
    let multiplier = 1;
    
    if (gameState.minigameType === "SCUBA") {
      multiplier = gameState.minigameScore / 8;
    } else if (gameState.minigameType === "SANDCASTLE") {
      multiplier = gameState.minigameScore / 100;
    } else if (gameState.minigameType === "SURFING") {
      multiplier = gameState.minigameScore / 10;
    }
    
    const reward = Math.floor(baseReward * multiplier * 3);
    gameState.memories += reward;
    gameState.score += reward;
    
    gameState.minigameActive = false;
    gameState.currentMessage = `Minigame complete! +${reward} memories`;
    gameState.messageTimer = 150;
  }
  
  draw(p) {
    if (!gameState.minigameActive) return;
    
    // Overlay background
    p.push();
    p.fill(0, 0, 0, 200);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    p.pop();
    
    // Draw game-specific elements
    if (gameState.minigameType === "SCUBA") {
      this.drawScuba(p);
    } else if (gameState.minigameType === "SANDCASTLE") {
      this.drawSandcastle(p);
    } else if (gameState.minigameType === "SURFING") {
      this.drawSurfing(p);
    }
    
    // Timer
    p.push();
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(20);
    p.text(`Time: ${Math.ceil(gameState.minigameTimer / 60)}s`, CANVAS_WIDTH / 2, 20);
    p.text(`Score: ${gameState.minigameScore}`, CANVAS_WIDTH / 2, 50);
    p.pop();
    
    // Instructions
    p.push();
    p.fill(255, 255, 0);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(14);
    p.text("Arrow Keys: Move | Z: Action", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
    p.pop();
  }
  
  drawScuba(p) {
    p.push();
    p.textAlign(p.CENTER, p.TOP);
    p.fill(100, 200, 255);
    p.textSize(16);
    p.text("Catch the fish!", CANVAS_WIDTH / 2, 80);
    p.pop();
    
    // Draw fish
    for (let target of gameState.minigameTargets) {
      if (!target.caught) {
        p.push();
        p.fill(255, 150, 0);
        p.stroke(200, 100, 0);
        p.strokeWeight(2);
        p.ellipse(target.x, target.y, 20, 12);
        p.triangle(target.x - 10, target.y, target.x - 16, target.y - 6, target.x - 16, target.y + 6);
        p.fill(0);
        p.noStroke();
        p.circle(target.x + 4, target.y - 2, 3);
        p.pop();
      }
    }
    
    // Draw cursor (net)
    p.push();
    p.noFill();
    p.stroke(255, 255, 255);
    p.strokeWeight(3);
    p.circle(this.cursorX, this.cursorY, 40);
    p.line(this.cursorX, this.cursorY + 20, this.cursorX, this.cursorY + 40);
    p.pop();
  }
  
  drawSandcastle(p) {
    p.push();
    p.textAlign(p.CENTER, p.TOP);
    p.fill(255, 200, 100);
    p.textSize(16);
    p.text("Build the sandcastle! Press Z repeatedly!", CANVAS_WIDTH / 2, 80);
    p.pop();
    
    const progress = gameState.minigameTargets[0].progress;
    const maxProgress = gameState.minigameTargets[0].maxProgress;
    
    // Progress bar
    p.push();
    p.fill(100);
    p.rect(150, 120, 300, 30);
    p.fill(255, 215, 0);
    p.rect(150, 120, 300 * (progress / maxProgress), 30);
    p.pop();
    
    // Sandcastle visualization
    const height = (progress / maxProgress) * 150;
    p.push();
    p.fill(244, 164, 96);
    p.stroke(210, 140, 70);
    p.strokeWeight(2);
    
    const baseY = 350;
    p.rect(CANVAS_WIDTH / 2 - 40, baseY - height * 0.6, 80, height * 0.6);
    if (progress > 30) {
      p.rect(CANVAS_WIDTH / 2 - 25, baseY - height, 50, height * 0.4);
    }
    if (progress > 60) {
      p.triangle(CANVAS_WIDTH / 2, baseY - height - 20, CANVAS_WIDTH / 2 - 20, baseY - height, CANVAS_WIDTH / 2 + 20, baseY - height);
    }
    p.pop();
  }
  
  drawSurfing(p) {
    p.push();
    p.textAlign(p.CENTER, p.TOP);
    p.fill(100, 200, 255);
    p.textSize(16);
    p.text("Ride the waves! Press Z when aligned!", CANVAS_WIDTH / 2, 80);
    p.pop();
    
    // Draw waves
    for (let target of gameState.minigameTargets) {
      if (target.x > -50 && target.x < CANVAS_WIDTH + 50) {
        p.push();
        if (target.hit) {
          p.fill(255, 215, 0);
        } else {
          p.fill(64, 164, 223);
        }
        p.noStroke();
        p.ellipse(target.x, target.y, 40, 60);
        p.fill(255, 255, 255, 100);
        p.ellipse(target.x - 5, target.y - 10, 15, 20);
        p.pop();
      }
    }
    
    // Draw cursor (surfer)
    p.push();
    p.fill(255, 100, 100);
    p.stroke(200, 50, 50);
    p.strokeWeight(2);
    p.ellipse(this.cursorX, this.cursorY, 20, 30);
    p.fill(255, 200, 100);
    p.rect(this.cursorX - 15, this.cursorY + 10, 30, 5);
    p.pop();
  }
}