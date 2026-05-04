// renderer.js
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  PHASE_START,
  PHASE_PLAYING,
  PHASE_PAUSED,
  PHASE_GAME_OVER_WIN,
  PHASE_GAME_OVER_LOSE,
  BUILDING_SIZE,
  EVAC_SIZE
} from './globals.js';

export class Renderer {
  constructor(p) {
    this.p = p;
  }
  
  render(gameState) {
    const p = this.p;
    
    switch(gameState.gamePhase) {
      case PHASE_START:
        this.renderStartScreen();
        break;
      case PHASE_PLAYING:
        this.renderGame(gameState);
        break;
      case PHASE_PAUSED:
        this.renderGame(gameState);
        this.renderPauseOverlay();
        break;
      case PHASE_GAME_OVER_WIN:
      case PHASE_GAME_OVER_LOSE:
        this.renderGameOver(gameState);
        break;
    }
  }
  
  renderStartScreen() {
    const p = this.p;
    p.background(20, 25, 30);
    
    // Title
    p.fill(220, 80, 50);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(48);
    p.text("RADIATION CITY", CANVAS_WIDTH / 2, 80);
    
    // Instructions
    p.fill(200, 200, 200);
    p.textSize(14);
    p.textAlign(p.CENTER, p.CENTER);
    
    const instructions = [
      "SURVIVE THE WASTELAND",
      "",
      "Navigate the irradiated ruins and reach the evacuation point.",
      "Scavenge buildings for supplies and manage your survival stats.",
      "Fight mutated creatures that roam the wasteland.",
      "",
      "CONTROLS:",
      "Arrow Keys - Move and turn",
      "Space - Attack",
      "Shift - Sprint (uses more hunger)",
      "Z - Use consumable (cycles through food/water/anti-rad)",
      "",
      "Keep all your stats above zero or you will die!",
      "",
      "PRESS ENTER TO START"
    ];
    
    let yPos = 140;
    for (let line of instructions) {
      p.text(line, CANVAS_WIDTH / 2, yPos);
      yPos += 20;
    }
  }
  
  renderGame(gameState) {
    const p = this.p;
    const player = gameState.player;
    
    // Sky gradient
    for (let i = 0; i < CANVAS_HEIGHT * 0.5; i++) {
      const t = i / (CANVAS_HEIGHT * 0.5);
      p.stroke(60 + t * 40, 50 + t * 40, 50 + t * 40);
      p.line(0, i, CANVAS_WIDTH, i);
    }
    
    // Ground gradient
    for (let i = CANVAS_HEIGHT * 0.5; i < CANVAS_HEIGHT; i++) {
      const t = (i - CANVAS_HEIGHT * 0.5) / (CANVAS_HEIGHT * 0.5);
      p.stroke(40 - t * 10, 35 - t * 10, 30 - t * 10);
      p.line(0, i, CANVAS_WIDTH, i);
    }
    
    // Render world from player perspective
    this.render3DView(gameState);
    
    // UI
    this.renderUI(gameState);
  }
  
  render3DView(gameState) {
    const p = this.p;
    const player = gameState.player;
    
    // Create array of renderable objects with distance
    const renderables = [];
    
    // Add buildings
    for (let building of gameState.buildings) {
      const dx = building.x - player.x;
      const dy = building.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 800) {
        renderables.push({
          type: 'building',
          obj: building,
          dist: dist,
          angle: Math.atan2(dy, dx)
        });
      }
    }
    
