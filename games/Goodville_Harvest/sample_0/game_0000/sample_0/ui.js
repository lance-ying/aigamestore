import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, GAME_PHASES, CROP_TYPES, ANIMAL_TYPES, WORKSHOP_TYPES, QUEST_DATA } from './globals.js';

export class UIManager {
  constructor(p) {
    this.p = p;
  }

  displayStartScreen() {
    const p = this.p;
    p.background(50, 150, 50);
    
    p.fill(255, 255, 200);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("Goodville Harvest", CANVAS_WIDTH / 2, 80);
    
    p.textSize(16);
    p.fill(255);
    p.text("Restore your farm through 5 renovation stages!", CANVAS_WIDTH / 2, 140);
    p.text("Plant crops, raise animals, craft goods, and fulfill orders.", CANVAS_WIDTH / 2, 165);
    p.text("Complete story quests to progress to the next stage.", CANVAS_WIDTH / 2, 190);
    
    p.textSize(14);
    p.text("Arrow Keys/WASD: Pan Camera", CANVAS_WIDTH / 2, 230);
    p.text("Space: Confirm | Shift: Info | Z: Cancel", CANVAS_WIDTH / 2, 250);
    p.text("ESC: Pause | R: Restart", CANVAS_WIDTH / 2, 270);
    
    p.fill(255, 255, 0);
    p.textSize(20);
    p.text("PRESS ENTER TO START", CANVAS_WIDTH / 2, 330);
  }

  displayPaused() {
    const p = this.p;
    p.fill(255, 255, 0);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
  }