    // Add enemies
    for (let enemy of gameState.enemies) {
      if (enemy.dead) continue;
      
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 800) {
        renderables.push({
          type: 'enemy',
          obj: enemy,
          dist: dist,
          angle: Math.atan2(dy, dx)
        });
      }
    }
    
    // Add evacuation point
    const evac = gameState.evacuationPoint;
    const edx = evac.x - player.x;
    const edy = evac.y - player.y;
    const edist = Math.sqrt(edx * edx + edy * edy);
    
    if (edist < 1000) {
      renderables.push({
        type: 'evac',
        obj: evac,
        dist: edist,
        angle: Math.atan2(edy, edx)
      });
    }
    
    // Sort by distance (far to near)
    renderables.sort((a, b) => b.dist - a.dist);
    
    // Render each object
    for (let r of renderables) {
      const relAngle = r.angle - player.angle;
      let normAngle = relAngle;
      
      // Normalize angle to -PI to PI
      while (normAngle > Math.PI) normAngle -= Math.PI * 2;
      while (normAngle < -Math.PI) normAngle += Math.PI * 2;
      
      // Check if in view frustum
      if (Math.abs(normAngle) < Math.PI / 3) {
        const screenX = CANVAS_WIDTH / 2 + normAngle * (CANVAS_WIDTH / 2);
        const scale = 1000 / r.dist;
        
        if (r.type === 'building') {
          this.renderBuilding(r.obj, screenX, scale);
        } else if (r.type === 'enemy') {
          this.renderEnemy(r.obj, screenX, scale);
        } else if (r.type === 'evac') {
          this.renderEvacPoint(r.obj, screenX, scale);
        }
      }
    }
    
    // Weapon/attack indicator
    if (player.attacking) {
      p.push();
      p.stroke(255, 100, 100);
      p.strokeWeight(3);
      p.noFill();
      p.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
      p.line(0, 0, 30, -30);
      p.line(0, 0, -30, -30);
      p.pop();
    }
  }
  
  renderBuilding(building, screenX, scale) {
    const p = this.p;
    const size = BUILDING_SIZE * scale;
    const screenY = CANVAS_HEIGHT / 2;
    
    p.push();
    
    // Building color based on type and state
    if (building.scavenged) {
      p.fill(60, 60, 60);
    } else {
      if (building.type === 0) {
        p.fill(80, 90, 100);
      } else if (building.type === 1) {
        p.fill(100, 80, 70);
      } else {
        p.fill(70, 80, 90);
      }
    }
    
    p.stroke(40);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(screenX, screenY, size, size * 1.2);
    
    // Windows
    if (!building.scavenged) {
      p.fill(200, 200, 100, 100);
      const windowSize = size * 0.15;
      p.rect(screenX - size * 0.25, screenY - size * 0.3, windowSize, windowSize);
      p.rect(screenX + size * 0.25, screenY - size * 0.3, windowSize, windowSize);
    }
    
    p.pop();
  }
  
  renderEnemy(enemy, screenX, scale) {
    const p = this.p;
    const size = 40 * scale;
    const screenY = CANVAS_HEIGHT / 2 + 20;
    
    p.push();
    
    // Body
    p.fill(100, 150, 100);
    p.stroke(50, 100, 50);
    p.strokeWeight(2);
    p.ellipse(screenX, screenY, size, size * 1.3);
    
    // Eyes
    p.fill(255, 50, 50);
    p.noStroke();
    p.ellipse(screenX - size * 0.2, screenY - size * 0.2, size * 0.2, size * 0.2);
    p.ellipse(screenX + size * 0.2, screenY - size * 0.2, size * 0.2, size * 0.2);
    
    // Health bar
    const barWidth = size * 1.2;
    const barHeight = 4;
    const healthPercent = enemy.health / 50;
    
    p.fill(200, 50, 50);
    p.rect(screenX - barWidth / 2, screenY - size * 0.8, barWidth, barHeight);
    p.fill(50, 200, 50);
    p.rect(screenX - barWidth / 2, screenY - size * 0.8, barWidth * healthPercent, barHeight);
    
    p.pop();
  }
  
  renderEvacPoint(evac, screenX, scale) {
    const p = this.p;
    const size = EVAC_SIZE * scale;
    const screenY = CANVAS_HEIGHT / 2;
    
    p.push();
    
    // Pulsing glow effect
    const pulse = 0.8 + Math.sin(p.frameCount * 0.1) * 0.2;
    
    p.fill(50, 255, 100, 100 * pulse);
    p.noStroke();
    p.ellipse(screenX, screenY, size * 2, size * 2);
    
    p.fill(100, 255, 150);
    p.stroke(50, 200, 100);
    p.strokeWeight(3);
    p.rectMode(p.CENTER);
    p.rect(screenX, screenY, size, size);
    
    // "EVAC" text
    p.fill(255);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(size * 0.3);
    p.text("EVAC", screenX, screenY);
    
    p.pop();
  }
  
  renderUI(gameState) {
    const p = this.p;
    const player = gameState.player;
    
    // Stats panel
    const panelX = 10;
    const panelY = 10;
    const panelWidth = 180;
    const barHeight = 20;
    const spacing = 25;
    
    p.push();
    
    // Background
    p.fill(0, 0, 0, 180);
    p.noStroke();
    p.rect(panelX, panelY, panelWidth, 110);
    
    // Health bar
    this.drawBar(panelX + 5, panelY + 5, panelWidth - 10, barHeight, 
                  player.health, 100, [200, 50, 50], "HEALTH");
    
    // Hunger bar
    this.drawBar(panelX + 5, panelY + 5 + spacing, panelWidth - 10, barHeight,
                  player.hunger, 100, [255, 180, 50], "HUNGER");
    
    // Thirst bar
    this.drawBar(panelX + 5, panelY + 5 + spacing * 2, panelWidth - 10, barHeight,
                  player.thirst, 100, [100, 180, 255], "THIRST");
    
    // Radiation bar
    this.drawBar(panelX + 5, panelY + 5 + spacing * 3, panelWidth - 10, barHeight,
                  player.radiation, 100, [50, 255, 50], "RAD", true);
    
    p.pop();
    
    // Inventory panel
    const invX = CANVAS_WIDTH - 190;
    const invY = 10;
    
    p.push();
    p.fill(0, 0, 0, 180);
    p.noStroke();
    p.rect(invX, invY, 180, 90);
    
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(12);
    
    const consumables = ['food', 'water', 'antirad'];
    const symbols = ['🍖', '💧', '💊'];
    let yPos = invY + 5;
    
    p.text("INVENTORY (Z to use):", invX + 5, yPos);
    yPos += 18;
    
    for (let i = 0; i < consumables.length; i++) {
      const type = consumables[i];
      const selected = player.currentConsumable === i;
      
      p.fill(selected ? [255, 255, 100] : [200, 200, 200]);
      p.text(`${symbols[i]} ${type.toUpperCase()}: ${player.inventory[type]}`, 
             invX + 5, yPos);
      yPos += 16;
    }
    
    p.fill(180);
    p.text(`Scrap: ${player.inventory.scrap}`, invX + 5, yPos);
    
    p.pop();
    
    // Compass/Direction indicator
    const compassX = CANVAS_WIDTH / 2;
    const compassY = 30;
    
    p.push();
    p.translate(compassX, compassY);
    
    // Direction to evacuation
    const evac = gameState.evacuationPoint;
    const dx = evac.x - player.x;
    const dy = evac.y - player.y;
    const dirAngle = Math.atan2(dy, dx) - player.angle;
    
    p.rotate(dirAngle);
    p.fill(100, 255, 150);
    p.noStroke();
    p.triangle(0, -15, -8, 5, 8, 5);
    
    p.pop();
    
    // Distance to evac
    const dist = Math.sqrt(dx * dx + dy * dy);
    p.fill(100, 255, 150);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(12);
    p.text(`EVAC: ${Math.floor(dist)}m`, compassX, compassY + 20);
  }
  
  drawBar(x, y, width, height, value, maxValue, color, label, invert = false) {
    const p = this.p;
    const percent = Math.max(0, Math.min(1, value / maxValue));
    
    // Background
    p.fill(40, 40, 40);
    p.noStroke();
    p.rect(x, y, width, height);
    
    // Bar
    const barColor = invert ? 
      (percent > 0.7 ? [255, 100, 100] : percent > 0.4 ? [255, 200, 100] : color) :
      (percent < 0.3 ? [255, 100, 100] : percent < 0.6 ? [255, 200, 100] : color);
    
    p.fill(...barColor);
    p.rect(x, y, width * percent, height);
    
    // Label
    p.fill(255);
    p.textAlign(p.LEFT, p.CENTER);
    p.textSize(11);
    p.text(label, x + 3, y + height / 2);
    
    // Value
    p.textAlign(p.RIGHT, p.CENTER);
    p.text(Math.floor(value), x + width - 3, y + height / 2);
  }
  
  renderPauseOverlay() {
    const p = this.p;
    p.push();
    p.fill(255);
    p.textAlign(p.RIGHT, p.TOP);
    p.textSize(16);
    p.text("PAUSED", CANVAS_WIDTH - 10, 10);
    p.pop();
  }
  
  renderGameOver(gameState) {
    const p = this.p;
    p.background(20, 25, 30);
    
    const isWin = gameState.gamePhase === PHASE_GAME_OVER_WIN;
    
    // Title
    p.fill(isWin ? [100, 255, 100] : [255, 100, 100]);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(56);
    p.text(isWin ? "EVACUATED!" : "GAME OVER", CANVAS_WIDTH / 2, 100);
    
    // Message
    p.fill(200);
    p.textSize(18);
    
    if (isWin) {
      p.text("You successfully reached the evacuation point!", CANVAS_WIDTH / 2, 160);
      p.text("You survived the radiation zone!", CANVAS_WIDTH / 2, 190);
    } else {
      p.text("You succumbed to the wasteland...", CANVAS_WIDTH / 2, 160);
      
      const player = gameState.player;
      if (player.health <= 0) {
        p.text("Cause: Health depleted", CANVAS_WIDTH / 2, 190);
      } else if (player.hunger <= 0) {
        p.text("Cause: Starvation", CANVAS_WIDTH / 2, 190);
      } else if (player.thirst <= 0) {
        p.text("Cause: Dehydration", CANVAS_WIDTH / 2, 190);
      } else if (player.radiation >= 100) {
        p.text("Cause: Radiation poisoning", CANVAS_WIDTH / 2, 190);
      }
    }
    
    // Stats
    p.fill(180);
    p.textSize(16);
    const player = gameState.player;
    p.text(`Buildings Scavenged: ${gameState.buildingsScavenged}`, CANVAS_WIDTH / 2, 240);
    p.text(`Enemies Defeated: ${gameState.enemiesDefeated}`, CANVAS_WIDTH / 2, 265);
    p.text(`Scrap Collected: ${player.inventory.scrap}`, CANVAS_WIDTH / 2, 290);
    
    // Restart prompt
    p.fill(255, 255, 100);
    p.textSize(20);
    p.text("PRESS R TO RESTART", CANVAS_WIDTH / 2, 350);
  }
}