  displayGameOver(isWin) {
    const p = this.p;
    p.background(0, 0, 0, 200);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    
    if (isWin) {
      p.fill(0, 255, 0);
      p.text("VICTORY!", CANVAS_WIDTH / 2, 120);
      p.fill(255);
      p.textSize(20);
      p.text("Farm Fully Renovated!", CANVAS_WIDTH / 2, 170);
    } else {
      p.fill(255, 0, 0);
      p.text("GAME OVER", CANVAS_WIDTH / 2, 120);
      p.fill(255);
      p.textSize(20);
      p.text("The farm restoration failed.", CANVAS_WIDTH / 2, 170);
    }
    
    p.textSize(24);
    p.text(`Final Score: ${gameState.score}`, CANVAS_WIDTH / 2, 220);
    
    p.fill(255, 255, 0);
    p.textSize(18);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 280);
  }

  displayHUD() {
    const p = this.p;
    
    p.fill(0, 0, 0, 150);
    p.noStroke();
    p.rect(0, 0, CANVAS_WIDTH, 40);
    p.rect(0, CANVAS_HEIGHT - 60, CANVAS_WIDTH, 60);
    
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text(`Score: ${gameState.score}`, 10, 10);
    
    p.fill(255, 215, 0);
    p.text(`Coins: ${gameState.coins}`, 150, 10);
    
    p.fill(100, 200, 255);
    p.text(`XP: ${gameState.xp}/${gameState.level * 1000}`, 300, 10);
    
    p.fill(255, 255, 255);
    p.textAlign(p.RIGHT, p.TOP);
    p.text(`Stage: ${gameState.level}`, CANVAS_WIDTH - 10, 10);
    
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    let invX = 10;
    const invY = CANVAS_HEIGHT - 50;
    
    for (const [item, quantity] of Object.entries(gameState.inventory)) {
      if (quantity > 0) {
        p.fill(100, 70, 50);
        p.stroke(80, 50, 30);
        p.strokeWeight(2);
        p.rect(invX, invY, 40, 40);
        
        p.fill(255);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(8);
        p.text(item.substring(0, 4), invX + 20, invY + 15);
        p.textSize(10);
        p.text(quantity, invX + 20, invY + 28);
        
        invX += 45;
        if (invX > CANVAS_WIDTH - 50) break;
      }
    }
  }

  displayOrders() {
    const p = this.p;
    const startX = CANVAS_WIDTH - 180;
    const startY = 50;
    
    p.fill(139, 90, 60);
    p.stroke(100, 60, 40);
    p.strokeWeight(3);
    p.rect(startX, startY, 170, 200);
    
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(14);
    p.text("Orders", startX + 85, startY + 5);
    
    for (let i = 0; i < Math.min(gameState.orders.length, 3); i++) {
      const order = gameState.orders[i];
      const y = startY + 30 + i * 55;
      
      p.fill(255, 240, 200);
      p.rect(startX + 10, y, 150, 50);
      
      p.fill(0);
      p.textAlign(p.LEFT, p.TOP);
      p.textSize(10);
      let reqText = "";
      for (const [item, qty] of Object.entries(order.requirements)) {
        reqText += `${item}: ${qty} `;
      }
      p.text(reqText, startX + 15, y + 5);
      
      p.fill(255, 215, 0);
      p.text(`${order.coinReward} coins`, startX + 15, y + 25);
      
      const timeLeft = Math.max(0, order.timeLimit - (Date.now() - order.createdTime));
      p.fill(timeLeft < 60000 ? p.color(255, 0, 0) : p.color(0, 0, 0));
      p.text(`${Math.floor(timeLeft / 1000)}s`, startX + 120, y + 25);
      
      if (order.canFulfill()) {
        p.fill(0, 255, 0, 100);
        p.rect(startX + 10, y, 150, 50);
      }
    }
  }

  displayQuest() {
    const p = this.p;
    if (!gameState.currentQuest) return;
    
    const quest = QUEST_DATA[gameState.currentQuest];
    if (!quest) return;
    
    const x = 10;
    const y = 50;
    
    p.fill(100, 50, 150);
    p.stroke(80, 40, 120);
    p.strokeWeight(3);
    p.rect(x, y, 200, 80);
    
    p.fill(255);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    p.text(`Quest: ${quest.objective}`, x + 10, y + 10);
    
    p.textSize(10);
    let reqY = y + 30;
    for (const [item, qty] of Object.entries(quest.requirements)) {
      const current = item === 'coins' ? gameState.coins : 
                      item === 'totalValue' ? gameState.coins + Object.entries(gameState.inventory).reduce((s, [k, v]) => s + v * 5, 0) :
                      (gameState.inventory[item] || 0);
      const color = current >= qty ? p.color(0, 255, 0) : p.color(255, 255, 255);
      p.fill(color);
      p.text(`${item}: ${current}/${qty}`, x + 10, reqY);
      reqY += 15;
    }
  }

  displayPopup() {
    const p = this.p;
    if (!gameState.showPopup || !gameState.popupType) return;
    
    p.fill(0, 0, 0, 180);
    p.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    p.fill(200, 180, 150);
    p.stroke(100, 80, 60);
    p.strokeWeight(3);
    const popupW = 300;
    const popupH = 250;
    const popupX = (CANVAS_WIDTH - popupW) / 2;
    const popupY = (CANVAS_HEIGHT - popupH) / 2;
    p.rect(popupX, popupY, popupW, popupH);
    
    p.fill(0);
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(16);
    
    if (gameState.popupType === 'plant') {
      p.text("Select Seed to Plant", popupX + popupW / 2, popupY + 10);
      
      let y = popupY + 50;
      const availableCrops = Object.entries(CROP_TYPES).filter(([k, v]) => v.unlockLevel <= gameState.level);
      
      for (const [key, crop] of availableCrops) {
        p.fill(150, 120, 100);
        p.rect(popupX + 20, y, popupW - 40, 30);
        
        p.fill(255);
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(14);
        p.text(`${crop.name} (${crop.growTime}s)`, popupX + 30, y + 15);
        
        y += 35;
      }
      
      p.fill(255);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.textSize(12);
      p.text("Click to select | Press Z to cancel", popupX + popupW / 2, popupY + popupH - 10);
    } else if (gameState.popupType === 'craft') {
      const workshop = gameState.popupData;
      p.text(`${workshop.typeData.name}`, popupX + popupW / 2, popupY + 10);
      
      let y = popupY + 50;
      for (let i = 0; i < workshop.typeData.recipes.length; i++) {
        const recipe = workshop.typeData.recipes[i];
        p.fill(150, 120, 100);
        p.rect(popupX + 20, y, popupW - 40, 40);
        
        p.fill(255);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(12);
        const inputs = Array.isArray(recipe.input) ? recipe.input.join('+') : recipe.input;
        p.text(`${inputs} → ${recipe.output}`, popupX + 30, y + 5);
        p.text(`Time: ${recipe.time}s`, popupX + 30, y + 22);
        
        y += 45;
      }
      
      p.fill(255);
      p.textAlign(p.CENTER, p.BOTTOM);
      p.textSize(12);
      p.text("Click to select | Press Z to cancel", popupX + popupW / 2, popupY + popupH - 10);
    }
  }
}